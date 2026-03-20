import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client for auth verification
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client for inserting briefs
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Get user's active context
    const { data: prefsRow } = await userClient
      .from("user_preferences")
      .select("active_context_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const contextId = prefsRow?.active_context_id || null;

    // Get context name if available
    let contextName = "your business";
    if (contextId) {
      const { data: ctx } = await userClient
        .from("user_contexts")
        .select("name, context_type")
        .eq("id", contextId)
        .maybeSingle();
      if (ctx) contextName = ctx.name;
    }

    // Get recent signals (last 7 days)
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: signals } = await userClient
      .from("signals")
      .select("id, signal_type, priority, sender, summary, captured_at, status, due_date")
      .gte("captured_at", sevenDaysAgo)
      .order("captured_at", { ascending: false })
      .limit(50);

    if (!signals || signals.length === 0) {
      return new Response(
        JSON.stringify({
          headline: "No recent signals to brief on.",
          summary:
            "Your signal feed is quiet. Check back once new signals arrive.",
          items: [],
          generated_at: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Compute stats from live data
    const highPriority = signals.filter((s: any) => s.priority === "high").length;
    const introCount = signals.filter((s: any) => s.signal_type === "INTRO").length;
    const meetingCount = signals.filter((s: any) => s.signal_type === "MEETING").length;
    const overdue = signals.filter(
      (s: any) => s.due_date && new Date(s.due_date) < new Date() && s.status !== "Complete"
    ).length;
    const totalSignals = signals.length;

    // Build items
    const items = [
      {
        id: "total",
        icon: "Activity",
        label: "Signals (7d)",
        value: String(totalSignals),
        trend: "neutral",
        trendLabel: `${highPriority} high priority`,
      },
      {
        id: "intros",
        icon: "Users",
        label: "Introductions",
        value: String(introCount),
        trend: introCount > 0 ? "up" : "neutral",
        trendLabel: introCount > 0 ? "New connections" : "None this week",
      },
      {
        id: "overdue",
        icon: "AlertCircle",
        label: "Overdue",
        value: String(overdue),
        trend: overdue > 2 ? "down" : "up",
        trendLabel:
          overdue === 0 ? "All clear" : `${overdue} need attention`,
      },
    ];

    // Generate headline using AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    let headline = `${totalSignals} signals captured this week for ${contextName}.`;
    let summary = `You have ${highPriority} high-priority signals, ${introCount} introductions, and ${meetingCount} meetings. ${overdue > 0 ? `${overdue} items are overdue.` : "Nothing overdue."}`;

    if (LOVABLE_API_KEY) {
      try {
        const signalSummaries = signals
          .slice(0, 15)
          .map((s: any) => `[${s.signal_type}/${s.priority}] ${s.summary}`)
          .join("\n");

        const aiRes = await fetch(
          "https://ai-gateway.lovable.dev/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: `You are a concise executive briefing assistant for "${contextName}". Write a one-sentence headline (max 15 words) and a 2-3 sentence summary paragraph. Return JSON: {"headline":"...","summary":"..."}. Focus on actionable insights. Be direct, no fluff.`,
                },
                {
                  role: "user",
                  content: `Here are the recent signals:\n${signalSummaries}\n\nStats: ${totalSignals} total, ${highPriority} high priority, ${introCount} intros, ${meetingCount} meetings, ${overdue} overdue.`,
                },
              ],
              temperature: 0.3,
              max_tokens: 200,
            }),
          }
        );

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.headline) headline = parsed.headline;
            if (parsed.summary) summary = parsed.summary;
          }
        }
      } catch (e) {
        console.error("AI brief generation failed, using fallback:", e);
      }
    }

    // Store the brief
    await adminClient.from("signal_briefs").insert({
      user_id: user.id,
      context_id: contextId,
      headline,
      summary,
      items,
      generated_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        headline,
        summary,
        items,
        generated_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("generate-brief error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
