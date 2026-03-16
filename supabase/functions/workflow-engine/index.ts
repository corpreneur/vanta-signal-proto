import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TriggerConfig {
  type: "signal_type" | "sender" | "priority" | "source";
  operator: "equals" | "contains";
  value: string;
}

interface ActionStep {
  type: "pin_signal" | "create_reminder" | "send_notification" | "auto_complete";
  config?: Record<string, unknown>;
}

function evaluateTrigger(trigger: TriggerConfig, signal: Record<string, unknown>): boolean {
  const fieldMap: Record<string, string> = {
    signal_type: "signal_type",
    sender: "sender",
    priority: "priority",
    source: "source",
  };
  const fieldValue = String(signal[fieldMap[trigger.type]] || "").toLowerCase();
  const targetValue = trigger.value.toLowerCase();

  if (trigger.operator === "equals") return fieldValue === targetValue;
  if (trigger.operator === "contains") return fieldValue.includes(targetValue);
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signal } = await req.json();
    if (!signal?.id) {
      return new Response(JSON.stringify({ error: "signal required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all enabled workflows
    const { data: workflows } = await supabase
      .from("workflows")
      .select("*")
      .eq("enabled", true);

    if (!workflows || workflows.length === 0) {
      return new Response(JSON.stringify({ matched: 0, actions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const executedActions: string[] = [];

    for (const workflow of workflows) {
      const triggers = (workflow.trigger_config as { conditions?: TriggerConfig[] })?.conditions || [];
      const allMatch = triggers.length > 0 && triggers.every((t: TriggerConfig) => evaluateTrigger(t, signal));

      if (!allMatch) continue;

      const actions = (workflow.action_steps as ActionStep[]) || [];
      for (const action of actions) {
        switch (action.type) {
          case "pin_signal":
            await supabase.from("signals").update({ pinned: true }).eq("id", signal.id);
            executedActions.push(`${workflow.name}: pinned signal`);
            break;
          case "auto_complete":
            await supabase.from("signals").update({ status: "Complete" }).eq("id", signal.id);
            executedActions.push(`${workflow.name}: auto-completed`);
            break;
          case "create_reminder": {
            const days = (action.config?.days as number) || 1;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + days);
            await supabase.from("signals").update({ due_date: dueDate.toISOString().split("T")[0] }).eq("id", signal.id);
            executedActions.push(`${workflow.name}: reminder set`);
            break;
          }
          default:
            executedActions.push(`${workflow.name}: action ${action.type} (no-op)`);
        }
      }
    }

    return new Response(JSON.stringify({ matched: executedActions.length, actions: executedActions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("workflow-engine error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
