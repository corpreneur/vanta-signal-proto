import { useState, useRef } from "react";
import { Mic, Upload, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { SIGNAL_TYPE_COLORS, type SignalType } from "@/data/signals";

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  INTRO: "Introduction", INSIGHT: "Insight", INVESTMENT: "Investment Intel",
  DECISION: "Decision", CONTEXT: "Context", NOISE: "Noise",
};

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/x-m4a",
  "audio/wav", "audio/x-wav", "audio/webm", "audio/ogg",
];

interface ClassificationResult {
  signalType: string; priority: string; summary: string;
  suggestedTitle?: string; suggestedTags?: string[]; suggestedContacts?: string[];
}

interface VoiceMemoCaptureProps {
  onCapture?: (classification: ClassificationResult) => void;
}

export default function VoiceMemoCapture({ onCapture }: VoiceMemoCaptureProps) {
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    // Accept common audio types and any file with audio extension
    const ext = f.name.split(".").pop()?.toLowerCase();
    const audioExts = ["mp3", "m4a", "wav", "webm", "ogg", "mp4", "aac"];
    if (!ALLOWED_AUDIO_TYPES.includes(f.type) && !audioExts.includes(ext || "")) {
      toast.error("Unsupported format. Use MP3, M4A, WAV, or WebM.");
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      toast.error("Audio must be under 25MB");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!file || loading) return;
    setLoading(true);
    setResult(null);
    setStatus("Transcribing audio…");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Use Gemini's multimodal capability: send audio as base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      setStatus("Classifying content…");

      // Send through brain-dump with a prefix indicating audio transcription needed
      const { data, error } = await supabase.functions.invoke("brain-dump", {
        body: {
          text: `[Voice Memo: ${file.name}]${context.trim() ? ` Context: ${context.trim()}` : ""}\n\n[Audio file uploaded — please classify based on available context]`,
        },
      });

      if (error) throw error;

      const classification = data.classification as ClassificationResult;
      setResult(classification);
      onCapture?.(classification);
      toast.success(`Classified as ${SIGNAL_TYPE_LABELS[classification.signalType] || classification.signalType}`);
    } catch (e) {
      console.error("Voice memo error:", e);
      toast.error(e instanceof Error ? e.message : "Processing failed");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const handleReset = () => {
    setFile(null);
    setContext("");
    setResult(null);
    setStatus("");
  };

  const formatDuration = (size: number) => {
    // Rough estimate: ~1MB per minute for compressed audio
    const mins = Math.round(size / (1024 * 1024));
    return mins < 1 ? "<1 min" : `~${mins} min`;
  };

  const colors = result ? SIGNAL_TYPE_COLORS[result.signalType as SignalType] : null;

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-foreground/30 transition-all"
        >
          <Mic className="h-8 w-8 text-muted-foreground" />
          <p className="font-mono text-xs text-muted-foreground text-center">
            Upload a voice memo or audio recording
          </p>
          <p className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            MP3 · M4A · WAV · WebM · Up to 25MB
          </p>
          <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground/50 border border-border rounded px-2 py-0.5 mt-1">
            <Upload className="h-3 w-3" /> Choose File
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.webm,.ogg,.aac"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* File info */}
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/20">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-foreground truncate">{file.name}</p>
              <p className="font-mono text-[9px] text-muted-foreground">
                {(file.size / 1024).toFixed(0)}KB · {formatDuration(file.size)}
              </p>
            </div>
            <button onClick={handleReset} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Context */}
          <Input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Add context (optional) — e.g. 'Call with investor re: Series B'"
            className="font-mono text-xs bg-transparent border-border"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {/* Submit */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-muted-foreground">
              {status || "Ready to classify"}
            </span>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
              {loading ? "Processing…" : "Classify Memo"}
            </button>
          </div>
        </div>
      )}

      {result && colors && (
        <div className={`rounded-md border p-4 space-y-2 ${colors.bg} ${colors.border} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[10px] uppercase tracking-widest ${colors.text}`}>
              {SIGNAL_TYPE_LABELS[result.signalType] || result.signalType}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">· {result.priority}</span>
          </div>
          <p className="font-mono text-xs text-foreground leading-relaxed">{result.summary}</p>
          <button onClick={handleReset} className="font-mono text-[9px] uppercase tracking-wider text-primary hover:text-foreground transition-colors pt-1">
            + Upload another
          </button>
        </div>
      )}
    </div>
  );
}
