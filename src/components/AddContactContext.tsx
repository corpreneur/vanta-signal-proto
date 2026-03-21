import { useState } from "react";
import { UserPlus, MapPin, Calendar, Lightbulb, X, Save, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AddContactContextProps {
  contactName: string;
  onClose?: () => void;
}

const TAG_SUGGESTIONS = ["investor", "founder", "advisor", "friend", "colleague", "partner", "client", "media"];

export default function AddContactContext({ contactName, onClose }: AddContactContextProps) {
  const [where, setWhere] = useState("");
  const [keyDetail, setKeyDetail] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSave = async () => {
    if (!keyDetail.trim() && !where.trim()) {
      toast.error("Add at least one detail");
      return;
    }
    setSaving(true);

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

    // Save tags if any
    if (!error && tags.length > 0) {
      const TAG_COLORS = ["bg-primary/10 text-primary border-primary/20", "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", "bg-amber-500/10 text-amber-600 border-amber-500/20", "bg-sky-500/10 text-sky-600 border-sky-500/20"];
      const tagRows = tags.map((tag, i) => ({
        contact_name: contactName,
        tag,
        color: TAG_COLORS[i % TAG_COLORS.length],
      }));
      await supabase.from("contact_tags").insert(tagRows);
    }

    setSaving(false);

    if (error) {
      toast.error("Failed to save context");
    } else {
      queryClient.invalidateQueries({ queryKey: ["contacts-signals"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["contact-tags"] });
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

      {/* Tag assignment */}
      <div>
        <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
          <Tag className="w-3 h-3" /> Tags
        </label>
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] bg-primary/10 text-primary border border-primary/20 rounded-sm">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
            placeholder="Add tag…"
            className="flex-1 bg-background border border-border px-2 py-1.5 font-mono text-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).slice(0, 5).map((s) => (
            <button key={s} onClick={() => addTag(s)} className="px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
              + {s}
            </button>
          ))}
        </div>
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
