import type { CaseData } from "@/data/cases";

interface NavDrawerProps {
  cases: CaseData[];
  open: boolean;
  onClose: () => void;
  onOpenCase: (i: number) => void;
}

const NavDrawer = ({ cases, open, onClose, onOpenCase }: NavDrawerProps) => {
  return (
    <div
      className={`fixed top-0 right-0 z-50 h-full w-full max-w-[360px] bg-background border-l border-vanta-border overflow-y-auto transition-transform duration-[400ms] ease-drawer ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse-dot" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low">
              Use Cases
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground text-2xl leading-none transition-colors"
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <ul className="space-y-1">
          {cases.map((c, i) => (
            <li key={c.id} className="border-b border-vanta-border-mid">
              <button
                onClick={() => { onOpenCase(i); onClose(); }}
                className="w-full text-left py-4 group"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-1">
                  {c.num}
                </p>
                <p className="font-display text-[20px] text-foreground group-hover:text-primary transition-colors">
                  {c.name}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NavDrawer;
