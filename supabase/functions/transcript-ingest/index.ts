import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-source, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ─── Normalised intermediate types ─────────────────────────────────────────

interface TranscriptTurn {
  speaker: string;
  text: string;
  timestamp?: string;
}

interface NormalisedPayload {
  source: "otter" | "fireflies" | "zoom";
  meetingId: string | null;
  meetingTitle: string;
  attendees: { name: string; email: string | null }[];
  transcript: TranscriptTurn[];
  summaryText: string | null;
  recordingUrl: string | null;
  endedAt: string;
  rawPayload: unknown;
}

interface Classification {
  signalType: string;
  priority: string;
  summary: string;
  actionsTaken: string[];
  confidence?: number;
}

// ─── Source detection ───────────────────────────────────────────────────────

function detectSource(
  payload: Record<string, unknown>,
  headerHint: string | null
): "otter" | "fireflies" | "zoom" | null {
  // Explicit header override
  if (headerHint) {
    const h = headerHint.toLowerCase();
    if (h === "otter") return "otter";
    if (h === "fireflies") return "fireflies";
    if (h === "zoom") return "zoom";
  }

  // Otter.ai webhooks include `otterLink` or come from otter domain
  if (payload.otterLink || payload.otter_id || payload.source === "otter") return "otter";

  // Fireflies.ai webhooks include `fireflies_meeting_id` or `meeting_id` + `sentences`
  if (payload.fireflies_meeting_id || (payload.sentences && payload.meeting_id)) return "fireflies";
  // Nested data object from Fireflies webhook events
  const data = payload.data as Record<string, unknown> | undefined;
  if (data?.fireflies_meeting_id || data?.sentences) return "fireflies";

  // Zoom native webhook or Zoom-via-Recall
  if (payload.event === "meeting.ended" || payload.event === "recording.completed") return "zoom";
  if (payload.download_url || payload.recording_files) return "zoom";

  return null;
}

// ─── Otter.ai normaliser ────────────────────────────────────────────────────

function normaliseOtter(payload: Record<string, unknown>): NormalisedPayload {
  const meetingId = (payload.otter_id || payload.id || null) as string | null;
  const meetingTitle = (payload.title || payload.meeting_title || "Otter Meeting") as string;

  // Otter provides `transcript` as array of { speaker, text, start, end }
  const rawTranscript = (payload.transcript || payload.segments || []) as Record<string, unknown>[];
  const transcript: TranscriptTurn[] = rawTranscript.map((seg) => ({
    speaker: (seg.speaker || seg.speaker_name || "Unknown") as string,
    text: (seg.text || seg.content || "") as string,
    timestamp: seg.start ? formatSeconds(Number(seg.start)) : undefined,
  }));

  const attendeesRaw = (payload.attendees || payload.participants || []) as Record<string, unknown>[];
  const attendees = attendeesRaw.map((a) => ({
    name: (a.name || a.display_name || "Unknown") as string,
    email: (a.email || null) as string | null,
  }));

  return {
    source: "otter",
    meetingId,
    meetingTitle,
    attendees,
    transcript,
    summaryText: (payload.summary || null) as string | null,
    recordingUrl: (payload.otterLink || payload.audio_url || null) as string | null,
    endedAt: (payload.ended_at || payload.end_time || new Date().toISOString()) as string,
    rawPayload: payload,
  };
}

// ─── Fireflies.ai normaliser ───────────────────────────────────────────────

function normaliseFireflies(payload: Record<string, unknown>): NormalisedPayload {
  // Fireflies wraps data in a `data` object for webhook events
  const d = (payload.data || payload) as Record<string, unknown>;

  const meetingId = (d.fireflies_meeting_id || d.meeting_id || d.id || null) as string | null;
  const meetingTitle = (d.title || d.meeting_title || "Fireflies Meeting") as string;

  // Fireflies `sentences` array: { speaker_name, text, start_time, end_time, raw_text }
  const sentences = (d.sentences || d.transcript || []) as Record<string, unknown>[];
  const transcript: TranscriptTurn[] = sentences.map((s) => ({
    speaker: (s.speaker_name || s.speaker || "Unknown") as string,
    text: (s.text || s.raw_text || "") as string,
    timestamp: s.start_time ? formatSeconds(Number(s.start_time)) : undefined,
  }));

  const attendeesRaw = (d.attendees || d.participants || []) as Record<string, unknown>[];
  const attendees = attendeesRaw.map((a) => ({
    name: (a.name || a.displayName || "Unknown") as string,
    email: (a.email || null) as string | null,
  }));

  return {
    source: "fireflies",
    meetingId,
    meetingTitle,
    attendees,
    transcript,
    summaryText: (d.summary || d.meeting_summary || d.overview || null) as string | null,
    recordingUrl: (d.audio_url || d.video_url || null) as string | null,
    endedAt: (d.ended_at || d.date || new Date().toISOString()) as string,
    rawPayload: payload,
  };
}

// ─── Zoom normaliser (native webhook or recording payload) ──────────────────

function normaliseZoom(payload: Record<string, unknown>): NormalisedPayload {
  const zPayload = (payload.payload || payload) as Record<string, unknown>;
  const obj = (zPayload.object || zPayload) as Record<string, unknown>;

  const meetingId = (obj.id || obj.meeting_id || obj.uuid || null) as string | null;
  const meetingTitle = (obj.topic || obj.title || "Zoom Meeting") as string;

  // Zoom transcript format varies; common: { timeline: [{ ts, users: { username, text } }] }
  const rawTranscript = (obj.transcript || obj.timeline || []) as Record<string, unknown>[];
  const transcript: TranscriptTurn[] = [];
  for (const entry of rawTranscript) {
    if (entry.users && Array.isArray(entry.users)) {
      for (const u of entry.users as Record<string, unknown>[]) {
        transcript.push({
          speaker: (u.username || u.display_name || "Unknown") as string,
          text: (u.text || "") as string,
          timestamp: entry.ts ? String(entry.ts) : undefined,
        });
      }
    } else {
      transcript.push({
        speaker: (entry.speaker || entry.user || "Unknown") as string,
        text: (entry.text || entry.content || "") as string,
        timestamp: entry.timestamp ? String(entry.timestamp) : undefined,
      });
    }
  }

  const attendeesRaw = (obj.participants || obj.attendees || []) as Record<string, unknown>[];
  const attendees = attendeesRaw.map((a) => ({
    name: (a.name || a.user_name || "Unknown") as string,
    email: (a.email || null) as string | null,
  }));

  const recordingFiles = (obj.recording_files || []) as Record<string, unknown>[];
  const videoRecording = recordingFiles.find(
    (r) => r.file_type === "MP4" || r.recording_type === "shared_screen_with_speaker_view"
  );

  return {
    source: "zoom",
    meetingId: meetingId ? String(meetingId) : null,
    meetingTitle,
    attendees,
    transcript,
    summaryText: (obj.summary || null) as string | null,
    recordingUrl: (videoRecording?.download_url || obj.recording_url || obj.share_url || null) as string | null,
    endedAt: (obj.end_time || obj.ended_at || new Date().toISOString()) as string,
    rawPayload: payload,
  };
}

// ─── AI classification (reused from recall-webhook pattern) ─────────────────

async function classifyMeetingSignal(
  transcript: TranscriptTurn[],
  meetingTitle: string,
  attendeeNames: string[],
  apiKey: string
): Promise<Classification> {
  const systemPrompt = `You are a signal classifier for an executive intelligence system called Vanta Signal.
You receive meeting transcripts and must classify the overall meeting signal.

Return ONLY valid JSON with these fields:
- signalType: one of "MEETING", "INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT"
  Default to "MEETING" unless the entire meeting is clearly about one specific category.
- priority: one of "high", "medium", "low"
  High = contains decisions, commitments, or investment-related discussion.
  Medium = contains frameworks, insights, or action items.
  Low = general context or routine check-in.
- summary: A 2-4 sentence intelligence briefing of the meeting's key signals. Mention specific speakers when attributing insights. Write in third person, professional tone.
- actionsTaken: array of action codes. Choose from: "FRAMEWORK_EXTRACT", "NOTION_LOG", "THESIS_ANALYSIS", "BRIEF_COMPILE", "MEETING_PREP", "BIO_RESEARCH", "CALENDAR_HOLD"
- confidence: a number from 0.0 to 1.0 indicating classification certainty.

Classification rules:
- Look for: decisions made, action items committed, frameworks articulated, investment angles, positioning language, open questions.
- Always include "NOTION_LOG" in actionsTaken.
- If decisions were made, include "BRIEF_COMPILE".
- If investment was discussed, include "THESIS_ANALYSIS".`;

  const condensed = transcript
    .map((t) => `[${t.speaker}${t.timestamp ? ` @ ${t.timestamp}` : ""}]: ${t.text}`)
    .join("\n");

  const truncated = condensed.length > 8000
    ? condensed.slice(0, 8000) + "\n[…transcript truncated]"
    : condensed;

  const userContent = `Meeting Title: ${meetingTitle}\nAttendees: ${attendeeNames.join(", ")}\n\nTranscript:\n${truncated}`;

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
      return fallbackClassification(meetingTitle, transcript.length);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
  } catch (err) {
    console.error("Classification error:", err);
    return fallbackClassification(meetingTitle, transcript.length);
  }
}

function fallbackClassification(title: string, turnCount: number): Classification {
  return {
    signalType: "MEETING",
    priority: "medium",
    summary: `Meeting "${title}" with ${turnCount} transcript segments. Auto-classification failed.`,
    actionsTaken: ["NOTION_LOG"],
    confidence: 0.0,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

// ─── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody) as Record<string, unknown>;

    const headerHint = req.headers.get("x-webhook-source");
    const source = detectSource(payload, headerHint);

    if (!source) {
      console.warn("Could not detect transcript source from payload. Set x-webhook-source header to otter|fireflies|zoom.");
      return new Response(
        JSON.stringify({ error: "Unrecognised payload. Set x-webhook-source header to otter, fireflies, or zoom." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`transcript-ingest: detected source=${source}`);

    // ── Normalise ──
    let normalised: NormalisedPayload;
    switch (source) {
      case "otter":
        normalised = normaliseOtter(payload);
        break;
      case "fireflies":
        normalised = normaliseFireflies(payload);
        break;
      case "zoom":
        normalised = normaliseZoom(payload);
        break;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // ── Dedup by meeting_id ──
    if (normalised.meetingId) {
      const { data: existing } = await supabase
        .from("signals")
        .select("id")
        .eq("meeting_id", normalised.meetingId)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log("Duplicate meeting, skipping:", normalised.meetingId);
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
      .slice(0, 500) || `Meeting: ${normalised.meetingTitle}`;

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
        source: "recall", // all meeting sources map to recall source enum
        meeting_id: normalised.meetingId,
        raw_payload: normalised.rawPayload,
        captured_at: normalised.endedAt,
        confidence_score: typeof classification.confidence === "number" ? classification.confidence : null,
        classification_reasoning: `Source: ${normalised.source}`,
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

    console.log(`Signal created: ${signalData.id} [${classification.signalType}] from ${normalised.source}`);

    // ── Insert meeting artifact ──
    const { error: artifactError } = await supabase.from("meeting_artifacts").insert({
      signal_id: signalData.id,
      transcript_json: normalised.transcript,
      summary_text: normalised.summaryText,
      recording_url: normalised.recordingUrl,
      attendees: normalised.attendees,
    });

    if (artifactError) {
      console.error("Artifact insert error (non-fatal):", artifactError);
    }

    // ── Upsert speaker profiles & link to meeting ──
    try {
      const speakerTurnCounts = new Map<string, number>();
      for (const turn of normalised.transcript) {
        speakerTurnCounts.set(turn.speaker, (speakerTurnCounts.get(turn.speaker) || 0) + 1);
      }

      // Match attendees to speakers for email enrichment
      const attendeeEmailMap = new Map<string, string>();
      for (const a of normalised.attendees) {
        if (a.email) attendeeEmailMap.set(a.name.toLowerCase(), a.email);
      }

      for (const [speakerName, turnCount] of speakerTurnCounts) {
        const email = attendeeEmailMap.get(speakerName.toLowerCase()) || null;

        // Try to find existing profile by email first, then by exact name
        let profileId: string | null = null;

        if (email) {
          const { data: byEmail } = await supabase
            .from("speaker_profiles")
            .select("id, meeting_count")
            .eq("email", email)
            .maybeSingle();
          if (byEmail) {
            profileId = byEmail.id;
            await supabase.from("speaker_profiles").update({
              last_seen_at: new Date().toISOString(),
              meeting_count: byEmail.meeting_count + 1,
            }).eq("id", profileId);
          }
        }

        if (!profileId) {
          const { data: byName } = await supabase
            .from("speaker_profiles")
            .select("id, meeting_count")
            .eq("name", speakerName)
            .maybeSingle();
          if (byName) {
            profileId = byName.id;
            await supabase.from("speaker_profiles").update({
              last_seen_at: new Date().toISOString(),
              meeting_count: byName.meeting_count + 1,
              ...(email ? { email } : {}),
            }).eq("id", profileId);
          }
        }

        if (!profileId) {
          const { data: newProfile } = await supabase
            .from("speaker_profiles")
            .insert({ name: speakerName, email })
            .select("id")
            .single();
          if (newProfile) profileId = newProfile.id;
        }

        if (profileId) {
          await supabase.from("meeting_speakers").insert({
            signal_id: signalData.id,
            speaker_profile_id: profileId,
            turn_count: turnCount,
          }).onConflict("signal_id,speaker_profile_id" as any);
        }
      }
      console.log(`Speaker profiles upserted for ${speakerTurnCounts.size} speakers`);
    } catch (speakerErr) {
      console.error("Speaker profiling error (non-fatal):", speakerErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: normalised.source,
        signalId: signalData.id,
        signalType: classification.signalType,
        priority: classification.priority,
        attendeeCount: normalised.attendees.length,
        transcriptTurns: normalised.transcript.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("transcript-ingest error:", err);
    const { logError } = await import("../_shared/log-error.ts");
    await logError("transcript-ingest", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
