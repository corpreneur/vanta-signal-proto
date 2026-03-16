import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function daysBetween(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function computeStrength(signalCount: number, highPriority: number, daysSinceLast: number): number {
  const freqScore = Math.min(30, (Math.log2(signalCount + 1) / Math.log2(50)) * 30);
  const recencyScore = Math.max(0, 25 * Math.exp(-daysSinceLast / 14));
  const priorityRatio = signalCount > 0 ? highPriority / signalCount : 0;
  const priorityScore = priorityRatio * 15;
  return Math.min(100, Math.max(0, Math.round(freqScore + recencyScore + priorityScore)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all signals from last 90 days
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
    const { data: signals } = await supabase
      .from("signals")
      .select("sender, priority, captured_at, signal_type")
      .gte("captured_at", cutoff)
      .neq("signal_type", "NOISE");

    if (!signals || signals.length === 0) {
      return new Response(JSON.stringify({ alerts: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build contact strength map
    const contacts = new Map<string, { count: number; high: number; last: string }>();
    for (const s of signals) {
      const existing = contacts.get(s.sender);
      if (!existing) {
        contacts.set(s.sender, { count: 1, high: s.priority === "high" ? 1 : 0, last: s.captured_at });
      } else {
        existing.count++;
        if (s.priority === "high") existing.high++;
        if (new Date(s.captured_at) > new Date(existing.last)) existing.last = s.captured_at;
      }
    }

    // Check existing undismissed alerts to avoid duplicates
    const { data: existingAlerts } = await supabase
      .from("relationship_alerts")
      .select("contact_name")
      .eq("dismissed", false)
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

    const alreadyAlerted = new Set((existingAlerts || []).map((a: any) => a.contact_name));

    let alertCount = 0;
    for (const [name, data] of contacts) {
      if (alreadyAlerted.has(name)) continue;
      const strength = computeStrength(data.count, data.high, daysBetween(data.last));
      // Alert if strength dropped below 25 (Cold) and they had at least 3 signals
      if (strength < 25 && data.count >= 3) {
        await supabase.from("relationship_alerts").insert({
          contact_name: name,
          alert_type: "cooling",
          previous_strength: Math.min(100, strength + 15), // estimate previous
          current_strength: strength,
        });
        alertCount++;
      }
    }

    return new Response(JSON.stringify({ alerts: alertCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cooling-alerts error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
