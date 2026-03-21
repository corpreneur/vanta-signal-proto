import { useState } from "react";
import { ChevronUp, Sparkles, Shield, Zap, Filter, AlertTriangle } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";

interface SignalSnapshotProps {
  signalsCaptured: number;
  highStrength: number;
  actionsFired: number;
  filtered: number;
  overdue: number;
}

function CountStat({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ElementType; accent?: string }) {
  const displayed = useCountUp(value);
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={`w-3.5 h-3.5 ${accent || "text-vanta-text-low"}`} />
      <div>
        <p className={`font-display text-[20px] leading-none ${accent || "text-foreground"}`}>
          {displayed}
        </p>
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-vanta-text-muted mt-0.5">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function SignalSnapshot({ signalsCaptured, highStrength, actionsFired, filtered, overdue }: SignalSnapshotProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-8 border border-vanta-border bg-vanta-bg-elevated transition-all">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 group"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-vanta-accent" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
            Intelligence Snapshot
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!expanded && (
            <span className="font-mono text-[10px] text-vanta-text-low">
              {signalsCaptured} captured · {actionsFired} actions
            </span>
          )}
          <ChevronUp
            className={`w-3.5 h-3.5 text-vanta-text-low transition-transform ${expanded ? "" : "rotate-180"}`}
          />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-vanta-border">
          <p className="font-sans text-[12px] text-muted-foreground mb-4 leading-relaxed">
            Value extracted from your conversations — every number is noise turned into signal.
          </p>
          <div className="flex flex-wrap gap-6">
            <CountStat label="Signals Captured" value={signalsCaptured} icon={Zap} accent="text-vanta-accent" />
            <CountStat label="High Strength" value={highStrength} icon={Shield} accent="text-vanta-accent" />
            <CountStat label="Actions Fired" value={actionsFired} icon={Sparkles} />
            <CountStat label="Noise Filtered" value={filtered} icon={Filter} />
            {overdue > 0 && (
              <CountStat label="Overdue" value={overdue} icon={AlertTriangle} accent="text-destructive" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
