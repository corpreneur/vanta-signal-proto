import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Motion } from "@/components/ui/motion";
import type { Signal } from "@/data/signals";
import HourBlock from "./HourBlock";

interface Meeting {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  zoom_meeting_id?: string | null;
}

interface TimelineViewProps {
  signals: Signal[];
  onSignalClick: (s: Signal) => void;
  /** Restrict to working hours (7-21) */
  compact?: boolean;
}

export default function TimelineView({ signals, onSignalClick, compact = true }: TimelineViewProps) {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const currentHourRef = useRef<HTMLDivElement>(null);

  const { data: meetings = [] } = useQuery({
    queryKey: ["timeline-meetings"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const { data } = await supabase
        .from("upcoming_meetings")
        .select("id, title, starts_at, ends_at, zoom_meeting_id")
        .gte("starts_at", today.toISOString())
        .lt("starts_at", tomorrow.toISOString())
        .order("starts_at", { ascending: true });
      return (data || []) as Meeting[];
    },
    refetchInterval: 120_000,
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(id);
    const { error } = await supabase.from("signals").delete().eq("id", id);
    setDeleting(null);
    if (error) {
      toast.error("Failed to delete");
    } else {
      queryClient.invalidateQueries({ queryKey: ["signals-dashboard"] });
      toast.success("Signal deleted");
    }
  };

  const now = new Date();
  const currentHour = now.getHours();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todaySignals = useMemo(
    () =>
      signals
        .filter((s) => new Date(s.capturedAt) >= today && s.signalType !== "NOISE")
        .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()),
    [signals, today]
  );

  // Group signals by hour
  const signalsByHour = useMemo(() => {
    const map: Record<number, Signal[]> = {};
    todaySignals.forEach((s) => {
      const h = new Date(s.capturedAt).getHours();
      if (!map[h]) map[h] = [];
      map[h].push(s);
    });
    return map;
  }, [todaySignals]);

  // Group meetings by hour
  const meetingsByHour = useMemo(() => {
    const map: Record<number, Meeting[]> = {};
    meetings.forEach((m) => {
      const h = new Date(m.starts_at).getHours();
      if (!map[h]) map[h] = [];
      map[h].push(m);
    });
    return map;
  }, [meetings]);

  // Determine hour range
  const startHour = compact ? 7 : 0;
  const endHour = compact ? 21 : 24;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => i + startHour);

  // Auto-scroll to current hour
  useEffect(() => {
    if (currentHourRef.current) {
      currentHourRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const totalSignals = todaySignals.length;
  const totalMeetings = meetings.length;

  return (
    <section className="mb-6">
      <Motion>
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between mb-4 group"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Today's Timeline
            </p>
            <span className="font-mono text-[9px] text-muted-foreground/60">
              {totalSignals} signals · {totalMeetings} meetings
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/signals"
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-[9px] uppercase tracking-wider text-primary hover:text-foreground transition-colors flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </div>
        </button>
      </Motion>

      {expanded && (
        <>
          <div className="border border-border bg-card overflow-y-auto max-h-[520px] scrollbar-hide">
            {hours.map((hour) => (
              <div key={hour} ref={hour === currentHour ? currentHourRef : undefined}>
                <HourBlock
                  hour={hour}
                  signals={signalsByHour[hour] || []}
                  meetings={meetingsByHour[hour] || []}
                  isCurrentHour={hour === currentHour}
                  onSignalClick={onSignalClick}
                  onDelete={handleDelete}
                  deletingId={deleting}
                />
              </div>
            ))}
          </div>

          <p className="font-mono text-[8px] text-muted-foreground/50 mt-1.5 text-center">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} ·{" "}
            {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
        </>
      )}
    </section>
  );
}
