import { useState } from "react";
import { PenLine, Link2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { SIGNAL_TYPE_COLORS, type SignalType } from "@/data/signals";
import NoteCapture from "@/components/NoteCapture";

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  INTRO: "Introduction",
  INSIGHT: "Insight",
  INVESTMENT: "Investment Intel",
  DECISION: "Decision",
  CONTEXT: "Context",
  NOISE: "Noise",
};

type InputMode = "note" | "link" | "notion";

export default function BrainDump() {
  const [inputMode, setInputMode] = useState<InputMode>("note");
  const [linkUrl, setLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<{
    signalType: string;
    priority: string;
    summary: string;
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLinkSubmit = async () => {
    if (!linkUrl.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setStatusMessage("Scraping URL…");

    try {
      const { data, error } = await supabase.functions.invoke("brain-dump", {
        body: { url: linkUrl.trim() },
      });
      setStatusMessage("");
      if (error) throw error;

      const classification = data.classification;
      setResult(classification);
      setLinkUrl("");
      toast({
        title: `Classified as ${SIGNAL_TYPE_LABELS[classification.signalType] || classification.signalType}`,
        description: classification.summary,
      });
    } catch (e: unknown) {
      setStatusMessage("");
      console.error("Link scrape error:", e);
      toast({
        title: "Classification failed",
        description: e instanceof Error ? e.message : "Something went wrong.",
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
          Share thoughts, ideas, or notes anytime. Vanta organizes, collects
          context, and suggests actions.
        </p>
      </div>

      {/* Input mode tabs */}
      <div className="flex gap-1.5">
        {([
          { key: "note" as const, label: "Note", icon: PenLine },
          { key: "link" as const, label: "Paste Link", icon: Link2 },
          { key: "notion" as const, label: "Notion", icon: FileText },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setInputMode(key)}
            className={`font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border transition-all duration-200 flex items-center gap-1 ${
              inputMode === key
                ? "bg-primary/10 border-primary text-primary"
                : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── Note mode: NoteCapture component ─── */}
      {inputMode === "note" && (
        <div className="border border-border rounded-xl p-5 bg-card">
          <NoteCapture inline />
        </div>
      )}

      {/* ─── Link mode ─── */}
      {inputMode === "link" && (
        <div className="space-y-3">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://chatgpt.com/share/... or any article URL"
            className="bg-vanta-bg-elevated border-vanta-border font-mono text-sm"
            disabled={loading}
            type="url"
          />
          <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
            Paste a ChatGPT share link, blog post, or any web page. Content
            will be extracted and classified as a signal.
          </p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              {linkUrl ? "URL ready" : "Paste a URL"}
            </span>
            <Button
              onClick={handleLinkSubmit}
              disabled={!linkUrl.trim() || loading}
              className="font-mono text-xs uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {statusMessage || "Processing…"}
                </>
              ) : (
                "Classify & Save"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Notion mode (placeholder) ─── */}
      {inputMode === "notion" && (
        <div className="border border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="font-mono text-xs text-muted-foreground text-center max-w-xs leading-relaxed">
            Notion import coming soon. Paste a Notion page URL to pull content
            directly into your signal pipeline.
          </p>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 border border-border rounded-full px-3 py-1">
            In Development
          </span>
        </div>
      )}

      {/* Link mode result */}
      {inputMode === "link" && result && colors && (
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
            onClick={() => navigate("/signals")}
          >
            View in Signal Feed →
          </Button>
        </div>
      )}
    </div>
  );
}
