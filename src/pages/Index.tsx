import { useMemo, useState, useRef, useCallback } from "react";
import { StickyNote, PenLine, Send as SendIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import { useUserMode } from "@/hooks/use-user-mode";
import { Motion } from "@/components/ui/motion";
import SignalDetailDrawer from "@/components/SignalDetailDrawer";
import CoolingAlerts from "@/components/CoolingAlerts";
import InlineBrainDump from "@/components/InlineBrainDump";
import WhatsAhead from "@/components/WhatsAhead";
import EnhancedActionItems from "@/components/EnhancedActionItems";
import DailyTimeline from "@/components/DailyTimeline";
import SignalEntryCard from "@/components/SignalEntryCard";
import { toast } from "sonner";
import {
  MessageSquare, Phone, Video, Mail, Calendar,
  Shield, Sparkles, Moon, ArrowRight,
} from "lucide-react";

/* ── data fetchers ─────────────────────────────────────── */

const fetchSignals = async (): Promise<Signal[]> => {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .order("captured_at", { ascending: false })
    .limit(200);
  if (error) return [];
  return (data || []).map((row) => ({
    id: row.id, signalType: row.signal_type, sender: row.sender, summary: row.summary,
    sourceMessage: row.source_message, priority: row.priority, capturedAt: row.captured_at,
    actionsTaken: row.actions_taken || [], status: row.status,
    source: (row as Record<string, unknown>).source as Signal["source"] || "linq",
    rawPayload: row.raw_payload as Record<string, unknown> | null,
    linqMessageId: row.linq_message_id,
    emailMetadata: (row as Record<string, unknown>).email_metadata as Signal["emailMetadata"] || null,
    meetingId: (row as Record<string, unknown>).meeting_id as string | null,
    confidenceScore: row.confidence_score ?? null,
    classificationReasoning: row.classification_reasoning ?? null,
    dueDate: row.due_date ?? null, pinned: row.pinned ?? false, riskLevel: row.risk_level ?? null,
  }));
};

async function fetchTodayMeetingCount(): Promise<number> {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const { count } = await supabase.from("upcoming_meetings")
    .select("*", { count: "exact", head: true })
    .gte("starts_at", today.toISOString()).lt("starts_at", tomorrow.toISOString());
  return count || 0;
}

/* ── constants ─────────────────────────────────────────── */

const CHANNELS = [
  { key: "linq", label: "iMessage", icon: MessageSquare, color: "text-vanta-accent" },
  { key: "phone", label: "Phone", icon: Phone, color: "text-vanta-accent-phone" },
  { key: "recall", label: "Zoom", icon: Video, color: "text-vanta-accent-zoom" },
  { key: "gmail", label: "Email", icon: Mail, color: "text-vanta-accent-teal" },
  { key: "calendar", label: "Calendar", icon: Calendar, color: "text-vanta-accent-amber" },
  { key: "manual", label: "Notes", icon: StickyNote, color: "text-vanta-accent-violet" },
];

const MODE_META: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  executive: { label: "Executive", icon: Shield, color: "text-vanta-accent-amber" },
  dnd: { label: "DND", icon: Moon, color: "text-destructive" },
  creative: { label: "Creative", icon: Sparkles, color: "text-vanta-accent" },
};

/* ── helpers ───────────────────────────────────────────── */

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function todayCount(signals: Signal[]) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  return signals.filter((s) => new Date(s.capturedAt) >= start).length;
}

function getSignalPulse(signals: Signal[]): string {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const todaySignals = signals.filter((s) => new Date(s.capturedAt) >= start);
  const uniqueSenders = new Set(todaySignals.map((s) => s.sender));
  const waitingOn = signals.filter((s) => s.status === "In Progress").length;
  const decisions = signals.filter((s) => s.signalType === "DECISION" && s.status !== "Complete").length;
  const overdue = signals.filter((s) => s.dueDate && new Date(s.dueDate) < new Date() && s.status !== "Complete").length;

  const parts: string[] = [];
  if (uniqueSenders.size > 0) parts.push(`${uniqueSenders.size} ${uniqueSenders.size === 1 ? "person" : "people"} in your orbit today`);
  if (waitingOn > 0) parts.push(`${waitingOn} awaiting response`);
  if (decisions > 0) parts.push(`${decisions} ${decisions === 1 ? "decision" : "decisions"} pending`);
  if (overdue > 0) parts.push(`${overdue} overdue`);
  if (parts.length === 0) return "Quiet morning — good time to think";
  return parts.slice(0, 2).join(" · ");
}

function getPeopleCount(signals: Signal[]): number {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const todaySignals = signals.filter((s) => new Date(s.capturedAt) >= start);
  return new Set(todaySignals.map((s) => s.sender)).size;
}

/* ── Open Note Field ───────────────────────────────────── */

function OpenNoteField() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("brain-dump", {
        body: { text: trimmed },
      });
      if (error) throw error;
      const cls = data?.classification;
      if (cls) {
        toast.success(`Signal captured · ${cls.signalType}`);
        queryClient.invalidateQueries({ queryKey: ["signals-dashboard"] });
      }
      setText("");
    } catch {
      toast.error("Failed to capture — try again");
    } finally {
      setLoading(false);
    }
  }, [text, loading, queryClient]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mb-6 border border-border bg-card p-3 transition-all focus-within:border-primary/40">
      <div className="flex items-start gap-2">
        <PenLine className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Capture a thought, a name, a fragment…"
          rows={1}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 resize-none outline-none min-h-[28px] max-h-[120px] leading-relaxed font-sans"
          style={{ fieldSizing: "content" } as React.CSSProperties}
          disabled={loading}
        />
        {text.trim() && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="shrink-0 p-1.5 bg-foreground text-background rounded-sm hover:bg-foreground/90 transition-colors disabled:opacity-50"
            title="Send (⌘↵)"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border border-background/40 border-t-background rounded-full animate-spin" />
            ) : (
              <SendIcon className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
      {text.trim() && (
        <p className="font-mono text-[8px] text-muted-foreground/50 mt-1.5 ml-6">
          ⌘↵ to capture
        </p>
      )}
    </div>
  );
}

/* ── component ─────────────────────────────────────────── */

const Index = () => {
  const [drawerSignal, setDrawerSignal] = useState<Signal | null>(null);
  const { mode } = useUserMode();

  const { data: signals = [] } = useQuery({ queryKey: ["signals-dashboard"], queryFn: fetchSignals, refetchInterval: 60_000 });
  const { data: meetingCount = 0 } = useQuery({ queryKey: ["dashboard-meeting-count"], queryFn: fetchTodayMeetingCount, refetchInterval: 120_000 });

  const activeSignals = useMemo(() => signals.filter((s) => s.signalType !== "NOISE"), [signals]);
  const noiseCount = useMemo(() => signals.length - activeSignals.length, [signals, activeSignals]);
  const highCount = useMemo(() => activeSignals.filter((s) => s.priority === "high").length, [activeSignals]);
  const todayNew = useMemo(() => todayCount(activeSignals), [activeSignals]);
  const signalPulse = useMemo(() => getSignalPulse(activeSignals), [activeSignals]);
  const peopleCount = useMemo(() => getPeopleCount(activeSignals), [activeSignals]);

  const top2 = useMemo(() => {
    return activeSignals
      .filter((s) => s.status !== "Complete")
      .sort((a, b) => {
        const prio = { high: 0, medium: 1, low: 2 };
        if (prio[a.priority] !== prio[b.priority]) return prio[a.priority] - prio[b.priority];
        return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
      })
      .slice(0, 2);
  }, [activeSignals]);

  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeSignals.forEach((s) => { counts[s.source] = (counts[s.source] || 0) + 1; });
    return counts;
  }, [activeSignals]);

  const modeMeta = MODE_META[mode] || MODE_META.creative;
  const isDnd = mode === "dnd";
  const isExecutive = mode === "executive";

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8 md:px-10 relative overflow-x-hidden" data-testid="dashboard-root">

      {/* ══ Hero ══ */}
      <Motion>
        <header className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse-dot rounded-full" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Vanta Signal
            </span>
            <span className="w-px h-3 bg-border mx-1" />
            <span className={`font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 ${modeMeta.color}`}>
              <modeMeta.icon className="w-3 h-3" /> {modeMeta.label}
            </span>
          </div>

          <h1 className="font-display text-[clamp(32px,5.5vw,48px)] leading-[1.02] text-foreground mb-2" data-testid="dashboard-greeting">
            {greeting()}
          </h1>

          {!isDnd && (
            <p className="font-sans text-[14px] text-muted-foreground">
              {signalPulse}
            </p>
          )}
        </header>
      </Motion>

      {/* ══ Open Note — always-visible capture field ══ */}
      {!isDnd && (
        <Motion delay={10}>
          <OpenNoteField />
        </Motion>
      )}

      {/* ══ Inline stat strip ══ */}
      {!isDnd && (
        <Motion delay={20}>
          <div className="flex items-center gap-5 mb-6 pb-5 border-b border-border overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-display text-[22px] text-foreground">{peopleCount}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">People today</span>
            </div>
            <span className="w-px h-5 bg-border shrink-0" />
            <Link to="/signals" className="flex items-center gap-2 shrink-0 group">
              <span className="font-display text-[22px] text-primary group-hover:text-foreground transition-colors">{highCount}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">High</span>
            </Link>
            <span className="w-px h-5 bg-border shrink-0" />
            {CHANNELS.map((ch) => {
              const count = channelCounts[ch.key] || 0;
              if (count === 0) return null;
              return (
                <div key={ch.key} className="flex items-center gap-1.5 shrink-0">
                  <ch.icon className={`w-3 h-3 ${ch.color}`} />
                  <span className="font-mono text-[11px] text-foreground">{count}</span>
                </div>
              );
            })}
            {noiseCount > 0 && (
              <>
                <span className="w-px h-5 bg-border shrink-0" />
                <Link to="/focus?tab=noise" className="font-mono text-[9px] text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  {noiseCount} noise
                </Link>
              </>
            )}
          </div>
        </Motion>
      )}

      {/* ══ Priority Signals ══ */}
      {!isDnd && top2.length > 0 && (
        <Motion delay={30}>
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                Priority Signals
              </p>
              <Link to="/signals" className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-primary hover:text-primary/80 transition-colors">
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {top2.map((s) => (
                <SignalEntryCard key={s.id} signal={s} onClick={() => setDrawerSignal(s)} />
              ))}
            </div>
          </section>
        </Motion>
      )}

      {/* ══ Brain dump ══ */}
      {!isDnd && <InlineBrainDump />}

      {/* ══ Mode-specific content ══ */}
      {isDnd ? (
        <Motion delay={40}>
          <div className="flex items-center gap-2 py-3 mb-5">
            <Moon className="w-4 h-4 text-destructive" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Do Not Disturb · essentials only
            </span>
          </div>
          <WhatsAhead />
          <EnhancedActionItems onSignalClick={(s) => setDrawerSignal(s)} />
          <CoolingAlerts />
        </Motion>
      ) : isExecutive ? (
        <>
          {/* Executive: meetings first, then action items (high-only timeline), cooling alerts */}
          <WhatsAhead />
          <EnhancedActionItems onSignalClick={(s) => setDrawerSignal(s)} />
          <Motion delay={40}>
            <DailyTimeline signals={activeSignals} onSignalClick={(s) => setDrawerSignal(s)} highOnly />
          </Motion>
          <CoolingAlerts />
        </>
      ) : (
        <>
          {/* Creative: timeline first (all signals), then what's ahead, then actions */}
          <Motion delay={40}>
            <DailyTimeline signals={activeSignals} onSignalClick={(s) => setDrawerSignal(s)} highOnly={false} />
          </Motion>
          <WhatsAhead />
          <EnhancedActionItems onSignalClick={(s) => setDrawerSignal(s)} />
          <CoolingAlerts />
        </>
      )}

      {/* Signal Detail Drawer */}
      <SignalDetailDrawer signal={drawerSignal} open={!!drawerSignal} onClose={() => setDrawerSignal(null)} />

      {/* Footer */}
      <footer className="mt-12 mb-6 text-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40">
          {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </p>
      </footer>
    </div>
  );
};

export default Index;
