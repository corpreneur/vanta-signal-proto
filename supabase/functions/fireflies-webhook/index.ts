import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-fireflies-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TranscriptTurn {
  speaker: string;
  text: string;
  timestamp?: string;
}

interface Classification {
  signalType: string;
  priority: string;
  summary: string;
  actionsTaken: string[];
  confidence?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

// ─── Verify Fireflies webhook secret ────────────────────────────────────────

function verifyWebhookSecret(req: Request, expectedSecret: string): boolean {
  // Fireflies sends the webhook secret in the x-fireflies-secret header
  // or as a query param ?secret=...
  const headerSecret = req.headers.get("x-fireflies-secret");
  if (headerSecret === expectedSecret) return true;

  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret === expectedSecret) return true;

  // Also check Authorization bearer
  const authHeader = req.headers.get("authorization");
  if (authHeader?.replace("Bearer ", "") === expectedSecret) return true;

  return false;
}

// ─── Normalise Fireflies payload ────────────────────────────────────────────

function normaliseFireflies(payload: Record<string, unknown>): {
  meetingId: string | null;
  meetingTitle: string;
  attendees: { name: string; email: string | null }[];
  transcript: TranscriptTurn[];
  summaryText: string | null;
  recordingUrl: string | null;
  endedAt: string;
} {
  // Fireflies wraps meeting data in a `data` or `meeting` object
  const d = (payload.data || payload.meeting || payload) as Record<string, unknown>;

  const meetingId = (d.fireflies_meeting_id || d.meeting_id || d.id || null) as string | null;
  const meetingTitle = (d.title || d.meeting_title || d.topic || "Fireflies Meeting") as string;

  // Fireflies `sentences` array: { speaker_name, text, start_time, end_time, raw_text }
  const sentences = (d.sentences || d.transcript || []) as Record<string, unknown>[];
  const transcript: TranscriptTurn[] = sentences.map((s) => ({
    speaker: (s.speaker_name || s.speaker || s.attendee_name || "Unknown") as string,
    text: (s.text || s.raw_text || s.content || "") as string,
    timestamp: s.start_time != null ? formatSeconds(Number(s.start_time)) : undefined,
  }));

  const attendeesRaw = (d.attendees || d.participants || d.organizer_email ? [{ email: d.organizer_email }] : []) as Record<string, unknown>[];
  const attendees = Array.isArray(attendeesRaw)
    ? attendeesRaw.map((a) => ({
        name: (a.name || a.displayName || a.display_name || "Unknown") as string,
        email: (a.email || null) as string | null,
      }))
    : [];

  return {
    meetingId,
    meetingTitle,
    attendees,
    transcript,
    summaryText: (d.summary || d.meeting_summary || d.overview || null) as string | null,
    recordingUrl: (d.audio_url || d.video_url || d.recording_url || null) as string | null,
    endedAt: (d.ended_at || d.date || d.dateString || new Date().toISOString()) as string,
  };
}

// ─── AI classification ──────────────────────────────────────────────────────

async function classifyMeetingSignal(
  transcript: TranscriptTurn[],
  meetingTitle: string,
  attendeeNames: string[],
  apiKey: string
): Promise<Classification> {
  const systemPrompt = `You are a signal classifier for an executive intelligence system called Vanta Signal.
You receive meeting transcripts from Fireflies.ai and must classify the overall meeting signal.

Return ONLY valid JSON with these fields:
- signalType: one of "MEETING", "INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT"
  Default to "MEETING" unless the entire meeting is clearly about one specific category.
- priority: one of "high", "medium", "low"
  High = contains decisions, commitments, or investment-related discussion.
  Medium = contains frameworks, insights, or action items.
  Low = general context or routine check-in.
- summary: A 2-4 sentence intelligence briefing of the meeting's key signals. Write in third person, professional tone.
- actionsTaken: array of action codes. Choose from: "FRAMEWORK_EXTRACT", "NOTION_LOG", "THESIS_ANALYSIS", "BRIEF_COMPILE", "MEETING_PREP", "BIO_RESEARCH", "CALENDAR_HOLD"
- confidence: a number from 0.0 to 1.0 indicating classification certainty.

Rules:
- Always include "NOTION_LOG" in actionsTaken.
- If decisions were made, include "BRIEF_COMPILE".
- If investment was discussed, include "THESIS_ANALYSIS".`;

  const condensed = transcript
    .map((t) => `[${t.speaker}${t.timestamp ? ` @ ${t.timestamp}` : ""}]: ${t.text}`)
    .join("\n");

  const truncated = condensed.length > 8000
    ? condensed.slice(0, 8000) + "\n[…transcript truncated]"
    : condensed;

  try {
    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Meeting Title: ${meetingTitle}\nAttendees: ${attendeeNames.join(", ")}\n\nTranscript:\n${truncated}` },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.error("AI classification failed:", await res.text());
      return { signalType: "MEETING", priority: "medium", summary: `Fireflies meeting "${meetingTitle}". Auto-classification failed.`, actionsTaken: ["NOTION_LOG"], confidence: 0.0 };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
  } catch (err) {
    console.error("Classification error:", err);
    return { signalType: "MEETING", priority: "medium", summary: `Fireflies meeting "${meetingTitle}".`, actionsTaken: ["NOTION_LOG"], confidence: 0.0 };
  }
}

// ─── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody) as Record<string, unknown>;

    // ── Verify webhook secret ──
    const webhookSecret = Deno.env.get("FIREFLIES_WEBHOOK_SECRET");
    if (webhookSecret) {
      if (!verifyWebhookSecret(req, webhookSecret)) {
        console.warn("fireflies-webhook: invalid or missing webhook secret");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Event filtering: only process transcription_completed ──
    const eventType = (payload.event || payload.eventType || payload.type || "") as string;
    const ALLOWED_EVENTS = [
      "transcription_completed",
      "Transcription completed",
      "transcription.completed",
      "transcript_ready",
      "", // allow payloads without an explicit event type (direct API push)
    ];

    if (eventType && !ALLOWED_EVENTS.includes(eventType)) {
      console.log(`fireflies-webhook: skipping event type "${eventType}"`);
      return new Response(
        JSON.stringify({ skipped: true, reason: `Event type: ${eventType}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`fireflies-webhook: processing event="${eventType || "direct"}"`);

    // ── Normalise ──
    const normalised = normaliseFireflies(payload);

    if (normalised.transcript.length === 0) {
      console.warn("fireflies-webhook: empty transcript, skipping");
      return new Response(
        JSON.stringify({ skipped: true, reason: "empty transcript" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // ── Dedup ──
    if (normalised.meetingId) {
      const { data: existing } = await supabase
        .from("signals")
        .select("id")
        .eq("meeting_id", normalised.meetingId)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log("fireflies-webhook: duplicate meeting, skipping:", normalised.meetingId);
        return new Response(
          JSON.stringify({ skipped: true, reason: "duplicate meeting", meetingId: normalised.meetingId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Classify ──
    const attendeeNames = normalised.attendees.map((a) => a.name);
    const classification = await classifyMeetingSignal(
      normalised.transcript,
      normalised.meetingTitle,
      attendeeNames,
      lovableApiKey
    );

    // ── Source message preview ──
    const sourceMessage = normalised.transcript
      .map((t) => `${t.speaker}: ${t.text}`)
      .join("\n")
      .slice(0, 500) || `Fireflies Meeting: ${normalised.meetingTitle}`;

    // ── Insert signal ──
    const { data: signalData, error: signalError } = await supabase
      .from("signals")
      .insert({
        sender: normalised.meetingTitle,
        source_message: sourceMessage,
        signal_type: classification.signalType,
        priority: classification.priority,
        summary: classification.summary,
        actions_taken: classification.actionsTaken,
        status: "Captured",
        source: "recall",
        meeting_id: normalised.meetingId,
        raw_payload: payload,
        captured_at: normalised.endedAt,
        confidence_score: typeof classification.confidence === "number" ? classification.confidence : null,
        classification_reasoning: "Source: fireflies",
      })
      .select()
      .single();

    if (signalError) {
      console.error("fireflies-webhook: signal insert error:", signalError);
      return new Response(JSON.stringify({ error: signalError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`fireflies-webhook: signal created ${signalData.id} [${classification.signalType}]`);

    // ── Insert meeting artifact ──
    const { error: artifactError } = await supabase.from("meeting_artifacts").insert({
      signal_id: signalData.id,
      transcript_json: normalised.transcript,
      summary_text: normalised.summaryText,
      recording_url: normalised.recordingUrl,
      attendees: normalised.attendees,
    });

    if (artifactError) {
      console.error("fireflies-webhook: artifact insert error (non-fatal):", artifactError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: "fireflies",
        signalId: signalData.id,
        signalType: classification.signalType,
        priority: classification.priority,
        attendeeCount: normalised.attendees.length,
        transcriptTurns: normalised.transcript.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fireflies-webhook error:", err);
    const { logError } = await import("../_shared/log-error.ts");
    await logError("fireflies-webhook", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
