import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Image, Link2, X, Loader2 } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";

interface UnifiedCaptureInputProps {
  onSubmit: (payload: CapturePayload) => void;
  loading?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export interface CapturePayload {
  type: "text" | "image" | "url";
  text: string;
  imageFile?: File;
  imagePreview?: string;
}

export default function UnifiedCaptureInput({
  onSubmit,
  loading = false,
  placeholder = "Drop anything here — a name, a screenshot, a fragment of an idea…",
  compact = false,
}: UnifiedCaptureInputProps) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, isSupported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

  // Auto-detect pasted images or URLs
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
          }
          return;
        }
      }
    },
    [],
  );

  // Drag-and-drop images
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (loading) return;

    if (imageFile) {
      onSubmit({ type: "image", text: trimmed, imageFile, imagePreview: imagePreview || undefined });
    } else if (trimmed) {
      // Simple URL detection
      const isUrl = /^https?:\/\/\S+$/i.test(trimmed);
      onSubmit({ type: isUrl ? "url" : "text", text: trimmed });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening((transcript) => setText(transcript));
    }
  };

  const hasContent = text.trim().length > 0 || imageFile !== null;

  return (
    <div
      className={cn(
        "relative border transition-all duration-300",
        dragOver
          ? "border-primary bg-primary/5"
          : "border-border bg-card",
        loading && "opacity-60 pointer-events-none",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Image preview chip */}
      {imagePreview && (
        <div className="px-4 pt-3 flex items-center gap-2">
          <div className="relative w-12 h-12 rounded-sm overflow-hidden border border-border">
            <img src={imagePreview} alt="Attached" className="w-full h-full object-cover" />
            <button
              onClick={clearImage}
              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
            Image attached
          </span>
        </div>
      )}

      {/* Main textarea */}
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={loading}
        rows={compact ? 1 : 2}
        className={cn(
          "w-full bg-transparent resize-none font-sans text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 px-4 py-3",
          compact && "py-2.5",
          isListening && "text-primary",
        )}
        style={{ minHeight: compact ? 40 : 60 }}
      />

      {/* Bottom bar: helpers + submit */}
      <div className="flex items-center justify-between px-3 pb-2.5 pt-0">
        {/* Input helpers */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
            aria-label="Attach image"
          >
            <Image className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }
            }}
          />
          {isSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              className={cn(
                "p-1.5 transition-colors active:scale-95",
                isListening
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          {isListening && (
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-primary animate-pulse ml-1">
              Listening…
            </span>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
          {!loading && hasContent && (
            <button
              onClick={handleSubmit}
              className="font-mono text-[9px] uppercase tracking-[0.15em] text-primary hover:text-primary/80 transition-colors active:scale-95 px-2 py-1"
            >
              Process
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
