import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { Motion } from "@/components/ui/motion";
import {
  Sun,
  Zap,
  Moon,
  MessageSquare,
  Phone,
  Video,
  Mail,
  StickyNote,
  CheckCircle2,
  ArrowRight,
  Trash2,
} from "lucide-react";

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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

interface DailyTimelineProps {
  signals: Signal[];
  onSignalClick: (s: Signal) => void;
  highOnly?: boolean;
}

export default function DailyTimeline({ signals, onSignalClick, highOnly = false }: DailyTimelineProps) {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(id);
    const { error } = await supabase.from("signals").delete().eq("id", id);
    setDeleting(null);
    if (error) {
      toast.error("Failed to delete");
    } else {
      queryClient.invalidateQueries({ queryKey: ["signals-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["action-items-enhanced"] });
      toast.success("Signal deleted");
    }
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todaySignals = useMemo(() => {
    let filtered = signals.filter((s) => new Date(s.capturedAt) >= today && s.signalType !== "NOISE");
    if (highOnly) filtered = filtered.filter((s) => s.priority === "high");
    return filtered.sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
  }, [signals, today, highOnly]);

  // Group into Prep (<12pm), Active (12-6pm), Review (>6pm)
  const { prep, active, review } = useMemo(() => {
    const p: Signal[] = [];
    const a: Signal[] = [];
    const r: Signal[] = [];
    todaySignals.forEach((s) => {
      const h = new Date(s.capturedAt).getHours();
      if (h < 12) p.push(s);
      else if (h < 18) a.push(s);
      else r.push(s);
    });
    return { prep: p, active: a, review: r };
  }, [todaySignals]);

  const completedToday = useMemo(
    () => signals.filter((s) => s.status === "Complete" && new Date(s.capturedAt) >= today),
    [signals, today]
  );

  const blocks = [
    { key: "prep", label: "Morning Prep", icon: Sun, color: "text-vanta-accent-amber", items: prep },
    { key: "active", label: "Active Day", icon: Zap, color: "text-vanta-accent", items: active },
    { key: "review", label: "Evening Review", icon: Moon, color: "text-vanta-accent-violet", items: review },
  ];

  if (todaySignals.length === 0 && completedToday.length === 0) {
    return (
      <section className="mb-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-4">Today's Timeline</p>
        <div className="border border-vanta-border p-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-muted">No signals captured today yet</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">Today's Timeline</p>
        <Link
          to="/signals"
          className="font-mono text-[9px] uppercase tracking-wider text-primary hover:text-vanta-accent transition-colors flex items-center gap-1"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-4">
        {blocks.map((block) => {
          if (block.items.length === 0) return null;
          return (
            <div key={block.key}>
              {/* Block header */}
              <div className="flex items-center gap-2 mb-2">
                <block.icon className={`w-3.5 h-3.5 ${block.color}`} />
                <span className={`font-mono text-[9px] uppercase tracking-[0.2em] ${block.color}`}>
                  {block.label}
                </span>
                <span className="font-mono text-[9px] text-vanta-text-muted">({block.items.length})</span>
                <div className="flex-1 h-px bg-vanta-border" />
              </div>

              {/* Items */}
              <div className="border border-vanta-border divide-y divide-vanta-border">
                {block.items.map((s) => {
                  const SourceIcon = SOURCE_ICONS[s.source] || MessageSquare;
                  const leftBorder = SIGNAL_LEFT_BORDER[s.signalType] || "border-l-transparent";
                  return (
                    <div
                      key={s.id}
                      className={`flex items-start gap-3 p-4 bg-card hover:bg-vanta-bg-elevated transition-colors w-full text-left border-l-2 ${leftBorder} group`}
                    >
                      <button
                        onClick={() => onSignalClick(s)}
                        className="flex items-start gap-3 flex-1 min-w-0 text-left"
                      >
                        <span className="font-mono text-[9px] text-vanta-text-muted shrink-0 mt-1 w-12">
                          {formatTime(s.capturedAt)}
                        </span>
                        <SourceIcon className="w-3.5 h-3.5 text-vanta-text-muted shrink-0 mt-1" />
                        <div className="min-w-0 flex-1">
                          <p className="font-sans text-[13px] text-foreground truncate">{s.summary}</p>
                          <p className="font-mono text-[9px] text-vanta-text-low mt-0.5">{s.sender}</p>
                        </div>
                      </button>
                      {s.priority === "high" && (
                        <span className="font-mono text-[8px] uppercase tracking-wider text-vanta-accent px-1.5 py-0.5 border border-vanta-accent-border bg-vanta-accent-faint shrink-0">
                          High
                        </span>
                      )}
                      {typeof s.confidenceScore === "number" && (
                        <span
                          className={`font-mono text-[8px] px-1.5 py-0.5 border shrink-0 ${
                            s.confidenceScore >= 0.85
                              ? "text-vanta-signal-green border-vanta-signal-green-border bg-vanta-signal-green-faint"
                              : s.confidenceScore >= 0.6
                              ? "text-vanta-signal-yellow border-vanta-signal-yellow-border bg-vanta-signal-yellow-faint"
                              : "text-vanta-signal-red border-vanta-signal-red-border bg-vanta-signal-red-faint"
                          }`}
                        >
                          {Math.round(s.confidenceScore * 100)}%
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDelete(s.id, e)}
                        disabled={deleting === s.id}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0 disabled:opacity-50"
                        title="Delete signal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Completed section */}
        {completedToday.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary">
                Completed
              </span>
              <span className="font-mono text-[9px] text-vanta-text-muted">({completedToday.length})</span>
              <div className="flex-1 h-px bg-vanta-border" />
            </div>
            <div className="border border-vanta-border divide-y divide-vanta-border opacity-60">
              {completedToday.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSignalClick(s)}
                  className="flex items-start gap-3 p-3 bg-card hover:bg-vanta-bg-elevated transition-colors w-full text-left"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="font-sans text-[12px] text-vanta-text-low truncate line-through">{s.summary}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
