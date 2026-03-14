import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { signal_id, due_date, summary } = await req.json();

    if (!signal_id || !due_date) {
      return new Response(JSON.stringify({ error: "signal_id and due_date required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the original signal for context
    const { data: original } = await supabase
      .from("signals")
      .select("sender, summary, signal_type")
      .eq("id", signal_id)
      .single();

    const reminderSummary = summary || `Follow up: ${original?.summary || "Reminder"}`;

    const { data, error } = await supabase.from("signals").insert({
      sender: original?.sender || "System",
      summary: reminderSummary,
      source_message: `Reminder set from signal ${signal_id}`,
      signal_type: "CONTEXT",
      priority: "medium",
      source: "manual",
      status: "Captured",
      due_date,
      actions_taken: ["reminder_created"],
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, reminder: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-reminder error:", e);
    const { logError } = await import("../_shared/log-error.ts");
    await logError("create-reminder", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
