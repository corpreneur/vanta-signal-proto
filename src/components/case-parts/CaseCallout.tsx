interface CaseCalloutProps {
  callout: { main: string; sub: string };
}

const CaseCallout = ({ callout }: CaseCalloutProps) => {
  return (
    <div className="mb-8 p-5 bg-vanta-accent-faint border border-vanta-accent-border">
      <p className="font-sans text-[13px] font-bold text-foreground mb-2">
        {callout.main}
      </p>
      <p className="font-sans text-[13px] text-vanta-text-mid leading-relaxed">
        {callout.sub}
      </p>
    </div>
  );
};

export default CaseCallout;
