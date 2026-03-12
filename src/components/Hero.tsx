const Hero = () => {
  return (
    <section className="px-5 pt-16 pb-12 md:px-10 md:pt-24 md:pb-16 max-w-[1200px] mx-auto">
      <div className="opacity-0 animate-fade-up">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 bg-primary animate-pulse-dot" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low">
            Connectivity OS · Live Cases
          </span>
        </div>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-vanta-text-mid mb-3 opacity-0 animate-fade-up-1">
        Signal Intelligence · Agentic Orchestration
      </p>
      <h1 className="font-display text-[clamp(40px,6vw,64px)] leading-[1.05] text-foreground mb-5 opacity-0 animate-fade-up-2">
        Connectivity OS<br />in the Wild
      </h1>
      <p className="font-sans text-[15px] text-vanta-text-mid max-w-[520px] opacity-0 animate-fade-up-3">
        Real operating conditions. Real signal. How Vanta performs when it matters.
      </p>
    </section>
  );
};

export default Hero;
