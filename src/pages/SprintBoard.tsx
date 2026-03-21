import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SprintCompass from "@/components/sprint/SprintCompass";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Flame,
  Clock,
  Archive,
  Circle,
  ArrowUpRight,
  CheckCircle2,
  Pause,
  Trash2,
  RefreshCw,
  Plus,
} from "lucide-react";

type SprintItem = {
  id: string;
  title: string;
  description: string;
  priority: string;
  effort: string;
  sprint_phase: number;
  status: string;
  subject: string;
  ai_reasoning: string | null;
  feedback_entry_id: string | null;
  created_at: string;
  updated_at: string;
};

const PHASES = [
  { phase: 1, label: "Now", icon: Flame, accent: "text-destructive" },
  { phase: 2, label: "Next", icon: Clock, accent: "text-amber-500" },
  { phase: 3, label: "Backlog", icon: Archive, accent: "text-muted-foreground" },
];

const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog", icon: Circle },
  { value: "in-progress", label: "In Progress", icon: ArrowUpRight },
  { value: "done", label: "Done", icon: CheckCircle2 },
  { value: "parked", label: "Parked", icon: Pause },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/15 text-destructive border-destructive/30",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

const EFFORT_LABELS: Record<string, string> = {
  small: "S",
  medium: "M",
  large: "L",
};
function AddItemInline() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const ref = useRef<HTMLInputElement>(null);

  const addItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sprint_items").insert({
        title,
        priority,
        status: "backlog",
        sprint_phase: 1,
        effort: "medium",
        subject: "General",
        description: "",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprint-items"] });
      toast.success("Item added");
      setTitle("");
      setOpen(false);
    },
    onError: () => toast.error("Failed to add item"),
  });

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="font-mono text-[10px] uppercase tracking-wider gap-1.5 h-8" onClick={() => { setOpen(true); setTimeout(() => ref.current?.focus(), 50); }}>
        <Plus className="h-3 w-3" /> Add Item
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input ref={ref} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New sprint item…" className="h-8 font-mono text-[11px] w-[220px]" onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) addItem.mutate(); if (e.key === "Escape") setOpen(false); }} />
      <Select value={priority} onValueChange={setPriority}>
        <SelectTrigger className="w-[90px] h-8 font-mono text-[10px] uppercase tracking-wider">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" className="h-8 font-mono text-[10px] uppercase" disabled={!title.trim()} onClick={() => addItem.mutate()}>Add</Button>
      <Button variant="ghost" size="sm" className="h-8 font-mono text-[10px]" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}
export default function SprintBoard() {
  const queryClient = useQueryClient();
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["sprint-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sprint_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SprintItem[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("sprint_items")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprint-items"] });
      toast.success("Status updated");
    },
  });

  const updatePhase = useMutation({
    mutationFn: async ({ id, sprint_phase }: { id: string; sprint_phase: number }) => {
      const { error } = await supabase
        .from("sprint_items")
        .update({ sprint_phase, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprint-items"] });
      toast.success("Phase updated");
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sprint_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprint-items"] });
      toast.success("Item removed");
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = items.filter((item) => {
    if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    return true;
  });

  const grouped = PHASES.map((p) => ({
    ...p,
    items: filtered
      .filter((i) => i.sprint_phase === p.phase)
      .sort((a, b) => {
        const pOrder = { high: 0, medium: 1, low: 2 };
        return (pOrder[a.priority as keyof typeof pOrder] ?? 1) - (pOrder[b.priority as keyof typeof pOrder] ?? 1);
      }),
  }));

  const totalCount = items.length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight uppercase text-foreground">
            Sprint Board
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1 tracking-wide">
            {totalCount} items · {doneCount} done · AI-triaged from feedback
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="font-mono text-[10px] uppercase tracking-wider gap-1.5"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["sprint-items"] })}
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      {/* Sprint compass */}
      <SprintCompass items={items} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] font-mono text-[11px] uppercase tracking-wider h-8">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] font-mono text-[11px] uppercase tracking-wider h-8">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Add new item */}
        <AddItemInline />
      </div>

      {/* Phase columns */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-2 h-2 bg-foreground animate-pulse" />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <Collapsible key={group.phase} defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 w-full group mb-3">
                <group.icon className={`h-4 w-4 ${group.accent}`} />
                <span className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                  {group.label}
                </span>
                <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                  {group.items.length}
                </Badge>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto transition-transform group-data-[state=closed]:-rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {group.items.length === 0 ? (
                  <p className="font-mono text-[11px] text-muted-foreground pl-6 py-4">
                    No items in this phase
                  </p>
                ) : (
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const expanded = expandedCards.has(item.id);
                      const StatusIcon =
                        STATUS_OPTIONS.find((s) => s.value === item.status)?.icon ?? Circle;
                      return (
                        <Card
                          key={item.id}
                          className="p-3 border border-border bg-card hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {/* Status icon */}
                            <button
                              onClick={() => {
                                const order = STATUS_OPTIONS.map((s) => s.value);
                                const idx = order.indexOf(item.status);
                                const next = order[(idx + 1) % order.length];
                                updateStatus.mutate({ id: item.id, status: next });
                              }}
                              className="mt-0.5 shrink-0"
                              title={`Status: ${item.status}`}
                            >
                              <StatusIcon className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className="font-mono text-[12px] font-medium text-foreground cursor-pointer hover:underline truncate"
                                  onClick={() => toggleExpand(item.id)}
                                >
                                  {item.title}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`font-mono text-[9px] px-1.5 py-0 ${PRIORITY_COLORS[item.priority] || ""}`}
                                >
                                  {item.priority}
                                </Badge>
                                <span className="font-mono text-[9px] text-muted-foreground border border-border rounded px-1">
                                  {EFFORT_LABELS[item.effort] || item.effort}
                                </span>
                                <span className="font-mono text-[9px] text-muted-foreground">
                                  {item.subject}
                                </span>
                              </div>

                              {expanded && (
                                <div className="mt-2 space-y-2">
                                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                                    {item.description}
                                  </p>
                                  {item.ai_reasoning && (
                                    <p className="font-mono text-[10px] text-muted-foreground/70 italic border-l-2 border-border pl-2">
                                      AI: {item.ai_reasoning}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 pt-1">
                                    <Select
                                      value={String(item.sprint_phase)}
                                      onValueChange={(v) =>
                                        updatePhase.mutate({
                                          id: item.id,
                                          sprint_phase: Number(v),
                                        })
                                      }
                                    >
                                      <SelectTrigger className="w-[100px] h-6 font-mono text-[10px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1">Now</SelectItem>
                                        <SelectItem value="2">Next</SelectItem>
                                        <SelectItem value="3">Backlog</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Select
                                      value={item.status}
                                      onValueChange={(v) =>
                                        updateStatus.mutate({ id: item.id, status: v })
                                      }
                                    >
                                      <SelectTrigger className="w-[120px] h-6 font-mono text-[10px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {STATUS_OPTIONS.map((s) => (
                                          <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => deleteItem.mutate(item.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Expand chevron */}
                            <button
                              onClick={() => toggleExpand(item.id)}
                              className="shrink-0 mt-0.5"
                            >
                              {expanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
