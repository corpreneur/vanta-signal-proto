import { useState } from "react";
import { UserPlus, MapPin, Lightbulb, X, Save, Tag, Briefcase, Building2, Mail, Phone as PhoneIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RELATIONSHIP_TYPES, RELATIONSHIP_LABELS } from "@/hooks/use-contact-profiles";

interface AddContactContextProps {
  contactName: string;
  onClose?: () => void;
}

const TAG_SUGGESTIONS = ["investor", "founder", "advisor", "friend", "colleague", "partner", "client", "media"];
const SOURCE_TAG_OPTIONS = ["manual", "imessage", "call", "import", "linkedin", "event"] as const;

export default function AddContactContext({ contactName, onClose }: AddContactContextProps) {
  const [where, setWhere] = useState("");
  const [keyDetail, setKeyDetail] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [relationshipType, setRelationshipType] = useState("personal");
  const [sourceTag, setSourceTag] = useState("manual");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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

    // Check for duplicates
    const { data: existing } = await supabase
      .from("contact_profiles" as any)
      .select("id, name")
      .eq("name", contactName)
      .maybeSingle();

    if (existing) {
      toast.error(`${contactName} already exists in your contacts`);
      setSaving(false);
      return;
    }

    // Create profile
    const { error: profileError } = await supabase.from("contact_profiles" as any).insert({
      name: contactName,
      title: title || null,
      company: company || null,
      email: email || null,
      phone: phone || null,
      relationship_type: relationshipType,
      how_we_met: where || null,
      source_tag: sourceTag,
      private_notes: keyDetail || null,
    });

    // Also create a CONTEXT signal for backward compat
    const contextNote = [
      where && `Met at: ${where}`,
      keyDetail && `Key detail: ${keyDetail}`,
    ].filter(Boolean).join("\n");

    const { error: signalError } = await supabase.from("signals").insert({
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
    if (!signalError && tags.length > 0) {
      const TAG_COLORS = ["bg-primary/10 text-primary border-primary/20", "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", "bg-amber-500/10 text-amber-600 border-amber-500/20", "bg-sky-500/10 text-sky-600 border-sky-500/20"];
      const tagRows = tags.map((tag, i) => ({
        contact_name: contactName,
        tag,
        color: TAG_COLORS[i % TAG_COLORS.length],
      }));
      await supabase.from("contact_tags").insert(tagRows);
    }

    setSaving(false);

    if (profileError || signalError) {
      toast.error("Failed to save contact");
    } else {
      queryClient.invalidateQueries({ queryKey: ["contact-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-signals"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["contact-tags"] });
      toast.success("Contact saved");
      onClose?.();
    }
  };

  return (
    <div className="border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
            Add contact · {contactName}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Role & Company */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. CEO, VP Product…"
            className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Company
          </label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp…"
            className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
            <Mail className="w-3 h-3" /> Email
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            type="email"
            className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
            <PhoneIcon className="w-3 h-3" /> Phone
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 0123"
            type="tel"
            className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Relationship type & Source */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
            Relationship
          </label>
          <Select value={relationshipType} onValueChange={setRelationshipType}>
            <SelectTrigger className="h-8 font-mono text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_TYPES.map((rt) => (
                <SelectItem key={rt} value={rt}>{RELATIONSHIP_LABELS[rt]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
            Source
          </label>
          <Select value={sourceTag} onValueChange={setSourceTag}>
            <SelectTrigger className="h-8 font-mono text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TAG_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Where did you meet? */}
      <div>
        <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> How did you meet?
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
          <Lightbulb className="w-3 h-3" /> Key detail or note
        </label>
        <input
          value={keyDetail}
          onChange={(e) => setKeyDetail(e.target.value)}
          placeholder="e.g. Launching new fund Q3, knows Sarah…"
          className="w-full bg-background border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Tags */}
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

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <Save className="w-3 h-3" />
        {saving ? "Saving…" : "Save contact"}
      </button>
    </div>
  );
}
