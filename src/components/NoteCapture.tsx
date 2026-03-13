import { useState, useRef } from "react";
import { Plus, X, Mic, MicOff, Loader2, Tag, Send, Bookmark, Share2, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SIGNAL_TYPE_COLORS, type SignalType } from "@/data/signals";

const QUICK_TAGS = ["@person", "#priority", "#followup", "#idea", "#decision"];

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  INTRO: "Introduction",
  INSIGHT: "Insight",
  INVESTMENT: "Investment Intel",
  DECISION: "Decision",
  CONTEXT: "Context",
  NOISE: "Noise",
};

interface NoteCaptureProps {
  /** When true, renders inline (page mode) vs. FAB overlay */
  inline?: boolean;
}

export default function NoteCapture({ inline = false }: NoteCaptureProps) {
  const [open, setOpen] = useState(inline);
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    signalType: string;
    priority: string;
    summary: string;
    suggestedActions?: string[];
  } | null>(null);

  const { toast } = useToast();
  const { isListening, isSupported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();
  const textBeforeVoiceRef = useRef("");

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      textBeforeVoiceRef.current = text;
      resetTranscript();
      startListening((voiceText) => {
        setText(
          textBeforeVoiceRef.current +
            (textBeforeVoiceRef.current ? "\n" : "") +
            voiceText
        );
      });
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!text.trim() || loading) return;
    if (isListening) stopListening();
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("brain-dump", {
        body: { text: text.trim() },
      });

      if (error) throw error;

      const classification = data.classification;
      setResult({
        ...classification,
        suggestedActions: ["Set reminder", "Create task", "Add to brief"],
      });

      toast({
        title: `Captured as ${SIGNAL_TYPE_LABELS[classification.signalType] || classification.signalType}`,
        description: classification.summary,
      });
    } catch (e: unknown) {
      console.error("Note capture error:", e);
      toast({
        title: "Capture failed",
        description:
          e instanceof Error ? e.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setText("");
    setSelectedTags([]);
    setResult(null);
    if (!inline) setOpen(false);
  };

  const colors = result
    ? SIGNAL_TYPE_COLORS[result.signalType as SignalType]
    : null;

  // ── FAB (floating action button) ──
  if (!inline && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="New note"
      >
        <Plus className="h-6 w-6" />
      </button>
    );
  }

  // ── Expanded note surface ──
  const noteContent = (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {isListening ? "Listening…" : "New Note"}
        </span>
        {!inline && (
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Text area */}
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className={`min-h-[140px] bg-transparent border-none shadow-none font-mono text-sm text-foreground placeholder:text-muted-foreground resize-none focus-visible:ring-0 p-0 ${
            isListening ? "animate-pulse" : ""
          }`}
          disabled={loading}
          autoFocus
        />
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`font-mono text-[9px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border transition-all duration-150 ${
              selectedTags.includes(tag)
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-transparent border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border">
        {isSupported && (
          <button
            onClick={handleVoiceToggle}
            disabled={loading}
            className={`p-2 rounded-md transition-all ${
              isListening
                ? "text-red-400 bg-red-500/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={isListening ? "Stop" : "Dictate"}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        )}
        <button
          className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          title="Tag"
        >
          <Tag className="h-4 w-4" />
        </button>
        <button
          className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          title="Share"
        >
          <Share2 className="h-4 w-4" />
        </button>
        <button
          className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          title="Bookmark"
        >
          <Bookmark className="h-4 w-4" />
        </button>

        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={!text.trim() || loading}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* AI Result — suggested classification + actions */}
      {result && colors && (
        <div
          className={`rounded-md border p-3 space-y-2.5 ${colors.bg} ${colors.border} animate-in fade-in slide-in-from-bottom-2 duration-300`}
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
          <p className="font-mono text-xs text-foreground leading-relaxed">
            {result.summary}
          </p>

          {/* Suggested actions */}
          {result.suggestedActions && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {result.suggestedActions.map((action) => (
                <button
                  key={action}
                  className="font-mono text-[9px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setText("");
              setSelectedTags([]);
              setResult(null);
            }}
            className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            + New note
          </button>
        </div>
      )}
    </div>
  );

  if (inline) {
    return noteContent;
  }

  // Overlay mode
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-card border border-border rounded-xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {noteContent}
      </div>
    </div>
  );
}
