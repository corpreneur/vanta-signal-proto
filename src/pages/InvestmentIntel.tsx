import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Signal, SignalStatus } from "@/data/signals";
import SignalEntryCard from "@/components/SignalEntryCard";
import SignalDetailDrawer from "@/components/SignalDetailDrawer";
import { TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

const fetchInvestments = async (): Promise<Signal[]> => {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .eq("signal_type", "INVESTMENT")
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

const PIPELINE_STAGES: SignalStatus[] = ["Captured", "In Progress", "Complete"];

const InvestmentIntel = () => {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["signals", "INVESTMENT"],
    queryFn: fetchInvestments,
  });

  const highPriority = useMemo(() => signals.filter((s) => s.priority === "high").length, [signals]);

  const byStatus = useMemo(() => {
    const groups: Record<SignalStatus, Signal[]> = {
      Captured: [],
      "In Progress": [],
      Complete: [],
    };
    signals.forEach((s) => {
      if (groups[s.status]) groups[s.status].push(s);
    });
    return groups;
  }, [signals]);

  const sourceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    signals.forEach((s) => {
      counts[s.source] = (counts[s.source] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [signals]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">
          Investment Intel
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
          Deal flow, fund activity & investment signals
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Active</span>
          </div>
          <span className="font-sans text-2xl font-bold text-foreground">
            {signals.filter((s) => s.status !== "Complete").length}
          </span>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">High Priority</span>
          </div>
          <span className="font-sans text-2xl font-bold text-foreground">{highPriority}</span>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Sources</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {sourceBreakdown.map(([src, count]) => (
              <span key={src} className="font-mono text-[10px] uppercase text-muted-foreground">
                {src} ({count})
              </span>
            ))}
            {sourceBreakdown.length === 0 && <span className="text-muted-foreground text-sm">—</span>}
          </div>
        </div>
      </div>

      {/* Pipeline */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-2 h-2 bg-primary animate-pulse mx-auto" />
        </div>
      ) : signals.length === 0 ? (
        <div className="py-12 text-center border border-border bg-card">
          <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            No investment signals captured yet
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {PIPELINE_STAGES.map((stage) => {
            const stageSignals = byStatus[stage];
            if (stageSignals.length === 0) return null;
            return (
              <div key={stage}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                    {stage}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    ({stageSignals.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {stageSignals.map((s) => (
                    <SignalEntryCard key={s.id} signal={s} onClick={() => setSelectedSignal(s)} />
                  ))}
                </div>
              </div>
            );
          })}
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

export default InvestmentIntel;
