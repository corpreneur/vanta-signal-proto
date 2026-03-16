import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-vanta-signature",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PhoneClassification {
  signalType: "PHONE_CALL";
  priority: "high" | "medium" | "low";
  summary: string;
  tags: string[];       // phone-specific tags
  actionsTaken: string[];
  confidence: number;
}

// ─── AI: Classify phone call transcript ────────────────────────────────────

async function classifyPhoneCall(
  transcript: string,
  caller: string,
  callee: string,
  durationSec: number,
  apiKey: string
): Promise<PhoneClassification> {
  const systemPrompt = `You are a signal classifier for Vanta Wireless — an executive intelligence system for creative entrepreneurs.

You receive phone call transcripts captured at the network level via Vanta's MVNO infrastructure. The user made or received this call from their native dialer — no app involved.

Classify the call and extract phone-specific signal tags.

Return ONLY valid JSON with these fields:
- signalType: always "PHONE_CALL"
- priority: "high" | "medium" | "low"
  high = contains commitments, decisions, deal terms, or relationship-critical moments
  medium = contains open questions, frameworks, or action-worthy insights
  low = routine check-in, informational, no actionable content
- summary: 2-4 sentence intelligence briefing. Mention speakers by name. Write in third person, professional tone. Focus on what was decided, promised, or left unresolved.
- tags: array of applicable phone-specific tags. Choose from:
  "commitment" — a promise made or received, explicit or implied
  "decision" — a choice made or agreed upon
  "open_question" — an unresolved question requiring follow-up
  "relationship_signal" — data about the nature/health of the relationship (tone, trust, urgency, access)
  "deal_signal" — language, terms, or indicators relevant to a commercial outcome
  Include ALL that apply. An empty array means no notable signals (classify as low priority).
- actionsTaken: array of action codes. Choose from: "NOTION_LOG", "COMMITMENT_TRACK", "FOLLOW_UP_QUEUE", "RELATIONSHIP_UPDATE", "DEAL_PIPELINE_UPDATE", "BRIEF_COMPILE"
  Always include "NOTION_LOG".
  If commitment detected, include "COMMITMENT_TRACK".
  If open_question detected, include "FOLLOW_UP_QUEUE".
  If deal_signal detected, include "DEAL_PIPELINE_UPDATE".`;

  const truncated = transcript.length > 8000
    ? transcript.slice(0, 8000) + "\n[…transcript truncated]"
    : transcript;

  const userContent = `Caller: ${caller}\nCallee: ${callee}\nDuration: ${Math.floor(durationSec / 60)}m ${durationSec % 60}s\n\nTranscript:\n${truncated}`;

  try {
    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.15,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("AI classification failed:", res.status, errText);
      return fallback(caller, callee, durationSec);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());

    // Validate and sanitize
    const validTags = ["commitment", "decision", "open_question", "relationship_signal", "deal_signal"];
    return {
      signalType: "PHONE_CALL",
      priority: ["high", "medium", "low"].includes(parsed.priority) ? parsed.priority : "medium",
      summary: parsed.summary || `Call between ${caller} and ${callee}.`,
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t: string) => validTags.includes(t)) : [],
      actionsTaken: Array.isArray(parsed.actionsTaken) ? parsed.actionsTaken : ["NOTION_LOG"],
    };
  } catch (err) {
    console.error("Classification error:", err);
    return fallback(caller, callee, durationSec);
  }
}

function fallback(caller: string, callee: string, durationSec: number): PhoneClassification {
  return {
    signalType: "PHONE_CALL",
    priority: durationSec > 300 ? "medium" : "low",
    summary: `Phone call between ${caller} and ${callee} (${Math.floor(durationSec / 60)}m). Auto-classification unavailable.`,
    tags: [],
    actionsTaken: ["NOTION_LOG"],
  };
}

// ─── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    console.log("Phone call webhook received:", payload.event_type || "cdr_complete");

    // ── Validate required fields ──
    // Expected CDR payload shape:
    // {
    //   event_type: "cdr_complete" | "call_ended",
    //   call_id: string,
    //   caller_number: string,
    //   callee_number: string,
    //   caller_name?: string,
    //   callee_name?: string,
    //   duration_seconds: number,
    //   started_at: string (ISO),
    //   ended_at: string (ISO),
    //   transcript?: string,          // plain text transcript with speaker labels
    //   transcript_segments?: Array<{ speaker: string, text: string, start: number }>,
    //   recording_url?: string,
    // }

    const callId = payload.call_id || payload.id;
    if (!callId) {
      return new Response(
        JSON.stringify({ error: "Missing call_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerName = payload.caller_name || payload.caller_number || "Unknown Caller";
    const calleeName = payload.callee_name || payload.callee_number || "Unknown Callee";
    const durationSec = payload.duration_seconds || 0;
    const startedAt = payload.started_at || payload.ended_at || new Date().toISOString();

    // Build transcript text
    let transcriptText = "";
    if (payload.transcript && typeof payload.transcript === "string") {
      transcriptText = payload.transcript;
    } else if (Array.isArray(payload.transcript_segments)) {
      transcriptText = payload.transcript_segments
        .map((s: { speaker: string; text: string }) => `${s.speaker}: ${s.text}`)
        .join("\n");
    }

    // Skip very short calls with no transcript (likely missed/declined)
    if (durationSec < 10 && !transcriptText) {
      console.log("Skipping short call with no transcript:", callId);
      return new Response(
        JSON.stringify({ skipped: true, reason: "short_no_transcript" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // ── Deduplication by call_id stored in meeting_id field ──
    const { data: existing } = await supabase
      .from("signals")
      .select("id")
      .eq("meeting_id", callId)
      .eq("signal_type", "PHONE_CALL")
      .limit(1);

    if (existing && existing.length > 0) {
      console.log("Duplicate call, skipping:", callId);
      return new Response(
        JSON.stringify({ skipped: true, reason: "duplicate_call" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Classify ──
    const classification = transcriptText
      ? await classifyPhoneCall(transcriptText, callerName, calleeName, durationSec, lovableApiKey)
      : fallback(callerName, calleeName, durationSec);

    // Merge phone tags into actionsTaken for the signal card to render
    const actionsTaken = [
      ...classification.actionsTaken,
      ...classification.tags, // phone-specific tags stored alongside action codes
    ];

    // Build source message (first ~500 chars of transcript for the card)
    const sourceMessage = transcriptText
      ? transcriptText.slice(0, 500)
      : `Phone call: ${callerName} ↔ ${calleeName} · ${Math.floor(durationSec / 60)}m`;

    // ── Insert signal ──
    const { data: signalData, error: signalError } = await supabase
      .from("signals")
      .insert({
        sender: callerName,
        source_message: sourceMessage,
        signal_type: "PHONE_CALL",
        priority: classification.priority,
        summary: classification.summary,
        actions_taken: actionsTaken,
        status: "Captured",
        source: "phone",
        meeting_id: callId,
        raw_payload: payload,
        captured_at: startedAt,
      })
      .select()
      .single();

    if (signalError) {
      console.error("Signal insert error:", signalError);
      return new Response(
        JSON.stringify({ error: signalError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Phone signal created:", signalData.id, "tags:", classification.tags, "priority:", classification.priority);

    // ── Insert meeting artifact for transcript storage ──
    if (transcriptText) {
      const transcriptJson = payload.transcript_segments || [{ speaker: "full", text: transcriptText }];
      const { error: artifactError } = await supabase.from("meeting_artifacts").insert({
        signal_id: signalData.id,
        transcript_json: transcriptJson,
        summary_text: classification.summary,
        recording_url: payload.recording_url || null,
        attendees: [
          { name: callerName, role: "caller" },
          { name: calleeName, role: "callee" },
        ],
      });

      if (artifactError) {
        console.error("Artifact insert error:", artifactError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        signalId: signalData.id,
        priority: classification.priority,
        tags: classification.tags,
        actionsCount: actionsTaken.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("phone-call-webhook error:", err);
    const { logError } = await import("../_shared/log-error.ts");
    await logError("phone-call-webhook", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
