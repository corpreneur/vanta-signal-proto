import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StickyNote, Plus, MapPin, Lightbulb, Calendar, Save } from "lucide-react";
import { toast } from "sonner";
import { Motion } from "@/components/ui/motion";

interface ContextSignal {
  id: string;
  summary: string;
  source_message: string;
  captured_at: string;
  raw_payload: any;
}

interface ContactNotesProps {
  contactName: string;
}

export default function ContactNotes({ contactName }: ContactNotesProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: contextSignals = [] } = useQuery({
    queryKey: ["contact-notes", contactName],
    queryFn: async () => {
      const { data } = await supabase
        .from("signals")
        .select("id, summary, source_message, captured_at, raw_payload")
        .eq("sender", contactName)
        .eq("signal_type", "CONTEXT")
        .order("captured_at", { ascending: false })
        .limit(50);
      return (data || []) as ContextSignal[];
    },
  });

  const handleSave = async () => {
    if (!note.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("signals").insert({
      sender: contactName,
      summary: note.trim().slice(0, 120),
      source_message: note.trim(),
      signal_type: "CONTEXT",
      source: "manual",
      priority: "low",
      raw_payload: {
        _vanta_contact_note: true,
        added_at: new Date().toISOString(),
      },
    });
    setSaving(false);
    if (error) {
      toast.error("Failed to save note");
    } else {
      qc.invalidateQueries({ queryKey: ["contact-notes", contactName] });
      qc.invalidateQueries({ queryKey: ["contact-timeline", contactName] });
      toast.success("Note saved");
      setNote("");
      setShowAdd(false);
    }
  };

  // Separate profile, context, and free notes
  const notes = contextSignals.filter(
    (s) => !(s.raw_payload as any)?._vanta_contact_profile
  );

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
          <StickyNote className="w-3 h-3" />
          Notes & Context · {notes.length}
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      {/* Inline add form */}
      {showAdd && (
        <Motion>
          <div className="mb-4 space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this contact…"
              rows={3}
              className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !note.trim()}
                className="flex items-center gap-1 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Save className="w-3 h-3" />
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setShowAdd(false); setNote(""); }}
                className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Motion>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="font-mono text-[10px] text-muted-foreground text-center py-4">
          No notes yet. Add context to enrich this relationship.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notes.map((s) => {
            const isContext = (s.raw_payload as any)?._vanta_contact_context;
            const where = (s.raw_payload as any)?.where;
            const keyDetail = (s.raw_payload as any)?.key_detail;

            return (
              <div key={s.id} className="flex gap-2 p-2 border border-border/50 bg-background">
                <div className="shrink-0 mt-0.5">
                  {isContext ? (
                    <MapPin className="w-3 h-3 text-primary/60" />
                  ) : (
                    <StickyNote className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {isContext ? (
                    <div className="space-y-0.5">
                      {where && (
                        <p className="font-mono text-[10px] text-foreground">
                          <span className="text-muted-foreground">Met:</span> {where}
                        </p>
                      )}
                      {keyDetail && (
                        <p className="font-mono text-[10px] text-foreground">
                          <span className="text-muted-foreground">Key:</span> {keyDetail}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="font-mono text-[10px] text-foreground leading-relaxed">
                      {s.source_message || s.summary}
                    </p>
                  )}
                  <p className="font-mono text-[8px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {new Date(s.captured_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
