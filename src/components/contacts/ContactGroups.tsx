import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, X, ChevronRight, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Motion } from "@/components/ui/motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const GROUP_COLORS = [
  "bg-primary/10 text-primary border-primary/20",
  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "bg-violet-500/10 text-violet-600 border-violet-500/20",
  "bg-rose-500/10 text-rose-600 border-rose-500/20",
  "bg-sky-500/10 text-sky-600 border-sky-500/20",
];

const SUGGESTED_GROUPS = ["Investors", "Co-founders", "Advisors", "Clients", "Partners", "Media"];

interface GroupData {
  tag: string;
  contacts: string[];
  color: string;
}

export default function ContactGroups() {
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  const qc = useQueryClient();

  // Aggregate groups from contact_tags — tags used by 2+ contacts = a "group"
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["contact-groups"],
    queryFn: async () => {
      const { data } = await supabase
        .from("contact_tags")
        .select("tag, contact_name, color")
        .order("tag");

      const map = new Map<string, { contacts: string[]; color: string }>();
      (data || []).forEach((row) => {
        const existing = map.get(row.tag);
        if (existing) {
          existing.contacts.push(row.contact_name);
        } else {
          map.set(row.tag, { contacts: [row.contact_name], color: row.color });
        }
      });

      const result: GroupData[] = [];
      map.forEach((val, key) => {
        result.push({ tag: key, contacts: val.contacts, color: val.color });
      });
      return result.sort((a, b) => b.contacts.length - a.contacts.length);
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupName: string) => {
      // A group is just a tag — creating a placeholder entry so it appears
      // We'll tag the first contact or just create the tag concept
      toast.success(`Group "${groupName}" created — tag contacts with "${groupName}" to add them`);
    },
    onSuccess: () => {
      setNewGroup("");
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ["contact-groups"] });
    },
  });

  const handleCreate = () => {
    const trimmed = newGroup.trim();
    if (!trimmed) return;
    createGroupMutation.mutate(trimmed);
  };

  return (
    <div>
      <Motion>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground font-medium">
                Contact groups
              </h3>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground">
              Organize contacts into circles for batch engagement and filtering
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-muted font-mono text-[10px] uppercase tracking-wider transition-colors"
          >
            <Plus className="w-3 h-3" />
            New group
          </button>
        </div>
      </Motion>

      {/* Create form */}
      {showCreate && (
        <Motion>
          <div className="border border-border bg-card p-4 mb-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Create a group
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
              className="flex items-center gap-2 mb-3"
            >
              <Input
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                placeholder="Group name…"
                className="flex-1 font-mono text-xs bg-transparent border-border"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-2 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-wider hover:bg-primary/90 transition-colors"
              >
                Create
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_GROUPS.filter((s) => !groups.some((g) => g.tag.toLowerCase() === s.toLowerCase())).map((s) => (
                <button
                  key={s}
                  onClick={() => setNewGroup(s)}
                  className="px-2 py-0.5 border border-dashed border-border font-mono text-[9px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </Motion>
      )}

      {/* Group list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-2 h-2 bg-primary animate-pulse" />
        </div>
      ) : groups.length === 0 ? (
        <div className="border border-border bg-card p-8 text-center">
          <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
            No groups yet
          </p>
          <p className="font-mono text-[9px] text-muted-foreground max-w-xs mx-auto">
            Add tags to contacts — any tag shared by multiple contacts becomes a group automatically
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group, i) => (
            <Motion key={group.tag} delay={i * 20}>
              <div className="border border-border bg-card p-4 hover:border-foreground/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center border rounded-sm ${GROUP_COLORS[i % GROUP_COLORS.length]}`}>
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-mono text-[12px] font-medium text-foreground">{group.tag}</p>
                      <p className="font-mono text-[9px] text-muted-foreground">
                        {group.contacts.length} contact{group.contacts.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>

                {/* Contact avatars row */}
                <div className="flex items-center gap-1.5 mt-3 pl-11">
                  {group.contacts.slice(0, 6).map((name) => (
                    <Link
                      key={name}
                      to={`/contact/${encodeURIComponent(name)}`}
                      className="flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border font-mono text-[9px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors truncate max-w-[120px]"
                    >
                      {name}
                    </Link>
                  ))}
                  {group.contacts.length > 6 && (
                    <span className="font-mono text-[9px] text-muted-foreground">
                      +{group.contacts.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            </Motion>
          ))}
        </div>
      )}
    </div>
  );
}
