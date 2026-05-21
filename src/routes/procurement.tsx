import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus, RefreshCw, Star, ChevronRight, CheckCircle2, Clock,
  XCircle, Download, AlertTriangle, FileText, Loader2, Check, X,
} from "lucide-react";
import { rfps, contracts, vendors, projects } from "@/lib/mock-data";

export const Route = createFileRoute("/procurement")({
  component: ProcurementPage,
  head: () => ({ meta: [{ title: "Procurement — Nexus PMO" }, { name: "description", content: "RFI/RFP, contracts, vendor evaluation, ERP sync and cross-project subcontracted packages." }] }),
});

// ── Supplemental mock data ────────────────────────────────────────────────────

type RfpRow = typeof rfps[number];
type ContractRow = typeof contracts[number];

const RFP_BIDDERS: Record<string, { name: string; status: "Submitted" | "Pending" | "Withdrawn"; score?: number }[]> = {
  "RFP-014": [
    { name: "Siemens MENA",        status: "Submitted", score: 82 },
    { name: "ABB Group",           status: "Submitted", score: 76 },
    { name: "Schneider Electric",  status: "Submitted", score: 79 },
    { name: "Local Tech Co.",      status: "Pending" },
    { name: "Emerson Electric",    status: "Pending" },
  ],
  "RFI-009": [
    { name: "Oracle Consulting",   status: "Submitted", score: 88 },
    { name: "SAP SE",              status: "Submitted", score: 91 },
    { name: "Microsoft",           status: "Submitted", score: 85 },
    { name: "IBM",                 status: "Submitted", score: 72 },
    { name: "Accenture",           status: "Submitted", score: 80 },
    { name: "Deloitte Digital",    status: "Submitted", score: 77 },
    { name: "KPMG Tech",           status: "Submitted", score: 74 },
    { name: "EY Consulting",       status: "Withdrawn" },
    { name: "PwC Digital",         status: "Submitted", score: 69 },
    { name: "Capgemini",           status: "Submitted", score: 71 },
    { name: "Infosys",             status: "Submitted", score: 68 },
    { name: "Wipro",               status: "Withdrawn" },
  ],
  "RFP-013": [
    { name: "Bechtel Subcontract", status: "Submitted", score: 84 },
    { name: "Al Habtoor Leighton", status: "Submitted", score: 79 },
    { name: "ALEC Contracting",    status: "Submitted", score: 75 },
    { name: "Drake & Scull",       status: "Pending" },
  ],
  "RFP-012": [
    { name: "AWS MENA",            status: "Submitted", score: 91 },
    { name: "Microsoft Azure",     status: "Submitted", score: 88 },
    { name: "Google Cloud",        status: "Submitted", score: 85 },
    { name: "Oracle Cloud",        status: "Submitted", score: 74 },
    { name: "Alibaba Cloud",       status: "Submitted", score: 69 },
    { name: "IBM Cloud",           status: "Withdrawn" },
  ],
};

const RFP_CRITERIA: Record<string, { label: string; weight: number }[]> = {
  "RFP-014": [
    { label: "Technical capability & robotics experience", weight: 40 },
    { label: "Commercial terms & pricing",                 weight: 30 },
    { label: "Track record in similar projects",           weight: 20 },
    { label: "Local content requirement (≥ 30%)",         weight: 10 },
  ],
  "RFI-009": [
    { label: "AI/ML platform maturity",   weight: 35 },
    { label: "Integration capabilities",  weight: 30 },
    { label: "Support & SLA model",       weight: 20 },
    { label: "Pricing model",             weight: 15 },
  ],
  "RFP-013": [
    { label: "Civil works methodology",   weight: 35 },
    { label: "HSE track record",          weight: 30 },
    { label: "Schedule commitment",       weight: 20 },
    { label: "Price",                     weight: 15 },
  ],
  "RFP-012": [
    { label: "Security & compliance",     weight: 30 },
    { label: "Pricing & flexibility",     weight: 30 },
    { label: "Support SLA",              weight: 25 },
    { label: "Migration tooling",         weight: 15 },
  ],
};

const CONTRACT_MILESTONES: Record<string, { name: string; pct: number; value: number; status: "Paid" | "Pending" | "Overdue" }[]> = {
  "CT-2026-041": [
    { name: "Contract Signing / Mobilization", pct: 20, value: 0.84, status: "Paid" },
    { name: "Hardware Delivery Phase 1",        pct: 40, value: 1.68, status: "Paid" },
    { name: "Installation & Commissioning",     pct: 30, value: 1.26, status: "Pending" },
    { name: "Final Acceptance",                 pct: 10, value: 0.42, status: "Pending" },
  ],
  "CT-2026-038": [
    { name: "Project Kick-off",           pct: 15, value: 0.24, status: "Paid" },
    { name: "Phase 1 Delivery",           pct: 35, value: 0.56, status: "Paid" },
    { name: "UAT Sign-off",              pct: 35, value: 0.56, status: "Overdue" },
    { name: "Go-Live & Hypercare",        pct: 15, value: 0.24, status: "Pending" },
  ],
  "CT-2026-035": [
    { name: "Mobilization",              pct: 10, value: 1.80, status: "Paid" },
    { name: "Civil Works — Phase 1",      pct: 25, value: 4.50, status: "Paid" },
    { name: "Civil Works — Phase 2",      pct: 30, value: 5.40, status: "Pending" },
    { name: "Mechanical Completion",      pct: 25, value: 4.50, status: "Pending" },
    { name: "Final Handover",             pct: 10, value: 1.80, status: "Pending" },
  ],
  "CT-2026-029": [
    { name: "Pen-test Engagement Start",  pct: 30, value: 0.27, status: "Paid" },
    { name: "Interim Report",             pct: 40, value: 0.36, status: "Paid" },
    { name: "Final Report & Remediation", pct: 30, value: 0.27, status: "Pending" },
  ],
};

const CONTRACT_SCOPE: Record<string, string> = {
  "CT-2026-041": "Supply, delivery and installation of high-voltage switchgear, transformers and associated hardware for Substation Bravo. Includes factory acceptance testing (FAT), on-site commissioning and 12-month defects liability period.",
  "CT-2026-038": "Full-cycle ERP system upgrade from legacy platform to Oracle Cloud ERP, covering Finance, Procurement, and HR modules. Includes data migration, integration with 6 downstream systems, end-user training and hypercare support.",
  "CT-2026-035": "Engineering, Procurement and Construction (EPC) contract for the civil works component of the Coastal Refinery Expansion. Scope includes foundation works, structural steel, piping and associated civil infrastructure.",
  "CT-2026-029": "Penetration testing engagement covering network infrastructure, web applications and OT/SCADA systems. Deliverables include a detailed vulnerability report, CVSS scoring and a remediation roadmap.",
};

// ── ERP reconciliation data ───────────────────────────────────────────────────
const ERP_ISSUES = [
  { id: "CT-2026-035", field: "Contract value", nexus: "$18.00M", erp: "$17.85M", s: "red" as const },
  { id: "PO-2026-109", field: "GR quantity",    nexus: "420 units", erp: "410 units", s: "red" as const },
  { id: "INV-2026-054", field: "Invoice amount", nexus: "$1.60M", erp: "$1.58M",  s: "amber" as const },
];

// ── Page ──────────────────────────────────────────────────────────────────────
function ProcurementPage() {
  const [rfpList, setRfpList]         = useState<RfpRow[]>([...rfps]);
  const [rfpView, setRfpView]         = useState<RfpRow | null>(null);
  const [contractView, setContractView] = useState<ContractRow | null>(null);
  const [syncing, setSyncing]         = useState(false);
  const [lastSync, setLastSync]       = useState("3 min ago");
  const [syncCount, setSyncCount]     = useState(142);
  const [resolved, setResolved]       = useState<string[]>([]);

  function handleSync() {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      const count = syncCount + Math.floor(Math.random() * 8) + 1;
      setSyncCount(count);
      setLastSync("just now");
      toast.success("ERP sync complete", { description: `${count} PO records pushed · 0 errors` });
    }, 1800);
  }

  function resolveIssue(id: string, choice: "nexus" | "erp") {
    setResolved((prev) => [...prev, id]);
    const label = choice === "nexus" ? "Nexus value accepted" : "ERP value accepted";
    toast.success(`${id} resolved`, { description: label });
  }

  const openIssues = ERP_ISSUES.filter((r) => !resolved.includes(r.id));

  return (
    <div>
      <PageHeader
        title="Procurement"
        subtitle="RFI/RFP, contracts, vendor evaluation, ERP sync"
        actions={<NewRfpDialog onAdd={(r) => setRfpList((prev) => [r, ...prev])} />}
      />

      <Tabs defaultValue="rfp">
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="rfp">RFI / RFP Requests</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="eval">Vendor Evaluation</TabsTrigger>
          <TabsTrigger value="erp">ERP Sync</TabsTrigger>
          <TabsTrigger value="subs">Subcontracted Packages</TabsTrigger>
        </TabsList>

        {/* ── RFP tab ─────────────────────────────────────────────────── */}
        <TabsContent value="rfp" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>ID</TableHead><TableHead>Title</TableHead><TableHead>Type</TableHead>
              <TableHead>Status</TableHead><TableHead>Bidders</TableHead><TableHead>Due</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>{rfpList.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="num-mono text-xs">{r.id}</TableCell>
                <TableCell className="font-medium text-foreground">{r.title}</TableCell>
                <TableCell><Badge variant="outline" className="border-accent/40 bg-accent-dim text-accent">{r.type}</Badge></TableCell>
                <TableCell><Badge variant="outline" className={
                  r.status === "Open"       ? "border-rag-green/40 bg-rag-green/10 text-rag-green" :
                  r.status === "Evaluation" ? "border-rag-amber/40 bg-rag-amber/10 text-rag-amber" :
                  r.status === "Awarded"    ? "border-role-director/40 bg-role-director/10 text-role-director" :
                                              "border-border bg-secondary/40 text-muted-foreground"}>
                  {r.status}
                </Badge></TableCell>
                <TableCell className="num-mono">{r.bidders}</TableCell>
                <TableCell className="text-xs">{r.due}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => setRfpView(r)}>
                    Open <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>

        {/* ── Contracts tab ───────────────────────────────────────────── */}
        <TabsContent value="contracts" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>ID</TableHead><TableHead>Vendor</TableHead><TableHead>Project</TableHead>
              <TableHead>Value</TableHead><TableHead>Status</TableHead><TableHead>End</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>{contracts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="num-mono text-xs">{c.id}</TableCell>
                <TableCell className="font-medium">{c.vendor}</TableCell>
                <TableCell>{c.project}</TableCell>
                <TableCell className="num-mono">${c.value}M</TableCell>
                <TableCell><Badge variant="outline" className={c.status === "Active" ? "border-rag-green/40 bg-rag-green/10 text-rag-green" : "border-rag-amber/40 bg-rag-amber/10 text-rag-amber"}>{c.status}</Badge></TableCell>
                <TableCell className="text-xs">{c.end}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => setContractView(c)}>
                    Open <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>

        {/* ── Vendor evaluation tab ────────────────────────────────────── */}
        <TabsContent value="eval" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Vendor</TableHead><TableHead>Score</TableHead><TableHead>Delivery</TableHead>
              <TableHead>Quality</TableHead><TableHead>Commercial</TableHead><TableHead>Last review</TableHead>
            </TableRow></TableHeader>
            <TableBody>{vendors.map((v) => (
              <TableRow key={v.name}>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell><span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-rag-amber text-rag-amber" /><span className="num-mono">{v.eval}</span></span></TableCell>
                <TableCell className="num-mono">{(v.eval * 0.95).toFixed(1)}</TableCell>
                <TableCell className="num-mono">{(v.eval * 1.02).toFixed(1)}</TableCell>
                <TableCell className="num-mono">{(v.eval * 0.97).toFixed(1)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">Q1 2026</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>

        {/* ── ERP sync tab ─────────────────────────────────────────────── */}
        <TabsContent value="erp" className="mt-5 space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="label-eyebrow">ERP integration</div>
                <div className="mt-1 text-foreground">
                  SAP S/4HANA · Last sync {lastSync} · {syncCount} PO records pushed today
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                {syncing
                  ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Syncing…</>
                  : <><RefreshCw className="mr-1 h-4 w-4" />Sync now</>}
              </Button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {[
                { l: "POs synced today",   v: String(syncCount) },
                { l: "GR confirmations",   v: "98" },
                { l: "Invoices matched",   v: "61" },
                { l: "Sync errors",        v: String(openIssues.length), c: openIssues.length > 0 ? "text-rag-red" : "text-rag-green" },
              ].map((k) => (
                <div key={k.l} className="rounded-md border border-border bg-background/30 p-3">
                  <div className="label-eyebrow">{k.l}</div>
                  <div className={`mt-1 text-xl font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Out-of-sync reconciliation */}
          {openIssues.length > 0 ? (
            <div className="glass-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="label-eyebrow">Out-of-sync records — reconciliation required</div>
                <Badge variant="outline" className="border-rag-red/40 bg-rag-red/10 text-rag-red">
                  {openIssues.length} item{openIssues.length > 1 ? "s" : ""}
                </Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record</TableHead><TableHead>Field</TableHead>
                    <TableHead>Nexus value</TableHead><TableHead>ERP value</TableHead>
                    <TableHead>Sync status</TableHead><TableHead className="w-44" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openIssues.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-foreground num-mono text-xs">{r.id}</TableCell>
                      <TableCell className="text-muted-foreground">{r.field}</TableCell>
                      <TableCell className="num-mono text-accent">{r.nexus}</TableCell>
                      <TableCell className="num-mono text-rag-amber">{r.erp}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 text-xs ${r.s === "red" ? "text-rag-red" : "text-rag-amber"}`}>
                          <span className={`h-2 w-2 rounded-full ${r.s === "red" ? "bg-rag-red" : "bg-rag-amber"}`} />
                          {r.s === "red" ? "Out of sync" : "Minor delta"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                            onClick={() => resolveIssue(r.id, "nexus")}>
                            Use Nexus
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                            onClick={() => resolveIssue(r.id, "erp")}>
                            Use ERP
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-rag-green mb-2" />
              <p className="text-sm font-medium text-foreground">All records in sync</p>
              <p className="text-xs text-muted-foreground mt-1">No reconciliation required.</p>
            </div>
          )}
        </TabsContent>

        {/* ── Subcontracted packages tab ───────────────────────────────── */}
        <TabsContent value="subs" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Package</TableHead><TableHead>Project</TableHead><TableHead>Subcontractor</TableHead>
              <TableHead>Value</TableHead><TableHead>Progress</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{[
              { p: "Civil works phase 1", pr: "Refinery Expansion", s: "Bechtel Subcontract", v: 9.4, prog: 62, st: "amber" },
              { p: "Crane operations Q3", pr: "LNG Refit",          s: "Local Crane Co.",     v: 1.1, prog: 28, st: "green" },
              { p: "Cyber pen-testing",   pr: "Security Hardening", s: "Cyberguard",          v: 0.6, prog: 81, st: "green" },
              { p: "Training rollout",    pr: "ERP Upgrade",        s: "Oracle Consulting",   v: 0.3, prog: 12, st: "blue" },
            ].map((r) => (
              <TableRow key={r.p}>
                <TableCell className="font-medium">{r.p}</TableCell>
                <TableCell>{r.pr}</TableCell>
                <TableCell>{r.s}</TableCell>
                <TableCell className="num-mono">${r.v}M</TableCell>
                <TableCell className="w-40">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/50">
                      <div className={`h-full bg-rag-${r.st}`} style={{ width: `${r.prog}%` }} />
                    </div>
                    <span className="num-mono text-xs">{r.prog}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`border-rag-${r.st}/40 bg-rag-${r.st}/10 text-rag-${r.st}`}>
                    {r.st === "green" ? "On Track" : r.st === "amber" ? "At Risk" : "Not Started"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* ── Detail sheets (rendered outside tabs) ───────────────────────────── */}
      <RfpSheet key={rfpView?.id ?? "none"} rfp={rfpView} onClose={() => setRfpView(null)} />
      <ContractSheet contract={contractView} onClose={() => setContractView(null)} />
    </div>
  );
}

// ── New RFP dialog ────────────────────────────────────────────────────────────
function NewRfpDialog({ onAdd }: { onAdd: (r: RfpRow) => void }) {
  const [open, setOpen]       = useState(false);
  const [title, setTitle]     = useState("");
  const [type, setType]       = useState<"RFP" | "RFI">("RFP");
  const [project, setProject] = useState("");
  const [due, setDue]         = useState("");
  const [desc, setDesc]       = useState("");

  function handlePublish() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!due)          { toast.error("Due date is required"); return; }
    const id = `${type}-${String(Math.floor(Math.random() * 900) + 100)}`;
    onAdd({ id, title: title.trim(), type, status: "Open", bidders: 0, due });
    toast.success(`${id} published`, { description: title.trim() });
    setOpen(false);
    setTitle(""); setType("RFP"); setProject(""); setDue(""); setDesc("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-1 h-4 w-4" />New RFP
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Publish New RFI / RFP</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Title <span className="text-rag-red">*</span></Label>
            <Input placeholder="e.g. Cloud Infrastructure Partner" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "RFP" | "RFI")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RFP">RFP — Request for Proposal</SelectItem>
                  <SelectItem value="RFI">RFI — Request for Information</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due date <span className="text-rag-red">*</span></Label>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Linked project</Label>
            <Select value={project} onValueChange={setProject}>
              <SelectTrigger><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Scope / description</Label>
            <Textarea
              placeholder="Describe the scope, requirements and evaluation intent…"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handlePublish}>
            <FileText className="mr-1 h-3.5 w-3.5" />Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── RFP detail sheet ──────────────────────────────────────────────────────────
function RfpSheet({ rfp, onClose }: { rfp: RfpRow | null; onClose: () => void }) {
  const [status, setStatus]               = useState(rfp?.status ?? "Open");
  const [localBidders, setLocalBidders]   = useState(() => rfp ? (RFP_BIDDERS[rfp.id] ?? []) : []);
  const [addBidOpen, setAddBidOpen]       = useState(false);
  const [addBidVendor, setAddBidVendor]   = useState("");
  const [addBidScore, setAddBidScore]     = useState("");

  if (!rfp) return null;

  const criteria   = RFP_CRITERIA[rfp.id] ?? [];
  const submitted  = localBidders.filter((b) => b.status === "Submitted");
  const isTerminal = status === "Awarded" || status === "Closed";

  function handleAddBid() {
    if (!addBidVendor.trim()) { toast.error("Vendor name required"); return; }
    const score = addBidScore ? Math.min(100, Math.max(0, parseInt(addBidScore))) : undefined;
    setLocalBidders((prev) => [...prev, { name: addBidVendor.trim(), status: "Submitted" as const, score }]);
    toast.success(`Bid from ${addBidVendor.trim()} recorded`);
    setAddBidVendor(""); setAddBidScore(""); setAddBidOpen(false);
  }

  const STATUS_ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
    "Open":       [{ label: "Move to Evaluation", next: "Evaluation", color: "bg-rag-amber text-black" }],
    "Evaluation": [{ label: "Award Contract",     next: "Awarded",   color: "bg-rag-green text-black" }],
    "Awarded":    [],
    "Closed":     [],
  };

  function advance(next: string) {
    setStatus(next);
    toast.success(`${rfp?.id} moved to ${next}`, { description: rfp?.title });
  }

  return (
    <Sheet open={!!rfp} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-[520px] max-w-full p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-accent mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base leading-snug">{rfp.title}</SheetTitle>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="num-mono text-xs text-muted-foreground">{rfp.id}</span>
                <Badge variant="outline" className="border-accent/40 bg-accent-dim text-accent text-[10px]">{rfp.type}</Badge>
                <Badge variant="outline" className={
                  status === "Open"       ? "border-rag-green/40 bg-rag-green/10 text-rag-green text-[10px]" :
                  status === "Evaluation" ? "border-rag-amber/40 bg-rag-amber/10 text-rag-amber text-[10px]" :
                  status === "Awarded"    ? "border-role-director/40 bg-role-director/10 text-role-director text-[10px]" :
                                           "border-border bg-secondary/40 text-muted-foreground text-[10px]"}>
                  {status}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* KPI strip */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          {[
            { l: "Bidders",   v: String(localBidders.length || rfp.bidders) },
            { l: "Submitted", v: String(submitted.length) },
            { l: "Due",       v: rfp.due },
          ].map((k) => (
            <div key={k.l} className="px-4 py-3">
              <div className="label-eyebrow text-[10px]">{k.l}</div>
              <div className="mt-0.5 text-sm font-medium text-foreground num-mono">{k.v}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Evaluation criteria */}
          {criteria.length > 0 && (
            <div>
              <div className="label-eyebrow mb-2">Evaluation criteria</div>
              <div className="space-y-1.5">
                {criteria.map((c) => (
                  <div key={c.label} className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/50">
                      <div className="h-full rounded-full bg-accent/60" style={{ width: `${c.weight}%` }} />
                    </div>
                    <span className="num-mono text-xs w-8 shrink-0 text-right text-accent">{c.weight}%</span>
                    <span className="text-xs text-muted-foreground flex-[2] truncate">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Bidder submissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="label-eyebrow">Bidder submissions</div>
              {!isTerminal && !addBidOpen && (
                <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-accent"
                  onClick={() => setAddBidOpen(true)}>
                  <Plus className="h-3 w-3" />Record bid
                </button>
              )}
            </div>
            {localBidders.length === 0 && !addBidOpen ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-6 text-center">
                <p className="text-sm text-muted-foreground">No bids recorded yet.</p>
                {!isTerminal && (
                  <button className="text-xs text-accent hover:underline" onClick={() => setAddBidOpen(true)}>+ Record first bid</button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {localBidders.map((b) => (
                  <div key={b.name} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                    <div className="flex-1 text-sm font-medium text-foreground">{b.name}</div>
                    {b.status === "Submitted" && b.score !== undefined && (
                      <span className={`num-mono text-xs font-medium ${b.score >= 80 ? "text-rag-green" : b.score >= 70 ? "text-rag-amber" : "text-rag-red"}`}>
                        {b.score} pts
                      </span>
                    )}
                    <Badge variant="outline" className={
                      b.status === "Submitted" ? "border-rag-green/40 bg-rag-green/10 text-rag-green text-[10px]" :
                      b.status === "Withdrawn" ? "border-rag-red/40 bg-rag-red/10 text-rag-red text-[10px]" :
                                                 "border-border bg-secondary/40 text-muted-foreground text-[10px]"}>
                      {b.status === "Submitted" ? <><Check className="mr-0.5 h-2.5 w-2.5" />{b.status}</> : b.status}
                    </Badge>
                    {b.status === "Submitted" && !isTerminal && (
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]"
                        onClick={() => { toast.success(`${b.name} awarded ${rfp.id}`); setStatus("Awarded"); }}>
                        Award
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add bid form */}
            {!isTerminal && addBidOpen && (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-dashed border-accent/40 bg-accent-dim/20 p-2">
                <Input
                  className="h-7 flex-1 text-sm"
                  placeholder="Vendor name…"
                  value={addBidVendor}
                  onChange={(e) => setAddBidVendor(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddBid(); }}
                  autoFocus
                />
                <Input
                  className="h-7 w-20 text-sm num-mono"
                  placeholder="Score"
                  type="number"
                  min={0}
                  max={100}
                  value={addBidScore}
                  onChange={(e) => setAddBidScore(e.target.value)}
                />
                <Button size="sm" className="h-7 bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 px-3" onClick={handleAddBid}>
                  Add
                </Button>
                <Button size="sm" variant="ghost" className="h-7 shrink-0 px-2"
                  onClick={() => { setAddBidOpen(false); setAddBidVendor(""); setAddBidScore(""); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        {!isTerminal && (
          <div className="border-t border-border px-6 py-4 space-y-2">
            {STATUS_ACTIONS[status]?.map((a) => (
              <Button key={a.label} className={`w-full ${a.color}`} onClick={() => advance(a.next)}>
                {a.label}
              </Button>
            ))}
            <Button variant="outline" className="w-full text-muted-foreground"
              onClick={() => { setStatus("Closed"); toast.success(`${rfp.id} closed`); }}>
              Close RFP
            </Button>
          </div>
        )}
        {isTerminal && (
          <div className="border-t border-border px-6 py-4">
            <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Contract detail sheet ─────────────────────────────────────────────────────
function ContractSheet({ contract, onClose }: { contract: ContractRow | null; onClose: () => void }) {
  const [renewOpen, setRenewOpen] = useState(false);

  if (!contract) return null;

  const milestones = CONTRACT_MILESTONES[contract.id] ?? [];
  const scope      = CONTRACT_SCOPE[contract.id] ?? "No scope description available.";
  const paid       = milestones.filter((m) => m.status === "Paid").reduce((s, m) => s + m.value, 0);
  const paidPct    = contract.value > 0 ? Math.round((paid / contract.value) * 100) : 0;

  function handleRenew(months: number) {
    toast.success(`${contract?.id} renewal initiated`, { description: `+${months} months extension` });
    setRenewOpen(false);
  }

  return (
    <Sheet open={!!contract} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-[520px] max-w-full p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-accent mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base">{contract.vendor}</SheetTitle>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="num-mono text-xs text-muted-foreground">{contract.id}</span>
                <Badge variant="outline" className={contract.status === "Active" ? "border-rag-green/40 bg-rag-green/10 text-rag-green text-[10px]" : "border-rag-amber/40 bg-rag-amber/10 text-rag-amber text-[10px]"}>
                  {contract.status}
                </Badge>
                {contract.status === "Expiring" && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-rag-amber">
                    <AlertTriangle className="h-3 w-3" /> Expiring soon
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* KPI strip */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          {[
            { l: "Contract value", v: `$${contract.value}M` },
            { l: "Paid to date",   v: `$${paid.toFixed(2)}M (${paidPct}%)` },
            { l: "Ends",           v: contract.end },
          ].map((k) => (
            <div key={k.l} className="px-4 py-3">
              <div className="label-eyebrow text-[10px]">{k.l}</div>
              <div className="mt-0.5 text-sm font-medium text-foreground num-mono">{k.v}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Project */}
          <div className="rounded-md border border-border bg-secondary/20 px-4 py-3 text-sm">
            <span className="label-eyebrow text-[10px]">Linked project</span>
            <div className="mt-0.5 font-medium text-foreground">{contract.project}</div>
          </div>

          {/* Scope */}
          <div>
            <div className="label-eyebrow mb-2">Contract scope</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{scope}</p>
          </div>

          <Separator />

          {/* Payment milestones */}
          <div>
            <div className="label-eyebrow mb-2">Payment milestones</div>
            <div className="space-y-2">
              {milestones.map((m, i) => {
                const Icon = m.status === "Paid" ? CheckCircle2 : m.status === "Overdue" ? AlertTriangle : Clock;
                const color = m.status === "Paid" ? "text-rag-green" : m.status === "Overdue" ? "text-rag-red" : "text-muted-foreground";
                return (
                  <div key={i} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
                    <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.pct}% of contract</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="num-mono text-sm font-medium text-foreground">${m.value.toFixed(2)}M</div>
                      <div className={`text-[11px] ${color}`}>{m.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-border px-6 py-4 space-y-2">
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setRenewOpen(true)}
            >
              Renew Contract
            </Button>
            <Button variant="outline" className="flex-1"
              onClick={() => toast.success("Download started", { description: `${contract.id}.pdf` })}>
              <Download className="mr-1 h-3.5 w-3.5" />Download PDF
            </Button>
          </div>
          <Button variant="outline" className="w-full text-rag-red hover:border-rag-red/40 hover:bg-rag-red/10"
            onClick={() => { toast.error("Flagged for review", { description: contract.id }); onClose(); }}>
            Flag for Review
          </Button>
        </div>
      </SheetContent>

      {/* Renew dialog (nested) */}
      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Renew contract</DialogTitle></DialogHeader>
          <div className="text-sm text-muted-foreground">
            <span className="num-mono text-foreground">{contract.id}</span> · {contract.vendor} · currently ends <span className="font-medium text-foreground">{contract.end}</span>
          </div>
          <div>
            <Label>Extension period</Label>
            <Select defaultValue="6">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 months</SelectItem>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="24">24 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Renewal notes</Label>
            <Textarea placeholder="Reason for renewal, scope changes…" rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewOpen(false)}>Cancel</Button>
            <Button className="bg-accent text-accent-foreground" onClick={() => handleRenew(6)}>
              Confirm Renewal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
