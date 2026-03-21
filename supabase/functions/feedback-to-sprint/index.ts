import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch unprocessed feedback entries
    const { data: entries, error: fetchErr } = await supabase
      .from("feedback_entries")
      .select("*")
      .eq("sprint_processed", false)
      .order("created_at", { ascending: false });

    if (fetchErr) throw fetchErr;
    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No new feedback to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sprintItems: Array<Record<string, unknown>> = [];

    // Process each feedback entry with AI
    for (const entry of entries) {
      const aiSummaries = entry.ai_summaries
        ? JSON.stringify(entry.ai_summaries)
        : "No AI summary available";

      const prompt = `You are a product sprint planner. Given this feedback entry, extract actionable sprint items.

Feedback entry:
- Author: ${entry.author}
- Subject: ${entry.subject}
- Status: ${entry.status}
- Narrative: ${entry.narrative}
- AI Summaries: ${aiSummaries}

For each actionable item, return a JSON array of objects with:
- title: concise task title (max 80 chars)
- description: what needs to be done (2-3 sentences)
- priority: "high", "medium", or "low"
- effort: "small" (< 2hrs), "medium" (2-8hrs), or "large" (> 8hrs)
- sprint_phase: 1 (now), 2 (next sprint), or 3 (backlog)
- reasoning: why this was extracted and prioritized this way

If the feedback has no actionable items, return an empty array [].
Return ONLY valid JSON array, no markdown.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a product sprint planner. Return only valid JSON arrays." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error(`AI error for entry ${entry.id}:`, await aiResponse.text());
        continue;
      }

      const aiData = await aiResponse.json();
      let rawContent = aiData.choices?.[0]?.message?.content || "[]";
      
      // Strip markdown code fences if present
      rawContent = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let items: Array<Record<string, string | number>> = [];
      try {
        items = JSON.parse(rawContent);
      } catch {
        console.error(`Failed to parse AI response for entry ${entry.id}:`, rawContent);
        continue;
      }

      if (!Array.isArray(items)) continue;

      for (const item of items) {
        sprintItems.push({
          feedback_entry_id: entry.id,
          title: String(item.title || "Untitled task").slice(0, 200),
          description: String(item.description || ""),
          priority: ["high", "medium", "low"].includes(String(item.priority)) ? item.priority : "medium",
          effort: ["small", "medium", "large"].includes(String(item.effort)) ? item.effort : "medium",
          sprint_phase: [1, 2, 3].includes(Number(item.sprint_phase)) ? item.sprint_phase : 1,
          subject: entry.subject,
          ai_reasoning: String(item.reasoning || ""),
          status: "backlog",
        });
      }

      // Mark feedback as processed
      await supabase
        .from("feedback_entries")
        .update({ sprint_processed: true })
        .eq("id", entry.id);
    }

    // Bulk insert sprint items
    if (sprintItems.length > 0) {
      const { error: insertErr } = await supabase.from("sprint_items").insert(sprintItems);
      if (insertErr) throw insertErr;
    }

    console.log(`feedback-to-sprint: processed ${entries.length} entries, created ${sprintItems.length} sprint items`);

    return new Response(
      JSON.stringify({
        processed: entries.length,
        sprint_items_created: sprintItems.length,
        items: sprintItems.map((i) => ({ title: i.title, priority: i.priority, phase: i.sprint_phase })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("feedback-to-sprint error:", e);
    const { logError } = await import("../_shared/log-error.ts");
    await logError("feedback-to-sprint", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
