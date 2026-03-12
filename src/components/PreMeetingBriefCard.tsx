import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Users, Zap, X, ChevronDown } from "lucide-react";

interface MatchedSignal {
  id: string;
  signal_type: string;
  sender: string;
  summary: string;
  priority: string;
  captured_at: string;
  matched_attendee: string;
}

interface Brief {
  id: string;
  created_at: string;
  meeting_id: string;
  brief_text: string;
  matched_signals: MatchedSignal[];
  attendee_context: Record<string, { signal_count: number; last_signal: string | null; signal_types: string[] }>;
  delivered_dashboard: boolean;
  delivered_linq: boolean;
  dismissed: boolean;
  meeting?: {
    id: string;
    title: string;
    starts_at: string;
    attendees: Array<{ name?: string; email?: string }>;
  };
}

function formatTimeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const mins = Math.floor(diff / 60000);
  if (mins <= 0) return "Starting now";
  if (mins === 1) return "In 1 minute";
  if (mins < 60) return `In ${mins} minutes`;
  const hours = Math.floor(mins / 60);
  return `In ${hours}h ${mins % 60}m`;
}

const PreMeetingBriefCard = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: briefs = [] } = useQuery<Brief[]>({
    queryKey: ["pre-meeting-briefs"],
    queryFn: async () => {
      // Fetch non-dismissed briefs from the last 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("pre_meeting_briefs")
        .select("*")
        .eq("dismissed", false)
        .gte("created_at", twoHoursAgo)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error || !data) return [];

      // Fetch meeting details for each brief
      const meetingIds = data.map((b) => b.meeting_id);
      const { data: meetings } = await supabase
        .from("upcoming_meetings")
        .select("*")
        .in("id", meetingIds);

      return data.map((b) => ({
        id: b.id,
        created_at: b.created_at,
        meeting_id: b.meeting_id,
        brief_text: b.brief_text,
        matched_signals: (b.matched_signals || []) as unknown as MatchedSignal[],
        attendee_context: (b.attendee_context || {}) as unknown as Record<string, { signal_count: number; last_signal: string | null; signal_types: string[] }>,
        delivered_dashboard: b.delivered_dashboard,
        delivered_linq: b.delivered_linq,
        dismissed: b.dismissed,
        meeting: meetings?.find((m) => m.id === b.meeting_id) as unknown as Brief["meeting"],
      })) as Brief[];
    },
    refetchInterval: 30_000,
  });

  // Realtime subscription for new briefs
  useEffect(() => {
    const channel = supabase
      .channel("briefs-realtime")
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

  const handleDismiss = async (briefId: string) => {
    await supabase
      .from("pre_meeting_briefs")
      .update({ dismissed: true })
      .eq("id", briefId);
    queryClient.invalidateQueries({ queryKey: ["pre-meeting-briefs"] });
  };

  if (briefs.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {briefs.map((brief) => {
        const isExpanded = expandedId === brief.id;
        const meeting = brief.meeting;
        const attendees = (meeting?.attendees || []) as Array<{ name?: string; email?: string }>;

        return (
          <div
            key={brief.id}
            className="border border-vanta-accent-zoom-border bg-vanta-accent-zoom-faint animate-fade-up"
          >
            {/* Header */}
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 bg-vanta-accent-zoom"
                    style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                  />
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-accent-zoom">
                    Pre-Meeting Brief
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {meeting?.starts_at && (
                    <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-vanta-accent-zoom">
                      <Clock className="w-3 h-3" />
                      {formatTimeUntil(meeting.starts_at)}
                    </span>
                  )}
                  <button
                    onClick={() => handleDismiss(brief.id)}
                    className="p-1 text-vanta-text-muted hover:text-vanta-text-low transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-display text-[16px] leading-[1.3] text-vanta-text mb-2">
                {meeting?.title || "Upcoming Meeting"}
              </h3>

              {/* Attendees */}
              {attendees.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-3 h-3 text-vanta-text-muted" />
                  <div className="flex flex-wrap gap-1">
                    {attendees.map((a, i) => {
                      const name = a.name || a.email || `Participant ${i + 1}`;
                      const ctx = brief.attendee_context[name];
                      return (
                        <span
                          key={i}
                          className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 border ${
                            ctx && ctx.signal_count > 0
                              ? "text-vanta-accent-zoom border-vanta-accent-zoom-border"
                              : "text-vanta-text-muted border-vanta-border"
                          }`}
                          title={
                            ctx && ctx.signal_count > 0
                              ? `${ctx.signal_count} prior signals`
                              : "No prior signals"
                          }
                        >
                          {name}
                          {ctx && ctx.signal_count > 0 && (
                            <span className="ml-1 text-vanta-accent-zoom">
                              ({ctx.signal_count})
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Brief text */}
              <p className="font-sans text-[13px] leading-[1.7] text-vanta-text-mid">
                {brief.brief_text}
              </p>

              {/* Expand for matched signals */}
              {brief.matched_signals.length > 0 && (
                <button
                  onClick={() => setExpandedId(isExpanded ? null : brief.id)}
                  className="flex items-center gap-1 mt-3 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-accent-zoom hover:text-vanta-text transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  {brief.matched_signals.length} Prior Signal{brief.matched_signals.length !== 1 ? "s" : ""} Matched
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>

            {/* Expanded: matched signals */}
            {isExpanded && brief.matched_signals.length > 0 && (
              <div className="border-t border-vanta-accent-zoom-border px-5 py-4 space-y-3 animate-fade-up">
                <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
                  Matched Signal History
                </h4>
                {brief.matched_signals.map((sig) => (
                  <div
                    key={sig.id}
                    className="border-l-2 border-vanta-accent-zoom-border pl-3 py-1"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-accent-zoom">
                        {sig.signal_type}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-vanta-text-muted">
                        {sig.priority}
                      </span>
                      <span className="font-mono text-[9px] text-vanta-text-muted ml-auto">
                        {new Date(sig.captured_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-vanta-text-low mb-0.5">
                      {sig.sender}
                    </p>
                    <p className="font-sans text-[12px] leading-[1.5] text-vanta-text-mid">
                      {sig.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Delivery status */}
            <div className="border-t border-vanta-accent-zoom-border px-5 py-2 flex items-center gap-3">
              <span
                className={`font-mono text-[8px] uppercase tracking-[0.15em] ${
                  brief.delivered_dashboard ? "text-vanta-accent" : "text-vanta-text-muted"
                }`}
              >
                ● Dashboard
              </span>
              <span
                className={`font-mono text-[8px] uppercase tracking-[0.15em] ${
                  brief.delivered_linq ? "text-vanta-accent" : "text-vanta-text-muted"
                }`}
              >
                ● iMessage
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PreMeetingBriefCard;
