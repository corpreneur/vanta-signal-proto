import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { entry_id, conversations } = await req.json();
    if (!entry_id || !Array.isArray(conversations) || conversations.length === 0) {
      return new Response(
        JSON.stringify({ error: "entry_id and conversations[] required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const summaries: Array<{
      url: string;
      title: string;
      decisions: string[];
      action_items: string[];
      insights: string[];
      summary: string;
      generated_at: string;
    }> = [];

    for (const convo of conversations) {
      const content = (convo.content || "").slice(0, 30000); // cap tokens
      if (!content.trim()) continue;

      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
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
                content: `You are a product strategy analyst. Given a ChatGPT conversation transcript, extract:
1. KEY DECISIONS — concrete choices or directions agreed upon
2. ACTION ITEMS — specific tasks, follow-ups, or next steps with owners if mentioned
3. INSIGHTS — important observations, patterns, or strategic takeaways

Also write a 2-3 sentence executive summary.

Respond using the extract_summary tool.`,
              },
              {
                role: "user",
                content: `Conversation title: ${convo.title || "Untitled"}\n\n${content}`,
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "extract_summary",
                  description:
                    "Extract decisions, action items, and insights from a conversation.",
                  parameters: {
                    type: "object",
                    properties: {
                      decisions: {
                        type: "array",
                        items: { type: "string" },
                        description: "Key decisions made",
                      },
                      action_items: {
                        type: "array",
                        items: { type: "string" },
                        description: "Specific action items / next steps",
                      },
                      insights: {
                        type: "array",
                        items: { type: "string" },
                        description: "Strategic insights and observations",
                      },
                      summary: {
                        type: "string",
                        description: "2-3 sentence executive summary",
                      },
                    },
                    required: ["decisions", "action_items", "insights", "summary"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: {
              type: "function",
              function: { name: "extract_summary" },
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI gateway error:", response.status, errText);
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limited — try again in a moment" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted — add funds in Settings" }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        continue;
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          const parsed = JSON.parse(toolCall.function.arguments);
          summaries.push({
            url: convo.url,
            title: convo.title || "Untitled",
            decisions: parsed.decisions || [],
            action_items: parsed.action_items || [],
            insights: parsed.insights || [],
            summary: parsed.summary || "",
            generated_at: new Date().toISOString(),
          });
        } catch {
          console.error("Failed to parse tool call arguments");
        }
      }
    }

    // Persist summaries to DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await sb
      .from("feedback_entries")
      .update({ ai_summaries: summaries })
      .eq("id", entry_id);

    if (updateError) {
      console.error("DB update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to save summaries", summaries }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ summaries }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
