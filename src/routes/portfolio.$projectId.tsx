import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useMemo, useEffect, Fragment } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RagBadge } from "@/components/RagBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, FileText, MessageSquare, Paperclip, Download, UserPlus, ChevronDown, ChevronRight, Send, CheckCircle2, XCircle, Plus, AlertTriangle, Upload, FileUp, Pencil, ArrowUpRight } from "lucide-react";
import type { Rag } from "@/lib/mock-data";
import { projects, vendors as vendorList, resources as resourcePool } from "@/lib/mock-data";
import { useProjects, useNotifications, useRfps, useResourceRequests, type RfpEntry, type ResourceRequest } from "@/lib/projects-store";
import { toast } from "sonner";
import { ProjectGantt } from "@/components/ProjectGantt";
import { ProjectSchedule, computePlannedProgress } from "@/components/ProjectSchedule";
void ProjectGantt;

export const Route = createFileRoute("/portfolio/$projectId")({
  component: ProjectDetail,
  loader: ({ params }) => {
    const p = projects.find((x) => x.id === params.projectId);
    if (!p) throw notFound();
    return { project: p };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.project.name ?? "Project"} — Nexus PMO` },
      { name: "description", content: `Full project workspace: planning, milestones, RAID, financials, team & status reporting for ${loaderData?.project.name}.` },
    ],
  }),
});

const TABS = [
  "Overview", "Project Charter", "Project Schedule", "Team & Allocation", "Financials",
  "Risks & Issues", "Documents", "Status Reports", "Change Requests",
  "Procurement", "Business Trips", "Stakeholders", "Lessons Learned",
];

const PLANNING_STAGES = [
  { n: 1, name: "Initiation", state: "done" as const },
  { n: 2, name: "Planning",   state: "active" as const },
  { n: 3, name: "Execution",  state: "todo" as const },
  { n: 4, name: "Monitoring", state: "todo" as const },
  { n: 5, name: "Closure",    state: "todo" as const },
];

const PLANNING_CHECKLIST = [
  { label: "Objectives & scope defined", done: true },
  { label: "Milestone schedule created", done: true },
  { label: "Manpower requirements submitted", done: true },
  { label: "Business trips planned", done: false },
  { label: "Budget plan approved", done: false },
  { label: "Charter approved", done: false },
];

const INITIAL_GATE_DATA: GateStage[] = [
  { name: "Initiation", items: [
    { task: "Define project objectives & scope", role: "Project Manager", done: true },
    { task: "Identify key stakeholders", role: "Project Manager", done: true },
    { task: "Obtain project charter approval", role: "Executive Sponsor", done: true },
  ]},
  { name: "Planning", items: [
    { task: "Develop project management plan", role: "Project Manager", done: true },
    { task: "Estimate resources and budget", role: "Finance Manager", done: true },
    { task: "Risk assessment completed", role: "Project Manager", done: false },
    { task: "Procurement plan approved", role: "Procurement Lead", done: false },
  ]},
  { name: "Execution", items: [
    { task: "Kick-off meeting conducted", role: "Project Manager", done: false },
    { task: "All team members onboarded", role: "Resource Manager", done: false },
    { task: "First sprint review completed", role: "Tech Lead", done: false },
  ]},
  { name: "Monitoring", items: [
    { task: "Weekly status reports submitted", role: "Project Manager", done: false },
    { task: "Budget variance within 5%", role: "Finance Manager", done: false },
    { task: "RAID log up to date", role: "Project Manager", done: false },
  ]},
  { name: "Closure", items: [
    { task: "All deliverables accepted by client / sponsor", role: "Executive Sponsor", done: false },
    { task: "Project documentation complete and filed", role: "Project Manager", done: false },
    { task: "Lessons learned documented", role: "Project Manager", done: false },
    { task: "Final financial report approved", role: "Finance Manager", done: false },
    { task: "Stakeholder sign-off obtained", role: "Executive Sponsor", done: false },
    { task: "All contracts closed and vendors notified", role: "Procurement Lead", done: false },
    { task: "Project archived in system", role: "Project Manager", done: false },
  ]},
];

function ProjectDetail() {
  const { project: loaderProject } = Route.useLoaderData();
  const { projects: liveProjects, updateProject } = useProjects();
  const { addNotification } = useNotifications();
  const { addRfp } = useRfps();
  const { addResourceRequest, resourceRequests } = useResourceRequests();
  const project = liveProjects.find((p) => p.id === loaderProject.id) ?? loaderProject;
  const [reportOpen, setReportOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState([
    { n: project.pm, r: "PM", a: 80, p: "Apr–Sep", s: "green" as Rag },
    { n: "Mei Chen", r: "Security Lead", a: 40, p: "May–Aug", s: "green" as Rag },
    { n: "Priya Iyer", r: "Tech Lead", a: 100, p: "Jun–Sep", s: "amber" as Rag },
    { n: "Diego Ortiz", r: "BI Engineer", a: 30, p: "Jul–Aug", s: "blue" as Rag },
  ]);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [reqResourceOpen, setReqResourceOpen] = useState(false);
  const [ctxDialog, setCtxDialog] = useState<
    | { mode: "subtask"; parent: string }
    | { mode: "edit"; name: string }
    | null
  >(null);
  const [milestones, setMilestones] = useState<Milestone[]>([
    // ── Phase 1: Discovery — completed, all green, all assigned ──────────────
    { name: "Discovery & Requirements", kind: "Task", startDate: "2025-04-15", endDate: "2025-05-16", owner: "Sara", rag: "green", dep: "—", roles: [{ role: "Business Analyst", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-DSC", amount: "$80K" }, progress: 100, parent: "Discovery Sign-off", weightScore: 8 },
    { name: "Stakeholder workshops", kind: "Task", startDate: "2025-04-15", endDate: "2025-04-25", owner: "Sara", rag: "green", dep: "—", roles: [{ role: "Business Analyst", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 100, parent: "Discovery & Requirements", assignee: "Sara Al-Rashid", weightScore: 5 },
    { name: "Requirements doc", kind: "Task", startDate: "2025-04-28", endDate: "2025-05-12", owner: "Sara", rag: "green", dep: "Stakeholder workshops", roles: [{ role: "Business Analyst", skill: "Mid", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 100, parent: "Discovery & Requirements", assignee: "John Smith", weightScore: 5 },
    { name: "Discovery Sign-off", kind: "Milestone", startDate: "2025-05-16", endDate: "2025-05-16", owner: "Sara", rag: "green", dep: "Discovery & Requirements", roles: [], payment: { kind: "Client Revenue", amount: "$120K" }, progress: 100, assignee: "Sara Al-Rashid", milestoneType: "finish" },

    // ── Phase 2: Design — at risk (amber), mixed assignee states ────────────
    { name: "Solution Design", kind: "Task", startDate: "2025-05-19", endDate: "2025-06-27", owner: "Mei", rag: "amber", dep: "Discovery Sign-off", roles: [{ role: "Solution Architect", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-DSN", amount: "$150K" }, progress: 70, parent: "Design Approved", weightScore: 8 },
    { name: "Architecture blueprint", kind: "Task", startDate: "2025-05-19", endDate: "2025-06-06", owner: "Mei", rag: "green", dep: "Discovery Sign-off", roles: [{ role: "Solution Architect", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 100, parent: "Solution Design", assignee: "Mei Chen", weightScore: 4 },
    { name: "UX wireframes", kind: "Task", startDate: "2025-05-26", endDate: "2025-06-20", owner: "Mei", rag: "amber", dep: "Architecture blueprint", roles: [{ role: "UX Designer", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 60, parent: "Solution Design", assignee: "Waiting", weightScore: 4 },
    { name: "Security review", kind: "Task", startDate: "2025-06-09", endDate: "2025-06-27", owner: "Mei", rag: "amber", dep: "Architecture blueprint", roles: [{ role: "Security Lead", skill: "Senior", fte: 0.5 }], payment: { kind: "None", amount: "" }, progress: 30, parent: "Solution Design", weightScore: 2 },
    { name: "Design Approved", kind: "Milestone", startDate: "2025-06-27", endDate: "2025-06-27", owner: "Mei", rag: "amber", dep: "Solution Design", roles: [], payment: { kind: "Client Revenue", amount: "$180K" }, progress: 0, assignee: "Mei Chen", milestoneType: "finish" },

    // ── Phase 3: Build — in progress (blue), assignees fulfilled ────────────
    { name: "Build & Integration", kind: "Task", startDate: "2025-06-30", endDate: "2025-08-22", owner: "Priya", rag: "blue", dep: "Design Approved", roles: [{ role: "Integration Dev", skill: "Mid", fte: 2 }, { role: "Backend Dev", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-BLD", amount: "$320K" }, progress: 45, parent: "Build Complete", weightScore: 10 },
    { name: "Backend API", kind: "Task", startDate: "2025-06-30", endDate: "2025-07-25", owner: "Diego", rag: "blue", dep: "Design Approved", roles: [{ role: "Backend Dev", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 65, parent: "Build & Integration", assignee: "Diego Ortiz", weightScore: 4 },
    { name: "Frontend UI", kind: "Task", startDate: "2025-07-07", endDate: "2025-08-08", owner: "Priya", rag: "blue", dep: "Backend API", roles: [{ role: "Frontend Dev", skill: "Mid", fte: 2 }], payment: { kind: "None", amount: "" }, progress: 40, parent: "Build & Integration", assignee: "Priya Iyer", weightScore: 3 },
    { name: "Data migration scripts", kind: "Task", startDate: "2025-07-14", endDate: "2025-08-15", owner: "Diego", rag: "amber", dep: "Backend API", roles: [{ role: "Data Engineer", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 25, parent: "Build & Integration", assignee: "Waiting", weightScore: 2 },
    { name: "Third-party integrations", kind: "Task", startDate: "2025-07-21", endDate: "2025-08-22", owner: "Priya", rag: "grey", dep: "Frontend UI", roles: [{ role: "Integration Dev", skill: "Mid", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Build & Integration", weightScore: 1 },
    { name: "Build Complete", kind: "Milestone", startDate: "2025-08-22", endDate: "2025-08-22", owner: "Priya", rag: "blue", dep: "Build & Integration", roles: [], payment: { kind: "Client Revenue", amount: "$250K" }, progress: 0, assignee: "Priya Iyer", milestoneType: "finish" },

    // ── Phase 4: Testing — blocked (red), waiting/unrequested mix ───────────
    { name: "Testing & QA", kind: "Task", startDate: "2025-08-25", endDate: "2025-09-19", owner: "Priya", rag: "red", dep: "Build Complete", roles: [{ role: "QA Engineer", skill: "Senior", fte: 2 }], payment: { kind: "Package Cost", packageId: "PKG-QA", amount: "$95K" }, progress: 10, parent: "UAT Sign-off", weightScore: 8 },
    { name: "SIT execution", kind: "Task", startDate: "2025-08-25", endDate: "2025-09-05", owner: "Priya", rag: "red", dep: "Build Complete", roles: [{ role: "QA Engineer", skill: "Senior", fte: 2 }], payment: { kind: "None", amount: "" }, progress: 15, parent: "Testing & QA", assignee: "Waiting", weightScore: 4 },
    { name: "UAT execution", kind: "Task", startDate: "2025-09-08", endDate: "2025-09-19", owner: project.pm, rag: "red", dep: "SIT execution", roles: [{ role: "QA Lead", skill: "Lead", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Testing & QA", weightScore: 4 },
    { name: "Performance & load test", kind: "Task", startDate: "2025-09-01", endDate: "2025-09-12", owner: "Mei", rag: "amber", dep: "Build Complete", roles: [{ role: "Performance Engineer", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 5, parent: "Testing & QA", assignee: "Waiting", weightScore: 2 },
    { name: "UAT Sign-off", kind: "Milestone", startDate: "2025-09-19", endDate: "2025-09-19", owner: project.pm, rag: "red", dep: "Testing & QA", roles: [], payment: { kind: "Client Revenue", amount: "$200K" }, progress: 0, milestoneType: "finish" },

    // ── Phase 5: Deploy — not started (grey), no skill requests yet ─────────
    { name: "Deployment & Hypercare", kind: "Task", startDate: "2025-09-22", endDate: "2025-10-17", owner: project.pm, rag: "grey", dep: "UAT Sign-off", roles: [{ role: "DevOps Engineer", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-DPL", amount: "$60K" }, progress: 0, parent: "Go-Live", weightScore: 10 },
    { name: "Production cutover", kind: "Task", startDate: "2025-09-22", endDate: "2025-09-26", owner: project.pm, rag: "grey", dep: "UAT Sign-off", roles: [{ role: "DevOps Engineer", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Deployment & Hypercare", weightScore: 5 },
    { name: "Hypercare support", kind: "Task", startDate: "2025-09-29", endDate: "2025-10-17", owner: project.pm, rag: "grey", dep: "Production cutover", roles: [{ role: "Support Lead", skill: "Mid", fte: 2 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Deployment & Hypercare", weightScore: 3 },
    { name: "Knowledge transfer", kind: "Task", startDate: "2025-10-06", endDate: "2025-10-17", owner: project.pm, rag: "grey", dep: "Production cutover", roles: [{ role: "Trainer", skill: "Mid", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Deployment & Hypercare", weightScore: 2 },
    { name: "Go-Live", kind: "Milestone", startDate: project.endDate, endDate: project.endDate, owner: project.pm, rag: "blue", dep: "Deployment & Hypercare", roles: [], payment: { kind: "Client Revenue", amount: "$500K" }, progress: 0, milestoneType: "finish" },
  ]);
  const [reports, setReports] = useState<StatusReport[]>(() => [
    { week: 18, by: project.pm, when: "3 days ago", rag: project.rag, text: "Integration layer testing delayed by 1 week. Fallback plan in review with IT Director. No impact on go-live yet." },
    { week: 17, by: project.pm, when: "10 days ago", rag: "amber", text: "Vendor SOW reviewed. Two open RAID items remain; mitigations scheduled this sprint." },
    { week: 16, by: project.pm, when: "17 days ago", rag: "green", text: "Discovery completed and signed off. Build phase 1 kicked off on plan." },
  ]);
  const [planningProgressOpen, setPlanningProgressOpen] = useState(false);
  const [stageGateOpen, setStageGateOpen] = useState(false);
  const [gateData, setGateData] = useState<GateStage[]>(INITIAL_GATE_DATA);
  const currentStage = PLANNING_STAGES.find((s) => s.state === "active") ?? PLANNING_STAGES[0];
  const planningDone = PLANNING_CHECKLIST.filter((c) => c.done).length;
  return (
    <div>
      <div className="mb-4">
        <Link to="/portfolio" className="inline-flex items-center text-xs text-muted-foreground hover:text-accent">
          <ChevronLeft className="mr-1 h-3 w-3" />Back to Portfolio
        </Link>
      </div>
      <PageHeader
        title={project.name}
        subtitle={`${project.businessLine} · ${project.department} · PM ${project.pm} · Client ${project.client}`}
        actions={
          <div className="flex items-center gap-2">
            <RagBadge rag={project.rag} />
            <Badge variant="outline" className="border-border bg-secondary/40">{project.stage}</Badge>
            <Button variant="outline" size="sm" onClick={() => window.print()}>Export</Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setReportOpen(true)}>Submit status</Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-6">
        {(() => {
          const derived = computeDerivedSchedule(milestones, resourceRequests);
          const leaves = derived.filter((m) => m.kind === "Task" && !derived.some((c) => c.parent === m.name));
          let totalW = 0, weightedActual = 0, weightedPlanned = 0;
          for (const t of leaves) {
            const w = Math.max(0, t.weightScore ?? 1);
            totalW += w;
            weightedActual += w * (t.progress ?? 0);
            weightedPlanned += w * computePlannedProgress(t.startDate, t.endDate);
          }
          const actualPct = totalW ? Math.round(weightedActual / totalW) : 0;
          const plannedPct = totalW ? Math.round(weightedPlanned / totalW) : 0;
          return (
            <button
              type="button"
              onClick={() => setPlanningProgressOpen(true)}
              className="glass-card group relative p-3 text-left transition-colors hover:border-accent/40"
            >
              <ArrowUpRight className="pointer-events-none absolute top-2 right-2 h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-accent" />
              <div className="label-eyebrow">Progress</div>
              <div className="mt-1 text-lg font-medium num-mono text-foreground">{actualPct}%</div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>Planned <span className="num-mono text-foreground/80">{plannedPct}%</span></span>
                <span className={actualPct >= plannedPct ? "text-rag-green" : "text-rag-amber"}>
                  {actualPct >= plannedPct ? "On / ahead" : `${plannedPct - actualPct}% behind`}
                </span>
              </div>
            </button>
          );
        })()}
        <button
          type="button"
          onClick={() => setStageGateOpen(true)}
          className="glass-card group relative p-3 text-left transition-colors hover:border-accent/40"
        >
          <ArrowUpRight className="pointer-events-none absolute top-2 right-2 h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-accent" />
          <div className="label-eyebrow">Stage Gate</div>
          <div className="mt-1 text-lg font-medium text-foreground">{currentStage.name}</div>
          <div className="mt-1 flex items-center gap-1">
            {PLANNING_STAGES.map((s) => (
              <span
                key={s.n}
                className={`h-1.5 flex-1 rounded-full ${
                  s.state === "done" ? "bg-accent" : s.state === "active" ? "bg-accent/60" : "bg-secondary/60"
                }`}
              />
            ))}
          </div>
        </button>
        {[
          { l: "Budget", v: `$${project.budgetUsed.toFixed(2)}M / $${project.budgetTotal.toFixed(1)}M` },
          { l: "Variance", v: "+4%", c: "text-rag-amber" },
          { l: "End date", v: project.endDate },
          { l: "Open RAID", v: project.risks + project.issues, c: "text-rag-red" },
        ].map((k) => (
          <div key={k.l} className="glass-card p-3">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="Overview">
        <TabsList className="overflow-x-auto whitespace-nowrap">
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t} className="text-xs">{t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="Overview" className="mt-5">
          <OverviewTab project={project} />
        </TabsContent>

        <TabsContent value="Project Charter" className="mt-5">
          <CharterTab project={project} />
        </TabsContent>


        <TabsContent value="Project Schedule" className="mt-5">
          <ProjectSchedule
            items={useMemo(() => computeDerivedSchedule(milestones, resourceRequests), [milestones, resourceRequests])}
            onItemPatch={(name, patch) =>
              setMilestones((prev) => prev.map((m) => (m.name === name ? { ...m, ...patch } as Milestone : m)))
            }
            onRequestSkill={(name, role) => {
              const id = addResourceRequest({
                project: project.name,
                role: role.role,
                skill: role.skill,
                fte: role.fte,
                from: new Date().toISOString().slice(0, 7),
                until: new Date().toISOString().slice(0, 7),
                priority: "Medium",
                submittedBy: project.pm,
                notes: `Requested from schedule task "${name}"`,
              });
              setMilestones((prev) =>
                prev.map((m) =>
                  m.name === name
                    ? { ...m, resourceRequestIds: [...(m.resourceRequestIds ?? []), id], assignee: "Waiting" }
                    : m,
                ),
              );
              toast.success("Skill request sent to Resources");
            }}
            AddItemSlot={
              <AddMilestoneDialog
                defaultOwner={project.pm}
                packages={SEED_PACKAGES}
                items={milestones}
                projectName={project.name}
                addResourceRequest={addResourceRequest}
                onAdd={(newItems) => setMilestones((prev) => [...prev, ...newItems])}
                onUpdateExisting={(name, patch) =>
                  setMilestones((prev) => prev.map((m) => (m.name === name ? { ...m, ...patch } : m)))
                }
              />
            }
            onImport={(imported, mode) => {
              const asMilestones = imported.map((it) => ({ ...it }) as Milestone);
              setMilestones((prev) => (mode === "replace" ? asMilestones : [...prev, ...asMilestones]));
            }}
            onAddSubtask={(parentName) => setCtxDialog({ mode: "subtask", parent: parentName })}
            onEditItem={(name) => setCtxDialog({ mode: "edit", name })}
            onDeleteItem={(name) => {
              setMilestones((prev) => {
                // cascade-delete: remove the item and any descendant whose parent chain leads to it
                const toRemove = new Set<string>([name]);
                let changed = true;
                while (changed) {
                  changed = false;
                  for (const it of prev) {
                    if (it.parent && toRemove.has(it.parent) && !toRemove.has(it.name)) {
                      toRemove.add(it.name);
                      changed = true;
                    }
                  }
                }
                return prev.filter((m) => !toRemove.has(m.name));
              });
            }}
          />

          {/* Controlled dialog for right-click "Add subtask" / "Edit" */}
          <AddMilestoneDialog
            defaultOwner={project.pm}
            packages={SEED_PACKAGES}
            items={milestones}
            projectName={project.name}
            addResourceRequest={addResourceRequest}
            onAdd={(newItems) => setMilestones((prev) => [...prev, ...newItems])}
            onUpdateExisting={(name, patch) =>
              setMilestones((prev) => prev.map((m) => (m.name === name ? { ...m, ...patch } : m)))
            }
            hideTrigger
            open={ctxDialog !== null}
            onOpenChange={(o) => { if (!o) setCtxDialog(null); }}
            initialParent={ctxDialog?.mode === "subtask" ? ctxDialog.parent : undefined}
            initialKind={ctxDialog?.mode === "subtask" ? "Task" : undefined}
            editingItem={ctxDialog?.mode === "edit" ? (milestones.find((m) => m.name === ctxDialog.name) ?? null) : null}
          />

        </TabsContent>


        <TabsContent value="Team & Allocation" className="mt-5">
          <Tabs defaultValue="team-members">
            <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
              {[
                { v: "manpower-plan", l: "Manpower Planning" },
                { v: "team-members", l: "Team Members" },
                { v: "alloc-overview", l: "Allocation Overview" },
              ].map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="text-xs"
                >
                  {t.l}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="manpower-plan" className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  { l: "Roles requested", v: "5" },
                  { l: "Confirmed", v: "4", c: "text-rag-green" },
                  { l: "Pending", v: "1", c: "text-rag-amber" },
                  { l: "Total FTE", v: "5.5" },
                ].map((k) => (
                  <div key={k.l} className="glass-card p-4">
                    <div className="label-eyebrow">{k.l}</div>
                    <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
                  </div>
                ))}
              </div>
              <div className="">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead><TableHead>FTE</TableHead><TableHead>Skill level</TableHead>
                      <TableHead>Period</TableHead><TableHead>Sourcing</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { r: "Solution Architect", f: 1.0, sk: "Senior", p: "Jun–Sep", src: "Internal", s: "green", sl: "Confirmed" },
                      { r: "QA Engineer",        f: 2.0, sk: "Mid",    p: "Jul–Sep", src: "Internal",  s: "green", sl: "Confirmed" },
                      { r: "Integration Dev",    f: 1.5, sk: "Mid",    p: "Jun–Aug", src: "Internal",  s: "green", sl: "Confirmed" },
                      { r: "Security Reviewer",  f: 0.5, sk: "Senior", p: "Aug",     src: "Subcontract", s: "green", sl: "Confirmed" },
                      { r: "Change Manager",     f: 0.5, sk: "Mid",    p: "Sep",     src: "Internal",  s: "amber", sl: "Pending" },
                    ].map((m) => (
                      <TableRow key={m.r}>
                        <TableCell className="font-medium text-foreground">{m.r}</TableCell>
                        <TableCell className="num-mono">{m.f}</TableCell>
                        <TableCell>{m.sk}</TableCell>
                        <TableCell>{m.p}</TableCell>
                        <TableCell className="text-muted-foreground">{m.src}</TableCell>
                        <TableCell><RagBadge rag={m.s as any} label={m.sl} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="team-members" className="mt-4 space-y-3">
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" className="gap-1 text-xs border-accent/40 text-accent hover:bg-accent-dim"
                  onClick={() => setReqResourceOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5" />Request Resource
                </Button>
                <Button size="sm" className="gap-1 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => setAddMemberOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />Add Member
                </Button>
              </div>
              <div className="">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead><TableHead>Role</TableHead>
                      <TableHead>Allocation %</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((m) => (
                      <TableRow key={m.n}>
                        <TableCell className="font-medium">{m.n}</TableCell>
                        <TableCell>{m.r}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={m.a} className="h-1.5 w-32" />
                            <span className="num-mono text-xs">{m.a}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{m.p}</TableCell>
                        <TableCell><RagBadge rag={m.s} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Add Member dialog */}
              <AddTeamMemberDialog
                open={addMemberOpen}
                onOpenChange={setAddMemberOpen}
                onAdd={(m) => { setTeamMembers((prev) => [...prev, m]); toast.success(`${m.n} added to team`); }}
              />

              {/* Request Resource dialog */}
              <RequestResourceDialog
                open={reqResourceOpen}
                onOpenChange={setReqResourceOpen}
                project={project}
                onSubmit={(r) => { addResourceRequest(r); toast.success("Resource request submitted to Resources module"); }}
              />
            </TabsContent>

            <TabsContent value="alloc-overview" className="mt-4 glass-card p-5">
              <div className="label-eyebrow mb-4">Team capacity vs. allocation — this project</div>
              <div className="space-y-4">
                {[
                  { n: project.pm,   r: "PM",           alloc: 80,  cap: 100, over: false },
                  { n: "Mei Chen",   r: "Security Lead", alloc: 40,  cap: 100, over: false },
                  { n: "Priya Iyer", r: "Tech Lead",     alloc: 100, cap: 100, over: false },
                  { n: "Diego Ortiz",r: "BI Engineer",   alloc: 30,  cap: 100, over: false },
                ].map((m) => (
                  <div key={m.n}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{m.n}</span>
                      <span className="text-xs text-muted-foreground">{m.r}</span>
                      <span className={`num-mono text-xs ml-auto ${m.alloc >= 100 ? "text-rag-amber" : "text-foreground"}`}>{m.alloc}% allocated</span>
                    </div>
                    <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary/50">
                      <div
                        className={`h-full rounded-full transition-all ${m.alloc >= 100 ? "bg-rag-amber" : "bg-accent"}`}
                        style={{ width: `${Math.min(m.alloc, 100)}%` }}
                      />
                      {m.alloc > 100 && (
                        <div className="absolute right-0 top-0 h-full w-1 rounded-r-full bg-rag-red" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-accent" />Normal</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-rag-amber" />At capacity</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-rag-red" />Over-allocated</span>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="Financials" className="mt-5">
          <FinancialsTab project={project} />
        </TabsContent>

        <TabsContent value="Risks & Issues" className="mt-5">
          <RisksTab project={project} />
        </TabsContent>

        <TabsContent value="Documents" className="mt-5">
          <DocumentsTab />
        </TabsContent>

        <TabsContent value="Status Reports" className="mt-5">
          <StatusReportsTab
            project={project}
            reports={reports}
            setReports={setReports}
            externalOpen={reportOpen}
            onExternalOpenChange={setReportOpen}
            onRagChange={(rag) => { updateProject(project.id, { rag }); addNotification({ tone: rag === "red" ? "red" : rag === "amber" ? "amber" : "green", title: `${project.name} status updated to ${rag === "red" ? "Critical" : rag === "amber" ? "At Risk" : "On Track"}`, time: "Just now" }); }}
          />
        </TabsContent>

        <TabsContent value="Change Requests" className="mt-5">
          <ChangeRequestsTab project={project} />
        </TabsContent>

        <TabsContent value="Procurement" className="mt-5">
          <ProcurementProjectTab projectName={project.name} addRfp={addRfp} />
        </TabsContent>

        <TabsContent value="Business Trips" className="mt-5">
          <BusinessTripsTab pm={project.pm} />
        </TabsContent>

        <TabsContent value="Stakeholders" className="mt-5">
          <StakeholdersTab />
        </TabsContent>

        <TabsContent value="Lessons Learned" className="mt-5">
          <LessonsTab project={project} />
        </TabsContent>
      </Tabs>

      <PlanningProgressDialog open={planningProgressOpen} onOpenChange={setPlanningProgressOpen} />
      <StageGatesDialog open={stageGateOpen} onOpenChange={setStageGateOpen} gateData={gateData} setGateData={setGateData} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div><div className="label-eyebrow">{label}</div><div className="text-foreground">{value}</div></div>;
}

// ── Project Charter tab ───────────────────────────────────────────────────────
function CharterTab({ project }: { project: typeof projects[number] }) {
  const [editMode, setEditMode] = useState(false);
  const [approved, setApproved] = useState(project.stage !== "Initiation");

  const [fields, setFields] = useState({
    objective:   `Deliver ${project.name} on time and within budget, achieving the agreed scope for ${project.client ?? project.department}.`,
    scope:       `In scope: full delivery of ${project.name} across all defined workstreams.\nOut of scope: ongoing operations, post-go-live support beyond 90 days.`,
    sponsor:     "Executive Director, " + project.department,
    pm:          project.pm,
    startDate:   "2026-04-01",
    endDate:     project.endDate,
    budget:      `$${project.budgetTotal.toFixed(1)}M`,
    constraints: "Must comply with procurement policy. Key milestones cannot slip beyond 30 days without board approval.",
    assumptions: "Stakeholder availability confirmed. No major regulatory changes expected during delivery.",
    risks:       `${project.risks} open risks logged in RAID register. Top risk: vendor delivery delay.`,
    successCriteria: "Go-live achieved by target date. User acceptance ≥ 85%. Budget variance < 5%.",
  });

  function patch(key: keyof typeof fields, val: string) {
    setFields((prev) => ({ ...prev, [key]: val }));
  }

  function Field({ label, fieldKey, multiline = false }: { label: string; fieldKey: keyof typeof fields; multiline?: boolean }) {
    return (
      <div className="space-y-1">
        <div className="label-eyebrow">{label}</div>
        {editMode ? (
          multiline
            ? <Textarea value={fields[fieldKey]} onChange={(e) => patch(fieldKey, e.target.value)} className="text-sm min-h-[64px]" rows={3} />
            : <Input value={fields[fieldKey]} onChange={(e) => patch(fieldKey, e.target.value)} className="text-sm" />
        ) : (
          <p className="text-sm text-foreground whitespace-pre-line">{fields[fieldKey]}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="glass-card flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="text-base font-medium text-foreground">Project Charter — {project.name}</h2>
          <p className="text-xs text-muted-foreground">Version 1.0 · {project.department} · {project.businessLine}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            approved
              ? "bg-rag-green/10 text-rag-green border border-rag-green/30"
              : "bg-rag-amber/10 text-rag-amber border border-rag-amber/30"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${approved ? "bg-rag-green" : "bg-rag-amber"}`} />
            {approved ? "Approved" : "Pending Approval"}
          </span>
          {!approved && (
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
              onClick={() => { setApproved(true); toast.success("Charter approved"); }}>
              Approve Charter
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-xs"
            onClick={() => { setEditMode((e) => !e); if (editMode) toast.success("Charter saved"); }}>
            {editMode ? "Save" : "Edit"}
          </Button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Project Purpose</div>
            <Field label="Objective" fieldKey="objective" multiline />
            <Field label="Scope" fieldKey="scope" multiline />
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Success Criteria</div>
            <Field label="Definition of success" fieldKey="successCriteria" multiline />
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Constraints & Assumptions</div>
            <Field label="Constraints" fieldKey="constraints" multiline />
            <Field label="Assumptions" fieldKey="assumptions" multiline />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Project Identity</div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Sponsor" fieldKey="sponsor" />
              <Field label="Project Manager" fieldKey="pm" />
              <Field label="Start Date" fieldKey="startDate" />
              <Field label="End Date" fieldKey="endDate" />
              <Field label="Approved Budget" fieldKey="budget" />
              <div className="space-y-1">
                <div className="label-eyebrow">Client</div>
                <p className="text-sm text-foreground">{project.client ?? "Internal"}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="label-eyebrow text-accent">Risk Summary</div>
            <Field label="Key risks at charter stage" fieldKey="risks" multiline />
          </div>

          <div className="glass-card p-5 space-y-3">
            <div className="label-eyebrow text-accent">Approval Record</div>
            {[
              { role: "Executive Sponsor", name: "Ahmad Al-Farsi", date: approved ? "May 02, 2026" : "—", done: approved },
              { role: "Portfolio Director", name: "Aisha Khoury",  date: approved ? "May 04, 2026" : "—", done: approved },
              { role: "Project Manager",   name: project.pm,       date: approved ? "Apr 29, 2026" : "—", done: true },
              { role: "Finance Manager",   name: "John Smith",     date: approved ? "May 04, 2026" : "—", done: approved },
            ].map((a) => (
              <div key={a.role} className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-foreground">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.role}</div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{a.date}</span>
                  <span className={`h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                    a.done ? "bg-rag-green/10 text-rag-green" : "bg-rag-amber/10 text-rag-amber"
                  }`}>{a.done ? "✓" : "…"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ project }: { project: typeof projects[number] }) {
  const ragMap = {
    green: { label: "On Track", text: "text-rag-green", bg: "bg-rag-green/15", ring: "ring-rag-green/40" },
    amber: { label: "At Risk", text: "text-rag-amber", bg: "bg-rag-amber/15", ring: "ring-rag-amber/40" },
    red: { label: "Critical", text: "text-rag-red", bg: "bg-rag-red/15", ring: "ring-rag-red/40" },
    blue: { label: "Not Started", text: "text-rag-blue", bg: "bg-rag-blue/15", ring: "ring-rag-blue/40" },
    grey: { label: "On Hold", text: "text-muted-foreground", bg: "bg-muted/20", ring: "ring-muted/40" },
  } as const;
  const r = ragMap[project.rag];
  const spentPct = Math.round((project.budgetUsed / project.budgetTotal) * 100);
  const remaining = (project.budgetTotal - project.budgetUsed).toFixed(1);

  const stages = [
    { n: 1, name: "Initiation", done: true },
    { n: 2, name: "Planning", done: true },
    { n: 3, name: "Execution", done: true },
    { n: 4, name: "Monitoring", done: false },
    { n: 5, name: "Closure", done: false },
  ];

  const milestones = [
    { name: "Requirements Sign-off", date: "2026-05-15", rag: "green" as const },
    { name: "Design Review", date: "2026-05-22", rag: "green" as const },
    { name: "UAT Completion", date: "2026-06-01", rag: "amber" as const },
  ];

  const activity = [
    { title: "Status updated to At Risk", who: project.pm, when: "2h ago" },
    { title: "Milestone completed", who: "Sara Mohamed", when: "5h ago" },
    { title: "Budget revised", who: "Finance Team", when: "1d ago" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-4">
        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Project Health</div>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${r.bg} ring-2 ${r.ring}`}>
              <span className={`text-lg ${r.text}`}>✓</span>
            </div>
            <div>
              <div className={`text-base font-medium ${r.text}`}>{r.label}</div>
              <div className="text-xs text-muted-foreground">Last updated: 2 hours ago</div>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Progress:</span>
              <span className="num-mono font-medium text-foreground">{project.progress}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Start Date:</span>
              <span className="num-mono font-medium text-foreground">{(project as any).startDate ?? "2026-01-10"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">End Date:</span>
              <span className="num-mono font-medium text-foreground">{project.endDate}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Stage Gates</div>
          <ul className="space-y-3">
            {stages.map((s) => (
              <li key={s.n} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${s.done ? "bg-accent text-accent-foreground" : "border border-border bg-secondary/40 text-muted-foreground"}`}>
                  {s.done ? <span className="text-sm">✓</span> : <span className="num-mono text-xs">{s.n}</span>}
                </div>
                <span className={`text-sm ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Next Milestones</div>
          <ul className="space-y-3">
            {milestones.map((m) => (
              <li key={m.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${m.rag === "green" ? "bg-rag-green" : "bg-rag-amber"}`} />
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                </div>
                <span className="num-mono text-xs text-muted-foreground">{m.date}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Budget Status</div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className="num-mono font-medium text-foreground">${project.budgetUsed.toFixed(1)}M / ${project.budgetTotal.toFixed(1)}M</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary/50">
            <div className="h-full rounded-full bg-rag-green" style={{ width: `${spentPct}%` }} />
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Remaining: ${remaining}M</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Open RAID Items</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-rag-amber/30 bg-rag-amber/10 p-5 text-center">
              <div className="num-mono text-3xl font-medium text-rag-amber">{project.risks}</div>
              <div className="mt-1 text-xs text-muted-foreground">Risks</div>
            </div>
            <div className="rounded-lg border border-rag-red/30 bg-rag-red/10 p-5 text-center">
              <div className="num-mono text-3xl font-medium text-rag-red">{project.issues}</div>
              <div className="mt-1 text-xs text-muted-foreground">Issues</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="label-eyebrow mb-4">Recent Activity</div>
          <ul className="space-y-3">
            {activity.map((a) => (
              <li key={a.title} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{a.title}</div>
                  <div className="text-xs text-accent">{a.who}</div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{a.when}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Add Team Member dialog ─────────────────────────────────────────────────────
type TeamMemberEntry = { n: string; r: string; a: number; p: string; s: Rag };

function AddTeamMemberDialog({
  open, onOpenChange, onAdd,
}: { open: boolean; onOpenChange: (o: boolean) => void; onAdd: (m: TeamMemberEntry) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [alloc, setAlloc] = useState("50");
  const [period, setPeriod] = useState("");

  function submit() {
    if (!name.trim() || !role.trim()) { toast.error("Name and role are required"); return; }
    onAdd({ n: name.trim(), r: role.trim(), a: parseInt(alloc) || 50, p: period || "TBD", s: "green" });
    onOpenChange(false); setName(""); setRole(""); setAlloc("50"); setPeriod("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Select onValueChange={setName}>
              <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
              <SelectContent>
                {resourcePool.map((r) => (
                  <SelectItem key={r.name} value={r.name}>{r.name} — {r.role}</SelectItem>
                ))}
                <SelectItem value="__custom__">Enter manually…</SelectItem>
              </SelectContent>
            </Select>
            {name === "__custom__" && (
              <Input placeholder="Full name" onChange={(e) => setName(e.target.value)} className="mt-1 bg-secondary/40" />
            )}
          </div>
          <div className="space-y-1">
            <Label>Role on project</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Business Analyst" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Allocation %</Label>
              <Input type="number" min={10} max={100} value={alloc} onChange={(e) => setAlloc(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Period</Label>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. Jun–Sep" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Add Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Request Resource dialog ───────────────────────────────────────────────────
function RequestResourceDialog({
  open, onOpenChange, project, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  project: typeof projects[number];
  onSubmit: (r: Omit<ResourceRequest, "id" | "date" | "status">) => void;
}) {
  const [role, setRole] = useState("");
  const [skill, setSkill] = useState<"Junior" | "Mid" | "Senior" | "Lead">("Mid");
  const [fte, setFte] = useState("1.0");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [priority, setPriority] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
  const [notes, setNotes] = useState("");

  function submit() {
    if (!role.trim() || !from || !until) { toast.error("Role and dates are required"); return; }
    onSubmit({ project: project.name, role: role.trim(), skill, fte: parseFloat(fte) || 1, from, until, priority, submittedBy: project.pm, notes });
    onOpenChange(false); setRole(""); setSkill("Mid"); setFte("1.0"); setFrom(""); setUntil(""); setPriority("Medium"); setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Request Resource</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Role / Skill needed</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Data Engineer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Skill level</Label>
              <Select value={skill} onValueChange={(v) => setSkill(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Junior", "Mid", "Senior", "Lead"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>FTE</Label>
              <Input type="number" min={0.5} max={3} step={0.5} value={fte} onChange={(e) => setFte(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>From (yyyy-mm)</Label>
              <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="2026-07" />
            </div>
            <div className="space-y-1">
              <Label>Until (yyyy-mm)</Label>
              <Input value={until} onChange={(e) => setUntil(e.target.value)} placeholder="2026-09" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Critical", "High", "Medium", "Low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requirements…" className="text-sm" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Submit Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TenderStatus = "Draft" | "Sent for Tendering" | "Proposals Received" | "Awarded" | "Cancelled";
type TenderProposal = { vendor: string; score: number; value: string };
type TenderPackage = {
  id: string; scope: string; est: string; status: TenderStatus;
  rfp?: string; issued?: string; closes?: string;
  proposals?: TenderProposal[];
  vendor?: string; contract?: string; awarded?: string;
};

const SEED_PACKAGES: TenderPackage[] = [
  { id: "PKG-001", scope: "Integration partner services", est: "$680K", status: "Awarded", rfp: "RFP-014", vendor: "Siemens MENA", contract: "CT-2026-038", awarded: "May 12" },
  { id: "PKG-002", scope: "Cybersecurity audit & pen-test", est: "$140K", status: "Proposals Received", rfp: "RFP-015", proposals: [
    { vendor: "CyberShield Arabia", score: 88, value: "$135K" },
    { vendor: "SecureIT MENA", score: 74, value: "$142K" },
  ]},
  { id: "PKG-003", scope: "Training services rollout", est: "$95K", status: "Sent for Tendering", rfp: "RFP-016", issued: "Jun 01", closes: "Jun 28" },
  { id: "PKG-004", scope: "Managed support (1 year)", est: "$285K", status: "Draft" },
];

// ── Planning Progress dialog (shown when Progress KPI is clicked) ────────────
function PlanningProgressDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const doneCount = PLANNING_CHECKLIST.filter((c) => c.done).length;
  const pct = Math.round((doneCount / PLANNING_CHECKLIST.length) * 100);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Planning Progress</DialogTitle></DialogHeader>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            {doneCount} / {PLANNING_CHECKLIST.length} complete
          </div>
          <div className="text-sm text-accent">{pct}%</div>
        </div>
        <div className="mt-2 grid gap-x-8 gap-y-3 md:grid-cols-2">
          {PLANNING_CHECKLIST.map((c) => (
            <div key={c.label} className="flex items-center gap-2.5">
              {c.done ? (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent text-[11px] text-accent-foreground">✓</div>
              ) : (
                <div className="h-5 w-5 shrink-0 rounded border border-border bg-secondary/40" />
              )}
              <span className={`text-sm ${c.done ? "text-foreground" : "text-muted-foreground"}`}>{c.label}</span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Business Trips tab ───────────────────────────────────────────────────────
function BusinessTripsTab({ pm }: { pm: string }) {
  const [trips, setTrips] = useState<Trip[]>([
    { id: "T-01", purpose: "Site survey", dest: "Dubai, UAE", dates: "Jun 12 – Jun 15", travelers: "Sara, Mei", cost: "$5.2K", rag: "green", status: "Completed" },
    { id: "T-02", purpose: "Vendor workshop", dest: "Munich, DE", dates: "Jul 08 – Jul 11", travelers: "K. Bauer", cost: "$3.0K", rag: "green", status: "Completed" },
    { id: "T-03", purpose: "User training", dest: "Riyadh, KSA", dates: "Aug 18 – Aug 22", travelers: "H. Tanaka, Priya, +2", cost: "$9.8K", rag: "amber", status: "Booked" },
    { id: "T-04", purpose: "Go-live support", dest: "Doha, QA", dates: "Sep 14 – Sep 28", travelers: "John, Mei, +2", cost: "$6.5K", rag: "blue", status: "Planned" },
  ]);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { l: "Trips Planned", v: String(trips.length) },
          { l: "Travelers", v: "9" },
          { l: "Total Budget", v: "$24.5K" },
          { l: "Spent", v: "$8.2K", c: "text-rag-green" },
        ].map((k) => (
          <div key={k.l} className="glass-card p-4">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">Trips</div>
        <LogTripDialog
          teamMembers={[pm, "Mei Chen", "Priya Iyer", "Diego Ortiz", "K. Bauer", "H. Tanaka"]}
          onAdd={(t) => setTrips((prev) => [...prev, { ...t, id: `T-${String(prev.length + 1).padStart(2, "0")}` }])}
        />
      </div>
      <div className="">
        <Table>
          <TableHeader><TableRow><TableHead>Trip</TableHead><TableHead>Purpose</TableHead><TableHead>Destination</TableHead><TableHead>Dates</TableHead><TableHead>Travelers</TableHead><TableHead>Cost</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{trips.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium text-foreground">{r.id}</TableCell>
              <TableCell>{r.purpose}</TableCell>
              <TableCell>{r.dest}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{r.dates}</TableCell>
              <TableCell className="text-xs">{r.travelers}</TableCell>
              <TableCell className="num-mono">{r.cost}</TableCell>
              <TableCell><RagBadge rag={r.rag} label={r.status} /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Financials tab (includes Financial Planning content) ─────────────────────
function FinancialsTab({ project }: { project: typeof projects[number] }) {
  const [costEntries, setCostEntries] = useState<CostEntry[]>([
    { c: "Labour",            b: 1.20, a: 0.84, color: "bg-rag-green" },
    { c: "Hardware",          b: 0.90, a: 0.62, color: "bg-rag-blue" },
    { c: "Software licenses", b: 0.40, a: 0.31, color: "bg-accent" },
    { c: "Business trips",    b: 0.10, a: 0.07, color: "bg-rag-amber" },
    { c: "Contingency",       b: 0.60, a: 0.26, color: "bg-muted-foreground" },
  ]);
  const [revEntries, setRevEntries] = useState<RevEntry[]>([
    { ms: "Discovery complete", evt: "Advance payment (30%)",  plan: 0.96, date: "May 02",        s: "green", sl: "Received", act: 0.96 },
    { ms: "Build phase 1",      evt: "Progress invoice (20%)", plan: 0.64, date: "Jun 30",        s: "amber", sl: "Pending",  act: null },
    { ms: "UAT Sign-off",       evt: "Progress invoice (25%)", plan: 0.80, date: project.endDate, s: "blue",  sl: "Planned",  act: null },
    { ms: "Go-live",            evt: "Final payment (25%)",    plan: 0.80, date: "Sep 14",        s: "blue",  sl: "Planned",  act: null },
  ]);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { l: "Total Budget", v: `$${project.budgetTotal.toFixed(1)}M` },
          { l: "Spent", v: `$${project.budgetUsed.toFixed(2)}M` },
          { l: "Committed", v: "$1.12M", c: "text-rag-amber" },
          { l: "Forecast EAC", v: `$${(project.budgetTotal * 1.04).toFixed(2)}M`, c: "text-rag-amber" },
        ].map((k) => (
          <div key={k.l} className="glass-card p-4">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_360px]">
        <div className="glass-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="label-eyebrow">Cost categories</div>
            <AddCostDialog onAdd={(e) => setCostEntries((prev) => [...prev, e])} />
          </div>
          <div className="space-y-3">
            {costEntries.map((r) => {
              const pct = Math.round((r.a / r.b) * 100);
              return (
                <div key={r.c}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-foreground">{r.c}</span>
                    <span className="num-mono text-xs text-muted-foreground">${r.a.toFixed(2)}M / ${r.b.toFixed(2)}M</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
                    <div className={`h-full ${r.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="label-eyebrow mb-3">Quarterly cash plan</div>
          <ul className="space-y-3 text-sm">
            {[
              { q: "Q1 2026", v: "$0.45M", s: "green", sl: "Released" },
              { q: "Q2 2026", v: "$1.05M", s: "green", sl: "Released" },
              { q: "Q3 2026", v: "$1.20M", s: "amber", sl: "Pending" },
              { q: "Q4 2026", v: "$0.50M", s: "blue", sl: "Planned" },
            ].map((q) => (
              <li key={q.q} className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
                <div>
                  <div className="text-foreground">{q.q}</div>
                  <div className="num-mono text-xs text-muted-foreground">{q.v}</div>
                </div>
                <RagBadge rag={q.s as any} label={q.sl} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="label-eyebrow">Revenue plan — linked to milestones</div>
          <div className="flex items-center gap-3">
            <span className="num-mono text-xs text-muted-foreground">
              Total planned: ${revEntries.reduce((s, r) => s + r.plan, 0).toFixed(2)}M
            </span>
            <AddRevenueDialog onAdd={(e) => setRevEntries((prev) => [...prev, e])} />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Milestone</TableHead>
              <TableHead>Revenue event</TableHead>
              <TableHead className="text-right">Planned ($M)</TableHead>
              <TableHead>Expected date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actual ($M)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revEntries.map((r) => (
              <TableRow key={r.ms}>
                <TableCell className="font-medium text-foreground">{r.ms}</TableCell>
                <TableCell className="text-muted-foreground">{r.evt}</TableCell>
                <TableCell className="num-mono text-right">${r.plan.toFixed(2)}M</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.date}</TableCell>
                <TableCell><RagBadge rag={r.s as any} label={r.sl} /></TableCell>
                <TableCell className="num-mono text-right">{r.act != null ? `$${r.act.toFixed(2)}M` : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


function RequestResourcesDialog({ projectName }: { projectName: string }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("");
  const [skill, setSkill] = useState("");
  const [fte, setFte] = useState("1.0");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [priority, setPriority] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    if (!role || !skill || !priority) { toast.error("Please fill in role, skill level, and priority"); return; }
    toast.success(`Resource request submitted to Resource Manager`, {
      description: `${fte} FTE ${skill} ${role} for ${projectName}`,
    });
    setOpen(false);
    setRole(""); setSkill(""); setFte("1.0"); setFrom(""); setUntil(""); setPriority(""); setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />Request Resources
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Resources</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border border-accent/20 bg-accent-dim/30 px-3 py-2 text-xs text-accent">
          Project: <span className="font-medium">{projectName}</span>
          <span className="ml-2 text-muted-foreground">· Request will be sent to the Resource Manager</span>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label>Role needed</Label>
              <Input
                placeholder="e.g. Solution Architect"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div>
              <Label>Skill level</Label>
              <Select onValueChange={setSkill}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Mid">Mid</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>FTE required</Label>
              <Input
                type="number" min={0.5} max={5} step={0.5}
                value={fte}
                onChange={(e) => setFte(e.target.value)}
              />
            </div>
            <div>
              <Label>From</Label>
              <Input type="month" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label>Until</Label>
              <Input type="month" value={until} onChange={(e) => setUntil(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Priority</Label>
              <Select onValueChange={setPriority}>
                <SelectTrigger><SelectValue placeholder="Select priority…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">Critical — blocks project</SelectItem>
                  <SelectItem value="High">High — needed within 2 weeks</SelectItem>
                  <SelectItem value="Medium">Medium — within a month</SelectItem>
                  <SelectItem value="Low">Low — planning ahead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Specific skills, certifications, or context…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSubmit}>
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



// ── v11 Types ─────────────────────────────────────────────────────────────────
type ItemKind = "Milestone" | "Task";
type MilestoneType = "start" | "finish";
type RoleReq = { role: string; skill: "Junior" | "Mid" | "Senior" | "Lead"; fte: number };
type PaymentLinkKind = "None" | "Client Revenue" | "Package Cost";
type PaymentLink = { kind: PaymentLinkKind; amount: string; packageId?: string };
type Milestone = {
  name: string; kind: ItemKind; startDate: string; endDate: string;
  owner: string; rag: Rag; dep: string; roles: RoleReq[];
  payment?: PaymentLink; progress?: number; parent?: string;
  assignee?: string;
  lagDays?: number;              // milestone only — buffer added after last child
  milestoneType?: MilestoneType; // milestone only — "start" | "finish" (visual)
  durationValue?: number;        // task only
  durationUnit?: "hours" | "days"; // task only
  isParallel?: boolean;          // task only — excluded from activity sum
  resourceRequestIds?: string[]; // task only — fulfilled requests set assignee
  weightScore?: number;          // task only — relative weight (1-10) for parent rollup
};

type Trip = { id: string; purpose: string; dest: string; dates: string; travelers: string; cost: string; rag: Rag; status: string };
type CostEntry = { c: string; b: number; a: number; color: string };
type RevEntry = { ms: string; evt: string; plan: number; date: string; s: string; sl: string; act: number | null };
type GateItem = { task: string; role: string; done: boolean };
type GateStage = { name: string; items: GateItem[] };
type RaidItem = { id: string; title: string; kind: "Risk" | "Issue"; score: number; owner: string; status: string; rag: Rag };
type DocItem = { name: string; category: string; size: string; when: string };
type StatusReport = { week: number; by: string; when: string; rag: Rag; text: string };
type ChangeReq = { id: string; title: string; impact: string; timeline: string; budget: string; decision: "Under review" | "Approved" | "Rejected" };
type Stakeholder = { name: string; org: string; influence: "High" | "Medium" | "Low"; interest: "High" | "Medium" | "Low"; strategy: string };
type Lesson = { tag: string; text: string; by: string; when: string };

// ── Derivation: end dates / durations / assignees ────────────────────────────
function addDaysISO(iso: string, n: number) {
  if (!iso) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
function maxISO(arr: (string | undefined)[]): string | undefined {
  const v = arr.filter(Boolean) as string[];
  if (!v.length) return undefined;
  return v.slice().sort().pop();
}
function minISO(arr: (string | undefined)[]): string | undefined {
  const v = arr.filter(Boolean) as string[];
  if (!v.length) return undefined;
  return v.slice().sort()[0];
}
function computeDerivedSchedule(items: Milestone[], reqs: ResourceRequest[]): Milestone[] {
  const out = items.map((it) => ({ ...it }));
  const childrenOf = new Map<string, Milestone[]>();
  for (const it of out) {
    if (!it.parent) continue;
    if (!childrenOf.has(it.parent)) childrenOf.set(it.parent, []);
    childrenOf.get(it.parent)!.push(it);
  }

  // Task leaves: derive endDate from duration; assignee from fulfilled requests or "Waiting"
  for (const it of out) {
    if (it.kind !== "Task") continue;
    const hasKids = (childrenOf.get(it.name)?.length ?? 0) > 0;
    if (!hasKids && it.durationValue && it.startDate) {
      const days = it.durationUnit === "hours"
        ? Math.max(1, Math.ceil(it.durationValue / 8))
        : Math.max(1, it.durationValue);
      it.endDate = addDaysISO(it.startDate, days - 1);
    }
    if (it.resourceRequestIds?.length) {
      const linked = it.resourceRequestIds
        .map((id) => reqs.find((r) => r.id === id))
        .filter(Boolean) as ResourceRequest[];
      const fulfilled = linked
        .filter((r) => r.status === "Fulfilled" && r.assignedTo)
        .map((r) => r.assignedTo!) as string[];
      if (fulfilled.length) it.assignee = Array.from(new Set(fulfilled)).join(", ");
      else if (linked.length) it.assignee = "Waiting";
    }
  }

  // Recursive rollup: parent dates and progress derived from children (any depth).
  const byName = new Map(out.map((it) => [it.name, it] as const));
  const visiting = new Set<string>();

  function rollup(name: string): { start?: string; end?: string; progress: number } {
    const it = byName.get(name)!;
    const kids = childrenOf.get(name) ?? [];
    if (!kids.length) {
      return { start: it.startDate, end: it.endDate, progress: it.progress ?? 0 };
    }
    if (visiting.has(name)) return { start: it.startDate, end: it.endDate, progress: it.progress ?? 0 };
    visiting.add(name);

    let totalW = 0; let weighted = 0;
    let minS: string | undefined; let maxE: string | undefined;
    for (const c of kids) {
      const r = rollup(c.name);
      const w = c.kind === "Task" ? Math.max(0, c.weightScore ?? 1) : 0; // milestones don't add weight
      if (w > 0) { totalW += w; weighted += w * r.progress; }
      if (r.start && (!minS || r.start < minS)) minS = r.start;
      if (r.end && (!maxE || r.end > maxE)) maxE = r.end;
    }
    visiting.delete(name);

    const prog = totalW > 0 ? Math.round(weighted / totalW) : (it.progress ?? 0);
    if (it.kind === "Task") {
      if (minS) it.startDate = minS;
      if (maxE) it.endDate = maxE;
      it.progress = prog;
    } else if (it.kind === "Milestone") {
      // Milestone is a diamond: keep stored end (or roll up to last child + lag); start = end.
      if (maxE) {
        const withLag = addDaysISO(maxE, it.lagDays ?? 0);
        if (!it.endDate || withLag > it.endDate) it.endDate = withLag;
      }
      if (it.endDate) it.startDate = it.endDate;
      it.progress = prog;
    }
    return { start: it.startDate, end: it.endDate, progress: prog };
  }

  // Roll up from all root items (recursion covers descendants).
  const allNames = new Set(out.map((i) => i.name));
  const roots = out.filter((i) => !i.parent || !allNames.has(i.parent));
  for (const r of roots) rollup(r.name);

  return out;
}

// ── Add Milestone / Task dialog ──────────────────────────────────────────────
function AddMilestoneDialog({
  defaultOwner, packages, items, projectName, addResourceRequest, onAdd, onUpdateExisting,
  open: controlledOpen, onOpenChange, hideTrigger, initialParent, initialKind, editingItem,
}: {
  defaultOwner: string;
  packages: TenderPackage[];
  items: Milestone[];
  projectName: string;
  addResourceRequest: (r: Omit<ResourceRequest, "id" | "date" | "status">) => string;
  onAdd: (m: Milestone[]) => void;
  onUpdateExisting: (name: string, patch: Partial<Milestone>) => void;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  hideTrigger?: boolean;
  initialParent?: string;
  initialKind?: ItemKind;
  editingItem?: Milestone | null;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? !!controlledOpen : internalOpen;
  const setOpen = (o: boolean) => {
    if (!isControlled) setInternalOpen(o);
    onOpenChange?.(o);
  };
  const isEditing = !!editingItem;
  const [kind, setKind] = useState<ItemKind>("Task");
  const [name, setName] = useState("");
  const [owner, setOwner] = useState(defaultOwner);
  const [status, setStatus] = useState("Not Started");
  const [dep, setDep] = useState("");

  // Milestone-specific
  const [endDate, setEndDate] = useState("");
  const [lagDays, setLagDays] = useState<number>(0);
  const [milestoneType, setMilestoneType] = useState<MilestoneType>("finish");

  // Task-specific
  const [parentName, setParentName] = useState<string>("__none__");
  const [startDate, setStartDate] = useState("");
  const [endMode, setEndMode] = useState<"date" | "duration">("duration");
  const [taskEndDate, setTaskEndDate] = useState("");
  const [durationValue, setDurationValue] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<"hours" | "days">("days");
  const [weightScore, setWeightScore] = useState<number>(1);

  // Single skill (one task = one assignee) + payment (shared)
  const [skillRole, setSkillRole] = useState<RoleReq>({ role: "", skill: "Mid", fte: 1 });
  const [payKind, setPayKind] = useState<PaymentLinkKind>("None");
  const [payAmount, setPayAmount] = useState("");
  const [payPackage, setPayPackage] = useState<string>("");

  const ragMap: Record<string, Rag> = { "Not Started": "blue", "In Progress": "amber", Completed: "green", Overdue: "red" };
  const ragToStatus: Record<Rag, string> = { blue: "Not Started", amber: "In Progress", green: "Completed", red: "Overdue", grey: "Not Started" };
  const roleSuggestions = ["Solution Architect", "Business Analyst", "Integration Dev", "QA Engineer", "Security Reviewer", "Change Manager", "Project Manager", "Data Engineer"];

  // Parent options: every milestone and every task can be a parent (unlimited nesting).
  // Exclude self and its descendants when editing.
  const parentOptions = useMemo(() => {
    const excluded = new Set<string>();
    if (editingItem) {
      const collect = (n: string) => {
        excluded.add(n);
        for (const it of items) if (it.parent === n) collect(it.name);
      };
      collect(editingItem.name);
    }
    return items.filter((i) => (i.kind === "Milestone" || i.kind === "Task") && !excluded.has(i.name));
  }, [items, editingItem]);

  function reset() {
    setKind(initialKind ?? "Task"); setName(""); setOwner(defaultOwner); setStatus("Not Started"); setDep("");
    setEndDate(""); setLagDays(0); setMilestoneType("finish");
    setParentName(initialParent ?? "__none__"); setStartDate(""); setEndMode("duration"); setTaskEndDate("");
    setDurationValue(1); setDurationUnit("days"); setWeightScore(1);
    setSkillRole({ role: "", skill: "Mid", fte: 1 });
    setPayKind("None"); setPayAmount(""); setPayPackage("");
  }

  // Prefill when the dialog opens (edit mode or subtask presets)
  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      setKind(editingItem.kind);
      setName(editingItem.name);
      setOwner(editingItem.owner || defaultOwner);
      setStatus(ragToStatus[editingItem.rag] ?? "Not Started");
      setDep(editingItem.dep || "");
      setMilestoneType(editingItem.milestoneType ?? "finish");
      setLagDays(editingItem.lagDays ?? 0);
      setEndDate(editingItem.endDate || "");
      setParentName(editingItem.parent ?? "__none__");
      setStartDate(editingItem.startDate || "");
      setTaskEndDate(editingItem.endDate || "");
      if (editingItem.durationValue && editingItem.durationUnit) {
        setEndMode("duration");
        setDurationValue(editingItem.durationValue);
        setDurationUnit(editingItem.durationUnit);
      } else {
        setEndMode("date");
      }
      setWeightScore(editingItem.weightScore ?? 1);
      const r = editingItem.roles?.[0];
      setSkillRole(r ? { role: r.role, skill: r.skill, fte: r.fte } : { role: "", skill: "Mid", fte: 1 });
      const p = editingItem.payment;
      setPayKind(p?.kind ?? "None");
      setPayAmount(p?.amount ?? "");
      setPayPackage(p?.packageId ?? "");
    } else {
      setKind(initialKind ?? "Task");
      setParentName(initialParent ?? "__none__");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingItem?.name, initialParent, initialKind]);

  function buildPayment(): PaymentLink {
    if (payKind === "None") return { kind: "None", amount: "" };
    if (payKind === "Client Revenue") return { kind: "Client Revenue", amount: payAmount.trim() };
    return { kind: "Package Cost", packageId: payPackage, amount: payAmount.trim() };
  }

  function submit() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    const rag = ragMap[status] ?? "blue";
    const newItems: Milestone[] = [];

    if (kind === "Milestone") {
      if (!endDate) { toast.error("End date is required"); return; }
      newItems.push({
        name: name.trim(), kind: "Milestone",
        startDate: endDate, endDate, owner: owner || defaultOwner, rag, dep,
        roles: [], payment: buildPayment(), progress: 0,
        lagDays: Number(lagDays) || 0,
        milestoneType,
      });
    }

    if (kind === "Task") {
      if (!startDate) { toast.error("Start date is required"); return; }
      let computedEnd: string;
      let durVal: number | undefined;
      let durUnit: "hours" | "days" | undefined;
      if (endMode === "date") {
        if (!taskEndDate) { toast.error("End date is required"); return; }
        if (taskEndDate < startDate) { toast.error("End date must be on/after start date"); return; }
        computedEnd = taskEndDate;
      } else {
        if (!durationValue || durationValue <= 0) { toast.error("Duration must be > 0"); return; }
        const days = durationUnit === "hours"
          ? Math.max(1, Math.ceil(Number(durationValue) / 8))
          : Math.max(1, Number(durationValue));
        computedEnd = addDaysISO(startDate, days - 1);
        durVal = Number(durationValue);
        durUnit = durationUnit;
      }
      const parent = parentName === "__none__" ? undefined : parentName;

      // One task = one skill = at most one resource request
      const requestIds: string[] = [];
      const fromMonth = startDate.slice(0, 7);
      const normalizedRole = skillRole.role.trim();
      const taskRoles: RoleReq[] = normalizedRole
        ? [{ role: normalizedRole, skill: skillRole.skill, fte: Number(skillRole.fte) || 0 }]
        : [];
      if (normalizedRole) {
        const id = addResourceRequest({
          project: projectName,
          role: normalizedRole,
          skill: skillRole.skill,
          fte: Number(skillRole.fte) || 0,
          from: fromMonth,
          until: fromMonth,
          priority: "Medium",
          submittedBy: owner || defaultOwner,
          notes: `Auto-requested for task "${name.trim()}"`,
        });
        requestIds.push(id);
      }

      newItems.push({
        name: name.trim(), kind: "Task",
        startDate, endDate: computedEnd, owner: owner || defaultOwner, rag, dep,
        roles: taskRoles, payment: buildPayment(), progress: 0, parent,
        durationValue: durVal, durationUnit: durUnit,
        weightScore: Math.max(1, Math.min(10, Number(weightScore) || 1)),
        resourceRequestIds: requestIds.length ? requestIds : undefined,
      });

      if (requestIds.length) {
        toast.success("Resource request sent");
      }
    }


    if (isEditing && editingItem) {
      const patch = newItems[0];
      // Drop fields that don't apply to the original kind switch (keep computed)
      onUpdateExisting(editingItem.name, patch);
      toast.success(`${kind} updated`);
    } else {
      onAdd(newItems);
      toast.success(`${kind} added`);
    }
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Add Item</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEditing ? `Edit ${kind}` : `Add ${kind}`}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as ItemKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Milestone">Milestone</SelectItem>
                <SelectItem value="Task">Task</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. UAT Sign-off" /></div>

          {/* MILESTONE: subtype + end date + lag */}
          {kind === "Milestone" && (
            <>
              <div>
                <Label>Milestone type</Label>
                <Select value={milestoneType} onValueChange={(v) => setMilestoneType(v as MilestoneType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Start milestone</SelectItem>
                    <SelectItem value="finish">Finish milestone</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[10px] text-muted-foreground">Progress is rolled up automatically from child tasks (weighted by score).</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                <div>
                  <Label>Lag (days)</Label>
                  <Input type="number" min="0" value={lagDays} onChange={(e) => setLagDays(Number(e.target.value))} />
                  <p className="mt-1 text-[10px] text-muted-foreground">Buffer after the last child ends.</p>
                </div>
              </div>
            </>
          )}

          {/* TASK: parent (any milestone or task) + start + (end date | duration) + weight */}
          {kind === "Task" && (
            <>
              <div>
                <Label>Parent <span className="text-muted-foreground">(milestone or task — leave none for top level)</span></Label>
                <Select value={parentName} onValueChange={setParentName}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none__">— None (top level) —</SelectItem>
                    {parentOptions.filter((p) => p.kind === "Milestone").length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">Milestones</div>
                        {parentOptions.filter((p) => p.kind === "Milestone").map((m) => (
                          <SelectItem key={`ms-${m.name}`} value={m.name}>◆ {m.name}</SelectItem>
                        ))}
                      </>
                    )}
                    {parentOptions.filter((p) => p.kind === "Task").length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">Tasks</div>
                        {parentOptions.filter((p) => p.kind === "Task").map((t) => (
                          <SelectItem key={`tk-${t.name}`} value={t.name}>{t.name}</SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Start date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div>
                <Label>End</Label>
                <ToggleGroup type="single" value={endMode} onValueChange={(v) => v && setEndMode(v as "date" | "duration")} className="justify-start">
                  <ToggleGroupItem value="date" className="h-8 px-3 text-xs">End date</ToggleGroupItem>
                  <ToggleGroupItem value="duration" className="h-8 px-3 text-xs">Duration</ToggleGroupItem>
                </ToggleGroup>
                {endMode === "date" ? (
                  <Input className="mt-2" type="date" value={taskEndDate} onChange={(e) => setTaskEndDate(e.target.value)} />
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input type="number" min="0" step="0.5" value={durationValue} onChange={(e) => setDurationValue(Number(e.target.value))} placeholder="Duration" />
                    <Select value={durationUnit} onValueChange={(v) => setDurationUnit(v as "hours" | "days")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {endMode === "duration"
                    ? "End date is calculated from start + duration."
                    : "Duration is calculated from start → end."}
                </p>
              </div>

              <div>
                <Label>Weight score (1–10)</Label>
                <Input type="number" min={1} max={10} step={1} value={weightScore} onChange={(e) => setWeightScore(Number(e.target.value))} />
                <p className="mt-1 text-[10px] text-muted-foreground">Relative weight inside its parent. Parent progress = Σ(child weight × child %) ÷ Σ(weights).</p>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div><Label>Owner</Label><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Depends on</Label><Input value={dep} onChange={(e) => setDep(e.target.value)} placeholder="—" /></div>

          {kind === "Task" && (
            <div className="rounded-md border border-border p-3 space-y-2">
              <Label className="text-sm">Payment link</Label>
              <p className="text-xs text-muted-foreground">Connect this task to a client revenue event or a working-package (contract) payment milestone.</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={payKind} onValueChange={(v) => setPayKind(v as PaymentLinkKind)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Client Revenue">Client revenue (main client)</SelectItem>
                      <SelectItem value="Package Cost">Working package cost (contract payment)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {payKind !== "None" && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <Input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="e.g. $120K" />
                  </div>
                )}
              </div>
              {payKind === "Package Cost" && (
                <div>
                  <Label className="text-xs text-muted-foreground">Working package</Label>
                  <Select value={payPackage} onValueChange={setPayPackage}>
                    <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                    <SelectContent>
                      {packages.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.id} · {p.scope} ({p.est})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {kind === "Task" && (
            <div className="rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-sm">Skill required</Label>
                <span className="text-xs text-muted-foreground">One task · one assignee</span>
              </div>
              <div className="grid grid-cols-[1fr_110px_80px] gap-2 items-end">
                <div>
                  <Label className="text-xs text-muted-foreground">Skill / Role</Label>
                  <Input list="role-suggestions" value={skillRole.role} onChange={(e) => setSkillRole((d) => ({ ...d, role: e.target.value }))} placeholder="e.g. QA Engineer" />
                  <datalist id="role-suggestions">{roleSuggestions.map((r) => <option key={r} value={r} />)}</datalist>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Level</Label>
                  <Select value={skillRole.skill} onValueChange={(v) => setSkillRole((d) => ({ ...d, skill: v as RoleReq["skill"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Mid">Mid</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">FTE</Label>
                  <Input type="number" min="0" step="0.5" value={skillRole.fte} onChange={(e) => setSkillRole((d) => ({ ...d, fte: Number(e.target.value) }))} />
                </div>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">Leave the role blank to skip the resource request. Assignee fills automatically once the request is fulfilled in Resources.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>{isEditing ? `Save ${kind}` : `Add ${kind}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ── Log Trip dialog ───────────────────────────────────────────────────────────
function LogTripDialog({ onAdd, teamMembers }: { onAdd: (t: Omit<Trip, "id">) => void; teamMembers: string[] }) {
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState(""); const [dest, setDest] = useState("");
  const [dates, setDates] = useState(""); const [cost, setCost] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(name: string) {
    setSelected((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  }
  function submit() {
    if (!purpose.trim() || !dest.trim()) { toast.error("Purpose and destination are required"); return; }
    const travelers = selected.length > 0 ? selected.join(", ") : "—";
    onAdd({ purpose: purpose.trim(), dest: dest.trim(), dates: dates || "TBD", travelers, cost: cost || "TBD", rag: "blue", status: "Planned" });
    toast.success("Business trip logged");
    setOpen(false); setPurpose(""); setDest(""); setDates(""); setCost(""); setSelected([]);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Log Trip</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Log Business Trip</DialogTitle></DialogHeader>
        <div className="rounded-md border border-accent/20 bg-accent-dim/30 px-3 py-2 text-xs text-accent">Status defaults to Planned</div>
        <div className="grid gap-3">
          <div><Label>Purpose</Label><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Vendor workshop" /></div>
          <div><Label>Destination</Label><Input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="e.g. Munich, DE" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Dates</Label><Input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="Jul 08 – Jul 11" /></div>
            <div><Label>Est. Cost</Label><Input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="$3.0K" /></div>
          </div>
          <div>
            <Label>Travelers</Label>
            {selected.length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1 mt-1">
                {selected.map((n) => (
                  <span key={n} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/40 px-2 py-0.5 text-xs text-accent">
                    {n}
                    <button onClick={() => toggle(n)} className="hover:text-foreground">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-1.5 space-y-2 rounded-md border border-border bg-background/40 p-3">
              {teamMembers.map((name) => (
                <div key={name} className="flex items-center gap-2">
                  <Checkbox id={`tr-${name}`} checked={selected.includes(name)} onCheckedChange={() => toggle(name)} />
                  <label htmlFor={`tr-${name}`} className="cursor-pointer text-sm text-foreground">{name}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Log Trip</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Risks & Issues tab ────────────────────────────────────────────────────────
function RisksTab({ project }: { project: typeof projects[number] }) {
  const [items, setItems] = useState<RaidItem[]>([
    { id: "R-091", title: "Vendor delivery delay > 4 weeks", kind: "Risk", score: 20, owner: project.pm, status: "Open", rag: "red" },
    { id: "I-044", title: "Test env outage", kind: "Issue", score: 12, owner: "Mei Chen", status: "In progress", rag: "amber" },
    { id: "R-085", title: "Risk: Audit finding remediation overrun", kind: "Risk", score: 16, owner: "Mei Chen", status: "Open", rag: "amber" },
  ]);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"Risk" | "Issue">("Risk");
  const [title, setTitle] = useState("");
  const [prob, setProb] = useState(3); const [impact, setImpact] = useState(3);
  const [owner, setOwner] = useState(project.pm);
  const [status, setStatus] = useState("Open");
  const score = prob * impact;
  const statusRag: Record<string, Rag> = { Open: "red", "In progress": "amber", Mitigated: "blue", Closed: "green" };

  function submit() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const prefix = kind === "Risk" ? "R" : "I";
    const num = items.filter((i) => i.kind === kind).length + 1;
    const id = `${prefix}-${String(100 + num).padStart(3, "0")}`;
    const rag: Rag = score >= 16 ? "red" : score >= 9 ? "amber" : "green";
    setItems((prev) => [...prev, { id, title: title.trim(), kind, score, owner, status, rag: statusRag[status] ?? rag }]);
    toast.success(`${kind} ${id} logged`);
    setOpen(false); setTitle(""); setProb(3); setImpact(3); setStatus("Open");
  }

  const kpis = [
    { l: "Open Risks", v: items.filter((i) => i.kind === "Risk" && i.status === "Open").length, c: "text-rag-amber" },
    { l: "Open Issues", v: items.filter((i) => i.kind === "Issue" && i.status === "Open").length, c: "text-rag-red" },
    { l: "In Progress", v: items.filter((i) => i.status === "In progress").length, c: "text-accent" },
    { l: "Closed", v: items.filter((i) => i.status === "Closed").length, c: "text-rag-green" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.l} className="glass-card p-4">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c}`}>{k.v}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">RAID register</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <AlertTriangle className="mr-1 h-4 w-4" />Log Risk / Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Log Risk / Issue</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Type</Label>
                  <Select value={kind} onValueChange={(v) => setKind(v as "Risk" | "Issue")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Risk">Risk</SelectItem>
                      <SelectItem value="Issue">Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In progress">In progress</SelectItem>
                      <SelectItem value="Mitigated">Mitigated</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Describe the risk or issue" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Probability (1–5)</Label>
                  <Select value={String(prob)} onValueChange={(v) => setProb(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Impact (1–5)</Label>
                  <Select value={String(impact)} onValueChange={(v) => setImpact(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className={`rounded-md border px-3 py-2 text-xs num-mono ${
                score >= 16 ? "border-rag-red/30 bg-rag-red/10 text-rag-red" :
                score >= 9 ? "border-rag-amber/30 bg-rag-amber/10 text-rag-amber" :
                "border-rag-green/30 bg-rag-green/10 text-rag-green"
              }`}>Risk score: {score}</div>
              <div><Label>Owner</Label><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Log {kind}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Score</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{items.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="num-mono text-xs">{r.id}</TableCell>
              <TableCell className="font-medium">{r.title}</TableCell>
              <TableCell>{r.kind}</TableCell>
              <TableCell><Badge variant="outline" className="border-border bg-secondary/40 num-mono">{r.score}</Badge></TableCell>
              <TableCell>{r.owner}</TableCell>
              <TableCell><RagBadge rag={r.rag} label={r.status} /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Documents tab ─────────────────────────────────────────────────────────────
function DocumentsTab() {
  const [docs, setDocs] = useState<DocItem[]>([
    { name: "Project Charter v3.pdf", category: "Charter", size: "2.4 MB", when: "May 10" },
    { name: "Risk Register.xlsx", category: "RAID", size: "0.8 MB", when: "May 12" },
    { name: "Vendor Contract — Oracle Consulting.pdf", category: "Contract", size: "1.1 MB", when: "May 15" },
    { name: "Test Plan v2.docx", category: "QA", size: "0.6 MB", when: "May 17" },
    { name: "Steering Committee Deck — May.pdf", category: "Governance", size: "5.2 MB", when: "May 20" },
  ]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [uploading, setUploading] = useState(false);

  function upload() {
    if (!name.trim()) { toast.error("Document name is required"); return; }
    setUploading(true);
    setTimeout(() => {
      setDocs((prev) => [{ name: name.trim(), category, size: "—", when: "Just now" }, ...prev]);
      toast.success("Document uploaded");
      setUploading(false); setOpen(false); setName(""); setCategory("General");
    }, 800);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">Repository · {docs.length} files</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Upload className="mr-1 h-4 w-4" />Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <div className="rounded-lg border-2 border-dashed border-border/60 bg-secondary/20 p-6 text-center">
              <FileUp className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="mt-2 text-sm text-foreground">Drag &amp; drop a file here, or browse</div>
              <div className="mt-1 text-xs text-muted-foreground">PDF, DOCX, XLSX, PNG · up to 20 MB</div>
            </div>
            <div className="grid gap-3">
              <div><Label>Document name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Steering Deck — Jun" /></div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Charter", "RAID", "Contract", "QA", "Governance", "Finance", "Design", "General"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={upload} disabled={uploading}>
                {uploading ? "Uploading…" : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="glass-card p-5">
        <ul className="divide-y divide-border text-sm">
          {docs.map((d) => (
            <li key={d.name + d.when} className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-foreground"><FileText className="h-4 w-4 text-accent" />{d.name}</span>
              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="outline" className="border-border bg-secondary/40">{d.category}</Badge>
                <span>{d.size}</span>
                <span>{d.when}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Status Reports tab ────────────────────────────────────────────────────────
function StatusReportsTab({
  project, reports, setReports, externalOpen, onExternalOpenChange, onRagChange,
}: {
  project: typeof projects[number];
  reports: StatusReport[];
  setReports: React.Dispatch<React.SetStateAction<StatusReport[]>>;
  externalOpen: boolean;
  onExternalOpenChange: (open: boolean) => void;
  onRagChange: (rag: Rag) => void;
}) {
  const nextWeek = Math.max(...reports.map((r) => r.week), 0) + 1;
  const [rag, setRag] = useState<Rag>("green");
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim()) { toast.error("Status narrative is required"); return; }
    setReports((prev) => [{ week: nextWeek, by: project.pm, when: "Just now", rag, text: text.trim() }, ...prev]);
    onRagChange(rag);
    toast.success(`Week ${nextWeek} status report submitted`);
    onExternalOpenChange(false); setRag("green"); setText("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">{reports.length} status reports</div>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => onExternalOpenChange(true)}>
          Submit Week {nextWeek} Report
        </Button>
      </div>
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.week} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">Week {r.week} status report</div>
                <div className="text-xs text-muted-foreground">Submitted by {r.by} · {r.when}</div>
              </div>
              <RagBadge rag={r.rag} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
          </div>
        ))}
      </div>

      <Dialog open={externalOpen} onOpenChange={onExternalOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Submit Week {nextWeek} Status Report</DialogTitle></DialogHeader>
          <div className="rounded-md border border-accent/20 bg-accent-dim/30 px-3 py-2 text-xs text-accent">
            Project: <span className="font-medium">{project.name}</span>
          </div>
          <div className="grid gap-3">
            <div>
              <Label>Overall RAG status</Label>
              <Select value={rag} onValueChange={(v) => setRag(v as Rag)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">On Track</SelectItem>
                  <SelectItem value="amber">At Risk</SelectItem>
                  <SelectItem value="red">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Status narrative</Label><Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="What happened this week, blockers, next steps…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onExternalOpenChange(false)}>Cancel</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Change Requests tab ───────────────────────────────────────────────────────
function ChangeRequestsTab({ project: _project }: { project: typeof projects[number] }) {
  const [crs, setCrs] = useState<ChangeReq[]>([
    { id: "CR-014", title: "Add data warehouse layer", impact: "Adds BI capacity", timeline: "+3 weeks", budget: "+$120K", decision: "Approved" },
    { id: "CR-013", title: "Reduce UAT to one week", impact: "Risk + quality concern", timeline: "-1 week", budget: "$0", decision: "Rejected" },
    { id: "CR-012", title: "Add 2 QA engineers", impact: "Faster test cycles", timeline: "0", budget: "+$60K", decision: "Under review" },
  ]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [impact, setImpact] = useState("");
  const [timeline, setTimeline] = useState(""); const [budget, setBudget] = useState("");

  function submit() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const id = `CR-${String(15 + crs.length).padStart(3, "0")}`;
    setCrs((prev) => [{ id, title: title.trim(), impact: impact || "—", timeline: timeline || "0", budget: budget || "$0", decision: "Under review" }, ...prev]);
    toast.success(`${id} submitted for review`);
    setOpen(false); setTitle(""); setImpact(""); setTimeline(""); setBudget("");
  }

  const ragOf = (d: ChangeReq["decision"]): Rag => d === "Approved" ? "green" : d === "Rejected" ? "red" : "amber";
  const kpis = [
    { l: "Under Review", v: crs.filter((c) => c.decision === "Under review").length, c: "text-rag-amber" },
    { l: "Approved", v: crs.filter((c) => c.decision === "Approved").length, c: "text-rag-green" },
    { l: "Rejected", v: crs.filter((c) => c.decision === "Rejected").length, c: "text-rag-red" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.l} className="glass-card p-4">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c}`}>{k.v}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">Change requests</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />New Change Request</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Change Request</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Add reporting module" /></div>
              <div><Label>Impact description</Label><Textarea rows={3} value={impact} onChange={(e) => setImpact(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Timeline delta</Label><Input value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="+2 weeks" /></div>
                <div><Label>Budget delta</Label><Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="+$50K" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="">
        <Table>
          <TableHeader><TableRow><TableHead>CR</TableHead><TableHead>Title</TableHead><TableHead>Impact</TableHead><TableHead>Timeline</TableHead><TableHead>Budget</TableHead><TableHead>Decision</TableHead></TableRow></TableHeader>
          <TableBody>{crs.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="num-mono text-xs">{r.id}</TableCell>
              <TableCell>{r.title}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">{r.impact}</TableCell>
              <TableCell className="num-mono text-xs">{r.timeline}</TableCell>
              <TableCell className="num-mono text-xs">{r.budget}</TableCell>
              <TableCell><RagBadge rag={ragOf(r.decision)} label={r.decision} /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Procurement (project) tab ─────────────────────────────────────────────────
function ProcurementProjectTab({ projectName, addRfp }: { projectName: string; addRfp: (r: RfpEntry) => void }) {
  const contracts = [
    { id: "CT-2026-038", vendor: "Oracle Consulting", value: "$680K", end: "Dec 12", rag: "green" as Rag, status: "Active" },
    { id: "CT-2026-029", vendor: "Cyberguard", value: "$140K", end: "Sep 30", rag: "green" as Rag, status: "Active" },
    { id: "CT-2026-031", vendor: "LearnSphere", value: "$95K", end: "Aug 25", rag: "amber" as Rag, status: "Expiring" },
  ];
  const rfps = [
    { id: "RFP-014", title: "Robotics Integration Partner", type: "RFP", due: "Jun 28", bidders: 4, rag: "amber" as Rag, status: "Open" },
    { id: "RFP-016", title: "Training services rollout", type: "RFP", due: "Jul 12", bidders: 2, rag: "amber" as Rag, status: "Open" },
  ];

  const [packages, setPackages] = useState<TenderPackage[]>(SEED_PACKAGES);
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [newPkgOpen, setNewPkgOpen] = useState(false);
  const [newScope, setNewScope] = useState("");
  const [newEst, setNewEst] = useState("");
  const [newVendors, setNewVendors] = useState<string[]>([]);

  function handleNewPackage() {
    if (!newScope.trim()) { toast.error("Please enter a package scope"); return; }
    const id = `PKG-${String(packages.length + 1).padStart(3, "0")}`;
    setPackages(prev => [...prev, { id, scope: newScope.trim(), est: newEst.trim() || "TBD", status: "Draft" }]);
    toast.success("Tender request created", { description: `${id} saved as Draft` });
    setNewPkgOpen(false); setNewScope(""); setNewEst(""); setNewVendors([]);
  }

  function sendForTendering(pkgId: string) {
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return;
    const rfpNum = 17 + packages.filter(p => p.rfp).length;
    const rfpId = `RFP-0${rfpNum}`;
    setPackages(prev => prev.map(p => p.id === pkgId
      ? { ...p, status: "Sent for Tendering", rfp: rfpId, issued: "Today", closes: "30 days" }
      : p
    ));
    addRfp({ id: rfpId, title: pkg.scope, type: "RFP", status: "Open", bidders: 0, due: "30 days", project: projectName });
    toast.success("RFP created in Procurement", { description: `${rfpId} published — vendors can submit proposals` });
  }

  function approveProposal(pkgId: string, proposal: TenderProposal) {
    const contractNum = 38 + packages.filter(p => p.contract).length;
    const contractId = `CT-2026-0${contractNum}`;
    setPackages(prev => prev.map(p => p.id === pkgId
      ? { ...p, status: "Awarded", vendor: proposal.vendor, contract: contractId, awarded: "Today", est: proposal.value, proposals: undefined }
      : p
    ));
    toast.success(`Package awarded to ${proposal.vendor}`, { description: `Contract ${contractId} created automatically` });
    setExpandedPkg(null);
  }

  function rejectProposal(pkgId: string, vendorName: string) {
    setPackages(prev => prev.map(p => p.id === pkgId
      ? { ...p, proposals: p.proposals?.filter(pr => pr.vendor !== vendorName) }
      : p
    ));
    toast.info(`Proposal from ${vendorName} rejected`);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { l: "Active Contracts", v: String(contracts.filter((c) => c.status === "Active").length), c: "text-rag-green" },
          { l: "Open RFPs", v: String(rfps.length), c: "text-rag-amber" },
          { l: "Tender Packages", v: String(packages.length), c: "text-accent" },
          { l: "Total Committed", v: "$915K", c: "text-foreground" },
        ].map((k) => (
          <div key={k.l} className="glass-card p-4">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c}`}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="label-eyebrow">Tender Packages</div>
          <Dialog open={newPkgOpen} onOpenChange={setNewPkgOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">+ New Request</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>New Tender Request</DialogTitle></DialogHeader>
              <div className="rounded-md border border-accent/20 bg-accent-dim/30 px-3 py-2 text-xs text-accent">
                Project: <span className="font-medium">{projectName}</span>
                <span className="ml-2 text-muted-foreground">· Saved as Draft until sent for tendering</span>
              </div>
              <div className="grid gap-3">
                <div>
                  <Label>Package scope</Label>
                  <Input placeholder="e.g. Security audit & pen-testing" value={newScope} onChange={e => setNewScope(e.target.value)} />
                </div>
                <div>
                  <Label>Estimated value</Label>
                  <Input placeholder="e.g. $150K" value={newEst} onChange={e => setNewEst(e.target.value)} />
                </div>
                <div>
                  <Label>Recommended Vendors</Label>
                  <div className="mt-1.5 space-y-2 rounded-md border border-border bg-background/40 p-3">
                    {vendorList.map((v) => (
                      <div key={v.name} className="flex items-center gap-2">
                        <Checkbox
                          id={`nv-${v.name}`}
                          checked={newVendors.includes(v.name)}
                          onCheckedChange={(checked) =>
                            setNewVendors((prev) => checked ? [...prev, v.name] : prev.filter((n) => n !== v.name))
                          }
                        />
                        <label htmlFor={`nv-${v.name}`} className="cursor-pointer text-sm text-foreground">
                          {v.name}
                          <span className="ml-1.5 text-xs text-muted-foreground">({v.category})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewPkgOpen(false)}>Cancel</Button>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleNewPackage}>Create Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package</TableHead><TableHead>Scope</TableHead><TableHead>Est. Value</TableHead>
              <TableHead>RFP</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <Fragment key={pkg.id}>
                <TableRow>
                  <TableCell className="font-medium text-foreground">{pkg.id}</TableCell>
                  <TableCell>{pkg.scope}</TableCell>
                  <TableCell className="num-mono">{pkg.est}</TableCell>
                  <TableCell className="num-mono text-xs text-muted-foreground">{pkg.rfp ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border ${
                      pkg.status === "Draft" ? "bg-secondary/40 text-muted-foreground border-border" :
                      pkg.status === "Sent for Tendering" ? "bg-rag-amber/10 text-rag-amber border-rag-amber/30" :
                      pkg.status === "Proposals Received" ? "bg-accent/10 text-accent border-accent/30" :
                      pkg.status === "Awarded" ? "bg-rag-green/10 text-rag-green border-rag-green/30" :
                      "bg-secondary/40 text-muted-foreground border-border"
                    }`}>{pkg.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {pkg.status === "Draft" && (
                      <Button size="sm" variant="outline" className="border-accent/40 text-accent hover:bg-accent-dim h-7 text-xs"
                        onClick={() => sendForTendering(pkg.id)}>
                        <Send className="mr-1.5 h-3 w-3" />Send for Tendering
                      </Button>
                    )}
                    {pkg.status === "Sent for Tendering" && (
                      <span className="text-xs text-muted-foreground">Closes {pkg.closes}</span>
                    )}
                    {pkg.status === "Proposals Received" && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-accent hover:bg-accent-dim"
                        onClick={() => setExpandedPkg(expandedPkg === pkg.id ? null : pkg.id)}>
                        {expandedPkg === pkg.id ? <ChevronDown className="mr-1 h-3 w-3" /> : <ChevronRight className="mr-1 h-3 w-3" />}
                        {pkg.proposals?.length} proposal{pkg.proposals?.length !== 1 ? "s" : ""}
                      </Button>
                    )}
                    {pkg.status === "Awarded" && (
                      <div className="text-xs">
                        <span className="font-medium text-foreground">{pkg.vendor}</span>
                        <span className="ml-2 num-mono text-muted-foreground">{pkg.contract}</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                {pkg.status === "Proposals Received" && expandedPkg === pkg.id && pkg.proposals?.map((pr) => (
                  <TableRow key={`${pkg.id}-${pr.vendor}`} className="bg-secondary/20 border-l-2 border-l-accent/30">
                    <TableCell />
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        <span className="text-sm font-medium text-foreground">{pr.vendor}</span>
                        <span className="num-mono text-xs text-muted-foreground">{pr.value}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary/60">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${pr.score}%` }} />
                        </div>
                        <span className="num-mono text-xs text-muted-foreground">{pr.score}/100</span>
                      </div>
                    </TableCell>
                    <TableCell /><TableCell />
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 border border-rag-green/30 bg-rag-green/10 text-rag-green hover:bg-rag-green/20 text-xs"
                          onClick={() => approveProposal(pkg.id, pr)}>
                          <CheckCircle2 className="mr-1 h-3 w-3" />Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-rag-red"
                          onClick={() => rejectProposal(pkg.id, pr.vendor)}>
                          <XCircle className="mr-1 h-3 w-3" />Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="label-eyebrow">Contracts</div>
          <Link to="/procurement" className="text-xs text-accent hover:underline">Open Procurement module →</Link>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Contract</TableHead><TableHead>Vendor</TableHead><TableHead>Value</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{contracts.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="num-mono text-xs text-accent">{c.id}</TableCell>
              <TableCell>{c.vendor}</TableCell>
              <TableCell className="num-mono">{c.value}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{c.end}</TableCell>
              <TableCell><RagBadge rag={c.rag} label={c.status} /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>

      <div className="">
        <div className="px-4 py-3 border-b border-border label-eyebrow">Open RFPs</div>
        <Table>
          <TableHeader><TableRow><TableHead>RFP</TableHead><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Due</TableHead><TableHead>Bidders</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{rfps.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="num-mono text-xs text-accent">{r.id}</TableCell>
              <TableCell>{r.title}</TableCell>
              <TableCell>{r.type}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{r.due}</TableCell>
              <TableCell className="num-mono">{r.bidders}</TableCell>
              <TableCell><RagBadge rag={r.rag} label={r.status} /></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Stakeholders tab ──────────────────────────────────────────────────────────
function StakeholdersTab() {
  const [items, setItems] = useState<Stakeholder[]>([
    { name: "V. Mansour", org: "Exec Sponsor", influence: "High", interest: "High", strategy: "Manage closely" },
    { name: "R. Hadid", org: "Client (ACME)", influence: "High", interest: "Medium", strategy: "Keep satisfied" },
    { name: "IT Steering", org: "Internal", influence: "Medium", interest: "High", strategy: "Keep informed" },
    { name: "Finance Board", org: "Internal", influence: "High", interest: "Low", strategy: "Inform monthly" },
  ]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [org, setOrg] = useState("");
  const [influence, setInfluence] = useState<"High" | "Medium" | "Low">("Medium");
  const [interest, setInterest] = useState<"High" | "Medium" | "Low">("Medium");
  const [strategy, setStrategy] = useState("");

  function submit() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setItems((prev) => [...prev, { name: name.trim(), org: org || "—", influence, interest, strategy: strategy || "—" }]);
    toast.success("Stakeholder added");
    setOpen(false); setName(""); setOrg(""); setStrategy("");
  }

  const colorFor = (level: "High" | "Medium" | "Low") =>
    level === "High" ? "text-rag-red" : level === "Medium" ? "text-rag-amber" : "text-muted-foreground";

  const quadrants = [
    { key: "hi-hi", label: "Manage closely", tint: "bg-rag-red/10 border-rag-red/30", text: "text-rag-red", filter: (s: Stakeholder) => s.influence === "High" && s.interest === "High" },
    { key: "hi-lo", label: "Keep satisfied", tint: "bg-rag-amber/10 border-rag-amber/30", text: "text-rag-amber", filter: (s: Stakeholder) => s.influence === "High" && s.interest !== "High" },
    { key: "lo-hi", label: "Keep informed", tint: "bg-accent/10 border-accent/30", text: "text-accent", filter: (s: Stakeholder) => s.influence !== "High" && s.interest === "High" },
    { key: "lo-lo", label: "Monitor", tint: "bg-secondary/40 border-border", text: "text-muted-foreground", filter: (s: Stakeholder) => s.influence !== "High" && s.interest !== "High" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">Stakeholder matrix · {items.length} stakeholders</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><UserPlus className="mr-1 h-4 w-4" />Add Stakeholder</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Stakeholder</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Organisation</Label><Input value={org} onChange={(e) => setOrg(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Influence</Label>
                  <Select value={influence} onValueChange={(v) => setInfluence(v as "High" | "Medium" | "Low")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Interest</Label>
                  <Select value={interest} onValueChange={(v) => setInterest(v as "High" | "Medium" | "Low")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Engagement strategy</Label><Input value={strategy} onChange={(e) => setStrategy(e.target.value)} placeholder="e.g. Weekly 1:1" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Add Stakeholder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Org</TableHead><TableHead>Influence</TableHead><TableHead>Interest</TableHead><TableHead>Strategy</TableHead></TableRow></TableHeader>
          <TableBody>{items.map((s) => (
            <TableRow key={s.name}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.org}</TableCell>
              <TableCell className={colorFor(s.influence)}>{s.influence}</TableCell>
              <TableCell className={colorFor(s.interest)}>{s.interest}</TableCell>
              <TableCell className="text-xs">{s.strategy}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>

      {/* 2×2 engagement matrix */}
      <div className="glass-card p-5">
        <div className="label-eyebrow mb-3">Engagement matrix</div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border">
          {quadrants.map((q) => (
            <div key={q.key} className={`${q.tint} border p-4 min-h-32`}>
              <div className={`text-xs font-medium ${q.text}`}>{q.label}</div>
              <ul className="mt-2 space-y-1 text-sm text-foreground">
                {items.filter(q.filter).map((s) => (<li key={s.name}>{s.name}</li>))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {quadrants.map((q) => (
            <span key={q.key} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${q.tint.split(" ")[0].replace("/10", "")}`} />{q.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Add Cost Entry dialog ─────────────────────────────────────────────────────
const COST_COLORS: Record<string, string> = {
  Labour: "bg-rag-green", Hardware: "bg-rag-blue", Software: "bg-accent",
  "Business trips": "bg-rag-amber", Contingency: "bg-muted-foreground", Other: "bg-rag-red",
};
function AddCostDialog({ onAdd }: { onAdd: (e: CostEntry) => void }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(""); const [budget, setBudget] = useState(""); const [actual, setActual] = useState("");
  function submit() {
    if (!cat.trim() || !budget) { toast.error("Category and budget are required"); return; }
    const b = parseFloat(budget); const a = parseFloat(actual || "0");
    if (isNaN(b)) { toast.error("Budget must be a number"); return; }
    onAdd({ c: cat.trim(), b, a: isNaN(a) ? 0 : a, color: COST_COLORS[cat] ?? "bg-muted-foreground" });
    toast.success("Cost entry added");
    setOpen(false); setCat(""); setBudget(""); setActual("");
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 border-accent/40 text-accent hover:bg-accent-dim text-xs">
          <Plus className="mr-1 h-3.5 w-3.5" />Add Cost
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Cost Entry</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Category</Label>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
              <SelectContent>
                {["Labour", "Hardware", "Software", "Business trips", "Contingency", "Other"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Budget ($M)</Label><Input type="number" min={0} step={0.01} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0.50" /></div>
            <div><Label>Actual ($M)</Label><Input type="number" min={0} step={0.01} value={actual} onChange={(e) => setActual(e.target.value)} placeholder="0.00" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Add Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Revenue Event dialog ──────────────────────────────────────────────────
function AddRevenueDialog({ onAdd }: { onAdd: (e: RevEntry) => void }) {
  const [open, setOpen] = useState(false);
  const [ms, setMs] = useState(""); const [evt, setEvt] = useState("");
  const [plan, setPlan] = useState(""); const [date, setDate] = useState("");
  function submit() {
    if (!ms.trim() || !plan) { toast.error("Milestone and planned amount are required"); return; }
    const p = parseFloat(plan);
    if (isNaN(p)) { toast.error("Planned amount must be a number"); return; }
    onAdd({ ms: ms.trim(), evt: evt || "—", plan: p, date: date || "TBD", s: "blue", sl: "Planned", act: null });
    toast.success("Revenue event added");
    setOpen(false); setMs(""); setEvt(""); setPlan(""); setDate("");
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 border-accent/40 text-accent hover:bg-accent-dim text-xs">
          <Plus className="mr-1 h-3.5 w-3.5" />Add Revenue Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Revenue Event</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Linked milestone</Label><Input value={ms} onChange={(e) => setMs(e.target.value)} placeholder="e.g. Phase 2 sign-off" /></div>
          <div><Label>Revenue event</Label><Input value={evt} onChange={(e) => setEvt(e.target.value)} placeholder="e.g. Progress invoice (15%)" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Planned ($M)</Label><Input type="number" min={0} step={0.01} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="0.50" /></div>
            <div><Label>Expected date</Label><Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="Oct 30" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Add Event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Stage Gates dialog ────────────────────────────────────────────────────────
const GATE_ROLES = ["Project Manager", "Tech Lead", "Finance Manager", "Resource Manager", "Procurement Lead", "Executive Sponsor"];
function StageGatesDialog({
  open, onOpenChange, gateData, setGateData,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  gateData: GateStage[];
  setGateData: React.Dispatch<React.SetStateAction<GateStage[]>>;
}) {
  const [activeStage, setActiveStage] = useState(0);
  const [newTask, setNewTask] = useState("");
  const [newRole, setNewRole] = useState("Project Manager");

  function toggleDone(stageIdx: number, itemIdx: number) {
    setGateData((prev) =>
      prev.map((s, si) => si !== stageIdx ? s : {
        ...s,
        items: s.items.map((it, ii) => ii !== itemIdx ? it : { ...it, done: !it.done }),
      })
    );
  }

  function changeRole(stageIdx: number, itemIdx: number, role: string) {
    setGateData((prev) =>
      prev.map((s, si) => si !== stageIdx ? s : {
        ...s,
        items: s.items.map((it, ii) => ii !== itemIdx ? it : { ...it, role }),
      })
    );
  }

  function addItem() {
    if (!newTask.trim()) return;
    setGateData((prev) =>
      prev.map((s, si) => si !== activeStage ? s : {
        ...s,
        items: [...s.items, { task: newTask.trim(), role: newRole, done: false }],
      })
    );
    toast.success("Checklist item added");
    setNewTask("");
  }

  const stage = gateData[activeStage];
  const doneCount = stage?.items.filter((i) => i.done).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Stage Gate Checklists</DialogTitle></DialogHeader>

        {/* Stage tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-border pb-2">
          {gateData.map((s, i) => {
            const done = s.items.filter((x) => x.done).length;
            const total = s.items.length;
            return (
              <button
                key={s.name}
                onClick={() => setActiveStage(i)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                  i === activeStage
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                {s.name}
                <span className={`num-mono rounded-full px-1.5 py-0.5 text-[10px] ${
                  done === total ? "bg-rag-green/20 text-rag-green" : "bg-secondary/60"
                }`}>{done}/{total}</span>
              </button>
            );
          })}
        </div>

        {/* Checklist */}
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {stage?.items.map((item, ii) => (
            <div key={ii} className="flex items-center gap-3 rounded-md border border-border/60 bg-secondary/20 px-3 py-2">
              <Checkbox
                checked={item.done}
                onCheckedChange={() => toggleDone(activeStage, ii)}
                className="shrink-0"
              />
              <span className={`flex-1 text-sm ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {item.task}
              </span>
              <Select value={item.role} onValueChange={(r) => changeRole(activeStage, ii, r)}>
                <SelectTrigger className="h-7 w-[160px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GATE_ROLES.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stage?.name} progress</span>
            <span className="num-mono">{doneCount}/{stage?.items.length ?? 0}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: stage?.items.length ? `${(doneCount / stage.items.length) * 100}%` : "0%" }}
            />
          </div>
        </div>

        {/* Add new item */}
        <div className="flex gap-2 border-t border-border pt-3">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add checklist item…"
            className="flex-1 h-8 text-sm"
            onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
          />
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger className="h-8 w-[148px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GATE_ROLES.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 bg-accent text-accent-foreground hover:bg-accent/90" onClick={addItem}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Lessons Learned tab ───────────────────────────────────────────────────────
const LESSON_CATS = ["What Went Well", "Challenges", "Recommendations", "Process", "People", "Tech", "Governance", "Risk", "Communication", "Planning"] as const;
type LessonCat = typeof LESSON_CATS[number];

const LESSON_CAT_STYLE: Record<string, string> = {
  "What Went Well":  "border-rag-green/40 bg-rag-green/10 text-rag-green",
  "Challenges":      "border-rag-red/40 bg-rag-red/10 text-rag-red",
  "Recommendations": "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
};

function LessonsTab({ project }: { project: typeof projects[number] }) {
  const [items, setItems] = useState<Lesson[]>([
    { tag: "What Went Well", text: "Early stakeholder alignment on scope prevented scope creep.", by: project.pm, when: "May 20" },
    { tag: "Challenges", text: "Vendor delivery delay on Oracle ERP — impacted integration milestone by 2 weeks.", by: "Mei Chen", when: "May 18" },
    { tag: "Recommendations", text: "Run UAT in parallel with integration build on future projects — saves 1 sprint.", by: "Priya Iyer", when: "May 15" },
    { tag: "Process", text: "Earlier vendor SLA reviews surface delays sooner.", by: project.pm, when: "May 14" },
    { tag: "People", text: "Pair architect with junior dev for knowledge transfer.", by: "Mei Chen", when: "May 11" },
    { tag: "Governance", text: "Bi-weekly steering tempo too slow for critical phase.", by: project.pm, when: "May 09" },
  ]);
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState<LessonCat>("What Went Well");
  const [text, setText] = useState("");
  const [filterCat, setFilterCat] = useState<LessonCat | "All">("All");

  function submit() {
    if (!text.trim()) { toast.error("Lesson text is required"); return; }
    setItems((prev) => [{ tag, text: text.trim(), by: project.pm, when: "Just now" }, ...prev]);
    toast.success("Lesson recorded");
    setOpen(false); setText(""); setTag("What Went Well");
  }

  const displayed = filterCat === "All" ? items : items.filter((l) => l.tag === filterCat);

  const grouped = [
    { label: "What Went Well", items: displayed.filter((l) => l.tag === "What Went Well") },
    { label: "Challenges",     items: displayed.filter((l) => l.tag === "Challenges") },
    { label: "Recommendations",items: displayed.filter((l) => l.tag === "Recommendations") },
    { label: "Other",          items: displayed.filter((l) => !["What Went Well","Challenges","Recommendations"].includes(l.tag)) },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">{items.length} lessons recorded</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Add Lesson</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Lesson Learned</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Category</Label>
                <Select value={tag} onValueChange={(v) => setTag(v as LessonCat)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LESSON_CATS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {tag === "What Went Well" ? "What worked? What would you repeat?" :
                   tag === "Challenges"     ? "What was difficult or went wrong?" :
                   tag === "Recommendations"? "What should future projects do differently?" :
                   "Lesson"}
                </Label>
                <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)}
                  placeholder={
                    tag === "What Went Well" ? "e.g. Early stakeholder buy-in avoided scope disputes later…" :
                    tag === "Challenges"     ? "e.g. Vendor SLA breach caused 2-week delay on milestone 3…" :
                    tag === "Recommendations"? "e.g. Run UAT in parallel with integration build to save 1 sprint…" :
                    "What did we learn?"
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Add Lesson</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {(["All", "What Went Well", "Challenges", "Recommendations", "Process", "People", "Tech", "Governance"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c as LessonCat | "All")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filterCat === c
                ? c === "What Went Well"  ? "border-rag-green/50 bg-rag-green/15 text-rag-green"
                : c === "Challenges"      ? "border-rag-red/50 bg-rag-red/15 text-rag-red"
                : c === "Recommendations" ? "border-rag-amber/50 bg-rag-amber/15 text-rag-amber"
                : "border-accent/40 bg-accent-dim text-accent"
                : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            {c} {c !== "All" && <span className="ml-1 opacity-60">{items.filter((l) => l.tag === c).length}</span>}
          </button>
        ))}
      </div>

      {/* Grouped display */}
      {filterCat === "All" ? (
        <div className="space-y-5">
          {grouped.map((g) => (
            <div key={g.label}>
              <div className={`mb-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${LESSON_CAT_STYLE[g.label] ?? "border-border bg-secondary/30 text-muted-foreground"}`}>
                {g.label === "What Went Well" ? "✓" : g.label === "Challenges" ? "⚠" : g.label === "Recommendations" ? "→" : "·"} {g.label}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {g.items.map((l, i) => (
                  <div key={i} className="glass-card p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-[10px] ${LESSON_CAT_STYLE[l.tag] ?? "border-accent/40 bg-accent-dim text-accent"}`}>{l.tag}</Badge>
                      <span className="text-xs text-muted-foreground">{l.when}</span>
                    </div>
                    <p className="mt-2 text-foreground">{l.text}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" /> by {l.by}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {displayed.map((l, i) => (
            <div key={i} className="glass-card p-4 text-sm">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`text-[10px] ${LESSON_CAT_STYLE[l.tag] ?? "border-accent/40 bg-accent-dim text-accent"}`}>{l.tag}</Badge>
                <span className="text-xs text-muted-foreground">{l.when}</span>
              </div>
              <p className="mt-2 text-foreground">{l.text}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" /> by {l.by}
              </div>
            </div>
          ))}
          {displayed.length === 0 && (
            <div className="col-span-2 glass-card p-8 text-center text-sm text-muted-foreground">
              No {filterCat} lessons recorded yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
