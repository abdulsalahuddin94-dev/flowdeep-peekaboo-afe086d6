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
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="register">Register</TabsTrigger>
          <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="mt-5 glass-card overflow-hidden">
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

        <TabsContent value="issues" className="mt-5 glass-card overflow-hidden">
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
  // 4x4 grid mapped from mock data's 1–5 scale.
  const probLabels = ["Almost Certain", "Very Likely", "Possible", "Unlikely"]; // top → bottom (4..1)
  const impactLabels = ["Minor", "Moderate", "Major", "Severe"]; // left → right (1..4)

  // Each cell gets a soft pastel tone; cells with risks get a stronger fill.
  // tones indexed by score (prob 1..4 × impact 1..4 → 1..16)
  const toneFor = (p: number, i: number, hasItems: boolean) => {
    const s = p * i;
    // empty cell — soft pastel
    if (!hasItems) {
      if (s <= 3) return "bg-[oklch(0.92_0.07_140)]";       // pale green
      if (s <= 6) return "bg-[oklch(0.93_0.08_120)]";       // pale lime
      if (s <= 9) return "bg-[oklch(0.94_0.06_85)]";        // pale cream
      if (s <= 12) return "bg-[oklch(0.93_0.07_55)]";       // pale peach
      return "bg-[oklch(0.92_0.08_30)]";                    // pale pink
    }
    // filled cell — vivid pastel
    if (s <= 3) return "bg-[oklch(0.78_0.18_140)]";         // green
    if (s <= 6) return "bg-[oklch(0.78_0.18_120)]";         // lime
    if (s <= 9) return "bg-[oklch(0.72_0.16_95)]";          // olive/yellow
    if (s <= 12) return "bg-[oklch(0.68_0.18_55)]";         // orange
    return "bg-[oklch(0.65_0.20_30)]";                      // red-orange
  };

  // Bucket the 1–5 mock scale into the 4-band scale: 1→1, 2→2, 3→3, 4–5→4.
  const bucket = (n: number) => (n >= 4 ? 4 : n);
  const countAt = (p: number, i: number) =>
    risks.filter((r) => bucket(r.prob) === p && bucket(r.impact) === i).length;

  return (
    <div className="mx-auto flex max-w-3xl items-stretch gap-3">
      {/* Y-axis title */}
      <div className="flex items-center">
        <div className="-rotate-90 whitespace-nowrap text-sm text-muted-foreground">
          Probability →
        </div>
      </div>

      {/* Probability labels column */}
      <div className="flex flex-col justify-between py-1">
        {probLabels.map((l) => (
          <div key={l} className="flex flex-1 items-center pr-2 text-right text-sm leading-tight text-foreground/80">
            <span className="ml-auto block w-24">{l}</span>
          </div>
        ))}
      </div>

      {/* Grid + X-axis labels */}
      <div className="flex-1">
        <div className="grid grid-cols-4 gap-3">
          {[4, 3, 2, 1].map((p) =>
            [1, 2, 3, 4].map((i) => {
              const count = countAt(p, i);
              const tone = toneFor(p, i, count > 0);
              return (
                <div
                  key={`${p}-${i}`}
                  className={`flex aspect-square items-center justify-center rounded-2xl text-2xl font-semibold text-foreground/80 shadow-sm ${tone}`}
                >
                  {count > 0 ? count : ""}
                </div>
              );
            }),
          )}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {impactLabels.map((l) => (
            <div key={l} className="text-center text-sm text-muted-foreground">{l}</div>
          ))}
        </div>
        <div className="mt-3 text-center text-sm text-muted-foreground">Impact →</div>
      </div>
    </div>
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
