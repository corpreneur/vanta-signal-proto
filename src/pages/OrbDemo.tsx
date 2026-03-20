import { useState } from "react";
import { PenLine } from "lucide-react";

export default function OrbDemo() {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="min-h-screen bg-vanta-bg flex flex-col items-center justify-center gap-12 px-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="font-mono text-xs uppercase tracking-[0.25em] text-vanta-text-low">
          VANTA Orb — Design Spec
        </h1>
        <p className="font-mono text-[10px] text-vanta-text-muted max-w-md">
          Breathing aura · Orbital dot · Glow halo · Hover whisper
        </p>
      </div>

      {/* Orb showcase */}
      <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
        {/* Layer 1: Glow halo */}
        <div
          className="absolute inset-0 m-auto w-14 h-14 rounded-full"
          style={{ animation: "vanta-glow-pulse 3s ease-in-out infinite" }}
        />

        {/* Layer 2: Breathing aura ring */}
        <div
          className="absolute inset-0 m-auto w-[72px] h-[72px] rounded-full border-2 border-primary/30"
          style={{ animation: "vanta-breathe 3s ease-in-out infinite" }}
        />

        {/* Layer 3: Orbital dot */}
        <div
          className="absolute inset-0 m-auto w-20 h-20"
          style={{ animation: "vanta-orbit 6s linear infinite" }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"
            style={{ opacity: 0.9, boxShadow: "0 0 6px 1px hsl(var(--primary) / 0.5)" }}
          />
        </div>

        {/* Layer 4: Core button */}
        <button
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative z-10 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          <PenLine className="w-5 h-5 transition-transform duration-300" style={{ transform: hovered ? "rotate(-8deg)" : "none" }} />
        </button>

        {/* Layer 5: Hover whisper label */}
        <span
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.2em] text-primary/70 transition-all duration-300 pointer-events-none whitespace-nowrap"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateX(-50%) translateY(4px)" : "translateX(-50%) translateY(0)",
          }}
        >
          Capture
        </span>
      </div>

      {/* Spec breakdown */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-w-sm">
        {[
          { label: "Breathing Aura", desc: "Scale 1→1.15, fade 0.4→0.15, 3s loop" },
          { label: "Orbital Dot", desc: "6px accent, 360° orbit, 6s linear" },
          { label: "Glow Halo", desc: "Box-shadow pulse 16px→28px, 3s" },
          { label: "Hover Whisper", desc: '"Capture" label, mono 9px, fade-in' },
          { label: "DND Suppress", desc: "Hidden when user mode = DND" },
          { label: "Page Suppress", desc: "Hidden on /brain-dump" },
        ].map(({ label, desc }) => (
          <div key={label}>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-accent">{label}</p>
            <p className="font-mono text-[9px] text-vanta-text-low leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
