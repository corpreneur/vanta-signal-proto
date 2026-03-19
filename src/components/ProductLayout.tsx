import { useState } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { ProductSidebar } from "@/components/ProductSidebar";
import { Menu, User } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SmartNoteFAB from "@/components/SmartNoteFAB";
import ProfileMenuDrawer from "@/components/ProfileMenuDrawer";

interface ProductLayoutProps {
  children: React.ReactNode;
}

const BREADCRUMB_MAP: Record<string, string> = {
  "/": "Dashboard",
  "/connectivity": "Fab Five · Connectivity",
  "/signals": "Fab Five · Signal Feed",
  "/focus": "Fab Five · Filter Modes",
  "/brain-dump": "Fab Five · Idea Capture",
  "/command": "Fab Five · Easy Actions",
  "/contacts": "Product · Smart Contacts",
  "/graph": "Product · Relationship Graph",
  "/insights": "Product · Insight Engine",
  "/investments": "Product · Investment Intel",
  "/decisions": "Product · Decision Capture",
  "/product/intro": "Channel · iMessage",
  "/product/phone-call": "Channel · Phone",
  "/product/meeting": "Channel · Zoom",
  "/product/email": "Channel · Email",
  "/product/calendar": "Channel · Calendar",
  "/product/context": "Platform · Context Layer",
  "/product/noise": "Platform · Noise Filter",
  "/ontology": "Platform · Ontology",
  "/phone-fmc": "Platform · Phone FMC",
  "/architecture": "Platform · Architecture",
  "/releases": "Release Notes",
  "/settings": "Settings",
  "/settings/profile": "Settings · Personal Info",
  "/settings/plan": "Settings · My Plan",
  "/settings/billing": "Settings · Billing History",
  "/settings/connected": "Settings · Connected Accounts",
  "/settings/notifications": "Settings · Notifications",
  "/settings/privacy": "Settings · Privacy & Data",
  "/admin": "Admin",
  "/my-rules": "My Rules",
  "/files": "File Vault",
};

function HeaderBar({ breadcrumb }: { breadcrumb: string }) {
  const { toggleSidebar } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 h-12 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-3">
        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className="flex items-center gap-2 h-auto px-3 py-1.5 rounded-md bg-muted/50 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Menu className="h-4 w-4 shrink-0" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em]">
            {breadcrumb.split(" · ").pop()}
          </span>
        </Button>

        {/* Profile avatar button */}
        <button
          onClick={() => setProfileOpen(true)}
          className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 hover:ring-primary/40 transition-all"
        >
          <User className="w-4 h-4 text-primary" />
        </button>
      </header>

      <ProfileMenuDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}

export default function ProductLayout({ children }: ProductLayoutProps) {
  const location = useLocation();
  const path = location.pathname;
  const breadcrumb = BREADCRUMB_MAP[path] || (path.startsWith("/case/") ? `Cases · Case ${path.replace("/case/", "")}` : "Vanta");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ProductSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <HeaderBar breadcrumb={breadcrumb} />
          <main className="flex-1">
            {children}
          </main>
          <SmartNoteFAB />
        </div>
      </div>
    </SidebarProvider>
  );
}
