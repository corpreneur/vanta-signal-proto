import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { ArrowLeft, MessageSquare, Phone, Video, Mail, StickyNote, TrendingUp, HelpCircle, Loader2 } from "lucide-react";
import SaveToContactsButton from "@/components/SaveToContactsButton";
import ContactTagManager from "@/components/ContactTagManager";
import EngagementSequences from "@/components/EngagementSequences";
import ContactProfileHeader from "@/components/contacts/ContactProfileHeader";
import MutualConnections from "@/components/contacts/MutualConnections";
import ActivityChart from "@/components/contacts/ActivityChart";
import ContactNotes from "@/components/contacts/ContactNotes";
import { Motion } from "@/components/ui/motion";
import SignalDetailDrawer from "@/components/SignalDetailDrawer";
import { toast } from "sonner";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  linq: MessageSquare, phone: Phone, recall: Video, gmail: Mail, manual: StickyNote,
};
const SOURCE_COLORS: Record<string, string> = {
  linq: "text-vanta-accent", phone: "text-vanta-accent-phone", recall: "text-vanta-accent-zoom",
  gmail: "text-vanta-accent-teal", manual: "text-vanta-accent-violet",
};

async function fetchContactSignals(name: string): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals").select("*").eq("sender", name)
    .order("captured_at", { ascending: false }).limit(200);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id, signalType: row.signal_type, sender: row.sender,
    summary: row.summary, sourceMessage: row.source_message, priority: row.priority,
    capturedAt: row.captured_at, actionsTaken: row.actions_taken || [],
    status: row.status,
    source: (row as Record<string, unknown>).source as Signal["source"] || "linq",
    rawPayload: row.raw_payload as Record<string, unknown> | null,
    linqMessageId: row.linq_message_id,
    riskLevel: (row as Record<string, unknown>).risk_level as Signal["riskLevel"],
    dueDate: (row as Record<string, unknown>).due_date as string | null,
    callPointer: (row as Record<string, unknown>).call_pointer as string | null,
    pinned: row.pinned ?? false,
    confidenceScore: (row as Record<string, unknown>).confidence_score as number | null,
    classificationReasoning: (row as Record<string, unknown>).classification_reasoning as string | null,
  }));
}

async function fetchAllSignals(): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals").select("*")
    .order("captured_at", { ascending: false }).limit(1000);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id, signalType: row.signal_type, sender: row.sender,
    summary: row.summary, sourceMessage: row.source_message, priority: row.priority,
    capturedAt: row.captured_at, actionsTaken: row.actions_taken || [],
    status: row.status,
    source: (row as Record<string, unknown>).source as Signal["source"] || "linq",
    rawPayload: row.raw_payload as Record<string, unknown> | null,
    linqMessageId: row.linq_message_id,
    riskLevel: (row as Record<string, unknown>).risk_level as Signal["riskLevel"],
    dueDate: (row as Record<string, unknown>).due_date as string | null,
    callPointer: (row as Record<string, unknown>).call_pointer as string | null,
    pinned: (row as any).pinned ?? false,
    confidenceScore: (row as Record<string, unknown>).confidence_score as number | null,
  }));
}

function groupByDate(signals: Signal[]): Record<string, Signal[]> {
  const groups: Record<string, Signal[]> = {};
  for (const s of signals) {
    const date = new Date(s.capturedAt).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
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
type SourceFilter = "all" | "calls" | "messages" | "notes";

const SOURCE_FILTER_MAP: Record<SourceFilter, string[]> = {
  all: [],
  calls: ["phone"],
  messages: ["linq", "gmail"],
  notes: ["manual"],
};

export default function ContactTimeline() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(name || "");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [relationshipBrief, setRelationshipBrief] = useState<string | null>(null);

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["contact-timeline", decodedName],
    queryFn: () => fetchContactSignals(decodedName),
    enabled: !!decodedName,
  });

  const { data: allSignals = [] } = useQuery({
    queryKey: ["all-signals-for-mutual"],
    queryFn: fetchAllSignals,
    staleTime: 120_000,
  });

  const filteredSignals = sourceFilter === "all"
    ? signals
    : signals.filter((s) => SOURCE_FILTER_MAP[sourceFilter].includes(s.source));

  const grouped = groupByDate(filteredSignals);
  const byType = groupByType(filteredSignals);

  const highCount = signals.filter((s) => s.priority === "high").length;
  const sources = [...new Set(signals.map((s) => s.source))];
  const types = [...new Set(signals.map((s) => s.signalType))];
  const actionCount = signals.reduce((acc, s) => acc + s.actionsTaken.length, 0);
  const lastInteraction = signals[0]?.capturedAt;
  const daysSince = lastInteraction ? daysBetween(lastInteraction) : 0;
  const strength = computeStrength(signals.length, highCount, daysSince);

  const pendingHigh = signals.filter((s) => s.priority === "high" && s.status !== "Complete");
  const unreplied = signals.filter((s) => s.signalType === "INTRO" && s.status === "Captured");

  const handleFetchBrief = async () => {
    setLoadingBrief(true);
    try {
      const { data, error } = await supabase.functions.invoke("relationship-brief", {
        body: { contact_name: decodedName },
      });
      if (error) throw error;
      setRelationshipBrief(data?.brief || "No brief available.");
    } catch {
      toast.error("Failed to generate relationship brief");
    }
    setLoadingBrief(false);
  };

  return (
    <div className="max-w-[720px] mx-auto px-5 py-8 md:py-12">
      {/* Back link */}
      <Link
        to="/contacts"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Smart Contacts
      </Link>

      {/* Profile Header — avatar, name, role, company, quick actions */}
      <Motion>
        <header className="mb-6">
          <ContactProfileHeader
            name={decodedName}
            strength={strength.score}
            strengthLabel={strength.label}
            signalCount={signals.length}
            daysSinceLast={daysSince}
          />
          <div className="mt-3">
            <ContactTagManager contactName={decodedName} />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleFetchBrief}
              disabled={loadingBrief}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              {loadingBrief ? <Loader2 className="w-3 h-3 animate-spin" /> : <HelpCircle className="w-3 h-3" />}
              Why this person?
            </button>
            <SaveToContactsButton contactName={decodedName} />
          </div>
        </header>
      </Motion>

      {/* Relationship Brief */}
      {relationshipBrief && (
        <Motion delay={40}>
          <div className="border border-primary/20 bg-primary/5 p-5 mb-6">
            <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3 h-3" />
              Why Am I Talking To This Person?
            </h3>
            <p className="font-sans text-[13px] leading-relaxed text-foreground">{relationshipBrief}</p>
          </div>
        </Motion>
      )}

      {/* Activity Chart */}
      <Motion delay={50}>
        <div className="mb-6">
          <ActivityChart signals={signals} />
        </div>
      </Motion>

      {/* Stats strip */}
      <Motion delay={60}>
        <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-border">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Signals</p>
            <p className="font-display text-[24px] text-foreground">{signals.length}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">High Priority</p>
            <p className="font-display text-[24px] text-primary">{highCount}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Actions</p>
            <p className="font-display text-[24px] text-foreground">{actionCount}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Channels</p>
            <div className="flex items-center gap-2 mt-2">
              {sources.map((src) => {
                const Icon = SOURCE_ICONS[src] || MessageSquare;
                return <Icon key={src} className={`w-4 h-4 ${SOURCE_COLORS[src] || "text-muted-foreground"}`} />;
              })}
            </div>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Types</p>
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

      {/* Suggested Actions */}
      {(pendingHigh.length > 0 || unreplied.length > 0 || daysSince > 14) && (
        <Motion delay={70}>
          <div className="border border-primary/20 bg-primary/5 p-4 mb-6">
            <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary mb-2 flex items-center gap-1.5">
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

      {/* Mutual Connections */}
      <Motion delay={80}>
        <div className="mb-6">
          <MutualConnections contactName={decodedName} allSignals={allSignals} />
        </div>
      </Motion>

      {/* Notes & Context */}
      <Motion delay={90}>
        <div className="mb-6">
          <ContactNotes contactName={decodedName} />
        </div>
      </Motion>

      {/* Engagement Sequences */}
      <Motion delay={100}>
        <div className="mb-6 border border-border bg-card p-4">
          <EngagementSequences contactName={decodedName} />
        </div>
      </Motion>

      {/* View mode + Source filter toggles */}
      <Motion delay={110}>
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex gap-1">
            {(["timeline", "by-type"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                  viewMode === m
                    ? "border-foreground text-foreground bg-card"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "timeline" ? "Timeline" : "By Type"}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(["all", "calls", "messages", "notes"] as SourceFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setSourceFilter(f)}
                className={`px-2.5 py-1 rounded-full font-mono text-[9px] uppercase tracking-wider transition-colors ${
                  sourceFilter === f
                    ? "bg-foreground text-background"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Motion>

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
                <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3 border-b border-border pb-2">
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
                        className="flex gap-3 p-4 border border-border bg-card hover:border-primary/20 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <Icon className={`w-4 h-4 ${SOURCE_COLORS[s.source] || "text-muted-foreground"}`} />
                          <div className="w-px flex-1 bg-border" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider border ${colors.text} ${colors.bg} ${colors.border}`}>
                              {s.signalType}
                            </span>
                            {s.priority === "high" && (
                              <span className="px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary border border-primary/30 bg-primary/5">
                                High
                              </span>
                            )}
                            {s.status === "Complete" && (
                              <span className="px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-500 border border-emerald-500/30 bg-emerald-500/5">
                                ✓
                              </span>
                            )}
                            <span className="font-mono text-[9px] text-muted-foreground ml-auto">{time}</span>
                          </div>
                          <p className="font-sans text-[13px] text-foreground leading-relaxed mb-1">{s.summary}</p>
                          {s.sourceMessage && s.sourceMessage !== s.summary && (
                            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{s.sourceMessage}</p>
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
                  <h2 className={`font-mono text-[10px] uppercase tracking-[0.2em] mb-3 border-b pb-2 ${colors.text} border-border`}>
                    {type} · {typeSignals.length}
                  </h2>
                  <div className="space-y-2">
                    {typeSignals.map((s) => {
                      const time = new Date(s.capturedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedSignal(s)}
                          className="p-3 border border-border bg-card hover:border-primary/20 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {s.priority === "high" && (
                              <span className="px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-primary border border-primary/30 bg-primary/5">
                                High
                              </span>
                            )}
                            <span className="font-mono text-[9px] text-muted-foreground ml-auto">{time}</span>
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
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">No signals found for this contact</p>
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
