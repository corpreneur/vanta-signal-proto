import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ProductSidebar } from "@/components/ProductSidebar";
import { PanelLeft } from "lucide-react";

interface ProductLayoutProps {
  children: React.ReactNode;
}

export default function ProductLayout({ children }: ProductLayoutProps) {
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
              Vanta Product
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
