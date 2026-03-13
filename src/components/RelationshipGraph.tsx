import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";

interface ContactNode {
  name: string;
  signalCount: number;
  highPriority: number;
  lastInteraction: string;
  daysSinceLast: number;
  sources: Set<string>;
  signalTypes: Record<string, number>;
  dominantType: string;
}

function daysBetween(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function buildNodes(signals: Signal[]): ContactNode[] {
  const map = new Map<string, ContactNode>();

  for (const s of signals) {
    const existing = map.get(s.sender);
    if (existing) {
      existing.signalCount++;
      if (s.priority === "high") existing.highPriority++;
      if (new Date(s.capturedAt) > new Date(existing.lastInteraction)) {
        existing.lastInteraction = s.capturedAt;
        existing.daysSinceLast = daysBetween(s.capturedAt);
      }
      existing.sources.add(s.source);
      existing.signalTypes[s.signalType] = (existing.signalTypes[s.signalType] || 0) + 1;
    } else {
      map.set(s.sender, {
        name: s.sender,
        signalCount: 1,
        highPriority: s.priority === "high" ? 1 : 0,
        lastInteraction: s.capturedAt,
        daysSinceLast: daysBetween(s.capturedAt),
        sources: new Set([s.source]),
        signalTypes: { [s.signalType]: 1 },
        dominantType: s.signalType,
      });
    }
  }

  // Resolve dominant type
  for (const node of map.values()) {
    let max = 0;
    for (const [type, count] of Object.entries(node.signalTypes)) {
      if (count > max) {
        max = count;
        node.dominantType = type;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.signalCount - a.signalCount);
}

// Recency label
function recencyLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7) return `${days}d ago`;
  if (days <= 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// Recency ring color
function recencyRing(days: number): string {
  if (days <= 1) return "ring-vanta-accent";
  if (days <= 7) return "ring-vanta-accent-teal";
  if (days <= 30) return "ring-vanta-accent-amber";
  return "ring-vanta-text-muted";
}

interface RelationshipGraphProps {
  signals: Signal[];
}

export default function RelationshipGraph({ signals }: RelationshipGraphProps) {
  const nodes = useMemo(() => buildNodes(signals), [signals]);
  const maxSignals = useMemo(() => Math.max(...nodes.map((n) => n.signalCount), 1), [nodes]);

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
        <span className="ml-auto">
          Node size = signal density
        </span>
      </div>

      {/* Graph grid, orbital layout */}
      <div className="relative w-full min-h-[420px]">
        {/* Center hub */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-vanta-accent-border bg-vanta-accent-faint flex items-center justify-center z-10">
          <span className="text-vanta-accent text-[10px] font-mono uppercase tracking-widest">You</span>
        </div>

        {/* Orbital rings */}
        {[120, 180, 240].map((r) => (
          <div
            key={r}
            className="absolute left-1/2 top-1/2 border border-vanta-border-mid opacity-40"
            style={{
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}

        {/* Contact nodes */}
        {nodes.slice(0, 16).map((node, i) => {
          const total = Math.min(nodes.length, 16);
          const angle = (2 * Math.PI * i) / total - Math.PI / 2;
          // Orbit: more signals → closer to center
          const normalised = node.signalCount / maxSignals;
          const orbit = 240 - normalised * 120; // range 120–240
          const x = Math.cos(angle) * orbit;
          const y = Math.sin(angle) * orbit;
          // Node size: 32–64px based on density
          const size = 32 + normalised * 32;
          const colors = SIGNAL_TYPE_COLORS[node.dominantType as keyof typeof SIGNAL_TYPE_COLORS] || SIGNAL_TYPE_COLORS.CONTEXT;

          return (
            <div
              key={node.name}
              className={`absolute flex flex-col items-center group cursor-default`}
              style={{
                left: `calc(50% + ${x}px - ${size / 2}px)`,
                top: `calc(50% + ${y}px - ${size / 2}px)`,
                width: size,
                zIndex: 20,
              }}
            >
              {/* Node circle */}
              <div
                className={`${recencyRing(node.daysSinceLast)} ring-2 ${colors.bg} ${colors.border} border flex items-center justify-center transition-transform group-hover:scale-110`}
                style={{ width: size, height: size, borderRadius: "50%" }}
              >
                <span className={`${colors.text} font-mono text-[10px] font-bold`}>
                  {node.signalCount}
                </span>
              </div>

              {/* Label, visible on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-14 left-1/2 -translate-x-1/2 bg-vanta-bg-elevated border border-vanta-border px-2.5 py-1.5 whitespace-nowrap z-30 min-w-[140px]">
                <p className="text-vanta-text text-[11px] font-mono font-semibold truncate">{node.name}</p>
                <p className="text-vanta-text-low text-[9px] font-mono">
                  {node.signalCount} signals · {node.highPriority} high · {recencyLabel(node.daysSinceLast)}
                </p>
                <div className="flex gap-1 mt-1">
                  {Object.entries(node.signalTypes).map(([type, count]) => {
                    const tc = SIGNAL_TYPE_COLORS[type as keyof typeof SIGNAL_TYPE_COLORS] || SIGNAL_TYPE_COLORS.CONTEXT;
                    return (
                      <span key={type} className={`${tc.bg} ${tc.text} text-[8px] font-mono px-1 py-0.5 border ${tc.border}`}>
                        {type} {count}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table fallback for all contacts */}
      <div className="border border-vanta-border">
        <div className="grid grid-cols-[1fr_60px_60px_80px] gap-0 text-[10px] font-mono uppercase tracking-wider text-vanta-text-muted border-b border-vanta-border px-3 py-2">
          <span>Contact</span>
          <span className="text-center">Signals</span>
          <span className="text-center">High</span>
          <span className="text-right">Last seen</span>
        </div>
        {nodes.map((node) => {
          const colors = SIGNAL_TYPE_COLORS[node.dominantType as keyof typeof SIGNAL_TYPE_COLORS] || SIGNAL_TYPE_COLORS.CONTEXT;
          return (
            <div
              key={node.name}
              className="grid grid-cols-[1fr_60px_60px_80px] gap-0 px-3 py-2 border-b border-vanta-border-mid hover:bg-vanta-bg-elevated transition-colors"
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
