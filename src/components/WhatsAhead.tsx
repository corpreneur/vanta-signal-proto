import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, AlertTriangle, ChevronRight } from "lucide-react";
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

  const coolingNames = useMemo(
    () => new Set(coolingContacts.map((c) => c.contact_name.toLowerCase())),
    [coolingContacts]
  );

  if (meetings.length === 0) return null;

  return (
    <Motion delay={100}>
      <section className="mb-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-3">
          What's Ahead
        </p>
        <div className="border border-vanta-border divide-y divide-vanta-border">
          {meetings.map((m) => {
            const attendeeNames = (m.attendees as Array<{ name?: string; email?: string }>) || [];
            const hasCooling = attendeeNames.some(
              (a) =>
                coolingNames.has((a.name || "").toLowerCase()) ||
                coolingNames.has((a.email || "").toLowerCase())
            );

            return (
              <div
                key={m.id}
                className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-vanta-bg-elevated transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-vanta-accent-amber shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[13px] text-foreground truncate">{m.title}</p>
                  <p className="font-mono text-[9px] text-vanta-text-low mt-0.5">
                    {formatDay(m.starts_at)} · {formatTime(m.starts_at)}
                    {m.ends_at && ` – ${formatTime(m.ends_at)}`}
                    {attendeeNames.length > 0 && ` · ${attendeeNames.length} attendee${attendeeNames.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
                {hasCooling && (
                  <span className="flex items-center gap-1 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-destructive border border-destructive/20 bg-destructive/5 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    Cooling
                  </span>
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
