import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { resources, projects } from "@/lib/mock-data";
import { Upload, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/resources")({
  component: ResourcesPage,
  head: () => ({ meta: [{ title: "Resources — Nexus PMO" }, { name: "description", content: "Capacity planning, allocation vs assignment, utilization heatmap and skill demand." }] }),
});

function ResourcesPage() {
  return (
    <div>
      <PageHeader
        title="Resources"
        subtitle="People, capacity & allocation across the portfolio"
        actions={
          <>
            <Button variant="outline" size="sm"><Upload className="mr-1 h-4 w-4" />Import Excel</Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Add Resource</Button>
          </>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { l: "Headcount", v: "164" },
          { l: "Avg utilization", v: "78%", c: "text-rag-green" },
          { l: "Over-allocated", v: "3", c: "text-rag-red" },
          { l: "Bench", v: "12" },
          { l: "Open seats", v: "9" },
        ].map((k) => (
          <div key={k.l} className="glass-card p-4"><div className="label-eyebrow">{k.l}</div><div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div></div>
        ))}
      </div>

      <Tabs defaultValue="people">
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="heatmap">Utilization Heatmap</TabsTrigger>
          <TabsTrigger value="planning">Manpower Planning</TabsTrigger>
          <TabsTrigger value="skills">Skill Demand</TabsTrigger>
        </TabsList>

        <TabsContent value="people" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead>Department</TableHead>
              <TableHead>Capacity / wk</TableHead><TableHead>Utilization</TableHead><TableHead>Projects</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>{resources.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7"><AvatarFallback className="bg-accent-dim text-[10px] text-accent">{r.name.split(" ").map((s) => s[0]).join("")}</AvatarFallback></Avatar>
                    {r.name}
                  </div>
                </TableCell>
                <TableCell>{r.role}</TableCell>
                <TableCell className="text-muted-foreground">{r.dept}</TableCell>
                <TableCell className="num-mono">{r.capacity}h</TableCell>
                <TableCell className="w-44">
                  <div className="flex items-center gap-2">
                    <Progress value={Math.min(r.util, 100)} className={`h-1.5 ${r.util > 100 ? "[&>div]:bg-rag-red" : r.util > 90 ? "[&>div]:bg-rag-amber" : "[&>div]:bg-rag-green"}`} />
                    <span className={`num-mono text-xs ${r.util > 100 ? "text-rag-red" : r.util > 90 ? "text-rag-amber" : "text-foreground"}`}>{r.util}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.projects.join(", ")}</TableCell>
                <TableCell><AssignDialog resource={r} /></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="heatmap" className="mt-5 glass-card p-5">
          <Heatmap />
        </TabsContent>

        <TabsContent value="planning" className="mt-5 glass-card p-5 text-sm">
          <div className="label-eyebrow mb-3">Forward manpower plan · next quarter</div>
          <Table>
            <TableHeader><TableRow><TableHead>Role</TableHead><TableHead>Demand (FTE)</TableHead><TableHead>Supply</TableHead><TableHead>Gap</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>{[
              { r: "Solution Architect", d: 4, s: 2, a: "Hire 2 / partner" },
              { r: "QA Engineer", d: 8, s: 6, a: "Hire 1 / subcontract 1" },
              { r: "Field Engineer", d: 6, s: 7, a: "Capacity ok" },
              { r: "Security Lead", d: 2, s: 1, a: "Critical hire" },
            ].map((row) => {
              const gap = row.d - row.s;
              return (
                <TableRow key={row.r}>
                  <TableCell>{row.r}</TableCell><TableCell className="num-mono">{row.d}</TableCell>
                  <TableCell className="num-mono">{row.s}</TableCell>
                  <TableCell className={`num-mono ${gap > 0 ? "text-rag-red" : "text-rag-green"}`}>{gap > 0 ? `+${gap}` : gap}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.a}</TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="skills" className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            { s: "Cloud Architecture", c: "High", n: 12 },
            { s: "Industrial Control Systems", c: "Critical", n: 4 },
            { s: "Data Engineering", c: "Medium", n: 9 },
            { s: "Cyber Security", c: "Critical", n: 3 },
            { s: "Project Management", c: "Medium", n: 22 },
            { s: "Procurement / Contracts", c: "Low", n: 6 },
          ].map((s) => (
            <div key={s.s} className="glass-card p-4">
              <div className="text-sm font-medium text-foreground">{s.s}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.n} people available</div>
              <div className={`mt-2 inline-block rounded px-2 py-0.5 text-[11px] ${
                s.c === "Critical" ? "bg-rag-red/10 text-rag-red" : s.c === "High" ? "bg-rag-amber/10 text-rag-amber" : s.c === "Medium" ? "bg-rag-blue/10 text-rag-blue" : "bg-rag-green/10 text-rag-green"
              }`}>{s.c} demand</div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssignDialog({ resource }: { resource: typeof resources[number] }) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [role, setRole] = useState(resource.role);
  const [alloc, setAlloc] = useState(50);
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");

  const currentLoad = resource.util;
  const projectedLoad = Math.min(currentLoad + alloc, 200);
  const projectedColor = projectedLoad > 100 ? "text-rag-red" : projectedLoad > 80 ? "text-rag-amber" : "text-rag-green";

  function handleSave() {
    if (!projectId) { toast.error("Please select a project"); return; }
    const proj = projects.find((p) => p.id === projectId);
    toast.success(`${resource.name} assigned to ${proj?.name ?? projectId} at ${alloc}%`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Assign</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign {resource.name} to Project</DialogTitle>
        </DialogHeader>

        {/* Utilization preview */}
        <div className="rounded-md border border-border bg-secondary/30 p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current utilization</span>
            <span className={`num-mono font-medium ${currentLoad > 100 ? "text-rag-red" : currentLoad > 80 ? "text-rag-amber" : "text-rag-green"}`}>{currentLoad}%</span>
          </div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">After this assignment</span>
            <span className={`num-mono font-medium ${projectedColor}`}>{projectedLoad}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-background/50">
            <div className="h-full rounded-full bg-accent/30 transition-all" style={{ width: `${Math.min(currentLoad, 100)}%` }} />
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-background/50">
            <div className={`h-full rounded-full transition-all ${projectedLoad > 100 ? "bg-rag-red" : projectedLoad > 80 ? "bg-rag-amber" : "bg-accent"}`} style={{ width: `${Math.min(projectedLoad, 100)}%` }} />
          </div>
          {projectedLoad > 100 && (
            <p className="mt-1.5 text-[11px] text-rag-red">⚠ This assignment will over-allocate {resource.name}</p>
          )}
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
            <div className="mb-1.5 flex items-center justify-between">
              <Label>Allocation</Label>
              <span className={`num-mono text-sm font-medium ${projectedColor}`}>{alloc}%</span>
            </div>
            <input
              type="range" min={10} max={100} step={5} value={alloc}
              onChange={(e) => setAlloc(Number(e.target.value))}
              className="w-full cursor-pointer accent-teal-400"
            />
            <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
              <span>10%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>From</Label>
              <Input type="month" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label>Until</Label>
              <Input type="month" value={until} onChange={(e) => setUntil(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave}>
            Confirm assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Heatmap() {
  return (
    <>
      <div className="label-eyebrow mb-3">Team utilization · next 8 weeks</div>
      <div className="ml-32 mb-1 grid grid-cols-8 gap-1 text-[10px] text-muted-foreground">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="text-center">W{21 + i}</div>)}
      </div>
      <div className="space-y-1">
        {resources.map((r, idx) => (
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
