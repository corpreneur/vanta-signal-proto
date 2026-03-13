import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Signal, SignalType } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";
import { Motion } from "@/components/ui/motion";
import { toast } from "sonner";
import { CheckCircle2, ArrowUp, Trash2, MessageSquare, Phone, Video, Mail, StickyNote } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  linq: MessageSquare, phone: Phone, recall: Video, gmail: Mail, manual: StickyNote,
};

async function fetchNoiseSignals(): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .eq("signal_type", "NOISE")
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

const PROMOTABLE_TYPES: SignalType[] = ["INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT"];

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NoiseQueue() {
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [promoteTargets, setPromoteTargets] = useState<Record<string, SignalType>>({});

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["noise-queue"],
    queryFn: fetchNoiseSignals,
  });

  const promoteMutation = useMutation({
    mutationFn: async ({ id, newType }: { id: string; newType: SignalType }) => {
      const { error } = await supabase
        .from("signals")
        .update({ signal_type: newType })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { newType }) => {
      queryClient.invalidateQueries({ queryKey: ["noise-queue"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.success(`Promoted to ${newType}`);
    },
    onError: () => toast.error("Failed to promote signal"),
  });

  const visible = useMemo(
    () => signals.filter((s) => !dismissed.has(s.id)),
    [signals, dismissed]
  );

  const dismissedCount = dismissed.size;
  const promotedCount = signals.length - visible.length - dismissedCount;

  return (
    <div className="max-w-[960px] mx-auto px-4 pt-8 md:pt-12 pb-16">
      <Motion>
        <header className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-tight">
            Noise Review Queue
          </h1>
          <p className="text-vanta-text-low text-xs font-mono mt-2 max-w-xl">
            Review AI-classified noise signals. Promote legitimate signals back to the feed or dismiss confirmed noise.
          </p>
        </header>
      </Motion>

      {/* Stats */}
      <Motion delay={40}>
        <div className="flex flex-wrap gap-6 mb-6 pb-4 border-b border-vanta-border">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">In Queue</p>
            <p className="font-display text-[24px] text-foreground">{visible.length}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Dismissed</p>
            <p className="font-display text-[24px] text-vanta-text-low">{dismissedCount}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Total Noise</p>
            <p className="font-display text-[24px] text-vanta-text-low">{signals.length}</p>
          </div>
        </div>
      </Motion>

      {isLoading && (
        <div className="py-16 text-center">
          <div className="w-2 h-2 bg-primary animate-pulse mx-auto" />
        </div>
      )}

      {/* Queue items */}
      <div className="space-y-2">
        {visible.map((signal, i) => {
          const Icon = SOURCE_ICONS[signal.source] || MessageSquare;
          const promoteTarget = promoteTargets[signal.id];

          return (
            <Motion key={signal.id} delay={80 + i * 15}>
              <div className="border border-vanta-border bg-vanta-bg-elevated p-4 group">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-3.5 h-3.5 text-vanta-text-low shrink-0" />
                    <span className="font-mono text-[12px] text-foreground font-semibold truncate">{signal.sender}</span>
                    <span className="font-mono text-[9px] text-vanta-text-muted">{formatTime(signal.capturedAt)}</span>
                  </div>
                </div>

                {/* Content */}
                <p className="font-sans text-[13px] text-foreground leading-relaxed mb-1">{signal.summary}</p>
                {signal.sourceMessage && signal.sourceMessage !== signal.summary && (
                  <p className="font-mono text-[10px] text-vanta-text-low leading-relaxed line-clamp-2 mb-3">{signal.sourceMessage}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Promote */}
                  <div className="flex items-center gap-1">
                    <Select
                      value={promoteTarget || ""}
                      onValueChange={(v) => setPromoteTargets((prev) => ({ ...prev, [signal.id]: v as SignalType }))}
                    >
                      <SelectTrigger className="h-7 w-[120px] font-mono text-[10px] uppercase tracking-wider border-vanta-border bg-transparent">
                        <SelectValue placeholder="Promote to…" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROMOTABLE_TYPES.map((t) => {
                          const tc = SIGNAL_TYPE_COLORS[t];
                          return (
                            <SelectItem key={t} value={t} className="font-mono text-[10px] uppercase">
                              <span className={tc.text}>{t}</span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {promoteTarget && (
                      <button
                        onClick={() => promoteMutation.mutate({ id: signal.id, newType: promoteTarget })}
                        disabled={promoteMutation.isPending}
                        className="flex items-center gap-1 px-2 py-1 font-mono text-[10px] uppercase tracking-wider border border-foreground text-foreground hover:bg-vanta-bg-elevated transition-colors"
                      >
                        <ArrowUp className="w-3 h-3" />
                        Promote
                      </button>
                    )}
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={() => setDismissed((prev) => new Set(prev).add(signal.id))}
                    className="flex items-center gap-1 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-vanta-text-low hover:text-foreground border border-vanta-border hover:border-vanta-border-mid transition-colors ml-auto"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Dismiss
                  </button>
                </div>
              </div>
            </Motion>
          );
        })}
      </div>

      {!isLoading && visible.length === 0 && (
        <div className="py-16 text-center border border-vanta-border">
          <CheckCircle2 className="w-6 h-6 text-vanta-text-muted mx-auto mb-3" />
          <p className="font-mono text-xs text-vanta-text-muted uppercase tracking-widest">
            Noise queue is clear
          </p>
        </div>
      )}
    </div>
  );
}
