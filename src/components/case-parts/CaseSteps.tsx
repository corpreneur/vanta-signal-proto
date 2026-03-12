import type { Step } from "@/data/cases";

interface CaseStepsProps {
  label: string;
  steps: Step[];
}

const CaseSteps = ({ label, steps }: CaseStepsProps) => {
  return (
    <div className="mb-8">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">
        {label}
      </p>
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-4">
            <span className="font-mono text-[11px] text-primary shrink-0 mt-0.5 w-5">
              {step.n}
            </span>
            <div>
              <p className="font-sans text-[13px] font-bold text-foreground mb-1">
                {step.title}
              </p>
              <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaseSteps;
