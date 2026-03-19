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
    <div className="max-w-[960px] mx-auto px-4 pt-6 pb-16">
      <Motion>
        <header className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-tight">
            My Rules
          </h1>
          <p className="text-muted-foreground text-xs font-mono mt-1.5 max-w-md">
            Your personal ontology. How Vanta classifies, prioritizes, and acts on your behalf.
          </p>
        </header>
      </Motion>

      {active === "overview" ? (
        <Motion delay={40}>
          {/* Cards grid — stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className="group text-left p-5 bg-card border border-border hover:border-foreground/20 rounded-lg transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <s.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-sans text-[14px] font-medium text-foreground mb-1">{s.label}</p>
                <p className="font-mono text-[10px] text-muted-foreground leading-relaxed mb-2">{s.description}</p>
                <p className="font-mono text-[9px] text-muted-foreground/70 leading-relaxed">{s.detail}</p>
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
