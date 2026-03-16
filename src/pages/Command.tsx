import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { Video, ArrowRight, Zap, Calendar } from "lucide-react";
import { Motion } from "@/components/ui/motion";
import NoteCapture from "@/components/NoteCapture";

async function fetchTopSignals(): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .neq("signal_type", "NOISE")
    .neq("status", "Complete")
    .eq("priority", "high")
    .order("captured_at", { ascending: false })
    .limit(3);

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
    riskLevel: (row as Record<string, unknown>).risk_level as Signal["riskLevel"],
    dueDate: (row as Record<string, unknown>).due_date as string | null,
  }));
}

async function fetchTodayBriefs() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: meetings } = await supabase
    .from("upcoming_meetings")
    .select("*")
    .gte("starts_at", today.toISOString())
    .lt("starts_at", tomorrow.toISOString())
    .order("starts_at");

  const { data: briefs } = await supabase
    .from("pre_meeting_briefs")
    .select("*")
    .eq("dismissed", false);

  return {
    meetings: meetings || [],
    briefs: briefs || [],
  };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function relativeTime(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const mins = Math.round(diff / 60000);
  if (mins <= 0) return "Now";
  if (mins < 60) return `In ${mins}m`;
  return `In ${Math.round(mins / 60)}h`;
}

/* ── mock meetings for demo ─────────────────────────────── */
function getMockMeetings() {
  const today = new Date();
  const make = (h: number, m: number, title: string, attendees: string[]) => {
    const starts = new Date(today);
    starts.setHours(h, m, 0, 0);
    const ends = new Date(starts);
    ends.setHours(h + 1);
    return {
      id: `mock-${h}-${m}`,
      title,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      attendees,
      briefed: false,
      zoom_meeting_id: null,
      calendar_event_id: null,
      created_at: new Date().toISOString(),
    };
  };
  return [
    make(9, 0, "Portfolio Review — Series B Pipeline", ["Marcus Chen", "Elena Voss"]),
    make(10, 30, "1:1 with Sarah Kim — Fundraise Update", ["Sarah Kim"]),
    make(13, 0, "LP Advisory Board Prep", ["James Whitfield", "Priya Sharma", "David Okafor"]),
    make(15, 0, "Intro Call — Astra Robotics (via Marcus)", ["Leo Park", "Marcus Chen"]),
    make(16, 30, "Weekly Partner Sync", ["Elena Voss", "James Whitfield"]),
  ];
}

export default function Command() {
  const { data: topSignals = [] } = useQuery({
    queryKey: ["command-signals"],
    queryFn: fetchTopSignals,
    refetchInterval: 30_000,
  });

  const { data: briefData } = useQuery({
    queryKey: ["command-briefs"],
    queryFn: fetchTodayBriefs,
    refetchInterval: 60_000,
  });

  const dbMeetings = briefData?.meetings || [];
  const briefs = briefData?.briefs || [];
  const meetings = dbMeetings.length > 0 ? dbMeetings : getMockMeetings();

  const meetingBriefMap = useMemo(() => {
    const map = new Map<string, typeof briefs[0]>();
    for (const b of briefs) {
      map.set(b.meeting_id, b);
    }
    return map;
  }, [briefs]);

  return (
    <div className="max-w-[480px] mx-auto px-5 py-8">
      {/* Header */}
      <Motion>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-vanta-accent" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low">
              Command
            </span>
          </div>
          <h1 className="font-display text-[28px] leading-tight text-foreground">
            Today
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-vanta-text-muted mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </header>
      </Motion>

      {/* Meetings */}
      <Motion delay={60}>
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-3.5 h-3.5 text-vanta-text-muted" />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
              Meetings ({meetings.length})
            </p>
          </div>

          {meetings.length === 0 ? (
            <div className="border border-vanta-border p-5 text-center">
              <p className="font-mono text-[10px] text-vanta-text-muted uppercase tracking-widest">No meetings today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {meetings.map((m: any) => {
                const brief = meetingBriefMap.get(m.id);
                const attendees = Array.isArray(m.attendees) ? m.attendees : [];
                return (
                  <div key={m.id} className="border border-vanta-border bg-vanta-bg-elevated p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-sans text-[14px] text-foreground font-medium">{m.title}</p>
                        <p className="font-mono text-[10px] text-vanta-text-low mt-0.5">{formatTime(m.starts_at)}</p>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-vanta-accent-zoom shrink-0">
                        {relativeTime(m.starts_at)}
                      </span>
                    </div>
                    {attendees.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {attendees.map((a: string, i: number) => (
                          <span
                            key={i}
                            className="inline-block px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider border border-vanta-border text-vanta-text-low bg-card"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                    {brief && (
                      <Link
                        to={`/briefing/${brief.id}`}
                        className="inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] border border-vanta-accent-zoom-border text-vanta-accent-zoom hover:bg-vanta-accent-zoom-faint transition-colors mt-1"
                      >
                        <Video className="w-3 h-3" />
                        View Brief
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </Motion>

      {/* Top signals */}
      <Motion delay={120}>
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
              Top Signals
            </p>
            <Link
              to="/signals"
              className="font-mono text-[9px] uppercase tracking-wider text-primary hover:text-vanta-accent transition-colors flex items-center gap-1"
            >
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {topSignals.length === 0 ? (
            <div className="border border-vanta-border p-5 text-center">
              <p className="font-mono text-[10px] text-vanta-text-muted uppercase tracking-widest">All clear</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topSignals.map((s) => {
                const colors = SIGNAL_TYPE_COLORS[s.signalType];
                return (
                  <Link
                    key={s.id}
                    to="/signals"
                    className="block border border-vanta-border bg-vanta-bg-elevated p-4 hover:border-vanta-border-mid transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider border ${colors.text} ${colors.bg} ${colors.border}`}>
                        {s.signalType}
                      </span>
                      <span className="font-mono text-[9px] text-vanta-text-muted ml-auto">{s.sender}</span>
                    </div>
                    <p className="font-sans text-[13px] text-foreground leading-relaxed">{s.summary}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </Motion>

      {/* Quick capture */}
      <Motion delay={180}>
        <section>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-3">
            Quick Capture
          </p>
          <NoteCapture inline />
        </section>
      </Motion>
    </div>
  );
}
