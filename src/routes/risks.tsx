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

        <TabsContent value="heatmap" className="mt-5 glass-card p-6">
          <div className="label-eyebrow mb-4">Probability × Impact</div>
          <div className="mx-auto max-w-2xl">
            <div className="grid grid-cols-[40px_repeat(5,1fr)] gap-1">
              <div />
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="text-center text-xs text-muted-foreground">I{i}</div>)}
              {[5, 4, 3, 2, 1].map((p) => (
                <>
                  <div key={`p${p}`} className="self-center text-xs text-muted-foreground">P{p}</div>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const score = p * i;
                    const count = risks.filter((r) => r.prob === p && r.impact === i).length;
                    const bg = score >= 15 ? "bg-rag-red/30" : score >= 9 ? "bg-rag-amber/30" : score >= 4 ? "bg-rag-blue/20" : "bg-rag-green/20";
                    return <div key={`${p}-${i}`} className={`flex h-14 items-center justify-center rounded ${bg} border border-border text-sm font-medium text-foreground`}>{count > 0 ? count : "·"}</div>;
                  })}
                </>
              ))}
            </div>
          </div>
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
