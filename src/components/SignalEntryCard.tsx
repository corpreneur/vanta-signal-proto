import { useState } from "react";
import { ChevronDown, Copy, Check, CheckCircle, Video, Phone, ArrowUpFromLine } from "lucide-react";
import type { Signal } from "@/data/signals";
import { SIGNAL_TYPE_COLORS, PHONE_CALL_TAGS, PHONE_TAG_LABELS } from "@/data/signals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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

interface SignalEntryCardProps {
  signal: Signal;
  onClick?: () => void;
  showPromote?: boolean;
}

const SignalEntryCard = ({ signal, onClick }: SignalEntryCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markingReviewed, setMarkingReviewed] = useState(false);
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
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-vanta-text-muted whitespace-nowrap">
            {formatTimestamp(signal.capturedAt)}
          </span>
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyInsight}
            className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low border border-vanta-border hover:border-vanta-accent-border hover:text-vanta-accent transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy Insight"}
          </button>

          {signal.status !== "Complete" && (
            <button
              onClick={handleMarkReviewed}
              disabled={markingReviewed}
              className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-low border border-vanta-border hover:border-vanta-accent-border hover:text-vanta-accent transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3 h-3" />
              {markingReviewed ? "Saving…" : "Mark Reviewed"}
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
