import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-recall-signature",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Classification {
  signalType: string;
  priority: string;
  summary: string;
  actionsTaken: string[];
}

interface TranscriptTurn {
  speaker: string;
  text: string;
  timestamp?: string;
}

// ─── AI: Classify meeting transcript ────────────────────────────────────────

async function classifyMeetingSignal(
  transcript: TranscriptTurn[],
  meetingTitle: string,
  attendees: string[],
  apiKey: string
): Promise<Classification> {
  const systemPrompt = `You are a signal classifier for an executive intelligence system called Vanta Wireless.
You receive meeting transcripts from Zoom meetings and must classify the overall meeting signal.

Return ONLY valid JSON with these fields:
- signalType: one of "MEETING", "INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT"
  Default to "MEETING" unless the entire meeting is clearly about one specific category.
- priority: one of "high", "medium", "low"
  High = contains decisions, commitments, or investment-related discussion.
  Medium = contains frameworks, insights, or action items.
  Low = general context or routine check-in.
- summary: A 2-4 sentence intelligence briefing of the meeting's key signals. Mention specific speakers when attributing insights. Write in third person, professional tone.
- actionsTaken: array of action codes. Choose from: "FRAMEWORK_EXTRACT", "NOTION_LOG", "THESIS_ANALYSIS", "BRIEF_COMPILE", "MEETING_PREP", "BIO_RESEARCH", "CALENDAR_HOLD"

Additional meeting-specific classification rules:
- Look for: decisions made, action items committed, frameworks articulated, investment angles, positioning language, and open questions.
- Always include "NOTION_LOG" in actionsTaken.
- If decisions were made, include "BRIEF_COMPILE".
- If investment was discussed, include "THESIS_ANALYSIS".`;

  const condensedTranscript = transcript
    .map((t) => `[${t.speaker}${t.timestamp ? ` @ ${t.timestamp}` : ""}]: ${t.text}`)
    .join("\n");

  // Truncate to ~8000 chars to stay within token limits
  const truncated = condensedTranscript.length > 8000
    ? condensedTranscript.slice(0, 8000) + "\n[…transcript truncated]"
    : condensedTranscript;

  const userContent = `Meeting Title: ${meetingTitle}\nAttendees: ${attendees.join(", ")}\n\nTranscript:\n${truncated}`;

  try {
    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.error("AI classification failed:", await res.text());
      return {
        signalType: "MEETING",
        priority: "medium",
        summary: `Meeting "${meetingTitle}" with ${attendees.length} participants. Auto-classification failed.`,
        actionsTaken: ["NOTION_LOG"],
      };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
  } catch (err) {
    console.error("Classification error:", err);
    return {
      signalType: "MEETING",
      priority: "medium",
      summary: `Meeting "${meetingTitle}" with ${attendees.length} participants.`,
      actionsTaken: ["NOTION_LOG"],
    };
  }
}

// ─── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    console.log("Recall webhook received:", payload.event || payload.status || "unknown");

    // Recall.ai sends various events — we care about transcript.ready or bot.done
    const eventType = payload.event || payload.status;
    if (!["transcript.ready", "bot.done", "bot.transcription_complete"].includes(eventType)) {
      console.log("Skipping non-transcript event:", eventType);
      return new Response(JSON.stringify({ skipped: true, reason: `Event type: ${eventType}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // ── Parse Recall.ai payload ──
    const botData = payload.data || payload;
    const meetingId = botData.meeting_id || botData.bot_id || botData.id || null;
    const meetingTitle = botData.meeting_title || botData.title || "Untitled Meeting";

    // Extract transcript
    const rawTranscript: TranscriptTurn[] = [];
    const transcriptData = botData.transcript || botData.transcription || [];

    if (Array.isArray(transcriptData)) {
      for (const entry of transcriptData) {
        // Recall.ai transcript format: { speaker, words: [{ text, start_time, end_time }] }
        if (entry.words && Array.isArray(entry.words)) {
          const text = entry.words.map((w: Record<string, unknown>) => w.text).join(" ");
          rawTranscript.push({
            speaker: entry.speaker || "Unknown",
            text,
            timestamp: entry.words[0]?.start_time
              ? `${Math.floor(Number(entry.words[0].start_time) / 60)}:${String(Math.floor(Number(entry.words[0].start_time) % 60)).padStart(2, "0")}`
              : undefined,
          });
        } else if (entry.text || entry.content) {
          rawTranscript.push({
            speaker: entry.speaker || entry.participant || "Unknown",
            text: entry.text || entry.content || "",
            timestamp: entry.timestamp || undefined,
          });
        }
      }
    }

    // Extract attendees
    const attendeesRaw = botData.participants || botData.attendees || [];
    const attendees: Record<string, unknown>[] = Array.isArray(attendeesRaw)
      ? attendeesRaw.map((a: Record<string, unknown>) => ({
          name: a.name || a.display_name || a.participant_name || "Unknown",
          email: a.email || null,
        }))
      : [];
    const attendeeNames = attendees.map((a) => String(a.name));

    // Deduplication by meeting_id
    if (meetingId) {
      const { data: existing } = await supabase
        .from("signals")
        .select("id")
        .eq("meeting_id", meetingId)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log("Duplicate meeting, skipping:", meetingId);
        return new Response(JSON.stringify({ skipped: true, reason: "duplicate meeting" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Build source message from transcript (first ~500 chars for the signal card)
    const sourceMessage = rawTranscript
      .map((t) => `${t.speaker}: ${t.text}`)
      .join("\n")
      .slice(0, 500);

    // Classify
    const classification = await classifyMeetingSignal(
      rawTranscript,
      meetingTitle,
      attendeeNames,
      lovableApiKey
    );

    // Insert signal
    const { data: signalData, error: signalError } = await supabase
      .from("signals")
      .insert({
        sender: meetingTitle,
        source_message: sourceMessage || `Meeting: ${meetingTitle}`,
        signal_type: classification.signalType,
        priority: classification.priority,
        summary: classification.summary,
        actions_taken: classification.actionsTaken,
        status: "Captured",
        source: "recall",
        meeting_id: meetingId,
        raw_payload: payload,
        captured_at: botData.ended_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (signalError) {
      console.error("Signal insert error:", signalError);
      return new Response(JSON.stringify({ error: signalError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Meeting signal created:", signalData.id, classification.signalType);

    // Insert meeting artifact
    const summaryText = botData.summary || botData.meeting_summary || null;
    const recordingUrl = botData.recording_url || botData.video_url || botData.media?.video?.url || null;

    const { error: artifactError } = await supabase.from("meeting_artifacts").insert({
      signal_id: signalData.id,
      transcript_json: rawTranscript,
      summary_text: summaryText,
      recording_url: recordingUrl,
      attendees: attendees,
    });

    if (artifactError) {
      console.error("Artifact insert error:", artifactError);
      // Non-fatal — signal was already captured
    }

    return new Response(
      JSON.stringify({
        success: true,
        signalId: signalData.id,
        signalType: classification.signalType,
        priority: classification.priority,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("recall-webhook error:", err);
    const { logError } = await import("../_shared/log-error.ts");
    await logError("recall-webhook", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
