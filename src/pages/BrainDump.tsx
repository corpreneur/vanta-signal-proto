import { useState } from "react";
import { PenLine, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SIGNAL_TYPE_COLORS, type SignalType } from "@/data/signals";

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  INTRO: "Introduction",
  INSIGHT: "Insight",
  INVESTMENT: "Investment Intel",
  DECISION: "Decision",
  CONTEXT: "Context",
  NOISE: "Noise",
};

export default function BrainDump() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    signalType: string;
    priority: string;
    summary: string;
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("brain-dump", {
        body: { text: text.trim() },
      });

      if (error) throw error;

      const classification = data.classification;
      setResult(classification);
      setText("");

      toast({
        title: `Classified as ${SIGNAL_TYPE_LABELS[classification.signalType] || classification.signalType}`,
        description: classification.summary,
      });
    } catch (e: unknown) {
      console.error("Brain dump error:", e);
      toast({
        title: "Classification failed",
        description: e instanceof Error ? e.message : "Something went wrong. Try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const colors = result
    ? SIGNAL_TYPE_COLORS[result.signalType as SignalType]
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <PenLine className="h-5 w-5 text-vanta-accent" />
          <h1 className="font-mono text-lg uppercase tracking-widest text-foreground">
            Brain Dump
          </h1>
        </div>
        <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-md">
          Paste a voice memo transcript, jot meeting notes, dump a thought.
          Vanta will classify it and add it to your signal pipeline.
        </p>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste text here..."
          className="min-h-[200px] bg-vanta-bg-elevated border-vanta-border font-mono text-sm text-foreground placeholder:text-muted-foreground resize-y"
          disabled={loading}
          maxLength={10000}
        />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            {text.length.toLocaleString()} / 10,000
          </span>
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || loading}
            className="font-mono text-xs uppercase tracking-wider"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Classifying…
              </>
            ) : (
              "Classify & Save"
            )}
          </Button>
        </div>
      </div>

      {/* Result */}
      {result && colors && (
        <div
          className={`rounded-md border p-4 space-y-3 ${colors.bg} ${colors.border}`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-[10px] uppercase tracking-widest ${colors.text}`}
            >
              {SIGNAL_TYPE_LABELS[result.signalType] || result.signalType}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              · {result.priority}
            </span>
          </div>
          <p className="font-mono text-sm text-foreground">{result.summary}</p>
          <Button
            variant="ghost"
            size="sm"
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground p-0 h-auto"
            onClick={() => navigate("/signals?skip-auth=1")}
          >
            View in Signal Feed <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
