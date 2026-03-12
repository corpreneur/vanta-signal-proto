import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LINQ_API_URL = "https://api.linqapp.com/api/partner/v3/chats";

// ─── Helpers ────────────────────────────────────────────────────────────────

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
}

// ─── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Find meetings starting in the next 4-6 minutes that haven't been briefed
    const now = new Date();
    const windowStart = new Date(now.getTime() + 4 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 6 * 60 * 1000);

    const { data: meetings, error: meetingError } = await supabase
      .from("upcoming_meetings")
      .select("*")
      .eq("briefed", false)
      .gte("starts_at", windowStart.toISOString())
      .lte("starts_at", windowEnd.toISOString());

    if (meetingError) {
      console.error("Error fetching meetings:", meetingError);
      return new Response(JSON.stringify({ error: meetingError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!meetings || meetings.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No meetings in window" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const meeting of meetings) {
      try {
        const attendees = (meeting.attendees || []) as Array<{ name?: string; email?: string; phone?: string }>;
        const attendeeNames = attendees.map((a) => a.name || a.email || "Unknown");

        // Search signal history for any signals involving these attendees
        // Match by sender name (case-insensitive partial match)
        const matchedSignals: Array<Record<string, unknown>> = [];

        for (const attendee of attendeeNames) {
          if (!attendee || attendee === "Unknown") continue;

          const { data: signals } = await supabase
            .from("signals")
            .select("id, signal_type, sender, summary, priority, captured_at, source")
            .ilike("sender", `%${attendee}%`)
            .order("captured_at", { ascending: false })
            .limit(5);

          if (signals && signals.length > 0) {
            for (const sig of signals) {
              // Avoid duplicates
              if (!matchedSignals.find((m) => m.id === sig.id)) {
                matchedSignals.push({ ...sig, matched_attendee: attendee });
              }
            }
          }
        }

        // Also search source_message and summary for attendee names
        for (const attendee of attendeeNames) {
          if (!attendee || attendee === "Unknown") continue;

          const { data: contentMatches } = await supabase
            .from("signals")
            .select("id, signal_type, sender, summary, priority, captured_at, source")
            .or(`summary.ilike.%${attendee}%,source_message.ilike.%${attendee}%`)
            .order("captured_at", { ascending: false })
            .limit(3);

          if (contentMatches) {
            for (const sig of contentMatches) {
              if (!matchedSignals.find((m) => m.id === sig.id)) {
                matchedSignals.push({ ...sig, matched_attendee: attendee });
              }
            }
          }
        }

        // Generate AI brief
        const briefText = await generateBrief(
          meeting.title,
          attendeeNames,
          matchedSignals,
          lovableApiKey
        );

        // Build attendee context map
        const attendeeContext: Record<string, unknown> = {};
        for (const attendee of attendeeNames) {
          const relevantSignals = matchedSignals.filter(
            (s) => s.matched_attendee === attendee
          );
          attendeeContext[attendee] = {
            signal_count: relevantSignals.length,
            last_signal: relevantSignals[0]?.captured_at || null,
            signal_types: [...new Set(relevantSignals.map((s) => s.signal_type))],
          };
        }

        // Insert brief
        const { data: brief, error: briefError } = await supabase
          .from("pre_meeting_briefs")
          .insert({
            meeting_id: meeting.id,
            brief_text: briefText,
            matched_signals: matchedSignals.map((s) => ({
              id: s.id,
              signal_type: s.signal_type,
              sender: s.sender,
              summary: s.summary,
              priority: s.priority,
              captured_at: s.captured_at,
              matched_attendee: s.matched_attendee,
            })),
            attendee_context: attendeeContext,
            delivered_dashboard: true,
          })
          .select()
          .single();

        if (briefError) {
          console.error("Brief insert error:", briefError);
          continue;
        }

        // Mark meeting as briefed
        await supabase
          .from("upcoming_meetings")
          .update({ briefed: true })
          .eq("id", meeting.id);

        // Send via Linq
        let linqSent = false;
        const linqApiKey = Deno.env.get("LINQ_PARTNER_API_KEY");
        const rawFromNumber = Deno.env.get("LINQ_FROM_NUMBER");

        if (linqApiKey && rawFromNumber) {
          const fromNumber = toE164(rawFromNumber);
          // Send to the operator's own number (self-message briefing)
          const linqMessage = `📋 PRE-MEETING BRIEF\n\n${meeting.title}\nStarts in ~5 minutes\n\n${briefText}`;

          try {
            const res = await fetch(LINQ_API_URL, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${linqApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: fromNumber,
                to: [fromNumber], // Self-message
                message: { parts: [{ type: "text", value: linqMessage }] },
              }),
            });

            if (res.ok) {
              linqSent = true;
              await supabase
                .from("pre_meeting_briefs")
                .update({ delivered_linq: true })
                .eq("id", brief.id);
            } else {
              console.error("Linq brief send failed:", await res.text());
            }
          } catch (err) {
            console.error("Linq send error:", err);
          }
        }

        console.log(
          `Brief generated for "${meeting.title}": ${matchedSignals.length} matched signals, linq=${linqSent}`
        );

        results.push({
          meetingId: meeting.id,
          briefId: brief.id,
          matchedSignals: matchedSignals.length,
          linqSent,
        });
      } catch (err) {
        console.error(`Error processing meeting ${meeting.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("pre-meeting-brief error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── AI: Generate pre-meeting brief ────────────────────────────────────────

async function generateBrief(
  meetingTitle: string,
  attendees: string[],
  matchedSignals: Array<Record<string, unknown>>,
  apiKey: string
): Promise<string> {
  const systemPrompt = `You are an executive intelligence briefing system for Vanta Wireless.
Generate a concise pre-meeting brief (3-6 sentences) for an upcoming meeting.

The brief should:
- Start with a one-line meeting context (who, what, why)
- Highlight the most important prior signals involving these attendees
- Note any open decisions, commitments, or threads from previous interactions
- End with 1-2 suggested talking points or questions to raise
- Write in third person, professional tone. No greetings or sign-offs.
- If no prior signals exist for an attendee, note them as a "new contact — no prior signal history"

Return ONLY the brief text, no JSON, no markdown formatting.`;

  const signalContext = matchedSignals.length > 0
    ? matchedSignals
        .map(
          (s) =>
            `[${s.signal_type} / ${s.priority}] ${s.sender}: ${s.summary} (${s.captured_at})`
        )
        .join("\n")
    : "No prior signals found for any attendees.";

  try {
    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Meeting: ${meetingTitle}\nAttendees: ${attendees.join(", ")}\n\nPrior Signal History:\n${signalContext}\n\nGenerate the pre-meeting brief:`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      console.error("AI brief generation failed:", await res.text());
      return `Upcoming meeting: "${meetingTitle}" with ${attendees.join(", ")}. ${matchedSignals.length} prior signals found across attendees. Review signal history before meeting.`;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || `Meeting "${meetingTitle}" — ${matchedSignals.length} prior signals found.`;
  } catch (err) {
    console.error("Brief generation error:", err);
    return `Meeting "${meetingTitle}" with ${attendees.join(", ")}. ${matchedSignals.length} prior signals on file.`;
  }
}
