const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LINQ_API_URL = "https://api.linqapp.com/api/partner/v3/chats";

interface SendRequest {
  to: string | string[];
  message: string;
}

/** Strip to E.164: remove spaces, dashes, parens — keep leading + */
function toE164(phone: string): string {
  return phone.replace(/[\s\-().]/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const linqApiKey = Deno.env.get("LINQ_PARTNER_API_KEY");
    if (!linqApiKey) {
      throw new Error("LINQ_PARTNER_API_KEY is not configured");
    }

    const fromNumber = Deno.env.get("LINQ_FROM_NUMBER");
    if (!fromNumber) {
      throw new Error("LINQ_FROM_NUMBER is not configured");
    }

    const body: SendRequest = await req.json();
    const recipients = (Array.isArray(body.to) ? body.to : [body.to]).map(toE164);

    if (!body.message || body.message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message body is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one recipient is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const linqPayload = {
      from: fromNumber,
      to: recipients,
      message: {
        parts: [
          {
            type: "text",
            value: body.message,
          },
        ],
      },
    };

    console.log("Sending Linq message to:", recipients);

    const res = await fetch(LINQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${linqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(linqPayload),
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error(`Linq API error [${res.status}]:`, responseText);
      return new Response(
        JSON.stringify({ error: `Linq API error`, status: res.status, detail: responseText }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    console.log("Linq message sent successfully:", responseData);

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Send message error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
