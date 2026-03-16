import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Motion } from "@/components/ui/motion";
import type { Signal } from "@/data/signals";

const fetchActionItems = async (): Promise<Signal[]> => {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .neq("status", "Complete")
    .neq("signal_type", "NOISE")
    .or("due_date.not.is.null,priority.eq.high")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(10);

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
    emailMetadata: (row as Record<string, unknown>).email_metadata as Signal["emailMetadata"] || null,
    meetingId: (row as Record<string, unknown>).meeting_id as string | null,
    dueDate: row.due_date,
  })) as (Signal & { dueDate?: string | null })[];
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

interface ActionItemsProps {
  onSignalClick?: (signal: Signal) => void;
}

const ActionItems = ({ onSignalClick }: ActionItemsProps) => {
  const queryClient = useQueryClient();
  const [completing, setCompleting] = useState<string | null>(null);

  const { data: items = [] } = useQuery({
    queryKey: ["action-items"],
    queryFn: fetchActionItems,
    refetchInterval: 60_000,
  });

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
      queryClient.invalidateQueries({ queryKey: ["action-items"] });
      queryClient.invalidateQueries({ queryKey: ["signals-dashboard"] });
      toast.success("Marked complete");
    }
  };

  if (items.length === 0) return null;

  return (
    <Motion delay={60}>
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
            Action Items
          </p>
          <span className="font-mono text-[9px] text-vanta-text-muted">
            {items.length} open
          </span>
        </div>
        <div className="border border-vanta-border divide-y divide-vanta-border">
          {items.map((item) => {
            const extended = item as Signal & { dueDate?: string | null };
            const overdue = isOverdue(extended.dueDate);
            const dueLabel = formatDue(extended.dueDate);

            return (
              <button
                key={item.id}
                onClick={() => onSignalClick?.(item)}
                className="flex items-start gap-3 px-4 py-3 bg-card hover:bg-vanta-bg-elevated transition-colors w-full text-left group"
              >
                <button
                  onClick={(e) => handleComplete(item.id, e)}
                  disabled={completing === item.id}
                  className="mt-0.5 shrink-0 text-vanta-text-muted hover:text-primary transition-colors disabled:opacity-50"
                >
                  {completing === item.id ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[13px] text-foreground truncate group-hover:text-primary transition-colors">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[9px] text-vanta-text-low">{item.sender}</span>
                    {dueLabel && (
                      <>
                        <span className="w-px h-3 bg-vanta-border" />
                        <span
                          className={`font-mono text-[9px] flex items-center gap-1 ${
                            overdue ? "text-destructive" : "text-vanta-text-low"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {overdue ? "Overdue" : dueLabel}
                        </span>
                      </>
                    )}
                    {item.priority === "high" && (
                      <>
                        <span className="w-px h-3 bg-vanta-border" />
                        <span className="font-mono text-[8px] uppercase tracking-wider text-vanta-accent px-1.5 py-0.5 border border-vanta-accent-border bg-vanta-accent-faint">
                          High
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <Link
          to="/signals"
          className="flex items-center gap-1 mt-2 font-mono text-[9px] uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
        >
          All Signals <ArrowRight className="w-3 h-3" />
        </Link>
      </section>
    </Motion>
  );
};

export default ActionItems;
