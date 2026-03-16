import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all corrections
    const { data: corrections } = await supabase
      .from("signal_corrections")
      .select("*")
      .order("corrected_at", { ascending: false })
      .limit(100);

    if (!corrections || corrections.length === 0) {
      return new Response(JSON.stringify({ profile: null, count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a preference profile from corrections
    const typeMappings: Record<string, Record<string, number>> = {};
    const priorityMappings: Record<string, Record<string, number>> = {};

    for (const c of corrections) {
      if (c.corrected_type && c.corrected_type !== c.original_type) {
        if (!typeMappings[c.original_type]) typeMappings[c.original_type] = {};
        typeMappings[c.original_type][c.corrected_type] = (typeMappings[c.original_type][c.corrected_type] || 0) + 1;
      }
      if (c.corrected_priority && c.corrected_priority !== c.original_priority) {
        if (!priorityMappings[c.original_priority]) priorityMappings[c.original_priority] = {};
        priorityMappings[c.original_priority][c.corrected_priority] = (priorityMappings[c.original_priority][c.corrected_priority] || 0) + 1;
      }
    }

    // Generate few-shot examples from recent corrections
    const fewShotExamples = corrections.slice(0, 10).map((c) => ({
      original_type: c.original_type,
      corrected_type: c.corrected_type || c.original_type,
      original_priority: c.original_priority,
      corrected_priority: c.corrected_priority || c.original_priority,
    }));

    const profile = {
      type_corrections: typeMappings,
      priority_corrections: priorityMappings,
      few_shot_examples: fewShotExamples,
      total_corrections: corrections.length,
      generated_at: new Date().toISOString(),
    };

    // Store in system_settings
    await supabase
      .from("system_settings")
      .upsert({
        key: "classification_correction_profile",
        value: profile as any,
        updated_at: new Date().toISOString(),
      });

    return new Response(JSON.stringify({ profile, count: corrections.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("apply-corrections error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
