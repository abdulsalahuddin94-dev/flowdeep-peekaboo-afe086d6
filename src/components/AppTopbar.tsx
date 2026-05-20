import { useState } from "react";
import { Bell, Plus, Search, Command as CmdIcon } from "lucide-react";
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
import { Link, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";

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
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const top = "/" + (pathname.split("/")[1] ?? "");
  const label = crumbsMap[top] ?? "Workspace";

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
              <Search className="h-4 w-4" />
              <span>Search projects, people, docs…</span>
              <kbd className="ml-auto flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">
                <CmdIcon className="h-3 w-3" />K
              </kbd>
            </button>
          </DialogTrigger>
          <DialogContent className="overflow-hidden p-0">
            <Command>
              <CommandInput placeholder="Type to search anything…" />
              <CommandList>
                <CommandEmpty>No results.</CommandEmpty>
                <CommandGroup heading="Projects">
                  <CommandItem onSelect={() => setOpen(false)}>ERP System Upgrade</CommandItem>
                  <CommandItem onSelect={() => setOpen(false)}>Coastal Refinery Expansion</CommandItem>
                  <CommandItem onSelect={() => setOpen(false)}>Salesforce Migration</CommandItem>
                </CommandGroup>
                <CommandGroup heading="People">
                  <CommandItem>Sara Al-Rashid · PM</CommandItem>
                  <CommandItem>Mei Chen · Security Lead</CommandItem>
                </CommandGroup>
                <CommandGroup heading="Actions">
                  <CommandItem>+ New Business Case</CommandItem>
                  <CommandItem>+ New Risk</CommandItem>
                  <CommandItem>Run Executive Report</CommandItem>
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

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rag-red" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[420px] bg-surface border-l border-border">
            <SheetHeader>
              <SheetTitle className="text-foreground">Notifications</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              {[
                { tone: "red", title: "ERP Upgrade slipping — UAT Sign-off in 18 days", time: "12m ago" },
                { tone: "amber", title: "Business Case BC-018 awaiting your review", time: "1h ago" },
                { tone: "green", title: "Salesforce Migration milestone closed", time: "3h ago" },
                { tone: "amber", title: "Priya Iyer over-allocated to 102%", time: "Yesterday" },
                { tone: "blue", title: "Weekly Executive Report ready", time: "Yesterday" },
              ].map((n, i) => (
                <div key={i} className="glass-card flex items-start gap-3 p-3">
                  <span className={`mt-1.5 h-2 w-2 rounded-full bg-rag-${n.tone}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground">{n.title}</div>
                    <div className="text-[11px] text-muted-foreground">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <Badge variant="outline" className="border-role-director/40 bg-role-director/10 text-[10px] text-role-director">
          Director Mode
        </Badge>
      </div>
    </header>
  );
}
