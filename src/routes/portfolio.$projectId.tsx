import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, FileText, MessageSquare, Paperclip, Download, UserPlus } from "lucide-react";
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
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">Submit status</Button>
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

        <TabsContent value="Risks & Issues" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Score</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{[
              { id: "R-091", t: "Vendor delivery delay > 4 weeks", k: "Risk", s: 20, o: project.pm, st: "Open", c: "red" },
              { id: "I-044", t: "Test env outage", k: "Issue", s: 12, o: "Mei Chen", st: "In progress", c: "amber" },
              { id: "R-085", t: "Audit finding remediation overrun", k: "Risk", s: 16, o: "Mei Chen", st: "Open", c: "amber" },
            ].map((r) => (
              <TableRow key={r.id}><TableCell className="num-mono text-xs">{r.id}</TableCell><TableCell className="font-medium">{r.t}</TableCell><TableCell>{r.k}</TableCell><TableCell><Badge variant="outline" className="border-border bg-secondary/40 num-mono">{r.s}</Badge></TableCell><TableCell>{r.o}</TableCell><TableCell><RagBadge rag={r.c as any} label={r.st} /></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="Documents" className="mt-5">
          <div className="glass-card p-5">
            <div className="label-eyebrow mb-3">Repository</div>
            <ul className="divide-y divide-border text-sm">
              {[
                ["Project Charter v3.pdf", "Charter", "2.4 MB"],
                ["Risk Register.xlsx", "RAID", "0.8 MB"],
                ["Vendor Contract — Oracle Consulting.pdf", "Contract", "1.1 MB"],
                ["Test Plan v2.docx", "QA", "0.6 MB"],
                ["Steering Committee Deck — May.pdf", "Governance", "5.2 MB"],
              ].map(([n, k, s]) => (
                <li key={n} className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2 text-foreground"><FileText className="h-4 w-4 text-accent" />{n}</span>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="outline" className="border-border bg-secondary/40">{k}</Badge>{s}
                    <Button size="icon" variant="ghost" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="Status Reports" className="mt-5 space-y-3">
          {[18, 17, 16].map((w) => (
            <div key={w} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Week {w} status report</div>
                  <div className="text-xs text-muted-foreground">Submitted by {project.pm} · 3 days ago</div>
                </div>
                <RagBadge rag={project.rag} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Integration layer testing delayed by 1 week. Fallback plan in review with IT Director. No impact on go-live yet.</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="Change Requests" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>CR</TableHead><TableHead>Title</TableHead><TableHead>Impact</TableHead><TableHead>Stage</TableHead><TableHead>Decision</TableHead></TableRow></TableHeader>
            <TableBody>{[
              { id: "CR-014", t: "Add data warehouse layer", i: "+$120K · +3 weeks", s: "Approved", c: "green" },
              { id: "CR-013", t: "Reduce UAT to one week", i: "-1 week · risk +", s: "Rejected", c: "red" },
              { id: "CR-012", t: "Add 2 QA engineers", i: "+$60K", s: "Under review", c: "amber" },
            ].map((r) => (
              <TableRow key={r.id}><TableCell className="num-mono text-xs">{r.id}</TableCell><TableCell>{r.t}</TableCell><TableCell className="text-xs text-muted-foreground">{r.i}</TableCell><TableCell><RagBadge rag={r.c as any} label={r.s} /></TableCell><TableCell><Button size="sm" variant="outline">Open</Button></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="Procurement" className="mt-5 glass-card p-5 text-sm text-muted-foreground">
          Linked contracts: CT-2026-038 (Oracle Consulting), CT-2026-029 (Cyberguard). Open RFP-014 (Robotics Integration Partner).
        </TabsContent>

        <TabsContent value="Stakeholders" className="mt-5 glass-card p-5">
          <div className="label-eyebrow mb-3">Stakeholder matrix</div>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Org</TableHead><TableHead>Influence</TableHead><TableHead>Interest</TableHead><TableHead>Strategy</TableHead></TableRow></TableHeader>
            <TableBody>{[
              ["V. Mansour", "Exec Sponsor", "High", "High", "Manage closely"],
              ["R. Hadid", "Client (ACME)", "High", "Medium", "Keep satisfied"],
              ["IT Steering", "Internal", "Medium", "High", "Keep informed"],
              ["Finance Board", "Internal", "High", "Low", "Inform monthly"],
            ].map((r) => (
              <TableRow key={r[0]}><TableCell className="font-medium">{r[0]}</TableCell><TableCell>{r[1]}</TableCell><TableCell>{r[2]}</TableCell><TableCell>{r[3]}</TableCell><TableCell className="text-xs">{r[4]}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="Lessons Learned" className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            { tag: "Process", n: "Earlier vendor SLA reviews surface delays sooner." },
            { tag: "People", n: "Pair architect with junior dev for knowledge transfer." },
            { tag: "Tech", n: "Use staging mirror to validate integration before UAT." },
            { tag: "Governance", n: "Bi-weekly steering tempo too slow for critical phase." },
          ].map((l) => (
            <div key={l.n} className="glass-card p-4 text-sm">
              <Badge variant="outline" className="border-accent/40 bg-accent-dim text-accent">{l.tag}</Badge>
              <p className="mt-2 text-foreground">{l.n}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" /> 3 comments<Paperclip className="ml-3 h-3 w-3" /> 1 attachment
              </div>
            </div>
          ))}
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
              <div className="text-sm font-medium text-foreground">Project Summary</div>
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

        <TabsContent value="ms" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Milestone</TableHead><TableHead>Due</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead><TableHead>Depends on</TableHead></TableRow></TableHeader>
            <TableBody>{[
              { n: "Discovery complete", d: "May 02", o: "Sara", s: "green", dep: "—" },
              { n: "Build phase 1", d: "Jun 30", o: "Mei", s: "amber", dep: "Discovery" },
              { n: "UAT Sign-off", d: project.endDate, o: project.pm, s: project.rag === "red" ? "red" : "amber", dep: "Build P1" },
              { n: "Go-live", d: "Sep 14", o: project.pm, s: "blue", dep: "UAT" },
            ].map((m) => (
              <TableRow key={m.n}><TableCell className="font-medium text-foreground">{m.n}</TableCell><TableCell>{m.d}</TableCell><TableCell>{m.o}</TableCell><TableCell><RagBadge rag={m.s as any} /></TableCell><TableCell className="text-xs text-muted-foreground">{m.dep}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
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
              { l: "Total Packages", v: "6" },
              { l: "Awarded", v: "3", c: "text-rag-green" },
              { l: "In Tender", v: "2", c: "text-rag-amber" },
              { l: "Total Value", v: "$1.84M" },
            ].map((k) => (
              <div key={k.l} className="glass-card p-4">
                <div className="label-eyebrow">{k.l}</div>
                <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
              </div>
            ))}
          </div>
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Package</TableHead><TableHead>Scope</TableHead><TableHead>Vendor</TableHead><TableHead>Value</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{[
                { p: "SUB-001", s: "Civil works & site prep", v: "Acme Construction", val: "$420K", per: "Jun–Jul", st: "green", stl: "Awarded" },
                { p: "SUB-002", s: "Integration testing", v: "TestLabs Co.", val: "$180K", per: "Jul–Aug", st: "green", stl: "Awarded" },
                { p: "SUB-003", s: "Training rollout (40 staff)", v: "LearnSphere", val: "$95K", per: "Aug", st: "green", stl: "Awarded" },
                { p: "SUB-004", s: "Network cabling", v: "—", val: "$220K", per: "Jun", st: "amber", stl: "In tender" },
                { p: "SUB-005", s: "Security audit & pen-test", v: "—", val: "$140K", per: "Sep", st: "amber", stl: "In tender" },
                { p: "SUB-006", s: "Go-live support (8 wks)", v: "—", val: "$785K", per: "Sep–Oct", st: "blue", stl: "Planned" },
              ].map((r) => (
                <TableRow key={r.p}>
                  <TableCell className="font-medium text-foreground">{r.p}</TableCell>
                  <TableCell>{r.s}</TableCell>
                  <TableCell className="text-muted-foreground">{r.v}</TableCell>
                  <TableCell className="num-mono">{r.val}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.per}</TableCell>
                  <TableCell><RagBadge rag={r.st as any} label={r.stl} /></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="trips" className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { l: "Trips Planned", v: "4" },
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
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Trip</TableHead><TableHead>Purpose</TableHead><TableHead>Destination</TableHead><TableHead>Dates</TableHead><TableHead>Travelers</TableHead><TableHead>Cost</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{[
                { id: "T-01", p: "Site survey", d: "Dubai, UAE", dt: "Jun 12 – Jun 15", t: "Sara, Mei", c: "$5.2K", s: "green", sl: "Completed" },
                { id: "T-02", p: "Vendor workshop", d: "Munich, DE", dt: "Jul 08 – Jul 11", t: "K. Bauer", c: "$3.0K", s: "green", sl: "Completed" },
                { id: "T-03", p: "User training", d: "Riyadh, KSA", dt: "Aug 18 – Aug 22", t: "H. Tanaka, Priya, +2", c: "$9.8K", s: "amber", sl: "Booked" },
                { id: "T-04", p: "Go-live support", d: "Doha, QA", dt: "Sep 14 – Sep 28", t: "John, Mei, +2", c: "$6.5K", s: "blue", sl: "Planned" },
              ].map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-foreground">{r.id}</TableCell>
                  <TableCell>{r.p}</TableCell>
                  <TableCell>{r.d}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.dt}</TableCell>
                  <TableCell className="text-xs">{r.t}</TableCell>
                  <TableCell className="num-mono">{r.c}</TableCell>
                  <TableCell><RagBadge rag={r.s as any} label={r.sl} /></TableCell>
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
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { l: "Active RFPs", v: "3", c: "text-rag-amber" },
              { l: "Bids Received", v: "11" },
              { l: "Awarded", v: "2", c: "text-rag-green" },
              { l: "Total Value", v: "$1.62M" },
            ].map((k) => (
              <div key={k.l} className="glass-card p-4">
                <div className="label-eyebrow">{k.l}</div>
                <div className={`mt-1 text-lg font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div>
              </div>
            ))}
          </div>
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>RFP</TableHead><TableHead>Package</TableHead><TableHead>Issued</TableHead><TableHead>Closes</TableHead><TableHead>Bids</TableHead><TableHead>Est. Value</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{[
                { id: "RFP-013", p: "Hardware procurement", i: "Apr 18", c: "May 24", b: 5, v: "$420K", s: "green", sl: "Awarded" },
                { id: "RFP-014", p: "Integration partner", i: "May 02", c: "Jun 06", b: 4, v: "$680K", s: "amber", sl: "Evaluating" },
                { id: "RFP-015", p: "Cybersecurity audit", i: "May 15", c: "Jun 14", b: 2, v: "$140K", s: "amber", sl: "Open" },
                { id: "RFP-016", p: "Training services", i: "Jun 01", c: "Jun 28", b: 0, v: "$95K", s: "blue", sl: "Draft" },
                { id: "RFP-017", p: "Managed support (1y)", i: "—", c: "Jul 12", b: 0, v: "$285K", s: "blue", sl: "Planned" },
              ].map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-foreground">{r.id}</TableCell>
                  <TableCell>{r.p}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.i}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.c}</TableCell>
                  <TableCell className="num-mono">{r.b}</TableCell>
                  <TableCell className="num-mono">{r.v}</TableCell>
                  <TableCell><RagBadge rag={r.s as any} label={r.sl} /></TableCell>
                </TableRow>
              ))}</TableBody>
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
