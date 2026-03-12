import { useParams, Navigate } from "react-router-dom";
import { cases } from "@/data/cases";
import CaseThread from "@/components/case-parts/CaseThread";
import CaseSteps from "@/components/case-parts/CaseSteps";
import CaseQuote from "@/components/case-parts/CaseQuote";
import CaseCallout from "@/components/case-parts/CaseCallout";
import CaseTags from "@/components/case-parts/CaseTags";
import SignalArchitecture from "@/components/SignalArchitecture";


const CasePage = () => {
  const { id } = useParams<{ id: string }>();
  const caseData = cases.find((c) => c.id === id);

  if (!caseData) return <Navigate to="/" replace />;

    return (

      <article className="max-w-[720px] mx-auto px-5 py-12 md:px-10 md:py-20">
        {/* Header */}
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">
          {caseData.num}
        </p>
        <h1 className="font-display text-[clamp(32px,5vw,48px)] text-foreground mb-2">
          {caseData.name}
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-vanta-text-low mb-8">
          {caseData.cat}
        </p>

        {/* Hero Quote */}
        <div className="mb-10 border-l-2 border-primary pl-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary mb-2">
            {caseData.heroQuote.label}
          </p>
          <p className="font-display text-[20px] italic text-foreground leading-relaxed">
            "{caseData.heroQuote.text}"
          </p>
          <p className="font-sans text-[12px] text-vanta-text-low mt-2">
            {caseData.heroQuote.attr}
          </p>
        </div>

        {/* Situation */}
        <div className="mb-10">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-3">
            Situation
          </p>
          {caseData.situation.map((p, i) => (
            <p key={i} className="font-sans text-[14px] text-vanta-text-mid leading-relaxed mb-3">
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
              return <hr key={i} className="border-vanta-border my-10" />;
            case "signal-architecture":
              return <SignalArchitecture key={i} />;
            case "bio":
              return (
                <div key={i} className="mb-10">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">
                    {section.label}
                  </p>
                  <div className="space-y-3 border border-vanta-border p-5">
                    {section.bioItems?.map((item, j) => (
                      <div key={j}>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary mb-0.5">
                          {item.key}
                        </p>
                        <p className="font-sans text-[14px] text-vanta-text-mid leading-relaxed">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            case "meeting-prep":
              return (
                <div key={i} className="mb-10">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">
                    {section.label}
                  </p>
                  <div className="space-y-4">
                    {section.prepItems?.map((item, j) => (
                      <div key={j} className="flex gap-3">
                        <span className="font-mono text-[11px] text-primary mt-0.5">{item.n}</span>
                        <div>
                          <p className="font-sans text-[14px] text-foreground font-medium mb-1">{item.title}</p>
                          <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
      </article>
    </>
  );
};

export default CasePage;
