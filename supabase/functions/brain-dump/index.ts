import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface Classification {
  signalType: string;
  priority: string;
  summary: string;
  actionsTaken: string[];
  riskLevel: string | null;
  dueDate: string | null;
  callPointer: string | null;
}

async function classifySignal(text: string, apiKey: string): Promise<Classification> {
  const systemPrompt = `You are a signal classification engine for a relationship-intelligence platform used by a senior executive.

Classify the following unstructured text into exactly ONE signal type:
- INTRO: new person or warm introduction
- INSIGHT: market intelligence, trend, or strategic observation
- INVESTMENT: deal flow, capital allocation, or financial opportunity
- DECISION: commitment, decision point, or action item requiring follow-up
- CONTEXT: background information, relationship context, or reference material
- NOISE: irrelevant, spam, or low-value content

Also assign a priority: high, medium, or low.
Provide a concise 1-sentence summary.
List 0-3 recommended next actions as short phrases.`;

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "classify_signal",
            description: "Classify unstructured text into a signal.",
            parameters: {
              type: "object",
              properties: {
                signalType: { type: "string", enum: ["INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT", "NOISE"] },
                priority: { type: "string", enum: ["high", "medium", "low"] },
                summary: { type: "string" },
                actionsTaken: { type: "array", items: { type: "string" } },
              },
              required: ["signalType", "priority", "summary", "actionsTaken"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "classify_signal" } },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("AI classification error:", res.status, errText);
    throw new Error(`AI classification failed: ${res.status}`);
  }

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No tool call in AI response");

  return JSON.parse(toolCall.function.arguments) as Classification;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (text.length > 10000) {
      return new Response(JSON.stringify({ error: "Text too long (max 10,000 characters)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const classification = await classifySignal(text.trim(), apiKey);

    // Insert into signals table using service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: signal, error: insertError } = await supabase
      .from("signals")
      .insert({
        sender: "Brain Dump",
        source: "manual",
        source_message: text.trim(),
        signal_type: classification.signalType,
        priority: classification.priority,
        summary: classification.summary,
        actions_taken: classification.actionsTaken,
        status: "Captured",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save signal");
    }

    return new Response(JSON.stringify({ signal, classification }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("brain-dump error:", e);
    const status = e instanceof Error && e.message.includes("429") ? 429 : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
