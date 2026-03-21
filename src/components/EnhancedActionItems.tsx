import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Clock, ArrowRight, ChevronDown, ChevronUp, Zap, AlertTriangle, Shield, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Motion } from "@/components/ui/motion";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import type { Signal } from "@/data/signals";

const fetchActionItems = async (): Promise<(Signal & { dueDate?: string | null; riskLevel?: string | null })[]> => {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .neq("status", "Complete")
    .neq("signal_type", "NOISE")
    .or("due_date.not.is.null,priority.eq.high")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(20);

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
    dueDate: row.due_date,
    riskLevel: row.risk_level,
    confidenceScore: row.confidence_score,
  }));
};

function isOverdue(dueDate: string | null | undefined) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatDue(dueDate: string | null | undefined) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PRIORITY_COLORS = {
  high: "border-l-destructive bg-destructive/5",
  medium: "border-l-amber-500 bg-amber-500/5",
  low: "border-l-muted-foreground bg-transparent",
};

const QUICK_ACTIONS: Record<string, string[]> = {
  INTRO: ["Send follow-up", "Schedule call"],
  INVESTMENT: ["Review terms", "Share with advisor"],
  DECISION: ["Set deadline", "Gather input"],
  MEETING: ["Prep brief", "Send agenda"],
  PHONE_CALL: ["Log notes", "Follow up"],
  INSIGHT: ["Save to vault", "Share with team"],
  CONTEXT: ["Add to brief"],
};

interface EnhancedActionItemsProps {
  onSignalClick?: (signal: Signal) => void;
}

export default function EnhancedActionItems({ onSignalClick }: EnhancedActionItemsProps) {
  const queryClient = useQueryClient();
  const [completing, setCompleting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "quick" | "overdue">("all");
  const COLLAPSED_LIMIT = 4;
  const [showAll, setShowAll] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["action-items-enhanced"],
    queryFn: fetchActionItems,
    refetchInterval: 60_000,
  });

  const filtered = useMemo(() => {
    if (filter === "quick") {
      return items.filter((i) => i.priority !== "high" && !isOverdue(i.dueDate));
    }
    if (filter === "overdue") {
      return items.filter((i) => isOverdue(i.dueDate));
    }
    return items;
  }, [items, filter]);

  const overdueCount = items.filter((i) => isOverdue(i.dueDate)).length;

  const handleComplete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompleting(id);
    const { error } = await supabase
      .from("signals")
      .update({ status: "Complete" as const })
      .eq("id", id);
    setCompleting(null);
    if (error) {
      toast.error("Failed to complete");
    } else {
      queryClient.invalidateQueries({ queryKey: ["action-items-enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["signals-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["action-items"] });
      toast.success("Marked complete");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(id);
    const { error } = await supabase
      .from("signals")
      .delete()
      .eq("id", id);
    setDeleting(null);
    if (error) {
      toast.error("Failed to delete");
    } else {
      queryClient.invalidateQueries({ queryKey: ["action-items-enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["signals-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.success("Signal deleted");
    }
  };

  if (items.length === 0) return null;

  return (
    <Motion delay={60}>
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Action Items
          </p>
          <div className="flex items-center gap-2">
            {/* Filter pills */}
            {(["all", "quick", "overdue"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 border transition-colors ${
                  filter === f
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "quick" && <Zap className="w-2.5 h-2.5 inline mr-0.5" />}
                {f === "overdue" && <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" />}
                {f === "all" ? `${items.length} open` : f === "quick" ? "Quick" : `${overdueCount} overdue`}
              </button>
            ))}
          </div>
        </div>

        {(() => {
          const visibleItems = showAll ? filtered : filtered.slice(0, COLLAPSED_LIMIT);
          const hasMore = filtered.length > COLLAPSED_LIMIT;
          return (
            <>
              <div className="border border-border divide-y divide-border">
                {visibleItems.map((item) => {
                  const overdue = isOverdue(item.dueDate);
                  const dueLabel = formatDue(item.dueDate);
                  const colors = SIGNAL_TYPE_COLORS[item.signalType as keyof typeof SIGNAL_TYPE_COLORS];
                  const priorityStyle = PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.low;
                  const isExpanded = expandedId === item.id;
                  const suggestedActions = QUICK_ACTIONS[item.signalType] || [];

                  return (
                    <div key={item.id} className={`border-l-2 ${priorityStyle}`}>
                      <button
                        onClick={() => onSignalClick?.(item)}
                        className="flex items-start gap-3 px-4 py-3 bg-card hover:bg-accent/5 transition-colors w-full text-left group"
                      >
                        <button
                          onClick={(e) => handleComplete(item.id, e)}
                          disabled={completing === item.id}
                          className="mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center border border-border rounded-sm text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-all disabled:opacity-50"
                          title="Mark done"
                        >
                          <Check className={`w-3 h-3 ${completing === item.id ? "text-primary" : ""}`} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="font-sans text-[13px] text-foreground truncate group-hover:text-primary transition-colors">
                            {item.summary}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {colors && (
                              <span className={`${colors.bg} ${colors.text} text-[8px] font-mono px-1.5 py-0.5 border ${colors.border} uppercase tracking-wider`}>
                                {item.signalType}
                              </span>
                            )}
                            <span className="font-mono text-[9px] text-muted-foreground">{item.sender}</span>
                            {dueLabel && (
                              <>
                                <span className="w-px h-3 bg-border" />
                                <span className={`font-mono text-[9px] flex items-center gap-1 ${overdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                                  <Clock className="w-3 h-3" />
                                  {overdue ? "Overdue" : dueLabel}
                                </span>
                              </>
                            )}
                            {item.riskLevel && item.riskLevel !== "low" && (
                              <>
                                <span className="w-px h-3 bg-border" />
                                <span className={`font-mono text-[8px] uppercase tracking-wider flex items-center gap-0.5 ${
                                  item.riskLevel === "critical" ? "text-destructive" :
                                  item.riskLevel === "high" ? "text-amber-600" : "text-muted-foreground"
                                }`}>
                                  <Shield className="w-3 h-3" />
                                  {item.riskLevel} weight
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            disabled={deleting === item.id}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                            title="Delete signal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : item.id); }}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </button>

                      {isExpanded && suggestedActions.length > 0 && (
                        <div className="px-4 pb-3 pt-1 flex gap-2 flex-wrap border-t border-border/50 bg-muted/30">
                          <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground self-center mr-1">
                            Suggested:
                          </span>
                          {suggestedActions.map((action) => (
                            <button
                              key={action}
                              onClick={() => toast.info(`Action "${action}" coming soon`)}
                              className="font-mono text-[9px] px-2.5 py-1 border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <button
                  onClick={() => setShowAll((prev) => !prev)}
                  className="flex items-center gap-1 mt-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-1.5"
                >
                  {showAll ? (
                    <>Show less <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Show {filtered.length - COLLAPSED_LIMIT} more <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </>
          );
        })()}

        <Link
          to="/signals"
          className="flex items-center gap-1 mt-2 font-mono text-[9px] uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
        >
          All Signals <ArrowRight className="w-3 h-3" />
        </Link>
      </section>
    </Motion>
  );
}
