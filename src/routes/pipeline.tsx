import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { pipelineItems, type Project, type Rag } from "@/lib/mock-data";
import { useProjects, useNotifications } from "@/lib/projects-store";
import { toast } from "sonner";
import { Check, X as XIcon, Plus, GripVertical, ExternalLink } from "lucide-react";
import { NewBusinessCaseFlow } from "@/components/NewBusinessCaseFlow";

export const Route = createFileRoute("/pipeline")({
  component: PipelinePage,
  head: () => ({ meta: [{ title: "Pipeline — Nexus PMO" }, { name: "description", content: "Pre-approval funnel: business case intake, scoring, Kanban routing and DoA sign-off." }] }),
});

const STAGES = ["Submitted", "Under Review", "Approved", "Deferred", "Rejected", "Closed"] as const;
type Stage = typeof STAGES[number];

const VALID_TRANSITIONS: Record<Stage, Stage[]> = {
  "Submitted":    ["Under Review", "Deferred", "Rejected"],
  "Under Review": ["Approved", "Rejected", "Closed", "Deferred"],
  "Approved":     [],
  "Rejected":     [],
  "Deferred":     ["Submitted", "Under Review"],
  "Closed":       [],
};

const STAGE_STYLE: Record<Stage, string> = {
  "Submitted":    "border-rag-blue/30 bg-rag-blue/5",
  "Under Review": "border-rag-amber/30 bg-rag-amber/5",
  "Approved":     "border-rag-green/30 bg-rag-green/5",
  "Deferred":     "border-border bg-secondary/10",
  "Rejected":     "border-rag-red/30 bg-rag-red/5",
  "Closed":       "border-border bg-secondary/20",
};

type Item = {
  id: string; title: string; stage: Stage;
  score: number; roi: string; submittedBy: string; date: string; pillar: string;
};

// ── Approval-queue types ──────────────────────────────────────────────────────
type ApprovalAction = "Pending" | "Approved" | "Rejected";
type RoleApproval = { role: string; action: ApprovalAction; by?: string; when?: string; comment?: string };
type ApprovalHistory = Record<string, RoleApproval[]>;

const APPROVAL_ROLES = ["Department Head", "Finance Director", "Portfolio Director"];

function itemToProject(item: Item): Project {
  const avatar = item.submittedBy.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const roiMatch = item.roi.match(/\$([\d.]+)M/);
  return {
    id: `p-${Date.now()}`,
    name: item.title,
    businessLine: "Software Solutions",
    department: "Engineering",
    pm: item.submittedBy,
    pmAvatar: avatar,
    progress: 0,
    budgetUsed: 0,
    budgetTotal: roiMatch ? parseFloat(roiMatch[1]) : 0,
    endDate: "TBD",
    rag: "blue" as Rag,
    risks: 0,
    issues: 0,
    stage: "Initiation",
    tags: [item.pillar],
    ragNote: "Pipeline approved",
  };
}

function buildInitialHistory(items: Item[]): ApprovalHistory {
  return Object.fromEntries(
    items
      .filter((p) => p.stage === "Under Review" || p.stage === "Submitted")
      .map((p) => [p.id, APPROVAL_ROLES.map((role) => ({ role, action: "Pending" as ApprovalAction }))])
  );
}

function PipelinePage() {
  const navigate = useNavigate();
  const { addProject } = useProjects();
  const { addNotification } = useNotifications();
  const [items, setItems] = useState<Item[]>(
    pipelineItems.map((p) => ({ ...p, stage: p.stage as Stage }))
  );

  // ── Pointer-drag state ───────────────────────────────────────────────────────
  const [dragging, setDragging] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [dragOver, setDragOver] = useState<Stage | null>(null);
  const columnRefs = useRef<Partial<Record<Stage, HTMLDivElement | null>>>({});
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // ── Card detail view ─────────────────────────────────────────────────────────
  const [detailItem, setDetailItem] = useState<string | null>(null);

  // ── Dialog state ─────────────────────────────────────────────────────────────
  const [pendingApprove, setPendingApprove] = useState<string | null>(null);
  const [pendingReject,  setPendingReject]  = useState<string | null>(null);
  const [pendingClose,   setPendingClose]   = useState<string | null>(null);
  const [approveNote,  setApproveNote]  = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [closeNote,    setCloseNote]    = useState("");
  const [queueApprove, setQueueApprove] = useState<string | null>(null);
  const [queueReject,  setQueueReject]  = useState<string | null>(null);
  const [newCase, setNewCase] = useState(false);

  // ── Approval history ─────────────────────────────────────────────────────────
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory>(() =>
    buildInitialHistory(pipelineItems.map((p) => ({ ...p, stage: p.stage as Stage })))
  );
  const [roleApproveDialog, setRoleApproveDialog] = useState<{ itemId: string; role: string } | null>(null);
  const [roleRejectDialog,  setRoleRejectDialog]  = useState<{ itemId: string; role: string } | null>(null);
  const [roleNote,   setRoleNote]   = useState("");
  const [roleReason, setRoleReason] = useState("");

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
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      if (!hasMoved.current && Math.sqrt(dx * dx + dy * dy) > 5) {
        hasMoved.current = true;
      }
      setGhostPos({ x: e.clientX, y: e.clientY });
      setDragOver(stageAtPoint(e.clientX, e.clientY));
    }

    function onUp(e: PointerEvent) {
      if (!hasMoved.current) {
        // Treat as click — open detail view
        setDragging(null);
        setDragOver(null);
        setDetailItem(dragging);
        return;
      }
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
    if (targetStage === "Closed")   { setPendingClose(draggingItem.id);   return; }

    commitMove(draggingItem.id, targetStage);
  }

  function commitMove(id: string, to: Stage) {
    const item = items.find((i) => i.id === id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stage: to } : i)));
    toast.success(`${item?.title ?? id} → ${to}`);
  }

  function confirmApprove(id: string) {
    const item = items.find((i) => i.id === id);
    if (item) {
      addProject(itemToProject(item));
      addNotification({ tone: "green", title: `${item.title} approved — added to Portfolio`, time: "Just now" });
    }
    commitMove(id, "Approved");
    setPendingApprove(null); setQueueApprove(null); setApproveNote("");
  }

  function confirmReject(id: string) {
    if (!rejectReason.trim()) { toast.error("Please enter a rejection reason"); return; }
    commitMove(id, "Rejected");
    setPendingReject(null); setQueueReject(null); setRejectReason("");
  }

  function confirmClose(id: string) {
    commitMove(id, "Closed");
    setPendingClose(null); setCloseNote("");
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
                              setDetailItem(b.id);
                              return;
                            }
                            e.preventDefault();
                            dragStartPos.current = { x: e.clientX, y: e.clientY };
                            hasMoved.current = false;
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
            <span>Under Review → Approved (score ≥ 71) · Rejected · Closed · Deferred</span>
            <span className="text-rag-red/70">Approved / Rejected / Closed = terminal (locked)</span>
          </div>
        </TabsContent>

        <TabsContent value="commercial" className="mt-5">
          <CommercialBidsBoard />
        </TabsContent>

        <TabsContent value="queue" className="mt-5 space-y-3">
          {items.filter((p) => p.stage === "Under Review" || p.stage === "Submitted").length === 0 && (
            <div className="glass-card p-8 text-center text-sm text-muted-foreground">No items pending approval</div>
          )}
          {items.filter((p) => p.stage === "Under Review" || p.stage === "Submitted").map((p) => {
            const history: RoleApproval[] = approvalHistory[p.id] ?? APPROVAL_ROLES.map((r) => ({ role: r, action: "Pending" as ApprovalAction }));
            return (
              <div key={p.id} className="glass-card overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
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
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-accent" onClick={() => setDetailItem(p.id)}>
                    <ExternalLink className="mr-1 h-3 w-3" />View
                  </Button>
                </div>

                {/* Approval history rows */}
                <div className="divide-y divide-border/40">
                  {history.map((a) => (
                    <div key={a.role} className="flex items-center gap-3 px-4 py-2.5">
                      <div className={`h-2 w-2 shrink-0 rounded-full ${
                        a.action === "Approved" ? "bg-rag-green" :
                        a.action === "Rejected" ? "bg-rag-red" :
                        "bg-muted-foreground/40"
                      }`} />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-foreground">{a.role}</span>
                        {a.by && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            — {a.by} · {a.when}
                            {a.comment && <span className="ml-1 italic">"{a.comment}"</span>}
                          </span>
                        )}
                      </div>
                      {a.action === "Pending" ? (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-6 bg-accent text-accent-foreground hover:bg-accent/90 px-2 text-xs disabled:opacity-40"
                            disabled={p.score < 71}
                            title={p.score < 71 ? `Score ${p.score} — min 71` : undefined}
                            onClick={() => { setRoleApproveDialog({ itemId: p.id, role: a.role }); setRoleNote(""); }}
                          >
                            <Check className="mr-1 h-3 w-3" />Approve
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => { setRoleRejectDialog({ itemId: p.id, role: a.role }); setRoleReason(""); }}
                          >
                            <XIcon className="mr-1 h-3 w-3" />Reject
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline" className={`text-[10px] ${
                          a.action === "Approved"
                            ? "border-rag-green/30 bg-rag-green/10 text-rag-green"
                            : "border-rag-red/30 bg-rag-red/10 text-rag-red"
                        }`}>{a.action}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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
            <Label>Comment <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea placeholder="Any conditions, scope adjustments, or notes for the PM…" value={approveNote} onChange={(e) => setApproveNote(e.target.value)} rows={3} />
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
            <Label>Comment <span className="text-rag-red">*</span></Label>
            <Textarea
              placeholder="Why is this being rejected? (required)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
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

      {/* Close Case dialog */}
      <Dialog open={!!pendingClose} onOpenChange={(o) => { if (!o) { setPendingClose(null); setCloseNote(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Close Business Case</DialogTitle></DialogHeader>
          <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm">
            <div className="font-medium text-foreground">{items.find((i) => i.id === pendingClose)?.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">Score {items.find((i) => i.id === pendingClose)?.score}/100</div>
          </div>
          <p className="text-sm text-muted-foreground">This business case will be closed and archived. It cannot be reopened.</p>
          <div className="space-y-2">
            <Label>Comment <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              placeholder="Reason for closing…"
              value={closeNote}
              onChange={(e) => setCloseNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPendingClose(null); setCloseNote(""); }}>Cancel</Button>
            <Button variant="outline" className="border-border text-foreground" onClick={() => pendingClose && confirmClose(pendingClose)}>
              Confirm Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewBusinessCaseFlow open={newCase} onOpenChange={setNewCase} />

      {/* Per-role Approve dialog */}
      <Dialog open={!!roleApproveDialog} onOpenChange={(o) => { if (!o) setRoleApproveDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Approve — {roleApproveDialog?.role}</DialogTitle>
          </DialogHeader>
          <div className="rounded-md border border-rag-green/20 bg-rag-green/5 p-3 text-sm">
            <div className="font-medium text-foreground">
              {items.find((i) => i.id === roleApproveDialog?.itemId)?.title}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Approval note (optional)</Label>
            <Textarea
              placeholder="Any conditions or comments…"
              value={roleNote}
              onChange={(e) => setRoleNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleApproveDialog(null)}>Cancel</Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => {
                if (!roleApproveDialog) return;
                const { itemId, role } = roleApproveDialog;
                setApprovalHistory((prev) => {
                  const updated = (prev[itemId] ?? []).map((a) =>
                    a.role === role
                      ? { ...a, action: "Approved" as ApprovalAction, by: "You", when: "Just now", comment: roleNote || undefined }
                      : a
                  );
                  const allDone = updated.every((a) => a.action !== "Pending");
                  const allApproved = updated.every((a) => a.action === "Approved");
                  if (allDone && allApproved) {
                    const fullItem = items.find((i) => i.id === itemId);
                    if (fullItem) {
                      addProject(itemToProject(fullItem));
                      addNotification({ tone: "green", title: `${fullItem.title} fully approved — added to Portfolio`, time: "Just now" });
                    }
                    setTimeout(() => {
                      commitMove(itemId, "Approved");
                      navigate({ to: "/portfolio" });
                    }, 300);
                  }
                  return { ...prev, [itemId]: updated };
                });
                toast.success(`${role} approved`);
                setRoleApproveDialog(null);
                setRoleNote("");
              }}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />Confirm Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Per-role Reject dialog */}
      <Dialog open={!!roleRejectDialog} onOpenChange={(o) => { if (!o) setRoleRejectDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject — {roleRejectDialog?.role}</DialogTitle>
          </DialogHeader>
          <div className="rounded-md border border-rag-red/20 bg-rag-red/5 p-3 text-sm">
            <div className="font-medium text-foreground">
              {items.find((i) => i.id === roleRejectDialog?.itemId)?.title}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason <span className="text-rag-red">*</span></Label>
            <Textarea
              placeholder="Why is this being rejected? (required)"
              value={roleReason}
              onChange={(e) => setRoleReason(e.target.value)}
              rows={3}
              className={!roleReason ? "border-rag-red/30" : ""}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleRejectDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!roleRejectDialog || !roleReason.trim()) {
                  toast.error("Rejection reason is required");
                  return;
                }
                const { itemId, role } = roleRejectDialog;
                setApprovalHistory((prev) => ({
                  ...prev,
                  [itemId]: (prev[itemId] ?? []).map((a) =>
                    a.role === role
                      ? { ...a, action: "Rejected" as ApprovalAction, by: "You", when: "Just now", comment: roleReason }
                      : a
                  ),
                }));
                toast.info(`${role} rejected`);
                setRoleRejectDialog(null);
                setRoleReason("");
              }}
            >
              <XIcon className="mr-1.5 h-3.5 w-3.5" />Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Business Case detail dialog */}
      {(() => {
        const bc = items.find((i) => i.id === detailItem);
        if (!bc) return null;
        return (
          <Dialog open={!!detailItem} onOpenChange={(o) => { if (!o) setDetailItem(null); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="num-mono text-sm text-muted-foreground">{bc.id}</span>
                  {bc.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: "Score", v: String(bc.score), c: bc.score >= 71 ? "text-rag-green" : bc.score >= 41 ? "text-rag-amber" : "text-rag-red" },
                    { l: "ROI", v: bc.roi, c: "text-foreground" },
                    { l: "Pillar", v: bc.pillar, c: "text-accent" },
                  ].map((k) => (
                    <div key={k.l} className="rounded-md border border-border bg-secondary/30 p-3 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{k.l}</div>
                      <div className={`mt-1 text-base font-medium num-mono ${k.c}`}>{k.v}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-md border border-border bg-secondary/20 p-3 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted by</span>
                    <span className="font-medium text-foreground">{bc.submittedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-foreground">{bc.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stage</span>
                    <Badge variant="outline" className="border-border bg-secondary/40 text-xs">{bc.stage}</Badge>
                  </div>
                </div>

                <div className="rounded-md bg-secondary/20 border border-border p-3 text-sm text-muted-foreground">
                  This business case is pending review. Scoring is based on strategic alignment, ROI, risk profile, and resource availability. A minimum score of 71 is required for approval.
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDetailItem(null)}>Cancel</Button>
                {bc.stage === "Under Review" && (
                  <>
                    <Button
                      variant="outline"
                      className="border-border text-muted-foreground hover:bg-secondary/60"
                      onClick={() => { setDetailItem(null); setPendingClose(bc.id); }}
                    >
                      Close Case
                    </Button>
                    <Button
                      variant="outline"
                      className="border-rag-red/40 text-rag-red hover:bg-rag-red/10"
                      onClick={() => { setDetailItem(null); setQueueReject(bc.id); }}
                    >
                      <XIcon className="mr-1.5 h-3.5 w-3.5" />Reject
                    </Button>
                    <Button
                      className="bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40"
                      disabled={bc.score < 71}
                      title={bc.score < 71 ? `Score ${bc.score} — min 71 required` : undefined}
                      onClick={() => { setDetailItem(null); setQueueApprove(bc.id); }}
                    >
                      <Check className="mr-1.5 h-3.5 w-3.5" />Approve
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}

// ── Commercial Bids Board ─────────────────────────────────────────────────────

const BID_STAGES = ["In Pursuit", "RFP Issued", "Proposal Submitted", "Evaluation", "Awarded", "Lost"] as const;
type BidStage = typeof BID_STAGES[number];

const BID_STAGE_STYLE: Record<BidStage, string> = {
  "In Pursuit":         "border-rag-blue/30 bg-rag-blue/5",
  "RFP Issued":         "border-rag-amber/30 bg-rag-amber/5",
  "Proposal Submitted": "border-role-director/30 bg-role-director/5",
  "Evaluation":         "border-accent/30 bg-accent-dim/10",
  "Awarded":            "border-rag-green/30 bg-rag-green/5",
  "Lost":               "border-rag-red/20 bg-rag-red/5",
};

type Bid = {
  id: string; title: string; client: string; value: string;
  owner: string; stage: BidStage; due: string; probability: number;
};

const SEED_BIDS: Bid[] = [
  { id: "BID-031", title: "Smart Grid Operations Center",       client: "National Grid Co.",      value: "$8.2M",  owner: "PI",  stage: "In Pursuit",         due: "Aug 2026", probability: 40 },
  { id: "BID-032", title: "Offshore Platform Safety Upgrade",   client: "Petro Gulf Ltd.",        value: "$15.4M", owner: "JS",  stage: "In Pursuit",         due: "Sep 2026", probability: 35 },
  { id: "BID-033", title: "Airport Terminal Expansion",         client: "Dubai Airports",         value: "$42.0M", owner: "SA",  stage: "RFP Issued",         due: "Jul 2026", probability: 55 },
  { id: "BID-034", title: "Water Treatment Plant Phase 2",      client: "Municipal Authority",    value: "$12.8M", owner: "OH",  stage: "RFP Issued",         due: "Jul 2026", probability: 60 },
  { id: "BID-035", title: "IT Infrastructure Modernisation",    client: "Acme Holdings",          value: "$6.5M",  owner: "MC",  stage: "Proposal Submitted", due: "Jun 2026", probability: 70 },
  { id: "BID-036", title: "Industrial Automation — Sector B",   client: "Khaleeji Mfg.",          value: "$9.1M",  owner: "DO",  stage: "Proposal Submitted", due: "Jun 2026", probability: 65 },
  { id: "BID-037", title: "Healthcare Digital Transformation",  client: "MedNet Group",           value: "$11.3M", owner: "PI",  stage: "Evaluation",         due: "Jun 2026", probability: 80 },
  { id: "BID-038", title: "Port Logistics Automation",          client: "Gulf Ports Authority",   value: "$28.5M", owner: "JS",  stage: "Awarded",            due: "Awarded",  probability: 100 },
  { id: "BID-039", title: "Data Center Expansion — Phase 3",    client: "TelCo MENA",             value: "$19.2M", owner: "SA",  stage: "Lost",               due: "—",        probability: 0 },
];

function CommercialBidsBoard() {
  const [bids, setBids] = useState<Bid[]>(SEED_BIDS);

  const totalPipeline = bids
    .filter((b) => b.stage !== "Lost")
    .reduce((s, b) => s + parseFloat(b.value.replace(/[$M]/g, "")), 0);

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: "Total pipeline",   v: `$${totalPipeline.toFixed(1)}M` },
          { l: "Active bids",      v: String(bids.filter((b) => !["Awarded","Lost"].includes(b.stage)).length) },
          { l: "Awarded",          v: String(bids.filter((b) => b.stage === "Awarded").length), c: "text-rag-green" },
          { l: "Win rate (YTD)",   v: "64%", c: "text-accent" },
        ].map((k) => (
          <div key={k.l} className="glass-card p-4">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {BID_STAGES.map((stage) => {
          const stageBids = bids.filter((b) => b.stage === stage);
          return (
            <div key={stage} className={`rounded-lg border p-3 ${BID_STAGE_STYLE[stage]}`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="label-eyebrow">{stage}</span>
                <Badge variant="outline" className="border-border bg-secondary/40 text-[10px]">{stageBids.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[56px]">
                {stageBids.map((b) => (
                  <div key={b.id} className="glass-card p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="num-mono text-muted-foreground">{b.id}</span>
                      <span className={`num-mono rounded px-1.5 py-0.5 text-[10px] ${
                        b.probability >= 80 ? "bg-rag-green/10 text-rag-green" :
                        b.probability >= 50 ? "bg-rag-amber/10 text-rag-amber" :
                        b.probability  > 0  ? "bg-rag-blue/10 text-rag-blue" :
                                              "bg-rag-red/10 text-rag-red"
                      }`}>{b.probability}%</span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-foreground leading-snug">{b.title}</div>
                    <div className="mt-1.5 text-[11px] text-muted-foreground">{b.client}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="bg-accent-dim text-[10px] text-accent">{b.owner}</AvatarFallback>
                      </Avatar>
                      <span className="num-mono text-[10px] text-muted-foreground">{b.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
