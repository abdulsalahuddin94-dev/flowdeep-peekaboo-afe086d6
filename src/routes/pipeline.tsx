import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { pipelineItems } from "@/lib/mock-data";
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X as XIcon, MoreVertical, Plus } from "lucide-react";
import { NewBusinessCaseFlow } from "@/components/NewBusinessCaseFlow";

export const Route = createFileRoute("/pipeline")({
  component: PipelinePage,
  head: () => ({ meta: [{ title: "Pipeline — Nexus PMO" }, { name: "description", content: "Pre-approval funnel: business case intake, scoring, Kanban routing and DoA sign-off." }] }),
});

const STAGES = ["Submitted", "Under Review", "Approved", "Deferred", "Rejected", "Revision Requested"] as const;

function PipelinePage() {
  const [reject, setReject] = useState<string | null>(null);
  const [approve, setApprove] = useState<string | null>(null);
  const [newCase, setNewCase] = useState(false);

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Pre-approval funnel — 6 items awaiting DoA sign-off"
        actions={<Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />New Business Case</Button>}
      />

      <Tabs defaultValue="capital">
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="capital">Capital Projects</TabsTrigger>
          <TabsTrigger value="commercial">Commercial Bids</TabsTrigger>
          <TabsTrigger value="queue">Approval Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="capital" className="mt-5">
          <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {STAGES.map((stage) => (
              <div key={stage} className="rounded-lg border border-border bg-secondary/20 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="label-eyebrow">{stage}</span>
                  <Badge variant="outline" className="border-border bg-secondary/40 text-[10px]">
                    {pipelineItems.filter((i) => i.stage === stage).length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {pipelineItems.filter((i) => i.stage === stage).map((b) => (
                    <div key={b.id} className="glass-card p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="num-mono text-muted-foreground">{b.id}</span>
                        <MoreVertical className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="mt-1 text-sm font-medium text-foreground">{b.title}</div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{b.pillar}</span>
                        <span className={`num-mono rounded px-1.5 py-0.5 ${
                          b.score >= 71 ? "bg-rag-green/10 text-rag-green" : b.score >= 41 ? "bg-rag-amber/10 text-rag-amber" : "bg-rag-red/10 text-rag-red"
                        }`}>{b.score}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <Avatar className="h-5 w-5"><AvatarFallback className="bg-accent-dim text-[10px] text-accent">{b.submittedBy.split(" ").map((s) => s[0]).join("")}</AvatarFallback></Avatar>
                        <span className="num-mono text-[10px] text-muted-foreground">{b.roi}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="commercial" className="mt-5 glass-card p-6 text-sm text-muted-foreground">
          Commercial bids board — 4 active bids in pursuit, 2 in proposal, 1 awaiting decision. (Mirrors capital flow with client-bid stage gates.)
        </TabsContent>

        <TabsContent value="queue" className="mt-5">
          <div className="glass-card overflow-hidden">
            <div className="divide-y divide-border">
              {pipelineItems.filter((p) => p.stage === "Under Review" || p.stage === "Submitted").map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-4">
                  <Avatar className="h-9 w-9"><AvatarFallback className="bg-accent-dim text-xs text-accent">{p.submittedBy.split(" ").map((s) => s[0]).join("")}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.submittedBy} · {p.date} · {p.pillar} · {p.roi}</div>
                  </div>
                  <span className={`num-mono rounded px-2 py-1 text-xs ${
                    p.score >= 71 ? "bg-rag-green/10 text-rag-green" : p.score >= 41 ? "bg-rag-amber/10 text-rag-amber" : "bg-rag-red/10 text-rag-red"
                  }`}>Score {p.score}</span>
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setApprove(p.id)}>
                    <Check className="mr-1 h-3 w-3" />Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setReject(p.id)}>
                    <XIcon className="mr-1 h-3 w-3" />Reject
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Approval modal */}
      <Dialog open={!!approve} onOpenChange={(o) => !o && setApprove(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve {approve}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Confirming approval will move this case to the active Portfolio and notify the proposed PM.</p>
          <div className="space-y-2"><Label>Approval note (optional)</Label><Textarea placeholder="Any conditions or scope adjustments…" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprove(null)}>Cancel</Button>
            <Button className="bg-accent text-accent-foreground" onClick={() => { toast.success("Business case approved"); setApprove(null); }}>Confirm Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection modal */}
      <Dialog open={!!reject} onOpenChange={(o) => !o && setReject(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject {reject}</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>Reason (required)</Label><Textarea placeholder="Why is this being rejected?" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReject(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { toast.success("Business case rejected"); setReject(null); }}>Confirm Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
