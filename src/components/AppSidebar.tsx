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

const allItems = [...main, ...mgmt];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => url === "/" ? pathname === "/" : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="ds02-sidebar border-r-0">
      {/* Header */}
      <SidebarHeader className="border-b border-white/8 px-3 py-4">
        <div className="flex items-center justify-between gap-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-secondary text-[#1c274c] font-bold text-sm">
                N
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Nexus PMO</div>
                <div className="text-[10px] text-white/50 mt-0.5">Portfolio Director</div>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="ml-auto rounded-lg p-1.5 text-white/40 hover:bg-white/8 hover:text-white/80 transition-colors"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {allItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={`
                        h-10 rounded-xl px-3 text-sm font-medium transition-all
                        ${active
                          ? "bg-accent-secondary text-[#1c274c] hover:bg-accent-secondary/90"
                          : "text-white/70 hover:bg-white/8 hover:text-white"
                        }
                      `}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                        {"badge" in item && item.badge && !collapsed && (
                          <span className={`ml-auto text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
                            "badgeTone" in item && item.badgeTone === "red"
                              ? "bg-rag-red/20 text-rag-red"
                              : "bg-white/15 text-white/70"
                          }`}>
                            {item.badge}
                          </span>
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
      <SidebarFooter className="border-t border-white/8 px-3 py-3">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Help & Docs"
              className="h-10 rounded-xl px-3 text-sm font-medium text-white/70 hover:bg-white/8 hover:text-white transition-all"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>Help & Docs</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              className="h-10 rounded-xl px-3 text-sm font-medium text-white/70 hover:bg-white/8 hover:text-white transition-all"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="mt-2 flex items-center gap-2.5 rounded-xl px-2 py-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-accent-secondary text-[#1c274c] text-xs font-bold">AK</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-white">Aisha Khoury</div>
              <div className="truncate text-[10px] text-white/50">Portfolio Director</div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
