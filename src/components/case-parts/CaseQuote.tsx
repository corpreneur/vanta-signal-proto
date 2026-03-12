import type { Quote } from "@/data/cases";

interface CaseQuoteProps {
  quote: Quote;
}

const CaseQuote = ({ quote }: CaseQuoteProps) => {
  return (
    <div className="mb-8 border-l-2 border-vanta-accent-border pl-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-vanta-text-low mb-2">
        {quote.label}
      </p>
      <p className="font-display text-[17px] italic text-foreground leading-relaxed">
        "{quote.text}"
      </p>
      <p className="font-sans text-[11px] text-vanta-text-low mt-2">
        {quote.attr}
      </p>
    </div>
  );
};

export default CaseQuote;
