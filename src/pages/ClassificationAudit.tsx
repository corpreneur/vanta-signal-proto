import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Signal, SignalType, SignalPriority, SIGNAL_TYPE_COLORS } from "@/data/signals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Check,
  RefreshCw,
  Search,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const SIGNAL_TYPES: SignalType[] = ["INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT", "NOISE", "MEETING", "PHONE_CALL"];
const PRIORITIES: SignalPriority[] = ["high", "medium", "low"];

interface AuditRow {
  signal: Signal;
  pendingType: SignalType | null;
  pendingPriority: SignalPriority | null;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return `${Math.round(diffH * 60)}m ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function fetchSignals(): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .order("captured_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  return (data || []).map((r) => ({
    id: r.id,
    signalType: r.signal_type as SignalType,
    sender: r.sender,
    summary: r.summary,
    sourceMessage: r.source_message,
    priority: r.priority as SignalPriority,
    capturedAt: r.captured_at,
    actionsTaken: r.actions_taken || [],
    status: r.status as Signal["status"],
    source: r.source as Signal["source"],
    rawPayload: r.raw_payload as Record<string, unknown> | null,
    linqMessageId: r.linq_message_id,
    emailMetadata: r.email_metadata as Signal["emailMetadata"],
    meetingId: r.meeting_id,
    riskLevel: r.risk_level as Signal["riskLevel"],
    dueDate: r.due_date,
    callPointer: r.call_pointer,
    confidenceScore: (r as Record<string, unknown>).confidence_score as number | null,
  }));
}

export default function ClassificationAudit() {
  const queryClient = useQueryClient();
  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["signals-audit"],
    queryFn: fetchSignals,
  });

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<SignalType | "ALL">("ALL");
  const [sortField, setSortField] = useState<"time" | "type" | "priority">("time");
  const [pendingChanges, setPendingChanges] = useState<Record<string, { type?: SignalType; priority?: SignalPriority }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const rows = useMemo(() => {
    let filtered = signals;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.sender.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q) ||
          s.sourceMessage.toLowerCase().includes(q)
      );
    }

    if (filterType !== "ALL") {
      filtered = filtered.filter((s) => s.signalType === filterType);
    }

    if (sortField === "type") {
      filtered = [...filtered].sort((a, b) => a.signalType.localeCompare(b.signalType));
    } else if (sortField === "priority") {
      const order = { high: 0, medium: 1, low: 2 };
      filtered = [...filtered].sort((a, b) => order[a.priority] - order[b.priority]);
    }

    return filtered;
  }, [signals, search, filterType, sortField]);

  const changeCount = Object.keys(pendingChanges).length;

  const setPending = (id: string, field: "type" | "priority", value: string) => {
    setPendingChanges((prev) => {
      const existing = prev[id] || {};
      const signal = signals.find((s) => s.id === id);
      if (!signal) return prev;

      const newVal = field === "type" ? value as SignalType : value as SignalPriority;
      const originalVal = field === "type" ? signal.signalType : signal.priority;

      // If reverting to original, remove the pending change for that field
      if (newVal === originalVal) {
        const updated = { ...existing };
        delete updated[field];
        if (Object.keys(updated).length === 0) {
          const { [id]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [id]: updated };
      }

      return { ...prev, [id]: { ...existing, [field]: newVal } };
    });
  };

  const revertOne = (id: string) => {
    setPendingChanges((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const saveOne = async (id: string) => {
    const changes = pendingChanges[id];
    if (!changes) return;

    setSaving(id);
    const update: Record<string, string> = {};
    if (changes.type) update.signal_type = changes.type;
    if (changes.priority) update.priority = changes.priority;

    const { error } = await supabase.from("signals").update(update).eq("id", id);
    setSaving(null);

    if (error) {
      toast.error("Failed to update: " + error.message);
      return;
    }

    toast.success("Signal reclassified");
    revertOne(id);
    queryClient.invalidateQueries({ queryKey: ["signals-audit"] });
    queryClient.invalidateQueries({ queryKey: ["signals"] });
  };

  const saveAll = async () => {
    setSaving("all");
    const ids = Object.keys(pendingChanges);
    let success = 0;

    for (const id of ids) {
      const changes = pendingChanges[id];
      const update: Record<string, string> = {};
      if (changes.type) update.signal_type = changes.type;
      if (changes.priority) update.priority = changes.priority;

      const { error } = await supabase.from("signals").update(update).eq("id", id);
      if (!error) success++;
    }

    setSaving(null);
    setPendingChanges({});
    toast.success(`${success} signal${success !== 1 ? "s" : ""} reclassified`);
    queryClient.invalidateQueries({ queryKey: ["signals-audit"] });
    queryClient.invalidateQueries({ queryKey: ["signals"] });
  };

  return (
    <div className="space-y-6">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search signals…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 w-48 text-xs bg-vanta-bg-elevated border-vanta-border"
            />
          </div>

          <Select value={filterType} onValueChange={(v) => setFilterType(v as SignalType | "ALL")}>
            <SelectTrigger className="h-8 w-32 text-xs bg-vanta-bg-elevated border-vanta-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {SIGNAL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => setSortField((p) => (p === "time" ? "type" : p === "type" ? "priority" : "time"))}
          >
            <ArrowUpDown className="h-3 w-3" />
            Sort: {sortField}
          </Button>
        </div>

        {changeCount > 0 && (
          <div className="flex gap-2 items-center">
            <Badge variant="secondary" className="text-xs font-mono">
              {changeCount} pending
            </Badge>
            <Button size="sm" className="h-7 text-xs gap-1" onClick={saveAll} disabled={saving === "all"}>
              {saving === "all" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save All
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground font-mono text-sm">Loading signals…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-mono text-sm">No signals found.</div>
      ) : (
        <div className="border border-vanta-border rounded overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-vanta-border bg-vanta-bg-elevated">
                <th className="text-left font-mono uppercase tracking-wider text-muted-foreground px-3 py-2">Time</th>
                <th className="text-left font-mono uppercase tracking-wider text-muted-foreground px-3 py-2">Sender</th>
                <th className="text-left font-mono uppercase tracking-wider text-muted-foreground px-3 py-2">Source</th>
                <th className="text-left font-mono uppercase tracking-wider text-muted-foreground px-3 py-2 min-w-[200px]">Summary</th>
                <th className="text-left font-mono uppercase tracking-wider text-muted-foreground px-3 py-2">Type</th>
                <th className="text-left font-mono uppercase tracking-wider text-muted-foreground px-3 py-2">Priority</th>
                <th className="text-left font-mono uppercase tracking-wider text-muted-foreground px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((signal) => {
                const pending = pendingChanges[signal.id];
                const currentType = pending?.type || signal.signalType;
                const currentPriority = pending?.priority || signal.priority;
                const hasChange = !!pending;
                const colors = SIGNAL_TYPE_COLORS[currentType];

                return (
                  <tr
                    key={signal.id}
                    className={`border-b border-vanta-border transition-colors ${
                      hasChange ? "bg-vanta-accent-faint/30" : "hover:bg-vanta-bg-elevated/50"
                    }`}
                  >
                    <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                      {formatTime(signal.capturedAt)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-foreground whitespace-nowrap max-w-[120px] truncate">
                      {signal.sender}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className="text-[10px] font-mono uppercase">
                        {signal.source}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground leading-relaxed max-w-[300px]">
                      <span className="line-clamp-2">{signal.summary}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Select
                        value={currentType}
                        onValueChange={(v) => setPending(signal.id, "type", v)}
                      >
                        <SelectTrigger className={`h-7 w-[130px] text-[10px] font-mono uppercase border ${colors.border} ${colors.bg} ${colors.text}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SIGNAL_TYPES.map((t) => (
                            <SelectItem key={t} value={t} className="text-xs font-mono">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2.5">
                      <Select
                        value={currentPriority}
                        onValueChange={(v) => setPending(signal.id, "priority", v)}
                      >
                        <SelectTrigger className="h-7 w-[90px] text-[10px] font-mono uppercase border-vanta-border bg-vanta-bg-elevated">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((p) => (
                            <SelectItem key={p} value={p} className="text-xs font-mono">
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2.5">
                      {hasChange && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => saveOne(signal.id)}
                            disabled={saving === signal.id}
                          >
                            {saving === signal.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3 text-vanta-accent" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => revertOne(signal.id)}
                          >
                            <Undo2 className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats footer */}
      <div className="flex gap-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{signals.length} total signals</span>
        <span>{signals.filter((s) => s.signalType === "NOISE").length} noise</span>
        <span>{signals.filter((s) => s.priority === "high").length} high priority</span>
      </div>
    </div>
  );
}
