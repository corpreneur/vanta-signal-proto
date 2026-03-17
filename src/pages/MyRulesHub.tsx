import { useState } from "react";
import { BookOpen, Zap, Palette, SlidersHorizontal, ArrowLeft, Shield } from "lucide-react";
import WorkflowBuilder from "@/components/WorkflowBuilder";
import CustomSignalTypes from "@/components/CustomSignalTypes";
import SourcePriorityWeights from "@/components/SourcePriorityWeights";
import { Motion } from "@/components/ui/motion";

type Section = "overview" | "workflows" | "types" | "weights";

const SECTIONS: { key: Section; label: string; icon: React.ElementType; description: string; detail: string }[] = [
  {
    key: "workflows",
    label: "Automation Rules",
    icon: Zap,
    description: "If-then rules that fire when signals match your conditions.",
    detail: "Auto-pin high-priority intros, create follow-up reminders, or complete signals by type.",
  },
  {
    key: "types",
    label: "Custom Signal Types",
    icon: Palette,
    description: "Teach the AI your own signal categories.",
    detail: "Define custom types with colors, descriptions, and training examples so the classifier adapts to your world.",
  },
  {
    key: "weights",
    label: "Source Priority Weights",
    icon: SlidersHorizontal,
    description: "Control which channels surface first in your feed.",
    detail: "Weight each source (1–3). Higher weight = signals from that channel appear earlier and rank higher.",
  },
];

export default function MyRulesHub() {
  const [active, setActive] = useState<Section>("overview");

  return (
    <div className="max-w-[960px] mx-auto px-0 pt-0 pb-16">
      <Motion>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse-dot" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Personal Ontology · Intelligence Configuration
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-vanta-accent" />
            <div>
              <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-tight">
                My Rules
              </h1>
              <p className="text-muted-foreground text-xs font-mono mt-1 max-w-xl">
                Your personal ontology — how Vanta classifies, prioritizes, and acts on your behalf.
                All automation, custom types, and source weights in one place.
              </p>
            </div>
          </div>
        </header>
      </Motion>

      {active === "overview" ? (
        <Motion delay={40}>
          {/* Stats banner */}
          <div className="grid grid-cols-3 gap-px border border-vanta-border bg-vanta-border mb-8">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className="group text-left p-6 bg-card hover:bg-vanta-bg-elevated transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-vanta-accent/10 flex items-center justify-center ring-1 ring-vanta-accent/20 mb-4 group-hover:scale-110 transition-transform">
                  <s.icon className="w-5 h-5 text-vanta-accent" />
                </div>
                <p className="font-mono text-[13px] font-medium text-foreground mb-1">{s.label}</p>
                <p className="font-mono text-[10px] text-vanta-text-muted leading-relaxed mb-3">{s.description}</p>
                <p className="font-mono text-[9px] text-vanta-text-low leading-relaxed">{s.detail}</p>
              </button>
            ))}
          </div>

          {/* Quick summary */}
          <div className="border border-vanta-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-vanta-accent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-low">
                How It Works
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-[11px] font-mono text-vanta-text-mid leading-relaxed">
              <div>
                <p className="text-foreground font-medium mb-1">1. Define Types</p>
                <p className="text-vanta-text-muted">Create custom signal categories with training examples. The AI classifier adapts to your ontology.</p>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">2. Weight Sources</p>
                <p className="text-vanta-text-muted">Prioritize channels that matter. Higher weight = signals surface earlier in your feed.</p>
              </div>
              <div>
                <p className="text-foreground font-medium mb-1">3. Automate Actions</p>
                <p className="text-vanta-text-muted">Set rules that fire automatically — pin, remind, complete — based on type, priority, or sender.</p>
              </div>
            </div>
          </div>
        </Motion>
      ) : (
        <Motion>
          <button
            onClick={() => setActive("overview")}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-low hover:text-vanta-accent transition-colors mb-6"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to My Rules
          </button>

          {active === "workflows" && <WorkflowBuilder />}
          {active === "types" && <CustomSignalTypes />}
          {active === "weights" && <SourcePriorityWeights />}
        </Motion>
      )}
    </div>
  );
}
