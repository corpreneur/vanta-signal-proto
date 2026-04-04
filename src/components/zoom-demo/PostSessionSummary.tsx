import {
  CheckCircle2, Clock, Users, Zap, FileText, Download,
  ArrowRight, UserCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

const SIGNAL_COLORS: Record<string, { bg: string; text: string }> = {
  DECISION: { bg: "bg-amber-500/10", text: "text-amber-400" },
  INVESTMENT: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  INSIGHT: { bg: "bg-blue-500/10", text: "text-blue-400" },
};

const KEY_TAKEAWAYS = [
  "Series A terms locked at $12M pre-money valuation",
  "Target close date set for Q3 with dual-lead structure",
  "Portfolio Capital allocating $2M from Fund III",
  "Vertical SaaS thesis validated — 3x unit economics advantage over horizontal",
];

const ACTION_ITEMS = [
  { assignee: "Sarah Chen", task: "Send updated term sheet by Friday", done: false },
  { assignee: "Marcus Rivera", task: "Confirm LP approval timeline within 48 hours", done: false },
  { assignee: "You", task: "Prepare revised cap table reflecting new allocation", done: false },
  { assignee: "You", task: "Schedule follow-up with legal counsel for closing docs", done: false },
];

const ENRICHED_PROFILES = [
  { name: "Sarah Chen", newSignals: 2, types: ["DECISION", "INSIGHT"] },
  { name: "Marcus Rivera", newSignals: 1, types: ["INVESTMENT"] },
];

function MetaItem({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-muted-foreground" />
      <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-mono text-[11px] font-bold text-foreground">{value}</span>
    </div>
  );
}

interface Props {
  onReset: () => void;
}

export default function PostSessionSummary({ onReset }: Props) {
  return (
    <div className="border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">
          Session complete — AI summary
        </h2>
      </div>

      {/* Metadata strip */}
      <div className="flex gap-4 border border-border p-2">
        <MetaItem icon={Clock} label="Duration" value="11m 08s" />
        <MetaItem icon={Users} label="Participants" value="3" />
        <MetaItem icon={Zap} label="Signals" value="3" />
      </div>

      {/* Narrative */}
      <div className="space-y-2">
        <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
          Meeting narrative
        </span>
        <p className="font-mono text-[10px] text-foreground/80 leading-relaxed">
          Series A terms were discussed and agreed at $12M pre-money valuation. Sarah Chen from Acme
          Ventures confirmed willingness to move fast on the deal structure, while Marcus Rivera
          committed a $2M allocation from Portfolio Capital targeting a Q3 close.
        </p>
        <p className="font-mono text-[10px] text-foreground/80 leading-relaxed">
          The group validated the vertical SaaS thesis, noting three-times better unit economics
          compared to horizontal alternatives. Both parties expressed strong conviction in the
          go-to-market strategy and current retention metrics.
        </p>
      </div>

      {/* Key takeaways */}
      <div className="space-y-1.5">
        <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
          Key takeaways
        </span>
        {KEY_TAKEAWAYS.map((t, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <div className="w-1 h-1 mt-1.5 bg-foreground shrink-0" />
            <span className="font-mono text-[10px] text-foreground leading-relaxed">{t}</span>
          </div>
        ))}
      </div>

      {/* Action items */}
      <div className="space-y-1.5">
        <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
          Action items
        </span>
        {ACTION_ITEMS.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5 border border-border">
            <div className="w-3 h-3 border border-muted-foreground flex items-center justify-center shrink-0">
              {item.done && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />}
            </div>
            <span className="font-mono text-[10px] text-foreground">
              <span className="font-bold">{item.assignee}:</span> {item.task}
            </span>
          </div>
        ))}
      </div>

      {/* Profile enrichment */}
      <div className="space-y-1.5">
        <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
          Profiles enriched
        </span>
        {ENRICHED_PROFILES.map((p) => (
          <div key={p.name} className="flex items-center gap-2 px-2 py-1.5 border border-border">
            <UserCheck className="h-3 w-3 text-emerald-400 shrink-0" />
            <span className="font-mono text-[10px] text-foreground font-bold">{p.name}</span>
            <span className="font-mono text-[9px] text-muted-foreground">
              +{p.newSignals} signal{p.newSignals > 1 ? "s" : ""}
            </span>
            <div className="flex gap-1 ml-auto">
              {p.types.map((t) => {
                const colors = SIGNAL_COLORS[t] ?? { bg: "bg-muted", text: "text-muted-foreground" };
                return (
                  <span
                    key={t}
                    className={`font-mono text-[7px] uppercase tracking-wider px-1.5 py-0.5 ${colors.bg} ${colors.text}`}
                  >
                    {t}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={onReset}
          className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 border border-border text-foreground hover:bg-muted transition-colors"
        >
          Reset demo
        </button>
        <Link
          to="/meetings"
          className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors inline-flex items-center gap-1.5"
        >
          <FileText className="h-3 w-3" /> View artifact
        </Link>
        <button
          onClick={() => {}}
          className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 border border-border text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1.5"
        >
          <Download className="h-3 w-3" /> Export PDF
        </button>
        <Link
          to="/product/zoom-sdk"
          className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 border border-border text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1.5"
        >
          Product concept <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
