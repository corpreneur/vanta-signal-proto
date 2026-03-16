import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contact_name } = await req.json();
    if (!contact_name) {
      return new Response(JSON.stringify({ error: "contact_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check cache (briefs < 7 days old)
    const { data: cached } = await supabase
      .from("relationship_briefs")
      .select("*")
      .eq("contact_name", contact_name)
      .gte("generated_at", new Date(Date.now() - 7 * 86400000).toISOString())
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ brief: cached.brief_text, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch signals for this contact
    const { data: signals } = await supabase
      .from("signals")
      .select("signal_type, summary, priority, captured_at, source, actions_taken")
      .eq("sender", contact_name)
      .order("captured_at", { ascending: false })
      .limit(50);

    if (!signals || signals.length === 0) {
      return new Response(JSON.stringify({ brief: "No signal history found for this contact.", cached: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signalSummary = signals.map((s) =>
      `[${s.captured_at}] ${s.signal_type} (${s.priority}) via ${s.source}: ${s.summary}`
    ).join("\n");

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a relationship intelligence analyst. Given a history of signals (interactions) with a contact, write a concise narrative brief answering "Why am I talking to this person?" Include: how the relationship started (earliest signals), key topics and themes, recent context, and why they matter to the user's professional network. Keep it under 200 words, conversational but professional.`,
          },
          {
            role: "user",
            content: `Contact: ${contact_name}\n\nSignal History (${signals.length} signals):\n${signalSummary}`,
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`AI call failed: ${res.status}`);
    const data = await res.json();
    const briefText = data.choices?.[0]?.message?.content || "Unable to generate brief.";

    // Cache the brief
    await supabase.from("relationship_briefs").insert({
      contact_name,
      brief_text: briefText,
    });

    return new Response(JSON.stringify({ brief: briefText, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("relationship-brief error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
