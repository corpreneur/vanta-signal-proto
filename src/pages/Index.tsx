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
import {
  MessageSquare,
  Phone,
  Video,
  Mail,
  Calendar,
  ArrowRight,
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
  { key: "linq", label: "iMessage", icon: MessageSquare, color: "text-vanta-accent", bg: "bg-vanta-accent-faint", border: "border-vanta-accent-border", href: "/product/intro" },
  { key: "phone", label: "Phone", icon: Phone, color: "text-vanta-accent-phone", bg: "bg-vanta-accent-phone-faint", border: "border-vanta-accent-phone-border", href: "/product/phone-call" },
  { key: "recall", label: "Zoom", icon: Video, color: "text-vanta-accent-zoom", bg: "bg-vanta-accent-zoom-faint", border: "border-vanta-accent-zoom-border", href: "/product/meeting" },
  { key: "gmail", label: "Email", icon: Mail, color: "text-vanta-accent-teal", bg: "bg-vanta-accent-teal-faint", border: "border-vanta-accent-teal-border", href: "/product/email" },
  { key: "calendar", label: "Calendar", icon: Calendar, color: "text-vanta-accent-amber", bg: "bg-vanta-accent-amber-faint", border: "border-vanta-accent-amber-border", href: "/product/calendar" },
  { key: "manual", label: "Brain Dump", icon: StickyNote, color: "text-vanta-accent-violet", bg: "bg-vanta-accent-violet-faint", border: "border-vanta-accent-violet-border", href: "/brain-dump" },
];

const SOURCE_ICONS: Record<string, typeof MessageSquare> = {
  linq: MessageSquare,
  phone: Phone,
  recall: Video,
  gmail: Mail,
  manual: StickyNote,
};

const SIGNAL_LEFT_BORDER: Record<string, string> = {
  INTRO: "border-l-[hsl(var(--vanta-accent))]",
  INSIGHT: "border-l-[hsl(var(--vanta-signal-blue))]",
  INVESTMENT: "border-l-[hsl(var(--vanta-signal-yellow))]",
  DECISION: "border-l-[hsl(var(--vanta-signal-yellow))]",
  CONTEXT: "border-l-[hsl(var(--vanta-text-low))]",
  MEETING: "border-l-[hsl(var(--vanta-signal-blue))]",
  PHONE_CALL: "border-l-[hsl(var(--vanta-accent-phone))]",
};

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

  const recentSignals = useMemo(
    () => [...activeSignals].sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()).slice(0, 8),
    [activeSignals]
  );

  const modeMeta = MODE_META[mode] || MODE_META.creative;

  return (
    <div className="max-w-[960px] mx-auto px-5 py-10 md:px-10 relative overflow-hidden">
      {/* Geometric background motif */}
      <div className="absolute top-[-80px] right-[-120px] w-[400px] h-[400px] rounded-full border border-foreground/[0.04] pointer-events-none" />

      {/* 7. Greeting Hero */}
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
          <p className="font-sans text-[15px] text-vanta-text-mid max-w-[520px] leading-relaxed">
            So you can focus, decide, and move.
          </p>
        </header>
      </Motion>

      {/* 1. Today Context Row */}
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

      {/* 3. Stats Strip (clickable + today delta) */}
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

      {/* 4. Channel Grid (polish) */}
      <Motion delay={120}>
        <section className="mb-10">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-4">Channels</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-vanta-border border border-vanta-border">
            {CHANNELS.map((ch) => (
              <Link
                key={ch.key}
                to={ch.href}
                className="flex flex-col items-center gap-1.5 py-5 px-3 bg-card hover:bg-vanta-bg-elevated transition-colors group relative"
              >
                <ch.icon className={`w-5 h-5 ${ch.color} opacity-60`} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-low">{ch.label}</span>
                <span className="font-display text-[20px] text-foreground">{channelData.counts[ch.key] || 0}</span>
                {channelData.latest[ch.key] ? (
                  <span className="font-mono text-[8px] text-vanta-text-muted">{formatRelative(channelData.latest[ch.key])}</span>
                ) : (
                  <span className="font-mono text-[8px] text-vanta-text-muted">no signals</span>
                )}
                <ChevronRight className="w-3 h-3 text-vanta-text-muted absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </section>
      </Motion>

      {/* 5. Recent Signals (enhanced) */}
      <Motion delay={160}>
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">Recent Signals</p>
            <Link
              to="/signals"
              className="font-mono text-[9px] uppercase tracking-wider text-primary hover:text-vanta-accent transition-colors flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="border border-vanta-border divide-y divide-vanta-border">
            {recentSignals.length === 0 ? (
              <div className="p-6 text-center">
                <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted">No signals captured yet</p>
              </div>
            ) : (
              recentSignals.map((s) => {
                const SourceIcon = SOURCE_ICONS[s.source] || MessageSquare;
                const leftBorder = SIGNAL_LEFT_BORDER[s.signalType] || "border-l-transparent";
                return (
                  <button
                    key={s.id}
                    onClick={() => setDrawerSignal(s)}
                    className={`flex items-start gap-3 p-4 bg-card hover:bg-vanta-bg-elevated transition-colors w-full text-left border-l-2 ${leftBorder}`}
                  >
                    <SourceIcon className="w-3.5 h-3.5 text-vanta-text-muted shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-[13px] text-foreground truncate">{s.summary}</p>
                      <p className="font-mono text-[9px] text-vanta-text-low mt-0.5">
                        {s.sender} · {formatRelative(s.capturedAt)}
                      </p>
                    </div>
                    {s.priority === "high" && (
                      <span className="font-mono text-[8px] uppercase tracking-wider text-vanta-accent px-1.5 py-0.5 border border-vanta-accent-border bg-vanta-accent-faint shrink-0">
                        High
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </section>
      </Motion>

      {/* 6. Noise Footer */}
      {noiseCount > 0 && (
        <Motion delay={200}>
          <div className="mb-12 text-center">
            <Link
              to="/noise-queue"
              className="font-mono text-[10px] text-vanta-text-muted hover:text-vanta-text-low transition-colors"
            >
              {noiseCount} item{noiseCount !== 1 ? "s" : ""} filtered as noise · Review queue →
            </Link>
          </div>
        </Motion>
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
