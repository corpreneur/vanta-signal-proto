import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-linq-signature",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LINQ_API_URL = "https://api.linqapp.com/api/partner/v3/chats";

// ─── Types ──────────────────────────────────────────────────────────────────

interface LinqMessage {
  id?: string;
  sender?: string;
  from?: string;
  body?: string;
  text?: string;
  message?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface Classification {
  signalType: string;
  priority: string;
  summary: string;
  actionsTaken: string[];
}

// ─── Auto-reply config ──────────────────────────────────────────────────────

const AUTO_REPLY_TRIGGERS: Record<string, string[]> = {
  INTRO: ["high"],
  INVESTMENT: ["high", "medium", "low"],
  DECISION: ["high", "medium", "low"],
};

const FALLBACK_TEMPLATES: Record<string, string> = {
  INTRO:
    "Thank you for the introduction. I've noted this and will follow up shortly to schedule a conversation.",
  INVESTMENT:
    "Received — I've logged this on the investment side and will circle back with thoughts shortly.",
  DECISION:
    "Got it. I'm reviewing this now and will respond with a decision or next steps soon.",
};

function shouldAutoReply(signalType: string, priority: string): boolean {
  const allowedPriorities = AUTO_REPLY_TRIGGERS[signalType];
  return !!allowedPriorities && allowedPriorities.includes(priority);
}

// ─── AI: Classify signal ────────────────────────────────────────────────────

async function classifySignal(
  message: string,
  sender: string,
  apiKey: string
): Promise<Classification> {
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
        { role: "user", content: `Sender: ${sender}\nMessage: ${message}` },
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
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI classification:", content);
    return {
      signalType: "CONTEXT",
      priority: "low",
      summary: `Unclassified message from ${sender}.`,
      actionsTaken: ["NOTION_LOG"],
    };
  }
}

// ─── AI: Generate reply ─────────────────────────────────────────────────────

async function generateReply(
  signalType: string,
  sender: string,
  message: string,
  summary: string,
  apiKey: string
): Promise<string> {
  const systemPrompt = `You are a concise, professional executive assistant for Vanta Wireless.
Generate a short reply (2-3 sentences max) acknowledging the incoming message.

Rules:
- Be warm but professional. Write as if from a busy executive.
- For INTRO: Thank the sender, confirm you'll follow up with the introduced person.
- For INVESTMENT: Acknowledge receipt, signal thoughtful engagement.
- For DECISION: Confirm you're reviewing and will respond with next steps.
- Never promise specific timelines. Never use exclamation marks.
- Do NOT use greetings like "Hi" or "Hey" — start directly with the acknowledgment.
- Return ONLY the reply text, no JSON, no quotes, no formatting.`;

  try {
    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Signal type: ${signalType}\nSender: ${sender}\nOriginal message: ${message}\nAI summary: ${summary}\n\nWrite the reply:`,
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("AI reply generation failed:", errText);
      return FALLBACK_TEMPLATES[signalType] || "";
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return reply || FALLBACK_TEMPLATES[signalType] || "";
  } catch (err) {
    console.error("Reply generation error:", err);
    return FALLBACK_TEMPLATES[signalType] || "";
  }
}

// ─── Send via Linq ──────────────────────────────────────────────────────────

async function sendLinqReply(
  toNumber: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const linqApiKey = Deno.env.get("LINQ_PARTNER_API_KEY");
  const fromNumber = Deno.env.get("LINQ_FROM_NUMBER");

  if (!linqApiKey || !fromNumber) {
    console.error("LINQ_PARTNER_API_KEY or LINQ_FROM_NUMBER not configured — skipping auto-reply");
    return { success: false, error: "Linq send not configured" };
  }

  try {
    const res = await fetch(LINQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${linqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromNumber,
        to: [toNumber],
        message: { parts: [{ type: "text", value: message }] },
      }),
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error(`Linq send error [${res.status}]:`, responseText);
      return { success: false, error: `Linq API ${res.status}` };
    }

    console.log("Auto-reply sent successfully to:", toNumber);
    return { success: true };
  } catch (err) {
    console.error("Linq send error:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const linqToken = Deno.env.get("LINQ_API_TOKEN");
    const authHeader =
      req.headers.get("x-linq-signature") ||
      new URL(req.url).searchParams.get("token");

    if (linqToken && authHeader !== linqToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload));

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
      const sender = String(msg.sender || msg.from || "Unknown");
      const body = String(msg.body || msg.text || msg.message || "");
      const messageId = msg.id || null;
      const senderNumber = String(msg.from || msg.sender || "");

      if (!body || body.trim().length === 0) {
        results.push({ skipped: true, reason: "empty body" });
        continue;
      }

      // 1. Classify
      const classification = await classifySignal(body, sender, lovableApiKey);

      if (classification.signalType === "NOISE") {
        results.push({ skipped: true, reason: "classified as NOISE", sender });
        continue;
      }

      // 2. Insert signal
      const { data, error } = await supabase
        .from("signals")
        .insert({
          sender,
          source_message: body,
          signal_type: classification.signalType,
          priority: classification.priority,
          summary: classification.summary,
          actions_taken: classification.actionsTaken,
          status: "Captured",
          linq_message_id: messageId ? String(messageId) : null,
          raw_payload: msg as Record<string, unknown>,
          captured_at: msg.timestamp || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        results.push({ error: error.message, sender });
        continue;
      }

      console.log("Signal created:", data.id, classification.signalType, classification.priority);

      const result: Record<string, unknown> = {
        id: data.id,
        signalType: classification.signalType,
        priority: classification.priority,
      };

      // 3. Auto-reply if triggered
      if (shouldAutoReply(classification.signalType, classification.priority) && senderNumber) {
        const replyText = await generateReply(
          classification.signalType,
          sender,
          body,
          classification.summary,
          lovableApiKey
        );

        if (replyText) {
          const sendResult = await sendLinqReply(senderNumber, replyText);
          result.autoReply = {
            sent: sendResult.success,
            to: senderNumber,
            message: replyText,
            error: sendResult.error,
          };

          // Update signal status to reflect auto-reply
          if (sendResult.success) {
            await supabase
              .from("signals")
              .update({
                status: "In Progress",
                actions_taken: [...classification.actionsTaken, "AUTO_REPLY_SENT"],
              })
              .eq("id", data.id);
          }
        }
      }

      results.push(result);
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
