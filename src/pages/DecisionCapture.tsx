import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import SignalEntryCard from "@/components/SignalEntryCard";
import SignalDetailDrawer from "@/components/SignalDetailDrawer";
import { Gavel, CheckCircle2, AlertTriangle } from "lucide-react";

const fetchDecisions = async (): Promise<Signal[]> => {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .eq("signal_type", "DECISION")
    .order("captured_at", { ascending: false })
    .limit(200);

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
    riskLevel: (row as Record<string, unknown>).risk_level as Signal["riskLevel"] || null,
    dueDate: (row as Record<string, unknown>).due_date as string | null,
    callPointer: (row as Record<string, unknown>).call_pointer as string | null,
    pinned: row.pinned ?? false,
    confidenceScore: (row as Record<string, unknown>).confidence_score as number | null,
    classificationReasoning: (row as Record<string, unknown>).classification_reasoning as string | null,
  }));
};

const DecisionCapture = () => {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["signals", "DECISION"],
    queryFn: fetchDecisions,
  });

  const open = useMemo(() => signals.filter((s) => s.status !== "Complete"), [signals]);
  const resolved = useMemo(() => signals.filter((s) => s.status === "Complete"), [signals]);

  const resolvedThisWeek = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return resolved.filter((s) => new Date(s.capturedAt) >= weekAgo).length;
  }, [resolved]);

  const overdue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return open.filter((s) => s.dueDate && new Date(s.dueDate + "T00:00:00") < today).length;
  }, [open]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">
          Decision Capture
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
          Accountability, agreements & commitments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Gavel className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Open</span>
          </div>
          <span className="font-sans text-2xl font-bold text-foreground">{open.length}</span>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Resolved (week)</span>
          </div>
          <span className="font-sans text-2xl font-bold text-foreground">{resolvedThisWeek}</span>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Overdue</span>
          </div>
          <span className={`font-sans text-2xl font-bold ${overdue > 0 ? "text-destructive" : "text-foreground"}`}>
            {overdue}
          </span>
        </div>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-2 h-2 bg-primary animate-pulse mx-auto" />
        </div>
      ) : signals.length === 0 ? (
        <div className="py-12 text-center border border-border bg-card">
          <Gavel className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            No decisions captured yet
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {open.length > 0 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Open Decisions ({open.length})
              </p>
              <div className="space-y-2">
                {open.map((s) => (
                  <SignalEntryCard key={s.id} signal={s} onClick={() => setSelectedSignal(s)} />
                ))}
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Resolved ({resolved.length})
              </p>
              <div className="space-y-2">
                {resolved.map((s) => (
                  <SignalEntryCard key={s.id} signal={s} onClick={() => setSelectedSignal(s)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <SignalDetailDrawer
        signal={selectedSignal}
        open={!!selectedSignal}
        onClose={() => setSelectedSignal(null)}
      />
    </div>
  );
};

export default DecisionCapture;
