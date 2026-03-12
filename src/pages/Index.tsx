import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { cases } from "@/data/cases";
import CaseCard from "@/components/CaseCard";
import CaseCardSoon from "@/components/CaseCardSoon";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import {
  MessageSquare,
  Phone,
  Video,
  Mail,
  Calendar,
  ArrowRight,
} from "lucide-react";

const fetchSignals = async (): Promise<Signal[]> => {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .order("captured_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error fetching signals:", error);
    return [];
  }

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

const CHANNELS = [
  { key: "linq", label: "iMessage", icon: MessageSquare, color: "text-vanta-accent", bg: "bg-vanta-accent-faint", border: "border-vanta-accent-border", href: "/product/intro?skip-auth=1" },
  { key: "phone", label: "Phone", icon: Phone, color: "text-vanta-accent-phone", bg: "bg-vanta-accent-phone-faint", border: "border-vanta-accent-phone-border", href: "/product/phone-call?skip-auth=1" },
  { key: "recall", label: "Zoom", icon: Video, color: "text-vanta-accent-zoom", bg: "bg-vanta-accent-zoom-faint", border: "border-vanta-accent-zoom-border", href: "/product/meeting?skip-auth=1" },
  { key: "gmail", label: "Email", icon: Mail, color: "text-vanta-accent-teal", bg: "bg-vanta-accent-teal-faint", border: "border-vanta-accent-teal-border", href: "/product/insight?skip-auth=1" },
  { key: "calendar", label: "Calendar", icon: Calendar, color: "text-vanta-accent-amber", bg: "bg-vanta-accent-amber-faint", border: "border-vanta-accent-amber-border", href: "/ontology?skip-auth=1" },
];

const SIGNAL_TYPE_COLORS: Record<string, string> = {
  INTRO: "text-vanta-accent",
  INSIGHT: "text-vanta-accent-teal",
  INVESTMENT: "text-vanta-accent-amber",
  DECISION: "text-vanta-accent-violet",
  CONTEXT: "text-vanta-text-low",
  MEETING: "text-vanta-accent-zoom",
  PHONE_CALL: "text-vanta-accent-phone",
  NOISE: "text-vanta-text-muted",
};

const Index = () => {
  const { data: signals = [] } = useQuery({
    queryKey: ["signals-dashboard"],
    queryFn: fetchSignals,
    refetchInterval: 60_000,
  });

  const highCount = useMemo(() => signals.filter((s) => s.priority === "high").length, [signals]);
  const actionCount = useMemo(() => signals.reduce((acc, s) => acc + s.actionsTaken.length, 0), [signals]);

  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    signals.forEach((s) => {
      counts[s.source] = (counts[s.source] || 0) + 1;
    });
    return counts;
  }, [signals]);

  const recentSignals = useMemo(
    () => [...signals].sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()).slice(0, 5),
    [signals]
  );

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
    if (diffH < 1) return "just now";
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  };

  return (
    <div className="max-w-[960px] mx-auto px-5 py-10 md:px-10">
      {/* Hero */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 bg-primary animate-pulse-dot" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low">
            Connectivity OS · Dashboard
          </span>
        </div>
        <h1 className="font-display text-[clamp(32px,5vw,48px)] leading-[1.05] text-foreground mb-3">
          Vanta Command
        </h1>
        <p className="font-sans text-[14px] text-vanta-text-mid max-w-[520px] leading-relaxed">
          Real-time signal intelligence across every channel. Every conversation is a data point. Nothing is lost.
        </p>
      </header>

      {/* Signal Pulse Strip */}
      <div className="flex flex-wrap gap-6 mb-8 pb-6 border-b border-vanta-border">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Signals Captured</p>
          <p className="font-display text-[28px] text-vanta-text">{signals.length}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">High Strength</p>
          <p className="font-display text-[28px] text-vanta-accent">{highCount}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Actions Fired</p>
          <p className="font-display text-[28px] text-vanta-text">{actionCount}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Pipeline</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 bg-vanta-accent" style={{ animation: "pulse-dot 2s ease-in-out infinite" }} />
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-vanta-accent">Active</p>
          </div>
        </div>
      </div>

      {/* Channel Grid */}
      <section className="mb-10">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-4">Channels</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-vanta-border border border-vanta-border">
          {CHANNELS.map((ch) => (
            <Link
              key={ch.key}
              to={ch.href}
              className={`flex flex-col items-center gap-2 py-5 px-3 bg-card hover:${ch.bg} transition-colors group`}
            >
              <ch.icon className={`w-5 h-5 ${ch.color}`} />
              <span className={`font-mono text-[10px] uppercase tracking-wider ${ch.color}`}>{ch.label}</span>
              <span className="font-display text-[20px] text-foreground">{channelCounts[ch.key] || 0}</span>
              <span className="font-mono text-[8px] uppercase tracking-wider text-vanta-text-muted">signals</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Signals */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">Recent Signals</p>
          <Link
            to="/signals?skip-auth=1"
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
            recentSignals.map((s) => (
              <div key={s.id} className="flex items-start gap-3 p-4 bg-card hover:bg-vanta-bg-elevated transition-colors">
                <span className={`inline-block px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider border border-vanta-border ${SIGNAL_TYPE_COLORS[s.signalType] || "text-vanta-text-muted"} shrink-0 mt-0.5`}>
                  {s.signalType}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[13px] text-foreground truncate">{s.summary}</p>
                  <p className="font-mono text-[9px] text-vanta-text-low mt-0.5">
                    {s.sender} · {formatTime(s.capturedAt)}
                  </p>
                </div>
                {s.priority === "high" && (
                  <span className="font-mono text-[8px] uppercase tracking-wider text-vanta-accent px-1.5 py-0.5 border border-vanta-accent-border bg-vanta-accent-faint shrink-0">
                    High
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Case Studies */}
      <section>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-4">Case Studies</p>
        <div className="grid grid-cols-1 gap-px md:grid-cols-2">
          {cases.map((c, i) => (
            <CaseCard
              key={c.id}
              caseData={c}
              index={i}
              onOpen={() => {}}
              isActive={false}
            />
          ))}
          <CaseCardSoon />
        </div>
      </section>
    </div>
  );
};

export default Index;
