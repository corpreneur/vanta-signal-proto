import type { CaseData } from "@/data/cases";

interface CaseCardProps {
  caseData: CaseData;
  index: number;
  onOpen: (i: number) => void;
  isActive: boolean;
}

const CaseCard = ({ caseData, index, onOpen, isActive }: CaseCardProps) => {
  return (
    <article
      onClick={() => onOpen(index)}
      className={`group cursor-pointer bg-card border border-vanta-border p-6 md:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/[0.14] ${
        isActive ? "border-l-[3px] border-l-primary bg-vanta-accent-faint" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary px-2 py-0.5 bg-vanta-accent-bg border border-vanta-accent-border">
          {caseData.cardCat}
        </span>
      </div>

      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-2">
        {caseData.num}
      </p>

      <h2 className="font-display text-[clamp(22px,3vw,32px)] text-foreground mb-3">
        {caseData.name}
      </h2>

      <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed mb-5">
        {caseData.cardDesc}
      </p>

      <div className="border-t border-vanta-border-mid pt-4 mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-vanta-text-low mb-1">
          {caseData.cardSignal.label}
        </p>
        <p className="font-display text-[15px] italic text-vanta-text-mid leading-snug">
          {caseData.cardSignal.text}
        </p>
      </div>

      <div className="flex items-center gap-6 text-vanta-text-muted font-mono text-[10px] uppercase tracking-[0.1em] mb-4">
        <span>
          Layer <span className="text-vanta-text-low ml-1">{caseData.cardMeta.layer}</span>
        </span>
        <span>
          Output <span className="text-vanta-text-low ml-1">{caseData.cardMeta.output}</span>
        </span>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(index); }}
          className="font-sans text-[13px] text-primary hover:underline"
        >
          Read Case →
        </button>
        <a
          href={caseData.standaloneHref}
          onClick={(e) => e.stopPropagation()}
          className="font-sans text-[13px] text-vanta-text-low hover:text-foreground transition-colors"
        >
          Full Page ↗
        </a>
      </div>
    </article>
  );
};

export default CaseCard;
