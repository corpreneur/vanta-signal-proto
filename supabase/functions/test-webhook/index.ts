const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const linqToken = Deno.env.get("LINQ_API_TOKEN")!;

  const testPayload = {
    sender: "Test User — Pipeline Check",
    body: "Hey, I wanted to introduce you to Sarah Chen — she's the CTO at Meridian Labs and has been doing incredible work on autonomous drone logistics. I think you two would really hit it off given your work on the infrastructure side. Want me to set up a call?",
    id: "test-e2e-001",
    timestamp: new Date().toISOString(),
  };

  const res = await fetch(`${supabaseUrl}/functions/v1/linq-webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-linq-signature": linqToken,
    },
    body: JSON.stringify(testPayload),
  });

  const result = await res.text();

  return new Response(
    JSON.stringify({ status: res.status, result: JSON.parse(result) }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
