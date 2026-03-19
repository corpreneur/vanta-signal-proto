import { useState } from "react";
import { AlarmClock, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const QUICK_DATES = [
  { label: "Tomorrow", days: 1 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
];

export default function QuickReminderSheet({ onClose }: { onClose: () => void }) {
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = dueDate.length > 0;

  function setQuickDate(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(9, 0, 0, 0);
    setDueDate(d.toISOString().split("T")[0]);
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      // If contact provided, create engagement sequence; otherwise use create-reminder edge fn
      if (contact.trim()) {
        const nextDue = new Date(`${dueDate}T09:00:00`).toISOString();
        const { error } = await supabase.from("engagement_sequences").insert({
          contact_name: contact.trim(),
          sequence_type: "reminder",
          note: note.trim() || null,
          next_due_at: nextDue,
          interval_days: 7,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.functions.invoke("create-reminder", {
          body: {
            signal_id: crypto.randomUUID(),
            due_date: dueDate,
            summary: note.trim() || "Follow-up reminder",
          },
        });
        if (error) throw error;
      }
      toast.success("Reminder set");
      onClose();
    } catch (err) {
      toast.error("Failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2 mb-2">
        <AlarmClock className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground font-medium">
          Set Reminder
        </h3>
      </div>

      <Input
        placeholder="Contact name (optional)"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        className="font-mono text-sm"
      />

      <div>
        <label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
          When
        </label>
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {QUICK_DATES.map((q) => (
            <button
              key={q.days}
              onClick={() => setQuickDate(q.days)}
              className="px-2.5 py-1.5 font-mono text-[10px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="font-mono text-sm"
        />
      </div>

      <Textarea
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="font-sans text-sm resize-none"
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="font-mono text-[10px] uppercase tracking-wider">
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!canSave || saving}
          onClick={handleSave}
          className="font-mono text-[10px] uppercase tracking-wider gap-1.5"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Set
        </Button>
      </div>
    </div>
  );
}
