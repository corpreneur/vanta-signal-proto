import { useState, useEffect, useRef } from "react";
import { ArrowRight, Mail, Bell, Link2, Sparkles } from "lucide-react";
import { SIGNAL_TYPE_COLORS, type SignalType } from "@/data/signals";
import { cn } from "@/lib/utils";

interface CaptureResult {
  signalType: string;
  priority: string;
  summary: string;
  suggestedTitle?: string;
  suggestedTags?: string[];
  suggestedContacts?: string[];
  accelerators?: string[];
}

interface CaptureProcessingRevealProps {
  rawText: string;
  result: CaptureResult | null;
  processing: boolean;
  onDismiss: () => void;
  onAction?: (action: string) => void;
}

const SIGNAL_LABELS: Record<string, string> = {
  INTRO: "Introduction",
  INSIGHT: "Insight",
  INVESTMENT: "Investment Intel",
  DECISION: "Decision",
  CONTEXT: "Context",
  NOISE: "Noise",
  MEETING: "Meeting",
  PHONE_CALL: "Phone Call",
};

function TypewriterText({ text, speed = 18 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-primary ml-0.5 animate-pulse align-text-bottom" />
      )}
    </span>
  );
}

function ActionItem({
  action,
  index,
  onClick,
}: {
  action: string;
  index: number;
  onClick?: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800 + index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  const icon =
    action.toLowerCase().includes("email") || action.toLowerCase().includes("send")
      ? Mail
      : action.toLowerCase().includes("remind") || action.toLowerCase().includes("follow")
        ? Bell
        : action.toLowerCase().includes("link") || action.toLowerCase().includes("connect")
          ? Link2
          : ArrowRight;

  const Icon = icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full text-left px-3 py-2 transition-all duration-500 hover:bg-muted/40 active:scale-[0.98]",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2",
      )}
    >
      <Icon className="w-3 h-3 text-primary shrink-0" />
      <span className="font-sans text-[12px] text-foreground leading-snug">{action}</span>
    </button>
  );
}

export default function CaptureProcessingReveal({
  rawText,
  result,
  processing,
  onDismiss,
  onAction,
}: CaptureProcessingRevealProps) {
  const [badgeVisible, setBadgeVisible] = useState(false);
  const colors = result
    ? SIGNAL_TYPE_COLORS[result.signalType as SignalType] || SIGNAL_TYPE_COLORS.CONTEXT
    : null;

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setBadgeVisible(true), 400);
      return () => clearTimeout(timer);
    }
    setBadgeVisible(false);
  }, [result]);

  // Processing shimmer state
  if (processing) {
    return (
      <div className="border border-border bg-card overflow-hidden">
        <div className="px-4 py-5 flex items-center gap-3">
          <div className="w-5 h-5 relative">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-3/4 bg-muted rounded-sm capture-shimmer" />
            <div className="h-2 w-1/2 bg-muted rounded-sm capture-shimmer" style={{ animationDelay: "0.15s" }} />
          </div>
        </div>
        <div className="px-4 pb-3">
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
            Processing…
          </span>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="border border-border bg-card overflow-hidden animate-[fadeUp_400ms_cubic-bezier(0.22,1,0.36,1)]">
      {/* Raw input */}
      <div className="px-4 pt-4 pb-3 border-b border-border/50">
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
          What you captured
        </p>
        <p className="font-sans text-[12px] text-muted-foreground leading-relaxed line-clamp-3 italic">
          "{rawText}"
        </p>
      </div>

      {/* Divider */}
      <div className="px-4 py-2 flex items-center gap-2">
        <div className="flex-1 border-t border-dashed border-border" />
        <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-muted-foreground">
          processed into
        </span>
        <div className="flex-1 border-t border-dashed border-border" />
      </div>

      {/* Structured result */}
      <div className="px-4 pb-2">
        {/* Badge row */}
        <div
          className={cn(
            "flex items-center gap-2 mb-2 transition-all duration-500",
            badgeVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
          )}
        >
          {colors && (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] border",
                colors.text,
                colors.bg,
                colors.border,
              )}
            >
              {SIGNAL_LABELS[result.signalType] || result.signalType}
            </span>
          )}
          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
            {result.priority}
          </span>
        </div>

        {/* Typewriter summary */}
        <p className="font-sans text-[13px] text-foreground leading-relaxed mb-1">
          <TypewriterText text={result.summary} />
        </p>

        {/* Tags */}
        {result.suggestedTags && result.suggestedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 mb-1">
            {result.suggestedTags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[8px] uppercase tracking-[0.15em] px-1.5 py-0.5 bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cascading actions */}
      {result.accelerators && result.accelerators.length > 0 && (
        <div className="border-t border-border/50 py-1">
          {result.accelerators.map((action, i) => (
            <ActionItem
              key={action}
              action={action}
              index={i}
              onClick={() => onAction?.(action)}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border/50 flex items-center justify-between">
        <button
          onClick={onDismiss}
          className="font-mono text-[9px] uppercase tracking-[0.15em] text-primary hover:text-primary/80 transition-colors active:scale-95"
        >
          + New capture
        </button>
        <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-wider">
          Signal detected
        </span>
      </div>
    </div>
  );
}
