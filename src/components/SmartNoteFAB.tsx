import { useState, useRef, useCallback, useEffect } from "react";
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

  // --- Draggable orb state ---
  const [orbPos, setOrbPos] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef<{ x: number; y: number; orbX: number; orbY: number } | null>(null);
  const dragMoved = useRef(false);

  // Scroll-responsive drift: orb gently floats with scroll direction
  const [scrollDrift, setScrollDrift] = useState(0);
  const lastScrollY = useRef(0);
  const driftTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (isDragging.current) return;
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;
      setScrollDrift((prev) => Math.max(-6, Math.min(6, prev + delta * 0.15)));
      if (driftTimeout.current) clearTimeout(driftTimeout.current);
      driftTimeout.current = setTimeout(() => setScrollDrift(0), 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Touch drag handlers for iOS
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const currentX = orbPos?.x ?? window.innerWidth / 2;
    const currentY = orbPos?.y ?? window.innerHeight - 60;
    dragStart.current = { x: touch.clientX, y: touch.clientY, orbX: currentX, orbY: currentY };
    dragMoved.current = false;
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      if (!dragMoved.current) setOpen(true);
    }, 500);
  }, [orbPos]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStart.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;
    if (!isDragging.current && Math.abs(dx) + Math.abs(dy) > 8) {
      isDragging.current = true;
      dragMoved.current = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
    if (isDragging.current) {
      e.preventDefault();
      const newX = Math.max(40, Math.min(window.innerWidth - 40, dragStart.current.orbX + dx));
      const newY = Math.max(40, Math.min(window.innerHeight - 40, dragStart.current.orbY + dy));
      setOrbPos({ x: newX, y: newY });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    isDragging.current = false;
    dragStart.current = null;
  }, []);

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
    if (didLongPress.current || dragMoved.current) {
      dragMoved.current = false;
      return;
    }
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
      {/* VANTA Orb FAB — translucent glass */}
      <div
        className="fixed z-40 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: 80,
          height: 80,
          ...(orbPos
            ? {
                left: orbPos.x,
                top: orbPos.y,
                transform: `translate(-50%, -50%)`,
                transition: isDragging.current ? "none" : "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }
            : {
                bottom: 20,
                left: "50%",
                transform: `translateX(-50%) translateY(${scrollDrift}px)`,
                transition: "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }),
          touchAction: "none",
        }}
      >
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 m-auto w-16 h-16 rounded-full pointer-events-none"
          style={{ animation: "vanta-glow-pulse 3s ease-in-out infinite" }}
        />
        {/* Breathing halo */}
        <div
          className="absolute inset-0 m-auto w-[72px] h-[72px] rounded-full border border-primary/20 pointer-events-none"
          style={{ animation: "vanta-breathe 3s ease-in-out infinite" }}
        />
        {/* Orbiting dot */}
        <div
          className="absolute inset-0 m-auto w-20 h-20 pointer-events-none"
          style={{ animation: "vanta-orbit 6s linear infinite" }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary"
            style={{ opacity: 0.7, boxShadow: "0 0 4px 1px hsl(var(--primary) / 0.4)" }}
          />
        </div>

        <button
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 border border-primary/25 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--primary) / 0.06) 100%)",
            backdropFilter: "blur(16px) saturate(1.4)",
            WebkitBackdropFilter: "blur(16px) saturate(1.4)",
            boxShadow: "0 8px 32px -4px hsl(var(--primary) / 0.15), inset 0 1px 0 0 hsl(var(--primary) / 0.1)",
          }}
          aria-label="Quick Capture — long press for voice"
        >
          {/* Inner glass highlight */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 40% at 35% 25%, hsl(var(--primary) / 0.15), transparent)",
            }}
          />

          {/* V monogram — visible by default, fades on hover */}
          <span
            className="absolute font-mono font-bold text-lg tracking-tight transition-all duration-300 select-none"
            style={{
              color: "hsl(var(--primary))",
              opacity: hovered ? 0 : 0.8,
              transform: hovered ? "scale(0.6) rotate(12deg)" : "scale(1) rotate(0deg)",
              textShadow: "0 0 12px hsl(var(--primary) / 0.3)",
            }}
          >
            V
          </span>

          {/* Note icon — appears on hover */}
          <PenLine
            className="absolute w-4.5 h-4.5 transition-all duration-300"
            style={{
              color: "hsl(var(--primary))",
              opacity: hovered ? 0.9 : 0,
              transform: hovered ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(-12deg)",
              filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.3))",
            }}
          />
        </button>

        {/* CAPTURE whisper label */}
        <span
          className="absolute -bottom-1 left-1/2 font-mono text-[8px] uppercase tracking-[0.25em] transition-all duration-300 pointer-events-none whitespace-nowrap"
          style={{
            color: "hsl(var(--primary) / 0.5)",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateX(-50%) translateY(6px)" : "translateX(-50%) translateY(0)",
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
