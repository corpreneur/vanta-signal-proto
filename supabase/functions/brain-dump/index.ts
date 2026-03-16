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
  suggestedTitle: string;
  suggestedTags: string[];
  suggestedContacts: string[];
  accelerators: string[];
  confidence: number;
  reasoning: string;
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

Also assign:
- priority: high, medium, or low
- riskLevel: low, medium, high, or critical (null if not applicable)
- dueDate: ISO date string (YYYY-MM-DD) if a deadline or due date is mentioned, otherwise null
- callPointer: a brief reference to who/what to follow up with (e.g. "Call back John re: term sheet"), otherwise null
- summary: concise 1-sentence summary
- actionsTaken: 0-3 recommended next actions as short phrases
- suggestedTitle: a concise, descriptive title for this note (3-8 words)
- suggestedTags: 2-5 topic/keyword tags extracted from the content (e.g. "Invoice", "Payment", "Feature Ideas", "VANTA")
- suggestedContacts: names or initials of people mentioned or relevant to this note. Extract from @mentions, names, or contextual references. Return empty array if none found.
- accelerators: 2-5 specific, actionable next steps parsed from the user's intent. These should be extracted from meaning — not generic templates. Examples:
  - If user says "send invoice for shoot" → "Send invoice for shoot"
  - If user says "follow up on payment" → "Send follow-up email re: payment"
  - If user mentions a person → "Send to [person name]"
  - If content is an idea → "Create a one-pager", "Schedule reminder to revisit"
  - If a date is mentioned → "Set reminder for [date]"
  - Always consider: document creation, follow-ups, reminders, sharing with mentioned people, and surfacing related files
- confidence: how certain you are about the signal type classification (0.0 = very uncertain, 1.0 = certain)
- reasoning: 1-2 sentences explaining WHY you chose this signal type and priority level. Reference specific keywords, patterns, or context from the text.`;

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
            description: "Classify unstructured text into a signal with smart metadata.",
            parameters: {
              type: "object",
              properties: {
                signalType: { type: "string", enum: ["INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT", "NOISE"] },
                priority: { type: "string", enum: ["high", "medium", "low"] },
                summary: { type: "string" },
                actionsTaken: { type: "array", items: { type: "string" } },
                riskLevel: { type: ["string", "null"], enum: ["low", "medium", "high", "critical", null] },
                dueDate: { type: ["string", "null"], description: "ISO date YYYY-MM-DD or null" },
                callPointer: { type: ["string", "null"], description: "Brief follow-up reference or null" },
                suggestedTitle: { type: "string", description: "Concise 3-8 word title for the note" },
                suggestedTags: { type: "array", items: { type: "string" }, description: "2-5 topic/keyword tags" },
                suggestedContacts: { type: "array", items: { type: "string" }, description: "Names/initials of people mentioned" },
                accelerators: { type: "array", items: { type: "string" }, description: "2-5 specific actionable next steps parsed from intent" },
                confidence: { type: "number", description: "Classification confidence score from 0.0 to 1.0. 1.0 = highly certain, 0.5 = uncertain." },
              },
              required: ["signalType", "priority", "summary", "actionsTaken", "riskLevel", "dueDate", "callPointer", "suggestedTitle", "suggestedTags", "suggestedContacts", "accelerators", "confidence"],
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

const MAX_TEXT_LENGTH = 10_000;
const MAX_URL_LENGTH = 2_048;
const URL_PATTERN = /^https?:\/\/[^\s<>"{}|\\^`\[\]]+$/i;

function sanitizeText(input: string): string {
  // Strip null bytes, control chars (except newlines/tabs), and excessive whitespace
  return input
    .replace(/\0/g, "")
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // ── Auth: verify JWT ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let { text } = body as { text?: string };
    const { url } = body as { url?: string };

    // Validate URL if provided
    if (url !== undefined && url !== null && url !== "") {
      if (typeof url !== "string") {
        return new Response(JSON.stringify({ error: "URL must be a string" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const trimmedUrl = url.trim();
      if (trimmedUrl.length > MAX_URL_LENGTH) {
        return new Response(JSON.stringify({ error: `URL must be under ${MAX_URL_LENGTH} characters` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let formattedUrl = trimmedUrl;
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      if (!URL_PATTERN.test(formattedUrl)) {
        return new Response(JSON.stringify({ error: "Invalid URL format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Block private/internal network URLs
      const hostname = new URL(formattedUrl).hostname;
      if (hostname === "localhost" || hostname.startsWith("127.") || hostname.startsWith("10.") || hostname.startsWith("192.168.") || hostname === "0.0.0.0" || hostname.endsWith(".local")) {
        return new Response(JSON.stringify({ error: "Internal URLs are not allowed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (!firecrawlKey) {
        return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Scraping URL for brain-dump:", formattedUrl);
      const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      });

      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok || !scrapeData.success) {
        console.error("Firecrawl scrape failed:", scrapeData);
        return new Response(JSON.stringify({ error: "Failed to scrape URL. It may be inaccessible." }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const scraped = scrapeData.data?.markdown || scrapeData.markdown || "";
      const title = scrapeData.data?.metadata?.title || scrapeData.metadata?.title || "";
      const prefix = text && typeof text === "string" && text.trim() ? `${sanitizeText(text)}\n\n---\n\n` : "";
      text = `${prefix}[Scraped from: ${formattedUrl}]${title ? ` — ${title}` : ""}\n\n${scraped}`;
      console.log(`Scraped ${scraped.length} chars from ${formattedUrl}`);
    }

    // Validate text
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Text is required and must be a string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    text = sanitizeText(text);

    if (text.length === 0) {
      return new Response(JSON.stringify({ error: "Text cannot be empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      text = text.substring(0, MAX_TEXT_LENGTH);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const classification = await classifySignal(text.trim(), apiKey);

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
        risk_level: classification.riskLevel || null,
        due_date: (classification.dueDate && classification.dueDate !== "null") ? classification.dueDate : null,
        call_pointer: (classification.callPointer && classification.callPointer !== "null") ? classification.callPointer : null,
        confidence_score: typeof classification.confidence === "number" ? classification.confidence : null,
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
    const { logError } = await import("../_shared/log-error.ts");
    await logError("brain-dump", e);
    const status = e instanceof Error && e.message.includes("429") ? 429 : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
