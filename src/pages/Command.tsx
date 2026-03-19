import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import {
  Zap, Check, Clock, Pin, ArrowRight, Send, AlarmClock,
  CheckCircle2, Inbox, AlertTriangle, CalendarClock, PinOff,
} from "lucide-react";
import { Motion } from "@/components/ui/motion";
import NoteCapture from "@/components/NoteCapture";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

/* ── Data fetching ──────────────────────────────────────── */

async function fetchActionableSignals(): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .neq("signal_type", "NOISE")
    .neq("status", "Complete")
    .order("pinned", { ascending: false })
    .order("priority", { ascending: true })
    .order("captured_at", { ascending: false })
    .limit(25);

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
    meetingId: (row as Record<string, unknown>).meeting_id as string | null,
    riskLevel: (row as Record<string, unknown>).risk_level as Signal["riskLevel"],
    dueDate: (row as Record<string, unknown>).due_date as string | null,
    pinned: row.pinned,
    confidenceScore: row.confidence_score,
  }));
}

function getMockReminders() {
  return [
    { id: "mock-r1", contact_name: "Marcus Chen", sequence_type: "check-in", interval_days: 14, note: "Portfolio co-invest discussion", enabled: true, next_due_at: new Date(Date.now() - 86400000).toISOString(), last_fired_at: null, created_at: new Date().toISOString() },
    { id: "mock-r2", contact_name: "Sarah Kim", sequence_type: "follow-up", interval_days: 7, note: "Fundraise deck feedback", enabled: true, next_due_at: new Date(Date.now() - 3600000).toISOString(), last_fired_at: null, created_at: new Date().toISOString() },
    { id: "mock-r3", contact_name: "Elena Voss", sequence_type: "reminder", interval_days: 30, note: "Board prep materials", enabled: true, next_due_at: new Date(Date.now() - 172800000).toISOString(), last_fired_at: null, created_at: new Date().toISOString() },
    { id: "mock-r4", contact_name: "James Whitfield", sequence_type: "nurture", interval_days: 21, note: null, enabled: true, next_due_at: new Date(Date.now() - 7200000).toISOString(), last_fired_at: null, created_at: new Date().toISOString() },
  ];
}

function getMockCoolingAlerts() {
  return [
    { id: "mock-c1", contact_name: "David Okafor", alert_type: "cooling", previous_strength: 82, current_strength: 54, dismissed: false, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: "mock-c2", contact_name: "Priya Sharma", alert_type: "cooling", previous_strength: 71, current_strength: 38, dismissed: false, created_at: new Date(Date.now() - 172800000).toISOString() },
    { id: "mock-c3", contact_name: "Leo Park", alert_type: "cooling", previous_strength: 65, current_strength: 41, dismissed: false, created_at: new Date(Date.now() - 259200000).toISOString() },
  ];
}

async function fetchDueReminders() {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("engagement_sequences")
    .select("*")
    .eq("enabled", true)
    .lte("next_due_at", now)
    .order("next_due_at")
    .limit(10);
  const dbData = data || [];
  return dbData.length > 0 ? dbData : getMockReminders();
}

async function fetchCoolingAlerts() {
  const { data } = await supabase
    .from("relationship_alerts")
    .select("*")
    .eq("dismissed", false)
    .order("created_at", { ascending: false })
    .limit(5);
  const dbData = data || [];
  return dbData.length > 0 ? dbData : getMockCoolingAlerts();
}

/* ── Helpers ────────────────────────────────────────────── */

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type TabKey = "inbox" | "pinned" | "due" | "cooling";

/* ── Component ──────────────────────────────────────────── */

export default function Command() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>("inbox");

  const { data: signals = [] } = useQuery({
    queryKey: ["easy-actions-signals"],
    queryFn: fetchActionableSignals,
    refetchInterval: 15_000,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["easy-actions-reminders"],
    queryFn: fetchDueReminders,
    refetchInterval: 30_000,
  });

  const { data: coolingAlerts = [] } = useQuery({
    queryKey: ["easy-actions-cooling"],
    queryFn: fetchCoolingAlerts,
    refetchInterval: 60_000,
  });

  /* ── Mutations ── */

  const markDone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("signals")
        .update({ status: "Complete" as const })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["easy-actions-signals"] });
      toast.success("Signal marked complete");
    },
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase
        .from("signals")
        .update({ pinned: !pinned })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["easy-actions-signals"] });
      toast.success("Pin updated");
    },
  });

  const snooze = useMutation({
    mutationFn: async (id: string) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      const { error } = await supabase
        .from("signals")
        .update({ due_date: tomorrow.toISOString().split("T")[0] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["easy-actions-signals"] });
      toast.success("Snoozed until tomorrow 9am");
    },
  });

  const dismissAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("relationship_alerts")
        .update({ dismissed: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["easy-actions-cooling"] });
      toast.success("Alert dismissed");
    },
  });

  /* ── Derived lists ── */

  const inboxSignals = useMemo(
    () => signals.filter((s) => s.status === "Captured" && !s.pinned),
    [signals]
  );

  const pinnedSignals = useMemo(
    () => signals.filter((s) => s.pinned),
    [signals]
  );

  const highPriorityCount = inboxSignals.filter((s) => s.priority === "high").length;

  const tabs: { key: TabKey; label: string; count: number; icon: React.ElementType }[] = [
    { key: "inbox", label: "Inbox", count: inboxSignals.length, icon: Inbox },
    { key: "pinned", label: "Pinned", count: pinnedSignals.length, icon: Pin },
    { key: "due", label: "Due", count: reminders.length, icon: CalendarClock },
    { key: "cooling", label: "Cooling", count: coolingAlerts.length, icon: AlertTriangle },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <Motion>
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-2 h-2 bg-vanta-accent"
              style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
            />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Fab Five · Easy Actions
            </p>
          </div>
          <h1 className="font-display text-[clamp(28px,5vw,40px)] leading-[1.05] text-foreground mb-2">
            Action Queue
          </h1>
          <p className="font-sans text-[14px] text-muted-foreground leading-relaxed max-w-md">
            {inboxSignals.length} open · {highPriorityCount} high priority · {pinnedSignals.length} pinned
          </p>
        </header>
      </Motion>

      {/* Quick Capture */}
      <Motion delay={40}>
        <section className="mb-5">
          <NoteCapture inline />
        </section>
      </Motion>

      {/* Tabs */}
      <Motion delay={80}>
        <div className="flex gap-0.5 mb-4 border-b border-border overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1 px-3 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap ${
                tab === t.key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 text-[9px] rounded-sm ${
                  t.key === "cooling" && t.count > 0
                    ? "bg-destructive/15 text-destructive"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </Motion>

      {/* Tab content */}
      <Motion delay={120}>
        {tab === "inbox" && (
          <div className="space-y-2">
            {inboxSignals.length === 0 ? (
              <EmptyState icon={CheckCircle2} text="Inbox zero — all clear" />
            ) : (
              inboxSignals.map((s) => (
                <SignalActionRow
                  key={s.id}
                  signal={s}
                  onDone={() => markDone.mutate(s.id)}
                  onPin={() => togglePin.mutate({ id: s.id, pinned: !!s.pinned })}
                  onSnooze={() => snooze.mutate(s.id)}
                />
              ))
            )}
          </div>
        )}

        {tab === "pinned" && (
          <div className="space-y-2">
            {pinnedSignals.length === 0 ? (
              <EmptyState icon={Pin} text="No pinned signals" />
            ) : (
              pinnedSignals.map((s) => (
                <SignalActionRow
                  key={s.id}
                  signal={s}
                  onDone={() => markDone.mutate(s.id)}
                  onPin={() => togglePin.mutate({ id: s.id, pinned: !!s.pinned })}
                  onSnooze={() => snooze.mutate(s.id)}
                />
              ))
            )}
          </div>
        )}

        {tab === "due" && (
          <div className="space-y-2">
            {reminders.length === 0 ? (
              <EmptyState icon={CalendarClock} text="No due reminders" />
            ) : (
              reminders.map((r) => (
                <div
                  key={r.id}
                  className="border border-vanta-border bg-vanta-bg-elevated p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-sans text-[14px] text-foreground font-medium">{r.contact_name}</p>
                    <p className="font-mono text-[10px] text-vanta-text-low mt-0.5">
                      {r.sequence_type} · every {r.interval_days}d
                      {r.note && <span className="ml-2 text-vanta-text-muted">— {r.note}</span>}
                    </p>
                  </div>
                  <Link
                    to={`/contact/${encodeURIComponent(r.contact_name)}`}
                    className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-primary hover:text-vanta-accent transition-colors flex items-center gap-1"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "cooling" && (
          <div className="space-y-2">
            {coolingAlerts.length === 0 ? (
              <EmptyState icon={AlertTriangle} text="No cooling relationships" />
            ) : (
              coolingAlerts.map((a) => (
                <div
                  key={a.id}
                  className="border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-sans text-[14px] text-foreground font-medium">{a.contact_name}</p>
                    <p className="font-mono text-[10px] text-destructive mt-0.5">
                      Strength dropped {a.previous_strength}% → {a.current_strength}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/contact/${encodeURIComponent(a.contact_name)}`}
                      className="font-mono text-[9px] uppercase tracking-wider text-primary hover:text-vanta-accent transition-colors flex items-center gap-1"
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => dismissAlert.mutate(a.id)}
                      className="font-mono text-[9px] uppercase tracking-wider text-vanta-text-muted hover:text-foreground transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Motion>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="border border-vanta-border p-8 text-center">
      <Icon className="w-5 h-5 text-vanta-text-muted mx-auto mb-2" />
      <p className="font-mono text-[10px] text-vanta-text-muted uppercase tracking-widest">{text}</p>
    </div>
  );
}

function SignalActionRow({
  signal,
  onDone,
  onPin,
  onSnooze,
}: {
  signal: Signal;
  onDone: () => void;
  onPin: () => void;
  onSnooze: () => void;
}) {
  const colors = SIGNAL_TYPE_COLORS[signal.signalType];

  return (
    <div className={`border bg-vanta-bg-elevated p-4 group transition-colors ${
      signal.pinned ? "border-vanta-accent/40" : "border-vanta-border"
    }`}>
      <div className="flex items-start gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider border ${colors.text} ${colors.bg} ${colors.border}`}>
              {signal.signalType}
            </span>
            {signal.priority === "high" && (
              <span className="px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/20">
                High
              </span>
            )}
            {signal.pinned && <Pin className="w-3 h-3 text-vanta-accent" />}
            <span className="font-mono text-[9px] text-vanta-text-muted ml-auto shrink-0">
              {signal.sender} · {timeAgo(signal.capturedAt)}
            </span>
          </div>
          <p className="font-sans text-[13px] text-foreground leading-relaxed line-clamp-2">{signal.summary}</p>
          {signal.dueDate && (
            <p className="font-mono text-[9px] text-vanta-text-low mt-1 flex items-center gap-1">
              <AlarmClock className="w-3 h-3" /> Due {signal.dueDate}
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          <ActionButton icon={Check} label="Done" onClick={onDone} className="hover:text-green-500" />
          <ActionButton icon={Clock} label="Snooze" onClick={onSnooze} className="hover:text-amber-500" />
          <ActionButton
            icon={signal.pinned ? PinOff : Pin}
            label={signal.pinned ? "Unpin" : "Pin"}
            onClick={onPin}
            className="hover:text-vanta-accent"
          />
          <Link
            to="/signals"
            className="p-1.5 text-vanta-text-muted hover:text-foreground transition-colors"
            title="Open in feed"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  className = "",
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-1.5 text-vanta-text-muted transition-colors ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
