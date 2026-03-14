import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import { Sun, Moon, Sunrise, CalendarDays, AlertTriangle, Zap } from "lucide-react";

interface MorningContextProps {
  signals: Signal[];
}

function greeting(): { text: string; icon: React.ElementType } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", icon: Sunrise };
  if (h < 17) return { text: "Good afternoon", icon: Sun };
  return { text: "Good evening", icon: Moon };
}

export default function MorningContext({ signals }: MorningContextProps) {
  const { data: meetingCount = 0 } = useQuery({
    queryKey: ["morning-meeting-count"],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const { count } = await supabase
        .from("upcoming_meetings")
        .select("*", { count: "exact", head: true })
        .gte("starts_at", todayStart.toISOString())
        .lte("starts_at", todayEnd.toISOString());
      return count || 0;
    },
    staleTime: 60_000,
  });

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todaySignals = signals.filter(
      (s) => s.capturedAt.startsWith(today)
    );
    const unresolvedHigh = signals.filter(
      (s) => s.priority === "high" && s.status !== "Complete"
    );
    const overdue = signals.filter(
      (s) => s.dueDate && s.dueDate < today && s.status !== "Complete"
    );
    const pinnedCount = signals.filter((s) => (s as any).pinned).length;

    // Generate a contextual one-liner
    let contextLine = "";
    if (todaySignals.length === 0 && unresolvedHigh.length === 0) {
      contextLine = "Quiet so far. No urgent signals.";
    } else if (unresolvedHigh.length > 3) {
      contextLine = `${unresolvedHigh.length} high-priority signals need attention.`;
    } else if (overdue.length > 0) {
      contextLine = `${overdue.length} overdue item${overdue.length > 1 ? "s" : ""} waiting for action.`;
    } else if (todaySignals.length > 0) {
      contextLine = `${todaySignals.length} signal${todaySignals.length > 1 ? "s" : ""} captured today.`;
    } else {
      contextLine = `${unresolvedHigh.length} high-priority signal${unresolvedHigh.length > 1 ? "s" : ""} in queue.`;
    }

    return { todaySignals: todaySignals.length, unresolvedHigh: unresolvedHigh.length, overdue: overdue.length, pinnedCount, contextLine };
  }, [signals]);

  const { text: greetText, icon: GreetIcon } = greeting();
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="border border-vanta-border bg-vanta-bg-elevated p-4 md:p-5 mb-6">
      {/* Date row */}
      <div className="flex items-center gap-2 mb-3">
        <GreetIcon className="w-4 h-4 text-vanta-accent" />
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-mid">
          {greetText}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-muted ml-auto">
          {dateStr}
        </span>
      </div>

      {/* Context line */}
      <p className="font-sans text-[13px] leading-[1.6] text-foreground mb-3">
        {stats.contextLine}
      </p>

      {/* Metrics row */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-vanta-accent" />
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low">
            {stats.todaySignals} today
          </span>
        </div>
        {meetingCount > 0 && (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3 text-vanta-accent-zoom" />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low">
              {meetingCount} meeting{meetingCount > 1 ? "s" : ""}
            </span>
          </div>
        )}
        {stats.unresolvedHigh > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-vanta-accent" />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-accent">
              {stats.unresolvedHigh} high priority
            </span>
          </div>
        )}
        {stats.overdue > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-destructive" />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-destructive">
              {stats.overdue} overdue
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
