import { useNavigate } from "react-router-dom";
import { Clock, MessageSquare, Phone, StickyNote } from "lucide-react";
import { recencyLabel } from "@/lib/contactStrength";

interface StaleContact {
  name: string;
  daysSinceLast: number;
  strength: number;
}

interface ReEngageTrayProps {
  contacts: StaleContact[];
}

export default function ReEngageTray({ contacts }: ReEngageTrayProps) {
  const navigate = useNavigate();
  const stale = contacts
    .filter((c) => c.daysSinceLast > 30)
    .sort((a, b) => b.daysSinceLast - a.daysSinceLast)
    .slice(0, 6);

  if (stale.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-3 h-3 text-destructive" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          Re-engage
        </span>
        <span className="font-mono text-[8px] text-destructive ml-1">{stale.length} dormant</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {stale.map((c) => (
          <div
            key={c.name}
            className="min-w-[180px] max-w-[200px] border border-destructive/20 bg-destructive/5 p-3 shrink-0"
          >
            <p
              onClick={() => navigate(`/contact/${encodeURIComponent(c.name)}`)}
              className="font-mono text-[12px] text-foreground font-semibold truncate cursor-pointer hover:text-primary transition-colors mb-1"
            >
              {c.name}
            </p>
            <p className="font-mono text-[9px] text-destructive mb-2">
              {recencyLabel(c.daysSinceLast)} · Strength {c.strength}
            </p>
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <button className="flex items-center gap-0.5 px-1.5 py-1 font-mono text-[8px] uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors flex-1 justify-center">
                <MessageSquare className="w-2.5 h-2.5" /> Text
              </button>
              <button className="flex items-center gap-0.5 px-1.5 py-1 font-mono text-[8px] uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors flex-1 justify-center">
                <Phone className="w-2.5 h-2.5" /> Call
              </button>
              <button className="flex items-center gap-0.5 px-1.5 py-1 font-mono text-[8px] uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors flex-1 justify-center">
                <StickyNote className="w-2.5 h-2.5" /> Note
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
