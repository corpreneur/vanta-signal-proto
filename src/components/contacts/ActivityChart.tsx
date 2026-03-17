import { useMemo } from "react";
import type { Signal } from "@/data/signals";

interface ActivityChartProps {
  signals: Signal[];
}

/**
 * 12-week activity heatmap showing signal density per week,
 * inspired by GitHub contribution graphs.
 */
export default function ActivityChart({ signals }: ActivityChartProps) {
  const weeks = useMemo(() => {
    const now = new Date();
    const result: { label: string; count: number; maxCount: number }[] = [];

    // Build 12 weeks of data
    let maxCount = 0;
    for (let w = 11; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - w * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const count = signals.filter((s) => {
        const d = new Date(s.capturedAt);
        return d >= weekStart && d < weekEnd;
      }).length;

      if (count > maxCount) maxCount = count;

      const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      result.push({ label, count, maxCount: 0 });
    }

    // Set max for normalization
    return result.map((w) => ({ ...w, maxCount }));
  }, [signals]);

  const maxCount = weeks[0]?.maxCount || 1;

  return (
    <div className="border border-border bg-card p-4">
      <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
        Activity · 12 Weeks
      </h3>
      <div className="flex items-end gap-1 h-16">
        {weeks.map((week, i) => {
          const height = maxCount > 0 ? Math.max(4, (week.count / maxCount) * 100) : 4;
          const opacity = maxCount > 0 ? Math.max(0.15, week.count / maxCount) : 0.15;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full rounded-sm bg-primary transition-all duration-300 group-hover:bg-primary/90"
                style={{ height: `${height}%`, opacity }}
              />
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border border-border rounded text-[8px] font-mono text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-sm">
                {week.label}: {week.count} signal{week.count !== 1 ? "s" : ""}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        <span className="font-mono text-[8px] text-muted-foreground">{weeks[0]?.label}</span>
        <span className="font-mono text-[8px] text-muted-foreground">{weeks[weeks.length - 1]?.label}</span>
      </div>
    </div>
  );
}
