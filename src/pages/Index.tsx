import { useState, useEffect, useCallback } from "react";
import { cases } from "@/data/cases";
import Nav from "@/components/Nav";
import NavDrawer from "@/components/NavDrawer";
import Hero from "@/components/Hero";
import CaseCard from "@/components/CaseCard";
import CaseCardSoon from "@/components/CaseCardSoon";
import CassetteDrawer from "@/components/CassetteDrawer";
import Overlay from "@/components/Overlay";

const Index = () => {
  const [activeCaseIndex, setActiveCaseIndex] = useState<number | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  const overlayVisible = activeCaseIndex !== null || navOpen;

  const openCase = useCallback((i: number) => {
    setActiveCaseIndex(i);
    setNavOpen(false);
    document.body.style.overflow = "hidden";
  }, []);

  const closeCase = useCallback(() => {
    setActiveCaseIndex(null);
    if (!navOpen) document.body.style.overflow = "";
  }, [navOpen]);

  const toggleNav = useCallback(() => {
    setNavOpen((prev) => {
      const next = !prev;
      if (next) {
        document.body.style.overflow = "hidden";
      } else if (activeCaseIndex === null) {
        document.body.style.overflow = "";
      }
      return next;
    });
  }, [activeCaseIndex]);

  const closeAll = useCallback(() => {
    setActiveCaseIndex(null);
    setNavOpen(false);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeAll]);

  return (
    <div className="min-h-screen bg-background">
      <Nav
        caseCount={cases.length}
        onHamburgerClick={toggleNav}
        navOpen={navOpen}
      />

      <Hero />

      <main className="px-5 pb-20 md:px-10">
        <div className="grid grid-cols-1 gap-px md:grid-cols-2 max-w-[1200px] mx-auto">
          {cases.map((c, i) => (
            <CaseCard
              key={c.id}
              caseData={c}
              index={i}
              onOpen={openCase}
              isActive={activeCaseIndex === i}
            />
          ))}
          <CaseCardSoon />
        </div>
      </main>

      <Overlay visible={overlayVisible} onClick={closeAll} />

      <CassetteDrawer
        caseData={activeCaseIndex !== null ? cases[activeCaseIndex] : null}
        onClose={closeCase}
      />

      <NavDrawer
        cases={cases}
        open={navOpen}
        onClose={() => { setNavOpen(false); if (activeCaseIndex === null) document.body.style.overflow = ""; }}
        onOpenCase={openCase}
      />

      <footer className="border-t border-vanta-border px-5 py-8 md:px-10">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted text-center">
          © 2026 Vanta Wireless. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Index;
