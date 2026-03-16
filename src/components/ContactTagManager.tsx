import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Plus, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const TAG_COLORS = [
  "bg-vanta-accent/15 text-vanta-accent border-vanta-accent/30",
  "bg-vanta-accent-teal/15 text-vanta-accent-teal border-vanta-accent-teal/30",
  "bg-vanta-accent-amber/15 text-vanta-accent-amber border-vanta-accent-amber/30",
  "bg-vanta-accent-violet/15 text-vanta-accent-violet border-vanta-accent-violet/30",
  "bg-vanta-accent-phone/15 text-vanta-accent-phone border-vanta-accent-phone/30",
  "bg-vanta-accent-zoom/15 text-vanta-accent-zoom border-vanta-accent-zoom/30",
];

interface ContactTagManagerProps {
  contactName: string;
  compact?: boolean;
}

interface TagRow {
  id: string;
  contact_name: string;
  tag: string;
  color: string;
  created_at: string;
}

export default function ContactTagManager({ contactName, compact = false }: ContactTagManagerProps) {
  const [newTag, setNewTag] = useState("");
  const [showInput, setShowInput] = useState(false);
  const qc = useQueryClient();

  const { data: tags = [] } = useQuery({
    queryKey: ["contact-tags", contactName],
    queryFn: async () => {
      const { data } = await supabase
        .from("contact_tags")
        .select("*")
        .eq("contact_name", contactName)
        .order("created_at");
      return (data || []) as TagRow[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (tag: string) => {
      const color = TAG_COLORS[tags.length % TAG_COLORS.length];
      const { error } = await supabase.from("contact_tags").insert({
        contact_name: contactName,
        tag,
        color,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-tags", contactName] });
      qc.invalidateQueries({ queryKey: ["all-contact-tags"] });
      setNewTag("");
      setShowInput(false);
    },
    onError: () => toast.error("Failed to add tag"),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-tags", contactName] });
      qc.invalidateQueries({ queryKey: ["all-contact-tags"] });
    },
  });

  const handleAdd = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.some((t) => t.tag === trimmed)) {
      addMutation.mutate(trimmed);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span
          key={t.id}
          className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider border rounded-sm ${t.color}`}
        >
          <Tag className="w-2.5 h-2.5" />
          {t.tag}
          {!compact && (
            <button onClick={() => removeMutation.mutate(t.id)} className="hover:opacity-70">
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </span>
      ))}
      {showInput ? (
        <form
          onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
          className="inline-flex items-center"
        >
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="h-6 w-20 font-mono text-[10px] bg-transparent border-vanta-border px-1.5"
            placeholder="Tag…"
            autoFocus
            onBlur={() => { if (!newTag.trim()) setShowInput(false); }}
          />
        </form>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-[9px] text-vanta-text-muted hover:text-foreground border border-dashed border-vanta-border hover:border-vanta-border-mid transition-colors rounded-sm"
        >
          <Plus className="w-2.5 h-2.5" />
          {compact ? "" : "Tag"}
        </button>
      )}
    </div>
  );
}

/** Hook to get all unique tags across contacts for filtering */
export function useAllContactTags() {
  return useQuery({
    queryKey: ["all-contact-tags"],
    queryFn: async () => {
      const { data } = await supabase
        .from("contact_tags")
        .select("tag, contact_name")
        .order("tag");
      const tagMap = new Map<string, string[]>();
      (data || []).forEach((row: { tag: string; contact_name: string }) => {
        const existing = tagMap.get(row.tag) || [];
        existing.push(row.contact_name);
        tagMap.set(row.tag, existing);
      });
      return tagMap;
    },
  });
}
