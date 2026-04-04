import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, AlertTriangle, ChevronRight } from "lucide-react";
import ZoomLaunchButton from "@/components/ZoomLaunchButton";
import { Link } from "react-router-dom";
import { Motion } from "@/components/ui/motion";

interface Meeting {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  attendees: unknown[];
}

interface CoolingAlert {
  contact_name: string;
  current_strength: number;
}

interface Brief {
  id: string;
  meeting_id: string;
  brief_text: string;
  dismissed: boolean;
}

const fetchUpcoming = async (): Promise<Meeting[]> => {
  const now = new Date();
  const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("upcoming_meetings")
    .select("id, title, starts_at, ends_at, attendees")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", cutoff.toISOString())
    .order("starts_at", { ascending: true })
    .limit(6);
  if (error) return [];
  return (data || []) as Meeting[];
};

const fetchCoolingContacts = async (): Promise<CoolingAlert[]> => {
  const { data, error } = await supabase
    .from("relationship_alerts")
    .select("contact_name, current_strength")
    .eq("dismissed", false)
    .eq("alert_type", "cooling");
  if (error) return [];
  return (data || []) as CoolingAlert[];
};

const fetchBriefs = async (): Promise<Brief[]> => {
  const { data, error } = await supabase
    .from("pre_meeting_briefs")
    .select("id, meeting_id, brief_text, dismissed")
    .eq("dismissed", false);
  if (error) return [];
  return (data || []) as Brief[];
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function relativeTime(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const mins = Math.round(diff / 60000);
  if (mins <= 0) return "Now";
  if (mins < 60) return `In ${mins}m`;
  return `In ${Math.round(mins / 60)}h`;
}

const WhatsAhead = () => {
  const { data: meetings = [] } = useQuery({
    queryKey: ["whats-ahead-meetings"],
    queryFn: fetchUpcoming,
    refetchInterval: 120_000,
  });

  const { data: coolingContacts = [] } = useQuery({
    queryKey: ["whats-ahead-cooling"],
    queryFn: fetchCoolingContacts,
    refetchInterval: 300_000,
  });

  const { data: briefs = [] } = useQuery({
    queryKey: ["whats-ahead-briefs"],
    queryFn: fetchBriefs,
    refetchInterval: 120_000,
  });

  const coolingNames = useMemo(
    () => new Set(coolingContacts.map((c) => c.contact_name.toLowerCase())),
    [coolingContacts]
  );

  const briefMap = useMemo(() => {
    const map = new Map<string, Brief>();
    for (const b of briefs) {
      map.set(b.meeting_id, b);
    }
    return map;
  }, [briefs]);

  if (meetings.length === 0) return null;

  return (
    <Motion delay={100}>
      <section className="mb-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-3">
          Coming Up
        </p>
        <div className="border border-vanta-border divide-y divide-vanta-border">
          {meetings.map((m) => {
            const attendeeNames = (m.attendees as Array<{ name?: string; email?: string }>) || [];
            const hasCooling = attendeeNames.some(
              (a) =>
                coolingNames.has((a.name || "").toLowerCase()) ||
                coolingNames.has((a.email || "").toLowerCase())
            );
            const brief = briefMap.get(m.id);

            return (
              <div
                key={m.id}
                className="px-4 py-3 bg-card hover:bg-vanta-bg-elevated transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-3.5 h-3.5 text-vanta-accent-amber shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-[13px] text-foreground truncate">{m.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-mono text-[9px] text-vanta-text-low">
                        {formatDay(m.starts_at)} · {formatTime(m.starts_at)}
                        {m.ends_at && ` – ${formatTime(m.ends_at)}`}
                      </span>
                      <span className="font-mono text-[9px] text-vanta-accent-zoom">
                        {relativeTime(m.starts_at)}
                      </span>
                    </div>
                  </div>
                  <ZoomLaunchButton
                    meetingId={m.id}
                    zoomMeetingId={(m as unknown as { zoom_meeting_id?: string }).zoom_meeting_id}
                    variant="icon"
                    className="shrink-0"
                  />
                  {hasCooling && (
                    <span className="flex items-center gap-1 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-destructive border border-destructive/20 bg-destructive/5 shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      Cooling
                    </span>
                  )}
                </div>

                {/* Attendees + Brief link row */}
                {(attendeeNames.length > 0 || brief) && (
                  <div className="mt-2 ml-6 flex items-center gap-2 flex-wrap">
                    {attendeeNames.slice(0, 4).map((a, i) => (
                      <span
                        key={i}
                        className="inline-block px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider border border-vanta-border text-vanta-text-low bg-card"
                      >
                        {a.name || a.email || "Unknown"}
                      </span>
                    ))}
                    {attendeeNames.length > 4 && (
                      <span className="font-mono text-[9px] text-vanta-text-muted">
                        +{attendeeNames.length - 4}
                      </span>
                    )}
                    {brief && (
                      <Link
                        to={`/briefing/${brief.id}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] border border-vanta-accent-zoom-border text-vanta-accent-zoom hover:bg-vanta-accent-zoom-faint transition-colors ml-auto"
                      >
                        <Video className="w-3 h-3" />
                        Brief
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Link
          to="/product/calendar"
          className="flex items-center gap-1 mt-2 font-mono text-[9px] uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
        >
          Full Calendar <ChevronRight className="w-3 h-3" />
        </Link>
      </section>
    </Motion>
  );
};

export default WhatsAhead;
