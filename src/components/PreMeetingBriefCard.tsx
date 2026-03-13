import { useState } from "react";
import { Video, ChevronDown, X, Users, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface MatchedSignal {
  id: string;
  matched_attendee: string;
  signal_type: string;
  summary: string;
  priority: string;
  captured_at: string;
  sender: string;
}

interface AttendeeContext {
  signal_count: number;
  signal_types: string[];
  last_signal: string;
}

interface PreMeetingBrief {
  id: string;
  meeting_id: string;
  brief_text: string;
  matched_signals: MatchedSignal[];
  attendee_context: Record<string, AttendeeContext>;
  created_at: string;
  dismissed: boolean;
  meeting_title?: string;
  meeting_starts_at?: string;
}

interface PreMeetingBriefCardProps {
  brief: PreMeetingBrief;
}

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const mins = Math.round(diff / 60000);
  if (mins <= 0) return "Starting now";
  if (mins === 1) return "In 1 min";
  return `In ${mins} min`;
}

const PreMeetingBriefCard = ({ brief }: PreMeetingBriefCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from("pre_meeting_briefs")
      .update({ dismissed: true })
      .eq("id", brief.id);
    queryClient.invalidateQueries({ queryKey: ["pre-meeting-briefs"] });
  };

  const attendees = Object.entries(brief.attendee_context);

  return (
    <div className="border border-vanta-accent-zoom-border bg-vanta-accent-zoom-faint mb-4 animate-fade-up">
      {/* Header */}
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] border border-vanta-accent-zoom-border text-vanta-accent-zoom bg-vanta-accent-zoom-faint">
              <Video className="w-3 h-3" />
              Pre-Meeting Brief
            </span>
            {brief.meeting_starts_at && (
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-vanta-accent-zoom">
                {timeUntil(brief.meeting_starts_at)}
              </span>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-vanta-text-muted hover:text-vanta-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meeting title */}
        {brief.meeting_title && (
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-vanta-accent-zoom mb-2">
            {brief.meeting_title}
          </p>
        )}

        {/* Brief text */}
        <p className="font-sans text-[14px] leading-[1.6] text-vanta-text mb-4">
          {brief.brief_text}
        </p>

        {/* Attendee chips */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Users className="w-3.5 h-3.5 text-vanta-text-muted" />
          {attendees.map(([name, ctx]) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] border border-vanta-accent-zoom-border text-vanta-text-mid bg-vanta-bg-elevated"
            >
              {name}
              <span className="text-vanta-accent-zoom font-bold">
                {ctx.signal_count}
              </span>
            </span>
          ))}
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/briefing/${brief.id}`}
            className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-accent-zoom border border-vanta-accent-zoom-border hover:bg-vanta-accent-zoom-faint transition-colors"
          >
            <FileText className="w-3 h-3" />
            Full Dossier
          </Link>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low border border-vanta-border hover:border-vanta-accent-zoom-border hover:text-vanta-accent-zoom transition-colors"
          >
          <ChevronDown
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
            {expanded ? "Hide" : "View"} Matched Signals ({brief.matched_signals.length})
          </button>
        </div>
      </div>

      {/* Expanded: matched signals */}
      {expanded && (
        <div className="border-t border-vanta-accent-zoom-border px-5 md:px-6 py-4 space-y-3 animate-fade-up">
          {brief.matched_signals.map((sig) => (
            <div
              key={sig.id}
              className="border-l-2 border-vanta-accent-zoom-border pl-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-accent-zoom">
                  {sig.signal_type}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-vanta-text-muted">
                  {sig.matched_attendee}
                </span>
              </div>
              <p className="font-sans text-[12px] leading-[1.5] text-vanta-text-low">
                {sig.summary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreMeetingBriefCard;
