import { useMemo } from "react";
import { Phone, MessageSquare, Clock, FileText, TrendingUp, TrendingDown } from "lucide-react";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { computeStrength, daysBetween, recencyLabel } from "@/lib/contactStrength";

interface CommsPrepCardProps {
  signal: Signal;
  allSignals: Signal[];
}

/**
 * Comms Prep — surfaces a contextual snapshot when a call/text signal appears,
 * showing relationship strength, recent history, and key talking points.
 * Research: "Providing snapshot of relevant points and recent comms history
 * when user receives calls / texts."
 */
export default function CommsPrepCard({ signal, allSignals }: CommsPrepCardProps) {
  const isCall = signal.signalType === "PHONE_CALL" || signal.source === "phone";
  const isText = signal.source === "linq";
  if (!isCall && !isText) return null;

  const contactHistory = useMemo(() => {
    const history = allSignals
      .filter((s) => s.sender === signal.sender && s.id !== signal.id)
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());

    const signalCount = history.length;
    const highPriority = history.filter((s) => s.priority === "high").length;
    const days = history.length > 0 ? daysBetween(history[0].capturedAt) : 999;
    const { strength, strengthLabel } = computeStrength({ signalCount, highPriority, daysSinceLast: days });

    const topicsDiscussed = history
      .slice(0, 5)
      .map((s) => s.summary)
      .filter(Boolean);

    const signalTypes: Record<string, number> = {};
    history.forEach((s) => {
      signalTypes[s.signalType] = (signalTypes[s.signalType] || 0) + 1;
    });

    const recentDecisions = history.filter((s) => s.signalType === "DECISION").slice(0, 2);
    const openItems = history.filter((s) => s.status !== "Complete" && s.priority === "high").slice(0, 3);

    return {
      signalCount,
      days,
      strength,
      strengthLabel,
      topicsDiscussed,
      signalTypes,
      recentDecisions,
      openItems,
    };
  }, [signal, allSignals]);

  if (contactHistory.signalCount === 0) return null;

  const trend = contactHistory.days <= 3 ? "up" : contactHistory.days > 14 ? "down" : "stable";

  return (
    <div className="border border-vanta-accent-border bg-vanta-accent-faint/30 p-4 mb-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          {isCall ? <Phone className="w-3 h-3 text-vanta-accent-phone" /> : <MessageSquare className="w-3 h-3 text-vanta-accent" />}
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-accent">
          Comms Prep · {signal.sender}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {trend === "up" && <TrendingUp className="w-3 h-3 text-vanta-signal-green" />}
          {trend === "down" && <TrendingDown className="w-3 h-3 text-destructive" />}
          <span className={`font-mono text-[11px] font-bold ${
            contactHistory.strength >= 75 ? "text-vanta-signal-green" :
            contactHistory.strength >= 50 ? "text-vanta-signal-blue" :
            contactHistory.strength >= 25 ? "text-vanta-signal-yellow" : "text-vanta-text-muted"
          }`}>
            {contactHistory.strength}
          </span>
          <span className="font-mono text-[9px] text-vanta-text-muted">
            {contactHistory.strengthLabel}
          </span>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="flex items-center gap-4 mb-3 pb-2 border-b border-vanta-border/50">
        <span className="font-mono text-[9px] text-vanta-text-low">
          <Clock className="w-3 h-3 inline mr-1" />
          Last: {recencyLabel(contactHistory.days)}
        </span>
        <span className="font-mono text-[9px] text-vanta-text-low">
          <FileText className="w-3 h-3 inline mr-1" />
          {contactHistory.signalCount} prior signals
        </span>
        <div className="flex gap-1 ml-auto">
          {Object.entries(contactHistory.signalTypes).slice(0, 3).map(([type, count]) => {
            const tc = SIGNAL_TYPE_COLORS[type as keyof typeof SIGNAL_TYPE_COLORS] || SIGNAL_TYPE_COLORS.CONTEXT;
            return (
              <span key={type} className={`${tc.bg} ${tc.text} text-[8px] font-mono px-1.5 py-0.5 border ${tc.border} uppercase tracking-wider`}>
                {type} {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Recent topics — key talking points */}
      {contactHistory.topicsDiscussed.length > 0 && (
        <div className="mb-3">
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1.5">
            Recent Topics
          </p>
          <ul className="space-y-1">
            {contactHistory.topicsDiscussed.slice(0, 3).map((topic, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="w-1 h-1 mt-1.5 rounded-full bg-vanta-accent shrink-0" />
                <span className="font-mono text-[10px] text-vanta-text-low leading-relaxed line-clamp-1">
                  {topic}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Open high-priority items */}
      {contactHistory.openItems.length > 0 && (
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-destructive/70 mb-1.5">
            Open High-Priority
          </p>
          <ul className="space-y-1">
            {contactHistory.openItems.map((item) => (
              <li key={item.id} className="flex items-start gap-1.5">
                <span className="w-1 h-1 mt-1.5 rounded-full bg-destructive shrink-0" />
                <span className="font-mono text-[10px] text-vanta-text-low leading-relaxed line-clamp-1">
                  {item.summary}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
