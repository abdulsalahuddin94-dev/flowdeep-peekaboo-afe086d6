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

/* DS02 Sidebar Color Tokens — Light mode navy + lavender gradient active */
const SIDEBAR_COLORS = {
  bg: "#0B154B",                    // Deep navy sidebar background (light mode)
  border: "rgba(255,255,255,0.08)", // Subtle border
  navText: "rgba(255,255,255,0.7)", // Muted nav item text
  navTextHover: "#FFFFFF",          // Hover text
  navActive: "linear-gradient(180deg, #DEC9FF 0%, #857999 100%)", // Selected gradient
  navActiveSolid: "#DEC9FF",        // Fallback / logo chip
  navActiveText: "#1C274C",         // Dark navy text on active pill
  navHoverBg: "rgba(255,255,255,0.08)",
  disabled: "#475569",
  accent: "#F2C94C",
};

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
    <Sidebar
      collapsible="icon"
      className="ds02-sidebar border-r-0 bg-[#0F1729]"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {/* Header — Logo & Collapse Toggle */}
      <SidebarHeader
        className="border-b px-3 py-4"
        style={{ borderColor: SIDEBAR_COLORS.border }}
      >
        <div className="flex items-center justify-between gap-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm"
                style={{ background: SIDEBAR_COLORS.navActive, color: "#FFFFFF" }}
              >
                N
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Nexus PMO</div>
                <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Portfolio Director
                </div>
              </div>
            </div>
          )}
          {/* Collapse/Expand Button */}
          <button
            onClick={toggleSidebar}
            className="ml-auto rounded-lg p-1.5 transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </SidebarHeader>

      {/* Navigation Menu — Expanded & Collapsed Variants */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu
              className="gap-3"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {allItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={`
                        h-10 rounded-lg px-3 text-sm font-medium transition-all duration-200
                        flex items-center gap-3
                      `}
                      style={{
                        background: active ? SIDEBAR_COLORS.navActive : "transparent",
                        color: active ? SIDEBAR_COLORS.navActiveText : SIDEBAR_COLORS.navText,
                        fontSize: "14px",
                        fontWeight: active ? "600" : "400",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = SIDEBAR_COLORS.navHoverBg;
                          e.currentTarget.style.color = SIDEBAR_COLORS.navTextHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = SIDEBAR_COLORS.navText;
                        }
                      }}
                    >
                      <Link to={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="truncate flex-1">{item.title}</span>
                            {/* Badge — only visible in expanded mode */}
                            {"badge" in item && item.badge && (
                              <span
                                className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 ml-auto"
                                style={{
                                  background: "badgeTone" in item && item.badgeTone === "red"
                                    ? "rgba(239,68,68,0.2)"
                                    : "rgba(255,255,255,0.15)",
                                  color: "badgeTone" in item && item.badgeTone === "red"
                                    ? "#EF4444"
                                    : "rgba(255,255,255,0.7)"
                                }}
                              >
                                {(item as { badge: number | string }).badge}
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

      {/* Footer — Help, Logout, User Profile */}
      <SidebarFooter
        className="border-t px-3 py-3"
        style={{
          borderColor: SIDEBAR_COLORS.border,
          fontFamily: "Poppins, sans-serif"
        }}
      >
        <SidebarMenu className="gap-3">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Help & Docs"
              className="h-10 rounded-lg px-3 text-sm font-medium transition-all duration-200"
              style={{
                color: SIDEBAR_COLORS.navText,
                fontSize: "14px",
                fontWeight: "400"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = SIDEBAR_COLORS.navHoverBg;
                e.currentTarget.style.color = SIDEBAR_COLORS.navTextHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = SIDEBAR_COLORS.navText;
              }}
            >
              <HelpCircle className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Help & Docs</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              className="h-10 rounded-lg px-3 text-sm font-medium transition-all duration-200"
              style={{
                color: SIDEBAR_COLORS.navText,
                fontSize: "14px",
                fontWeight: "400"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = SIDEBAR_COLORS.navHoverBg;
                e.currentTarget.style.color = SIDEBAR_COLORS.navTextHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = SIDEBAR_COLORS.navText;
              }}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User Profile Card — Expanded Only */}
        {!collapsed && (
          <div
            className="mt-4 flex items-center gap-2.5 rounded-lg px-2 py-2"
            style={{
              background: SIDEBAR_COLORS.navHoverBg,
              borderRadius: "12px"
            }}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback
                className="text-xs font-bold text-white"
                style={{ background: SIDEBAR_COLORS.navActive }}
              >
                AK
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">Aisha Khoury</div>
              <div
                className="truncate text-[10px]"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Portfolio Director
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
