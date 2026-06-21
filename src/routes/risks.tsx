import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { risks } from "@/lib/mock-data";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/risks")({
  component: RisksPage,
  head: () => ({ meta: [{ title: "Risk & Issues — Nexus PMO" }, { name: "description", content: "Portfolio-wide risk register, issues log and mitigation tracking." }] }),
});

function RisksPage() {
  const [open, setOpen] = useState<typeof risks[number] | null>(null);
  const stats = {
    critical: risks.filter((r) => r.score >= 15).length,
    high: risks.filter((r) => r.score >= 9 && r.score < 15).length,
    medium: risks.filter((r) => r.score >= 4 && r.score < 9).length,
    open: risks.filter((r) => r.status === "Open").length,
  };
  return (
    <div>
      <PageHeader
        title="Risk & Issues"
        subtitle="Standalone portfolio-wide register · Heat map and detail"
        actions={<NewRiskDialog />}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat l="Critical (≥15)" v={stats.critical} c="text-rag-red" pulse />
        <Stat l="High (9–14)" v={stats.high} c="text-rag-amber" />
        <Stat l="Medium" v={stats.medium} c="text-rag-blue" />
        <Stat l="Open" v={stats.open} />
      </div>

      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register">Register</TabsTrigger>
          <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="mt-5">
          <Table>
            <TableHeader><TableRow>
              <TableHead>ID</TableHead><TableHead>Project</TableHead><TableHead>Title</TableHead>
              <TableHead>Category</TableHead><TableHead>P</TableHead><TableHead>I</TableHead><TableHead>Score</TableHead>
              <TableHead>Owner</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{risks.map((r) => (
              <TableRow key={r.id} onClick={() => setOpen(r)} className="cursor-pointer hover:bg-accent-dim/40">
                <TableCell className="num-mono text-xs text-muted-foreground">{r.id}</TableCell>
                <TableCell>{r.project}</TableCell>
                <TableCell className="font-medium text-foreground">{r.title}</TableCell>
                <TableCell><Badge variant="outline" className="border-border bg-secondary/40">{r.category}</Badge></TableCell>
                <TableCell className="num-mono">{r.prob}</TableCell>
                <TableCell className="num-mono">{r.impact}</TableCell>
                <TableCell>
                  <span className={`num-mono rounded px-1.5 py-0.5 text-xs ${
                    r.score >= 15 ? "bg-rag-red/10 text-rag-red" : r.score >= 9 ? "bg-rag-amber/10 text-rag-amber" : "bg-rag-blue/10 text-rag-blue"
                  }`}>{r.score}</span>
                </TableCell>
                <TableCell>{r.owner}</TableCell>
                <TableCell><Badge variant="outline" className={r.status === "Open" ? "border-rag-red/40 bg-rag-red/10 text-rag-red" : "border-rag-amber/40 bg-rag-amber/10 text-rag-amber"}>{r.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="heatmap" className="mt-5 glass-card p-8">
          <div className="label-eyebrow mb-6">Probability × Impact</div>
          <RiskHeatmap />
        </TabsContent>

        <TabsContent value="issues" className="mt-5">
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Project</TableHead><TableHead>Issue</TableHead><TableHead>Priority</TableHead><TableHead>Owner</TableHead><TableHead>Age</TableHead></TableRow></TableHeader>
            <TableBody>{[
              { id: "I-044", p: "ERP Upgrade", t: "Test env outage blocking QA", pr: "High", o: "Mei Chen", a: "2d" },
              { id: "I-042", p: "Refinery Expansion", t: "Crane availability slip", pr: "Medium", o: "John Smith", a: "5d" },
              { id: "I-040", p: "Wellhead Auto.", t: "Vendor on-site no-show", pr: "High", o: "Omar Haddad", a: "1d" },
              { id: "I-038", p: "BI Self-Service", t: "Source system schema change", pr: "Low", o: "Diego Ortiz", a: "1w" },
            ].map((r) => (
              <TableRow key={r.id}>
                <TableCell className="num-mono text-xs">{r.id}</TableCell><TableCell>{r.p}</TableCell><TableCell className="font-medium">{r.t}</TableCell>
                <TableCell><Badge variant="outline" className={r.pr === "High" ? "border-rag-red/40 bg-rag-red/10 text-rag-red" : r.pr === "Medium" ? "border-rag-amber/40 bg-rag-amber/10 text-rag-amber" : "border-rag-blue/40 bg-rag-blue/10 text-rag-blue"}>{r.pr}</Badge></TableCell>
                <TableCell>{r.o}</TableCell><TableCell className="text-xs text-muted-foreground">{r.a}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-[480px] overflow-y-auto bg-surface sm:max-w-[480px]">
          {open && (
            <>
              <SheetHeader><SheetTitle className="text-foreground">{open.title}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <Mini l="Probability" v={open.prob} /><Mini l="Impact" v={open.impact} /><Mini l="Score" v={open.score} c="text-rag-red" />
                </div>
                <div><div className="label-eyebrow">Project</div><div>{open.project}</div></div>
                <div><div className="label-eyebrow">Category</div><div>{open.category}</div></div>
                <div><div className="label-eyebrow">Owner</div><div>{open.owner}</div></div>
                <div><div className="label-eyebrow">Mitigation</div><p className="text-muted-foreground">{open.mitigation}</p></div>
                <div className="flex gap-2"><Button className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1">Update status</Button><Button variant="outline">Escalate</Button></div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RiskHeatmap() {
  // 3x3 grid. Map 1–5 mock scale → 1..3 buckets: 1-2→1 (Low), 3→2 (Med), 4-5→3 (High)
  const probLabels = ["High", "Medium", "Low"]; // top → bottom (3..1)
  const impactLabels = ["Low", "Medium", "High"]; // left → right (1..3)

  const bucket = (n: number): 1 | 2 | 3 => (n >= 4 ? 3 : n === 3 ? 2 : 1);
  const itemsAt = (p: number, i: number) =>
    risks.filter((r) => bucket(r.prob) === p && bucket(r.impact) === i);

  // Severity by max(prob,impact) bucket: 1=safe(teal), 2=watch(amber), 3=critical(red)
  const sevFor = (p: number, i: number): "teal" | "amber" | "red" => {
    const m = Math.max(p, i);
    return m === 3 ? "red" : m === 2 ? "amber" : "teal";
  };

  const tone: Record<"teal" | "amber" | "red", { bg: string; ring: string; num: string }> = {
    teal:  { bg: "bg-[oklch(0.26_0.04_200)]", ring: "ring-[oklch(0.45_0.10_190)]", num: "text-[oklch(0.78_0.15_180)]" },
    amber: { bg: "bg-[oklch(0.28_0.04_70)]",  ring: "ring-[oklch(0.55_0.12_75)]",  num: "text-[oklch(0.78_0.16_75)]"  },
    red:   { bg: "bg-[oklch(0.27_0.06_20)]",  ring: "ring-[oklch(0.55_0.16_22)]",  num: "text-[oklch(0.72_0.20_22)]"  },
  };

  const [openCell, setOpenCell] = useState<{ p: number; i: number } | null>(null);
  const cellItems = openCell ? itemsAt(openCell.p, openCell.i) : [];

  return (
    <>
      <div className="mx-auto flex max-w-4xl items-stretch gap-4">
        {/* Y-axis title */}
        <div className="flex items-center">
          <div className="-rotate-90 whitespace-nowrap text-sm text-muted-foreground">Probability →</div>
        </div>

        {/* Probability labels column */}
        <div className="flex flex-col justify-between py-1">
          {probLabels.map((l) => (
            <div key={l} className="flex flex-1 items-center pr-2 text-right text-sm text-foreground/80">
              <span className="ml-auto block w-20">{l}</span>
            </div>
          ))}
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-3 gap-4">
            {[3, 2, 1].map((p) =>
              [1, 2, 3].map((i) => {
                const items = itemsAt(p, i);
                const t = tone[sevFor(p, i)];
                const count = items.length;
                return (
                  <button
                    key={`${p}-${i}`}
                    onClick={() => setOpenCell({ p, i })}
                    className={`flex aspect-[4/3] flex-col items-center justify-center rounded-2xl ring-1 ${t.bg} ${t.ring} ring-inset transition hover:brightness-125 focus:outline-none focus:ring-2`}
                  >
                    <div className={`text-5xl font-bold ${t.num}`}>{count}</div>
                    <div className="mt-2 text-xs text-muted-foreground">{count === 1 ? "risk" : "risks"}</div>
                  </button>
                );
              }),
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4">
            {impactLabels.map((l) => (
              <div key={l} className="text-center text-sm text-muted-foreground">{l}</div>
            ))}
          </div>
          <div className="mt-3 text-center text-sm text-muted-foreground">Impact →</div>
        </div>
      </div>

      <Sheet open={!!openCell} onOpenChange={(o) => !o && setOpenCell(null)}>
        <SheetContent className="w-[480px] overflow-y-auto bg-surface sm:max-w-[480px]">
          {openCell && (
            <>
              <SheetHeader>
                <SheetTitle className="text-foreground">
                  Projects at risk · P:{probLabels[3 - openCell.p]} × I:{impactLabels[openCell.i - 1]}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-2 text-xs text-muted-foreground">
                {cellItems.length} {cellItems.length === 1 ? "risk" : "risks"} in this cell
              </div>
              <div className="mt-4 space-y-2">
                {cellItems.length === 0 && (
                  <div className="rounded-md border border-border bg-background/30 p-6 text-center text-sm text-muted-foreground">
                    No risks in this cell.
                  </div>
                )}
                {cellItems.map((r) => (
                  <div key={r.id} className="rounded-md border border-border bg-background/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground num-mono">{r.id} · {r.project}</div>
                        <div className="mt-0.5 truncate font-medium text-foreground">{r.title}</div>
                      </div>
                      <span className={`num-mono shrink-0 rounded px-1.5 py-0.5 text-xs ${
                        r.score >= 15 ? "bg-rag-red/10 text-rag-red" : r.score >= 9 ? "bg-rag-amber/10 text-rag-amber" : "bg-rag-blue/10 text-rag-blue"
                      }`}>{r.score}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{r.category} · {r.owner}</span>
                      <span>P {r.prob} · I {r.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Stat({ l, v, c, pulse }: { l: string; v: number | string; c?: string; pulse?: boolean }) {
  return (
    <div className="glass-card p-4">
      <div className="label-eyebrow">{l}</div>
      <div className={`mt-1 flex items-center gap-2 text-2xl font-medium num-mono ${c ?? "text-foreground"}`}>
        {pulse && <span className="h-2 w-2 rounded-full bg-rag-red pulse-dot" />}{v}
      </div>
    </div>
  );
}
function Mini({ l, v, c }: { l: string; v: number; c?: string }) {
  return <div className="rounded-md border border-border bg-background/30 p-3"><div className="label-eyebrow">{l}</div><div className={`mt-1 text-xl font-medium num-mono ${c ?? "text-foreground"}`}>{v}</div></div>;
}

function NewRiskDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Log Risk</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log a new risk</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Title</Label><Input /></div>
          <div><Label>Project</Label><Input placeholder="Select" /></div>
          <div><Label>Category</Label>
            <Select defaultValue="vendor"><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="vendor">Vendor</SelectItem><SelectItem value="regulatory">Regulatory</SelectItem><SelectItem value="resource">Resource</SelectItem><SelectItem value="schedule">Schedule</SelectItem><SelectItem value="scope">Scope</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Probability (1–5)</Label><Input type="number" min={1} max={5} defaultValue={3} /></div>
          <div><Label>Impact (1–5)</Label><Input type="number" min={1} max={5} defaultValue={3} /></div>
          <div className="col-span-2"><Label>Mitigation plan</Label><Textarea /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground" onClick={() => { toast.success("Risk logged"); setOpen(false); }}>Log Risk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
