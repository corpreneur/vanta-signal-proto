import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { ArrowLeft, MessageSquare, Phone, Video, Mail, StickyNote, User, TrendingUp, Calendar, ExternalLink, HelpCircle, Loader2 } from "lucide-react";
import { Motion } from "@/components/ui/motion";
import SignalDetailDrawer from "@/components/SignalDetailDrawer";
import { toast } from "sonner";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  linq: MessageSquare,
  phone: Phone,
  recall: Video,
  gmail: Mail,
  manual: StickyNote,
};

const SOURCE_COLORS: Record<string, string> = {
  linq: "text-vanta-accent",
  phone: "text-vanta-accent-phone",
  recall: "text-vanta-accent-zoom",
  gmail: "text-vanta-accent-teal",
  manual: "text-vanta-accent-violet",
};

async function fetchContactSignals(name: string): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .eq("sender", name)
    .order("captured_at", { ascending: false })
    .limit(200);

  if (error) throw error;

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
    callPointer: (row as Record<string, unknown>).call_pointer as string | null,
    pinned: row.pinned ?? false,
    confidenceScore: (row as Record<string, unknown>).confidence_score as number | null,
  }));
}

function groupByDate(signals: Signal[]): Record<string, Signal[]> {
  const groups: Record<string, Signal[]> = {};
  for (const s of signals) {
    const date = new Date(s.capturedAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(s);
  }
  return groups;
}

function groupByType(signals: Signal[]): Record<string, Signal[]> {
  const groups: Record<string, Signal[]> = {};
  for (const s of signals) {
    if (!groups[s.signalType]) groups[s.signalType] = [];
    groups[s.signalType].push(s);
  }
  return groups;
}

function daysBetween(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function computeStrength(signalCount: number, highCount: number, daysSinceLast: number): { score: number; label: string } {
  const freqScore = Math.min(40, (Math.log2(signalCount + 1) / Math.log2(50)) * 40);
  const recencyScore = Math.max(0, 35 * Math.exp(-daysSinceLast / 14));
  const priorityRatio = signalCount > 0 ? highCount / signalCount : 0;
  const priorityScore = priorityRatio * 25;
  const score = Math.min(100, Math.max(0, Math.round(freqScore + recencyScore + priorityScore)));
  let label = "Cold";
  if (score >= 75) label = "Strong";
  else if (score >= 50) label = "Warm";
  else if (score >= 25) label = "Cooling";
  return { score, label };
}

type ViewMode = "timeline" | "by-type";

export default function ContactTimeline() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(name || "");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["contact-timeline", decodedName],
    queryFn: () => fetchContactSignals(decodedName),
    enabled: !!decodedName,
  });

  const grouped = groupByDate(signals);
  const byType = groupByType(signals);

  // Stats
  const highCount = signals.filter((s) => s.priority === "high").length;
  const sources = [...new Set(signals.map((s) => s.source))];
  const types = [...new Set(signals.map((s) => s.signalType))];
  const actionCount = signals.reduce((acc, s) => acc + s.actionsTaken.length, 0);
  const lastInteraction = signals[0]?.capturedAt;
  const daysSince = lastInteraction ? daysBetween(lastInteraction) : 0;
  const strength = computeStrength(signals.length, highCount, daysSince);

  // Suggested next actions
  const pendingHigh = signals.filter((s) => s.priority === "high" && s.status !== "Complete");
  const unreplied = signals.filter((s) => s.signalType === "INTRO" && s.status === "Captured");

  return (
    <div className="max-w-[720px] mx-auto px-5 py-8 md:py-12">
      {/* Back link */}
      <Link
        to="/contacts"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-low hover:text-vanta-accent transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Smart Contacts
      </Link>

      {/* Header */}
      <Motion>
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-[clamp(24px,4vw,36px)] leading-tight text-foreground mb-2">
                {decodedName}
              </h1>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-muted">
                Contact Hub · {signals.length} signals
              </p>
            </div>
            {/* Relationship Strength */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      strength.score >= 75 ? "bg-emerald-500" :
                      strength.score >= 50 ? "bg-sky-500" :
                      strength.score >= 25 ? "bg-amber-500" : "bg-muted-foreground"
                    }`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
                <span className={`font-mono text-[10px] uppercase tracking-wider ${
                  strength.score >= 75 ? "text-emerald-500" :
                  strength.score >= 50 ? "text-sky-500" :
                  strength.score >= 25 ? "text-amber-500" : "text-muted-foreground"
                }`}>
                  {strength.score}
                </span>
              </div>
              <span className={`font-mono text-[9px] uppercase tracking-wider ${
                strength.score >= 75 ? "text-emerald-500" :
                strength.score >= 50 ? "text-sky-500" :
                strength.score >= 25 ? "text-amber-500" : "text-muted-foreground"
              }`}>
                {strength.label}
              </span>
            </div>
          </div>
        </header>
      </Motion>

      {/* Stats strip */}
      <Motion delay={60}>
        <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-vanta-border">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Total Signals</p>
            <p className="font-display text-[24px] text-foreground">{signals.length}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">High Priority</p>
            <p className="font-display text-[24px] text-vanta-accent">{highCount}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Actions</p>
            <p className="font-display text-[24px] text-foreground">{actionCount}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Channels</p>
            <div className="flex items-center gap-2 mt-2">
              {sources.map((src) => {
                const Icon = SOURCE_ICONS[src] || MessageSquare;
                return <Icon key={src} className={`w-4 h-4 ${SOURCE_COLORS[src] || "text-vanta-text-low"}`} />;
              })}
            </div>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Signal Types</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {types.map((t) => {
                const c = SIGNAL_TYPE_COLORS[t as keyof typeof SIGNAL_TYPE_COLORS];
                return (
                  <span key={t} className={`px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider border ${c?.text} ${c?.bg} ${c?.border}`}>
                    {t}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </Motion>

      {/* Suggested Next Actions */}
      {(pendingHigh.length > 0 || unreplied.length > 0) && (
        <Motion delay={80}>
          <div className="border border-vanta-accent-border bg-vanta-accent-faint p-4 mb-6">
            <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-accent mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />
              Suggested Actions
            </h3>
            <div className="space-y-1.5">
              {pendingHigh.length > 0 && (
                <p className="font-mono text-[11px] text-foreground">
                  • {pendingHigh.length} high-priority signal{pendingHigh.length > 1 ? "s" : ""} pending review
                </p>
              )}
              {unreplied.length > 0 && (
                <p className="font-mono text-[11px] text-foreground">
                  • {unreplied.length} introduction{unreplied.length > 1 ? "s" : ""} awaiting response
                </p>
              )}
              {daysSince > 14 && (
                <p className="font-mono text-[11px] text-foreground">
                  • Last interaction was {daysSince}d ago — consider reaching out
                </p>
              )}
            </div>
          </div>
        </Motion>
      )}

      {/* View mode toggle */}
      <Motion delay={100}>
        <div className="flex gap-1 mb-6">
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
              viewMode === "timeline"
                ? "border-foreground text-foreground bg-vanta-bg-elevated"
                : "border-vanta-border text-vanta-text-low hover:text-foreground"
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode("by-type")}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
              viewMode === "by-type"
                ? "border-foreground text-foreground bg-vanta-bg-elevated"
                : "border-vanta-border text-vanta-text-low hover:text-foreground"
            }`}
          >
            By Type
          </button>
        </div>
      </Motion>

      {/* Loading */}
      {isLoading && (
        <div className="py-12 text-center">
          <div className="w-2 h-2 bg-primary animate-pulse mx-auto" />
        </div>
      )}

      {/* Timeline view */}
      {viewMode === "timeline" && (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, daySignals], di) => (
            <Motion key={date} delay={120 + di * 60}>
              <div>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-text-low mb-3 border-b border-vanta-border pb-2">
                  {date}
                </h2>
                <div className="space-y-3">
                  {daySignals.map((s) => {
                    const colors = SIGNAL_TYPE_COLORS[s.signalType];
                    const Icon = SOURCE_ICONS[s.source] || MessageSquare;
                    const time = new Date(s.capturedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSignal(s)}
                        className="flex gap-3 p-4 border border-vanta-border bg-vanta-bg-elevated hover:border-vanta-border-mid transition-colors cursor-pointer"
                      >
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <Icon className={`w-4 h-4 ${SOURCE_COLORS[s.source] || "text-vanta-text-low"}`} />
                          <div className="w-px flex-1 bg-vanta-border" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider border ${colors.text} ${colors.bg} ${colors.border}`}>
                              {s.signalType}
                            </span>
                            {s.priority === "high" && (
                              <span className="px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-vanta-accent border border-vanta-accent-border bg-vanta-accent-faint">
                                High
                              </span>
                            )}
                            {s.status === "Complete" && (
                              <span className="px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-vanta-signal-green border border-vanta-signal-green-border bg-vanta-signal-green-faint">
                                ✓
                              </span>
                            )}
                            <span className="font-mono text-[9px] text-vanta-text-muted ml-auto">{time}</span>
                          </div>
                          <p className="font-sans text-[13px] text-foreground leading-relaxed mb-1">{s.summary}</p>
                          {s.sourceMessage && s.sourceMessage !== s.summary && (
                            <p className="font-mono text-[11px] text-vanta-text-low leading-relaxed line-clamp-2">{s.sourceMessage}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Motion>
          ))}
        </div>
      )}

      {/* By-type view */}
      {viewMode === "by-type" && (
        <div className="space-y-8">
          {Object.entries(byType).map(([type, typeSignals], ti) => {
            const colors = SIGNAL_TYPE_COLORS[type as keyof typeof SIGNAL_TYPE_COLORS] || SIGNAL_TYPE_COLORS.CONTEXT;
            return (
              <Motion key={type} delay={120 + ti * 60}>
                <div>
                  <h2 className={`font-mono text-[10px] uppercase tracking-[0.2em] mb-3 border-b pb-2 ${colors.text} border-vanta-border`}>
                    {type} · {typeSignals.length}
                  </h2>
                  <div className="space-y-2">
                    {typeSignals.map((s) => {
                      const time = new Date(s.capturedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedSignal(s)}
                          className="p-3 border border-vanta-border bg-vanta-bg-elevated hover:border-vanta-border-mid transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {s.priority === "high" && (
                              <span className="px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-vanta-accent border border-vanta-accent-border bg-vanta-accent-faint">
                                High
                              </span>
                            )}
                            <span className="font-mono text-[9px] text-vanta-text-muted ml-auto">{time}</span>
                          </div>
                          <p className="font-sans text-[13px] text-foreground leading-relaxed">{s.summary}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Motion>
            );
          })}
        </div>
      )}

      {!isLoading && signals.length === 0 && (
        <div className="py-12 text-center">
          <p className="font-mono text-xs text-vanta-text-muted uppercase tracking-widest">No signals found for this contact</p>
        </div>
      )}

      <SignalDetailDrawer
        signal={selectedSignal}
        open={!!selectedSignal}
        onClose={() => setSelectedSignal(null)}
      />
    </div>
  );
}
