import { useState, useRef, useCallback } from "react";
import { PenLine, Image, Mic, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import UnifiedCaptureInput, { type CapturePayload } from "@/components/UnifiedCaptureInput";
import CaptureProcessingReveal from "@/components/CaptureProcessingReveal";

const SIGNAL_LABELS: Record<string, string> = {
  INTRO: "Introduction", INSIGHT: "Insight", INVESTMENT: "Investment Intel",
  DECISION: "Decision", CONTEXT: "Context", NOISE: "Noise",
  MEETING: "Meeting", PHONE_CALL: "Phone Call",
};

export default function SmartNoteFAB() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState("");
  const [result, setResult] = useState<{
    signalType: string; priority: string; summary: string;
    suggestedTitle?: string; suggestedTags?: string[];
    suggestedContacts?: string[]; accelerators?: string[];
  } | null>(null);

  const location = useLocation();
  const queryClient = useQueryClient();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setOpen(true);
    }, 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (didLongPress.current) return;
    setOpen(true);
  }, []);

  const handleSubmit = async (payload: CapturePayload) => {
    if (loading) return;
    setLoading(true);
    setRawText(payload.text || "(image capture)");
    setResult(null);

    try {
      let data: any = null;
      let error: any = null;

      if (payload.type === "image" && payload.imageFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(payload.imageFile!);
        });
        const resp = await supabase.functions.invoke("brain-dump-image", {
          body: { image: base64, context: payload.text || "" },
        });
        data = resp.data;
        error = resp.error;
      } else {
        const resp = await supabase.functions.invoke("brain-dump", {
          body: payload.type === "url" ? { url: payload.text } : { text: payload.text },
        });
        data = resp.data;
        error = resp.error;
      }

      if (error) throw error;

      const classification = data?.classification;
      if (classification) {
        await new Promise((r) => setTimeout(r, 300));
        setResult(classification);
        queryClient.invalidateQueries({ queryKey: ["signals-dashboard"] });
        toast.success(
          `Signal detected · ${SIGNAL_LABELS[classification.signalType] || classification.signalType}`
        );
      }
    } catch (err) {
      console.error("Capture error:", err);
      toast.error("Failed to process — try again");
      setResult(null);
      setRawText("");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setResult(null);
    setRawText("");
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when sheet closes
      setTimeout(() => {
        setResult(null);
        setRawText("");
        setLoading(false);
      }, 300);
    }
  };

  // Suppress on Idea Capture page
  if (location.pathname === "/brain-dump") return null;

  return (
    <>
      {/* VANTA Orb FAB */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center justify-center" style={{ width: 80, height: 80 }}>
        <div
          className="absolute inset-0 m-auto w-14 h-14 rounded-full pointer-events-none"
          style={{ animation: "vanta-glow-pulse 3s ease-in-out infinite" }}
        />
        <div
          className="absolute inset-0 m-auto w-[72px] h-[72px] rounded-full border-2 border-primary/30 pointer-events-none"
          style={{ animation: "vanta-breathe 3s ease-in-out infinite" }}
        />
        <div
          className="absolute inset-0 m-auto w-20 h-20 pointer-events-none"
          style={{ animation: "vanta-orbit 6s linear infinite" }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"
            style={{ opacity: 0.9, boxShadow: "0 0 6px 1px hsl(var(--primary) / 0.5)" }}
          />
        </div>

        <button
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative z-10 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95"
          aria-label="Quick Capture — long press for voice"
        >
          <PenLine className="w-5 h-5 transition-transform duration-300" style={{ transform: hovered ? "rotate(-8deg)" : "none" }} />
        </button>

        <span
          className="absolute -bottom-1 left-1/2 font-mono text-[9px] uppercase tracking-[0.2em] text-primary/70 transition-all duration-300 pointer-events-none whitespace-nowrap"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateX(-50%) translateY(4px)" : "translateX(-50%) translateY(0)",
          }}
        >
          Capture
        </span>
      </div>

      {/* Capture Sheet — unified surface */}
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto bg-background border-t border-border">
          <SheetHeader className="pb-2">
            <SheetTitle className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              Quick Capture
            </SheetTitle>
          </SheetHeader>

          <div className="px-1 pb-4">
            {result || loading ? (
              <CaptureProcessingReveal
                rawText={rawText}
                result={result}
                processing={loading}
                onDismiss={handleDismiss}
              />
            ) : (
              <UnifiedCaptureInput
                onSubmit={handleSubmit}
                loading={loading}
                placeholder="Drop anything here — a name, a screenshot, a fragment of an idea…"
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
