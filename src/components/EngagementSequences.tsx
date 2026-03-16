import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Plus, Trash2, ToggleLeft, ToggleRight, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Motion } from "@/components/ui/motion";
import { toast } from "sonner";

interface Sequence {
  id: string;
  contact_name: string;
  sequence_type: string;
  interval_days: number;
  next_due_at: string;
  last_fired_at: string | null;
  enabled: boolean;
  note: string | null;
  created_at: string;
}

interface EngagementSequencesProps {
  contactName?: string;
}

export default function EngagementSequences({ contactName }: EngagementSequencesProps) {
  const [showForm, setShowForm] = useState(false);
  const [formContact, setFormContact] = useState(contactName || "");
  const [formDays, setFormDays] = useState(7);
  const [formNote, setFormNote] = useState("");
  const qc = useQueryClient();

  const { data: sequences = [], isLoading } = useQuery({
    queryKey: ["engagement-sequences", contactName],
    queryFn: async () => {
      let query = supabase
        .from("engagement_sequences")
        .select("*")
        .order("next_due_at", { ascending: true });
      if (contactName) query = query.eq("contact_name", contactName);
      const { data } = await query;
      return (data || []) as Sequence[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + formDays);
      const { error } = await supabase.from("engagement_sequences").insert({
        contact_name: formContact,
        interval_days: formDays,
        next_due_at: nextDue.toISOString(),
        note: formNote || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["engagement-sequences"] });
      toast.success(`Reminder set: reach out to ${formContact} every ${formDays} days`);
      setShowForm(false);
      setFormContact(contactName || "");
      setFormDays(7);
      setFormNote("");
    },
    onError: () => toast.error("Failed to create sequence"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("engagement_sequences")
        .update({ enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["engagement-sequences"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("engagement_sequences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["engagement-sequences"] });
      toast.success("Sequence removed");
    },
  });

  const isDue = (seq: Sequence) => new Date(seq.next_due_at) <= new Date();

  const dueCount = sequences.filter((s) => s.enabled && isDue(s)).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-vanta-accent-amber" />
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-text-muted">
            Engagement Sequences
          </h3>
          {dueCount > 0 && (
            <span className="px-1.5 py-0.5 font-mono text-[9px] text-destructive border border-destructive/30 bg-destructive/10 rounded-sm">
              {dueCount} due
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider border border-vanta-border text-vanta-text-low hover:text-foreground hover:border-foreground/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          New
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <Motion>
          <div className="border border-vanta-border bg-card p-4 space-y-3">
            {!contactName && (
              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted mb-1 block">
                  Contact
                </label>
                <Input
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  placeholder="Contact name…"
                  className="h-8 font-mono text-xs bg-transparent border-vanta-border"
                />
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted mb-1 block">
                  Every (days)
                </label>
                <Input
                  type="number"
                  value={formDays}
                  onChange={(e) => setFormDays(Number(e.target.value))}
                  min={1}
                  max={365}
                  className="h-8 font-mono text-xs bg-transparent border-vanta-border w-20"
                />
              </div>
              <div className="flex-1">
                <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted mb-1 block">
                  Note (optional)
                </label>
                <Input
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="e.g. Check in re: project"
                  className="h-8 font-mono text-xs bg-transparent border-vanta-border"
                />
              </div>
            </div>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!formContact.trim() || formDays < 1}
              className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              Create Sequence
            </button>
          </div>
        </Motion>
      )}

      {/* Sequence list */}
      {isLoading ? (
        <div className="py-4 text-center"><div className="w-2 h-2 bg-primary animate-pulse mx-auto" /></div>
      ) : sequences.length === 0 ? (
        <p className="font-mono text-[10px] text-vanta-text-muted text-center py-4">
          No engagement sequences yet. Create one to get automated outreach reminders.
        </p>
      ) : (
        <div className="space-y-2">
          {sequences.map((seq) => {
            const due = isDue(seq);
            return (
              <div
                key={seq.id}
                className={`flex items-center gap-3 p-3 border transition-colors ${
                  due && seq.enabled
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-vanta-border bg-card"
                } ${!seq.enabled ? "opacity-50" : ""}`}
              >
                <Clock className={`w-4 h-4 shrink-0 ${due && seq.enabled ? "text-destructive" : "text-vanta-text-low"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[12px] text-foreground truncate">
                    {seq.contact_name}
                    <span className="text-vanta-text-muted ml-2">every {seq.interval_days}d</span>
                  </p>
                  {seq.note && (
                    <p className="font-mono text-[10px] text-vanta-text-low truncate">{seq.note}</p>
                  )}
                  <p className="font-mono text-[9px] text-vanta-text-muted">
                    {due && seq.enabled ? (
                      <span className="text-destructive font-semibold">Due now</span>
                    ) : (
                      <>Next: {new Date(seq.next_due_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => toggleMutation.mutate({ id: seq.id, enabled: !seq.enabled })}
                  className="text-vanta-text-low hover:text-foreground transition-colors"
                >
                  {seq.enabled ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(seq.id)}
                  className="text-vanta-text-muted hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
