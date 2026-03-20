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
  const [refreshing, setRefreshing] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(mockBrief.generatedAt);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => {
      setGeneratedAt(new Date().toISOString());
      setRefreshing(false);
    }, 800);
  };

  const setupComplete = localStorage.getItem("vanta_context_setup") === "true";

  if (dismissed) return null;

  const time = new Date(generatedAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Motion>
      {/* Force light-mode Vanta B/W: white card, black text, warm charcoal accent */}
      <div
        className="relative overflow-hidden rounded-sm mb-8 light"
        style={{
          background: "hsl(0 0% 100%)",
          border: "1px solid hsl(0 0% 0% / 0.12)",
          color: "hsl(0 0% 0%)",
        }}
      >
        <div className="p-5 md:p-6">
          {/* Header label */}
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: "hsl(30 4% 18%)" }}>
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
            <div className="py-4 text-center">
              <Zap className="w-7 h-7 mx-auto mb-3 opacity-40" style={{ color: "hsl(0 0% 35%)" }} />
              <p className="font-sans text-[13px] leading-relaxed max-w-sm mx-auto mb-4" style={{ color: "hsl(0 0% 35%)" }}>
                Connect your first context to activate your Signal Brief. Vanta Signal will brief you every morning once your data is live.
              </p>
              <a
                href="/setup/context"
                className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[11px] uppercase tracking-wider rounded-sm transition-colors"
                style={{ background: "hsl(30 4% 18%)", color: "hsl(0 0% 100%)" }}
              >
                Set Up Contexts
              </a>
            </div>
          ) : (
            <>
              {/* Headline */}
              <h2 className="font-display text-[18px] md:text-[20px] font-semibold mb-5 leading-snug" style={{ color: "hsl(0 0% 0%)" }}>
                {mockBrief.headline}
              </h2>

              {/* Stat tiles */}
              <div className="flex flex-wrap mb-5" key={refreshKey} style={{ borderColor: "hsl(0 0% 0% / 0.08)" }}>
                {mockBrief.items.map((item, i) => (
                  <div key={item.id} className="flex-1 min-w-[100px]" style={{ borderLeft: i > 0 ? "1px solid hsl(0 0% 0% / 0.08)" : "none" }}>
                    <SignalBriefItem {...item} forceLight />
                  </div>
                ))}
              </div>

              {/* Separator */}
              <div className="mb-4" style={{ borderTop: "1px solid hsl(0 0% 0% / 0.08)" }} />

              {/* What this means */}
              <p className="font-sans text-[13px] leading-relaxed mb-5" style={{ color: "hsl(0 0% 35%)" }}>
                {mockBrief.summary}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 50%)" }}>
                  Generated at {time}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefresh}
                    className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors"
                    style={{ color: "hsl(0 0% 50%)" }}
                  >
                    <RefreshCcw className={`w-3.5 h-3.5 transition-transform duration-700 ${refreshing ? "animate-spin" : ""}`} /> Refresh
                  </button>
                  <button
                    onClick={() => setDismissed(true)}
                    className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors"
                    style={{ color: "hsl(0 0% 50%)" }}
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
