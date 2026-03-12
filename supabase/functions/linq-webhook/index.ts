import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp, x-webhook-event, x-webhook-subscription-id, x-linq-signature",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LINQ_API_URL = "https://api.linqapp.com/api/partner/v3/chats";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Classification {
  signalType: string;
  priority: string;
  summary: string;
  actionsTaken: string[];
}

interface ParsedMessage {
  eventId: string | null;
  eventType: string;
  sender: string;
  senderHandle: string; // E.164 phone for replies
  body: string;
  chatId: string | null;
  messageId: string | null;
  timestamp: string;
  rawPayload: Record<string, unknown>;
}

// ─── Auto-reply config ──────────────────────────────────────────────────────

const AUTO_REPLY_TRIGGERS: Record<string, string[]> = {
  INTRO: ["high"],
  INVESTMENT: ["high", "medium", "low"],
  DECISION: ["high", "medium", "low"],
};

const FALLBACK_TEMPLATES: Record<string, string> = {
  INTRO: "Thank you for the introduction. I've noted this and will follow up shortly to schedule a conversation.",
  INVESTMENT: "Received — I've logged this on the investment side and will circle back with thoughts shortly.",
  DECISION: "Got it. I'm reviewing this now and will respond with a decision or next steps soon.",
};

function shouldAutoReply(signalType: string, priority: string): boolean {
  const allowedPriorities = AUTO_REPLY_TRIGGERS[signalType];
  return !!allowedPriorities && allowedPriorities.includes(priority);
}

// ─── HMAC-SHA256 signature verification ─────────────────────────────────────

async function verifyWebhookSignature(
  signingSecret: string,
  rawBody: string,
  timestamp: string,
  signature: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(signingSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const message = `${timestamp}.${rawBody}`;
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
    const expected = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    // Constant-time-ish comparison
    if (expected.length !== signature.length) return false;
    let result = 0;
    for (let i = 0; i < expected.length; i++) {
      result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return result === 0;
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

// ─── Parse Linq v3 webhook payload ──────────────────────────────────────────

function parseLinqPayload(payload: Record<string, unknown>): ParsedMessage | null {
  // V3 2026-02-03 format: { event_type, event_id, data: { sender_handle, parts, chat, ... } }
  if (payload.event_type && payload.data) {
    const eventType = String(payload.event_type);
    // Only process inbound messages
    if (eventType !== "message.received") return null;

    const data = payload.data as Record<string, unknown>;
    const senderHandle = data.sender_handle as Record<string, unknown> | undefined;
    const chat = data.chat as Record<string, unknown> | undefined;
    const parts = data.parts as Array<Record<string, unknown>> | undefined;

    // Extract text from parts
    const textParts = (parts || [])
      .filter((p) => p.type === "text")
      .map((p) => String(p.value || ""));
    const body = textParts.join("\n").trim();

    if (!body) return null;

    return {
      eventId: payload.event_id ? String(payload.event_id) : null,
      eventType,
      sender: senderHandle?.handle ? String(senderHandle.handle) : "Unknown",
      senderHandle: senderHandle?.handle ? String(senderHandle.handle) : "",
      body,
      chatId: chat?.id ? String(chat.id) : null,
      messageId: data.id ? String(data.id) : null,
      timestamp: data.sent_at ? String(data.sent_at) : new Date().toISOString(),
      rawPayload: payload,
    };
  }

  // V3 2025-01-01 format: { event_type, data: { message: { from_handle, ... }, chat_id } }
  if (payload.event_type && payload.data) {
    const data = payload.data as Record<string, unknown>;
    const message = data.message as Record<string, unknown> | undefined;
    if (!message) return null;

    const fromHandle = message.from_handle as Record<string, unknown> | undefined;
    const parts = message.parts as Array<Record<string, unknown>> | undefined;
    const textParts = (parts || [])
      .filter((p) => p.type === "text")
      .map((p) => String(p.value || ""));
    const body = textParts.join("\n").trim();

    if (!body) return null;

    return {
      eventId: payload.event_id ? String(payload.event_id) : null,
      eventType: String(payload.event_type),
      sender: fromHandle?.handle ? String(fromHandle.handle) : "Unknown",
      senderHandle: fromHandle?.handle ? String(fromHandle.handle) : "",
      body,
      chatId: data.chat_id ? String(data.chat_id) : null,
      messageId: message.id ? String(message.id) : null,
      timestamp: message.sent_at ? String(message.sent_at) : new Date().toISOString(),
      rawPayload: payload,
    };
  }

  // Legacy / test format: flat { sender, body, id, timestamp }
  const sender = String(payload.sender || payload.from || "Unknown");
  const body = String(payload.body || payload.text || payload.message || "");
  if (!body.trim()) return null;

  return {
    eventId: null,
    eventType: "message.received",
    sender,
    senderHandle: String(payload.from || payload.sender || ""),
    body,
    chatId: null,
    messageId: payload.id ? String(payload.id) : null,
    timestamp: payload.timestamp ? String(payload.timestamp) : new Date().toISOString(),
    rawPayload: payload,
  };
}

// ─── AI: Classify signal ────────────────────────────────────────────────────

async function classifySignal(message: string, sender: string, apiKey: string): Promise<Classification> {
  const systemPrompt = `You are a signal classifier for an executive intelligence system called Vanta Wireless.
You receive raw messages from an executive's messaging platform and must classify them.

Return ONLY valid JSON with these fields:
- signalType: one of "INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT", "NOISE"
- priority: one of "high", "medium", "low"
- summary: A 1-3 sentence intelligence briefing of the message's significance (write in third person, professional tone)
- actionsTaken: array of action codes. Choose from: "BIO_RESEARCH", "MEETING_PREP", "EMAIL_DRAFT", "AGENT_BUILD", "FRAMEWORK_EXTRACT", "NOTION_LOG", "THESIS_ANALYSIS", "CALENDAR_HOLD", "BRIEF_COMPILE"

Classification rules:
- INTRO: Someone is introducing a person. High priority if the person is senior/notable.
- INSIGHT: A strategic or philosophical insight worth capturing.
- INVESTMENT: Anything related to fundraising, investors, valuations, term sheets.
- DECISION: A decision point requiring action or response.
- CONTEXT: Background information, follow-ups, additional detail.
- NOISE: Casual conversation, logistics without strategic value.

Action rules:
- INTRO: BIO_RESEARCH, MEETING_PREP, EMAIL_DRAFT, optionally AGENT_BUILD for high priority
- INSIGHT: FRAMEWORK_EXTRACT, NOTION_LOG
- INVESTMENT: THESIS_ANALYSIS, NOTION_LOG
- DECISION: NOTION_LOG, optionally BRIEF_COMPILE
- CONTEXT: NOTION_LOG
- NOISE: empty array []`;

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
    console.error("AI classification failed:", await res.text());
    return { signalType: "CONTEXT", priority: "low", summary: `Unclassified message from ${sender}.`, actionsTaken: ["NOTION_LOG"] };
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    console.error("Failed to parse AI classification:", content);
    return { signalType: "CONTEXT", priority: "low", summary: `Unclassified message from ${sender}.`, actionsTaken: ["NOTION_LOG"] };
  }
}

// ─── AI: Generate reply ─────────────────────────────────────────────────────

async function generateReply(signalType: string, sender: string, message: string, summary: string, apiKey: string): Promise<string> {
  const systemPrompt = `You are a concise, professional executive assistant for Vanta Wireless.
Generate a short reply (2-3 sentences max) acknowledging the incoming message.
- Be warm but professional. Write as if from a busy executive.
- For INTRO: Thank the sender, confirm you'll follow up with the introduced person.
- For INVESTMENT: Acknowledge receipt, signal thoughtful engagement.
- For DECISION: Confirm you're reviewing and will respond with next steps.
- Never promise specific timelines. Never use exclamation marks.
- Do NOT use greetings like "Hi" or "Hey" — start directly.
- Return ONLY the reply text, no JSON, no quotes, no formatting.`;

  try {
    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Signal type: ${signalType}\nSender: ${sender}\nOriginal message: ${message}\nAI summary: ${summary}\n\nWrite the reply:` },
        ],
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      console.error("AI reply generation failed:", await res.text());
      return FALLBACK_TEMPLATES[signalType] || "";
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || FALLBACK_TEMPLATES[signalType] || "";
  } catch (err) {
    console.error("Reply generation error:", err);
    return FALLBACK_TEMPLATES[signalType] || "";
  }
}

// ─── Send via Linq (supports chat threading) ────────────────────────────────

async function sendLinqReply(
  toNumber: string,
  message: string,
  chatId?: string | null
): Promise<{ success: boolean; error?: string }> {
  const linqApiKey = Deno.env.get("LINQ_PARTNER_API_KEY");
  const fromNumber = Deno.env.get("LINQ_FROM_NUMBER");

  if (!linqApiKey || !fromNumber) {
    console.error("LINQ_PARTNER_API_KEY or LINQ_FROM_NUMBER not configured");
    return { success: false, error: "Linq send not configured" };
  }

  try {
    // If we have a chatId, send to existing chat thread
    const url = chatId
      ? `${LINQ_API_URL}/${chatId}/messages`
      : LINQ_API_URL;

    const body = chatId
      ? { message: { parts: [{ type: "text", value: message }] } }
      : { from: fromNumber, to: [toNumber], message: { parts: [{ type: "text", value: message }] } };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${linqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error(`Linq send error [${res.status}]:`, responseText);
      return { success: false, error: `Linq API ${res.status}` };
    }

    console.log("Reply sent to:", chatId || toNumber);
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
    const rawBody = await req.text();

    // ── Auth: prefer HMAC signature, fall back to token ──
    const signingSecret = Deno.env.get("LINQ_WEBHOOK_SIGNING_SECRET");
    const webhookSignature = req.headers.get("x-webhook-signature");
    const webhookTimestamp = req.headers.get("x-webhook-timestamp");

    if (signingSecret && webhookSignature && webhookTimestamp) {
      // Reject stale webhooks (>5 min)
      const age = Math.abs(Date.now() / 1000 - parseInt(webhookTimestamp));
      if (age > 300) {
        console.error("Webhook timestamp too old:", age, "seconds");
        return new Response(JSON.stringify({ error: "Stale webhook" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const valid = await verifyWebhookSignature(signingSecret, rawBody, webhookTimestamp, webhookSignature);
      if (!valid) {
        console.error("Webhook signature verification failed");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // No HMAC headers — accept any request with a Supabase key or Linq token
      // Production traffic will always have HMAC headers from the registered webhook
      const linqToken = Deno.env.get("LINQ_API_TOKEN");
      const authHeader = req.headers.get("x-linq-signature") || new URL(req.url).searchParams.get("token");
      const bearerToken = req.headers.get("authorization")?.replace("Bearer ", "");
      const apikeyHeader = req.headers.get("apikey");

      // Accept if: linq token matches, OR any supabase key is present, OR no token configured
      const hasLinqToken = linqToken && authHeader === linqToken;
      const hasSupabaseKey = bearerToken || apikeyHeader;
      
      if (!hasLinqToken && !hasSupabaseKey && linqToken) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = JSON.parse(rawBody);
    console.log("Webhook event:", payload.event_type || "legacy", payload.event_id || "no-event-id");

    // Parse the payload (handles v3 2026-02-03, v3 2025-01-01, and legacy formats)
    const parsed = parseLinqPayload(payload);

    if (!parsed) {
      // Non-message event or empty — acknowledge silently
      return new Response(JSON.stringify({ skipped: true, reason: "not a processable message event" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // ── Deduplication: check event_id ──
    if (parsed.eventId) {
      const { data: existing } = await supabase
        .from("signals")
        .select("id")
        .eq("linq_message_id", parsed.eventId)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log("Duplicate event, skipping:", parsed.eventId);
        return new Response(JSON.stringify({ skipped: true, reason: "duplicate event" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 1. Classify
    const classification = await classifySignal(parsed.body, parsed.sender, lovableApiKey);

    if (classification.signalType === "NOISE") {
      return new Response(JSON.stringify({ skipped: true, reason: "NOISE", sender: parsed.sender }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Insert signal
    const { data, error } = await supabase.from("signals").insert({
      sender: parsed.sender,
      source_message: parsed.body,
      signal_type: classification.signalType,
      priority: classification.priority,
      summary: classification.summary,
      actions_taken: classification.actionsTaken,
      status: "Captured",
      linq_message_id: parsed.eventId || parsed.messageId || null,
      raw_payload: parsed.rawPayload,
      captured_at: parsed.timestamp,
    }).select().single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Signal created:", data.id, classification.signalType, classification.priority);

    const result: Record<string, unknown> = {
      id: data.id,
      signalType: classification.signalType,
      priority: classification.priority,
    };

    // 3. Auto-reply if triggered
    if (shouldAutoReply(classification.signalType, classification.priority) && parsed.senderHandle) {
      const replyText = await generateReply(
        classification.signalType, parsed.sender, parsed.body, classification.summary, lovableApiKey
      );

      if (replyText) {
        const sendResult = await sendLinqReply(parsed.senderHandle, replyText, parsed.chatId);
        result.autoReply = { sent: sendResult.success, to: parsed.senderHandle, chatId: parsed.chatId, error: sendResult.error };

        if (sendResult.success) {
          await supabase.from("signals").update({
            status: "In Progress",
            actions_taken: [...classification.actionsTaken, "AUTO_REPLY_SENT"],
          }).eq("id", data.id);
        }
      }
    }

    return new Response(JSON.stringify({ processed: 1, results: [result] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
