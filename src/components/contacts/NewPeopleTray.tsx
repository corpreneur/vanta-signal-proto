import { useNavigate } from "react-router-dom";
import { UserPlus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Signal } from "@/data/signals";
import type { ContactProfile } from "@/hooks/use-contact-profiles";

interface NewPeopleTrayProps {
  signals: Signal[];
  existingProfiles: ContactProfile[];
}

export default function NewPeopleTray({ signals, existingProfiles }: NewPeopleTrayProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const profileNames = new Set(existingProfiles.map((p) => p.name));
  const introSignals = signals
    .filter((s) => s.signalType === "INTRO" && !profileNames.has(s.sender))
    .reduce((acc, s) => {
      if (!acc.some((x) => x.sender === s.sender)) acc.push(s);
      return acc;
    }, [] as Signal[])
    .slice(0, 5);

  if (introSignals.length === 0) return null;

  const handleSave = async (name: string) => {
    const { error } = await supabase.from("contact_profiles" as any).insert({
      name,
      relationship_type: "personal",
      source_tag: "signal",
    });
    if (error) {
      toast.error("Failed to save contact");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["contact-profiles"] });
    toast.success(`${name} saved to contacts`);
  };

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="w-3 h-3 text-primary" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          New people
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {introSignals.map((s) => (
          <div
            key={s.id}
            className="min-w-[180px] max-w-[200px] border border-primary/20 bg-primary/5 p-3 shrink-0"
          >
            <p
              onClick={() => navigate(`/contact/${encodeURIComponent(s.sender)}`)}
              className="font-mono text-[12px] text-foreground font-semibold truncate cursor-pointer hover:text-primary transition-colors mb-1"
            >
              {s.sender}
            </p>
            <p className="font-mono text-[9px] text-muted-foreground line-clamp-2 mb-2">
              {s.summary}
            </p>
            <button
              onClick={() => handleSave(s.sender)}
              className="flex items-center gap-1 w-full justify-center px-2 py-1 font-mono text-[8px] uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-2.5 h-2.5" /> Save contact
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
