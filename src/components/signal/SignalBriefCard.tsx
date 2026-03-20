import { useState } from "react";
import { RefreshCcw, X, Zap } from "lucide-react";
import { Motion } from "@/components/ui/motion";
import SignalBriefItem from "./SignalBriefItem";
import ContextSwitcher from "@/components/context/ContextSwitcher";

interface BriefItem {
  id: string;
  icon: string;
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  trendLabel?: string;
}

interface SignalBrief {
  id: string;
  generatedAt: string;
  headline: string;
  items: BriefItem[];
  summary: string;
  date: string;
}

const mockBrief: SignalBrief = {
  id: "brief-001",
  generatedAt: "2026-03-19T06:02:00Z",
  headline: "Two clients are quiet — worth a quick check-in.",
  date: "March 19, 2026",
  items: [
    { id: "s1", icon: "Users", label: "Active Clients", value: "4", trend: "neutral", trendLabel: "No change" },
    { id: "s2", icon: "DollarSign", label: "Revenue This Month", value: "$6,240", trend: "up", trendLabel: "+18% vs last month" },
    { id: "s3", icon: "AlertCircle", label: "Overdue Tasks", value: "3", trend: "down", trendLabel: "Down from 5" },
  ],
  summary:
    "Revenue is trending well but two client accounts have had no activity in 8+ days. Consider a quick pulse-check before end of week. Overdue tasks are declining — good momentum.",
};

export default function SignalBriefCard() {
  const [dismissed, setDismissed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const setupComplete = localStorage.getItem("vanta_context_setup") === "true";

  if (dismissed) return null;

  const time = new Date(mockBrief.generatedAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Motion>
      <div
        className="relative rounded-xl overflow-hidden mb-8"
        style={{
          background: "linear-gradient(135deg, hsl(0 0% 10%), hsl(0 0% 7%))",
        }}
      >
        {/* Gradient border accent */}
        <div className="absolute inset-0 rounded-xl pointer-events-none" style={{
          background: "linear-gradient(to right, hsl(240 60% 60% / 0.3), hsl(270 60% 60% / 0.2), transparent)",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "xor",
          WebkitMaskComposite: "xor",
          padding: "1px",
          borderRadius: "inherit",
        }} />

        <div className="relative p-5 md:p-6">
          {/* Header label */}
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(270_60%_70%)] mb-1">
            Today's Signal
          </p>

          {/* Context switcher — only if setup done */}
          {setupComplete && (
            <div className="mb-3">
              <ContextSwitcher />
            </div>
          )}

          {/* Empty state */}
          {!setupComplete ? (
            <div className="py-6 text-center">
              <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="font-sans text-[14px] text-muted-foreground leading-relaxed max-w-sm mx-auto mb-4">
                Connect your first context to activate your Signal Brief. Vanta Signal will brief you every morning once your data is live.
              </p>
              <a
                href="/setup/context"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(270_60%_60%)] text-white font-mono text-[11px] uppercase tracking-wider rounded-sm hover:bg-[hsl(270_60%_50%)] transition-colors"
              >
                Set Up Contexts
              </a>
            </div>
          ) : (
            <>
              {/* Headline */}
              <h2 className="font-display text-[18px] md:text-[20px] font-semibold text-foreground mb-5 leading-snug">
                {mockBrief.headline}
              </h2>

              {/* Stat tiles */}
              <div className="flex flex-wrap divide-x divide-border/30 mb-5" key={refreshKey}>
                {mockBrief.items.map((item) => (
                  <SignalBriefItem key={item.id} {...item} />
                ))}
              </div>

              {/* Separator */}
              <div className="border-t border-border/20 mb-4" />

              {/* What this means */}
              <p className="font-sans text-[13px] text-muted-foreground leading-relaxed mb-5">
                {mockBrief.summary}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">
                  Generated at {time}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setRefreshKey((k) => k + 1)}
                    className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" /> Refresh
                  </button>
                  <button
                    onClick={() => setDismissed(true)}
                    className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Dismiss
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Motion>
  );
}
