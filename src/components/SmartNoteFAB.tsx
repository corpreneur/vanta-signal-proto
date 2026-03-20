import { useState, useRef, useCallback } from "react";
import { PenLine, Link2, Image, Mail, Mic, FileText, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import NoteCapture from "@/components/NoteCapture";
import ImageCapture from "@/components/ImageCapture";
import EmailCapture from "@/components/EmailCapture";
import VoiceMemoCapture from "@/components/VoiceMemoCapture";
import GranolaMeetingImport from "@/components/GranolaMeetingImport";
import { useLocation } from "react-router-dom";

type InputMode = "note" | "image" | "email" | "voice" | "granola";

const TABS: { key: InputMode; label: string; icon: React.ElementType }[] = [
  { key: "note", label: "Note", icon: PenLine },
  { key: "image", label: "Image", icon: Image },
  { key: "email", label: "Email", icon: Mail },
  { key: "voice", label: "Voice", icon: Mic },
  { key: "granola", label: "Granola", icon: FileText },
];

export default function SmartNoteFAB() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<InputMode>("note");
  const [hovered, setHovered] = useState(false);
  const location = useLocation();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setMode("voice");
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
    if (didLongPress.current) return; // already opened via long-press
    setOpen(true);
  }, []);

  // Suppress on Idea Capture page (it already has full capture UI)
  if (location.pathname === "/brain-dump") return null;

  return (
    <>
      {/* VANTA Orb FAB */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center justify-center" style={{ width: 80, height: 80 }}>
        {/* Layer 1: Glow halo */}
        <div
          className="absolute inset-0 m-auto w-14 h-14 rounded-full pointer-events-none"
          style={{ animation: "vanta-glow-pulse 3s ease-in-out infinite" }}
        />

        {/* Layer 2: Breathing aura ring */}
        <div
          className="absolute inset-0 m-auto w-[72px] h-[72px] rounded-full border-2 border-primary/30 pointer-events-none"
          style={{ animation: "vanta-breathe 3s ease-in-out infinite" }}
        />

        {/* Layer 3: Orbital dot */}
        <div
          className="absolute inset-0 m-auto w-20 h-20 pointer-events-none"
          style={{ animation: "vanta-orbit 6s linear infinite" }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"
            style={{ opacity: 0.9, boxShadow: "0 0 6px 1px hsl(var(--primary) / 0.5)" }}
          />
        </div>

        {/* Layer 4: Core button */}
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

        {/* Layer 5: Hover whisper label */}
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

      {/* Capture Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto bg-background border-t border-border">
          <SheetHeader className="pb-2">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
                Quick Capture
              </SheetTitle>
            </div>
          </SheetHeader>

          {/* Mode tabs — de-pilled per MetaLab V3 */}
          <div className="flex gap-1.5 mb-4 px-1 overflow-x-auto scrollbar-hide">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-sm border transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${
                  mode === key
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="px-1 pb-4">
            {mode === "note" && (
              <NoteCapture
                inline
                onCapture={() => {
                  setTimeout(() => setOpen(false), 1500);
                }}
              />
            )}
            {mode === "image" && (
              <ImageCapture
                onCapture={() => {
                  setTimeout(() => setOpen(false), 1500);
                }}
              />
            )}
            {mode === "email" && (
              <EmailCapture
                onCapture={() => {
                  setTimeout(() => setOpen(false), 1500);
                }}
              />
            )}
            {mode === "voice" && (
              <VoiceMemoCapture
                onCapture={() => {
                  setTimeout(() => setOpen(false), 1500);
                }}
              />
            )}
            {mode === "granola" && (
              <GranolaMeetingImport
                onCapture={() => {
                  setTimeout(() => setOpen(false), 1500);
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
