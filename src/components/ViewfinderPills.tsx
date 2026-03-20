import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Signal } from "@/data/signals";
import type { FilterState } from "@/components/SignalFilters";
import SignalFeed from "@/components/SignalFeed";
import { Sparkles, Clock, User, AlertTriangle, ChevronDown, Hourglass, CalendarDays, Heart } from "lucide-react";
import { Motion } from "@/components/ui/motion";

type Lens = "recommended" | "quick" | "contact" | "overdue" | "waiting" | "thisweek" | "relationships";

const fetchSignals = async (): Promise<Signal[]> => {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .neq("signal_type", "NOISE")
    .order("captured_at", { ascending: false })
    .limit(100);

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
    confidenceScore: (row as Record<string, unknown>).confidence_score as number | null,
    classificationReasoning: (row as Record<string, unknown>).classification_reasoning as string | null,
  }));
};

const LENSES: { key: Lens; label: string; icon: typeof Sparkles; description: string }[] = [
  { key: "recommended", label: "Recommended", icon: Sparkles, description: "AI-prioritized signals" },
  { key: "quick", label: "Under 5 min", icon: Clock, description: "Quick actions you can knock out now" },
  { key: "waiting", label: "Waiting On", icon: Hourglass, description: "In progress — awaiting response" },
  { key: "thisweek", label: "This Week", icon: CalendarDays, description: "Due this week" },
  { key: "relationships", label: "Relationships", icon: Heart, description: "Introductions & relationship signals" },
  { key: "contact", label: "By Contact", icon: User, description: "Signals grouped by sender" },
  { key: "overdue", label: "Overdue", icon: AlertTriangle, description: "Past due date" },
];

const DEFAULT_FILTERS: FilterState = {
  type: "ALL",
  sender: "ALL",
  priority: "ALL",
  search: "",
  chatMode: "ALL",
};

export default function ViewfinderPills() {
  const [activeLens, setActiveLens] = useState<Lens>("recommended");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["viewfinder-signals"],
    queryFn: fetchSignals,
    refetchInterval: 30000,
  });

  const contacts = useMemo(() => {
    const set = new Set(signals.map((s) => s.sender));
    return Array.from(set).sort();
  }, [signals]);

  const filtered = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
    weekEnd.setHours(23, 59, 59, 999);

    switch (activeLens) {
      case "recommended":
        return signals
          .filter((s) => s.status !== "Complete")
          .sort((a, b) => {
            const prio = { high: 3, medium: 2, low: 1 };
            return (prio[b.priority] || 0) - (prio[a.priority] || 0);
          })
          .slice(0, 10);
      case "quick":
        return signals.filter(
          (s) =>
            s.status !== "Complete" &&
            s.signalType !== "MEETING" &&
            s.priority !== "high" &&
            !s.riskLevel
        );
      case "waiting":
        return signals.filter((s) => s.status === "In Progress");
      case "thisweek":
        return signals.filter(
          (s) => s.dueDate && new Date(s.dueDate) >= now && new Date(s.dueDate) <= weekEnd && s.status !== "Complete"
        );
      case "relationships":
        return signals.filter((s) => s.signalType === "INTRO" || s.signalType === "CONTEXT");
      case "contact":
        if (!selectedContact) return [];
        return signals.filter((s) => s.sender === selectedContact);
      case "overdue":
        return signals.filter(
          (s) => s.dueDate && new Date(s.dueDate) < now && s.status !== "Complete"
        );
      default:
        return signals;
    }
  }, [signals, activeLens, selectedContact]);

  const activeLensConfig = LENSES.find((l) => l.key === activeLens)!;

  return (
    <Motion>
      <div className="mb-10">
        {/* Lens pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {LENSES.map((lens) => {
            const isActive = activeLens === lens.key;
            const Icon = lens.icon;
            // Count for badge
            const lensCount = (() => {
              const now = new Date();
              const weekEnd = new Date(now);
              weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
              weekEnd.setHours(23, 59, 59, 999);
              switch (lens.key) {
                case "waiting": return signals.filter((s) => s.status === "In Progress").length;
                case "thisweek": return signals.filter((s) => s.dueDate && new Date(s.dueDate) >= now && new Date(s.dueDate) <= weekEnd && s.status !== "Complete").length;
                case "relationships": return signals.filter((s) => s.signalType === "INTRO" || s.signalType === "CONTEXT").length;
                case "overdue": return signals.filter((s) => s.dueDate && new Date(s.dueDate) < now && s.status !== "Complete").length;
                default: return null;
              }
            })();
            return (
              <button
                key={lens.key}
                onClick={() => {
                  setActiveLens(lens.key);
                  if (lens.key !== "contact") setSelectedContact(null);
                }}
                className={`
                  inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.12em] transition-all
                  ${
                    isActive
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-card text-muted-foreground border border-border hover:border-foreground/30 hover:text-foreground"
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {lens.label}
                {lensCount !== null && lensCount > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-sm text-[8px] font-bold ${
                    isActive ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                  }`}>
                    {lensCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Contact selector for "By Contact" lens */}
        {activeLens === "contact" && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            {contacts.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedContact(c)}
                className={`
                  px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.1em] transition-all
                  ${
                    selectedContact === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground border border-border hover:border-primary/40"
                  }
                `}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Lens count line */}
        <div className="flex items-center gap-2 mb-5">
          <span className="w-1 h-1 bg-foreground rounded-full" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            {activeLensConfig.description} · {filtered.length} signal{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Signal feed */}
        {isLoading ? (
          <div className="border border-border bg-card p-10 text-center">
            <div className="w-2 h-2 bg-primary rounded-full mx-auto mb-3 animate-pulse" />
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Loading viewfinder…
            </p>
          </div>
        ) : activeLens === "contact" && !selectedContact ? (
          <div className="border border-border bg-card p-10 text-center">
            <User className="w-5 h-5 text-muted-foreground mx-auto mb-3" />
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Select a contact above to view their signals
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-border bg-card p-10 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              No signals match this lens
            </p>
          </div>
        ) : (
          <SignalFeed signals={filtered} filters={DEFAULT_FILTERS} allSignals={signals} />
        )}
      </div>
    </Motion>
  );
}

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["viewfinder-signals"],
    queryFn: fetchSignals,
    refetchInterval: 30000,
  });

  const contacts = useMemo(() => {
    const set = new Set(signals.map((s) => s.sender));
    return Array.from(set).sort();
  }, [signals]);

  const filtered = useMemo(() => {
    const now = new Date();
    switch (activeLens) {
      case "recommended":
        return signals
          .filter((s) => s.status !== "Complete")
          .sort((a, b) => {
            const prio = { high: 3, medium: 2, low: 1 };
            return (prio[b.priority] || 0) - (prio[a.priority] || 0);
          })
          .slice(0, 10);
      case "quick":
        return signals.filter(
          (s) =>
            s.status !== "Complete" &&
            s.signalType !== "MEETING" &&
            s.priority !== "high" &&
            !s.riskLevel
        );
      case "contact":
        if (!selectedContact) return [];
        return signals.filter((s) => s.sender === selectedContact);
      case "overdue":
        return signals.filter(
          (s) => s.dueDate && new Date(s.dueDate) < now && s.status !== "Complete"
        );
      default:
        return signals;
    }
  }, [signals, activeLens, selectedContact]);

  const activeLensConfig = LENSES.find((l) => l.key === activeLens)!;

  return (
    <Motion>
      <div className="mb-10">
        {/* Lens pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {LENSES.map((lens) => {
            const isActive = activeLens === lens.key;
            const Icon = lens.icon;
            return (
              <button
                key={lens.key}
                onClick={() => {
                  setActiveLens(lens.key);
                  if (lens.key !== "contact") setSelectedContact(null);
                }}
                className={`
                  inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.12em] transition-all
                  ${
                    isActive
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-card text-muted-foreground border border-border hover:border-foreground/30 hover:text-foreground"
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {lens.label}
              </button>
            );
          })}
        </div>

        {/* Contact selector for "By Contact" lens */}
        {activeLens === "contact" && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            {contacts.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedContact(c)}
                className={`
                  px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.1em] transition-all
                  ${
                    selectedContact === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground border border-border hover:border-primary/40"
                  }
                `}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Lens count line */}
        <div className="flex items-center gap-2 mb-5">
          <span className="w-1 h-1 bg-foreground rounded-full" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            {activeLensConfig.description} · {filtered.length} signal{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Signal feed */}
        {isLoading ? (
          <div className="border border-border bg-card p-10 text-center">
            <div className="w-2 h-2 bg-primary rounded-full mx-auto mb-3 animate-pulse" />
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Loading viewfinder…
            </p>
          </div>
        ) : activeLens === "contact" && !selectedContact ? (
          <div className="border border-border bg-card p-10 text-center">
            <User className="w-5 h-5 text-muted-foreground mx-auto mb-3" />
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Select a contact above to view their signals
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-border bg-card p-10 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              No signals match this lens
            </p>
          </div>
        ) : (
          <SignalFeed signals={filtered} filters={DEFAULT_FILTERS} allSignals={signals} />
        )}
      </div>
    </Motion>
  );
}
