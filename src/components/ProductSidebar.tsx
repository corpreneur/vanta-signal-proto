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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cases } from "@/data/cases";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const channelItems = [
  { title: "iMessage", url: "/product/intro", icon: MessageSquare, color: "text-vanta-accent" },
  { title: "Phone", url: "/product/phone-call", icon: Phone, color: "text-vanta-accent-phone" },
  { title: "Zoom", url: "/product/meeting", icon: Video, color: "text-vanta-accent-zoom" },
  { title: "Email", url: "/product/email", icon: Mail, color: "text-vanta-accent-teal" },
  { title: "Calendar", url: "/product/calendar", icon: Calendar, color: "text-vanta-accent-amber" },
];

const productItems = [
  { title: "Insight Engine", url: "/product/insight", icon: Lightbulb, color: "text-vanta-accent-teal" },
  { title: "Investment Intel", url: "/product/investment", icon: TrendingUp, color: "text-vanta-accent-amber" },
  { title: "Decision Capture", url: "/product/decision", icon: Gavel, color: "text-vanta-accent-violet" },
  { title: "Context Layer", url: "/product/context", icon: FileText, color: "text-vanta-text-low" },
  { title: "Noise Filter", url: "/product/noise", icon: Volume2, color: "text-vanta-text-muted" },
];

const platformItems = [
  { title: "Signal Feed", url: "/signals", icon: BarChart3 },
  { title: "Relationship Graph", url: "/graph", icon: Network },
  { title: "Ontology", url: "/ontology", icon: Layers },
  { title: "Phone FMC", url: "/phone-fmc", icon: BookOpen },
];

export function ProductSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-vanta-border bg-vanta-bg">
      <SidebarHeader className="px-3 py-4">
        <a href="/?skip-auth=1" className="flex items-center gap-2">
          <span className="font-sans text-[15px] font-extrabold tracking-[0.2em] uppercase text-foreground">
            {collapsed ? "V" : "VANTA"}
          </span>
        </a>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/?skip-auth=1"
                    end
                    className="flex items-center gap-2 px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-vanta-text-low hover:text-vanta-accent hover:bg-vanta-accent-faint transition-colors"
                    activeClassName="text-vanta-accent bg-vanta-accent-faint"
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Channels */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted px-2">
            {collapsed ? "·" : "Channels"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {channelItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`${item.url}?skip-auth=1`}
                      className="flex items-center gap-2 px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-vanta-text-low hover:text-foreground hover:bg-vanta-bg-elevated transition-colors"
                      activeClassName="text-foreground bg-vanta-bg-elevated border-l-2 border-l-primary -ml-px"
                    >
                      <item.icon className={`h-3.5 w-3.5 shrink-0 ${item.color}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Product */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted px-2">
            {collapsed ? "·" : "Product"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {productItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`${item.url}?skip-auth=1`}
                      className="flex items-center gap-2 px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-vanta-text-low hover:text-foreground hover:bg-vanta-bg-elevated transition-colors"
                      activeClassName="text-foreground bg-vanta-bg-elevated border-l-2 border-l-primary -ml-px"
                    >
                      <item.icon className={`h-3.5 w-3.5 shrink-0 ${item.color}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Platform */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted px-2">
            {collapsed ? "·" : "Platform"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`${item.url}?skip-auth=1`}
                      className="flex items-center gap-2 px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-vanta-text-low hover:text-foreground hover:bg-vanta-bg-elevated transition-colors"
                      activeClassName="text-foreground bg-vanta-bg-elevated"
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Cases */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted px-2">
            {collapsed ? "·" : "Cases"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cases.map((c) => (
                <SidebarMenuItem key={c.id}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`/case/${c.id}?skip-auth=1`}
                      className="flex items-center gap-2 px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-vanta-text-low hover:text-foreground hover:bg-vanta-bg-elevated transition-colors"
                      activeClassName="text-foreground bg-vanta-bg-elevated"
                    >
                      <BookMarked className="h-3.5 w-3.5 shrink-0" />
                      {!collapsed && <span className="truncate">{c.name}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3">
        {!collapsed && (
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-vanta-text-muted">
            © 2026 Vanta Wireless
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
