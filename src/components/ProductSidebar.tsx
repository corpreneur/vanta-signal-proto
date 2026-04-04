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
  Kanban,
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
  { title: "Your Network", url: "/connectivity", icon: Radio },
  { title: "Signal Feed", url: "/signals", icon: BarChart3 },
  { title: "Filter Modes", url: "/focus", icon: SlidersHorizontal },
  { title: "Idea Capture", url: "/brain-dump", icon: PenLine },
  { title: "Easy Actions", url: "/command", icon: Zap },
];

/* ── Product Concepts — sub-grouped ── */
const meetingsAndCallsItems = [
  { title: "Meeting Intelligence", url: "/meetings", icon: Video },
  { title: "Zoom Demo", url: "/product/zoom-demo", icon: Video },
  { title: "Vanta Zoom", url: "/product/zoom-sdk", icon: Video },
  { title: "Phone FMC Demo", url: "/product/phone-fmc-demo", icon: Phone },
  { title: "Smart Embed", url: "/product/smart-embed", icon: Phone },
];

const peopleItems = [
  { title: "Smart Contacts", url: "/contacts", icon: Users },
  { title: "Relationship Graph", url: "/graph", icon: Network },
];

/* ── Channels — source integrations ── */
const channelItems = [
  { title: "iMessage", url: "/product/intro", icon: MessageSquare },
  { title: "Phone", url: "/product/phone-call", icon: Phone },
  { title: "Zoom", url: "/product/meeting", icon: Video },
  { title: "Email", url: "/product/email", icon: Mail },
  { title: "Calendar", url: "/product/calendar", icon: Calendar },
];

/* ── Platform — architecture & processing only ── */
const platformItems = [
  { title: "Context Layer", url: "/product/context", icon: FileText },
  { title: "Noise Filter", url: "/product/noise", icon: Volume2 },
  { title: "Ontology", url: "/ontology", icon: Layers },
  { title: "Phone FMC", url: "/phone-fmc", icon: BookOpen },
  { title: "Architecture", url: "/architecture", icon: FileCode },
];

const useCaseItems = [
  { title: "Insight Engine", url: "/insights", icon: Lightbulb },
  { title: "Investment Intel", url: "/investments", icon: TrendingUp },
  { title: "Decision Capture", url: "/decisions", icon: Gavel },
];

/* ── Shared nav-link classes ── */
const NAV_CLASS =
  "group/nav flex items-center gap-2 px-2 py-2 pl-6 border-l-2 border-transparent font-mono text-[12px] uppercase tracking-wider text-vanta-text-low hover:text-foreground hover:bg-vanta-bg-elevated transition-all duration-200 hover:translate-x-0.5";
const NAV_ACTIVE =
  "border-l-2 border-foreground text-foreground bg-vanta-bg-elevated";

interface CollapsibleNavGroupProps {
  label: string;
  items: { title: string; url: string; icon: React.ElementType }[];
  collapsed: boolean;
  currentPath: string;
}

function CollapsibleNavGroup({
  label,
  items,
  collapsed,
  currentPath,
}: CollapsibleNavGroupProps) {
  const hasActiveChild = items.some(
    (item) =>
      currentPath === item.url || currentPath.startsWith(item.url + "/")
  );

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
                      className={NAV_CLASS}
                      activeClassName={NAV_ACTIVE}
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

/* ── Inline section label ── */
function SectionLabel({ text, collapsed }: { text: string; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <p className="px-6 pt-3 pb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-accent">
      {text}
    </p>
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

  const allProductItems = [...meetingsAndCallsItems, ...peopleItems];
  const productActive = allProductItems.some(
    (i) => currentPath === i.url || currentPath.startsWith(i.url + "/")
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-vanta-border bg-vanta-bg"
    >
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
                activeClassName={NAV_ACTIVE}
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
                      activeClassName={NAV_ACTIVE}
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

        {/* Product Concepts — with sub-labels */}
        <Collapsible defaultOpen={productActive}>
          <SidebarGroup>
            <CollapsibleTrigger className="flex items-center gap-1.5 w-full px-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-low hover:text-foreground transition-colors group">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              {!collapsed && <span>Product Concepts</span>}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SectionLabel text="Meetings & Calls" collapsed={collapsed} />
                  {meetingsAndCallsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={NAV_CLASS}
                          activeClassName={NAV_ACTIVE}
                        >
                          <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SectionLabel text="People" collapsed={collapsed} />
                  {peopleItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={NAV_CLASS}
                          activeClassName={NAV_ACTIVE}
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

        {/* Channels */}
        <CollapsibleNavGroup
          label="Channels"
          items={channelItems}
          collapsed={collapsed}
          currentPath={currentPath}
        />

        {/* Platform */}
        <CollapsibleNavGroup
          label="Platform"
          items={platformItems}
          collapsed={collapsed}
          currentPath={currentPath}
        />

        {/* Use Cases + Cases */}
        <Collapsible
          defaultOpen={
            useCaseItems.some((i) => currentPath === i.url) ||
            currentPath.startsWith("/case/")
          }
        >
          <SidebarGroup>
            <CollapsibleTrigger className="flex items-center gap-1.5 w-full px-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-low hover:text-foreground transition-colors group">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              {!collapsed && <span>Use Cases</span>}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {useCaseItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={NAV_CLASS}
                          activeClassName={NAV_ACTIVE}
                        >
                          <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                          {!collapsed && <span className="truncate">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {cases.map((c) => (
                    <SidebarMenuItem key={c.id}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={`/case/${c.id}`}
                          className={NAV_CLASS}
                          activeClassName={NAV_ACTIVE}
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

        {/* Admin links */}
        <div className="mx-3 border-t border-vanta-border" />
        <SidebarGroup className="py-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { to: "/settings", icon: Settings2, label: "Settings" },
                { to: "/my-rules", icon: BookOpen, label: "My Rules" },
                { to: "/releases", icon: FileText, label: "Release Notes" },
                { to: "/feedback", icon: MessageSquare, label: "Feedback" },
                { to: "/sprints", icon: Kanban, label: "Sprint Board" },
                { to: "/admin", icon: Shield, label: "Admin" },
              ].map((link) => (
                <SidebarMenuItem key={link.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={link.to}
                      className="group/nav flex items-center gap-2 px-2 py-1.5 border-l-2 border-transparent font-mono text-[11px] uppercase tracking-wider text-vanta-text-muted hover:text-foreground hover:bg-vanta-bg-elevated transition-all duration-200"
                      activeClassName={NAV_ACTIVE}
                    >
                      <link.icon className="h-3.5 w-3.5 shrink-0" />
                      {!collapsed && <span>{link.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
