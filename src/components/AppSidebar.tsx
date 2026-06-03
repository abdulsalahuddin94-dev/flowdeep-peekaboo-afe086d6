import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, Handshake, Target, GitBranch, Users,
  DollarSign, AlertTriangle, HardHat, BarChart3, ShieldCheck, Settings,
  LogOut, HelpCircle, ChevronLeft,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const main = [
  { title: "Dashboard",       url: "/",               icon: LayoutDashboard },
  { title: "Portfolio",       url: "/portfolio",       icon: Target },
  { title: "Pipeline",        url: "/pipeline",        icon: GitBranch, badge: 6 },
  { title: "Risk & Issues",   url: "/risks",           icon: AlertTriangle, badge: 3, badgeTone: "red" as const },
  { title: "Resources",       url: "/resources",       icon: Users },
  { title: "Clients & Vendors", url: "/clients-vendors", icon: Handshake },
  { title: "Procurement",     url: "/procurement",     icon: HardHat },
  { title: "Financials",      url: "/financials",      icon: DollarSign },
  { title: "Reports",         url: "/reports",         icon: BarChart3 },
  { title: "Organization",    url: "/organization",    icon: Building2 },
];

const mgmt = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => url === "/" ? pathname === "/" : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2 px-2 py-3">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground font-semibold">N</div>
              <div>
                <div className="text-sm font-medium tracking-wide text-foreground">Nexus PMO</div>
                <Badge variant="outline" className="mt-0.5 h-4 border-accent/40 bg-accent-dim px-1.5 py-0 text-[10px] font-medium text-accent">
                  Portfolio Director
                </Badge>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="ml-auto rounded p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-accent"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="label-eyebrow">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && !collapsed && (
                        <Badge
                          className={`ml-auto h-5 px-1.5 text-[10px] ${
                            item.badgeTone === "red"
                              ? "bg-rag-red/15 text-rag-red border border-rag-red/30"
                              : "bg-accent-dim text-accent border border-accent/30"
                          }`}
                          variant="outline"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="label-eyebrow">Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mgmt.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Help & Docs">
              <HelpCircle className="h-4 w-4" />
              <span>Help & Docs</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 pt-2">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="bg-accent-dim text-accent text-xs">AK</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-foreground">Aisha Khoury</div>
              <div className="truncate text-[10px] text-muted-foreground">Portfolio Director</div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
