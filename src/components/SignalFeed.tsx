import { useState } from "react";
import type { Signal } from "@/data/signals";
import type { FilterState } from "@/components/SignalFilters";
import SignalEntryCard from "@/components/SignalEntryCard";
import SignalDetailDrawer from "@/components/SignalDetailDrawer";

interface SignalFeedProps {
  signals: Signal[];
  filters: FilterState;
  showPromote?: boolean;
}

const SignalFeed = ({ signals, filters, showPromote }: SignalFeedProps) => {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

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
      <div className="flex flex-col gap-px">
        {filtered.map((signal) => (
          <SignalEntryCard
            key={signal.id}
            signal={signal}
            onClick={() => setSelectedSignal(signal)}
          />
        ))}
      </div>

      <SignalDetailDrawer
        signal={selectedSignal}
        open={!!selectedSignal}
        onClose={() => setSelectedSignal(null)}
      />
    </>
  );
};

export default SignalFeed;
