interface NavProps {
  caseCount: number;
  onHamburgerClick: () => void;
  navOpen: boolean;
}

const Nav = ({ caseCount, onHamburgerClick, navOpen }: NavProps) => {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-5 py-5 md:px-10 bg-background/95 backdrop-blur-md border-b border-vanta-border">
      <span className="font-sans text-[17px] font-extrabold tracking-[0.2em] uppercase text-foreground">
        VANTA
      </span>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[11px] text-primary px-2.5 py-1 bg-vanta-accent-bg border border-vanta-accent-border">
          {caseCount} Cases
        </span>
        <button
          onClick={onHamburgerClick}
          className="relative w-[22px] h-[18px] flex flex-col justify-between"
          aria-label="Toggle navigation"
        >
          <span
            className={`block w-full h-[2px] bg-foreground transition-transform duration-300 ease-in-out origin-center ${
              navOpen ? "translate-y-[8px] rotate-45" : ""
            }`}
          />
          <span
            className={`block w-full h-[2px] bg-foreground transition-opacity duration-300 ${
              navOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`block w-full h-[2px] bg-foreground transition-transform duration-300 ease-in-out origin-center ${
              navOpen ? "-translate-y-[8px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>
    </nav>
  );
};

export default Nav;
