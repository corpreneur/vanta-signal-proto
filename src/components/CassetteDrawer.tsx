import type { CaseData } from "@/data/cases";
import CaseThread from "@/components/case-parts/CaseThread";
import CaseSteps from "@/components/case-parts/CaseSteps";
import CaseQuote from "@/components/case-parts/CaseQuote";
import CaseCallout from "@/components/case-parts/CaseCallout";
import CaseTags from "@/components/case-parts/CaseTags";

interface CassetteDrawerProps {
  caseData: CaseData | null;
  onClose: () => void;
}

const CassetteDrawer = ({ caseData, onClose }: CassetteDrawerProps) => {
  const open = caseData !== null;

  return (
    <div
      className={`fixed top-0 right-0 z-50 h-full w-full max-w-[520px] bg-background border-l border-vanta-border overflow-y-auto transition-transform duration-[400ms] ease-drawer ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {caseData && (
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">
                {caseData.num}
              </p>
              <h2 className="font-display text-[28px] text-foreground">{caseData.name}</h2>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-vanta-text-low mt-1">
                {caseData.cat}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-foreground/60 hover:text-foreground text-2xl leading-none mt-1 transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Hero Quote */}
          <div className="mb-8 border-l-2 border-primary pl-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary mb-2">
              {caseData.heroQuote.label}
            </p>
            <p className="font-display text-[17px] italic text-foreground leading-relaxed">
              "{caseData.heroQuote.text}"
            </p>
            <p className="font-sans text-[11px] text-vanta-text-low mt-2">
              {caseData.heroQuote.attr}
            </p>
          </div>

          {/* Situation */}
          <div className="mb-8">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-3">
              Situation
            </p>
            {caseData.situation.map((p, i) => (
              <p key={i} className="font-sans text-[13px] text-vanta-text-mid leading-relaxed mb-3">
                {p}
              </p>
            ))}
          </div>

          {/* Thread */}
          <CaseThread thread={caseData.thread} />

          {/* Sections */}
          {caseData.sections.map((section, i) => {
            switch (section.type) {
              case "steps":
              case "five-layers":
                return <CaseSteps key={i} label={section.label || ""} steps={section.steps || []} />;
              case "quote":
                return section.quote ? <CaseQuote key={i} quote={section.quote} /> : null;
              case "hr":
                return <hr key={i} className="border-vanta-border my-8" />;
              case "signal-architecture":
                return (
                  <div key={i} className="mb-8 p-5 bg-vanta-accent-faint border border-vanta-accent-border">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary mb-2">
                      Signal Architecture
                    </p>
                    <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed">
                      Vanta is engineering automatic signal detection across every connected source — so every introduction becomes an orchestrated sequence before you open the thread.
                    </p>
                  </div>
                );
              default:
                return null;
            }
          })}

          {/* Callout */}
          <CaseCallout callout={caseData.callout} />

          {/* Tags */}
          <CaseTags tags={caseData.tags} />

          {/* Footer link */}
          <div className="mt-8 pt-6 border-t border-vanta-border">
            <a
              href={caseData.standaloneHref}
              className="font-sans text-[13px] text-vanta-text-low hover:text-foreground transition-colors"
            >
              View Full Page ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default CassetteDrawer;
