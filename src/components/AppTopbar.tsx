import { useState, useEffect } from "react";
import { Bell, Plus, Search, Command as CmdIcon, Briefcase, Users, Zap } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Dialog, DialogContent, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { pipelineItems, resources } from "@/lib/mock-data";
import { useProjects, useNotifications } from "@/lib/projects-store";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const RAG_DOT: Record<string, string> = {
  green: "bg-rag-green", amber: "bg-rag-amber",
  red: "bg-rag-red", blue: "bg-rag-blue", grey: "bg-muted-foreground",
};

const crumbsMap: Record<string, string> = {
  "/": "Dashboard",
  "/organization": "Organization",
  "/clients-vendors": "Clients & Vendors",
  "/portfolio": "Portfolio",
  "/pipeline": "Pipeline",
  "/resources": "Resources",
  "/financials": "Financials",
  "/risks": "Risk & Issues",
  "/procurement": "Procurement",
  "/reports": "Reports",
  "/roles": "Roles & Permissions",
  "/settings": "Settings",
};

export function AppTopbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const top = "/" + (pathname.split("/")[1] ?? "");
  const label = crumbsMap[top] ?? "Workspace";

  useEffect(() => {
    function down(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function go(to: string) {
    setOpen(false);
    navigate({ to });
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-accent">Home</Link>
        <span>/</span>
        <span className="text-foreground">{label}</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex h-9 w-72 items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 text-sm text-muted-foreground hover:border-accent/40 hover:text-foreground">
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate text-left">Search projects, people, docs…</span>
              <kbd className="ml-auto flex shrink-0 items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">
                <CmdIcon className="h-3 w-3" />K
              </kbd>
            </button>
          </DialogTrigger>
          <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
            <Command>
              <CommandInput placeholder="Search projects, people, pipeline…" />
              <CommandList className="max-h-[400px]">
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup heading="Projects">
                  {projects.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={`${p.name} ${p.pm} ${p.businessLine} ${p.department} ${p.stage}`}
                      onSelect={() => {
                        navigate({ to: "/portfolio/$projectId", params: { projectId: p.id } });
                        setOpen(false);
                      }}
                      className="flex items-center gap-2"
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${RAG_DOT[p.rag] ?? "bg-muted-foreground"}`} />
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="ml-3 shrink-0 text-[11px] text-muted-foreground">{p.pm}</span>
                      <span className="ml-2 shrink-0 text-[10px] text-muted-foreground/50">{p.stage}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandGroup heading="Pipeline">
                  {pipelineItems.map((b) => (
                    <CommandItem
                      key={b.id}
                      value={`${b.title} ${b.submittedBy} ${b.pillar} ${b.id}`}
                      onSelect={() => go("/pipeline")}
                      className="flex items-center gap-2"
                    >
                      <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      <span className="flex-1 truncate">{b.title}</span>
                      <span className="ml-3 shrink-0 num-mono text-[10px] text-muted-foreground">{b.pillar}</span>
                      <span className={`ml-2 shrink-0 num-mono text-[10px] rounded px-1 ${
                        b.score >= 71 ? "bg-rag-green/10 text-rag-green" :
                        b.score >= 41 ? "bg-rag-amber/10 text-rag-amber" :
                        "bg-rag-red/10 text-rag-red"
                      }`}>{b.score}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandGroup heading="People">
                  {resources.map((r) => (
                    <CommandItem
                      key={r.name}
                      value={`${r.name} ${r.role} ${r.dept}`}
                      onSelect={() => go("/resources")}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      <span className="flex-1 truncate">{r.name}</span>
                      <span className="ml-3 shrink-0 text-[11px] text-muted-foreground">{r.role}</span>
                      <span className={`ml-2 shrink-0 num-mono text-[10px] ${
                        r.util > 100 ? "text-rag-red" : r.util > 80 ? "text-rag-amber" : "text-rag-green"
                      }`}>{r.util}%</span>
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandGroup heading="Quick Actions">
                  <CommandItem value="new business case pipeline submit" onSelect={() => go("/pipeline")} className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span>New Business Case</span>
                  </CommandItem>
                  <CommandItem value="new project portfolio create" onSelect={() => go("/portfolio")} className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span>New Project</span>
                  </CommandItem>
                  <CommandItem value="executive report run reports" onSelect={() => go("/reports")} className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span>Run Executive Report</span>
                  </CommandItem>
                  <CommandItem value="log risk risks issues" onSelect={() => go("/risks")} className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span>Log Risk / Issue</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4" /> Quick Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Create…</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast.success("Business Case draft created")}>Business Case</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.success("New project initiated")}>Project</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.success("Risk logged")}>Risk</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.success("Issue logged")}>Issue</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.success("RFI drafted")}>RFI / RFP</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.success("Change Request opened")}>Change Request</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sheet onOpenChange={(o) => { if (o) markAllRead(); }}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rag-red px-1 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rag-red" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[420px] bg-surface border-l border-border">
            <SheetHeader>
              <SheetTitle className="text-foreground">Notifications</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className={`glass-card flex items-start gap-3 p-3 transition-opacity ${n.read ? "opacity-60" : ""}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rag-${n.tone}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground">{n.title}</div>
                    <div className="text-[11px] text-muted-foreground">{n.time}</div>
                  </div>
                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">All caught up</p>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Badge variant="outline" className="border-role-director/40 bg-role-director/10 text-[10px] text-role-director">
          Director Mode
        </Badge>

        <SignOutButton />
      </div>
    </header>
  );
}

function SignOutButton() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function handle() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <Button variant="outline" size="sm" onClick={handle}>
      Sign out
    </Button>
  );
}
