import { useState, useRef } from "react";
import { PenLine, Loader2, ArrowRight, Mic, MicOff, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SIGNAL_TYPE_COLORS, type SignalType } from "@/data/signals";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  INTRO: "Introduction",
  INSIGHT: "Insight",
  INVESTMENT: "Investment Intel",
  DECISION: "Decision",
  CONTEXT: "Context",
  NOISE: "Noise",
};

type InputMode = "text" | "link";

export default function BrainDump() {
  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    signalType: string;
    priority: string;
    summary: string;
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isListening, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const textBeforeVoiceRef = useRef("");

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      textBeforeVoiceRef.current = text;
      resetTranscript();
      startListening((voiceText) => {
        setText(textBeforeVoiceRef.current + (textBeforeVoiceRef.current ? "\n" : "") + voiceText);
      });
    }
  };

  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async () => {
    if (loading) return;
    
    const content = inputMode === "link" ? linkUrl.trim() : text.trim();
    if (!content) return;

    if (isListening) stopListening();
    setLoading(true);
    setResult(null);

    try {
      if (inputMode === "link") {
        setStatusMessage("Scraping URL…");
      } else {
        setStatusMessage("Classifying…");
      }

      const { data, error } = await supabase.functions.invoke("brain-dump", {
        body: inputMode === "link" 
          ? { url: content }
          : { text: content },
      });

      setStatusMessage("");

      if (error) throw error;

      const classification = data.classification;
      setResult(classification);
      if (inputMode === "text") setText("");
      else setLinkUrl("");

      toast({
        title: `Classified as ${SIGNAL_TYPE_LABELS[classification.signalType] || classification.signalType}`,
        description: classification.summary,
      });
    } catch (e: unknown) {
      setStatusMessage("");
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

      {/* Input mode tabs */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setInputMode("text")}
          className={`font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border transition-all duration-200 ${
            inputMode === "text"
              ? "bg-primary/10 border-primary text-primary"
              : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          }`}
        >
          Text / Voice
        </button>
        <button
          onClick={() => setInputMode("link")}
          className={`font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border transition-all duration-200 ${
            inputMode === "link"
              ? "bg-primary/10 border-primary text-primary"
              : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          }`}
        >
          <Link2 className="h-3 w-3 inline mr-1" />
          Paste Link
        </button>
      </div>

      {/* Input area */}
      <div className="space-y-3">
        {inputMode === "text" ? (
          <>
            <div className="relative">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={isListening ? "Listening…" : "Start typing or paste text here..."}
                className={`min-h-[200px] bg-vanta-bg-elevated border-vanta-border font-mono text-sm text-foreground placeholder:text-muted-foreground resize-y pr-12 ${
                  isListening ? "border-primary/50 ring-1 ring-primary/20" : ""
                }`}
                disabled={loading}
                maxLength={10000}
              />
              {/* Mic button */}
              {isSupported && (
                <button
                  onClick={handleVoiceToggle}
                  disabled={loading}
                  className={`absolute top-3 right-3 p-2 rounded-md border transition-all duration-200 ${
                    isListening
                      ? "bg-red-500/15 border-red-500/30 text-red-400 animate-pulse"
                      : "bg-vanta-bg-elevated border-vanta-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                  title={isListening ? "Stop recording" : "Start voice input"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
            </div>
            {isListening && (
              <p className="font-mono text-[10px] uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Recording — speak now
              </p>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://chatgpt.com/share/... or any article URL"
              className="bg-vanta-bg-elevated border-vanta-border font-mono text-sm"
              disabled={loading}
              type="url"
            />
            <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
              Paste a ChatGPT share link, blog post, article, or any web page. Firecrawl will extract the content and classify it as a signal.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            {inputMode === "text"
              ? `${text.length.toLocaleString()} / 10,000`
              : linkUrl ? "URL ready" : "Paste a URL"}
          </span>
          <Button
            onClick={handleSubmit}
            disabled={(inputMode === "text" ? !text.trim() : !linkUrl.trim()) || loading}
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
