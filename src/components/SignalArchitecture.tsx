const layers = [
  { id: "01", label: "Signal Detection", desc: "iMessage · Email · Calendar", side: "input" },
  { id: "02", label: "Context Parsing", desc: "Thread analysis · Entity extraction", side: "process" },
  { id: "03", label: "Intelligence Layer", desc: "Bio research · Meeting prep · Relationship mapping", side: "process" },
  { id: "04", label: "Action Engine", desc: "Email drafting · Calendar coordination · Outreach", side: "process" },
  { id: "05", label: "Persistent Agent", desc: "Living context · Continuous updates · Memory", side: "output" },
];

const SignalArchitecture = () => {
  return (
    <div className="mb-8">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">
        Signal Architecture
      </p>
      <div className="border border-vanta-border p-5 space-y-0">
        {/* Flow diagram */}
        <div className="space-y-0">
          {layers.map((layer, i) => (
            <div key={layer.id} className="relative">
              {/* Connector line */}
              {i > 0 && (
                <div className="flex justify-center -mt-px">
                  <div className="w-px h-5 bg-vanta-accent-border" />
                </div>
              )}
              {/* Arrow */}
              {i > 0 && (
                <div className="flex justify-center -mt-1 mb-1">
                  <svg width="10" height="6" viewBox="0 0 10 6" className="text-primary">
                    <path d="M0 0 L5 6 L10 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
              {/* Layer box */}
              <div
                className={`flex items-center gap-4 p-3 border transition-colors ${
                  i === 0
                    ? "border-primary bg-vanta-accent-faint"
                    : i === layers.length - 1
                      ? "border-primary bg-vanta-accent-faint"
                      : "border-vanta-border bg-card"
                }`}
              >
                <span className="font-mono text-[11px] text-primary shrink-0 w-5">{layer.id}</span>
                <div className="min-w-0">
                  <p className="font-sans text-[13px] font-bold text-foreground">{layer.label}</p>
                  <p className="font-mono text-[10px] text-vanta-text-low mt-0.5">{layer.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Caption */}
        <div className="pt-5">
          <p className="font-sans text-[12px] text-vanta-text-mid leading-relaxed italic">
            Every introduction becomes an orchestrated sequence… from raw signal to persistent agent… before you open the thread.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignalArchitecture;
