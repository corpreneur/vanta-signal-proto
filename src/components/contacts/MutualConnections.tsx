import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, ArrowRight } from "lucide-react";
import type { Signal } from "@/data/signals";
import { computeStrength, daysBetween } from "@/lib/contactStrength";

interface MutualConnectionsProps {
  contactName: string;
  allSignals: Signal[];
}

interface MutualContact {
  name: string;
  sharedSignals: number;
  strength: number;
  strengthLabel: string;
}

/**
 * Shows contacts that co-appear in meetings or are connected via
 * related signals (same meeting_id, same time window within 1hr).
 */
export default function MutualConnections({ contactName, allSignals }: MutualConnectionsProps) {
  const mutuals = useMemo(() => {
    // Find meetings involving this contact
    const contactSignals = allSignals.filter((s) => s.sender === contactName);
    const contactMeetingIds = new Set(
      contactSignals
        .filter((s) => s.signalType === "MEETING" && (s as any).meetingId)
        .map((s) => (s as any).meetingId)
    );

    // Find all signals in time windows near this contact's signals
    const contactTimes = contactSignals.map((s) => new Date(s.capturedAt).getTime());

    const coMentionMap = new Map<string, number>();

    for (const signal of allSignals) {
      if (signal.sender === contactName) continue;

      // Check meeting co-occurrence
      if (
        signal.signalType === "MEETING" &&
        (signal as any).meetingId &&
        contactMeetingIds.has((signal as any).meetingId)
      ) {
        coMentionMap.set(signal.sender, (coMentionMap.get(signal.sender) || 0) + 3);
        continue;
      }

      // Check temporal proximity (signals within 1 hour of each other)
      const signalTime = new Date(signal.capturedAt).getTime();
      const isNearby = contactTimes.some((ct) => Math.abs(signalTime - ct) < 3600000);
      if (isNearby) {
        coMentionMap.set(signal.sender, (coMentionMap.get(signal.sender) || 0) + 1);
      }
    }

    // Build mutual contacts with their own strength
    const results: MutualContact[] = [];
    for (const [name, sharedSignals] of coMentionMap) {
      if (sharedSignals < 2) continue;
      const personSignals = allSignals.filter((s) => s.sender === name);
      const highPriority = personSignals.filter((s) => s.priority === "high").length;
      const lastDate = personSignals[0]?.capturedAt;
      const days = lastDate ? daysBetween(lastDate) : 999;
      const { strength, strengthLabel } = computeStrength({
        signalCount: personSignals.length,
        highPriority,
        daysSinceLast: days,
      });
      results.push({ name, sharedSignals, strength, strengthLabel });
    }

    return results.sort((a, b) => b.sharedSignals - a.sharedSignals).slice(0, 8);
  }, [contactName, allSignals]);

  if (mutuals.length === 0) return null;

  return (
    <div className="border border-border bg-card p-4">
      <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-1.5">
        <Users className="w-3 h-3" />
        Mutual Connections · {mutuals.length}
      </h3>
      <div className="flex flex-wrap gap-2">
        {mutuals.map((m) => (
          <Link
            key={m.name}
            to={`/contact/${encodeURIComponent(m.name)}`}
            className="flex items-center gap-2 px-3 py-2 border border-border hover:border-primary/30 bg-background transition-colors group"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-primary-foreground ${
              m.strength >= 75 ? "bg-emerald-500" :
              m.strength >= 50 ? "bg-sky-500" :
              m.strength >= 25 ? "bg-amber-500" : "bg-muted-foreground"
            }`}>
              {m.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[11px] text-foreground truncate group-hover:translate-x-0.5 transition-transform">
                {m.name}
              </p>
              <p className="font-mono text-[8px] text-muted-foreground">
                {m.sharedSignals} shared · {m.strengthLabel}
              </p>
            </div>
            <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </div>
  );
}
