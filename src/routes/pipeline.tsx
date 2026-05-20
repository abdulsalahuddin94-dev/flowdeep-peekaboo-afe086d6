import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { pipelineItems } from "@/lib/mock-data";
import { toast } from "sonner";
import { Check, X as XIcon, Plus, GripVertical, ArrowRight } from "lucide-react";
import { NewBusinessCaseFlow } from "@/components/NewBusinessCaseFlow";

export const Route = createFileRoute("/pipeline")({
  component: PipelinePage,
  head: () => ({ meta: [{ title: "Pipeline — Nexus PMO" }, { name: "description", content: "Pre-approval funnel: business case intake, scoring, Kanban routing and DoA sign-off." }] }),
});

const STAGES = ["Submitted", "Under Review", "Revision Requested", "Approved", "Deferred", "Rejected"] as const;
type Stage = typeof STAGES[number];

// Defines which stages a card is allowed to move into from its current stage
const VALID_TRANSITIONS: Record<Stage, Stage[]> = {
  "Submitted":          ["Under Review", "Deferred", "Rejected"],
  "Under Review":       ["Approved", "Revision Requested", "Rejected", "Deferred"],
  "Revision Requested": ["Submitted", "Under Review"],
  "Approved":           [],
  "Rejected":           [],
  "Deferred":           ["Submitted", "Under Review"],
};

const STAGE_STYLE: Record<Stage, string> = {
  "Submitted":          "border-rag-blue/30 bg-rag-blue/5",
  "Under Review":       "border-rag-amber/30 bg-rag-amber/5",
  "Revision Requested": "border-role-exec/30 bg-role-exec/5",
  "Approved":           "border-rag-green/30 bg-rag-green/5",
  "Deferred":           "border-muted/30 bg-muted/5",
  "Rejected":           "border-rag-red/30 bg-rag-red/5",
};

type Item = {
  id: string; title: string; stage: Stage;
  score: number; roi: string; submittedBy: string; date: string; pillar: string;
};

function PipelinePage() {
  const [items, setItems] = useState<Item[]>(
    pipelineItems.map((p) => ({ ...p, stage: p.stage as Stage }))
  );
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);

  // Pending moves that require dialog confirmation before committing
  const [pendingApprove, setPendingApprove] = useState<string | null>(null);
  const [pendingReject, setPendingReject] = useState<string | null>(null);
  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Queue Approve / Reject buttons (non-drag path)
  const [queueApprove, setQueueApprove] = useState<string | null>(null);
  const [queueReject, setQueueReject] = useState<string | null>(null);

  const [newCase, setNewCase] = useState(false);

  const draggingItem = items.find((i) => i.id === dragging) ?? null;
  const validTargets: Stage[] = draggingItem ? VALID_TRANSITIONS[draggingItem.stage] : [];

  function commitMove(id: string, to: Stage) {
    const item = items.find((i) => i.id === id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stage: to } : i)));
    toast.success(`${item?.title ?? id} → ${to}`);
  }

  // ── Drag handlers ────────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, id: string) {
    const item = items.find((i) => i.id === id)!;
    if (VALID_TRANSITIONS[item.stage].length === 0) {
      e.preventDefault();
      toast.error(`${item.stage} is a terminal stage — cards cannot be moved out`);
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    setDragging(id);
  }

  function handleDragEnd() {
    setDragging(null);
    setDragOver(null);
  }

  function handleDragOver(e: React.DragEvent, stage: Stage) {
    e.preventDefault();
    const isValid = draggingItem && validTargets.includes(stage) && draggingItem.stage !== stage;
    e.dataTransfer.dropEffect = isValid ? "move" : "none";
    setDragOver(stage);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the column entirely (not entering a child)
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOver(null);
    }
  }

  function handleDrop(e: React.DragEvent, targetStage: Stage) {
    e.preventDefault();
    setDragOver(null);
    if (!dragging || !draggingItem) return;
    if (draggingItem.stage === targetStage) { setDragging(null); return; }

    // Validate transition
    if (!validTargets.includes(targetStage)) {
      const allowed = VALID_TRANSITIONS[draggingItem.stage];
      toast.error(`Cannot move to "${targetStage}"`, {
        description: allowed.length
          ? `Allowed next stages: ${allowed.join(", ")}`
          : `"${draggingItem.stage}" is a terminal stage`,
      });
      setDragging(null);
      return;
    }

    // Score guard for Approve
    if (targetStage === "Approved" && draggingItem.score < 71) {
      toast.error(`Score too low to approve`, {
        description: `${draggingItem.title} scored ${draggingItem.score}/100. Minimum required: 71.`,
      });
      setDragging(null);
      return;
    }

    // Moves that need dialog confirmation
    if (targetStage === "Approved") {
      setPendingApprove(dragging);
      setDragging(null);
      return;
    }
    if (targetStage === "Rejected") {
      setPendingReject(dragging);
      setDragging(null);
      return;
    }

    commitMove(dragging, targetStage);
    setDragging(null);
  }

  // ── Confirm handlers ─────────────────────────────────────────────────────────

  function confirmApprove(id: string) {
    commitMove(id, "Approved");
    setPendingApprove(null);
    setQueueApprove(null);
    setApproveNote("");
  }

  function confirmReject(id: string) {
    if (!rejectReason.trim()) { toast.error("Please enter a rejection reason"); return; }
    commitMove(id, "Rejected");
    setPendingReject(null);
    setQueueReject(null);
    setRejectReason("");
  }

  // ── Column style helpers ──────────────────────────────────────────────────────

  function colClass(stage: Stage) {
    const base = "rounded-lg border p-3 transition-all duration-150";
    const isActive = dragOver === stage;
    const isValid = validTargets.includes(stage);
    const isDimmed = dragging && !isValid && stage !== draggingItem?.stage;

    if (isActive && isValid)  return `${base} border-accent bg-accent-dim/30 ring-1 ring-accent/50 scale-[1.01]`;
    if (isActive && !isValid) return `${base} border-rag-red/50 bg-rag-red/10`;
    if (isDimmed)             return `${base} ${STAGE_STYLE[stage]} opacity-40`;
    if (dragging && isValid)  return `${base} ${STAGE_STYLE[stage]} border-accent/40`;
    return `${base} ${STAGE_STYLE[stage]}`;
  }

  const approveTarget = pendingApprove ?? queueApprove;
  const rejectTarget  = pendingReject  ?? queueReject;

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Pre-approval funnel — drag cards between stages or use queue actions"
        actions={<Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewCase(true)}><Plus className="mr-1 h-4 w-4" />New Business Case</Button>}
      />

      {dragging && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-accent/30 bg-accent-dim/30 px-3 py-2 text-xs text-accent">
          <GripVertical className="h-3.5 w-3.5" />
          <span>Dragging <strong>{draggingItem?.title}</strong></span>
          <ArrowRight className="h-3 w-3 mx-1" />
          <span>Valid targets: <strong>{validTargets.join(" · ") || "none (terminal stage)"}</strong></span>
        </div>
      )}

      <Tabs defaultValue="capital">
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="capital">Capital Projects</TabsTrigger>
          <TabsTrigger value="commercial">Commercial Bids</TabsTrigger>
          <TabsTrigger value="queue">Approval Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="capital" className="mt-5">
          <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {STAGES.map((stage) => {
              const stageItems = items.filter((i) => i.stage === stage);
              const isDropTarget = dragOver === stage && draggingItem && validTargets.includes(stage);
              return (
                <div
                  key={stage}
                  className={colClass(stage)}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="label-eyebrow">{stage}</span>
                    <Badge variant="outline" className="border-border bg-secondary/40 text-[10px]">
                      {stageItems.length}
                    </Badge>
                  </div>

                  <div className="space-y-2 min-h-[60px]">
                    {isDropTarget && stageItems.length === 0 && (
                      <div className="flex h-14 items-center justify-center rounded-md border border-dashed border-accent/50 text-[11px] text-accent">
                        Drop here
                      </div>
                    )}

                    {stageItems.map((b) => {
                      const isBeingDragged = dragging === b.id;
                      const isTerminal = VALID_TRANSITIONS[b.stage].length === 0;
                      return (
                        <div
                          key={b.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, b.id)}
                          onDragEnd={handleDragEnd}
                          className={`glass-card p-3 text-xs transition-all duration-150 select-none
                            ${isTerminal ? "cursor-not-allowed opacity-70" : "cursor-grab active:cursor-grabbing hover:border-accent/30"}
                            ${isBeingDragged ? "opacity-30 scale-95 ring-1 ring-accent/40" : ""}
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span className="num-mono text-muted-foreground">{b.id}</span>
                            <div className="flex items-center gap-1">
                              {isTerminal
                                ? <span className="text-[9px] text-muted-foreground/60">locked</span>
                                : <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                              }
                            </div>
                          </div>
                          <div className="mt-1 text-sm font-medium text-foreground leading-snug">{b.title}</div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{b.pillar}</span>
                            <span className={`num-mono rounded px-1.5 py-0.5 ${
                              b.score >= 71 ? "bg-rag-green/10 text-rag-green" :
                              b.score >= 41 ? "bg-rag-amber/10 text-rag-amber" :
                                              "bg-rag-red/10 text-rag-red"
                            }`}>{b.score}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="bg-accent-dim text-[10px] text-accent">
                                {b.submittedBy.split(" ").map((s) => s[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="num-mono text-[10px] text-muted-foreground">{b.roi}</span>
                          </div>
                        </div>
                      );
                    })}

                    {isDropTarget && stageItems.length > 0 && (
                      <div className="flex h-8 items-center justify-center rounded-md border border-dashed border-accent/50 text-[11px] text-accent">
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Transitions:</span>
            {Object.entries(VALID_TRANSITIONS).map(([from, tos]) => (
              tos.length > 0 && (
                <span key={from} className="flex items-center gap-1">
                  <span className="text-foreground">{from}</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                  <span>{tos.join(", ")}</span>
                </span>
              )
            ))}
            <span className="ml-2 text-[10px]">· Score ≥ 71 required to Approve</span>
          </div>
        </TabsContent>

        <TabsContent value="commercial" className="mt-5 glass-card p-6 text-sm text-muted-foreground">
          Commercial bids board — 4 active bids in pursuit, 2 in proposal, 1 awaiting decision. (Mirrors capital flow with client-bid stage gates.)
        </TabsContent>

        <TabsContent value="queue" className="mt-5">
          <div className="glass-card overflow-hidden">
            <div className="divide-y divide-border">
              {items.filter((p) => p.stage === "Under Review" || p.stage === "Submitted").map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-accent-dim text-xs text-accent">
                      {p.submittedBy.split(" ").map((s) => s[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.submittedBy} · {p.date} · {p.pillar} · {p.roi}</div>
                  </div>
                  <span className={`num-mono rounded px-2 py-1 text-xs ${
                    p.score >= 71 ? "bg-rag-green/10 text-rag-green" :
                    p.score >= 41 ? "bg-rag-amber/10 text-rag-amber" :
                                    "bg-rag-red/10 text-rag-red"
                  }`}>Score {p.score}</span>
                  <Button
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={p.score < 71}
                    title={p.score < 71 ? `Score too low (${p.score}/100 — min 71)` : undefined}
                    onClick={() => setQueueApprove(p.id)}
                  >
                    <Check className="mr-1 h-3 w-3" />Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setQueueReject(p.id)}>
                    <XIcon className="mr-1 h-3 w-3" />Reject
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Approval dialog */}
      <Dialog open={!!approveTarget} onOpenChange={(o) => { if (!o) { setPendingApprove(null); setQueueApprove(null); setApproveNote(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve business case</DialogTitle>
          </DialogHeader>
          <div className="rounded-md border border-rag-green/20 bg-rag-green/5 p-3 text-sm text-foreground">
            <strong>{items.find((i) => i.id === approveTarget)?.title}</strong>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Score: {items.find((i) => i.id === approveTarget)?.score}/100 ·{" "}
              ROI: {items.find((i) => i.id === approveTarget)?.roi}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Approving will move this case to the active Portfolio and notify the proposed PM.</p>
          <div className="space-y-2">
            <Label>Approval note (optional)</Label>
            <Textarea placeholder="Any conditions or scope adjustments…" value={approveNote} onChange={(e) => setApproveNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPendingApprove(null); setQueueApprove(null); setApproveNote(""); }}>Cancel</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => approveTarget && confirmApprove(approveTarget)}>
              <Check className="mr-1 h-3.5 w-3.5" />Confirm Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setPendingReject(null); setQueueReject(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject business case</DialogTitle>
          </DialogHeader>
          <div className="rounded-md border border-rag-red/20 bg-rag-red/5 p-3 text-sm text-foreground">
            <strong>{items.find((i) => i.id === rejectTarget)?.title}</strong>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Score: {items.find((i) => i.id === rejectTarget)?.score}/100
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason <span className="text-rag-red">*</span></Label>
            <Textarea
              placeholder="Why is this being rejected? (required)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className={!rejectReason ? "border-rag-red/30" : ""}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPendingReject(null); setQueueReject(null); setRejectReason(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectTarget && confirmReject(rejectTarget)}>
              <XIcon className="mr-1 h-3.5 w-3.5" />Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewBusinessCaseFlow open={newCase} onOpenChange={setNewCase} />
    </div>
  );
}
