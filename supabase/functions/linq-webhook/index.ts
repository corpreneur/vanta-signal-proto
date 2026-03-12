import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-linq-signature",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface LinqMessage {
  id?: string;
  sender?: string;
  body?: string;
  timestamp?: string;
  [key: string]: unknown;
}

async function classifySignal(
  message: string,
  sender: string,
  apiKey: string
): Promise<{
  signalType: string;
  priority: string;
  summary: string;
  actionsTaken: string[];
}> {
  const systemPrompt = `You are a signal classifier for an executive intelligence system called Vanta Wireless.
You receive raw messages from an executive's messaging platform and must classify them.

Return ONLY valid JSON with these fields:
- signalType: one of "INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT", "NOISE"
- priority: one of "high", "medium", "low"
- summary: A 1-3 sentence intelligence briefing of the message's significance (write in third person, professional tone)
- actionsTaken: array of action codes to execute. Choose from: "BIO_RESEARCH", "MEETING_PREP", "EMAIL_DRAFT", "AGENT_BUILD", "FRAMEWORK_EXTRACT", "NOTION_LOG", "THESIS_ANALYSIS", "CALENDAR_HOLD", "BRIEF_COMPILE"

Classification rules:
- INTRO: Someone is introducing a person. Usually contains "meet", "introducing", "connect with". High priority if the person is senior/notable.
- INSIGHT: A strategic or philosophical insight worth capturing. Frameworks, mental models, quotes.
- INVESTMENT: Anything related to fundraising, investors, valuations, term sheets.
- DECISION: A decision point requiring action or response. Strategy calls, partner communications.
- CONTEXT: Background information, follow-ups, additional detail on existing threads. Usually low priority.
- NOISE: Casual conversation, logistics, scheduling without strategic value.

Action rules:
- INTRO signals should get: BIO_RESEARCH, MEETING_PREP, EMAIL_DRAFT, and optionally AGENT_BUILD for high priority
- INSIGHT signals should get: FRAMEWORK_EXTRACT, NOTION_LOG
- INVESTMENT signals should get: THESIS_ANALYSIS, NOTION_LOG
- DECISION signals should get: NOTION_LOG, and optionally BRIEF_COMPILE
- CONTEXT signals should get: NOTION_LOG
- NOISE signals should get empty array []`;

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
        {
          role: "user",
          content: `Sender: ${sender}\nMessage: ${message}`,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("AI classification failed:", errText);
    return {
      signalType: "CONTEXT",
      priority: "low",
      summary: `Unclassified message from ${sender}.`,
      actionsTaken: ["NOTION_LOG"],
    };
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  try {
    // Strip markdown code fences if present
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI response:", content);
    return {
      signalType: "CONTEXT",
      priority: "low",
      summary: `Unclassified message from ${sender}.`,
      actionsTaken: ["NOTION_LOG"],
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify Linq API token from header or query param
    const linqToken = Deno.env.get("LINQ_API_TOKEN");
    const authHeader = req.headers.get("x-linq-signature") || 
                       new URL(req.url).searchParams.get("token");
    
    if (linqToken && authHeader !== linqToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    console.log("Received Linq webhook payload:", JSON.stringify(payload));

    // Normalize — Linq may send single message or array
    const messages: LinqMessage[] = Array.isArray(payload)
      ? payload
      : payload.messages
      ? payload.messages
      : [payload];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const results = [];

    for (const msg of messages) {
      const sender = msg.sender || msg.from || "Unknown";
      const body = msg.body || msg.text || msg.message || "";
      const messageId = msg.id || null;

      if (!body || body.trim().length === 0) {
        results.push({ skipped: true, reason: "empty body" });
        continue;
      }

      // AI classification
      const classification = await classifySignal(
        body,
        String(sender),
        lovableApiKey
      );

      // Skip noise signals
      if (classification.signalType === "NOISE") {
        results.push({
          skipped: true,
          reason: "classified as NOISE",
          sender,
        });
        continue;
      }

      // Insert into signals table
      const { data, error } = await supabase.from("signals").insert({
        sender: String(sender),
        source_message: String(body),
        signal_type: classification.signalType,
        priority: classification.priority,
        summary: classification.summary,
        actions_taken: classification.actionsTaken,
        status: "Captured",
        linq_message_id: messageId ? String(messageId) : null,
        raw_payload: msg as Record<string, unknown>,
        captured_at: msg.timestamp || new Date().toISOString(),
      }).select().single();

      if (error) {
        console.error("Insert error:", error);
        results.push({ error: error.message, sender });
      } else {
        console.log("Signal created:", data.id, classification.signalType);
        results.push({
          id: data.id,
          signalType: classification.signalType,
          priority: classification.priority,
        });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
