import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import type { SignalType } from "@/data/signals";
import { buildGraph } from "./graph/buildGraph";
import ForceGraph from "./graph/ForceGraph";
import MiniContactCard from "./graph/MiniContactCard";
import type { FocusedNode } from "./graph/types";
import { useNavigate } from "react-router-dom";

function recencyLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7) return `${days}d ago`;
  if (days <= 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface RelationshipGraphProps {
  signals: Signal[];
}

export default function RelationshipGraph({ signals }: RelationshipGraphProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 500 });
  const [focused, setFocused] = useState<FocusedNode | null>(null);

  const { nodes, edges } = useMemo(() => buildGraph(signals), [signals]);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDims({ w: width, h: Math.max(400, Math.min(600, width * 0.6)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleFocus = useCallback((f: FocusedNode | null) => setFocused(f), []);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-vanta-text-low font-mono text-xs tracking-wider uppercase">
        No contacts in signal history
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[10px] font-mono uppercase tracking-wider text-vanta-text-low">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-vanta-accent inline-block" /> &lt; 2d
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-vanta-accent-teal inline-block" /> &lt; 7d
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-vanta-accent-amber inline-block" /> &lt; 30d
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-vanta-text-muted inline-block" /> 30d+
        </span>
        <span className="ml-auto text-vanta-text-muted">
          Scroll to zoom · drag to pan · click node for details
        </span>
      </div>

      {/* Force graph */}
      <div ref={containerRef} className="relative w-full border border-vanta-border bg-vanta-bg" data-testid="force-graph-container">
        <ForceGraph
          nodes={nodes}
          edges={edges}
          width={dims.w}
          height={dims.h}
          onFocus={handleFocus}
        />
        {focused && (
          <MiniContactCard focused={focused} onClose={() => setFocused(null)} />
        )}
      </div>

      {/* Table fallback */}
      <div className="border border-vanta-border">
        <div className="grid grid-cols-[1fr_60px_60px_80px] gap-0 text-[10px] font-mono uppercase tracking-wider text-vanta-text-muted border-b border-vanta-border px-3 py-2">
          <span>Contact</span>
          <span className="text-center">Signals</span>
          <span className="text-center">High</span>
          <span className="text-right">Last seen</span>
        </div>
        {nodes.map((node) => {
          const colors = SIGNAL_TYPE_COLORS[node.dominantType as SignalType] || SIGNAL_TYPE_COLORS.CONTEXT;
          return (
            <div
              key={node.name}
              onClick={() => navigate(`/contact/${encodeURIComponent(node.name)}`)}
              className="grid grid-cols-[1fr_60px_60px_80px] gap-0 px-3 py-2 border-b border-vanta-border-mid hover:bg-vanta-bg-elevated transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 ${colors.bg} border ${colors.border} shrink-0`} style={{ borderRadius: "50%" }} />
                <span className="text-vanta-text text-xs font-mono truncate">{node.name}</span>
              </div>
              <span className="text-center text-vanta-text-mid text-xs font-mono">{node.signalCount}</span>
              <span className="text-center text-xs font-mono">
                {node.highPriority > 0 ? (
                  <span className="text-vanta-accent">{node.highPriority}</span>
                ) : (
                  <span className="text-vanta-text-muted">0</span>
                )}
              </span>
              <span className={`text-right text-xs font-mono ${node.daysSinceLast <= 7 ? "text-vanta-text-mid" : "text-vanta-text-low"}`}>
                {recencyLabel(node.daysSinceLast)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
