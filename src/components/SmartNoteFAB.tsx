import { useState } from "react";
import { PenLine, Link2, Image, Mail, Mic, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import NoteCapture from "@/components/NoteCapture";
import ImageCapture from "@/components/ImageCapture";
import EmailCapture from "@/components/EmailCapture";
import VoiceMemoCapture from "@/components/VoiceMemoCapture";
import { useLocation } from "react-router-dom";

type InputMode = "note" | "image" | "link" | "email" | "voice";

const TABS: { key: InputMode; label: string; icon: React.ElementType }[] = [
  { key: "note", label: "Note", icon: PenLine },
  { key: "image", label: "Image", icon: Image },
  { key: "email", label: "Email", icon: Mail },
  { key: "voice", label: "Voice", icon: Mic },
];

export default function SmartNoteFAB() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<InputMode>("note");
  const location = useLocation();

  // Suppress on Idea Capture page (it already has full capture UI)
  if (location.pathname === "/brain-dump") return null;

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-105 active:scale-95"
        aria-label="Quick Capture"
      >
        <div className="relative">
          <PenLine className="w-5 h-5 transition-transform group-hover:rotate-[-8deg]" />
          {/* Breathing aura */}
          <div
            className="absolute inset-0 rounded-full border-2 border-primary/30 pointer-events-none"
            style={{ animation: "vanta-breathe 3s ease-in-out infinite", margin: "-8px" }}
          />
        </div>
      </button>

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

          {/* Mode tabs */}
          <div className="flex gap-1.5 mb-4 px-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border transition-all duration-200 flex items-center gap-1 ${
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
