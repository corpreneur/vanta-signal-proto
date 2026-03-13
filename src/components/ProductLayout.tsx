import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { ProductSidebar } from "@/components/ProductSidebar";
import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NoteCapture from "@/components/NoteCapture";

interface ProductLayoutProps {
  children: React.ReactNode;
}

const BREADCRUMB_MAP: Record<string, string> = {
  "/": "Dashboard",
  "/signals": "Platform · Signal Feed",
  "/graph": "Platform · Relationship Graph",
  "/ontology": "Platform · Ontology",
  "/phone-fmc": "Platform · Phone FMC",
  "/product/intro": "Channel · iMessage",
  "/product/phone-call": "Channel · Phone",
  "/product/meeting": "Channel · Zoom",
  "/product/email": "Channel · Email",
  "/product/calendar": "Channel · Calendar",
  "/product/insight": "Product · Insight Engine",
  "/product/investment": "Product · Investment Intel",
  "/product/decision": "Product · Decision Capture",
  "/product/context": "Platform · Context Layer",
  "/product/noise": "Platform · Noise Filter",
  "/architecture": "Platform · Architecture",
  "/brain-dump": "Brain Dump",
  "/releases": "Release Notes",
};

function HamburgerTrigger({ breadcrumb }: { breadcrumb: string }) {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      onClick={toggleSidebar}
      className="flex items-center gap-2 h-auto px-3 py-1.5 rounded-md bg-vanta-bg-elevated border border-vanta-border text-vanta-text-low hover:text-vanta-accent hover:bg-vanta-bg-elevated transition-colors"
    >
      <Menu className="h-4 w-4 shrink-0" />
      <span className="font-mono text-[10px] uppercase tracking-[0.15em]">
        {breadcrumb.split(" · ").pop()}
      </span>
    </Button>
  );
}

export default function ProductLayout({ children }: ProductLayoutProps) {
  const location = useLocation();
  const path = location.pathname;
  const breadcrumb = BREADCRUMB_MAP[path] || (path.startsWith("/case/") ? `Cases · Case ${path.replace("/case/", "")}` : "Vanta");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-vanta-bg">
        <ProductSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-50 h-12 flex items-center border-b border-vanta-border bg-background/95 backdrop-blur-md px-3">
            <HamburgerTrigger breadcrumb={breadcrumb} />
          </header>
          <main className="flex-1">
            {children}
          </main>
          <NoteCapture />
        </div>
      </div>
    </SidebarProvider>
  );
}
