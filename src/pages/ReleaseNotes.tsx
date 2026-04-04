import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { releaseNotes, type ReleaseEntry } from "@/data/releaseNotes";
import { Zap, ArrowRight, Sparkles, FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  isToday,
  isThisWeek,
  isThisMonth,
  parseISO,
  format,
} from "date-fns";

type TimeFilter = "all" | "today" | "week" | "month";

const TYPE_STYLES: Record<string, string> = {
  feature: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  fix: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  improvement: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  breaking: "bg-red-500/15 text-red-400 border-red-500/30",
};

const TYPE_LABELS: Record<string, string> = {
  feature: "NEW",
  fix: "FIX",
  improvement: "IMP",
  breaking: "BRK",
};

/* ── Featured Release Card (larger, editorial treatment) ── */
function FeaturedRelease({ entry }: { entry: ReleaseEntry }) {
  const d = parseISO(entry.date);
  const featureCount = entry.changes.filter((c) => c.type === "feature").length;
  return (
    <div className="border border-border rounded-sm p-5 bg-card/50 hover:bg-card/80 transition-colors">
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[20px] font-bold tracking-tight text-foreground">
            v{entry.version}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {format(d, "MMM d, yyyy")}
          </span>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[9px] tracking-[0.1em] px-1.5 py-0 h-[18px] rounded-sm border border-primary/30 text-primary bg-primary/5"
        >
          {featureCount} features
        </Badge>
      </div>
      <h3 className="font-sans text-[15px] font-semibold text-foreground/90 mb-3">
        {entry.title}
      </h3>
      <ul className="space-y-2">
        {entry.changes.slice(0, 4).map((c, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Badge
              variant="outline"
              className={`shrink-0 mt-0.5 font-mono text-[9px] tracking-[0.1em] px-1.5 py-0 h-[18px] rounded-sm border ${TYPE_STYLES[c.type]}`}
            >
              {TYPE_LABELS[c.type]}
            </Badge>
            <span className="font-sans text-[13px] text-muted-foreground leading-relaxed">
              {c.text}
            </span>
          </li>
        ))}
        {entry.changes.length > 4 && (
          <li className="font-mono text-[11px] text-muted-foreground/60 pl-7">
            + {entry.changes.length - 4} more changes
          </li>
        )}
      </ul>
    </div>
  );
}

/* ── Standard version block (compact, timeline style) ── */
function VersionBlock({ entry }: { entry: ReleaseEntry }) {
  const d = parseISO(entry.date);
  return (
    <div className="group">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono text-[22px] font-bold tracking-tight text-foreground">
          v{entry.version}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          {format(d, "MMM d, yyyy")}
        </span>
      </div>
      <h3 className="font-sans text-[15px] font-semibold text-foreground/90 mb-4">
        {entry.title}
      </h3>
      <ul className="space-y-2.5">
        {entry.changes.map((c, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Badge
              variant="outline"
              className={`shrink-0 mt-0.5 font-mono text-[9px] tracking-[0.1em] px-1.5 py-0 h-[18px] rounded-sm border ${TYPE_STYLES[c.type]}`}
            >
              {TYPE_LABELS[c.type]}
            </Badge>
            <span className="font-sans text-[13px] text-muted-foreground leading-relaxed">
              {c.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ReleaseNotes() {
  const [filter, setFilter] = useState<TimeFilter>("all");

  /* Split: first 2 releases are "featured", rest are chronological */
  const featured = releaseNotes.slice(0, 2);
  const chronological = releaseNotes.slice(2);

  const filtered = useMemo(() => {
    if (filter === "all") return chronological;
    return chronological.filter((e) => {
      const d = parseISO(e.date);
      if (filter === "today") return isToday(d);
      if (filter === "week") return isThisWeek(d, { weekStartsOn: 1 });
      if (filter === "month") return isThisMonth(d);
      return true;
    });
  }, [filter, chronological]);

  const filters: { key: TimeFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Platform · Release Notes
        </p>
        <h1 className="font-sans text-[28px] font-extrabold tracking-tight text-foreground mb-1">
          What's New
        </h1>
        <p className="font-sans text-[14px] text-muted-foreground">
          Every version shipped. Every signal strengthened.
        </p>
      </div>

      {/* Latest Drop banner */}
      <Link
        to="/product/latest"
        className="flex items-center justify-between gap-3 px-4 py-3 mb-6 border border-primary/20 bg-primary/5 rounded-sm group hover:border-primary/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-primary shrink-0" />
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
              Latest Drop · v2.6
            </span>
            <p className="font-sans text-[13px] text-muted-foreground leading-snug">
              Navigation consolidation, sidebar reorg & Context Commander reference.
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </Link>


      {/* Featured: last 2 releases */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Recent Releases
          </span>
        </div>
        <div className="space-y-4">
          {featured.map((entry) => (
            <FeaturedRelease key={entry.version} entry={entry} />
          ))}
        </div>
      </div>

      <Separator className="mb-8 bg-border/50" />

      {/* Time filter pills */}
      <div className="flex gap-1.5 mb-8">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-sm border transition-all duration-200 ${
              filter === f.key
                ? "bg-primary/10 border-primary text-primary"
                : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Chronological version thread */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[3px] top-2 bottom-0 w-px bg-border" />

        <div className="space-y-0">
          {filtered.length === 0 && (
            <p className="pl-8 font-mono text-[12px] text-muted-foreground">
              No releases in this period.
            </p>
          )}
          {filtered.map((entry, i) => (
            <div key={entry.version} className="relative pl-8">
              {/* Timeline dot */}
              <div className="absolute left-0 top-2 w-[7px] h-[7px] rounded-full bg-primary ring-2 ring-background" />
              <VersionBlock entry={entry} />
              {i < filtered.length - 1 && (
                <Separator className="my-8 bg-border/50" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
