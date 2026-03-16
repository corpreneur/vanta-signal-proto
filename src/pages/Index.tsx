import { useMemo, useState } from "react";
import { StickyNote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { useUserMode } from "@/hooks/use-user-mode";
import { Motion } from "@/components/ui/motion";
import SignalDetailDrawer from "@/components/SignalDetailDrawer";
import CoolingAlerts from "@/components/CoolingAlerts";
import InlineBrainDump from "@/components/InlineBrainDump";
import WhatsAhead from "@/components/WhatsAhead";
import ActionItems from "@/components/ActionItems";
import DailyTimeline from "@/components/DailyTimeline";
import {
  MessageSquare,
  Phone,
  Video,
  Mail,
  Calendar,
  ChevronRight,
  Shield,
  Sparkles,
  Moon,
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
    id: row.id,
    signalType: row.signal_type,
    sender: row.sender,
    summary: row.summary,
    sourceMessage: row.source_message,
    priority: row.priority,
    capturedAt: row.captured_at,
    actionsTaken: row.actions_taken || [],
    status: row.status,
    source: (row as Record<string, unknown>).source as Signal["source"] || "linq",
    rawPayload: row.raw_payload as Record<string, unknown> | null,
    linqMessageId: row.linq_message_id,
    emailMetadata: (row as Record<string, unknown>).email_metadata as Signal["emailMetadata"] || null,
    meetingId: (row as Record<string, unknown>).meeting_id as string | null,
    confidenceScore: row.confidence_score ?? null,
    classificationReasoning: row.classification_reasoning ?? null,
    dueDate: row.due_date ?? null,
    pinned: row.pinned ?? false,
    riskLevel: row.risk_level ?? null,
  }));
};

async function fetchTodayMeetingCount(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { count } = await supabase
    .from("upcoming_meetings")
    .select("*", { count: "exact", head: true })
    .gte("starts_at", today.toISOString())
    .lt("starts_at", tomorrow.toISOString());
  return count || 0;
}

/* ── constants ─────────────────────────────────────────── */

const CHANNELS = [
  { key: "linq", label: "iMessage", icon: MessageSquare, color: "text-vanta-accent", bg: "bg-vanta-accent/10", ring: "ring-vanta-accent/20", barColor: "bg-vanta-accent", href: "/product/intro" },
  { key: "phone", label: "Phone", icon: Phone, color: "text-vanta-accent-phone", bg: "bg-vanta-accent-phone/10", ring: "ring-vanta-accent-phone/20", barColor: "bg-vanta-accent-phone", href: "/product/phone-call" },
  { key: "recall", label: "Zoom", icon: Video, color: "text-vanta-accent-zoom", bg: "bg-vanta-accent-zoom/10", ring: "ring-vanta-accent-zoom/20", barColor: "bg-vanta-accent-zoom", href: "/product/meeting" },
  { key: "gmail", label: "Email", icon: Mail, color: "text-vanta-accent-teal", bg: "bg-vanta-accent-teal/10", ring: "ring-vanta-accent-teal/20", barColor: "bg-vanta-accent-teal", href: "/product/email" },
  { key: "calendar", label: "Calendar", icon: Calendar, color: "text-vanta-accent-amber", bg: "bg-vanta-accent-amber/10", ring: "ring-vanta-accent-amber/20", barColor: "bg-vanta-accent-amber", href: "/product/calendar" },
  { key: "manual", label: "Brain Dump", icon: StickyNote, color: "text-vanta-accent-violet", bg: "bg-vanta-accent-violet/10", ring: "ring-vanta-accent-violet/20", barColor: "bg-vanta-accent-violet", href: "/brain-dump" },
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

function formatRelative(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

function todayCount(signals: Signal[]) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return signals.filter((s) => new Date(s.capturedAt) >= start).length;
}

/* ── component ─────────────────────────────────────────── */

const Index = () => {
  const [drawerSignal, setDrawerSignal] = useState<Signal | null>(null);
  const { mode } = useUserMode();

  const { data: signals = [] } = useQuery({
    queryKey: ["signals-dashboard"],
    queryFn: fetchSignals,
    refetchInterval: 60_000,
  });

  const { data: meetingCount = 0 } = useQuery({
    queryKey: ["dashboard-meeting-count"],
    queryFn: fetchTodayMeetingCount,
    refetchInterval: 120_000,
  });

  const activeSignals = useMemo(() => signals.filter((s) => s.signalType !== "NOISE"), [signals]);
  const noiseCount = useMemo(() => signals.length - activeSignals.length, [signals, activeSignals]);
  const highCount = useMemo(() => activeSignals.filter((s) => s.priority === "high").length, [activeSignals]);
  const actionCount = useMemo(() => activeSignals.reduce((acc, s) => acc + s.actionsTaken.length, 0), [activeSignals]);
  const todayNew = useMemo(() => todayCount(activeSignals), [activeSignals]);

  const channelData = useMemo(() => {
    const counts: Record<string, number> = {};
    const latest: Record<string, string> = {};
    activeSignals.forEach((s) => {
      counts[s.source] = (counts[s.source] || 0) + 1;
      if (!latest[s.source] || s.capturedAt > latest[s.source]) latest[s.source] = s.capturedAt;
    });
    return { counts, latest };
  }, [activeSignals]);

  const modeMeta = MODE_META[mode] || MODE_META.creative;
  const isDnd = mode === "dnd";
  const isExecutive = mode === "executive";

  return (
    <div className="max-w-[960px] mx-auto px-5 py-10 md:px-10 relative overflow-hidden">
      {/* Geometric background motif */}
      <div className="absolute top-[-80px] right-[-120px] w-[400px] h-[400px] rounded-full border border-foreground/[0.04] pointer-events-none" />

      {/* Greeting Hero — all modes */}
      <Motion>
        <header className="mb-6 relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse-dot" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low">
              Connectivity OS · Dashboard
            </span>
          </div>
          <h1 className="font-display text-[clamp(32px,5vw,48px)] leading-[1.05] text-foreground mb-2">
            {greeting()}
          </h1>
          {!isDnd && (
            <p className="font-sans text-[15px] text-vanta-text-mid max-w-[520px] leading-relaxed">
              So you can focus, decide, and move.
            </p>
          )}
        </header>
      </Motion>

      {/* Inline Brain Dump — creative & executive only */}
      {!isDnd && <InlineBrainDump />}

      {/* Action Items — all modes (the action layer) */}
      <ActionItems onSignalClick={(s) => setDrawerSignal(s)} />

      {/* DND mode stops here — minimal view */}
      {isDnd ? (
        <Motion delay={40}>
          <div className="flex items-center gap-2 py-6 text-center justify-center">
            <Moon className="w-4 h-4 text-destructive" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-muted">
              Do Not Disturb — only action items shown
            </span>
          </div>
        </Motion>
      ) : (
        <>
          {/* Today Context Row */}
          <Motion delay={40}>
            <div className="flex flex-wrap items-center gap-4 mb-8 pb-5 border-b border-vanta-border">
              <span className="font-mono text-[11px] text-vanta-text-low">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </span>
              <span className="w-px h-4 bg-vanta-border" />
              <span className="font-mono text-[11px] text-vanta-text-low flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-vanta-accent-amber" />
                {meetingCount} meeting{meetingCount !== 1 ? "s" : ""} today
              </span>
              <span className="w-px h-4 bg-vanta-border" />
              <span className={`font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 ${modeMeta.color}`}>
                <modeMeta.icon className="w-3.5 h-3.5" />
                {modeMeta.label} Mode
              </span>
            </div>
          </Motion>

          {/* Cooling Alerts — creative & executive */}
          <CoolingAlerts />

          {/* Stats Strip */}
          <Motion delay={80}>
            <div className="flex flex-wrap gap-6 mb-8 pb-6 border-b border-vanta-border">
              <Link to="/signals" className="group">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Signals Captured</p>
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-[28px] text-foreground group-hover:text-primary transition-colors">{activeSignals.length}</p>
                  {todayNew > 0 && (
                    <span className="font-mono text-[10px] text-vanta-accent">+{todayNew} today</span>
                  )}
                </div>
              </Link>
              <Link to="/signals" className="group">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">High Strength</p>
                <p className="font-display text-[28px] text-vanta-accent group-hover:text-primary transition-colors">{highCount}</p>
              </Link>
              <Link to="/signals" className="group">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Actions Fired</p>
                <p className="font-display text-[28px] text-foreground group-hover:text-primary transition-colors">{actionCount}</p>
              </Link>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Pipeline</p>
                <div className="flex items-center gap-2 mt-2 px-2.5 py-1 bg-vanta-accent-faint border border-vanta-accent-border">
                  <div className="w-1.5 h-1.5 bg-vanta-accent animate-pulse-dot" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-vanta-accent">Active</p>
                </div>
              </div>
            </div>
          </Motion>

          {/* What's Ahead — creative & executive */}
          <WhatsAhead />

          {/* Channel Grid — creative only (hidden in executive) */}
          {!isExecutive && (
            <Motion delay={120}>
              <section className="mb-10">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-4">Channels</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CHANNELS.map((ch) => {
                    const count = channelData.counts[ch.key] || 0;
                    const maxCount = Math.max(...Object.values(channelData.counts), 1);
                    const barWidth = count > 0 ? Math.max(12, (count / maxCount) * 100) : 0;
                    const freshness = channelData.latest[ch.key] ? formatRelative(channelData.latest[ch.key]) : null;

                    return (
                      <Link
                        key={ch.key}
                        to={ch.href}
                        className="group relative flex flex-col justify-between p-5 bg-card border border-vanta-border rounded-sm hover:border-foreground/10 transition-all duration-300 hover:shadow-md overflow-hidden"
                      >
                        <div className="flex items-start justify-between mb-5">
                          <div className={`w-9 h-9 rounded-lg ${ch.bg} flex items-center justify-center ring-1 ${ch.ring} transition-transform duration-300 group-hover:scale-110`}>
                            <ch.icon className={`w-4 h-4 ${ch.color}`} />
                          </div>
                          {freshness ? (
                            <span className="font-mono text-[8px] text-vanta-text-muted mt-1">{freshness}</span>
                          ) : (
                            <span className="font-mono text-[8px] text-vanta-text-muted mt-1 italic">idle</span>
                          )}
                        </div>
                        <div>
                          <p className="font-display text-[32px] leading-none text-foreground mb-1 tracking-tight">{count}</p>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-low">{ch.label}</p>
                        </div>
                        <div className="mt-4 h-1 w-full bg-vanta-border/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${ch.barColor} rounded-full transition-all duration-700 ease-out opacity-50 group-hover:opacity-100`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-vanta-text-muted absolute right-3 top-5 opacity-0 group-hover:opacity-60 transition-all duration-200 translate-x-1 group-hover:translate-x-0" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            </Motion>
          )}

          {/* Daily Timeline — replaces flat Recent Signals list */}
          <Motion delay={160}>
            <DailyTimeline
              signals={activeSignals}
              onSignalClick={(s) => setDrawerSignal(s)}
              highOnly={isExecutive}
            />
          </Motion>

          {/* Noise Footer — creative only */}
          {!isExecutive && noiseCount > 0 && (
            <Motion delay={200}>
              <div className="mb-12 text-center">
                <Link
                  to="/settings?tab=noise"
                  className="font-mono text-[10px] text-vanta-text-muted hover:text-vanta-text-low transition-colors"
                >
                  {noiseCount} item{noiseCount !== 1 ? "s" : ""} filtered as noise · Review queue →
                </Link>
              </div>
            </Motion>
          )}
        </>
      )}

      {/* Signal Detail Drawer */}
      <SignalDetailDrawer
        signal={drawerSignal}
        open={!!drawerSignal}
        onClose={() => setDrawerSignal(null)}
      />
    </div>
  );
};

export default Index;
