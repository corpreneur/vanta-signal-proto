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
  isGroupChat: boolean;
  participants: string[]; // all handles in the chat
}

// ─── Auto-reply config ──────────────────────────────────────────────────────

const NOTIFY_NUMBER = "+18326510238";

const FALLBACK_TEMPLATES: Record<string, string> = {
  INTRO: "Thank you for the introduction. I've noted this and will follow up shortly to schedule a conversation.",
  INSIGHT: "Noted — this is a valuable insight. I've captured it and will incorporate it into my thinking.",
  INVESTMENT: "Received — I've logged this on the investment side and will circle back with thoughts shortly.",
  DECISION: "Got it. I'm reviewing this now and will respond with a decision or next steps soon.",
  CONTEXT: "Appreciated — I've logged this context for reference.",
};

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

// ─── Check if sender is our own number (loop prevention for group chats) ───

function isSelfMessage(senderHandle: string): boolean {
  const rawFrom = Deno.env.get("LINQ_FROM_NUMBER");
  if (!rawFrom) return false;
  const ownNumber = toE164(rawFrom);
  const senderNormalized = toE164(senderHandle);
  return ownNumber === senderNormalized;
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

    // Extract group chat metadata
    const chatMembers = chat?.members as Array<Record<string, unknown>> | undefined;
    const chatType = chat?.type ? String(chat.type) : null;
    const isGroupChat = chatType === "group" || (chatMembers ? chatMembers.length > 2 : false);
    const participants = (chatMembers || [])
      .map((m) => String(m.handle || m.phone || ""))
      .filter(Boolean);

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
      isGroupChat,
      participants,
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
    isGroupChat: false,
    participants: [],
  };
}

// ─── AI: Classify signal ────────────────────────────────────────────────────

async function classifySignal(message: string, sender: string, apiKey: string, isGroupChat: boolean, participants: string[]): Promise<Classification> {
  const groupContext = isGroupChat
    ? `\nThis message is from a GROUP CHAT with ${participants.length} participants: ${participants.join(", ")}. Consider group dynamics — the signal may reference shared context among participants.`
    : "";

  const systemPrompt = `You are a signal classifier for an executive intelligence system called Vanta Wireless.
You receive raw messages from an executive's messaging platform and must classify them.${groupContext}

Return ONLY valid JSON with these fields:
- signalType: one of "INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT", "NOISE"
- priority: one of "high", "medium", "low"
- summary: A 1-3 sentence intelligence briefing of the message's significance (write in third person, professional tone)${isGroupChat ? ". Include the sender's identity and group context in the summary." : ""}
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

// ─── Fetch context for reply generation ─────────────────────────────────────

interface ReplyContext {
  recentMessages: Array<{ sender: string; body: string; signal_type: string; captured_at: string }>;
  senderHistory: { totalSignals: number; signalTypes: Record<string, number>; firstSeen: string };
  persona: string | null;
}

async function fetchReplyContext(
  supabase: ReturnType<typeof createClient>,
  sender: string,
  chatId: string | null
): Promise<ReplyContext> {
  // Fetch persona from system_settings
  const { data: personaRow } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "reply_persona")
    .single();

  // Fetch recent messages from same chat or sender (last 8)
  let recentQuery = supabase
    .from("signals")
    .select("sender, source_message, signal_type, captured_at")
    .order("captured_at", { ascending: false })
    .limit(8);

  if (chatId) {
    // For group chats, get recent messages from same chat thread
    recentQuery = recentQuery.contains("raw_payload", { _vanta_chat_id: chatId });
  } else {
    recentQuery = recentQuery.eq("sender", sender);
  }

  const { data: recentRows } = await recentQuery;

  // Fetch sender relationship history
  const { data: senderRows } = await supabase
    .from("signals")
    .select("signal_type, captured_at")
    .eq("sender", sender)
    .order("captured_at", { ascending: true });

  const signalTypes: Record<string, number> = {};
  (senderRows || []).forEach((r) => {
    signalTypes[r.signal_type] = (signalTypes[r.signal_type] || 0) + 1;
  });

  return {
    recentMessages: (recentRows || []).map((r) => ({
      sender: r.sender,
      body: r.source_message,
      signal_type: r.signal_type,
      captured_at: r.captured_at,
    })),
    senderHistory: {
      totalSignals: senderRows?.length || 0,
      signalTypes,
      firstSeen: senderRows?.[0]?.captured_at || new Date().toISOString(),
    },
    persona: typeof personaRow?.value === "string" ? personaRow.value : null,
  };
}

// ─── AI: Generate reply ─────────────────────────────────────────────────────

async function generateReply(
  signalType: string,
  sender: string,
  message: string,
  summary: string,
  apiKey: string,
  isGroupChat: boolean,
  context: ReplyContext
): Promise<string> {
  const groupInstruction = isGroupChat
    ? "\n- This is a GROUP CHAT. Address the sender by first name. Keep reply brief."
    : "";

  // Build conversation history block
  const historyBlock = context.recentMessages.length > 0
    ? `\n\nRecent conversation history (newest first):\n${context.recentMessages
        .map((m) => `- [${m.signal_type}] ${m.sender}: "${m.body.slice(0, 120)}"`)
        .join("\n")}`
    : "";

  // Build sender relationship block
  const relationshipBlock = context.senderHistory.totalSignals > 1
    ? `\n\nSender profile: ${sender} has sent ${context.senderHistory.totalSignals} signals since ${new Date(context.senderHistory.firstSeen).toLocaleDateString()}. Signal breakdown: ${Object.entries(context.senderHistory.signalTypes).map(([t, c]) => `${t}(${c})`).join(", ")}.`
    : `\n\nThis is a new contact — first message from ${sender}.`;

  // Use stored persona or fallback
  const personaPrompt = context.persona || `You are a concise, professional executive AI. Generate a 1-2 sentence reply. Never start with "Thank you for sharing." Vary your style.`;

  const systemPrompt = `${personaPrompt}${groupInstruction}

Context rules:
- For INTRO: Acknowledge the introduction with genuine interest, confirm follow-up.
- For INVESTMENT: Show engagement with the specific thesis or deal, not generic acknowledgment.
- For DECISION: Reference what the decision is about, confirm review.
- For INSIGHT: Engage with the actual idea — push back gently, build on it, or ask a sharp question.
- For CONTEXT: Brief acknowledgment that references the specific content.
- Never promise specific timelines. Never use exclamation marks.
- Do NOT use greetings like "Hi" or "Hey" — start directly.
- Return ONLY the reply text, no JSON, no quotes, no formatting.${historyBlock}${relationshipBlock}`;

  try {
    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Signal type: ${signalType}\nSender: ${sender}\nOriginal message: ${message}\nAI summary: ${summary}\n\nWrite the reply:` },
        ],
        temperature: 0.6,
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

// ─── Normalize to E.164 ─────────────────────────────────────────────────────

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("1") ? `+${digits}` : `+1${digits}`;
}

// ─── Send via Linq (supports chat threading) ────────────────────────────────

async function sendLinqReply(
  toNumber: string,
  message: string,
  chatId?: string | null
): Promise<{ success: boolean; error?: string }> {
  const linqApiKey = Deno.env.get("LINQ_PARTNER_API_KEY");
  const rawFrom = Deno.env.get("LINQ_FROM_NUMBER");

  if (!linqApiKey || !rawFrom) {
    console.error("LINQ_PARTNER_API_KEY or LINQ_FROM_NUMBER not configured");
    return { success: false, error: "Linq send not configured" };
  }

  const fromNumber = toE164(rawFrom);
  const normalizedTo = toE164(toNumber);

  try {
    // If we have a chatId, send to existing chat thread (works for both 1:1 and group)
    const url = chatId
      ? `${LINQ_API_URL}/${chatId}/messages`
      : LINQ_API_URL;

    const body = chatId
      ? { message: { parts: [{ type: "text", value: message }] } }
      : { from: fromNumber, to: [normalizedTo], message: { parts: [{ type: "text", value: message }] } };

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

    // ── Auth: verify HMAC signature when present ──
    const signingSecret = Deno.env.get("LINQ_WEBHOOK_SIGNING_SECRET");
    const webhookSignature = req.headers.get("x-webhook-signature");
    const webhookTimestamp = req.headers.get("x-webhook-timestamp");

    if (webhookSignature && webhookTimestamp && signingSecret) {
      // Signature verification temporarily in log-only mode
      const age = Math.abs(Date.now() / 1000 - parseInt(webhookTimestamp));
      const valid = age <= 300 && await verifyWebhookSignature(signingSecret, rawBody, webhookTimestamp, webhookSignature);
      if (valid) {
        console.log("HMAC signature verified");
      } else {
        console.warn("HMAC signature mismatch — allowing through (debug mode). Age:", age);
      }
    }
    // When no HMAC headers: allow through (for internal testing / legacy)
    // Production Linq webhooks always include HMAC headers

    const payload = JSON.parse(rawBody);
    console.log("Webhook event:", payload.event_type || "legacy", payload.event_id || "no-event-id");

    // Parse the payload (handles v3 2026-02-03, legacy formats, and group chats)
    const parsed = parseLinqPayload(payload);

    if (!parsed) {
      // Non-message event or empty — acknowledge silently
      return new Response(JSON.stringify({ skipped: true, reason: "not a processable message event" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Self-message filter: skip messages from our own number (prevents loops in group chats) ──
    if (isSelfMessage(parsed.senderHandle)) {
      console.log("Skipping self-message from own number:", parsed.senderHandle);
      return new Response(JSON.stringify({ skipped: true, reason: "self-message filtered" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (parsed.isGroupChat) {
      console.log(`Group chat detected — chatId: ${parsed.chatId}, participants: ${parsed.participants.length}`);
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

    // 1. Classify with AI (group context passed for better classification)
    const classification = await classifySignal(parsed.body, parsed.sender, lovableApiKey, parsed.isGroupChat, parsed.participants);
    console.log("AI classification:", classification.signalType, classification.priority, parsed.isGroupChat ? "(group)" : "(1:1)");

    // 2. Insert signal (with group chat metadata in raw_payload)
    const signalPayload: Record<string, unknown> = {
      sender: parsed.sender,
      source_message: parsed.body,
      signal_type: classification.signalType,
      priority: classification.priority,
      summary: classification.summary,
      actions_taken: classification.actionsTaken,
      status: "Captured",
      linq_message_id: parsed.eventId || parsed.messageId || null,
      raw_payload: {
        ...parsed.rawPayload,
        _vanta_group_chat: parsed.isGroupChat,
        _vanta_chat_id: parsed.chatId,
        _vanta_participants: parsed.participants,
      },
      captured_at: parsed.timestamp,
    };

    const { data, error } = await supabase.from("signals").insert(signalPayload).select().single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Signal created:", data.id);

    const result: Record<string, unknown> = {
      id: data.id,
      signalType: classification.signalType,
      priority: classification.priority,
      isGroupChat: parsed.isGroupChat,
    };

    // 3. Auto-reply (AI-generated for non-NOISE signals)
    // Check group auto-reply setting before replying in group chats
    let shouldAutoReply = parsed.senderHandle && classification.signalType !== "NOISE";

    if (shouldAutoReply && parsed.isGroupChat) {
      const { data: settingRow } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "group_autoreply_enabled")
        .single();

      const groupAutoReplyEnabled = settingRow?.value === true;
      if (!groupAutoReplyEnabled) {
        console.log("Group auto-reply disabled — skipping reply for group chat");
        shouldAutoReply = false;
        result.autoReply = { sent: false, reason: "group_autoreply_disabled" };
      }
    }

    if (shouldAutoReply) {
      // Fetch conversation history, sender memory, and persona config
      const replyContext = await fetchReplyContext(supabase, parsed.sender, parsed.chatId);
      const replyText = await generateReply(classification.signalType, parsed.sender, parsed.body, classification.summary, lovableApiKey, parsed.isGroupChat, replyContext);

      // Group chats: always reply into the thread (chatId). 1:1: fall back to direct send.
      const sendResult = await sendLinqReply(parsed.senderHandle, replyText, parsed.chatId);
      result.autoReply = { sent: sendResult.success, to: parsed.isGroupChat ? `group:${parsed.chatId}` : parsed.senderHandle, error: sendResult.error };

      if (sendResult.success) {
        await supabase.from("signals").update({
          status: "In Progress",
          actions_taken: [...classification.actionsTaken, "AUTO_REPLY_SENT"],
        }).eq("id", data.id);
      }
    }

    // 4. Notify owner at NOTIFY_NUMBER
    const groupLabel = parsed.isGroupChat ? ` [GROUP: ${parsed.participants.length} members]` : "";
    const notifyText = `[SIGNAL] ${classification.signalType} / ${classification.priority}${groupLabel}\nFrom: ${parsed.sender}\n${classification.summary}`;
    const notifyResult = await sendLinqReply(NOTIFY_NUMBER, notifyText);
    result.notification = { sent: notifyResult.success, error: notifyResult.error };

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
