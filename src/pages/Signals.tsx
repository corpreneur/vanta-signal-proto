import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import SignalFeed from "@/components/SignalFeed";
import SignalFilters from "@/components/SignalFilters";
import TagBrowser from "@/components/TagBrowser";
import PreMeetingBriefCard from "@/components/PreMeetingBriefCard";
import MorningContext from "@/components/MorningContext";
import type { FilterState } from "@/components/SignalFilters";
import type { SignalType } from "@/data/signals";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import { ShieldOff, BarChart3, ArrowUpDown, AlertTriangle, Users, Briefcase, BellOff, Clock, DollarSign, Flame, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useUserMode } from "@/hooks/use-user-mode";

const fetchSignals = async (): Promise<Signal[]> => {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .order("captured_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error fetching signals:", error);
    return [];
  }

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
  }));
};

const SIGNAL_TYPES_ORDER: SignalType[] = ["INTRO", "INSIGHT", "INVESTMENT", "DECISION", "CONTEXT", "MEETING", "PHONE_CALL"];

type Tab = "feed" | "filtered";
type SortMode = "captured" | "due_date";
type PriorityLens = "all" | "time" | "money" | "urgency";

const LENS_CONFIG: Record<PriorityLens, { label: string; icon: typeof BarChart3; description: string; types: SignalType[] }> = {
  all: { label: "All Signals", icon: BarChart3, description: "Full curated feed", types: [] },
  time: { label: "Time", icon: ArrowUpDown, description: "Meetings, follow-ups, deadlines", types: ["MEETING", "PHONE_CALL", "DECISION"] },
  money: { label: "Money", icon: BarChart3, description: "Investments, deals, opportunities", types: ["INVESTMENT", "INTRO", "INSIGHT"] },
  urgency: { label: "Urgency", icon: AlertTriangle, description: "High-priority, overdue, at-risk", types: [] },
};

const Signals = () => {
  const { mode, isExecutive, isDnd } = useUserMode();
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [sortMode, setSortMode] = useState<SortMode>("captured");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [priorityLens, setPriorityLens] = useState<PriorityLens>("all");
  const [showQuickTasks, setShowQuickTasks] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: "ALL",
    sender: "ALL",
    priority: "ALL",
    search: "",
    chatMode: "ALL",
  });
  const queryClient = useQueryClient();

  const { data: signals = [] } = useQuery({
    queryKey: ["signals"],
    queryFn: fetchSignals,
    refetchInterval: 60_000,
  });

  const { data: groupAutoReply = false } = useQuery({
    queryKey: ["group-autoreply-setting"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "group_autoreply_enabled")
        .single();
      return data?.value === true;
    },
  });

  const toggleGroupAutoReply = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from("system_settings")
        .update({ value: enabled as any, updated_at: new Date().toISOString() })
        .eq("key", "group_autoreply_enabled");
      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["group-autoreply-setting"] });
      toast(enabled ? "Group auto-replies enabled" : "Group auto-replies disabled");
    },
  });

  const { data: briefs = [] } = useQuery({
    queryKey: ["pre-meeting-briefs"],
    queryFn: async () => {
      const { data: briefRows } = await supabase
        .from("pre_meeting_briefs")
        .select("*, upcoming_meetings(title, starts_at)")
        .eq("dismissed", false)
        .order("created_at", { ascending: false })
        .limit(10);

      return (briefRows || []).map((row: Record<string, unknown>) => {
        const meeting = row.upcoming_meetings as Record<string, unknown> | null;
        return {
          id: row.id as string,
          meeting_id: row.meeting_id as string,
          brief_text: row.brief_text as string,
          matched_signals: row.matched_signals as unknown[],
          attendee_context: row.attendee_context as Record<string, unknown>,
          created_at: row.created_at as string,
          dismissed: row.dismissed as boolean,
          meeting_title: meeting?.title as string | undefined,
          meeting_starts_at: meeting?.starts_at as string | undefined,
        };
      });
    },
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("signals-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "signals" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["signals"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pre_meeting_briefs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pre-meeting-briefs"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Split signals into feed (non-noise) and filtered (noise)
  const feedSignals = useMemo(() => {
    let items = signals.filter((s) => s.signalType !== "NOISE");

    // Executive mode: only HIGH priority
    if (isExecutive) {
      items = items.filter((s) => s.priority === "high");
    }

    // Priority Lens filtering
    if (priorityLens === "time") {
      items = items.filter((s) => LENS_CONFIG.time.types.includes(s.signalType) || s.dueDate);
    } else if (priorityLens === "money") {
      items = items.filter((s) => LENS_CONFIG.money.types.includes(s.signalType));
    } else if (priorityLens === "urgency") {
      const today = new Date().toISOString().split("T")[0];
      items = items.filter((s) => s.priority === "high" || (s.dueDate && s.dueDate <= today) || s.riskLevel === "high" || s.riskLevel === "critical");
    }

    // Quick Tasks filter: short, actionable items
    if (showQuickTasks) {
      items = items.filter((s) =>
        (s.priority === "low" || s.priority === "medium") &&
        (s.signalType === "CONTEXT" || s.signalType === "INTRO") &&
        s.summary.length < 120
      );
    }

    // Overdue filter
    if (showOverdueOnly) {
      const today = new Date().toISOString().split("T")[0];
      items = items.filter((s) => s.dueDate && s.dueDate < today && s.status !== "Complete");
    }

    // Sort
    if (sortMode === "due_date") {
      return items.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    }
    return items.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
  }, [signals, sortMode, showOverdueOnly, isExecutive, priorityLens, showQuickTasks]);

  const noiseSignals = useMemo(
    () => [...signals].filter((s) => s.signalType === "NOISE").sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()),
    [signals]
  );

  const activeSignals = activeTab === "feed" ? feedSignals : noiseSignals;

  const overdueCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return signals.filter((s) => s.signalType !== "NOISE" && s.dueDate && s.dueDate < today && s.status !== "Complete").length;
  }, [signals]);

  const senders = useMemo(
    () => [...new Set(activeSignals.map((s) => s.sender))].sort(),
    [activeSignals]
  );

  const tagCounts = useMemo(
    () =>
      SIGNAL_TYPES_ORDER.map((type) => ({
        type,
        count: feedSignals.filter((s) => s.signalType === type).length,
      })),
    [feedSignals]
  );

  const handleTagSelect = (type: SignalType | "ALL") => {
    setFilters((prev) => ({ ...prev, type }));
  };

  const highCount = feedSignals.filter((s) => s.priority === "high").length;
  const actionCount = feedSignals.reduce((acc, s) => acc + s.actionsTaken.length, 0);

  return (
    <div className="max-w-[960px] mx-auto px-5 py-10 md:px-10">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-2 h-2 bg-vanta-accent"
            style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
          />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-accent">
            Signal Log · Live
          </p>
          {(isExecutive || isDnd) && (
            <span className="flex items-center gap-1 ml-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider border border-foreground text-foreground bg-vanta-bg-elevated">
              {isExecutive ? <Briefcase className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
              {isExecutive ? "Executive" : "DND"}
            </span>
          )}
        </div>
        <h1 className="font-display text-[28px] md:text-[36px] leading-[1.15] text-vanta-text mb-3">
          Captured Signals
        </h1>
        <p className="font-sans text-[13px] md:text-[14px] leading-[1.6] text-vanta-text-mid max-w-[640px]">
          {isExecutive
            ? "Showing high-priority signals only. Switch to Creative mode for the full stream."
            : "A curated feed of intellectual capital captured from real conversations. Every message is evaluated through a two-stage AI pipeline… what matters is extracted before it disappears into the scroll."}
        </p>
      </header>

      {/* Stats strip */}
      <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-vanta-border">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Signals Captured</p>
          <p className="font-display text-[24px] text-vanta-text">{feedSignals.length}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">High Strength</p>
          <p className="font-display text-[24px] text-vanta-accent">{highCount}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Actions Fired</p>
          <p className="font-display text-[24px] text-vanta-text">{actionCount}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Filtered</p>
          <p className="font-display text-[24px] text-muted-foreground">{noiseSignals.length}</p>
        </div>
        {overdueCount > 0 && (
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">Overdue</p>
            <p className="font-display text-[24px] text-destructive">{overdueCount}</p>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-vanta-text-low" />
          <label
            htmlFor="group-autoreply"
            className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low cursor-pointer select-none"
          >
            Group Auto-Reply
          </label>
          <Switch
            id="group-autoreply"
            checked={groupAutoReply}
            onCheckedChange={(checked) => toggleGroupAutoReply.mutate(checked)}
            disabled={toggleGroupAutoReply.isPending}
            className="data-[state=checked]:bg-vanta-accent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 mb-6 border-b border-vanta-border">
        <button
          onClick={() => setActiveTab("feed")}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] border-b-2 transition-colors ${
            activeTab === "feed"
              ? "border-vanta-accent text-vanta-accent"
              : "border-transparent text-vanta-text-low hover:text-foreground"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Signal Feed
          <span className="ml-1 font-mono text-[9px] text-muted-foreground">
            {feedSignals.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("filtered")}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] border-b-2 transition-colors ${
            activeTab === "filtered"
              ? "border-vanta-accent text-vanta-accent"
              : "border-transparent text-vanta-text-low hover:text-foreground"
          }`}
        >
          <ShieldOff className="w-3.5 h-3.5" />
          Filtered Items
          {noiseSignals.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 font-mono text-[9px] bg-muted text-muted-foreground rounded-sm">
              {noiseSignals.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "feed" && (
        <>
          {/* Priority Lens */}
          <div className="flex items-center gap-2 mb-5">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mr-1">Lens</span>
            {(["all", "time", "money", "urgency"] as PriorityLens[]).map((lens) => {
              const active = priorityLens === lens;
              const Icon = lens === "time" ? Clock : lens === "money" ? DollarSign : lens === "urgency" ? Flame : BarChart3;
              return (
                <button
                  key={lens}
                  onClick={() => setPriorityLens(lens)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] border transition-colors ${
                    active
                      ? "border-vanta-accent text-vanta-accent bg-vanta-accent-faint"
                      : "border-vanta-border text-vanta-text-low hover:border-vanta-accent-border hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {lens === "all" ? "All" : lens.charAt(0).toUpperCase() + lens.slice(1)}
                </button>
              );
            })}
          </div>

          <MorningContext signals={feedSignals} />
          <TagBrowser tagCounts={tagCounts} activeType={filters.type} onSelect={handleTagSelect} />
          <SignalFilters filters={filters} onChange={setFilters} senders={senders} />

          {/* Sort & due date controls */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <button
              onClick={() => setSortMode(sortMode === "captured" ? "due_date" : "captured")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] border transition-colors ${
                sortMode === "due_date"
                  ? "border-vanta-accent text-vanta-accent bg-vanta-accent-faint"
                  : "border-vanta-border text-vanta-text-low hover:border-vanta-accent-border hover:text-vanta-accent"
              }`}
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortMode === "due_date" ? "Sort: Due Date" : "Sort: Recent"}
            </button>

            {overdueCount > 0 && (
              <button
                onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] border transition-colors ${
                  showOverdueOnly
                    ? "border-destructive text-destructive bg-destructive/10"
                    : "border-vanta-border text-vanta-text-low hover:border-destructive hover:text-destructive"
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                Overdue Only ({overdueCount})
              </button>
            )}
          </div>

          {briefs.length > 0 && (
            <div className="mb-6">
              {briefs.map((brief: any) => (
                <PreMeetingBriefCard key={brief.id} brief={brief} />
              ))}
            </div>
          )}

          <SignalFeed signals={feedSignals} filters={filters} />
        </>
      )}

      {activeTab === "filtered" && (
        <>
          {noiseSignals.length === 0 ? (
            <div className="border border-vanta-border bg-vanta-bg-elevated p-10 text-center">
              <ShieldOff className="w-5 h-5 text-muted-foreground mx-auto mb-3" />
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-vanta-text-low">
                No filtered items. All signals passed classification.
              </p>
            </div>
          ) : (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-4">
                These signals were classified as noise. Review and promote any that contain real value.
              </p>
              <SignalFeed signals={noiseSignals} filters={{ type: "ALL", sender: "ALL", priority: "ALL", search: "", chatMode: "ALL" }} showPromote />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Signals;
