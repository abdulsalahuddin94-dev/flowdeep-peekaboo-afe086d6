import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resources, projects, departments } from "@/lib/mock-data";
import { Upload, Plus, CheckCircle2, XCircle, Clock, AlertTriangle, UserCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/resources")({
  component: ResourcesPage,
  head: () => ({ meta: [{ title: "Resources — Nexus PMO" }, { name: "description", content: "Capacity planning, allocation vs assignment, utilization heatmap and skill demand." }] }),
});

// ── Resource request types ────────────────────────────────────────────────────

type RequestStatus = "Pending" | "Fulfilled" | "Declined";
type Priority = "Critical" | "High" | "Medium" | "Low";

interface ResourceRequest {
  id: string;
  project: string;
  role: string;
  skill: "Junior" | "Mid" | "Senior" | "Lead";
  fte: number;
  from: string;
  until: string;
  priority: Priority;
  status: RequestStatus;
  submittedBy: string;
  date: string;
  notes: string;
  assignedTo?: string;
  declineReason?: string;
}

const SEED_REQUESTS: ResourceRequest[] = [
  { id: "RR-001", project: "ERP System Upgrade",        role: "Solution Architect", skill: "Senior", fte: 1.0, from: "2026-06", until: "2026-09", priority: "Critical", status: "Pending",   submittedBy: "Sara Al-Rashid", date: "2d ago",  notes: "Must have SAP ECC or S/4HANA experience" },
  { id: "RR-002", project: "Coastal Refinery Expansion", role: "Field Engineer",    skill: "Senior", fte: 2.0, from: "2026-07", until: "2026-12", priority: "High",     status: "Pending",   submittedBy: "John Smith",     date: "3d ago",  notes: "" },
  { id: "RR-003", project: "Smart Grid Pilot",           role: "QA Engineer",       skill: "Mid",    fte: 1.0, from: "2026-07", until: "2026-09", priority: "Medium",   status: "Pending",   submittedBy: "Priya Iyer",     date: "5d ago",  notes: "" },
  { id: "RR-004", project: "AI Forecasting Engine",      role: "Data Engineer",     skill: "Mid",    fte: 1.5, from: "2026-06", until: "2026-11", priority: "Medium",   status: "Pending",   submittedBy: "Diego Ortiz",    date: "6d ago",  notes: "Python + Spark stack preferred" },
  { id: "RR-005", project: "Security Hardening 2026",    role: "Security Lead",     skill: "Senior", fte: 0.5, from: "2026-08", until: "2026-08", priority: "Critical", status: "Fulfilled", submittedBy: "Mei Chen",       date: "1w ago",  notes: "Pen-test cert required", assignedTo: "Mei Chen" },
  { id: "RR-006", project: "Warehouse Robotics",         role: "Change Manager",    skill: "Mid",    fte: 0.5, from: "2026-09", until: "2026-09", priority: "Low",      status: "Declined",  submittedBy: "Priya Iyer",     date: "1w ago",  notes: "", declineReason: "No available change managers this quarter — recommend external consultant" },
];

const PRIORITY_STYLE: Record<Priority, string> = {
  Critical: "border-rag-red/40 bg-rag-red/10 text-rag-red",
  High:     "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
  Medium:   "border-rag-blue/40 bg-rag-blue/10 text-rag-blue",
  Low:      "border-border bg-secondary/40 text-muted-foreground",
};

// ── Page ─────────────────────────────────────────────────────────────────────

type PoolResource = typeof resources[number];

function ResourcesPage() {
  const [pool, setPool] = useState<PoolResource[]>(resources.map((r) => ({ ...r })));
  const [requests, setRequests] = useState<ResourceRequest[]>(SEED_REQUESTS);

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  function addToPool(entry: PoolResource) {
    setPool((prev) => [...prev, entry]);
  }

  function fulfillRequest(id: string, assignedTo: string, alloc: number) {
    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "Fulfilled", assignedTo } : r)
    );
    const req = requests.find((r) => r.id === id);
    toast.success(`${req?.role} assigned to ${req?.project}`, {
      description: `${assignedTo} · ${alloc}% allocation · ${req?.from} → ${req?.until}`,
    });
  }

  function declineRequest(id: string, reason: string) {
    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "Declined", declineReason: reason } : r)
    );
    const req = requests.find((r) => r.id === id);
    toast.success(`Request ${id} declined`, { description: req?.project });
  }

  return (
    <div>
      <PageHeader
        title="Resources"
        subtitle="People, capacity & allocation across the portfolio"
        actions={
          <>
            <Button variant="outline" size="sm"><Upload className="mr-1 h-4 w-4" />Import Excel</Button>
            <AddResourceDialog onAdd={addToPool} />
          </>
        }
      />

      {/* KPI strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { l: "Headcount",       v: String(pool.length) },
          { l: "Avg utilization", v: "78%",  c: "text-rag-green" },
          { l: "Over-allocated",  v: "3",    c: "text-rag-red" },
          { l: "Bench",           v: "12" },
          { l: "Open requests",   v: String(pendingCount), c: pendingCount > 0 ? "text-rag-amber" : "text-foreground" },
        ].map((k) => (
          <div key={k.l} className="glass-card p-4">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="requests">
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="requests" className="relative">
            Requests
            {pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rag-amber px-1 text-[10px] font-bold text-black">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="heatmap">Utilization Heatmap</TabsTrigger>
          <TabsTrigger value="planning">Manpower Planning</TabsTrigger>
          <TabsTrigger value="skills">Skill Demand</TabsTrigger>
        </TabsList>

        {/* ── Requests tab ──────────────────────────────────────────────────── */}
        <TabsContent value="requests" className="mt-5 space-y-3">
          <RequestsTab
            requests={requests}
            pool={pool}
            onFulfill={fulfillRequest}
            onDecline={declineRequest}
          />
        </TabsContent>

        {/* ── People tab ────────────────────────────────────────────────────── */}
        <TabsContent value="people" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead>Department</TableHead>
                <TableHead>Capacity / wk</TableHead><TableHead>Utilization</TableHead><TableHead>Projects</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pool.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-accent-dim text-[10px] text-accent">
                          {r.name.split(" ").map((s) => s[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {r.name}
                    </div>
                  </TableCell>
                  <TableCell>{r.role}</TableCell>
                  <TableCell className="text-muted-foreground">{r.dept}</TableCell>
                  <TableCell className="num-mono">{r.capacity}h</TableCell>
                  <TableCell className="w-44">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min(r.util, 100)}
                        className={`h-1.5 ${r.util > 100 ? "[&>div]:bg-rag-red" : r.util > 90 ? "[&>div]:bg-rag-amber" : "[&>div]:bg-rag-green"}`}
                      />
                      <span className={`num-mono text-xs ${r.util > 100 ? "text-rag-red" : r.util > 90 ? "text-rag-amber" : "text-foreground"}`}>{r.util}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.projects.join(", ")}</TableCell>
                  <TableCell><AssignDialog resource={r} onAssign={(projectName, alloc) => setPool((prev) => prev.map((x) => x.name === r.name ? { ...x, util: Math.min(x.util + alloc, 200), projects: x.projects.includes(projectName) ? x.projects : [...x.projects, projectName] } : x))} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* ── Heatmap tab ───────────────────────────────────────────────────── */}
        <TabsContent value="heatmap" className="mt-5 glass-card p-5">
          <Heatmap pool={pool} />
        </TabsContent>

        {/* ── Manpower planning tab ─────────────────────────────────────────── */}
        <TabsContent value="planning" className="mt-5 glass-card p-5 text-sm">
          <div className="label-eyebrow mb-3">Forward manpower plan · next quarter</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead><TableHead>Demand (FTE)</TableHead>
                <TableHead>Supply</TableHead><TableHead>Gap</TableHead><TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { r: "Solution Architect", d: 4, s: 2, a: "Hire 2 / partner" },
                { r: "QA Engineer",        d: 8, s: 6, a: "Hire 1 / subcontract 1" },
                { r: "Field Engineer",     d: 6, s: 7, a: "Capacity ok" },
                { r: "Security Lead",      d: 2, s: 1, a: "Critical hire" },
              ].map((row) => {
                const gap = row.d - row.s;
                return (
                  <TableRow key={row.r}>
                    <TableCell>{row.r}</TableCell>
                    <TableCell className="num-mono">{row.d}</TableCell>
                    <TableCell className="num-mono">{row.s}</TableCell>
                    <TableCell className={`num-mono ${gap > 0 ? "text-rag-red" : "text-rag-green"}`}>{gap > 0 ? `+${gap}` : gap}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.a}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>

        {/* ── Skill demand tab ──────────────────────────────────────────────── */}
        <TabsContent value="skills" className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            { s: "Cloud Architecture",       c: "High",     n: 12 },
            { s: "Industrial Control Systems",c: "Critical", n: 4 },
            { s: "Data Engineering",          c: "Medium",   n: 9 },
            { s: "Cyber Security",            c: "Critical", n: 3 },
            { s: "Project Management",        c: "Medium",   n: 22 },
            { s: "Procurement / Contracts",   c: "Low",      n: 6 },
          ].map((s) => (
            <div key={s.s} className="glass-card p-4">
              <div className="text-sm font-medium text-foreground">{s.s}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.n} people available</div>
              <div className={`mt-2 inline-block rounded px-2 py-0.5 text-[11px] ${
                s.c === "Critical" ? "bg-rag-red/10 text-rag-red" :
                s.c === "High"     ? "bg-rag-amber/10 text-rag-amber" :
                s.c === "Medium"   ? "bg-rag-blue/10 text-rag-blue" :
                                     "bg-rag-green/10 text-rag-green"
              }`}>{s.c} demand</div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Requests tab component ────────────────────────────────────────────────────

function RequestsTab({
  requests,
  pool,
  onFulfill,
  onDecline,
}: {
  requests: ResourceRequest[];
  pool: PoolResource[];
  onFulfill: (id: string, assignedTo: string, alloc: number) => void;
  onDecline: (id: string, reason: string) => void;
}) {
  const pending   = requests.filter((r) => r.status === "Pending");
  const fulfilled = requests.filter((r) => r.status === "Fulfilled");
  const declined  = requests.filter((r) => r.status === "Declined");

  return (
    <div className="space-y-6">
      {/* ── Pending ── */}
      {pending.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-rag-amber" />
            <span className="label-eyebrow text-rag-amber">Pending ({pending.length})</span>
          </div>
          <div className="space-y-2">
            {pending.map((req) => (
              <RequestCard key={req.id} req={req} pool={pool} onFulfill={onFulfill} onDecline={onDecline} />
            ))}
          </div>
        </div>
      )}

      {/* ── Fulfilled ── */}
      {fulfilled.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-rag-green" />
            <span className="label-eyebrow text-rag-green">Fulfilled ({fulfilled.length})</span>
          </div>
          <div className="space-y-2">
            {fulfilled.map((req) => (
              <RequestCard key={req.id} req={req} pool={pool} onFulfill={onFulfill} onDecline={onDecline} />
            ))}
          </div>
        </div>
      )}

      {/* ── Declined ── */}
      {declined.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <XCircle className="h-3.5 w-3.5 text-rag-red" />
            <span className="label-eyebrow text-rag-red">Declined ({declined.length})</span>
          </div>
          <div className="space-y-2">
            {declined.map((req) => (
              <RequestCard key={req.id} req={req} pool={pool} onFulfill={onFulfill} onDecline={onDecline} />
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">
          No resource requests yet. PMs submit them from Project → Planning → Manpower Requirements.
        </div>
      )}
    </div>
  );
}

// ── Individual request card ───────────────────────────────────────────────────

function RequestCard({
  req,
  pool,
  onFulfill,
  onDecline,
}: {
  req: ResourceRequest;
  pool: PoolResource[];
  onFulfill: (id: string, assignedTo: string, alloc: number) => void;
  onDecline: (id: string, reason: string) => void;
}) {
  const StatusIcon = req.status === "Fulfilled" ? CheckCircle2
                   : req.status === "Declined"  ? XCircle
                   : Clock;
  const statusColor = req.status === "Fulfilled" ? "text-rag-green"
                    : req.status === "Declined"  ? "text-rag-red"
                    : "text-rag-amber";

  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-start gap-3">
        {/* Left: request details */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="num-mono text-xs text-muted-foreground">{req.id}</span>
            <Badge variant="outline" className={`text-[10px] ${PRIORITY_STYLE[req.priority]}`}>
              {req.priority}
            </Badge>
            {req.priority === "Critical" && (
              <AlertTriangle className="h-3 w-3 text-rag-red" />
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-medium text-foreground">{req.role}</span>
            <span className="text-xs text-muted-foreground">({req.skill})</span>
            <span className="text-xs text-accent num-mono">{req.fte} FTE</span>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span>Project: <span className="text-foreground">{req.project}</span></span>
            <span>Period: <span className="num-mono text-foreground">{req.from} → {req.until}</span></span>
            <span>By: {req.submittedBy} · {req.date}</span>
          </div>

          {req.notes && (
            <div className="mt-1.5 text-xs text-muted-foreground italic">"{req.notes}"</div>
          )}

          {req.status === "Fulfilled" && req.assignedTo && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-rag-green/30 bg-rag-green/10 px-2 py-1 text-xs text-rag-green">
              <CheckCircle2 className="h-3 w-3" />
              Assigned to <span className="font-medium">{req.assignedTo}</span>
            </div>
          )}

          {req.status === "Declined" && req.declineReason && (
            <div className="mt-2 inline-flex items-start gap-1.5 rounded-md border border-rag-red/30 bg-rag-red/10 px-2 py-1 text-xs text-rag-red">
              <XCircle className="h-3 w-3 mt-px shrink-0" />
              <span>{req.declineReason}</span>
            </div>
          )}
        </div>

        {/* Right: status + actions */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className={`flex items-center gap-1 text-xs ${statusColor}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {req.status}
          </div>
          {req.status === "Pending" && (
            <div className="flex gap-2">
              <FulfillDialog req={req} pool={pool} onFulfill={onFulfill} />
              <DeclineDialog req={req} onDecline={onDecline} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Fulfill dialog ────────────────────────────────────────────────────────────

function FulfillDialog({
  req,
  pool,
  onFulfill,
}: {
  req: ResourceRequest;
  pool: PoolResource[];
  onFulfill: (id: string, assignedTo: string, alloc: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const [alloc, setAlloc] = useState(50);

  const selectedPerson = pool.find((r) => r.name === personName);
  const projected = selectedPerson ? Math.min(selectedPerson.util + alloc, 200) : null;
  const projColor = projected == null ? "" : projected > 100 ? "text-rag-red" : projected > 80 ? "text-rag-amber" : "text-rag-green";

  function handleSave() {
    if (!personName) { toast.error("Select a person to assign"); return; }
    onFulfill(req.id, personName, alloc);
    setOpen(false);
    setPersonName(""); setAlloc(50);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Fulfill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fulfill resource request</DialogTitle>
        </DialogHeader>

        {/* Request summary */}
        <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm">
          <div className="font-medium text-foreground">{req.role} <span className="text-muted-foreground text-xs">({req.skill})</span></div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {req.project} · {req.fte} FTE · {req.from} → {req.until}
          </div>
          {req.notes && <div className="mt-1 text-xs italic text-muted-foreground">"{req.notes}"</div>}
        </div>

        <div className="grid gap-3">
          {/* Person picker */}
          <div>
            <Label>Assign person</Label>
            <Select onValueChange={setPersonName}>
              <SelectTrigger><SelectValue placeholder="Select from resource pool…" /></SelectTrigger>
              <SelectContent>
                {pool.map((r) => (
                  <SelectItem key={r.name} value={r.name}>
                    <span className="flex items-center gap-2">
                      <span>{r.name}</span>
                      <span className="text-xs text-muted-foreground">— {r.role}</span>
                      <span className={`num-mono text-xs ml-auto ${r.util > 100 ? "text-rag-red" : r.util > 80 ? "text-rag-amber" : "text-rag-green"}`}>
                        {r.util}%
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Utilization preview */}
          {selectedPerson && (
            <div className="rounded-md border border-border bg-background/30 p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current utilization</span>
                <span className={`num-mono font-medium ${selectedPerson.util > 100 ? "text-rag-red" : selectedPerson.util > 80 ? "text-rag-amber" : "text-rag-green"}`}>
                  {selectedPerson.util}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
                <div className="h-full rounded-full bg-accent/40" style={{ width: `${Math.min(selectedPerson.util, 100)}%` }} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">After this assignment</span>
                <span className={`num-mono font-medium ${projColor}`}>{projected}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
                <div className={`h-full rounded-full ${(projected ?? 0) > 100 ? "bg-rag-red" : (projected ?? 0) > 80 ? "bg-rag-amber" : "bg-accent"}`}
                  style={{ width: `${Math.min(projected ?? 0, 100)}%` }} />
              </div>
              {(projected ?? 0) > 100 && (
                <p className="text-rag-red">⚠ This will over-allocate {selectedPerson.name}</p>
              )}
            </div>
          )}

          {/* Allocation slider */}
          <div>
            <div className="mb-1.5 flex justify-between">
              <Label>Allocation on this project</Label>
              <span className={`num-mono text-sm font-medium ${projColor || "text-foreground"}`}>{alloc}%</span>
            </div>
            <input
              type="range" min={10} max={100} step={5} value={alloc}
              onChange={(e) => setAlloc(Number(e.target.value))}
              className="w-full cursor-pointer accent-teal-400"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>10%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave}>
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Confirm assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Decline dialog ────────────────────────────────────────────────────────────

function DeclineDialog({
  req,
  onDecline,
}: {
  req: ResourceRequest;
  onDecline: (id: string, reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  function handleDecline() {
    if (!reason.trim()) { toast.error("Please enter a reason"); return; }
    onDecline(req.id, reason);
    setOpen(false);
    setReason("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <XCircle className="mr-1 h-3.5 w-3.5" />Decline
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Decline request</DialogTitle>
        </DialogHeader>
        <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm">
          <div className="font-medium text-foreground">{req.role} — {req.project}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">Submitted by {req.submittedBy}</div>
        </div>
        <div className="space-y-2">
          <Label>Reason <span className="text-rag-red">*</span></Label>
          <Textarea
            placeholder="Why can't this request be fulfilled? PM will be notified."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={!reason ? "border-rag-red/30" : ""}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDecline}>
            <XCircle className="mr-1 h-3.5 w-3.5" />Confirm decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Resource dialog ───────────────────────────────────────────────────────

function AddResourceDialog({ onAdd }: { onAdd: (r: PoolResource) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName]       = useState("");
  const [role, setRole]       = useState("");
  const [dept, setDept]       = useState("");
  const [capacity, setCapacity] = useState("40");
  const [email, setEmail]     = useState("");

  function handleSave() {
    if (!name.trim() || !role.trim() || !dept) {
      toast.error("Name, role, and department are required");
      return;
    }
    onAdd({
      name:     name.trim(),
      role:     role.trim(),
      dept,
      util:     0,
      capacity: Number(capacity) || 40,
      projects: [],
    });
    toast.success(`${name.trim()} added to resource pool`, {
      description: `${role.trim()} · ${dept} · ${capacity}h / week`,
    });
    setOpen(false);
    setName(""); setRole(""); setDept(""); setCapacity("40"); setEmail("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-1 h-4 w-4" />Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add resource to pool</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label>Full name <span className="text-rag-red">*</span></Label>
              <Input
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Label>Job title / Role <span className="text-rag-red">*</span></Label>
              <Input
                placeholder="e.g. Cloud Architect"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div>
              <Label>Department <span className="text-rag-red">*</span></Label>
              <Select onValueChange={setDept}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Capacity (hrs / week)</Label>
              <Input
                type="number"
                min={4} max={60} step={4}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Label>Email (optional)</Label>
              <Input
                type="email"
                placeholder="alex.morgan@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Preview badge */}
          {name && role && dept && (
            <div className="flex items-center gap-3 rounded-md border border-accent/20 bg-accent-dim/20 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-dim text-sm font-medium text-accent">
                {name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{name}</div>
                <div className="text-xs text-muted-foreground">{role} · {dept} · {capacity}h/wk · 0% utilized</div>
              </div>
              <UserCheck className="ml-auto h-4 w-4 text-accent" />
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

// ── Direct-assign dialog (from People tab) ────────────────────────────────────

function AssignDialog({ resource }: { resource: PoolResource }) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [role, setRole] = useState(resource.role);
  const [alloc, setAlloc] = useState(50);
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");

  const projected = Math.min(resource.util + alloc, 200);
  const projColor = projected > 100 ? "text-rag-red" : projected > 80 ? "text-rag-amber" : "text-rag-green";

  function handleSave() {
    if (!projectId) { toast.error("Please select a project"); return; }
    const proj = projects.find((p) => p.id === projectId);
    toast.success(`${resource.name} assigned to ${proj?.name ?? projectId} at ${alloc}%`);
    setOpen(false);
    setProjectId(""); setRole(resource.role); setAlloc(50); setFrom(""); setUntil("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Assign</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign {resource.name} to project</DialogTitle>
        </DialogHeader>

        {/* Utilization preview */}
        <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current utilization</span>
            <span className={`num-mono font-medium ${resource.util > 100 ? "text-rag-red" : resource.util > 80 ? "text-rag-amber" : "text-rag-green"}`}>{resource.util}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/50">
            <div className="h-full rounded-full bg-accent/30" style={{ width: `${Math.min(resource.util, 100)}%` }} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">After assignment</span>
            <span className={`num-mono font-medium ${projColor}`}>{projected}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/50">
            <div className={`h-full rounded-full ${projected > 100 ? "bg-rag-red" : projected > 80 ? "bg-rag-amber" : "bg-accent"}`} style={{ width: `${Math.min(projected, 100)}%` }} />
          </div>
          {projected > 100 && <p className="text-rag-red">⚠ This will over-allocate {resource.name}</p>}
        </div>

        <div className="grid gap-3">
          <div>
            <Label>Project</Label>
            <Select onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Select project…" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      {p.name}
                      <Badge variant="outline" className="ml-1 border-border bg-secondary/40 text-[10px]">{p.stage}</Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Role on this project</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Solution Architect" />
          </div>
          <div>
            <div className="mb-1.5 flex justify-between">
              <Label>Allocation</Label>
              <span className={`num-mono text-sm font-medium ${projColor}`}>{alloc}%</span>
            </div>
            <input
              type="range" min={10} max={100} step={5} value={alloc}
              onChange={(e) => setAlloc(Number(e.target.value))}
              className="w-full cursor-pointer accent-teal-400"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>10%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>From</Label><Input type="month" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label>Until</Label><Input type="month" value={until} onChange={(e) => setUntil(e.target.value)} /></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave}>Confirm assignment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Utilization heatmap ───────────────────────────────────────────────────────

function Heatmap({ pool }: { pool: PoolResource[] }) {
  return (
    <>
      <div className="label-eyebrow mb-3">Team utilization · next 8 weeks</div>
      <div className="ml-32 mb-1 grid grid-cols-8 gap-1 text-[10px] text-muted-foreground">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="text-center">W{21 + i}</div>
        ))}
      </div>
      <div className="space-y-1">
        {pool.map((r, idx) => (
          <div key={r.name} className="flex items-center gap-2">
            <div className="w-32 truncate text-xs text-muted-foreground">{r.name}</div>
            <div className="flex flex-1 gap-1">
              {Array.from({ length: 8 }).map((_, i) => {
                const v = (r.util + idx * 4 + i * 9) % 130;
                const bg = v > 100 ? "bg-rag-red" : v > 80 ? "bg-orange-500" : v > 60 ? "bg-rag-amber" : "bg-rag-green/50";
                return <div key={i} className={`h-6 flex-1 rounded ${bg}`} title={`${v}%`} />;
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rag-green/50" />&lt;60%</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rag-amber" />60–80%</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-orange-500" />80–100%</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rag-red" />Over</span>
      </div>
    </>
  );
}
