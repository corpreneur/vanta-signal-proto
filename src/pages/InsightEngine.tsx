import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import SignalEntryCard from "@/components/SignalEntryCard";
import SignalDetailDrawer from "@/components/SignalDetailDrawer";
import { Search, Lightbulb, Users, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const fetchInsights = async (): Promise<Signal[]> => {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .eq("signal_type", "INSIGHT")
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

const InsightEngine = () => {
  const [search, setSearch] = useState("");
  const [groupByContact, setGroupByContact] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["signals", "INSIGHT"],
    queryFn: fetchInsights,
  });

  const filtered = useMemo(() => {
    if (!search) return signals;
    const q = search.toLowerCase();
    return signals.filter(
      (s) =>
        s.summary.toLowerCase().includes(q) ||
        s.sender.toLowerCase().includes(q) ||
        s.sourceMessage.toLowerCase().includes(q)
    );
  }, [signals, search]);

  const thisWeek = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return filtered.filter((s) => new Date(s.capturedAt) >= weekAgo).length;
  }, [filtered]);

  const topContributors = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((s) => {
      counts[s.sender] = (counts[s.sender] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [filtered]);

  const grouped = useMemo(() => {
    if (!groupByContact) return null;
    const groups: Record<string, Signal[]> = {};
    filtered.forEach((s) => {
      if (!groups[s.sender]) groups[s.sender] = [];
      groups[s.sender].push(s);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filtered, groupByContact]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">
          Insight Engine
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
          Frameworks, observations & patterns from your network
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Total</span>
          </div>
          <span className="font-sans text-2xl font-bold text-foreground">{filtered.length}</span>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">This Week</span>
          </div>
          <span className="font-sans text-2xl font-bold text-foreground">{thisWeek}</span>
        </div>
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Top Source</span>
          </div>
          <span className="font-sans text-sm font-semibold text-foreground truncate">
            {topContributors[0]?.[0] || "—"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search insights…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono text-xs"
          />
        </div>
        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">
          <Switch checked={groupByContact} onCheckedChange={setGroupByContact} />
          Group by contact
        </label>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-2 h-2 bg-primary animate-pulse mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center border border-border bg-card">
          <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            No insights captured yet
          </p>
        </div>
      ) : grouped ? (
        <div className="space-y-6">
          {grouped.map(([sender, senderSignals]) => (
            <div key={sender}>
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                {sender} · {senderSignals.length} insight{senderSignals.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {senderSignals.map((s) => (
                  <SignalEntryCard key={s.id} signal={s} onClick={() => setSelectedSignal(s)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <SignalEntryCard key={s.id} signal={s} onClick={() => setSelectedSignal(s)} />
          ))}
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

export default InsightEngine;
