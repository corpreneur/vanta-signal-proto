import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import type { Signal } from "@/data/signals";
import { daysBetween, recencyLabel } from "@/lib/contactStrength";
import { MessageSquare, Phone, Video, Mail, StickyNote, Clock, Bell, ArrowRight, TrendingDown, TrendingUp, Download, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { downloadVCard } from "@/lib/vcard";
import ContactTagManager from "@/components/ContactTagManager";
import { useContactProfile, RELATIONSHIP_LABELS } from "@/hooks/use-contact-profiles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const profile = useContactProfile(contact.name);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const colors = SIGNAL_TYPE_COLORS[contact.dominantType as keyof typeof SIGNAL_TYPE_COLORS] || SIGNAL_TYPE_COLORS.CONTEXT;

  const strengthTrend = contact.daysSinceLast <= 3 ? "up" : contact.daysSinceLast > 14 ? "down" : "stable";

  const recentCount = contact.recentSignals.filter(
    (s) => daysBetween(s.capturedAt) <= 30
  ).length;
  const velocity = Math.round((recentCount / 4.3) * 10) / 10;

  // Call stats derived from signals
  const callSignals = contact.recentSignals.filter((s) => s.source === "phone");
  const totalCalls = Object.entries(contact.signalTypes).reduce(
    (acc, [type, count]) => type === "PHONE_CALL" ? acc + count : acc, 0
  );

  const handlePrepare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingBrief(true);
    try {
      const { data, error } = await supabase.functions.invoke("relationship-brief", {
        body: { contact_name: contact.name },
      });
      if (error) throw error;
      toast.success(data?.brief || "No brief available.", { duration: 8000 });
    } catch {
      toast.error("Failed to generate brief");
    }
    setLoadingBrief(false);
  };

  return (
    <div
      onClick={() => navigate(`/contact/${encodeURIComponent(contact.name)}`)}
      className="border border-border bg-card hover:border-primary/30 transition-all cursor-pointer group"
    >
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-10 h-10 shrink-0 flex items-center justify-center border ${colors.border} ${colors.bg} rounded-full overflow-hidden`}>
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt={contact.name} className="w-full h-full object-cover" />
              ) : (
                <span className={`${colors.text} font-mono text-[12px] font-bold`}>
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[13px] text-foreground font-semibold truncate group-hover:translate-x-0.5 transition-transform">
                {contact.name}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {profile?.title && (
                  <span className="font-mono text-[9px] text-muted-foreground truncate max-w-[120px]">
                    {profile.title}{profile.company ? ` · ${profile.company}` : ""}
                  </span>
                )}
                {!profile?.title && (
                  <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                    {recencyLabel(contact.daysSinceLast)} · {contact.signalCount} signals
                  </span>
                )}
                {profile?.relationship_type && profile.relationship_type !== "personal" && (
                  <span className="px-1 py-0.5 font-mono text-[7px] uppercase tracking-wider border border-primary/20 bg-primary/5 text-primary">
                    {RELATIONSHIP_LABELS[profile.relationship_type] || profile.relationship_type}
                  </span>
                )}
              </div>
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

        {/* Mini activity sparkline — 8 weeks */}
        {(() => {
          const now = Date.now();
          const weekMs = 7 * 24 * 60 * 60 * 1000;
          const weeks = Array.from({ length: 8 }, (_, i) => {
            const weekStart = now - (7 - i) * weekMs;
            const weekEnd = weekStart + weekMs;
            return contact.recentSignals.filter((s) => {
              const t = new Date(s.capturedAt).getTime();
              return t >= weekStart && t < weekEnd;
            }).length;
          });
          const max = Math.max(...weeks, 1);
          return (
            <div className="flex items-end gap-[3px] h-4 mb-3">
              {weeks.map((count, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-[1px] transition-all ${count > 0 ? "bg-primary" : "bg-muted"}`}
                  style={{
                    height: count > 0 ? `${Math.max(20, (count / max) * 100)}%` : "15%",
                    opacity: count > 0 ? 0.4 + (count / max) * 0.6 : 0.3,
                  }}
                />
              ))}
            </div>
          );
        })()}

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3 pb-3 border-b border-border/50">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="font-mono text-[9px] text-muted-foreground">{velocity}/wk</span>
          </div>
          {totalCalls > 0 && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-muted-foreground" />
              <span className="font-mono text-[9px] text-muted-foreground">{totalCalls} calls</span>
            </div>
          )}
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

        {/* Last message preview */}
        {contact.recentSignals[0] && (
          <div className="mb-2 px-2 py-1.5 bg-muted/30 border border-border/50">
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Last message</p>
            <p className="font-mono text-[10px] text-foreground/80 line-clamp-2 leading-relaxed">
              {contact.recentSignals[0].sourceMessage?.slice(0, 140) || contact.recentSignals[0].summary}
            </p>
          </div>
        )}

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

        {/* Tags */}
        <div className="mb-2" onClick={(e) => e.stopPropagation()}>
          <ContactTagManager contactName={contact.name} compact />
        </div>

        {/* CTAs — consolidated quick actions */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
          <button className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider text-primary">
            View <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={handlePrepare}
            disabled={loadingBrief}
            className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            {loadingBrief ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Prepare
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadVCard({ name: contact.name, note: "Exported from Vanta Signal" });
            }}
            className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
          >
            <Download className="w-3 h-3" /> .vcf
          </button>
          <a
            href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(contact.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider text-[#0A66C2] hover:text-[#0A66C2]/80 transition-colors ml-auto"
          >
            <ExternalLink className="w-3 h-3" /> LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}
