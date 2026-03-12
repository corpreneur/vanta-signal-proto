import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ProductSidebar } from "@/components/ProductSidebar";
import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

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
};

export default function ProductLayout({ children }: ProductLayoutProps) {
  const location = useLocation();
  const path = location.pathname;
  const breadcrumb = BREADCRUMB_MAP[path] || (path.startsWith("/case/") ? `Cases · Case ${path.replace("/case/", "")}` : "Vanta");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-vanta-bg">
        <ProductSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-50 h-12 flex items-center gap-3 border-b border-vanta-border bg-background/95 backdrop-blur-md px-4">
            <SidebarTrigger className="text-vanta-text-low hover:text-vanta-accent transition-colors">
              <PanelLeft className="h-4 w-4" />
            </SidebarTrigger>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-muted">
              {breadcrumb}
            </span>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
