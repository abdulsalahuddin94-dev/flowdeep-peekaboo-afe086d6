import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, Fragment } from "react";
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
import { ChevronLeft, FileText, MessageSquare, Paperclip, Download, UserPlus, ChevronDown, ChevronRight, Send, CheckCircle2, XCircle, Plus, AlertTriangle, Upload, FileUp, Pencil } from "lucide-react";
import type { Rag } from "@/lib/mock-data";
import { projects } from "@/lib/mock-data";
import { toast } from "sonner";

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
  "Overview", "Planning", "Schedule", "Team & Allocation", "Financials",
  "Risks & Issues", "Documents", "Status Reports", "Change Requests",
  "Procurement", "Stakeholders", "Lessons Learned",
];

function ProjectDetail() {
  const { project } = Route.useLoaderData();
  const [reportOpen, setReportOpen] = useState(false);
  const [reports, setReports] = useState<StatusReport[]>(() => [
    { week: 18, by: project.pm, when: "3 days ago", rag: project.rag, text: "Integration layer testing delayed by 1 week. Fallback plan in review with IT Director. No impact on go-live yet." },
    { week: 17, by: project.pm, when: "10 days ago", rag: "amber", text: "Vendor SOW reviewed. Two open RAID items remain; mitigations scheduled this sprint." },
    { week: 16, by: project.pm, when: "17 days ago", rag: "green", text: "Discovery completed and signed off. Build phase 1 kicked off on plan." },
  ]);
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
            <Button variant="outline" size="sm">Export</Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setReportOpen(true)}>Submit status</Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { l: "Progress", v: `${project.progress}%` },
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
        <TabsList className="bg-secondary/40 overflow-x-auto whitespace-nowrap">
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t} className="text-xs">{t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="Overview" className="mt-5">
          <OverviewTab project={project} />
        </TabsContent>

        <TabsContent value="Planning" className="mt-5">
          <PlanningTab project={project} />
        </TabsContent>

        <TabsContent value="Schedule" className="mt-5">
          <div className="glass-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="label-eyebrow">Gantt — week of October 3</div>
                <div className="mt-1 text-xs text-muted-foreground">Drag tasks to reschedule · Click a bar to open</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">‹ Prev</Button>
                <Button variant="outline" size="sm">Today</Button>
                <Button variant="outline" size="sm">Next ›</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {(() => {
                const days = [
                  { d: 3, w: "Monday" },
                  { d: 4, w: "Tuesday" },
                  { d: 5, w: "Wednesday", today: true },
                  { d: 6, w: "Thursday" },
                  { d: 7, w: "Friday" },
                  { d: 8, w: "Saturday" },
                  { d: 9, w: "Sunday" },
                ];
                const palette = {
                  blue:   { bg: "bg-blue-500/15",    bd: "border-blue-500/30",    tx: "text-blue-300",    av: "bg-blue-500/30 text-blue-100" },
                  green:  { bg: "bg-emerald-500/15", bd: "border-emerald-500/30", tx: "text-emerald-300", av: "bg-emerald-500/30 text-emerald-100" },
                  peach:  { bg: "bg-orange-500/15",  bd: "border-orange-500/30",  tx: "text-orange-200",  av: "bg-orange-500/30 text-orange-100" },
                  pink:   { bg: "bg-pink-500/15",    bd: "border-pink-500/30",    tx: "text-pink-200",    av: "bg-pink-500/30 text-pink-100" },
                  violet: { bg: "bg-violet-500/15",  bd: "border-violet-500/30",  tx: "text-violet-200",  av: "bg-violet-500/30 text-violet-100" },
                  amber:  { bg: "bg-amber-500/15",   bd: "border-amber-500/30",   tx: "text-amber-200",   av: "bg-amber-500/30 text-amber-100" },
                } as const;
                type Color = keyof typeof palette;
                const rows: { lane: string; task?: { s: number; l: number; label: string; who: string; color: Color; check?: boolean } }[] = [
                  { lane: "Project management",   task: { s: 0, l: 2, label: "Assign project tasks",             who: project.pm,  color: "blue" } },
                  { lane: "UI design for mobile", task: { s: 1, l: 2, label: "Create design for mobile splash",  who: "Sara Kim",  color: "green", check: true } },
                  { lane: "UI design for web",    task: { s: 2, l: 2, label: "Mockup for web app",               who: "Mei Chen",  color: "peach" } },
                  { lane: "Design system review", task: { s: 4, l: 2, label: "Update design system",             who: "Priya Iyer",color: "violet" } },
                  { lane: "HTML development",     task: { s: 1, l: 5, label: "Start HTML & CSS development",     who: "K. Bauer",  color: "peach" } },
                  { lane: "CMS integration",      task: { s: 5, l: 2, label: "Integrate with Webflow",           who: "Diego O.",  color: "pink" } },
                  { lane: "Quality review" },
                  { lane: "Product launch" },
                  { lane: "Marketing campaign",   task: { s: 1, l: 3, label: "New marketing strategy",           who: "H. Tanaka", color: "blue" } },
                  { lane: "SEO improvements",     task: { s: 4, l: 3, label: "Start SEO optimization",           who: "L. Park",   color: "peach" } },
                ];
                const COLS = "grid-cols-[200px_repeat(7,minmax(110px,1fr))]";
                return (
                  <div className="min-w-[1000px]">
                    {/* Header */}
                    <div className={`grid ${COLS} border-b border-border`}>
                      <div />
                      {days.map((d) => (
                        <div key={d.d} className={`px-3 py-3 text-center ${d.today ? "bg-accent-dim/40 rounded-t-md" : ""}`}>
                          <div className={`text-xs ${d.today ? "text-accent font-medium" : "text-muted-foreground"}`}>October, {d.d}</div>
                          <div className={`mt-0.5 text-sm font-medium ${d.today ? "text-accent" : "text-foreground"}`}>{d.w}</div>
                        </div>
                      ))}
                    </div>
                    {/* Rows */}
                    {rows.map((r, idx) => (
                      <div key={r.lane} className={`grid ${COLS} border-b border-border/60`} style={{ minHeight: 72 }}>
                        <div className="flex items-center px-3 py-4 text-sm text-foreground">{r.lane}</div>
                        {days.map((d, di) => (
                          <div key={d.d} className={`relative border-l border-border/40 ${d.today ? "bg-accent-dim/20" : ""}`}>
                            {r.task && di === r.task.s && (() => {
                              const p = palette[r.task!.color];
                              const initials = r.task!.who.split(" ").map((s) => s[0]).join("").slice(0, 2);
                              return (
                                <div
                                  className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full border ${p.bg} ${p.bd} px-2 py-1.5 shadow-sm`}
                                  style={{ left: 6, width: `calc(${r.task!.l} * 100% - 12px)`, zIndex: 2 }}
                                >
                                  {r.task!.check ? (
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/80 text-[11px] text-white">✓</div>
                                  ) : (
                                    <Avatar className="h-6 w-6 shrink-0">
                                      <AvatarFallback className={`text-[10px] ${p.av}`}>{initials}</AvatarFallback>
                                    </Avatar>
                                  )}
                                  <span className={`truncate text-xs font-medium ${p.tx}`}>{r.task!.label}</span>
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
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
                  className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-xs text-muted-foreground data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:shadow-none"
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
              <div className="glass-card overflow-hidden">
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

            <TabsContent value="team-members" className="mt-4 glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead><TableHead>Role</TableHead>
                    <TableHead>Allocation %</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { n: project.pm, r: "PM", a: 80, p: "Apr–Sep", s: "green" },
                    { n: "Mei Chen", r: "Security Lead", a: 40, p: "May–Aug", s: "green" },
                    { n: "Priya Iyer", r: "Tech Lead", a: 100, p: "Jun–Sep", s: "amber" },
                    { n: "Diego Ortiz", r: "BI Engineer", a: 30, p: "Jul–Aug", s: "blue" },
                  ].map((m) => (
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
                      <TableCell><RagBadge rag={m.s as any} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { l: "Total Budget", v: `$${project.budgetTotal.toFixed(1)}M` },
              { l: "Spent", v: `$${project.budgetUsed.toFixed(2)}M` },
              { l: "Committed", v: "$0.4M" },
              { l: "Forecast EAC", v: `$${(project.budgetTotal * 1.04).toFixed(2)}M`, c: "text-rag-amber" },
            ].map((k) => (
              <div key={k.l} className="glass-card p-4">
                <div className="label-eyebrow">{k.l}</div><div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 glass-card p-5">
            <div className="label-eyebrow mb-3">Cost breakdown</div>
            <Table>
              <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Budget</TableHead><TableHead>Actual</TableHead><TableHead>Variance</TableHead></TableRow></TableHeader>
              <TableBody>{[
                ["Labour", "1.20", "0.84", "+0%"],
                ["Hardware", "0.90", "0.62", "-4%"],
                ["Software licenses", "0.40", "0.31", "+1%"],
                ["Business Trips", "0.10", "0.07", "+0%"],
                ["Contingency", "0.60", "0.26", "—"],
              ].map((r) => (
                <TableRow key={r[0]}><TableCell>{r[0]}</TableCell><TableCell className="num-mono">${r[1]}M</TableCell><TableCell className="num-mono">${r[2]}M</TableCell><TableCell className="num-mono text-xs">{r[3]}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </div>
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
          />
        </TabsContent>

        <TabsContent value="Change Requests" className="mt-5">
          <ChangeRequestsTab project={project} />
        </TabsContent>

        <TabsContent value="Procurement" className="mt-5">
          <ProcurementProjectTab />
        </TabsContent>

        <TabsContent value="Stakeholders" className="mt-5">
          <StakeholdersTab />
        </TabsContent>

        <TabsContent value="Lessons Learned" className="mt-5">
          <LessonsTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div><div className="label-eyebrow">{label}</div><div className="text-foreground">{value}</div></div>;
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

function PlanningTab({ project }: { project: typeof projects[number] }) {
  const checklist = [
    { label: "Objectives & scope defined", done: true },
    { label: "Milestone schedule created", done: true },
    { label: "Manpower requirements submitted", done: true },
    { label: "Subcontracted packages identified", done: false },
    { label: "Business trips planned", done: false },
    { label: "Budget plan approved", done: false },
    { label: "Charter approved", done: false },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checklist.length) * 100);

  const subTabs = [
    { v: "init", l: "Initiation & Planning" },
    { v: "ms", l: "Milestones & Dependencies" },
    { v: "manpower", l: "Manpower Requirements" },
    { v: "subs", l: "Subcontracted Packages" },
    { v: "trips", l: "Business Trips Plan" },
    { v: "fin", l: "Financial Planning" },
    { v: "tender", l: "Tender Packages" },
  ];

  const stages = [
    { n: 1, name: "Initiation", state: "done" },
    { n: 2, name: "Planning", state: "active" },
    { n: 3, name: "Execution", state: "todo" },
    { n: 4, name: "Monitoring", state: "todo" },
    { n: 5, name: "Closure", state: "todo" },
  ] as const;

  const [packages, setPackages] = useState<TenderPackage[]>(SEED_PACKAGES);
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [newPkgOpen, setNewPkgOpen] = useState(false);
  const [newScope, setNewScope] = useState("");

  // Milestones (v11)
  const [milestones, setMilestones] = useState<Milestone[]>([
    { name: "Discovery complete", date: "May 02", owner: "Sara", rag: "green", dep: "—" },
    { name: "Build phase 1", date: "Jun 30", owner: "Mei", rag: "amber", dep: "Discovery" },
    { name: "UAT Sign-off", date: project.endDate, owner: project.pm, rag: project.rag === "red" ? "red" : "amber", dep: "Build P1" },
    { name: "Go-live", date: "Sep 14", owner: project.pm, rag: "blue", dep: "UAT" },
  ]);

  // Subcontracted packages (v11)
  const [subs, setSubs] = useState<SubPackage[]>([
    { id: "SUB-001", scope: "Civil works & site prep", vendor: "Acme Construction", value: "$420K", period: "Jun–Jul", rag: "green", status: "Awarded" },
    { id: "SUB-002", scope: "Integration testing", vendor: "TestLabs Co.", value: "$180K", period: "Jul–Aug", rag: "green", status: "Awarded" },
    { id: "SUB-003", scope: "Training rollout (40 staff)", vendor: "LearnSphere", value: "$95K", period: "Aug", rag: "green", status: "Awarded" },
    { id: "SUB-004", scope: "Network cabling", vendor: "—", value: "$220K", period: "Jun", rag: "amber", status: "In tender" },
    { id: "SUB-005", scope: "Security audit & pen-test", vendor: "—", value: "$140K", period: "Sep", rag: "amber", status: "In tender" },
    { id: "SUB-006", scope: "Go-live support (8 wks)", vendor: "—", value: "$785K", period: "Sep–Oct", rag: "blue", status: "Planned" },
  ]);

  // Business trips (v11)
  const [trips, setTrips] = useState<Trip[]>([
    { id: "T-01", purpose: "Site survey", dest: "Dubai, UAE", dates: "Jun 12 – Jun 15", travelers: "Sara, Mei", cost: "$5.2K", rag: "green", status: "Completed" },
    { id: "T-02", purpose: "Vendor workshop", dest: "Munich, DE", dates: "Jul 08 – Jul 11", travelers: "K. Bauer", cost: "$3.0K", rag: "green", status: "Completed" },
    { id: "T-03", purpose: "User training", dest: "Riyadh, KSA", dates: "Aug 18 – Aug 22", travelers: "H. Tanaka, Priya, +2", cost: "$9.8K", rag: "amber", status: "Booked" },
    { id: "T-04", purpose: "Go-live support", dest: "Doha, QA", dates: "Sep 14 – Sep 28", travelers: "John, Mei, +2", cost: "$6.5K", rag: "blue", status: "Planned" },
  ]);
  const [newEst, setNewEst] = useState("");

  function handleNewPackage() {
    if (!newScope.trim()) { toast.error("Please enter a package scope"); return; }
    const id = `PKG-${String(packages.length + 1).padStart(3, "0")}`;
    setPackages(prev => [...prev, { id, scope: newScope.trim(), est: newEst.trim() || "TBD", status: "Draft" }]);
    toast.success("Tender request created", { description: `${id} saved as Draft` });
    setNewPkgOpen(false); setNewScope(""); setNewEst("");
  }

  function sendForTendering(pkgId: string) {
    const rfpNum = 17 + packages.filter(p => p.rfp).length;
    const rfpId = `RFP-0${rfpNum}`;
    setPackages(prev => prev.map(p => p.id === pkgId
      ? { ...p, status: "Sent for Tendering", rfp: rfpId, issued: "Today", closes: "30 days" }
      : p
    ));
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
    <div className="space-y-5">
      {/* Progress card */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            Planning Progress: {doneCount} / {checklist.length} complete
          </div>
          <div className="text-sm text-accent">{pct}% complete</div>
        </div>
        <div className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
          {checklist.map((c) => (
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
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="init">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
          {subTabs.map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-xs text-muted-foreground data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:shadow-none"
            >
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="init" className="mt-5">
          <div className="grid gap-4 md:grid-cols-[1fr_320px]">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">Project Summary</div>
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => toast.success("Planning document saved")}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />Save Changes
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                <PlanningField
                  label="Objectives (SMART)"
                  value={`Migrate all legacy infrastructure to cloud-based services, reducing operational costs by 30% and improving system uptime to 99.9% by Q4 2026.`}
                />
                <PlanningField
                  label="Scope"
                  multiline
                  value={`- Migration of 50+ servers to AWS cloud infrastructure\n- Implementation of automated backup and disaster recovery\n- Staff training on new cloud-based systems\n- Security and compliance certification`}
                />
                <PlanningField
                  label="Out-of-Scope"
                  multiline
                  value={`- Legacy application rewrites (Phase 2)\n- On-premise infrastructure disposal`}
                />
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="label-eyebrow">Stage Gate Overview</div>
              <ul className="mt-4 space-y-3">
                {stages.map((s) => {
                  const isDone = s.state === "done";
                  const isActive = s.state === "active";
                  return (
                    <li key={s.n} className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                          isDone
                            ? "bg-accent text-accent-foreground"
                            : isActive
                            ? "bg-accent text-accent-foreground ring-2 ring-accent/40"
                            : "border border-border bg-secondary/40 text-muted-foreground"
                        }`}
                      >
                        <span className="num-mono">{s.n}</span>
                      </div>
                      <span className={`text-sm ${isDone || isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {s.name}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <button className="mt-5 w-full rounded-md border border-accent/40 bg-accent-dim/40 py-2 text-sm text-accent hover:bg-accent-dim/60">
                View Stage Gates →
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ms" className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="label-eyebrow">{milestones.length} milestones</div>
            <AddMilestoneDialog defaultOwner={project.pm} onAdd={(m) => setMilestones((prev) => [...prev, m])} />
          </div>
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Milestone</TableHead><TableHead>Due</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead><TableHead>Depends on</TableHead></TableRow></TableHeader>
              <TableBody>{milestones.map((m) => (
                <TableRow key={m.name}>
                  <TableCell className="font-medium text-foreground">{m.name}</TableCell>
                  <TableCell>{m.date}</TableCell>
                  <TableCell>{m.owner}</TableCell>
                  <TableCell><RagBadge rag={m.rag} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.dep || "—"}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="manpower" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="label-eyebrow">Manpower requirements</div>
            <RequestResourcesDialog projectName={project.name} />
          </div>
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead><TableHead>FTE</TableHead><TableHead>Skill level</TableHead>
                  <TableHead>Period</TableHead><TableHead>Sourcing</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { r: "Solution Architect", f: 1.0, sk: "Senior", p: "Jun–Sep", src: "Internal",            s: "green", sl: "Confirmed" },
                  { r: "QA Engineer",        f: 2.0, sk: "Mid",    p: "Jul–Sep", src: "Internal + Subcontract", s: "green", sl: "Confirmed" },
                  { r: "Integration Dev",    f: 1.5, sk: "Mid",    p: "Jun–Aug", src: "Internal",            s: "green", sl: "Confirmed" },
                  { r: "Security Reviewer",  f: 0.5, sk: "Senior", p: "Aug",     src: "Subcontract",         s: "green", sl: "Confirmed" },
                  { r: "Change Manager",     f: 0.5, sk: "Mid",    p: "Sep",     src: "Internal",            s: "amber", sl: "Pending" },
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

        <TabsContent value="subs" className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { l: "Total Packages", v: String(subs.length) },
              { l: "Awarded", v: String(subs.filter((s) => s.status === "Awarded").length), c: "text-rag-green" },
              { l: "In Tender", v: String(subs.filter((s) => s.status === "In tender").length), c: "text-rag-amber" },
              { l: "Total Value", v: "$1.84M" },
            ].map((k) => (
              <div key={k.l} className="glass-card p-4">
                <div className="label-eyebrow">{k.l}</div>
                <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="label-eyebrow">Packages</div>
            <AddPackageDialog onAdd={(s) => setSubs((prev) => [...prev, { ...s, id: `SUB-${String(prev.length + 1).padStart(3, "0")}` }])} />
          </div>
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Package</TableHead><TableHead>Scope</TableHead><TableHead>Vendor</TableHead><TableHead>Value</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{subs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-foreground">{r.id}</TableCell>
                  <TableCell>{r.scope}</TableCell>
                  <TableCell className="text-muted-foreground">{r.vendor}</TableCell>
                  <TableCell className="num-mono">{r.value}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.period}</TableCell>
                  <TableCell><RagBadge rag={r.rag} label={r.status} /></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="trips" className="mt-5 space-y-4">
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
            <LogTripDialog onAdd={(t) => setTrips((prev) => [...prev, { ...t, id: `T-${String(prev.length + 1).padStart(2, "0")}` }])} />
          </div>
          <div className="glass-card overflow-hidden">
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
        </TabsContent>

        <TabsContent value="fin" className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { l: "Total CAPEX", v: "$2.40M" },
              { l: "Total OPEX", v: "$0.80M" },
              { l: "Committed", v: "$1.12M", c: "text-rag-amber" },
              { l: "Remaining", v: "$2.08M", c: "text-rag-green" },
            ].map((k) => (
              <div key={k.l} className="glass-card p-4">
                <div className="label-eyebrow">{k.l}</div>
                <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_360px]">
            <div className="glass-card p-5">
              <div className="label-eyebrow mb-3">Cost categories</div>
              <div className="space-y-3">
                {[
                  { c: "Labour", b: 1.20, a: 0.84, color: "bg-rag-green" },
                  { c: "Hardware", b: 0.90, a: 0.62, color: "bg-rag-blue" },
                  { c: "Software licenses", b: 0.40, a: 0.31, color: "bg-accent" },
                  { c: "Business trips", b: 0.10, a: 0.07, color: "bg-rag-amber" },
                  { c: "Contingency", b: 0.60, a: 0.26, color: "bg-muted-foreground" },
                ].map((r) => {
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

          {/* Revenue Plan */}
          <div className="glass-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="label-eyebrow">Revenue plan — linked to milestones</div>
              <div className="num-mono text-xs text-muted-foreground">Total planned: $3.20M</div>
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
                {[
                  { ms: "Discovery complete",   evt: "Advance payment (30%)", plan: 0.96, date: "May 02", s: "green",  sl: "Received",   act: 0.96 },
                  { ms: "Build phase 1",        evt: "Progress invoice (20%)", plan: 0.64, date: "Jun 30", s: "amber",  sl: "Pending",    act: null },
                  { ms: "UAT Sign-off",         evt: "Progress invoice (25%)", plan: 0.80, date: project.endDate, s: "blue",   sl: "Planned",    act: null },
                  { ms: "Go-live",              evt: "Final payment (25%)",    plan: 0.80, date: "Sep 14", s: "blue",   sl: "Planned",    act: null },
                ].map((r) => (
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
        </TabsContent>

        <TabsContent value="tender" className="mt-5 space-y-4">
          {/* KPI strip — live from packages state */}
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { l: "Draft Requests", v: String(packages.filter(p => p.status === "Draft").length), c: "text-muted-foreground" },
              { l: "In Tendering", v: String(packages.filter(p => p.status === "Sent for Tendering").length), c: "text-rag-amber" },
              { l: "Proposals Received", v: String(packages.filter(p => p.status === "Proposals Received").length), c: "text-accent" },
              { l: "Awarded", v: String(packages.filter(p => p.status === "Awarded").length), c: "text-rag-green" },
            ].map((k) => (
              <div key={k.l} className="glass-card p-4">
                <div className="label-eyebrow">{k.l}</div>
                <div className={`mt-1 text-lg font-medium num-mono ${k.c}`}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Header + New Request */}
          <div className="flex items-center justify-between">
            <div className="label-eyebrow">Packages</div>
            <Dialog open={newPkgOpen} onOpenChange={setNewPkgOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">+ New Request</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>New Tender Request</DialogTitle></DialogHeader>
                <div className="rounded-md border border-accent/20 bg-accent-dim/30 px-3 py-2 text-xs text-accent">
                  Project: <span className="font-medium">{project.name}</span>
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewPkgOpen(false)}>Cancel</Button>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleNewPackage}>Create Request</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Packages table with expandable proposal rows */}
          <div className="glass-card overflow-hidden">
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
                            {expandedPkg === pkg.id
                              ? <ChevronDown className="mr-1 h-3 w-3" />
                              : <ChevronRight className="mr-1 h-3 w-3" />}
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

                    {/* Expanded vendor proposal sub-rows */}
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
        </TabsContent>
      </Tabs>
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

function PlanningField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  const rows = multiline ? Math.max(3, value.split("\n").length) : 2;
  return (
    <div>
      <div className="mb-1.5 text-xs text-muted-foreground">{label}</div>
      <textarea
        defaultValue={value}
        rows={rows}
        className="w-full resize-none rounded-md border border-border bg-background/40 p-3 text-sm text-foreground focus:border-accent focus:outline-none"
      />
    </div>
  );
}

// ── v11 Types ─────────────────────────────────────────────────────────────────
type Milestone = { name: string; date: string; owner: string; rag: Rag; dep: string };
type SubPackage = { id: string; scope: string; vendor: string; value: string; period: string; rag: Rag; status: string };
type Trip = { id: string; purpose: string; dest: string; dates: string; travelers: string; cost: string; rag: Rag; status: string };
type RaidItem = { id: string; title: string; kind: "Risk" | "Issue"; score: number; owner: string; status: string; rag: Rag };
type DocItem = { name: string; category: string; size: string; when: string };
type StatusReport = { week: number; by: string; when: string; rag: Rag; text: string };
type ChangeReq = { id: string; title: string; impact: string; timeline: string; budget: string; decision: "Under review" | "Approved" | "Rejected" };
type Stakeholder = { name: string; org: string; influence: "High" | "Medium" | "Low"; interest: "High" | "Medium" | "Low"; strategy: string };
type Lesson = { tag: string; text: string; by: string; when: string };

// ── Add Milestone dialog ──────────────────────────────────────────────────────
function AddMilestoneDialog({ defaultOwner, onAdd }: { defaultOwner: string; onAdd: (m: Milestone) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [owner, setOwner] = useState(defaultOwner);
  const [status, setStatus] = useState("Not Started");
  const [dep, setDep] = useState("");
  const ragMap: Record<string, Rag> = { "Not Started": "blue", "In Progress": "amber", Completed: "green", Overdue: "red" };
  function submit() {
    if (!name.trim()) { toast.error("Milestone name is required"); return; }
    onAdd({ name: name.trim(), date: date || "TBD", owner: owner || defaultOwner, rag: ragMap[status] ?? "blue", dep });
    toast.success("Milestone added");
    setOpen(false); setName(""); setDate(""); setOwner(defaultOwner); setStatus("Not Started"); setDep("");
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Add Milestone</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Milestone</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Milestone name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. UAT Sign-off" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Due date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><Label>Owner</Label><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
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
            <div><Label>Depends on</Label><Input value={dep} onChange={(e) => setDep(e.target.value)} placeholder="—" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Add Milestone</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Package dialog ────────────────────────────────────────────────────────
function AddPackageDialog({ onAdd }: { onAdd: (s: Omit<SubPackage, "id">) => void }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState(""); const [vendor, setVendor] = useState("");
  const [value, setValue] = useState(""); const [period, setPeriod] = useState("");
  const [status, setStatus] = useState("Planned");
  const ragMap: Record<string, Rag> = { Planned: "blue", "In Tender": "amber", Awarded: "green" };
  function submit() {
    if (!scope.trim()) { toast.error("Scope is required"); return; }
    onAdd({ scope: scope.trim(), vendor: vendor || "—", value: value || "TBD", period: period || "—", rag: ragMap[status] ?? "blue", status });
    toast.success("Subcontracted package added");
    setOpen(false); setScope(""); setVendor(""); setValue(""); setPeriod(""); setStatus("Planned");
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Add Package</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Subcontracted Package</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Scope</Label><Input value={scope} onChange={(e) => setScope(e.target.value)} placeholder="e.g. Network cabling" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Vendor</Label><Input value={vendor} onChange={(e) => setVendor(e.target.value)} /></div>
            <div><Label>Est. Value</Label><Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="$120K" /></div>
            <div><Label>Period</Label><Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Jul–Aug" /></div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="In Tender">In Tender</SelectItem>
                  <SelectItem value="Awarded">Awarded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Add Package</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Log Trip dialog ───────────────────────────────────────────────────────────
function LogTripDialog({ onAdd }: { onAdd: (t: Omit<Trip, "id">) => void }) {
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState(""); const [dest, setDest] = useState("");
  const [dates, setDates] = useState(""); const [cost, setCost] = useState(""); const [travelers, setTravelers] = useState("");
  function submit() {
    if (!purpose.trim() || !dest.trim()) { toast.error("Purpose and destination are required"); return; }
    onAdd({ purpose: purpose.trim(), dest: dest.trim(), dates: dates || "TBD", travelers: travelers || "—", cost: cost || "TBD", rag: "blue", status: "Planned" });
    toast.success("Business trip logged");
    setOpen(false); setPurpose(""); setDest(""); setDates(""); setCost(""); setTravelers("");
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
          <div><Label>Travelers</Label><Input value={travelers} onChange={(e) => setTravelers(e.target.value)} placeholder="Names…" /></div>
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
      <div className="glass-card overflow-hidden">
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
  project, reports, setReports, externalOpen, onExternalOpenChange,
}: {
  project: typeof projects[number];
  reports: StatusReport[];
  setReports: React.Dispatch<React.SetStateAction<StatusReport[]>>;
  externalOpen: boolean;
  onExternalOpenChange: (open: boolean) => void;
}) {
  const nextWeek = Math.max(...reports.map((r) => r.week), 0) + 1;
  const [rag, setRag] = useState<Rag>("green");
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim()) { toast.error("Status narrative is required"); return; }
    setReports((prev) => [{ week: nextWeek, by: project.pm, when: "Just now", rag, text: text.trim() }, ...prev]);
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
      <div className="glass-card overflow-hidden">
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
function ProcurementProjectTab() {
  const contracts = [
    { id: "CT-2026-038", vendor: "Oracle Consulting", value: "$680K", end: "Dec 12", rag: "green" as Rag, status: "Active" },
    { id: "CT-2026-029", vendor: "Cyberguard", value: "$140K", end: "Sep 30", rag: "green" as Rag, status: "Active" },
    { id: "CT-2026-031", vendor: "LearnSphere", value: "$95K", end: "Aug 25", rag: "amber" as Rag, status: "Expiring" },
  ];
  const rfps = [
    { id: "RFP-014", title: "Robotics Integration Partner", type: "RFP", due: "Jun 28", bidders: 4, rag: "amber" as Rag, status: "Open" },
    { id: "RFP-016", title: "Training services rollout", type: "RFP", due: "Jul 12", bidders: 2, rag: "amber" as Rag, status: "Open" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { l: "Active Contracts", v: String(contracts.filter((c) => c.status === "Active").length), c: "text-rag-green" },
          { l: "Open RFPs", v: String(rfps.length), c: "text-rag-amber" },
          { l: "Total Committed", v: "$915K", c: "text-foreground" },
        ].map((k) => (
          <div key={k.l} className="glass-card p-4">
            <div className="label-eyebrow">{k.l}</div>
            <div className={`mt-1 text-lg font-medium num-mono ${k.c}`}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
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

      <div className="glass-card overflow-hidden">
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

      <div className="glass-card overflow-hidden">
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

// ── Lessons Learned tab ───────────────────────────────────────────────────────
function LessonsTab({ project }: { project: typeof projects[number] }) {
  const [items, setItems] = useState<Lesson[]>([
    { tag: "Process", text: "Earlier vendor SLA reviews surface delays sooner.", by: project.pm, when: "May 18" },
    { tag: "People", text: "Pair architect with junior dev for knowledge transfer.", by: "Mei Chen", when: "May 14" },
    { tag: "Tech", text: "Use staging mirror to validate integration before UAT.", by: "Priya Iyer", when: "May 11" },
    { tag: "Governance", text: "Bi-weekly steering tempo too slow for critical phase.", by: project.pm, when: "May 09" },
  ]);
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState("Process");
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim()) { toast.error("Lesson text is required"); return; }
    setItems((prev) => [{ tag, text: text.trim(), by: project.pm, when: "Just now" }, ...prev]);
    toast.success("Lesson recorded");
    setOpen(false); setText(""); setTag("Process");
  }

  return (
    <div className="space-y-3">
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
                <Select value={tag} onValueChange={setTag}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Process", "People", "Tech", "Governance", "Risk", "Communication", "Planning"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Lesson</Label><Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="What did we learn? What would we do differently?" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Add Lesson</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((l, i) => (
          <div key={i} className="glass-card p-4 text-sm">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-accent/40 bg-accent-dim text-accent">{l.tag}</Badge>
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
  );
}
