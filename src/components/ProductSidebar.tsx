import {
  MessageSquare,
  Lightbulb,
  TrendingUp,
  Gavel,
  FileText,
  Video,
  Phone,
  Volume2,
  Mail,
  Calendar,
  BarChart3,
  Network,
  BookOpen,
  Layers,
  LayoutDashboard,
  BookMarked,
  FileCode,
  ChevronRight,
  PenLine,
  ShieldCheck,
  Settings2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation } from "react-router-dom";
import { cases } from "@/data/cases";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const channelItems = [
  { title: "iMessage", url: "/product/intro", icon: MessageSquare },
  { title: "Phone", url: "/product/phone-call", icon: Phone },
  { title: "Zoom", url: "/product/meeting", icon: Video },
  { title: "Email", url: "/product/email", icon: Mail },
  { title: "Calendar", url: "/product/calendar", icon: Calendar },
  { title: "Brain Dump", url: "/brain-dump", icon: PenLine },
];

const productItems = [
  { title: "Insight Engine", url: "/product/insight", icon: Lightbulb },
  { title: "Investment Intel", url: "/product/investment", icon: TrendingUp },
  { title: "Decision Capture", url: "/product/decision", icon: Gavel },
];

const coreItems = [
  { title: "Signal Feed", url: "/signals", icon: BarChart3 },
  { title: "Classification Audit", url: "/audit", icon: ShieldCheck },
  { title: "Relationship Graph", url: "/graph", icon: Network },
];

const platformItems = [
  { title: "Context Layer", url: "/product/context", icon: FileText },
  { title: "Noise Filter", url: "/product/noise", icon: Volume2 },
  { title: "Ontology", url: "/ontology", icon: Layers },
  { title: "Phone FMC", url: "/phone-fmc", icon: BookOpen },
  { title: "Architecture", url: "/architecture", icon: FileCode },
];

interface CollapsibleNavGroupProps {
  label: string;
  items: { title: string; url: string; icon: React.ElementType }[];
  collapsed: boolean;
  currentPath: string;
  activeClassName?: string;
}

function CollapsibleNavGroup({ label, items, collapsed, currentPath, activeClassName = "border-l-2 border-vanta-accent text-foreground bg-vanta-bg-elevated" }: CollapsibleNavGroupProps) {
  const hasActiveChild = items.some((item) => currentPath === item.url || currentPath.startsWith(item.url + "/"));

  return (
    <Collapsible defaultOpen={hasActiveChild}>
      <SidebarGroup>
        <CollapsibleTrigger className="flex items-center gap-1.5 w-full px-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-low hover:text-foreground transition-colors group">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
          {!collapsed && <span>{label}</span>}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`${item.url}?skip-auth=1`}
                      className="group/nav flex items-center gap-2 px-2 py-2 pl-6 border-l-2 border-transparent font-mono text-[12px] uppercase tracking-wider text-vanta-text-low hover:text-foreground hover:bg-vanta-bg-elevated transition-all duration-200 hover:translate-x-0.5"
                      activeClassName={activeClassName}
                    >
                      <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function ProductSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sidebar collapsible="icon" className="border-r border-vanta-border bg-vanta-bg">
      <SidebarHeader className="px-3 py-5">
        <a href="/?skip-auth=1" className="flex items-center gap-2">
          <span className="font-sans text-[17px] font-extrabold tracking-[0.2em] uppercase text-foreground">
            {collapsed ? "V" : "VANTA"}
          </span>
        </a>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard + Core */}
        <SidebarGroup className="py-2 border-b border-vanta-border">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/?skip-auth=1"
                    end
                    className="group/nav flex items-center gap-2 px-2 py-2 border-l-2 border-transparent font-mono text-[12px] uppercase tracking-wider text-vanta-text-low hover:text-vanta-accent hover:bg-vanta-accent-faint transition-all duration-200 hover:translate-x-0.5"
                    activeClassName="border-l-2 border-vanta-accent text-vanta-accent bg-vanta-accent-faint"
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`${item.url}?skip-auth=1`}
                      className="group/nav flex items-center gap-2 px-2 py-2 border-l-2 border-transparent font-mono text-[12px] uppercase tracking-wider text-vanta-text-low hover:text-foreground hover:bg-vanta-bg-elevated transition-all duration-200 hover:translate-x-0.5"
                      activeClassName="border-l-2 border-vanta-accent text-foreground bg-vanta-bg-elevated"
                    >
                      <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <CollapsibleNavGroup label="Channels" items={channelItems} collapsed={collapsed} currentPath={currentPath} />
        <CollapsibleNavGroup label="Platform" items={platformItems} collapsed={collapsed} currentPath={currentPath} />
        <CollapsibleNavGroup label="Product Concepts" items={productItems} collapsed={collapsed} currentPath={currentPath} />

        {/* Cases */}
        <Collapsible defaultOpen={currentPath.startsWith("/case/")}>
          <SidebarGroup>
            <CollapsibleTrigger className="flex items-center gap-1.5 w-full px-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-low hover:text-foreground transition-colors group">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              {!collapsed && <span>Cases</span>}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {cases.map((c) => (
                    <SidebarMenuItem key={c.id}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={`/case/${c.id}?skip-auth=1`}
                          className="group/nav flex items-center gap-2 px-2 py-2 pl-6 border-l-2 border-transparent font-mono text-[12px] uppercase tracking-wider text-vanta-text-low hover:text-foreground hover:bg-vanta-bg-elevated transition-all duration-200 hover:translate-x-0.5"
                          activeClassName="border-l-2 border-vanta-accent text-foreground bg-vanta-bg-elevated"
                        >
                          <BookMarked className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                          {!collapsed && <span className="truncate">{c.name}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 space-y-2 border-t border-vanta-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/releases?skip-auth=1"
                className="group/nav flex items-center gap-2 px-2 py-2 border-l-2 border-transparent font-mono text-[11px] uppercase tracking-wider text-vanta-text-muted hover:text-foreground hover:bg-vanta-bg-elevated transition-all duration-200"
                activeClassName="border-l-2 border-vanta-accent text-foreground bg-vanta-bg-elevated"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                {!collapsed && <span>Release Notes</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <ThemeToggle />
        {!collapsed && (
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-vanta-text-muted">
            © 2026 Vanta Wireless
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
