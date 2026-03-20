import { useState, useRef, useCallback, useEffect } from "react";
import { Image, Upload, Loader2, X, Clipboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { SIGNAL_TYPE_COLORS, type SignalType } from "@/data/signals";

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  INTRO: "Introduction", INSIGHT: "Insight", INVESTMENT: "Investment Intel",
  DECISION: "Decision", CONTEXT: "Context", NOISE: "Noise",
};

interface ClassificationResult {
  signalType: string; priority: string; summary: string;
  suggestedTitle?: string; suggestedTags?: string[]; suggestedContacts?: string[];
  accelerators?: string[];
}

interface ImageCaptureProps {
  onCapture?: (classification: ClassificationResult) => void;
}

export default function ImageCapture({ onCapture }: ImageCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  // Clipboard paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) handleFile(new File([blob], `clipboard-${Date.now()}.png`, { type: blob.type }));
          break;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handleFile]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      if (context.trim()) formData.append("context", context.trim());

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brain-dump-image`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Classification failed" }));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data = await res.json();
      const classification = data.classification as ClassificationResult;
      setResult(classification);
      onCapture?.(classification);
      toast.success(`Classified as ${SIGNAL_TYPE_LABELS[classification.signalType] || classification.signalType}`);
    } catch (e) {
      console.error("Image capture error:", e);
      toast.error(e instanceof Error ? e.message : "Classification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setContext("");
    setResult(null);
  };

  const colors = result ? SIGNAL_TYPE_COLORS[result.signalType as SignalType] : null;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {!preview ? (
        <div
          ref={dropRef}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-foreground/30"
          }`}
        >
          <Image className="h-8 w-8 text-muted-foreground" />
          <p className="font-mono text-xs text-muted-foreground text-center">
            Drop an image, click to browse, or <span className="text-primary">Cmd+V</span> to paste
          </p>
          <p className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            Whiteboards · Screenshots · Business cards · Receipts
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground/50 border border-border rounded px-2 py-0.5">
              <Upload className="h-3 w-3" /> Browse
            </span>
            <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground/50 border border-border rounded px-2 py-0.5">
              <Clipboard className="h-3 w-3" /> Paste
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Image preview */}
          <div className="relative border border-border rounded-lg overflow-hidden">
            <img src={preview} alt="Preview" className="w-full max-h-64 object-contain bg-muted/30" />
            <button
              onClick={handleReset}
              className="absolute top-2 right-2 p-1 bg-background/80 backdrop-blur-sm rounded-full border border-border hover:bg-background transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Context input */}
          <Input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Add context (optional) — e.g. 'Meeting whiteboard with Jake'"
            className="font-mono text-xs bg-transparent border-border"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {/* Submit */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-muted-foreground">
              {file?.name} · {file ? `${(file.size / 1024).toFixed(0)}KB` : ""}
            </span>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Image className="h-3.5 w-3.5" />}
              {loading ? "Analyzing…" : "Classify Image"}
            </button>
          </div>
        </div>
      )}

      {/* Result card */}
      {result && colors && (
        <div className={`rounded-md border p-4 space-y-2 ${colors.bg} ${colors.border} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[10px] uppercase tracking-widest ${colors.text}`}>
              {SIGNAL_TYPE_LABELS[result.signalType] || result.signalType}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">· {result.priority}</span>
          </div>
          <p className="font-mono text-xs text-foreground leading-relaxed">{result.summary}</p>
          {result.suggestedTags && result.suggestedTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.suggestedTags.map((tag) => (
                <span key={tag} className="font-mono text-[9px] px-2 py-0.5 rounded-sm border border-border bg-muted/30 text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <button onClick={handleReset} className="font-mono text-[9px] uppercase tracking-wider text-primary hover:text-foreground transition-colors pt-1">
            + Capture another
          </button>
        </div>
      )}
    </div>
  );
}
