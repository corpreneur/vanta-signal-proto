import { Copy, Mail, ExternalLink, Share2, Check } from "lucide-react";
import { useState } from "react";
import { SIGNAL_TYPE_COLORS, type SignalType } from "@/data/signals";
import { useToast } from "@/hooks/use-toast";

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  INTRO: "Introduction", INSIGHT: "Insight", INVESTMENT: "Investment Intel",
  DECISION: "Decision", CONTEXT: "Context", NOISE: "Noise",
  MEETING: "Meeting", PHONE_CALL: "Phone Call",
};

interface ClassificationResult {
  signalType: string;
  priority: string;
  summary: string;
  suggestedTitle?: string;
  suggestedTags?: string[];
  suggestedContacts?: string[];
  accelerators?: string[];
}

interface CaptureResultSplitProps {
  rawText: string;
  classification: ClassificationResult;
  children?: React.ReactNode; // Ask Vanta bar slot
}

function TrafficDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
      <span className="w-2.5 h-2.5 rounded-full bg-[hsl(40_90%_55%)]" />
      <span className="w-2.5 h-2.5 rounded-full bg-[hsl(142_60%_45%)]" />
    </div>
  );
}

export default function CaptureResultSplit({ rawText, classification, children }: CaptureResultSplitProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const colors = SIGNAL_TYPE_COLORS[classification.signalType as SignalType];

  const handleCopy = async () => {
    const structured = [
      classification.suggestedTitle && `# ${classification.suggestedTitle}`,
      `**Type:** ${SIGNAL_TYPE_LABELS[classification.signalType] || classification.signalType}`,
      `**Priority:** ${classification.priority}`,
      "",
      classification.summary,
      "",
      classification.suggestedTags?.length ? `**Tags:** ${classification.suggestedTags.join(", ")}` : null,
      classification.suggestedContacts?.length ? `**Contacts:** ${classification.suggestedContacts.join(", ")}` : null,
    ].filter(Boolean).join("\n");

    await navigator.clipboard.writeText(structured);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmail = () => {
    const to = classification.suggestedContacts?.join(", ") || "";
    const subject = encodeURIComponent(classification.suggestedTitle || classification.summary);
    const body = encodeURIComponent(classification.summary);
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_self");
  };

  return (
    <div className="border border-border bg-card animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Split panels */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left: Raw input */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <TrafficDots />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Your Notes</span>
          </div>
          <p className="font-mono text-[12px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {rawText}
          </p>
        </div>

        {/* Right: AI structured */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <TrafficDots />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary">✦ Enhanced</span>
          </div>

          <div className="space-y-3">
            {/* Type + priority badge */}
            <div className="flex items-center gap-2">
              {colors && (
                <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm ${colors.bg} ${colors.text} ${colors.border} border`}>
                  {SIGNAL_TYPE_LABELS[classification.signalType] || classification.signalType}
                </span>
              )}
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {classification.priority}
              </span>
            </div>

            {/* Title */}
            {classification.suggestedTitle && (
              <h3 className="font-display text-[16px] text-foreground leading-snug">
                {classification.suggestedTitle}
              </h3>
            )}

            {/* Summary */}
            <p className="font-sans text-[13px] text-foreground leading-relaxed">
              {classification.summary}
            </p>

            {/* Tags */}
            {classification.suggestedTags && classification.suggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {classification.suggestedTags.map((tag) => (
                  <span key={tag} className="font-mono text-[9px] uppercase tracking-[0.12em] px-2 py-1 rounded-sm border border-primary/30 bg-primary/10 text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Contacts */}
            {classification.suggestedContacts && classification.suggestedContacts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {classification.suggestedContacts.map((c) => (
                  <span key={c} className="font-mono text-[9px] uppercase tracking-[0.12em] px-2 py-1 rounded-sm border border-accent/30 bg-accent/10 text-accent-foreground">
                    + {c}
                  </span>
                ))}
              </div>
            )}

            {/* Accelerators */}
            {classification.accelerators && classification.accelerators.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-border/50">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Suggested Actions</span>
                {classification.accelerators.map((a) => (
                  <p key={a} className="font-mono text-[10px] text-foreground/80">→ {a}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share/Export row */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-t border-border bg-muted/20">
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mr-2">Share</span>
        <button onClick={handleCopy} className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Copy to clipboard">
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button onClick={handleEmail} className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Email to participants">
          <Mail className="h-3.5 w-3.5" />
        </button>
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors opacity-40 cursor-not-allowed" title="Open in Notion (coming soon)">
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors opacity-40 cursor-not-allowed" title="Share link (coming soon)">
          <Share2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Ask Vanta bar slot */}
      {children}
    </div>
  );
}
