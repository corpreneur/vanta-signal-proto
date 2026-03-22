import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ToggleLeft, ToggleRight, Zap, Play } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  trigger_config: { conditions?: TriggerCondition[] };
  action_steps: ActionStep[];
  enabled: boolean;
  created_at: string;
}

interface TriggerCondition {
  type: "signal_type" | "sender" | "priority" | "source";
  operator: "equals" | "contains";
  value: string;
}

interface ActionStep {
  type: "pin_signal" | "create_reminder" | "send_notification" | "auto_complete";
  config?: Record<string, unknown>;
}

const TRIGGER_TYPES = [
  { value: "signal_type", label: "Signal Type" },
  { value: "sender", label: "Sender" },
  { value: "priority", label: "Priority" },
  { value: "source", label: "Source" },
];

const ACTION_TYPES = [
  { value: "pin_signal", label: "Pin Signal" },
  { value: "create_reminder", label: "Create Reminder" },
  { value: "auto_complete", label: "Auto-Complete" },
  { value: "send_notification", label: "Send Notification" },
];

export default function WorkflowBuilder() {
  const queryClient = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTriggers, setNewTriggers] = useState<TriggerCondition[]>([{ type: "signal_type", operator: "equals", value: "" }]);
  const [newActions, setNewActions] = useState<ActionStep[]>([{ type: "pin_signal" }]);

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const { data, error } = await supabase.from("workflows").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Workflow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("workflows").insert({
        name: newName,
        trigger_config: { conditions: newTriggers } as any,
        action_steps: newActions as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow created");
      setShowBuilder(false);
      setNewName("");
      setNewTriggers([{ type: "signal_type", operator: "equals", value: "" }]);
      setNewActions([{ type: "pin_signal" }]);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("workflows").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workflows"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workflows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deleted");
    },
  });

  return (
    <div className="space-y-6" data-testid="workflow-builder">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-text-low border-b border-vanta-border pb-2 mb-1">
            Workflows
          </h2>
          <p className="font-mono text-[11px] text-vanta-text-muted mt-2">
            Automate actions when new signals match your rules. {workflows.length} workflow{workflows.length !== 1 ? "s" : ""} configured.
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest border border-vanta-accent text-vanta-accent hover:bg-vanta-accent-faint transition-colors"
          data-testid="new-workflow-btn"
        >
          <Plus className="w-3 h-3" />
          New
        </button>
      </div>

      {/* Builder */}
      {showBuilder && (
        <div className="border border-vanta-accent-border bg-vanta-bg-elevated p-5 space-y-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Workflow name…"
            className="w-full bg-background border border-vanta-border px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-vanta-accent-border"
            data-testid="workflow-name-input"
          />

          {/* Triggers */}
          <div>
            <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">When (all must match)</h3>
            {newTriggers.map((t, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select
                  value={t.type}
                  onChange={(e) => { const arr = [...newTriggers]; arr[i] = { ...arr[i], type: e.target.value as TriggerCondition["type"] }; setNewTriggers(arr); }}
                  className="bg-background border border-vanta-border px-2 py-1 font-mono text-[10px] text-foreground"
                >
                  {TRIGGER_TYPES.map((tt) => <option key={tt.value} value={tt.value}>{tt.label}</option>)}
                </select>
                <select
                  value={t.operator}
                  onChange={(e) => { const arr = [...newTriggers]; arr[i] = { ...arr[i], operator: e.target.value as TriggerCondition["operator"] }; setNewTriggers(arr); }}
                  className="bg-background border border-vanta-border px-2 py-1 font-mono text-[10px] text-foreground"
                >
                  <option value="equals">Equals</option>
                  <option value="contains">Contains</option>
                </select>
                <input
                  value={t.value}
                  onChange={(e) => { const arr = [...newTriggers]; arr[i] = { ...arr[i], value: e.target.value }; setNewTriggers(arr); }}
                  placeholder="Value…"
                  className="flex-1 bg-background border border-vanta-border px-2 py-1 font-mono text-[10px] text-foreground focus:outline-none focus:border-vanta-accent-border"
                />
                {newTriggers.length > 1 && (
                  <button onClick={() => setNewTriggers(newTriggers.filter((_, j) => j !== i))} className="text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setNewTriggers([...newTriggers, { type: "signal_type", operator: "equals", value: "" }])}
              className="font-mono text-[9px] uppercase tracking-widest text-vanta-accent hover:underline"
            >
              + Add condition
            </button>
          </div>

          {/* Actions */}
          <div>
            <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">Then do</h3>
            {newActions.map((a, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select
                  value={a.type}
                  onChange={(e) => { const arr = [...newActions]; arr[i] = { type: e.target.value as ActionStep["type"] }; setNewActions(arr); }}
                  className="bg-background border border-vanta-border px-2 py-1 font-mono text-[10px] text-foreground"
                >
                  {ACTION_TYPES.map((at) => <option key={at.value} value={at.value}>{at.label}</option>)}
                </select>
                {newActions.length > 1 && (
                  <button onClick={() => setNewActions(newActions.filter((_, j) => j !== i))} className="text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setNewActions([...newActions, { type: "pin_signal" }])}
              className="font-mono text-[9px] uppercase tracking-widest text-vanta-accent hover:underline"
            >
              + Add action
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || createMutation.isPending}
              className="px-4 py-1.5 bg-vanta-accent text-vanta-bg font-mono text-[10px] uppercase tracking-widest hover:bg-vanta-accent/90 disabled:opacity-50"
            >
              Create Workflow
            </button>
            <button
              onClick={() => setShowBuilder(false)}
              className="px-4 py-1.5 border border-vanta-border text-vanta-text-muted font-mono text-[10px] uppercase tracking-widest hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Workflow List */}
      {isLoading ? (
        <div className="font-mono text-xs text-vanta-text-muted uppercase tracking-widest">Loading…</div>
      ) : workflows.length === 0 ? (
        <div className="py-8 text-center border border-vanta-border bg-vanta-bg-elevated">
          <Zap className="w-6 h-6 text-vanta-text-muted mx-auto mb-2" />
          <p className="font-mono text-[11px] text-vanta-text-muted">No workflows yet. Create one to automate signal processing.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workflows.map((w) => (
            <div key={w.id} className={`border p-4 transition-colors ${w.enabled ? "border-vanta-border bg-vanta-bg-elevated" : "border-vanta-border/50 bg-vanta-bg opacity-50"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Play className={`w-3 h-3 ${w.enabled ? "text-vanta-signal-green" : "text-vanta-text-muted"}`} />
                  <span className="font-mono text-[12px] font-medium text-foreground">{w.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMutation.mutate({ id: w.id, enabled: !w.enabled })}
                    className="text-vanta-text-low hover:text-foreground"
                  >
                    {w.enabled ? <ToggleRight className="w-5 h-5 text-vanta-signal-green" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(w.id)}
                    className="text-vanta-text-muted hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(w.trigger_config?.conditions || []).map((c, i) => (
                  <span key={i} className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider border border-vanta-border text-vanta-text-low">
                    {c.type} {c.operator} "{c.value}"
                  </span>
                ))}
                <span className="text-vanta-text-muted font-mono text-[9px]">→</span>
                {w.action_steps.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider border border-vanta-accent-border text-vanta-accent bg-vanta-accent-faint">
                    {a.type.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
