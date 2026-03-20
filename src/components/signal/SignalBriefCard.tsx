import { useState, useEffect } from "react";
import { RefreshCcw, X, Zap } from "lucide-react";
import { Motion } from "@/components/ui/motion";
import SignalBriefItem from "./SignalBriefItem";
import ContextSwitcher from "@/components/context/ContextSwitcher";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { supabase } from "@/integrations/supabase/client";

interface BriefData {
  headline: string;
  summary: string;
  items: { id: string; icon: string; label: string; value: string; trend: "up" | "down" | "neutral"; trendLabel?: string }[];
  generated_at: string;
}

const FALLBACK_BRIEF: BriefData = {
  headline: "Your morning brief is loading…",
  summary: "Generating your personalized signal intelligence.",
  items: [],
  generated_at: new Date().toISOString(),
};

export default function SignalBriefCard() {
  const [dismissed, setDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { prefs, loading: prefsLoading } = useUserPreferences();

  const fetchBrief = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-brief");
      if (!error && data) {
        setBrief(data as BriefData);
      }
    } catch (e) {
      console.error("Brief fetch failed:", e);
    } finally {
      setRefreshing(false);
      setLoaded(true);
    }
  };

  // Auto-fetch on mount if setup is complete
  useEffect(() => {
    if (!prefsLoading && prefs.context_setup_complete && !loaded) {
      fetchBrief();
    } else if (!prefsLoading) {
      setLoaded(true);
    }
  }, [prefsLoading, prefs.context_setup_complete]);

  if (prefsLoading || dismissed) return null;

  const setupComplete = prefs.context_setup_complete;
  const displayBrief = brief || FALLBACK_BRIEF;

  const time = new Date(displayBrief.generated_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Motion>
      <div
        className="relative overflow-hidden rounded-sm mb-8 light"
        style={{
          background: "hsl(0 0% 100%)",
          border: "1px solid hsl(0 0% 0% / 0.12)",
          color: "hsl(0 0% 0%)",
        }}
      >
        <div className="p-5 md:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: "hsl(30 4% 18%)" }}>
            Today's Signal
          </p>

          {setupComplete && (
            <div className="mb-3">
              <ContextSwitcher />
            </div>
          )}

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
              <h2 className="font-display text-[18px] md:text-[20px] font-semibold mb-5 leading-snug" style={{ color: "hsl(0 0% 0%)" }}>
                {displayBrief.headline}
              </h2>

              {displayBrief.items.length > 0 && (
                <div className="flex flex-wrap mb-5" style={{ borderColor: "hsl(0 0% 0% / 0.08)" }}>
                  {displayBrief.items.map((item, i) => (
                    <div key={item.id} className="flex-1 min-w-[100px]" style={{ borderLeft: i > 0 ? "1px solid hsl(0 0% 0% / 0.08)" : "none" }}>
                      <SignalBriefItem {...item} forceLight />
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-4" style={{ borderTop: "1px solid hsl(0 0% 0% / 0.08)" }} />

              <p className="font-sans text-[13px] leading-relaxed mb-5" style={{ color: "hsl(0 0% 35%)" }}>
                {displayBrief.summary}
              </p>

              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px]" style={{ color: "hsl(0 0% 50%)" }}>
                  Generated at {time}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchBrief}
                    disabled={refreshing}
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
