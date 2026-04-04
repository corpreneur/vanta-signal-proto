import { Users, TrendingUp, Clock, AlertCircle } from "lucide-react";

interface AttendeeIntel {
  name: string;
  email: string;
  title: string;
  company: string;
  strength: number;
  strengthLabel: string;
  lastInteraction: string;
  lastChannel: string;
  pastSignals: { type: string; text: string; ago: string }[];
  openCommitment: string;
}

const ATTENDEE_INTEL: AttendeeIntel[] = [
  {
    name: "Sarah Chen",
    email: "sarah@acme.vc",
    title: "General Partner",
    company: "Acme Ventures",
    strength: 82,
    strengthLabel: "Strong",
    lastInteraction: "3 days ago",
    lastChannel: "Email",
    pastSignals: [
      { type: "INVESTMENT", text: "Mentioned Series A timing — targeting Q2 close", ago: "3 weeks ago" },
      { type: "INSIGHT", text: "Shared thesis on vertical SaaS market dynamics", ago: "5 weeks ago" },
      { type: "DECISION", text: "Agreed to co-lead with Acme's seed fund", ago: "2 months ago" },
    ],
    openCommitment: "Send updated cap table by end of week",
  },
  {
    name: "Marcus Rivera",
    email: "marcus@portfolio.co",
    title: "Managing Director",
    company: "Portfolio Capital",
    strength: 64,
    strengthLabel: "Growing",
    lastInteraction: "12 days ago",
    lastChannel: "Zoom",
    pastSignals: [
      { type: "CONTEXT", text: "Discussed portfolio allocation strategy for H2", ago: "2 weeks ago" },
      { type: "INVESTMENT", text: "Expressed interest in $1.5–2M allocation", ago: "1 month ago" },
    ],
    openCommitment: "Follow up on LP approval timeline",
  },
];

const SIGNAL_DOT_COLORS: Record<string, string> = {
  DECISION: "bg-amber-400",
  INVESTMENT: "bg-emerald-400",
  INSIGHT: "bg-blue-400",
  CONTEXT: "bg-purple-400",
};

interface Props {
  dimmed: boolean;
}

export default function PreSessionDossier({ dimmed }: Props) {
  return (
    <section
      className={`border border-border bg-card p-4 space-y-4 transition-opacity duration-300 ${dimmed ? "opacity-40 pointer-events-none" : ""}`}
    >
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-mono text-xs uppercase tracking-wider text-foreground">
          Pre-Meeting Dossier
        </h2>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
        Attendee intelligence compiled from your signal history. Review context before the session begins.
      </p>

      <div className="grid gap-3">
        {ATTENDEE_INTEL.map((a) => (
          <div key={a.email} className="border border-border p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] font-bold text-foreground">{a.name}</span>
                <span className="font-mono text-[9px] text-muted-foreground ml-2">
                  {a.title} · {a.company}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-[9px] text-foreground font-bold">{a.strength}</span>
                <span className="font-mono text-[8px] text-muted-foreground">/ 100</span>
              </div>
            </div>

            {/* Strength bar */}
            <div className="h-1 w-full bg-muted overflow-hidden">
              <div
                className="h-full bg-foreground transition-all duration-500"
                style={{ width: `${a.strength}%` }}
              />
            </div>

            {/* Last interaction */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-[9px] text-muted-foreground">
                Last: {a.lastInteraction} via {a.lastChannel}
              </span>
            </div>

            {/* Past signals */}
            <div className="space-y-1">
              <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                Matched signals
              </span>
              {a.pastSignals.map((s, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <div className={`w-1.5 h-1.5 mt-1 shrink-0 ${SIGNAL_DOT_COLORS[s.type] || "bg-muted-foreground"}`} />
                  <span className="font-mono text-[9px] text-foreground/80 leading-relaxed">
                    {s.text}
                  </span>
                  <span className="font-mono text-[8px] text-muted-foreground whitespace-nowrap ml-auto">
                    {s.ago}
                  </span>
                </div>
              ))}
            </div>

            {/* Open commitment */}
            <div className="flex items-start gap-1.5 border-t border-border pt-2">
              <AlertCircle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground block">
                  Open commitment
                </span>
                <span className="font-mono text-[10px] text-foreground">{a.openCommitment}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
