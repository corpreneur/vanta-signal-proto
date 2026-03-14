import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if digest is enabled
    const { data: setting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "digest_enabled")
      .single();

    if (!setting || setting.value === false) {
      return new Response(JSON.stringify({ skipped: true, reason: "digest_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get top 5 signals from last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentSignals } = await supabase
      .from("signals")
      .select("*")
      .neq("signal_type", "NOISE")
      .gte("captured_at", since)
      .order("priority", { ascending: true })
      .order("captured_at", { ascending: false })
      .limit(5);

    // Get overdue signals
    const today = new Date().toISOString().split("T")[0];
    const { data: overdueSignals } = await supabase
      .from("signals")
      .select("*")
      .neq("status", "Complete")
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(5);

    // Get today's meetings
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const { data: meetings } = await supabase
      .from("upcoming_meetings")
      .select("title, starts_at, attendees")
      .gte("starts_at", todayStart.toISOString())
      .lt("starts_at", todayEnd.toISOString())
      .order("starts_at");

    // Build digest with AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const signalSummaries = (recentSignals || []).map((s, i) =>
      `${i + 1}. [${s.signal_type}/${s.priority}] ${s.sender}: ${s.summary}`
    ).join("\n");

    const overdueSummaries = (overdueSignals || []).map((s) =>
      `- ${s.sender}: ${s.summary} (due ${s.due_date})`
    ).join("\n");

    const meetingSummaries = (meetings || []).map((m) =>
      `- ${new Date(m.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}: ${m.title}`
    ).join("\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a concise executive briefing assistant. Generate a morning digest in plain text (no markdown). Keep it under 500 characters. Use a direct, professional tone. Include key numbers.",
          },
          {
            role: "user",
            content: `Generate a morning digest for today.\n\nTop signals (last 24h):\n${signalSummaries || "None"}\n\nOverdue items:\n${overdueSummaries || "None"}\n\nToday's meetings:\n${meetingSummaries || "None"}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const digestText = aiData.choices?.[0]?.message?.content || "No digest generated.";

    // Send via Linq
    const LINQ_API_TOKEN = Deno.env.get("LINQ_API_TOKEN");
    const LINQ_FROM_NUMBER = Deno.env.get("LINQ_FROM_NUMBER");

    if (LINQ_API_TOKEN && LINQ_FROM_NUMBER) {
      const linqResponse = await fetch("https://api.linq.chat/api/v1/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LINQ_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: LINQ_FROM_NUMBER,
          from: LINQ_FROM_NUMBER,
          body: `☀️ VANTA Morning Digest\n\n${digestText}`,
        }),
      });

      if (!linqResponse.ok) {
        console.error("Linq send error:", await linqResponse.text());
      }
    }

    return new Response(JSON.stringify({ success: true, digest: digestText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("daily-digest error:", e);
    const { logError } = await import("../_shared/log-error.ts");
    await logError("daily-digest", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
