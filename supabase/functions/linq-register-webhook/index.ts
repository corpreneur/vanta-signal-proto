const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LINQ_API_URL = "https://api.linqapp.com/api/partner/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const linqApiKey = Deno.env.get("LINQ_PARTNER_API_KEY");
    if (!linqApiKey) throw new Error("LINQ_PARTNER_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("SUPABASE_URL not configured");

    const body = await req.json().catch(() => ({}));
    const action = body.action || "register"; // "register", "list", "delete"

    // ── List existing subscriptions ──
    if (action === "list") {
      const res = await fetch(`${LINQ_API_URL}/webhook-subscriptions`, {
        headers: { Authorization: `Bearer ${linqApiKey}` },
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Delete a subscription ──
    if (action === "delete") {
      const subscriptionId = body.subscriptionId;
      if (!subscriptionId) {
        return new Response(JSON.stringify({ error: "subscriptionId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetch(`${LINQ_API_URL}/webhook-subscriptions/${subscriptionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${linqApiKey}` },
      });
      return new Response(JSON.stringify({ deleted: res.ok, status: res.status }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Register new webhook subscription ──
    const webhookUrl = `${supabaseUrl}/functions/v1/linq-webhook`;

    const subscribedEvents = body.events || [
      "message.received",
      "message.sent",
      "message.delivered",
      "message.read",
      "message.failed",
    ];

    console.log("Registering webhook:", webhookUrl, "events:", subscribedEvents);

    const res = await fetch(`${LINQ_API_URL}/webhook-subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${linqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target_url: webhookUrl,
        subscribed_events: subscribedEvents,
      }),
    });

    const responseText = await res.text();
    if (!res.ok) {
      console.error(`Linq register error [${res.status}]:`, responseText);
      return new Response(
        JSON.stringify({ error: `Linq API error`, status: res.status, detail: responseText }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(responseText);
    console.log("Webhook registered! Subscription ID:", data.id);

    // IMPORTANT: The signing_secret is ONLY returned on creation.
    // Store it immediately — it cannot be retrieved again.
    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: data.id,
        targetUrl: data.target_url,
        subscribedEvents: data.subscribed_events,
        signingSecret: data.signing_secret,
        isActive: data.is_active,
        message: "⚠️ IMPORTANT: Save the signing_secret above immediately. It cannot be retrieved again. Update your LINQ_WEBHOOK_SIGNING_SECRET with this value.",
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Register webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
