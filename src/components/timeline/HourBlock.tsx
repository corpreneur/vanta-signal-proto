import type { Signal } from "@/data/signals";
import { MessageSquare, Phone, Video, Mail, StickyNote, Trash2 } from "lucide-react";
import ZoomLaunchButton from "@/components/ZoomLaunchButton";

const SOURCE_ICONS: Record<string, typeof MessageSquare> = {
  linq: MessageSquare,
  phone: Phone,
  recall: Video,
  gmail: Mail,
  manual: StickyNote,
};

const SIGNAL_LEFT_BORDER: Record<string, string> = {
  INTRO: "border-l-[hsl(var(--vanta-accent))]",
  INSIGHT: "border-l-[hsl(var(--vanta-signal-blue))]",
  INVESTMENT: "border-l-[hsl(var(--vanta-signal-yellow))]",
  DECISION: "border-l-[hsl(var(--vanta-signal-yellow))]",
  CONTEXT: "border-l-[hsl(var(--vanta-text-low))]",
  MEETING: "border-l-[hsl(var(--vanta-signal-blue))]",
  PHONE_CALL: "border-l-[hsl(var(--vanta-accent-phone))]",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

interface HourBlockProps {
  hour: number;
  signals: Signal[];
  meetings: Array<{ id: string; title: string; starts_at: string; ends_at: string | null; zoom_meeting_id?: string | null }>;
  isCurrentHour: boolean;
  onSignalClick: (s: Signal) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  deletingId: string | null;
}

export default function HourBlock({
  hour,
  signals,
  meetings,
  isCurrentHour,
  onSignalClick,
  onDelete,
  deletingId,
}: HourBlockProps) {
  const hourLabel =
    hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;

  const isEmpty = signals.length === 0 && meetings.length === 0;

  return (
    <div
      className={`flex gap-3 min-h-[44px] group/hour ${
        isCurrentHour ? "bg-primary/[0.03]" : ""
      }`}
      aria-label={`${hourLabel} time block`}
    >
      {/* Time gutter */}
      <div className="w-14 shrink-0 pt-2 text-right pr-2 relative">
        <span
          className={`font-mono text-[10px] ${
            isCurrentHour ? "text-primary font-semibold" : "text-muted-foreground/60"
          }`}
        >
          {hourLabel}
        </span>
        {isCurrentHour && (
          <span className="absolute right-0 top-3 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
        )}
      </div>

      {/* Vertical line */}
      <div className="w-px bg-border relative shrink-0">
        {isCurrentHour && (
          <div className="absolute left-[-2px] top-3 w-[5px] h-[5px] rounded-full bg-primary" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 py-1 min-w-0">
        {isEmpty ? (
          <div className="h-6" />
        ) : (
          <div className="space-y-1">
            {/* Meetings */}
            {meetings.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 px-3 py-2 bg-vanta-signal-blue/[0.06] border border-vanta-signal-blue/20 text-sm"
              >
                <Video className="w-3.5 h-3.5 text-vanta-signal-blue shrink-0" />
                <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                  {formatTime(m.starts_at)}
                </span>
                <span className="font-sans text-[13px] text-foreground truncate flex-1">{m.title}</span>
                <ZoomLaunchButton meetingId={m.id} zoomMeetingId={m.zoom_meeting_id} variant="icon" />
              </div>
            ))}

            {/* Signals */}
            {signals.map((s) => {
              const SourceIcon = SOURCE_ICONS[s.source] || MessageSquare;
              const leftBorder = SIGNAL_LEFT_BORDER[s.signalType] || "border-l-transparent";
              return (
                <div
                  key={s.id}
                  className={`flex items-start gap-2 px-3 py-2 bg-card border border-border border-l-2 ${leftBorder} hover:bg-muted/50 transition-colors group/item`}
                >
                  <button
                    onClick={() => onSignalClick(s)}
                    className="flex items-start gap-2 flex-1 min-w-0 text-left"
                  >
                    <span className="font-mono text-[9px] text-muted-foreground shrink-0 mt-0.5 w-12">
                      {formatTime(s.capturedAt)}
                    </span>
                    <SourceIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-[13px] text-foreground truncate">{s.summary}</p>
                      <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{s.sender}</p>
                    </div>
                  </button>
                  {s.priority === "high" && (
                    <span className="font-mono text-[8px] uppercase tracking-wider text-primary px-1.5 py-0.5 border border-primary/20 bg-primary/[0.06] shrink-0">
                      High
                    </span>
                  )}
                  <button
                    onClick={(e) => onDelete(s.id, e)}
                    disabled={deletingId === s.id}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 opacity-0 group-hover/item:opacity-100 shrink-0 disabled:opacity-50"
                    aria-label={`Delete signal: ${s.summary}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
