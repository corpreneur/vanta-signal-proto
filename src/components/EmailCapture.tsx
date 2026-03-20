import { useState } from "react";
import { Mail, Loader2, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SIGNAL_TYPE_COLORS, type SignalType } from "@/data/signals";

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  INTRO: "Introduction", INSIGHT: "Insight", INVESTMENT: "Investment Intel",
  DECISION: "Decision", CONTEXT: "Context", NOISE: "Noise",
};

interface ClassificationResult {
  signalType: string; priority: string; summary: string;
  suggestedTitle?: string; suggestedTags?: string[]; suggestedContacts?: string[];
}

interface EmailCaptureProps {
  onCapture?: (classification: ClassificationResult) => void;
}

export default function EmailCapture({ onCapture }: EmailCaptureProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const prefixed = `[Forwarded Email]\n\n${text.trim()}`;
      const { data, error } = await supabase.functions.invoke("brain-dump", {
        body: { text: prefixed },
      });
      if (error) throw error;

      const classification = data.classification as ClassificationResult;
      setResult(classification);
      onCapture?.(classification);
      toast.success(`Classified as ${SIGNAL_TYPE_LABELS[classification.signalType] || classification.signalType}`);
    } catch (e) {
      console.error("Email capture error:", e);
      toast.error(e instanceof Error ? e.message : "Classification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setText("");
    setResult(null);
  };

  const colors = result ? SIGNAL_TYPE_COLORS[result.signalType as SignalType] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Paste a forwarded email
        </span>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"From: jane@example.com\nSubject: Q3 Board Update\nDate: Mar 15, 2026\n\nHi team, here are the Q3 numbers…"}
        className="min-h-[160px] bg-transparent border-border font-mono text-sm placeholder:text-muted-foreground/50 resize-none focus-visible:ring-1"
        disabled={loading}
      />

      <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
        Paste the full email including headers (From, Subject, Date). AI will extract sender, action items, and context.
      </p>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground">
          {text.trim() ? `${text.trim().length} chars` : "Paste email content"}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {loading ? "Classifying…" : "Classify Email"}
        </button>
      </div>

      {result && colors && (
        <div className={`rounded-md border p-4 space-y-2 ${colors.bg} ${colors.border} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[10px] uppercase tracking-widest ${colors.text}`}>
              {SIGNAL_TYPE_LABELS[result.signalType] || result.signalType}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">· {result.priority}</span>
          </div>
          <p className="font-mono text-xs text-foreground leading-relaxed">{result.summary}</p>
          {result.suggestedContacts && result.suggestedContacts.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.suggestedContacts.map((c) => (
                <span key={c} className="font-mono text-[9px] px-2 py-0.5 rounded-sm border border-primary/30 bg-primary/10 text-primary">
                  {c}
                </span>
              ))}
            </div>
          )}
          <button onClick={handleReset} className="font-mono text-[9px] uppercase tracking-wider text-primary hover:text-foreground transition-colors pt-1">
            + Paste another
          </button>
        </div>
      )}
    </div>
  );
}
