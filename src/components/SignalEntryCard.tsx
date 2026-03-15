import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Copy, Check, CheckCircle, Video, Phone, ArrowUpFromLine, Shield, CalendarClock, Pointer, Users, Reply, Bell, Calendar, Image, Film, FileText, Mic, Paperclip, Pin, Clock, Mail, FileOutput, Flag } from "lucide-react";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS, PHONE_CALL_TAGS, PHONE_TAG_LABELS } from "@/data/signals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { ContactContext } from "@/lib/contactStrength";
import { recencyLabel } from "@/lib/contactStrength";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffH / 24);

  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PRIORITY_STYLES: Record<string, string> = {
  high: "text-vanta-accent border-vanta-accent-border bg-vanta-accent-faint",
  medium: "text-vanta-text-mid border-vanta-border bg-transparent",
  low: "text-vanta-text-muted border-vanta-border bg-transparent",
};

const RISK_STYLES: Record<string, string> = {
  critical: "text-vanta-signal-red border-vanta-signal-red-border bg-vanta-signal-red-faint",
  high: "text-vanta-signal-red border-vanta-signal-red-border bg-vanta-signal-red-faint",
  medium: "text-vanta-signal-yellow border-vanta-signal-yellow-border bg-vanta-signal-yellow-faint",
  low: "text-vanta-text-muted border-vanta-border bg-transparent",
};

function formatDueDate(dateStr: string): { label: string; isOverdue: boolean } {
  const due = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
  if (diffDays === 0) return { label: "Due today", isOverdue: true };
  if (diffDays === 1) return { label: "Due tomorrow", isOverdue: false };
  if (diffDays <= 7) return { label: `Due in ${diffDays}d`, isOverdue: false };
  return {
    label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    isOverdue: false,
  };
}

interface SignalEntryCardProps {
  signal: Signal;
  onClick?: () => void;
  showPromote?: boolean;
  contactContext?: ContactContext;
}

const SignalEntryCard = ({ signal, onClick, showPromote, contactContext }: SignalEntryCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markingReviewed, setMarkingReviewed] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [settingReminder, setSettingReminder] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [snoozing, setSnoozing] = useState(false);
  const queryClient = useQueryClient();
  const colors = SIGNAL_TYPE_COLORS[signal.signalType];

  const handleCopyInsight = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(signal.summary);
    setCopied(true);
    toast.success("Insight copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkReviewed = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMarkingReviewed(true);
    const { error } = await supabase
      .from("signals")
      .update({ status: "Complete" as const })
      .eq("id", signal.id);
    setMarkingReviewed(false);
    if (error) {
      toast.error("Failed to mark reviewed");
    } else {
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.success("Marked as reviewed");
    }
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const handlePromote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPromoting(true);
    const { error } = await supabase
      .from("signals")
      .update({ signal_type: "CONTEXT" as const })
      .eq("id", signal.id);
    setPromoting(false);
    if (error) {
      toast.error("Failed to promote signal");
    } else {
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.success("Signal promoted to Context");
    }
  };

  return (
    <div
      className={`border border-vanta-border bg-vanta-bg-elevated transition-colors hover:border-vanta-border-mid ${
        signal.status === "Complete" ? "opacity-50" : ""
      }`}
    >
      {/* Clickable header area */}
      <div className="p-5 md:p-6 cursor-pointer" onClick={onClick}>
        {/* Header row: badge + timestamp */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] border ${colors.text} ${colors.bg} ${colors.border}`}
            >
              {signal.signalType}
            </span>
            <span
              className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] border ${PRIORITY_STYLES[signal.priority]}`}
            >
              {signal.priority}
            </span>
            {signal.status === "Complete" && (
              <span className="inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] border border-vanta-signal-green-border text-vanta-signal-green bg-vanta-signal-green-faint">
                ✓ Complete
              </span>
            )}
            {signal.source === "recall" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] border border-vanta-accent-zoom-border text-vanta-accent-zoom bg-vanta-accent-zoom-faint">
                <Video className="w-3 h-3" />
                Zoom
              </span>
            ) : signal.source === "phone" || signal.signalType === "PHONE_CALL" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] border border-vanta-accent-phone-border text-vanta-accent-phone bg-vanta-accent-phone-faint">
                <Phone className="w-3 h-3" />
                Phone
              </span>
            ) : signal.source !== "linq" ? (
              <span className="inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] border border-vanta-border text-vanta-text-muted">
                {signal.source}
              </span>
            ) : null}
            {signal.rawPayload && typeof signal.rawPayload === "object" && (signal.rawPayload as Record<string, unknown>)._vanta_group_chat === true && (() => {
              const participants = (signal.rawPayload as Record<string, unknown>)._vanta_participants as string[] | undefined;
              const count = participants?.length;
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] border border-vanta-border text-vanta-text-mid bg-vanta-bg-elevated">
                  <Users className="w-3 h-3" />
                  Group{count ? ` · ${count}` : ""}
                </span>
              );
            })()}
            {/* Emoji reactions on this signal */}
            {signal.rawPayload && typeof signal.rawPayload === "object" && (() => {
              const rp = signal.rawPayload as Record<string, unknown>;
              const reactions = rp._vanta_reactions as Array<{ emoji: string; sender: string }> | undefined;
              const emojis = rp._vanta_emojis as string[] | undefined;
              const allEmojis = [
                ...(emojis || []),
                ...(reactions || []).map((r) => r.emoji),
              ].filter(Boolean);
              if (allEmojis.length === 0) return null;
              // Dedupe and count
              const counts: Record<string, number> = {};
              allEmojis.forEach((e) => { counts[e] = (counts[e] || 0) + 1; });
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs border border-vanta-border bg-vanta-bg-elevated rounded-sm">
                  {Object.entries(counts).map(([emoji, count]) => (
                    <span key={emoji} title={`${count} reaction${count > 1 ? "s" : ""}`}>
                      {emoji}{count > 1 ? <span className="font-mono text-[10px] text-vanta-text-muted ml-0.5">{count}</span> : null}
                    </span>
                  ))}
                </span>
              );
            })()}
            {/* Attachment badges */}
            {signal.rawPayload && typeof signal.rawPayload === "object" && (() => {
              const rp = signal.rawPayload as Record<string, unknown>;
              const attachments = rp._vanta_attachments as Array<{ type: string; url?: string; mime?: string; filename?: string }> | undefined;
              if (!attachments || attachments.length === 0) return null;
              const getIcon = (type: string, mime?: string) => {
                if (mime?.startsWith("image") || type === "image") return <Image className="w-3 h-3" />;
                if (mime?.startsWith("video") || type === "video") return <Film className="w-3 h-3" />;
                if (mime?.startsWith("audio") || type === "audio") return <Mic className="w-3 h-3" />;
                if (type === "file" || type === "document") return <FileText className="w-3 h-3" />;
                return <Paperclip className="w-3 h-3" />;
              };
              const getLabel = (type: string, mime?: string) => {
                if (mime?.startsWith("image") || type === "image") return "Image";
                if (mime?.startsWith("video") || type === "video") return "Video";
                if (mime?.startsWith("audio") || type === "audio") return "Audio";
                if (type === "file" || type === "document") return "File";
                return type;
              };
              // Group by label
              const groups: Record<string, number> = {};
              attachments.forEach((a) => {
                const label = getLabel(a.type, a.mime);
                groups[label] = (groups[label] || 0) + 1;
              });
              return (
                <>
                  {Object.entries(groups).map(([label, count]) => (
                    <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] border border-vanta-border text-vanta-text-mid bg-vanta-bg-elevated">
                      {getIcon(label.toLowerCase())}
                      {label}{count > 1 ? ` ×${count}` : ""}
                    </span>
                  ))}
                  {/* Thumbnail for first image attachment */}
                  {attachments.find((a) => (a.mime?.startsWith("image") || a.type === "image") && a.url) && (
                    <img
                      src={attachments.find((a) => (a.mime?.startsWith("image") || a.type === "image") && a.url)!.url}
                      alt="attachment"
                      className="w-8 h-8 object-cover border border-vanta-border rounded-sm"
                    />
                  )}
                </>
              );
            })()}
            {signal.riskLevel && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] border ${RISK_STYLES[signal.riskLevel]}`}
              >
                <Shield className="w-3 h-3" />
                {signal.riskLevel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {signal.dueDate && (() => {
              const { label, isOverdue } = formatDueDate(signal.dueDate);
              return (
                <span
                  className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] ${
                    isOverdue ? "text-destructive" : "text-vanta-text-muted"
                  }`}
                >
                  <CalendarClock className="w-3 h-3" />
                  {label}
                </span>
              );
            })()}
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-vanta-text-muted whitespace-nowrap">
              {formatTimestamp(signal.capturedAt)}
            </span>
          </div>
        </div>

        {/* Sender */}
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-vanta-text-mid mb-2">
          {signal.sender}
        </p>

        {/* Summary, the extracted insight headline */}
        <p className="font-sans text-[14px] leading-[1.6] text-vanta-text mb-3">
          {signal.summary}
        </p>

        {/* Phone-specific tags */}
        {signal.signalType === "PHONE_CALL" && signal.actionsTaken.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {signal.actionsTaken
              .filter((a) => (PHONE_CALL_TAGS as readonly string[]).includes(a))
              .map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] border border-vanta-accent-phone-border text-vanta-accent-phone bg-vanta-accent-phone-faint"
                >
                  {PHONE_TAG_LABELS[tag as keyof typeof PHONE_TAG_LABELS] || tag}
                </span>
              ))}
          </div>
        )}

        {/* Inline actions row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Complete */}
          {signal.status !== "Complete" && (
            <button
              onClick={handleMarkReviewed}
              disabled={markingReviewed}
              className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-signal-green border border-vanta-signal-green-border hover:bg-vanta-signal-green-faint transition-colors disabled:opacity-50"
              title="Mark Complete"
            >
              <CheckCircle className="w-3 h-3" />
              Done
            </button>
          )}

          {/* Snooze */}
          {signal.status !== "Complete" && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                setSnoozing(true);
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const { error } = await supabase
                  .from("signals")
                  .update({ due_date: tomorrow.toISOString().split("T")[0] })
                  .eq("id", signal.id);
                setSnoozing(false);
                if (error) {
                  toast.error("Failed to snooze");
                } else {
                  queryClient.invalidateQueries({ queryKey: ["signals"] });
                  toast.success("Snoozed until tomorrow");
                }
              }}
              disabled={snoozing}
              className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low border border-vanta-border hover:border-vanta-accent-border hover:text-vanta-accent transition-colors disabled:opacity-50"
              title="Snooze until tomorrow"
            >
              <Clock className="w-3 h-3" />
              Snooze
            </button>
          )}

          {/* Pin */}
          <button
            onClick={async (e) => {
              e.stopPropagation();
              setPinning(true);
              const newPinned = !signal.pinned;
              const { error } = await supabase
                .from("signals")
                .update({ pinned: newPinned })
                .eq("id", signal.id);
              setPinning(false);
              if (error) {
                toast.error("Failed to pin");
              } else {
                queryClient.invalidateQueries({ queryKey: ["signals"] });
                toast.success(newPinned ? "Signal pinned" : "Signal unpinned");
              }
            }}
            disabled={pinning}
            className={`flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] border transition-colors disabled:opacity-50 ${
              signal.pinned
                ? "text-vanta-accent border-vanta-accent-border bg-vanta-accent-faint"
                : "text-vanta-text-low border-vanta-border hover:border-vanta-accent-border hover:text-vanta-accent"
            }`}
            title={signal.pinned ? "Unpin" : "Pin to top"}
          >
            <Pin className="w-3 h-3" />
            {signal.pinned ? "Pinned" : "Pin"}
          </button>
          <button
            onClick={handleCopyInsight}
            className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low border border-vanta-border hover:border-vanta-accent-border hover:text-vanta-accent transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy Insight"}
          </button>


          {showPromote && (
            <button
              onClick={handlePromote}
              disabled={promoting}
              className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-accent border border-vanta-accent-border hover:bg-vanta-accent-faint transition-colors disabled:opacity-50"
            >
              <ArrowUpFromLine className="w-3 h-3" />
              {promoting ? "Promoting…" : "Promote"}
            </button>
          )}

          {/* Remind */}
          {signal.status !== "Complete" && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dueDate = tomorrow.toISOString().split("T")[0];
                setSettingReminder(true);
                try {
                  const { data, error } = await supabase.functions.invoke("create-reminder", {
                    body: { signal_id: signal.id, due_date: dueDate },
                  });
                  if (error) throw error;
                  queryClient.invalidateQueries({ queryKey: ["signals"] });
                  toast.success("Reminder set for tomorrow");
                } catch {
                  toast.error("Failed to set reminder");
                }
                setSettingReminder(false);
              }}
              disabled={settingReminder}
              className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low border border-vanta-border hover:border-vanta-accent-border hover:text-vanta-accent transition-colors disabled:opacity-50"
            >
              <Bell className="w-3 h-3" />
              {settingReminder ? "Setting…" : "Remind"}
            </button>
          )}

          {/* Calendar Hold */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(9, 0, 0, 0);
              const end = new Date(tomorrow);
              end.setMinutes(30);
              const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
              const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Follow up: ${signal.sender}`)}&details=${encodeURIComponent(signal.summary)}&dates=${fmt(tomorrow)}/${fmt(end)}`;
              window.open(url, "_blank");
            }}
            className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low border border-vanta-border hover:border-vanta-accent-border hover:text-vanta-accent transition-colors"
          >
            <Calendar className="w-3 h-3" />
            Cal Hold
          </button>

          {/* Contextual Smart Actions by signal type */}
          {signal.signalType === "INTRO" && signal.status !== "Complete" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const subject = encodeURIComponent(`Re: Introduction — ${signal.sender}`);
                const body = encodeURIComponent(`Hi,\n\nFollowing up on the introduction from ${signal.sender}.\n\n${signal.summary}\n\nBest regards`);
                window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
              }}
              className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-accent border border-vanta-accent-border hover:bg-vanta-accent-faint transition-colors"
            >
              <Mail className="w-3 h-3" />
              Draft Reply
            </button>
          )}
          {signal.signalType === "MEETING" && signal.status !== "Complete" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                nextWeek.setHours(10, 0, 0, 0);
                const end = new Date(nextWeek);
                end.setMinutes(30);
                const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
                const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Follow-up: ${signal.sender}`)}&details=${encodeURIComponent(signal.summary)}&dates=${fmt(nextWeek)}/${fmt(end)}`;
                window.open(url, "_blank");
              }}
              className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-accent border border-vanta-accent-border hover:bg-vanta-accent-faint transition-colors"
            >
              <Calendar className="w-3 h-3" />
              Follow-Up
            </button>
          )}
          {signal.signalType === "DECISION" && signal.status !== "Complete" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(`TASK: ${signal.summary}\nFrom: ${signal.sender}\nPriority: ${signal.priority}\nContext: ${signal.sourceMessage}`);
                toast.success("Decision exported as task to clipboard");
              }}
              className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-accent border border-vanta-accent-border hover:bg-vanta-accent-faint transition-colors"
            >
              <FileOutput className="w-3 h-3" />
              Create Task
            </button>
          )}
          {signal.signalType === "INVESTMENT" && signal.status !== "Complete" && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const { error } = await supabase
                  .from("signals")
                  .update({ pinned: true })
                  .eq("id", signal.id);
                if (!error) {
                  queryClient.invalidateQueries({ queryKey: ["signals"] });
                  toast.success("Flagged for review");
                }
              }}
              className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-accent border border-vanta-accent-border hover:bg-vanta-accent-faint transition-colors"
            >
              <Flag className="w-3 h-3" />
              Flag Review
            </button>
          )}

          <button
            onClick={handleExpand}
            className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low border border-vanta-border hover:border-vanta-accent-border hover:text-vanta-accent transition-colors ml-auto"
          >
            <ChevronDown
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
            {expanded ? "Collapse" : "Details"}
          </button>
        </div>
      </div>

      {/* Expandable section */}
      {expanded && (
        <div className="border-t border-vanta-border px-5 md:px-6 py-4 space-y-4 animate-fade-up">
          {/* Raw message */}
          <div>
            <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
              Raw Message
            </h4>
            <div className="border-l-2 border-vanta-border pl-3">
              <p className="font-mono text-[11px] leading-[1.6] text-vanta-text-low whitespace-pre-wrap">
                {signal.sourceMessage}
              </p>
            </div>
          </div>

          {/* Actions taken */}
          {signal.actionsTaken.length > 0 && (
            <div>
              <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
                Actions Executed
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {signal.actionsTaken.map((action) => (
                  <span
                    key={action}
                    className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted border border-vanta-border px-1.5 py-0.5"
                  >
                    {formatAction(action)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Call pointer */}
          {signal.callPointer && (
            <div>
              <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
                Call Pointer
              </h4>
              <div className="flex items-center gap-1.5">
                <Pointer className="w-3 h-3 text-vanta-text-low" />
                <p className="font-mono text-[11px] leading-[1.6] text-vanta-text-low">
                  {signal.callPointer}
                </p>
              </div>
            </div>
          )}

          {/* Source context */}
          <div className="flex items-center gap-4">
            <div>
              <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">
                Source
              </h4>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-vanta-text-low">
                {signal.source}
              </p>
            </div>
            {signal.linqMessageId && (
              <div>
                <h4 className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">
                  Message ID
                </h4>
                <p className="font-mono text-[10px] text-vanta-text-muted break-all">
                  {signal.linqMessageId}
                </p>
              </div>
            )}
          </div>

          {/* View Full Detail button */}
          <button
            onClick={onClick}
            className="w-full h-8 border border-vanta-border text-vanta-text-low font-mono text-[10px] uppercase tracking-[0.15em] hover:border-vanta-accent-border hover:text-vanta-accent transition-colors"
          >
            Open Full Detail →
          </button>
        </div>
      )}
    </div>
  );
};

export default SignalEntryCard;
