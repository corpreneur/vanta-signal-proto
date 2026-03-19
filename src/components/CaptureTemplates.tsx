import { useState } from "react";
import { FileText, Users, TrendingUp, Handshake, Scale } from "lucide-react";

export interface CaptureTemplate {
  key: string;
  label: string;
  icon: React.ElementType;
  skeleton: string;
}

export const CAPTURE_TEMPLATES: CaptureTemplate[] = [
  { key: "freeform", label: "Free Form", icon: FileText, skeleton: "" },
  {
    key: "meeting",
    label: "Meeting Notes",
    icon: Users,
    skeleton: "Attendees:\n\nKey Points:\n\nDecisions:\n\nNext Steps:",
  },
  {
    key: "investment",
    label: "Investment Memo",
    icon: TrendingUp,
    skeleton: "Company:\n\nStage:\n\nAsk:\n\nThesis:\n\nRisks:",
  },
  {
    key: "intro",
    label: "Intro Brief",
    icon: Handshake,
    skeleton: "Who:\n\nContext:\n\nAsk:\n\nRelevance:",
  },
  {
    key: "decision",
    label: "Decision Log",
    icon: Scale,
    skeleton: "Decision:\n\nContext:\n\nOptions Considered:\n\nOutcome:",
  },
];

interface CaptureTemplatesProps {
  selected: string;
  onSelect: (template: CaptureTemplate) => void;
}

export default function CaptureTemplates({ selected, onSelect }: CaptureTemplatesProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {CAPTURE_TEMPLATES.map((t) => {
        const Icon = t.icon;
        const active = selected === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onSelect(t)}
            className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] px-3 py-1.5 rounded-full border transition-all duration-200 ${
              active
                ? "bg-primary/10 border-primary text-primary"
                : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            <Icon className="h-3 w-3" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
