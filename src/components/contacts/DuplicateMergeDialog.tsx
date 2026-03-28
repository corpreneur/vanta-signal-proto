import { useState } from "react";
import { GitMerge, X, Check, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { ContactProfile } from "@/hooks/use-contact-profiles";

interface Props {
  open: boolean;
  onClose: () => void;
  duplicates: DuplicateGroup[];
}

export interface DuplicateGroup {
  canonical: string;
  profiles: ContactProfile[];
  signalCounts: Record<string, number>;
}

export function findDuplicates(profiles: ContactProfile[], signalCounts: Record<string, number>): DuplicateGroup[] {
  const normalize = (n: string) => n.trim().toLowerCase().replace(/\s+/g, " ");
  const groups = new Map<string, ContactProfile[]>();

  for (const p of profiles) {
    const key = normalize(p.name);
    const existing = groups.get(key);
    if (existing) {
      existing.push(p);
    } else {
      // Check phone match
      let merged = false;
      if (p.phone) {
        const phoneDigits = p.phone.replace(/\D/g, "");
        if (phoneDigits.length >= 7) {
          for (const [k, arr] of groups) {
            if (arr.some((a) => a.phone && a.phone.replace(/\D/g, "").includes(phoneDigits.slice(-7)))) {
              arr.push(p);
              merged = true;
              break;
            }
          }
        }
      }
      // Check email match
      if (!merged && p.email) {
        const em = p.email.toLowerCase();
        for (const [k, arr] of groups) {
          if (arr.some((a) => a.email?.toLowerCase() === em)) {
            arr.push(p);
            merged = true;
            break;
          }
        }
      }
      if (!merged) groups.set(key, [p]);
    }
  }

  return Array.from(groups.values())
    .filter((arr) => arr.length > 1)
    .map((arr) => ({
      canonical: arr.sort((a, b) => (signalCounts[b.name] || 0) - (signalCounts[a.name] || 0))[0].name,
      profiles: arr,
      signalCounts,
    }));
}

export default function DuplicateMergeDialog({ open, onClose, duplicates }: Props) {
  const [merging, setMerging] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(
    new Set(duplicates.map((_, i) => i))
  );
  const queryClient = useQueryClient();

  if (!open || duplicates.length === 0) return null;

  const toggleGroup = (i: number) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleMerge = async () => {
    const toMerge = duplicates.filter((_, i) => selectedGroups.has(i));
    if (!toMerge.length) return;

    setMerging(true);
    try {
      for (const group of toMerge) {
        const keep = group.profiles[0]; // Highest signal count
        const remove = group.profiles.slice(1);

        for (const dup of remove) {
          // Reassign signals from duplicate to canonical
          await supabase
            .from("signals")
            .update({ sender: keep.name })
            .eq("sender", dup.name);

          // Reassign tags
          await supabase
            .from("contact_tags")
            .update({ contact_name: keep.name })
            .eq("contact_name", dup.name);

          // Reassign engagement sequences
          await supabase
            .from("engagement_sequences")
            .update({ contact_name: keep.name })
            .eq("contact_name", dup.name);

          // Merge profile data — fill in blanks on the keeper
          const updates: Record<string, unknown> = {};
          if (!keep.title && dup.title) updates.title = dup.title;
          if (!keep.company && dup.company) updates.company = dup.company;
          if (!keep.email && dup.email) updates.email = dup.email;
          if (!keep.phone && dup.phone) updates.phone = dup.phone;
          if (!keep.how_we_met && dup.how_we_met) updates.how_we_met = dup.how_we_met;
          if (!keep.photo_url && dup.photo_url) updates.photo_url = dup.photo_url;

          if (Object.keys(updates).length > 0) {
            await supabase
              .from("contact_profiles")
              .update(updates)
              .eq("id", keep.id);
          }

          // Delete duplicate profile
          await supabase
            .from("contact_profiles")
            .delete()
            .eq("id", dup.id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["contact-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["contacts-signals"] });
      queryClient.invalidateQueries({ queryKey: ["contact-tags"] });

      const totalMerged = toMerge.reduce((acc, g) => acc + g.profiles.length - 1, 0);
      toast.success(`Merged ${totalMerged} duplicate${totalMerged > 1 ? "s" : ""}`);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Merge failed");
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[90vw] max-w-lg max-h-[80vh] flex flex-col bg-card border border-border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-primary" />
            <h2 className="font-display text-lg text-foreground">Merge duplicates</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
            {duplicates.length} group{duplicates.length > 1 ? "s" : ""} found
          </p>

          {duplicates.map((group, gi) => (
            <div
              key={gi}
              onClick={() => toggleGroup(gi)}
              className={`border p-3 cursor-pointer transition-colors ${
                selectedGroups.has(gi)
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card hover:border-border/80"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-5 h-5 border flex items-center justify-center shrink-0 transition-colors ${
                  selectedGroups.has(gi) ? "border-primary bg-primary" : "border-border"
                }`}>
                  {selectedGroups.has(gi) && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-mono text-[11px] font-semibold text-foreground">
                  {group.profiles.length} records → keep "{group.canonical}"
                </span>
              </div>
              <div className="ml-7 space-y-1">
                {group.profiles.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 font-mono text-[10px]">
                    <span className={p.name === group.canonical ? "text-foreground font-semibold" : "text-muted-foreground line-through"}>
                      {p.name}
                    </span>
                    <span className="text-muted-foreground">
                      {group.signalCounts[p.name] || 0} signals
                    </span>
                    {p.email && <span className="text-muted-foreground/60">{p.email}</span>}
                    {p.name === group.canonical && (
                      <span className="text-primary text-[8px] uppercase tracking-wider">keep</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <button onClick={onClose} className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={selectedGroups.size === 0 || merging}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <GitMerge className="w-3.5 h-3.5" />
            {merging ? "Merging…" : `Merge ${selectedGroups.size} group${selectedGroups.size !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
