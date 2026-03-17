import { useState, useMemo } from "react";
import type { Signal } from "@/data/signals";
import type { FilterState } from "@/components/SignalFilters";
import SignalEntryCard from "@/components/SignalEntryCard";
import SignalDetailDrawer from "@/components/SignalDetailDrawer";
import CommsPrepCard from "@/components/CommsPrepCard";
import { buildContactContextMap } from "@/lib/contactStrength";

interface SignalFeedProps {
  signals: Signal[];
  filters: FilterState;
  showPromote?: boolean;
  allSignals?: Signal[]; // full signal set for computing contact context
}

function getTemporalGroup(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (d >= today) return "Today";
  if (d >= yesterday) return "Yesterday";
  if (d >= weekAgo) return "This Week";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const SignalFeed = ({ signals, filters, showPromote, allSignals }: SignalFeedProps) => {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  const contactContextMap = useMemo(
    () => buildContactContextMap(allSignals || signals),
    [allSignals, signals]
  );

  const filtered = signals.filter((s) => {
    if (filters.type !== "ALL" && s.signalType !== filters.type) return false;
    if (filters.sender !== "ALL" && s.sender !== filters.sender) return false;
    if (filters.priority !== "ALL" && s.priority !== filters.priority) return false;
    if (filters.chatMode && filters.chatMode !== "ALL") {
      const isGroup = s.rawPayload && typeof s.rawPayload === "object" && (s.rawPayload as Record<string, unknown>)._vanta_group_chat === true;
      if (filters.chatMode === "group" && !isGroup) return false;
      if (filters.chatMode === "direct" && isGroup) return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        s.sender.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.sourceMessage.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Separate pinned and unpinned, then group by temporal
  const { pinned, groups } = useMemo(() => {
    const pinnedItems = filtered.filter((s) => s.pinned);
    const unpinned = filtered.filter((s) => !s.pinned);
    
    const grouped: Record<string, Signal[]> = {};
    for (const s of unpinned) {
      const group = getTemporalGroup(s.capturedAt);
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(s);
    }
    return { pinned: pinnedItems, groups: grouped };
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <div className="border border-vanta-border bg-vanta-bg-elevated p-10 text-center">
        <div
          className="inline-block w-2 h-2 bg-vanta-accent rounded-full mb-4"
          style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
        />
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-vanta-text-low">
          No signals captured yet. Monitoring active.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Pinned signals */}
      {pinned.length > 0 && (
        <div className="mb-4">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-accent mb-2 flex items-center gap-1.5">
            <span className="w-1 h-1 bg-vanta-accent rounded-full" />
            Pinned
          </h3>
          <div className="flex flex-col gap-px border-l-2 border-vanta-accent-border pl-0">
            {pinned.map((signal) => (
              <SignalEntryCard
                key={signal.id}
                signal={signal}
                onClick={() => setSelectedSignal(signal)}
                contactContext={contactContextMap.get(signal.sender)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Temporal groups */}
      {Object.entries(groups).map(([label, groupSignals]) => (
        <div key={label} className="mb-4">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2 pb-1 border-b border-vanta-border">
            {label}
          </h3>
          <div className="flex flex-col gap-px">
            {groupSignals.map((signal) => {
              const isCommsSignal = signal.signalType === "PHONE_CALL" || signal.source === "phone" || signal.source === "linq";
              return (
                <div key={signal.id}>
                  {isCommsSignal && (
                    <CommsPrepCard signal={signal} allSignals={allSignals || signals} />
                  )}
                  <SignalEntryCard
                    signal={signal}
                    onClick={() => setSelectedSignal(signal)}
                    showPromote={showPromote}
                    contactContext={contactContextMap.get(signal.sender)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <SignalDetailDrawer
        signal={selectedSignal}
        open={!!selectedSignal}
        onClose={() => setSelectedSignal(null)}
      />
    </>
  );
};

export default SignalFeed;
