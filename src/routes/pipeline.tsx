import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
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
import { Check, X as XIcon, Plus, GripVertical } from "lucide-react";
import { NewBusinessCaseFlow } from "@/components/NewBusinessCaseFlow";

export const Route = createFileRoute("/pipeline")({
  component: PipelinePage,
  head: () => ({ meta: [{ title: "Pipeline — Nexus PMO" }, { name: "description", content: "Pre-approval funnel: business case intake, scoring, Kanban routing and DoA sign-off." }] }),
});

const STAGES = ["Submitted", "Under Review", "Revision Requested", "Approved", "Deferred", "Rejected"] as const;
type Stage = typeof STAGES[number];

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
  "Deferred":           "border-border bg-secondary/10",
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

  // ── Pointer-drag state ───────────────────────────────────────────────────────
  const [dragging, setDragging] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [dragOver, setDragOver] = useState<Stage | null>(null);
  const columnRefs = useRef<Partial<Record<Stage, HTMLDivElement | null>>>({});

  // ── Dialog state ─────────────────────────────────────────────────────────────
  const [pendingApprove, setPendingApprove] = useState<string | null>(null);
  const [pendingReject,  setPendingReject]  = useState<string | null>(null);
  const [approveNote,  setApproveNote]  = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [queueApprove, setQueueApprove] = useState<string | null>(null);
  const [queueReject,  setQueueReject]  = useState<string | null>(null);
  const [newCase, setNewCase] = useState(false);

  const draggingItem = items.find((i) => i.id === dragging) ?? null;
  const validTargets: Stage[] = draggingItem ? VALID_TRANSITIONS[draggingItem.stage] : [];

  // ── Hit-test: find which stage column the pointer is over ────────────────────
  const stageAtPoint = useCallback((x: number, y: number): Stage | null => {
    for (const stage of STAGES) {
      const el = columnRefs.current[stage];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return stage;
    }
    return null;
  }, []);

  // ── Document-level pointer listeners (active only while dragging) ────────────
  useEffect(() => {
    if (!dragging) return;

    function onMove(e: PointerEvent) {
      setGhostPos({ x: e.clientX, y: e.clientY });
      setDragOver(stageAtPoint(e.clientX, e.clientY));
    }

    function onUp(e: PointerEvent) {
      const target = stageAtPoint(e.clientX, e.clientY);
      if (target) attemptDrop(target);
      setDragging(null);
      setDragOver(null);
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, draggingItem, stageAtPoint]);

  // ── Drag validation + commit ─────────────────────────────────────────────────
  function attemptDrop(targetStage: Stage) {
    if (!draggingItem) return;
    if (draggingItem.stage === targetStage) return;

    if (!validTargets.includes(targetStage)) {
      const allowed = VALID_TRANSITIONS[draggingItem.stage];
      toast.error(`Cannot move to "${targetStage}"`, {
        description: allowed.length
          ? `Allowed next stages: ${allowed.join(", ")}`
          : `"${draggingItem.stage}" is a terminal stage — cards cannot be moved out`,
      });
      return;
    }

    if (targetStage === "Approved" && draggingItem.score < 71) {
      toast.error("Score too low to approve", {
        description: `${draggingItem.title} scored ${draggingItem.score}/100 — minimum required is 71.`,
      });
      return;
    }

    if (targetStage === "Approved") { setPendingApprove(draggingItem.id); return; }
    if (targetStage === "Rejected") { setPendingReject(draggingItem.id);  return; }

    commitMove(draggingItem.id, targetStage);
  }

  function commitMove(id: string, to: Stage) {
    const item = items.find((i) => i.id === id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stage: to } : i)));
    toast.success(`${item?.title ?? id} → ${to}`);
  }

  function confirmApprove(id: string) {
    commitMove(id, "Approved");
    setPendingApprove(null); setQueueApprove(null); setApproveNote("");
  }

  function confirmReject(id: string) {
    if (!rejectReason.trim()) { toast.error("Please enter a rejection reason"); return; }
    commitMove(id, "Rejected");
    setPendingReject(null); setQueueReject(null); setRejectReason("");
  }

  // ── Column style ─────────────────────────────────────────────────────────────
  function colClass(stage: Stage) {
    const base = "rounded-lg border p-3 transition-all duration-150";
    const isActive  = dragOver === stage;
    const isValid   = validTargets.includes(stage);
    const isDimmed  = !!dragging && !isValid && stage !== draggingItem?.stage;

    if (isActive && isValid)  return `${base} border-accent bg-accent-dim/30 ring-2 ring-accent/50`;
    if (isActive && !isValid) return `${base} border-rag-red/50 bg-rag-red/10`;
    if (isDimmed)             return `${base} ${STAGE_STYLE[stage]} opacity-40`;
    if (dragging && isValid)  return `${base} ${STAGE_STYLE[stage]} border-accent/40 ring-1 ring-accent/20`;
    return `${base} ${STAGE_STYLE[stage]}`;
  }

  const approveTarget = pendingApprove ?? queueApprove;
  const rejectTarget  = pendingReject  ?? queueReject;

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Pre-approval funnel — drag cards between stages to advance them"
        actions={<Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewCase(true)}><Plus className="mr-1 h-4 w-4" />New Business Case</Button>}
      />

      {/* Active drag banner */}
      {dragging && draggingItem && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-accent/30 bg-accent-dim/30 px-3 py-2 text-xs text-accent select-none">
          <GripVertical className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium truncate">{draggingItem.title}</span>
          <span className="text-muted-foreground shrink-0">
            → {validTargets.length ? validTargets.join(" · ") : "no valid targets (terminal stage)"}
          </span>
        </div>
      )}

      {/* Floating ghost label that follows cursor */}
      {dragging && draggingItem && (
        <div
          className="fixed z-50 pointer-events-none max-w-[180px] truncate rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground shadow-lg"
          style={{ left: ghostPos.x + 14, top: ghostPos.y - 12 }}
        >
          {draggingItem.title}
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
              const isValidTarget = !!dragging && validTargets.includes(stage);
              return (
                <div
                  key={stage}
                  ref={(el) => { columnRefs.current[stage] = el; }}
                  className={colClass(stage)}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="label-eyebrow">{stage}</span>
                    <Badge variant="outline" className="border-border bg-secondary/40 text-[10px]">
                      {stageItems.length}
                    </Badge>
                  </div>

                  <div className="space-y-2 min-h-[56px]">
                    {/* Empty column drop zone */}
                    {isValidTarget && stageItems.length === 0 && (
                      <div className={`flex h-14 items-center justify-center rounded-md border border-dashed text-[11px] ${dragOver === stage ? "border-accent text-accent" : "border-accent/40 text-accent/60"}`}>
                        Drop here
                      </div>
                    )}

                    {stageItems.map((b) => {
                      const isTerminal = VALID_TRANSITIONS[b.stage].length === 0;
                      const isBeingDragged = dragging === b.id;
                      return (
                        <div
                          key={b.id}
                          className={`glass-card p-3 text-xs select-none transition-all duration-150
                            ${isTerminal ? "cursor-default" : "cursor-grab"}
                            ${isBeingDragged ? "opacity-30 scale-95 ring-1 ring-accent/50" : ""}
                          `}
                          onPointerDown={(e) => {
                            if (isTerminal) {
                              toast.error(`"${b.stage}" is a terminal stage — cards cannot be moved`);
                              return;
                            }
                            e.preventDefault();
                            setDragging(b.id);
                            setGhostPos({ x: e.clientX, y: e.clientY });
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="num-mono text-muted-foreground">{b.id}</span>
                            {isTerminal
                              ? <span className="text-[9px] text-muted-foreground/50">locked</span>
                              : <GripVertical className="h-3 w-3 text-muted-foreground/40" />
                            }
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

                    {/* Bottom drop indicator when column has cards */}
                    {isValidTarget && stageItems.length > 0 && (
                      <div className={`flex h-8 items-center justify-center rounded-md border border-dashed text-[11px] ${dragOver === stage ? "border-accent text-accent" : "border-accent/30 text-accent/50"}`}>
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Validation legend */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground/70">Stage rules:</span>
            <span>Submitted → Under Review · Deferred · Rejected</span>
            <span>Under Review → Approved (score ≥ 71) · Revision · Rejected · Deferred</span>
            <span>Revision → Submitted · Under Review</span>
            <span className="text-rag-red/70">Approved / Rejected = terminal (locked)</span>
          </div>
        </TabsContent>

        <TabsContent value="commercial" className="mt-5 glass-card p-6 text-sm text-muted-foreground">
          Commercial bids board — 4 active bids in pursuit, 2 in proposal, 1 awaiting decision.
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
                    className="bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40"
                    disabled={p.score < 71}
                    title={p.score < 71 ? `Score ${p.score}/100 — minimum 71 required` : undefined}
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
          <DialogHeader><DialogTitle>Approve business case</DialogTitle></DialogHeader>
          <div className="rounded-md border border-rag-green/20 bg-rag-green/5 p-3 text-sm">
            <div className="font-medium text-foreground">{items.find((i) => i.id === approveTarget)?.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Score {items.find((i) => i.id === approveTarget)?.score}/100 · ROI {items.find((i) => i.id === approveTarget)?.roi}
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
          <DialogHeader><DialogTitle>Reject business case</DialogTitle></DialogHeader>
          <div className="rounded-md border border-rag-red/20 bg-rag-red/5 p-3 text-sm">
            <div className="font-medium text-foreground">{items.find((i) => i.id === rejectTarget)?.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">Score {items.find((i) => i.id === rejectTarget)?.score}/100</div>
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
