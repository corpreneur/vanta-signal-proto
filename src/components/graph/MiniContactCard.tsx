import type { GraphNode, FocusedNode } from "./types";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import type { SignalType } from "@/data/signals";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

function recencyLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7) return `${days}d ago`;
  if (days <= 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface Props {
  focused: FocusedNode;
  onClose: () => void;
}

export default function MiniContactCard({ focused, onClose }: Props) {
  const navigate = useNavigate();
  const { node } = focused;
  const colors = SIGNAL_TYPE_COLORS[node.dominantType as SignalType] || SIGNAL_TYPE_COLORS.CONTEXT;

  return (
    <div
      className="absolute z-40 bg-vanta-bg-elevated border border-vanta-border px-3 py-2.5 min-w-[180px] max-w-[220px] shadow-lg"
      style={{
        left: Math.min(focused.screenX + 12, window.innerWidth - 240),
        top: Math.max(focused.screenY - 40, 8),
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-vanta-text text-xs font-mono font-semibold truncate">{node.name}</p>
        <button onClick={onClose} className="text-vanta-text-muted hover:text-vanta-text shrink-0">
          <X size={12} />
        </button>
      </div>
      <p className="text-vanta-text-low text-[9px] font-mono mt-1">
        {node.signalCount} signals · {node.highPriority} high · {recencyLabel(node.daysSinceLast)}
      </p>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {Object.entries(node.signalTypes).map(([type, count]) => {
          const tc = SIGNAL_TYPE_COLORS[type as SignalType] || SIGNAL_TYPE_COLORS.CONTEXT;
          return (
            <span key={type} className={`${tc.bg} ${tc.text} text-[8px] font-mono px-1 py-0.5 border ${tc.border}`}>
              {type} {count}
            </span>
          );
        })}
      </div>
      <button
        onClick={() => navigate(`/contact/${encodeURIComponent(node.name)}`)}
        className="mt-2 w-full text-center text-[9px] font-mono uppercase tracking-wider text-vanta-accent border border-vanta-accent-border bg-vanta-accent-faint px-2 py-1 hover:bg-vanta-accent-bg transition-colors"
      >
        View Timeline →
      </button>
    </div>
  );
}
