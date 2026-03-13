import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { ArrowLeft, MessageSquare, Phone, Video, Mail, StickyNote } from "lucide-react";
import { Motion } from "@/components/ui/motion";

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

export default function ContactTimeline() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name || "");

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["contact-timeline", decodedName],
    queryFn: () => fetchContactSignals(decodedName),
    enabled: !!decodedName,
  });

  const grouped = groupByDate(signals);

  // Stats
  const highCount = signals.filter((s) => s.priority === "high").length;
  const sources = [...new Set(signals.map((s) => s.source))];
  const types = [...new Set(signals.map((s) => s.signalType))];

  return (
    <div className="max-w-[720px] mx-auto px-5 py-8 md:py-12">
      {/* Back link */}
      <Link
        to="/graph"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-low hover:text-vanta-accent transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Relationship Graph
      </Link>

      {/* Header */}
      <Motion>
        <header className="mb-8">
          <h1 className="font-display text-[clamp(24px,4vw,36px)] leading-tight text-foreground mb-2">
            {decodedName}
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-muted">
            Contact Timeline · {signals.length} signals
          </p>
        </header>
      </Motion>

      {/* Stats strip */}
      <Motion delay={60}>
        <div className="flex flex-wrap gap-6 mb-8 pb-6 border-b border-vanta-border">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Total Signals</p>
            <p className="font-display text-[24px] text-foreground">{signals.length}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">High Priority</p>
            <p className="font-display text-[24px] text-vanta-accent">{highCount}</p>
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

      {/* Loading */}
      {isLoading && (
        <div className="py-12 text-center">
          <div className="w-2 h-2 bg-primary animate-pulse mx-auto" />
        </div>
      )}

      {/* Timeline */}
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
                      className="flex gap-3 p-4 border border-vanta-border bg-vanta-bg-elevated hover:border-vanta-border-mid transition-colors"
                    >
                      {/* Timeline dot + source icon */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <Icon className={`w-4 h-4 ${SOURCE_COLORS[s.source] || "text-vanta-text-low"}`} />
                        <div className="w-px flex-1 bg-vanta-border" />
                      </div>

                      {/* Content */}
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

      {!isLoading && signals.length === 0 && (
        <div className="py-12 text-center">
          <p className="font-mono text-xs text-vanta-text-muted uppercase tracking-widest">No signals found for this contact</p>
        </div>
      )}
    </div>
  );
}
