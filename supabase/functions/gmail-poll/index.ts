import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GMAIL_API_URL = "https://www.googleapis.com/gmail/v1/users/me";
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Classification {
  signalType: string;
  priority: string;
  summary: string;
  actionsTaken: string[];
  confidence?: number;
}

interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  cc: string;
  date: string;
  snippet: string;
  body: string;
}

// ─── Gmail OAuth: get access token from refresh token ───────────────────────

async function getAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OAuth token refresh failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ─── Gmail: list recent messages ────────────────────────────────────────────

async function listRecentMessages(
  accessToken: string,
  afterTimestamp: number
): Promise<string[]> {
  // Gmail uses seconds since epoch for after: query
  const afterSec = Math.floor(afterTimestamp / 1000);
  const query = `in:inbox after:${afterSec}`;

  const res = await fetch(
    `${GMAIL_API_URL}/messages?q=${encodeURIComponent(query)}&maxResults=20`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail list error [${res.status}]: ${err}`);
  }

  const data = await res.json();
  return (data.messages || []).map((m: { id: string }) => m.id);
}

// ─── Gmail: get full message ────────────────────────────────────────────────

async function getMessageDetails(
  accessToken: string,
  messageId: string
): Promise<EmailMessage> {
  const res = await fetch(
    `${GMAIL_API_URL}/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail get error [${res.status}]: ${err}`);
  }

  const data = await res.json();
  const headers = data.payload?.headers || [];

  const getHeader = (name: string) =>
    headers.find((h: { name: string; value: string }) =>
      h.name.toLowerCase() === name.toLowerCase()
    )?.value || "";

  // Extract body text
  let body = "";
  const extractText = (part: Record<string, unknown>): string => {
    if (part.mimeType === "text/plain" && part.body && (part.body as Record<string, unknown>).data) {
      return atob(
        ((part.body as Record<string, unknown>).data as string)
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      );
    }
    if (part.parts) {
      return (part.parts as Record<string, unknown>[]).map(extractText).join("\n");
    }
    return "";
  };

  body = extractText(data.payload || {});

  // Trim body to a reasonable length for classification
  if (body.length > 3000) {
    body = body.substring(0, 3000) + "\n[...truncated]";
  }

  return {
    id: data.id,
    threadId: data.threadId,
    subject: getHeader("Subject"),
    from: getHeader("From"),
    to: getHeader("To"),
    cc: getHeader("Cc"),
    date: getHeader("Date"),
    snippet: data.snippet || "",
    body,
  };
}

// ─── AI: Classify email signal ──────────────────────────────────────────────

async function classifyEmailSignal(
  email: EmailMessage,
  apiKey: string
): Promise<Classification> {
  const systemPrompt = `You are a signal classifier for an executive intelligence system called Vanta Wireless.
You receive emails from an executive's inbox and must classify them.

Return ONLY valid JSON with these fields:
- signalType: one of "INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT", "NOISE"
- priority: one of "high", "medium", "low"
- summary: A 1-3 sentence intelligence briefing of the email's significance (write in third person, professional tone)
- actionsTaken: array of action codes. Choose from: "BIO_RESEARCH", "MEETING_PREP", "EMAIL_DRAFT", "AGENT_BUILD", "FRAMEWORK_EXTRACT", "NOTION_LOG", "THESIS_ANALYSIS", "CALENDAR_HOLD", "BRIEF_COMPILE"

Classification rules:
- INTRO: Someone is introducing a person or making a connection. High priority if the person is senior/notable.
- INSIGHT: A strategic or philosophical insight worth capturing.
- INVESTMENT: Anything related to fundraising, investors, valuations, term sheets, pitch decks.
- DECISION: A decision point requiring action or response.
- CONTEXT: Background information, follow-ups, additional detail.
- NOISE: Newsletters, marketing, automated notifications, receipts, spam, casual logistics.

Email-specific guidance:
- Forwarded intros ("FYI — looping you in with...") are INTRO signals.
- Calendar invites with notable attendees are DECISION signals.
- Investment memos, term sheets, cap tables are INVESTMENT signals.
- Marketing emails, SaaS notifications, receipts are NOISE.
- Be aggressive about filtering NOISE — most inbox email is noise.

Action rules:
- INTRO: BIO_RESEARCH, MEETING_PREP, EMAIL_DRAFT, optionally AGENT_BUILD for high priority
- INSIGHT: FRAMEWORK_EXTRACT, NOTION_LOG
- INVESTMENT: THESIS_ANALYSIS, NOTION_LOG
- DECISION: NOTION_LOG, optionally BRIEF_COMPILE
- CONTEXT: NOTION_LOG
- NOISE: empty array []

Also return:
- confidence: a number from 0.0 to 1.0 indicating how certain you are about the classification. 1.0 = highly certain, 0.5 = uncertain.`;

  const userContent = `From: ${email.from}
To: ${email.to}
CC: ${email.cc}
Subject: ${email.subject}
Date: ${email.date}

Body:
${email.body || email.snippet}`;

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    console.error("AI classification failed:", await res.text());
    return { signalType: "CONTEXT", priority: "low", summary: `Unclassified email from ${email.from}.`, actionsTaken: ["NOTION_LOG"], confidence: 0.0 };
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    console.error("Failed to parse AI classification:", content);
    return { signalType: "CONTEXT", priority: "low", summary: `Unclassified email from ${email.from}.`, actionsTaken: ["NOTION_LOG"], confidence: 0.0 };
  }
}

// ─── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Required secrets
    const clientId = Deno.env.get("GMAIL_CLIENT_ID");
    const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
    const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!clientId || !clientSecret || !refreshToken) {
      return new Response(
        JSON.stringify({ error: "Gmail OAuth credentials not configured. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Determine polling window: look back from last captured Gmail signal, or default 5 min
    const { data: lastSignal } = await supabase
      .from("signals")
      .select("captured_at")
      .eq("source", "gmail")
      .order("captured_at", { ascending: false })
      .limit(1);

    const defaultLookback = 5 * 60 * 1000; // 5 minutes
    const afterTimestamp = lastSignal?.[0]
      ? new Date(lastSignal[0].captured_at).getTime()
      : Date.now() - defaultLookback;

    console.log("Polling Gmail for messages after:", new Date(afterTimestamp).toISOString());

    // 1. Get access token
    const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);

    // 2. List recent messages
    const messageIds = await listRecentMessages(accessToken, afterTimestamp);
    console.log("Found", messageIds.length, "messages to process");

    if (messageIds.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No new emails" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Process each message
    const results = [];
    let processed = 0;
    let skippedNoise = 0;
    let skippedDuplicate = 0;

    for (const msgId of messageIds) {
      try {
        // Dedup check
        const { data: existing } = await supabase
          .from("signals")
          .select("id")
          .eq("linq_message_id", `gmail:${msgId}`)
          .limit(1);

        if (existing && existing.length > 0) {
          skippedDuplicate++;
          continue;
        }

        // Get full message
        const email = await getMessageDetails(accessToken, msgId);

        // Classify
        const classification = await classifyEmailSignal(email, lovableApiKey);

        if (classification.signalType === "NOISE") {
          skippedNoise++;
          continue;
        }

        // Extract sender name from "Name <email>" format
        const senderMatch = email.from.match(/^(.+?)\s*<(.+?)>$/);
        const senderName = senderMatch ? senderMatch[1].replace(/"/g, "").trim() : email.from;

        // Insert signal
        const { data, error } = await supabase.from("signals").insert({
          sender: senderName,
          source_message: `[${email.subject}] ${email.body || email.snippet}`.substring(0, 5000),
          signal_type: classification.signalType,
          priority: classification.priority,
          summary: classification.summary,
          actions_taken: classification.actionsTaken,
          status: "Captured",
          source: "gmail",
          linq_message_id: `gmail:${msgId}`,
          email_metadata: {
            subject: email.subject,
            from: email.from,
            to: email.to,
            cc: email.cc,
            thread_id: email.threadId,
            date: email.date,
          },
          captured_at: email.date ? new Date(email.date).toISOString() : new Date().toISOString(),
        }).select().single();

        if (error) {
          console.error("Insert error for", msgId, ":", error.message);
          continue;
        }

        console.log("Signal created:", data.id, classification.signalType, classification.priority, "from:", senderName);
        results.push({
          id: data.id,
          signalType: classification.signalType,
          priority: classification.priority,
          sender: senderName,
          subject: email.subject,
        });
        processed++;
      } catch (err) {
        console.error("Error processing message", msgId, ":", err);
      }
    }

    return new Response(
      JSON.stringify({
        processed,
        skippedNoise,
        skippedDuplicate,
        total: messageIds.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Gmail poll error:", err);
    const { logError } = await import("../_shared/log-error.ts");
    await logError("gmail-poll", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
