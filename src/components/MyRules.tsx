import { useState } from "react";
import { BookOpen, Zap, Palette, SlidersHorizontal } from "lucide-react";
import WorkflowBuilder from "@/components/WorkflowBuilder";
import CustomSignalTypes from "@/components/CustomSignalTypes";
import { Motion } from "@/components/ui/motion";

type RulesSection = "overview" | "workflows" | "types" | "priorities";

const SECTIONS: { key: RulesSection; label: string; icon: React.ElementType; description: string }[] = [
  { key: "workflows", label: "Automation Rules", icon: Zap, description: "Trigger actions when signals match conditions" },
  { key: "types", label: "Custom Signal Types", icon: Palette, description: "Teach the AI your own categories" },
  { key: "priorities", label: "Source Weights", icon: SlidersHorizontal, description: "Control which channels surface first" },
];

export default function MyRules() {
  const [active, setActive] = useState<RulesSection>("overview");

  return (
    <div>
      {/* Header */}
      <Motion>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-vanta-accent" />
            <h2 className="font-sans text-xl font-bold text-foreground">My Rules</h2>
          </div>
          <p className="font-mono text-[11px] text-vanta-text-muted leading-relaxed max-w-lg">
            Your personal ontology — how Vanta Signal classifies, prioritizes, and acts on your behalf.
            Customize automation rules, define custom signal types, and tune source weights in one place.
          </p>
        </div>
      </Motion>

      {active === "overview" ? (
        <Motion delay={40}>
          <div className="grid gap-3 sm:grid-cols-3">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className="group text-left p-5 border border-vanta-border bg-card hover:border-foreground/10 hover:shadow-md transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-lg bg-vanta-accent/10 flex items-center justify-center ring-1 ring-vanta-accent/20 mb-4 group-hover:scale-110 transition-transform">
                  <s.icon className="w-4 h-4 text-vanta-accent" />
                </div>
                <p className="font-mono text-[12px] font-medium text-foreground mb-1">{s.label}</p>
                <p className="font-mono text-[10px] text-vanta-text-muted leading-relaxed">{s.description}</p>
              </button>
            ))}
          </div>
        </Motion>
      ) : (
        <div>
          {/* Back button */}
          <button
            onClick={() => setActive("overview")}
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-low hover:text-vanta-accent transition-colors mb-4"
          >
            ← Back to My Rules
          </button>

          {active === "workflows" && <WorkflowBuilder />}
          {active === "types" && <CustomSignalTypes />}
          {active === "priorities" && (
            <div className="space-y-3">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-text-low mb-2 border-b border-vanta-border pb-2">
                Source Priority Weights
              </h3>
              <p className="font-mono text-[11px] text-vanta-text-muted mb-4">
                Manage these weights in the General tab under Settings → Source Priority Weights.
                Higher weight = signals from that source surface earlier in your feed.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
