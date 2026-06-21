import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Search, Star, Building2, ChevronRight, FileText, Mail, Phone, X } from "lucide-react";
import { clients, vendors, projects, contracts } from "@/lib/mock-data";

export const Route = createFileRoute("/clients-vendors")({
  component: ClientsVendorsPage,
  head: () => ({ meta: [{ title: "Clients & Vendors — Nexus PMO" }, { name: "description", content: "Manage external parties: clients with active engagements and approved vendor / subcontractor pool." }] }),
});

// ── Supplemental contact data (not in mock-data) ──────────────────────────────
const CLIENT_DETAILS: Record<string, { email: string; phone: string; industry: string }> = {
  "ACME Energy":          { email: "r.hadid@acme-energy.com",         phone: "+971 4 123 4567", industry: "Oil & Gas" },
  "Northwind Logistics":  { email: "k.bauer@northwind-logistics.com",  phone: "+971 2 987 6543", industry: "Logistics" },
  "Helios Solar":         { email: "m.park@helios-solar.com",          phone: "+966 11 456 7890", industry: "Renewables" },
  "Atlas Mining":         { email: "t.okafor@atlas-mining.com",        phone: "+974 4 321 0987", industry: "Mining" },
};

const VENDOR_DETAILS: Record<string, { email: string; phone: string; contact: string }> = {
  "Siemens MENA":       { email: "procurement@siemens-mena.com",   phone: "+971 4 888 0000", contact: "Hans Müller" },
  "Oracle Consulting":  { email: "oracle-consulting@oracle.com",    phone: "+971 4 402 3000", contact: "Leila Nasser" },
  "Bechtel Subcontract":{ email: "contracts@bechtel.com",           phone: "+1 415 768 1234", contact: "James Calloway" },
  "Local Crane Co.":    { email: "ops@localcrane.ae",               phone: "+971 6 744 5500", contact: "Ali Mansoor" },
  "Cyberguard":         { email: "enterprise@cyberguard.io",        phone: "+44 20 7946 0958", contact: "Nadia Volkov" },
};

// ── RAG helpers ───────────────────────────────────────────────────────────────
const RAG_DOT: Record<string, string> = {
  green: "bg-rag-green", amber: "bg-rag-amber", red: "bg-rag-red",
  blue: "bg-rag-blue", grey: "bg-muted-foreground",
};
const RAG_BAR: Record<string, string> = {
  green: "[&>div]:bg-rag-green", amber: "[&>div]:bg-rag-amber", red: "[&>div]:bg-rag-red",
  blue: "[&>div]:bg-rag-blue", grey: "[&>div]:bg-muted-foreground",
};

// ── Page ──────────────────────────────────────────────────────────────────────
function ClientsVendorsPage() {
  const [clientView, setClientView] = useState<typeof clients[number] | null>(null);

  return (
    <div>
      <PageHeader title="Clients & Vendors" subtitle="External parties — clients with engagements, vendors and subcontractors approved for procurement" />
      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
          <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
        </TabsList>

        {/* ── Clients tab ──────────────────────────────────────────────── */}
        <TabsContent value="clients" className="mt-5">
          <Toolbar add={<AddClientDialog />} />
          <div className="">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Client</TableHead><TableHead>Primary Contact</TableHead>
                <TableHead className="text-right">Active Projects</TableHead>
                <TableHead className="text-right">Revenue (FY26)</TableHead>
                <TableHead>Status</TableHead><TableHead className="w-24" />
              </TableRow></TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.name} className="hover:bg-accent-dim/30">
                    <TableCell className="font-medium text-foreground">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-accent" />{c.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.contact}</TableCell>
                    <TableCell className="text-right num-mono">{c.projects}</TableCell>
                    <TableCell className="text-right num-mono">${c.revenue.toFixed(1)}M</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.status === "Active" ? "border-rag-green/40 bg-rag-green/10 text-rag-green" : "border-rag-blue/40 bg-rag-blue/10 text-rag-blue"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setClientView(c)}>
                        View <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Vendors tab ───────────────────────────────────────────────── */}
        <TabsContent value="vendors" className="mt-5">
          <VendorsTab />
        </TabsContent>
      </Tabs>

      {/* ── Client detail sheet ───────────────────────────────────────── */}
      <ClientSheet client={clientView} onClose={() => setClientView(null)} />
    </div>
  );
}

// ── Client detail sheet ───────────────────────────────────────────────────────
function ClientSheet({ client, onClose }: { client: typeof clients[number] | null; onClose: () => void }) {
  const [extraProjectIds, setExtraProjectIds] = useState<string[]>([]);
  const [connectOpen, setConnectOpen]         = useState(false);
  const [connectSearch, setConnectSearch]     = useState("");
  const [connectSel, setConnectSel]           = useState<string[]>([]);

  if (!client) return null;

  const detail     = CLIENT_DETAILS[client.name];
  const baseLinked = projects.filter((p) => p.client === client.name);
  const extraLinked = extraProjectIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean) as typeof projects;
  const linked     = [...baseLinked, ...extraLinked];
  const linkedIds  = new Set(linked.map((p) => p.id));
  const available  = projects.filter((p) => !linkedIds.has(p.id));
  const filteredAvail = available.filter((p) => p.name.toLowerCase().includes(connectSearch.toLowerCase()));
  const revenue    = client.revenue.toFixed(1);

  function toggleConnect(id: string) {
    setConnectSel((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleConnect() {
    if (connectSel.length === 0) { toast.error("Select at least one project"); return; }
    setExtraProjectIds((prev) => [...prev, ...connectSel.filter((id) => !prev.includes(id))]);
    toast.success(`${connectSel.length} project${connectSel.length !== 1 ? "s" : ""} linked to ${client?.name ?? ""}`);
    setConnectOpen(false); setConnectSel([]); setConnectSearch("");
  }

  return (
    <Sheet open={!!client} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-[480px] max-w-full p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-dim">
              <Building2 className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">{client.name}</SheetTitle>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{detail?.industry ?? "—"}</span>
                <Badge variant="outline" className={client.status === "Active" ? "border-rag-green/40 bg-rag-green/10 text-rag-green text-[10px]" : "border-rag-blue/40 bg-rag-blue/10 text-rag-blue text-[10px]"}>
                  {client.status}
                </Badge>
              </div>
            </div>
          </div>
          {detail && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /><a href={`mailto:${detail.email}`} className="hover:text-accent">{detail.email}</a></span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{detail.phone}</span>
            </div>
          )}
        </SheetHeader>

        {/* KPI strip */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          {[
            { l: "Revenue FY26", v: `$${revenue}M` },
            { l: "Linked projects", v: String(linked.length) },
            { l: "Contact", v: client.contact },
          ].map((k) => (
            <div key={k.l} className="px-4 py-3">
              <div className="label-eyebrow text-[10px]">{k.l}</div>
              <div className="mt-0.5 text-sm font-medium text-foreground num-mono">{k.v}</div>
            </div>
          ))}
        </div>

        {/* Projects list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="label-eyebrow mb-3">Projects</div>
          {linked.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No projects linked to {client.name} yet.</p>
              <button className="mt-1 text-xs text-accent hover:underline" onClick={() => setConnectOpen(true)}>+ Connect existing project</button>
            </div>
          ) : (
            <div className="space-y-2">
              {linked.map((p) => (
                <Link key={p.id} to="/portfolio/$projectId" params={{ projectId: p.id }} onClick={onClose} className="group block">
                  <div className="glass-card p-3 transition-all hover:border-accent/40 hover:bg-accent-dim/20">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${RAG_DOT[p.rag]}`} />
                          <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Progress value={p.progress} className={`h-1 flex-1 ${RAG_BAR[p.rag]}`} />
                          <span className="num-mono text-xs text-muted-foreground">{p.progress}%</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          <Badge variant="outline" className="border-border bg-secondary/40 text-[10px] text-muted-foreground py-0">{p.stage}</Badge>
                          <span>Ends {p.endDate}</span>
                          <span>PM: {p.pm}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-accent mt-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 space-y-2">
          <Button variant="outline" className="w-full border-accent/40 text-accent hover:bg-accent-dim" onClick={() => setConnectOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />Connect existing project
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </SheetContent>

      {/* Connect dialog (sibling of SheetContent inside Sheet) */}
      <Dialog open={connectOpen} onOpenChange={(o) => { if (!o) { setConnectOpen(false); setConnectSel([]); setConnectSearch(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Link projects to {client.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search projects…" className="h-8 pl-7 text-sm" value={connectSearch} onChange={(e) => setConnectSearch(e.target.value)} />
            </div>
            <ScrollArea className="h-52 rounded-md border border-border">
              <div className="p-1.5 space-y-0.5">
                {filteredAvail.map((p) => {
                  const checked = connectSel.includes(p.id);
                  return (
                    <label key={p.id} className={`flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 ${checked ? "bg-accent-dim/30" : "hover:bg-secondary/40"}`}>
                      <Checkbox checked={checked} onCheckedChange={() => toggleConnect(p.id)} className="shrink-0" />
                      <span className={`h-2 w-2 shrink-0 rounded-full ${RAG_DOT[p.rag]}`} />
                      <span className="flex-1 truncate text-sm text-foreground">{p.name}</span>
                      <Badge variant="outline" className="shrink-0 border-border bg-secondary/40 text-[10px] text-muted-foreground py-0">{p.stage}</Badge>
                    </label>
                  );
                })}
                {filteredAvail.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    {available.length === 0 ? "All projects are already linked." : `No projects match "${connectSearch}"`}
                  </p>
                )}
              </div>
            </ScrollArea>
            {connectSel.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {connectSel.map((id) => {
                  const p = projects.find((x) => x.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
                      <span className={`h-1.5 w-1.5 rounded-full ${RAG_DOT[p?.rag ?? "grey"]}`} />
                      {p?.name}
                      <button onClick={() => toggleConnect(id)} className="ml-0.5 hover:text-rag-red"><X className="h-3 w-3" /></button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConnectOpen(false); setConnectSel([]); setConnectSearch(""); }}>Cancel</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleConnect}>
              Link {connectSel.length > 0 ? `${connectSel.length} project${connectSel.length !== 1 ? "s" : ""}` : "selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}

// ── Vendors tab ───────────────────────────────────────────────────────────────
function VendorsTab() {
  const [type, setType] = useState<"All" | "Vendor" | "Subcontractor">("All");
  const [vendorView, setVendorView] = useState<typeof vendors[number] | null>(null);
  const list = vendors.filter((v) => type === "All" || v.type === type);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["All", "Vendor", "Subcontractor"] as const).map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={`rounded-full border px-3 py-1 text-xs ${type === t ? "border-accent bg-accent text-accent-foreground" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
        <div className="ml-auto"><AddVendorDialog /></div>
      </div>
      <div className="">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Vendor</TableHead><TableHead>Type</TableHead><TableHead>Category</TableHead>
            <TableHead className="text-right">Contracts</TableHead><TableHead className="text-right">Total Spend</TableHead>
            <TableHead>Evaluation</TableHead><TableHead className="w-24" />
          </TableRow></TableHeader>
          <TableBody>
            {list.map((v) => (
              <TableRow key={v.name}>
                <TableCell className="font-medium text-foreground">{v.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={v.type === "Vendor" ? "border-rag-blue/40 bg-rag-blue/10 text-rag-blue" : "border-role-exec/40 bg-role-exec/10 text-role-exec"}>
                    {v.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{v.category}</TableCell>
                <TableCell className="text-right num-mono">{v.contracts}</TableCell>
                <TableCell className="text-right num-mono">${v.spend.toFixed(1)}M</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3 fill-rag-amber text-rag-amber" />
                    <span className="num-mono">{v.eval.toFixed(1)}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => setVendorView(v)}>
                    View <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Vendor detail sheet */}
      <VendorSheet vendor={vendorView} onClose={() => setVendorView(null)} />
    </>
  );
}

// ── Vendor detail sheet ───────────────────────────────────────────────────────
function VendorSheet({ vendor, onClose }: { vendor: typeof vendors[number] | null; onClose: () => void }) {
  const [extraContractIds, setExtraContractIds] = useState<string[]>([]);
  const [connectOpen, setConnectOpen]           = useState(false);
  const [connectSel, setConnectSel]             = useState<string[]>([]);

  if (!vendor) return null;

  const detail      = VENDOR_DETAILS[vendor.name];
  const baseLinked  = contracts.filter((c) => c.vendor === vendor.name);
  const extraLinked = extraContractIds.map((id) => contracts.find((c) => c.id === id)).filter(Boolean) as typeof contracts;
  const linked      = [...baseLinked, ...extraLinked];
  const linkedIds   = new Set(linked.map((c) => c.id));
  const available   = contracts.filter((c) => !linkedIds.has(c.id));

  const scores = {
    Delivery:   +(vendor.eval * 0.95).toFixed(1),
    Quality:    +(vendor.eval * 1.03).toFixed(1),
    Commercial: +(vendor.eval * 0.97).toFixed(1),
    Support:    +(vendor.eval * 0.99).toFixed(1),
  };

  function toggleConnect(id: string) {
    setConnectSel((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleConnect() {
    if (connectSel.length === 0) { toast.error("Select at least one contract"); return; }
    setExtraContractIds((prev) => [...prev, ...connectSel.filter((id) => !prev.includes(id))]);
    toast.success(`${connectSel.length} contract${connectSel.length !== 1 ? "s" : ""} linked to ${vendor?.name ?? ""}`);
    setConnectOpen(false); setConnectSel([]);
  }

  return (
    <Sheet open={!!vendor} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-[480px] max-w-full p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">{vendor.name}</SheetTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={vendor.type === "Vendor" ? "border-rag-blue/40 bg-rag-blue/10 text-rag-blue text-[10px]" : "border-role-exec/40 bg-role-exec/10 text-role-exec text-[10px]"}>{vendor.type}</Badge>
                <Badge variant="outline" className="border-border bg-secondary/40 text-muted-foreground text-[10px]">{vendor.category}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(vendor.eval) ? "fill-rag-amber text-rag-amber" : "text-border"}`} />
              ))}
              <span className="ml-1 num-mono text-sm font-medium text-foreground">{vendor.eval.toFixed(1)}</span>
            </div>
          </div>
          {detail && (
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">{detail.contact}</span>
                <span className="text-muted-foreground/50">·</span>
                <a href={`mailto:${detail.email}`} className="hover:text-accent">{detail.email}</a>
              </div>
              <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{detail.phone}</div>
            </div>
          )}
        </SheetHeader>

        {/* KPI strip */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          {[
            { l: "Active contracts", v: String(linked.length || vendor.contracts) },
            { l: "Total spend",      v: `$${vendor.spend.toFixed(1)}M` },
            { l: "Eval score",       v: `${vendor.eval.toFixed(1)} / 5.0` },
          ].map((k) => (
            <div key={k.l} className="px-4 py-3">
              <div className="label-eyebrow text-[10px]">{k.l}</div>
              <div className="mt-0.5 text-sm font-medium text-foreground num-mono">{k.v}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Contracts */}
          <div>
            <div className="label-eyebrow mb-3">Contracts</div>
            {linked.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
                <FileText className="h-7 w-7 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No contracts on record for this vendor.</p>
                <button className="mt-1 text-xs text-accent hover:underline" onClick={() => setConnectOpen(true)}>+ Connect existing contract</button>
              </div>
            ) : (
              <div className="space-y-2">
                {linked.map((c) => (
                  <div key={c.id} className="glass-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="num-mono text-xs text-muted-foreground">{c.id}</span>
                          <Badge variant="outline" className={c.status === "Active" ? "border-rag-green/40 bg-rag-green/10 text-rag-green text-[10px]" : "border-rag-amber/40 bg-rag-amber/10 text-rag-amber text-[10px]"}>{c.status}</Badge>
                        </div>
                        <div className="mt-1 text-sm font-medium text-foreground">{c.project}</div>
                        <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                          <span className="num-mono text-accent font-medium">${c.value}M</span>
                          <span>Ends {c.end}</span>
                        </div>
                      </div>
                      <Link to="/procurement" onClick={onClose} className="shrink-0 inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground hover:border-accent/40 hover:text-accent transition-colors">
                        Open <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Evaluation scorecard */}
          <div>
            <div className="label-eyebrow mb-3">Evaluation Scorecard</div>
            <div className="space-y-3">
              {Object.entries(scores).map(([label, score]) => {
                const pct = (score / 5) * 100;
                const color = score >= 4.5 ? "bg-rag-green" : score >= 3.5 ? "bg-rag-amber" : "bg-rag-red";
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-24 shrink-0 text-xs text-muted-foreground">{label}</div>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/50">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="num-mono text-xs w-8 text-right text-foreground">{score}</span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3 w-3 ${s <= Math.round(score) ? "fill-rag-amber text-rag-amber" : "text-border"}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Last reviewed: Q1 2026 · Next review: Q3 2026</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 space-y-2">
          <Button variant="outline" className="w-full border-accent/40 text-accent hover:bg-accent-dim" onClick={() => setConnectOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />Connect existing contract
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </SheetContent>

      {/* Connect contracts dialog */}
      <Dialog open={connectOpen} onOpenChange={(o) => { if (!o) { setConnectOpen(false); setConnectSel([]); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Link contracts to {vendor.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <div className="rounded-md border border-border">
              <div className="px-2 py-1.5 space-y-0.5">
                {available.map((c) => {
                  const checked = connectSel.includes(c.id);
                  return (
                    <label key={c.id} className={`flex cursor-pointer items-center gap-2.5 rounded px-2 py-2 ${checked ? "bg-accent-dim/30" : "hover:bg-secondary/40"}`}>
                      <Checkbox checked={checked} onCheckedChange={() => toggleConnect(c.id)} className="shrink-0" />
                      <span className="num-mono text-[11px] text-muted-foreground shrink-0">{c.id}</span>
                      <span className="flex-1 truncate text-sm text-foreground">{c.project}</span>
                      <span className="num-mono text-xs text-accent shrink-0">${c.value}M</span>
                      <Badge variant="outline" className={`shrink-0 text-[10px] py-0 ${c.status === "Active" ? "border-rag-green/40 bg-rag-green/10 text-rag-green" : "border-rag-amber/40 bg-rag-amber/10 text-rag-amber"}`}>{c.status}</Badge>
                    </label>
                  );
                })}
                {available.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">All contracts are already linked.</p>
                )}
              </div>
            </div>
            {connectSel.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {connectSel.map((id) => {
                  const c = contracts.find((x) => x.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
                      <span className="num-mono">{c?.id}</span>
                      <span className="text-muted-foreground">·</span>
                      {c?.project}
                      <button onClick={() => toggleConnect(id)} className="ml-0.5 hover:text-rag-red"><X className="h-3 w-3" /></button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConnectOpen(false); setConnectSel([]); }}>Cancel</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleConnect}>
              Link {connectSel.length > 0 ? `${connectSel.length} contract${connectSel.length !== 1 ? "s" : ""}` : "selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
function Toolbar({ add }: { add: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="relative max-w-xs flex-1">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search…" className="pl-8" />
      </div>
      <div className="ml-auto">{add}</div>
    </div>
  );
}

// ── Add client dialog ─────────────────────────────────────────────────────────
function AddClientDialog() {
  const [open, setOpen]             = useState(false);
  const [name, setName]             = useState("");
  const [contact, setContact]       = useState("");
  const [email, setEmail]           = useState("");
  const [phone, setPhone]           = useState("");
  const [status, setStatus]         = useState("prospect");
  const [search, setSearch]         = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleSave() {
    if (!name.trim()) { toast.error("Company name is required"); return; }
    const desc = selectedIds.length > 0
      ? `${selectedIds.length} project${selectedIds.length > 1 ? "s" : ""} linked`
      : "No projects linked yet";
    toast.success(`${name.trim()} added`, { description: desc });
    setOpen(false);
    setName(""); setContact(""); setEmail(""); setPhone("");
    setStatus("prospect"); setSearch(""); setSelectedIds([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-1 h-4 w-4" />Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Company name <span className="text-rag-red">*</span></Label>
            <Input placeholder="ACME Energy" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Primary contact</Label>
            <Input placeholder="Full name" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input placeholder="contact@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Link to existing projects ─────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">
              Link to existing projects
              <span className="ml-1.5 text-muted-foreground font-normal">(optional)</span>
            </Label>
            {selectedIds.length > 0 && (
              <span className="text-xs text-accent font-medium">{selectedIds.length} selected</span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects…"
              className="h-8 pl-7 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Project checklist */}
          <ScrollArea className="h-40 rounded-md border border-border">
            <div className="p-1.5 space-y-0.5">
              {filtered.map((p) => {
                const checked = selectedIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors ${checked ? "bg-accent-dim/30" : "hover:bg-secondary/40"}`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(p.id)}
                      className="shrink-0"
                    />
                    <span className={`h-2 w-2 shrink-0 rounded-full ${RAG_DOT[p.rag]}`} />
                    <span className="flex-1 truncate text-sm text-foreground">{p.name}</span>
                    <Badge variant="outline" className="shrink-0 border-border bg-secondary/40 text-[10px] text-muted-foreground py-0">
                      {p.stage}
                    </Badge>
                  </label>
                );
              })}
              {filtered.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">No projects match "{search}"</p>
              )}
            </div>
          </ScrollArea>

          {/* Selected chips */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map((id) => {
                const p = projects.find((x) => x.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
                    <span className={`h-1.5 w-1.5 rounded-full ${RAG_DOT[p?.rag ?? "grey"]}`} />
                    {p?.name}
                    <button onClick={() => toggle(id)} className="ml-0.5 hover:text-rag-red">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave}>
            <Plus className="mr-1 h-3.5 w-3.5" />Add Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add vendor dialog ─────────────────────────────────────────────────────────
function AddVendorDialog() {
  const [open, setOpen]               = useState(false);
  const [name, setName]               = useState("");
  const [type, setType]               = useState("vendor");
  const [category, setCategory]       = useState("");
  const [notes, setNotes]             = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggle(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleSave() {
    if (!name.trim()) { toast.error("Company name is required"); return; }
    const desc = selectedIds.length > 0
      ? `${selectedIds.length} contract${selectedIds.length > 1 ? "s" : ""} linked`
      : "No contracts linked yet";
    toast.success(`${name.trim()} added to vendor pool`, { description: desc });
    setOpen(false);
    setName(""); setType("vendor"); setCategory(""); setNotes(""); setSelectedIds([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-1 h-4 w-4" />Add Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Vendor / Subcontractor</DialogTitle></DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Company name <span className="text-rag-red">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="sub">Subcontractor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Input placeholder="Hardware / Software / EPC…" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Approval notes</Label>
            <Input placeholder="Pre-qualification reference" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {/* ── Link to existing contracts ────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">
              Link to existing contracts
              <span className="ml-1.5 text-muted-foreground font-normal">(optional)</span>
            </Label>
            {selectedIds.length > 0 && (
              <span className="text-xs text-accent font-medium">{selectedIds.length} selected</span>
            )}
          </div>

          {/* Contract checklist — all contracts shown (claim unlinked ones) */}
          <div className="rounded-md border border-border">
            <div className="px-2 py-1.5 space-y-0.5">
              {contracts.map((c) => {
                const checked = selectedIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-center gap-2.5 rounded px-2 py-2 transition-colors ${checked ? "bg-accent-dim/30" : "hover:bg-secondary/40"}`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(c.id)}
                      className="shrink-0"
                    />
                    <span className="num-mono text-[11px] text-muted-foreground shrink-0">{c.id}</span>
                    <span className="flex-1 truncate text-sm text-foreground">{c.project}</span>
                    <span className="num-mono text-xs text-accent shrink-0">${c.value}M</span>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] py-0 ${c.status === "Active" ? "border-rag-green/40 bg-rag-green/10 text-rag-green" : "border-rag-amber/40 bg-rag-amber/10 text-rag-amber"}`}
                    >
                      {c.status}
                    </Badge>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Selected chips */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map((id) => {
                const c = contracts.find((x) => x.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
                    <span className="num-mono">{c?.id}</span>
                    <span className="text-muted-foreground">·</span>
                    {c?.project}
                    <button onClick={() => toggle(id)} className="ml-0.5 hover:text-rag-red">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave}>
            <Plus className="mr-1 h-3.5 w-3.5" />Add to pool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
