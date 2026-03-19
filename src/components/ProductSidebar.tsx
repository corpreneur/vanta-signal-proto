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
  Settings2,
  LogOut,
  Zap,
  Users,
  Shield,
  Radio,
  SlidersHorizontal,
  CheckSquare,
  FolderOpen,
  Bookmark,
  Crosshair,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

/* ── Fab Five — the 5 core product functions ── */
const fabFiveItems = [
  { title: "Connectivity", url: "/connectivity", icon: Radio },
  { title: "Signal Feed", url: "/signals", icon: BarChart3 },
  { title: "Filter Modes", url: "/focus", icon: SlidersHorizontal },
  { title: "Idea Capture", url: "/brain-dump", icon: PenLine },
  { title: "Easy Actions", url: "/command", icon: Zap },
];

const channelItems = [
  { title: "iMessage", url: "/product/intro", icon: MessageSquare },
  { title: "Phone", url: "/product/phone-call", icon: Phone },
  { title: "Zoom", url: "/product/meeting", icon: Video },
  { title: "Email", url: "/product/email", icon: Mail },
  { title: "Calendar", url: "/product/calendar", icon: Calendar },
];

const productItems = [
  { title: "Smart Contacts", url: "/contacts", icon: Users },
  { title: "Relationship Graph", url: "/graph", icon: Network },
  { title: "File Vault", url: "/files", icon: FolderOpen },
  { title: "My Rules", url: "/my-rules", icon: BookOpen },
  { title: "Insight Engine", url: "/insights", icon: Lightbulb },
  { title: "Investment Intel", url: "/investments", icon: TrendingUp },
  { title: "Decision Capture", url: "/decisions", icon: Gavel },
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

function CollapsibleNavGroup({ label, items, collapsed, currentPath, activeClassName = "border-l-2 border-foreground text-foreground bg-vanta-bg-elevated" }: CollapsibleNavGroupProps) {
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
                      to={item.url}
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
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-vanta-border bg-vanta-bg">
      <SidebarHeader className="px-3 py-3 space-y-1">
        <a href="/" className="flex items-center gap-2">
          <span className="font-sans text-[17px] font-extrabold tracking-[0.2em] uppercase text-foreground">
            {collapsed ? "V" : "VANTA"}
          </span>
        </a>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/"
                end
                className="group/nav flex items-center gap-2 px-2 py-1.5 border-l-2 border-transparent font-mono text-[12px] uppercase tracking-wider text-vanta-text-low hover:text-foreground hover:bg-vanta-bg-elevated transition-all duration-200 hover:translate-x-0.5"
                activeClassName="border-l-2 border-foreground text-foreground bg-vanta-bg-elevated"
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                {!collapsed && <span>Dashboard</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Fab Five */}
        <SidebarGroup className="py-1">
          {!collapsed && (
            <p className="px-2 pb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-accent">
              Fab Five
            </p>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {fabFiveItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="group/nav flex items-center gap-2 px-2 py-2 border-l-2 border-transparent font-mono text-[12px] uppercase tracking-wider text-vanta-text-low hover:text-foreground hover:bg-vanta-bg-elevated transition-all duration-200 hover:translate-x-0.5"
                      activeClassName="border-l-2 border-foreground text-foreground bg-vanta-bg-elevated"
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

        <div className="mx-3 border-t border-vanta-border" />

        <CollapsibleNavGroup label="Product Concepts" items={productItems} collapsed={collapsed} currentPath={currentPath} />
        <CollapsibleNavGroup label="Channels" items={channelItems} collapsed={collapsed} currentPath={currentPath} />
        <CollapsibleNavGroup label="Platform" items={platformItems} collapsed={collapsed} currentPath={currentPath} />

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
                          to={`/case/${c.id}`}
                          className="group/nav flex items-center gap-2 px-2 py-2 pl-6 border-l-2 border-transparent font-mono text-[12px] uppercase tracking-wider text-vanta-text-low hover:text-foreground hover:bg-vanta-bg-elevated transition-all duration-200 hover:translate-x-0.5"
                          activeClassName="border-l-2 border-foreground text-foreground bg-vanta-bg-elevated"
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
        {/* Admin links — scrollable */}
        <div className="mx-3 border-t border-vanta-border" />
        <SidebarGroup className="py-1">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/settings"
                    className="group/nav flex items-center gap-2 px-2 py-1.5 border-l-2 border-transparent font-mono text-[11px] uppercase tracking-wider text-vanta-text-muted hover:text-foreground hover:bg-vanta-bg-elevated transition-all duration-200"
                    activeClassName="border-l-2 border-foreground text-foreground bg-vanta-bg-elevated"
                  >
                    <Settings2 className="h-3.5 w-3.5 shrink-0" />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/releases"
                    className="group/nav flex items-center gap-2 px-2 py-1.5 border-l-2 border-transparent font-mono text-[11px] uppercase tracking-wider text-vanta-text-muted hover:text-foreground hover:bg-vanta-bg-elevated transition-all duration-200"
                    activeClassName="border-l-2 border-foreground text-foreground bg-vanta-bg-elevated"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    {!collapsed && <span>Release Notes</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/admin"
                    className="group/nav flex items-center gap-2 px-2 py-1.5 border-l-2 border-transparent font-mono text-[11px] uppercase tracking-wider text-vanta-text-muted hover:text-foreground hover:bg-vanta-bg-elevated transition-all duration-200"
                    activeClassName="border-l-2 border-foreground text-foreground bg-vanta-bg-elevated"
                  >
                    <Shield className="h-3.5 w-3.5 shrink-0" />
                    {!collapsed && <span>Admin</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-2 flex flex-row items-center justify-between border-t border-vanta-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={handleLogout}
                className="group/nav flex items-center gap-2 px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-vanta-text-muted hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-full"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                {!collapsed && <span>Sign Out</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}