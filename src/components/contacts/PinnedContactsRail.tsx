import { useNavigate } from "react-router-dom";
import type { ContactProfile } from "@/hooks/use-contact-profiles";
import { RELATIONSHIP_LABELS } from "@/hooks/use-contact-profiles";
import { Star } from "lucide-react";

interface PinnedContactsRailProps {
  profiles: ContactProfile[];
}

export default function PinnedContactsRail({ profiles }: PinnedContactsRailProps) {
  const navigate = useNavigate();
  const pinned = profiles
    .filter((p) => p.pinned)
    .sort((a, b) => (a.pinned_order ?? 99) - (b.pinned_order ?? 99))
    .slice(0, 5);

  if (pinned.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-3 h-3 text-primary" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          Pinned
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {pinned.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/contact/${encodeURIComponent(p.name)}`)}
            className="flex flex-col items-center gap-1.5 min-w-[64px] group"
          >
            <div className="w-12 h-12 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center group-hover:border-primary transition-colors">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="font-mono text-sm font-bold text-primary">
                  {p.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              )}
            </div>
            <span className="font-mono text-[9px] text-foreground truncate max-w-[72px] text-center">
              {p.display_name || p.name.split(" ")[0]}
            </span>
            {p.relationship_type !== "personal" && (
              <span className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground">
                {RELATIONSHIP_LABELS[p.relationship_type] || p.relationship_type}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
