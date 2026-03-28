import { useState, useEffect } from "react";
import { Phone, X, Save, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Motion } from "@/components/ui/motion";

interface Props {
  contactName: string;
  callSignalId: string;
  onDismiss: () => void;
}

export default function PostCallNotePrompt({ contactName, callSignalId, onDismiss }: Props) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!note.trim()) {
      onDismiss();
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("signals").insert({
      sender: contactName,
      summary: `Post-call note: ${note.slice(0, 80)}${note.length > 80 ? "…" : ""}`,
      source_message: note,
      signal_type: "CONTEXT",
      source: "manual",
      priority: "low",
      raw_payload: {
        _vanta_post_call_note: true,
        call_signal_id: callSignalId,
        captured_at: new Date().toISOString(),
      },
    });
    setSaving(false);
    if (error) {
      toast.error("Failed to save note");
    } else {
      queryClient.invalidateQueries({ queryKey: ["contacts-signals"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.success("Post-call note saved");
      onDismiss();
    }
  };

  return (
    <Motion>
      <div className="border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
              Post-call capture · {contactName}
            </span>
          </div>
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="font-mono text-[10px] text-muted-foreground">
          Capture key takeaways while they're fresh — commitments, decisions, follow-ups.
        </p>

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What happened on the call? Any commitments, decisions, or follow-ups?"
          className="font-mono text-xs min-h-[80px] bg-background border-border focus:border-primary/50"
          autoFocus
        />

        <div className="flex items-center justify-between">
          <button
            onClick={onDismiss}
            className="font-mono text-[9px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving…" : "Save note"}
          </button>
        </div>
      </div>
    </Motion>
  );
}
