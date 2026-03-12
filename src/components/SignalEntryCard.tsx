import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffH / 24);

  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface SignalEntryCardProps {
  signal: Signal;
  onClick?: () => void;
}

const SignalEntryCard = ({ signal, onClick }: SignalEntryCardProps) => {
  const colors = SIGNAL_TYPE_COLORS[signal.signalType];

  return (
    <div
      className="border border-vanta-border bg-vanta-bg-elevated p-5 md:p-6 transition-colors hover:border-vanta-border-mid cursor-pointer"
      onClick={onClick}
    >
      {/* Header row: badge + timestamp */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] border ${colors.text} ${colors.bg} ${colors.border}`}
          >
            {signal.signalType}
          </span>
          <span
            className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] border border-vanta-border text-vanta-text-low bg-transparent`}
          >
            {signal.priority}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-vanta-text-muted whitespace-nowrap">
          {formatTimestamp(signal.capturedAt)}
        </span>
      </div>

      {/* Sender */}
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-vanta-text-mid mb-2">
        {signal.sender}
      </p>

      {/* Summary */}
      <p className="font-sans text-[13px] leading-[1.6] text-vanta-text-mid mb-4">
        {signal.summary}
      </p>

      {/* Source message */}
      <div className="border-l-2 border-vanta-border pl-3 mb-4">
        <p className="font-mono text-[11px] leading-[1.5] text-vanta-text-low italic">
          "{signal.sourceMessage}"
        </p>
      </div>

      {/* Actions taken */}
      {signal.actionsTaken.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {signal.actionsTaken.map((action) => (
            <span
              key={action}
              className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted border border-vanta-border px-1.5 py-0.5"
            >
              {formatAction(action)}
            </span>
          ))}
          <span
            className={`font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 border ${
              signal.status === "Complete"
                ? "text-vanta-accent border-vanta-accent-border"
                : signal.status === "In Progress"
                ? "text-vanta-accent-amber border-vanta-accent-amber-border"
                : "text-vanta-text-low border-vanta-border"
            }`}
          >
            {signal.status}
          </span>
        </div>
      )}
    </div>
  );
};

export default SignalEntryCard;
