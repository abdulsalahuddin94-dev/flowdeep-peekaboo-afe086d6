import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, Handshake, Target, GitBranch, Users,
  DollarSign, AlertTriangle, HardHat, BarChart3, Settings,
  LogOut, HelpCircle, ChevronLeft,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/*
 * Sidebar is fully token-driven. All colors come from CSS variables defined
 * in src/styles.css (see `--sidebar-*` tokens). Do NOT add hex/rgba literals
 * or inline color styles in this file — edit the tokens instead.
 */

const main = [
  { title: "Dashboard",         url: "/",                icon: LayoutDashboard },
  { title: "Portfolio",         url: "/portfolio",       icon: Target },
  { title: "Pipeline",          url: "/pipeline",        icon: GitBranch, badge: 6 },
  { title: "Risk & Issues",     url: "/risks",           icon: AlertTriangle, badge: 3, badgeTone: "red" as const },
  { title: "Resources",         url: "/resources",       icon: Users },
  { title: "Clients & Vendors", url: "/clients-vendors", icon: Handshake },
  { title: "Procurement",       url: "/procurement",     icon: HardHat },
  { title: "Financials",        url: "/financials",      icon: DollarSign },
  { title: "Reports",           url: "/reports",         icon: BarChart3 },
  { title: "Organization",      url: "/organization",    icon: Building2 },
];

const mgmt = [
  { title: "Settings", url: "/settings", icon: Settings },
];

const allItems = [...main, ...mgmt];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => url === "/" ? pathname === "/" : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="ds02-sidebar border-r-0">
      {/* Header — logo & collapse toggle */}
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center justify-between gap-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                N
              </div>
              <div>
                <div className="text-sm font-semibold text-sidebar-accent-foreground">Nexus PMO</div>
                <div className="mt-0.5 text-[10px] text-sidebar-muted">Portfolio Director</div>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="ml-auto rounded-lg p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {allItems.map((item) => {
                const active = isActive(item.url);
                const badge = ("badge" in item ? item.badge : undefined) as number | string | undefined;
                const badgeDanger = "badgeTone" in item && item.badgeTone === "red";
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-10 rounded-lg px-3 text-sm font-medium"
                    >
                      <Link to={item.url} className="flex w-full items-center gap-3">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.title}</span>
                            {badge && (
                              <span
                                className={cn(
                                  "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                  badgeDanger
                                    ? "bg-sidebar-badge-danger text-sidebar-badge-danger-foreground"
                                    : "bg-sidebar-badge text-sidebar-badge-foreground",
                                )}
                              >
                                {badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        <SidebarMenu className="gap-3">
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Help & Docs" className="h-10 rounded-lg px-3 text-sm">
              <HelpCircle className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Help & Docs</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout" className="h-10 rounded-lg px-3 text-sm">
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {!collapsed && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-sidebar-accent px-2 py-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
                AK
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-sidebar-accent-foreground">Aisha Khoury</div>
              <div className="truncate text-[10px] text-sidebar-muted">Portfolio Director</div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
