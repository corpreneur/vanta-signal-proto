import { useMemo } from "react";

type Props = {
  items: {
    status: string;
    sprint_phase: number;
    priority: string;
  }[];
};

export default function SprintCompass({ items }: Props) {
  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.status === "done").length;
    const inProgress = items.filter((i) => i.status === "in-progress").length;
    const parked = items.filter((i) => i.status === "parked").length;
    const highPri = items.filter((i) => i.priority === "high").length;
    const now = items.filter((i) => i.sprint_phase === 1).length;
    const next = items.filter((i) => i.sprint_phase === 2).length;
    const backlog = items.filter((i) => i.sprint_phase === 3).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, parked, highPri, now, next, backlog, pct };
  }, [items]);

  const radius = 52;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (stats.pct / 100) * circumference;

  return (
    <div className="border border-border rounded-lg bg-card p-5">
      <div className="flex items-center gap-6 flex-wrap">
        {/* Radial ring */}
        <div className="relative w-[130px] h-[130px] shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={stroke}
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-bold text-foreground leading-none">
              {stats.pct}%
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
              Complete
            </span>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 flex-1 min-w-0">
          <Stat label="Total" value={stats.total} />
          <Stat label="Done" value={stats.done} accent="text-emerald-500" />
          <Stat label="In Progress" value={stats.inProgress} accent="text-primary" />
          <Stat label="Parked" value={stats.parked} accent="text-muted-foreground" />
          <Stat label="High Pri" value={stats.highPri} accent="text-destructive" />
          <Stat label="Now" value={stats.now} accent="text-destructive" />
          <Stat label="Next" value={stats.next} accent="text-amber-500" />
          <Stat label="Backlog" value={stats.backlog} accent="text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="flex flex-col">
      <span className={`font-mono text-lg font-bold leading-none ${accent || "text-foreground"}`}>
        {value}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </span>
    </div>
  );
}
