import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signal_id } = await req.json();
    if (!signal_id) {
      return new Response(JSON.stringify({ error: "signal_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Fetch signal + artifact
    const { data: signal, error: sigErr } = await supabase
      .from("signals")
      .select("*")
      .eq("id", signal_id)
      .single();

    if (sigErr || !signal) {
      return new Response(JSON.stringify({ error: "Signal not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: artifact } = await supabase
      .from("meeting_artifacts")
      .select("*")
      .eq("signal_id", signal_id)
      .maybeSingle();

    // Build digest content
    const attendees = (artifact?.attendees as { name: string; email: string | null }[] | null) ?? [];
    const attendeeNames = attendees.map((a) => a.name).join(", ");

    const transcript = artifact?.transcript_json
      ? (artifact.transcript_json as { speaker: string; text: string }[])
          .map((t) => `[${t.speaker}]: ${t.text}`)
          .join("\n")
          .slice(0, 4000)
      : "";

    // Generate polished summary via AI
    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional executive assistant. Generate a concise, well-formatted meeting summary email. Include:
1. Meeting title and date
2. Key attendees
3. Top 3-5 takeaways (bullet points)
4. Action items with owners
5. Next steps

Keep it under 300 words. Professional tone. Use plain text formatting.`,
          },
          {
            role: "user",
            content: `Meeting: ${signal.summary}\nDate: ${signal.captured_at}\nAttendees: ${attendeeNames}\nAI Summary: ${artifact?.summary_text || "N/A"}\n\nTranscript excerpt:\n${transcript}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    let emailBody: string;
    if (res.ok) {
      const data = await res.json();
      emailBody = data.choices?.[0]?.message?.content ?? signal.summary;
    } else {
      // Fallback
      emailBody = `Meeting Summary: ${signal.summary}\n\nAttendees: ${attendeeNames}\n\n${artifact?.summary_text || signal.source_message}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        subject: `Meeting Notes: ${signal.summary}`,
        body: emailBody,
        attendees: attendees.filter((a) => a.email).map((a) => ({ name: a.name, email: a.email })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("meeting-summary-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
