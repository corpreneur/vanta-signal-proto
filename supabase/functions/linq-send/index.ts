const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LINQ_API_URL = "https://api.linqapp.com/api/partner/v3/chats";

interface SendRequest {
  to: string | string[];
  message: string;
  chatId?: string;
  media?: Array<{ url: string; content_type?: string }>;
}

/** Strip to E.164: remove spaces, dashes, parens — keep leading + */
function toE164(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return digits.startsWith("1") && digits.length === 11 ? `+${digits}` : `+1${digits}`;
}

function buildParts(message: string, media?: Array<{ url: string; content_type?: string }>): Array<Record<string, unknown>> {
  const parts: Array<Record<string, unknown>> = [{ type: "text", value: message.trim() }];
  if (media?.length) {
    for (const m of media) {
      parts.push({ type: "media", url: m.url, ...(m.content_type ? { content_type: m.content_type } : {}) });
    }
  }
  return parts;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const linqApiKey = Deno.env.get("LINQ_PARTNER_API_KEY");
    if (!linqApiKey) throw new Error("LINQ_PARTNER_API_KEY is not configured");

    const rawFromNumber = Deno.env.get("LINQ_FROM_NUMBER");
    if (!rawFromNumber) throw new Error("LINQ_FROM_NUMBER is not configured");
    const fromNumber = toE164(rawFromNumber);

    const body: SendRequest = await req.json();

    if (!body.message || body.message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message body is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parts = buildParts(body.message, body.media);

    // If chatId provided, send to existing conversation thread
    if (body.chatId) {
      console.log("Sending to existing chat:", body.chatId);

      const res = await fetch(`${LINQ_API_URL}/${body.chatId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${linqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: { parts } }),
      });

      const responseText = await res.text();
      if (!res.ok) {
        console.error(`Linq chat send error [${res.status}]:`, responseText);
        return new Response(
          JSON.stringify({ error: `Linq API error`, status: res.status, detail: responseText }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let responseData;
      try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }
      return new Response(
        JSON.stringify({ success: true, data: responseData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // New chat: requires recipients
    const recipients = (Array.isArray(body.to) ? body.to : [body.to]).map(toE164);

    if (recipients.length === 0 || !recipients[0]) {
      return new Response(
        JSON.stringify({ error: "At least one recipient is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending new chat to:", recipients);

    const res = await fetch(LINQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${linqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromNumber,
        to: recipients,
        message: { parts },
      }),
    });

    const responseText = await res.text();
    if (!res.ok) {
      console.error(`Linq send error [${res.status}]:`, responseText);
      return new Response(
        JSON.stringify({ error: `Linq API error`, status: res.status, detail: responseText }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let responseData;
    try { responseData = JSON.parse(responseText); } catch { responseData = { raw: responseText }; }
    console.log("Message sent successfully:", responseData);

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Send error:", err);
    const { logError } = await import("../_shared/log-error.ts");
    await logError("linq-send", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
