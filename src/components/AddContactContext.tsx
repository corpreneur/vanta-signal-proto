import { useState } from "react";
import { UserPlus, MapPin, Calendar, Lightbulb, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AddContactContextProps {
  contactName: string;
  onClose?: () => void;
}

/**
 * Context collection at point of adding a contact.
 * Research: "Collecting core / most relevant details about person from
 * point of adding contact (when, where, key detail or fact etc.)"
 */
export default function AddContactContext({ contactName, onClose }: AddContactContextProps) {
  const [where, setWhere] = useState("");
  const [keyDetail, setKeyDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!keyDetail.trim() && !where.trim()) {
      toast.error("Add at least one detail");
      return;
    }
    setSaving(true);

    // Save as a manual CONTEXT signal with structured metadata
    const contextNote = [
      where && `Met at: ${where}`,
      keyDetail && `Key detail: ${keyDetail}`,
    ].filter(Boolean).join("\n");

    const { error } = await supabase.from("signals").insert({
      sender: contactName,
      summary: `Contact context: ${keyDetail || where}`,
      source_message: contextNote,
      signal_type: "CONTEXT",
      source: "manual",
      priority: "low",
      raw_payload: {
        _vanta_contact_context: true,
        where: where || null,
        key_detail: keyDetail || null,
        added_at: new Date().toISOString(),
      },
    });

    setSaving(false);

    if (error) {
      toast.error("Failed to save context");
    } else {
      queryClient.invalidateQueries({ queryKey: ["contacts-signals"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.success("Contact context saved");
      onClose?.();
    }
  };

  return (
    <div className="border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
            Add Context · {contactName}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Where did you meet? */}
      <div>
        <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Where / How did you meet?
        </label>
        <input
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          placeholder="e.g. Art Basel, introduced by Marcus, LinkedIn DM…"
          className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Key detail */}
      <div>
        <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
          <Lightbulb className="w-3 h-3" /> Key detail or fact
        </label>
        <input
          value={keyDetail}
          onChange={(e) => setKeyDetail(e.target.value)}
          placeholder="e.g. CEO of Acme, launching new fund Q3, knows Sarah…"
          className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Timestamp shown automatically */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span className="font-mono text-[9px]">
          {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <Save className="w-3 h-3" />
        {saving ? "Saving…" : "Save Context"}
      </button>
    </div>
  );
}
