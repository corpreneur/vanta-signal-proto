import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.99.1/cors";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const eventType = payload.event || payload.type;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("RTMS webhook event:", eventType);

    switch (eventType) {
      case "meeting.rtms.started": {
        const meetingId = payload.payload?.meeting_id || payload.meeting_id;
        if (meetingId) {
          await supabase
            .from("upcoming_meetings")
            .update({ rtms_status: "streaming" })
            .eq("zoom_meeting_id", String(meetingId));
        }
        break;
      }

      case "meeting.rtms.stopped":
      case "meeting.ended": {
        const meetingId = payload.payload?.meeting_id || payload.meeting_id;
        if (meetingId) {
          await supabase
            .from("upcoming_meetings")
            .update({ rtms_status: "completed" })
            .eq("zoom_meeting_id", String(meetingId));
        }
        break;
      }

      case "transcript": {
        // Buffer transcript chunks and classify when enough accumulate
        const chunk = payload.payload || payload;
        const meetingId = chunk.meeting_id;
        const text = chunk.text || chunk.transcript || "";
        const speaker = chunk.speaker_name || chunk.speaker || "Unknown";
        const timestamp = chunk.timestamp || new Date().toISOString();

        if (text && meetingId) {
          // Store as a signal for now; a future iteration will buffer and batch-classify
          const { error } = await supabase.from("signals").insert({
            sender: speaker,
            summary: text.slice(0, 200),
            source_message: text,
            source: "recall",
            signal_type: "MEETING",
            priority: "medium",
            meeting_id: String(meetingId),
            captured_at: timestamp,
            raw_payload: chunk,
          });

          if (error) {
            console.error("Failed to store RTMS transcript chunk:", error);
          }
        }
        break;
      }

      default:
        console.log("Unhandled RTMS event:", eventType);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("rtms-webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
