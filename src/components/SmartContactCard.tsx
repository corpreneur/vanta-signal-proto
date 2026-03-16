import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import type { Signal } from "@/data/signals";
import { computeStrength, daysBetween, recencyLabel } from "@/lib/contactStrength";
import { MessageSquare, Phone, Video, Mail, StickyNote, Clock, Bell, ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import ContactTagManager from "@/components/ContactTagManager";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  linq: MessageSquare, phone: Phone, recall: Video, gmail: Mail, manual: StickyNote,
};

interface SmartContactCardProps {
  name: string;
  signalCount: number;
  highPriority: number;
  lastInteraction: string;
  daysSinceLast: number;
  sources: Set<string>;
  signalTypes: Record<string, number>;
  dominantType: string;
  recentSignals: Signal[];
  strength: number;
  strengthLabel: string;
  engagementSequence?: { intervalDays: number; nextDueAt: string; note: string | null } | null;
}

export default function SmartContactCard({ contact }: { contact: SmartContactCardProps }) {
  const navigate = useNavigate();
  const colors = SIGNAL_TYPE_COLORS[contact.dominantType as keyof typeof SIGNAL_TYPE_COLORS] || SIGNAL_TYPE_COLORS.CONTEXT;

  const strengthTrend = contact.daysSinceLast <= 3 ? "up" : contact.daysSinceLast > 14 ? "down" : "stable";

  // Compute interaction velocity (signals per week over last 30 days)
  const recentCount = contact.recentSignals.filter(
    (s) => daysBetween(s.capturedAt) <= 30
  ).length;
  const velocity = Math.round((recentCount / 4.3) * 10) / 10;

  return (
    <div
      onClick={() => navigate(`/contact/${encodeURIComponent(contact.name)}`)}
      className="border border-border bg-card hover:border-primary/30 transition-all cursor-pointer group"
    >
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-10 h-10 shrink-0 flex items-center justify-center border ${colors.border} ${colors.bg} rounded-full`}>
              <span className={`${colors.text} font-mono text-[12px] font-bold`}>
                {contact.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[13px] text-foreground font-semibold truncate group-hover:translate-x-0.5 transition-transform">
                {contact.name}
              </p>
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                {recencyLabel(contact.daysSinceLast)} · {contact.signalCount} signals
              </p>
            </div>
          </div>

          {/* Strength + trend */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <div className="flex items-center gap-1">
                {strengthTrend === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                {strengthTrend === "down" && <TrendingDown className="w-3 h-3 text-destructive" />}
                <span className={`font-mono text-sm font-bold ${
                  contact.strength >= 75 ? "text-emerald-500" :
                  contact.strength >= 50 ? "text-sky-500" :
                  contact.strength >= 25 ? "text-amber-500" : "text-muted-foreground"
                }`}>
                  {contact.strength}
                </span>
              </div>
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all ${
                    contact.strength >= 75 ? "bg-emerald-500" :
                    contact.strength >= 50 ? "bg-sky-500" :
                    contact.strength >= 25 ? "bg-amber-500" : "bg-muted-foreground"
                  }`}
                  style={{ width: `${contact.strength}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3 pb-3 border-b border-border/50">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="font-mono text-[9px] text-muted-foreground">{velocity}/wk</span>
          </div>
          {contact.highPriority > 0 && (
            <span className="px-1.5 py-0.5 font-mono text-[9px] text-destructive border border-destructive/30 bg-destructive/5">
              {contact.highPriority} HIGH
            </span>
          )}
          <div className="flex gap-1 ml-auto">
            {Array.from(contact.sources).map((src) => {
              const Icon = SOURCE_ICONS[src] || MessageSquare;
              return <Icon key={src} className="w-3.5 h-3.5 text-muted-foreground" />;
            })}
          </div>
        </div>

        {/* Signal type chips */}
        <div className="flex flex-wrap gap-1 mb-2">
          {Object.entries(contact.signalTypes).map(([type, count]) => {
            const tc = SIGNAL_TYPE_COLORS[type as keyof typeof SIGNAL_TYPE_COLORS] || SIGNAL_TYPE_COLORS.CONTEXT;
            return (
              <span key={type} className={`${tc.bg} ${tc.text} text-[8px] font-mono px-1.5 py-0.5 border ${tc.border} uppercase tracking-wider`}>
                {type} {count}
              </span>
            );
          })}
        </div>

        {/* Tags */}
        <div className="mb-2" onClick={(e) => e.stopPropagation()}>
          <ContactTagManager contactName={contact.name} compact />
        </div>

        {/* Engagement reminder */}
        {contact.engagementSequence && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 border border-primary/20 bg-primary/5">
            <Bell className="w-3 h-3 text-primary" />
            <span className="font-mono text-[9px] text-primary">
              Check in every {contact.engagementSequence.intervalDays}d
            </span>
            {contact.engagementSequence.note && (
              <span className="font-mono text-[8px] text-muted-foreground ml-1 truncate">
                — {contact.engagementSequence.note}
              </span>
            )}
          </div>
        )}

        {/* Recent signal previews */}
        <div className="space-y-1">
          {contact.recentSignals.slice(0, 2).map((s) => {
            const sc = SIGNAL_TYPE_COLORS[s.signalType as keyof typeof SIGNAL_TYPE_COLORS] || SIGNAL_TYPE_COLORS.CONTEXT;
            return (
              <div key={s.id} className="flex items-start gap-1.5">
                <span className={`w-1.5 h-1.5 mt-1.5 rounded-full shrink-0 ${sc.text.replace("text-", "bg-")}`} />
                <p className="font-mono text-[10px] text-muted-foreground truncate leading-relaxed">
                  <span className="text-muted-foreground/60 mr-1">
                    {new Date(s.capturedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  {s.summary}
                </p>
              </div>
            );
          })}
        </div>

        {/* View timeline CTA */}
        <button className="flex items-center gap-1 mt-3 font-mono text-[8px] uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          View Timeline <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
