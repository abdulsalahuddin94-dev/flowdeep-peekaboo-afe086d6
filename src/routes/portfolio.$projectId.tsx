import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { RagBadge } from "@/components/RagBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, FileText, MessageSquare, Paperclip, Download } from "lucide-react";
import { projects } from "@/lib/mock-data";

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
          <Tabs defaultValue="init" orientation="horizontal">
            <TabsList className="bg-secondary/30">
              {["init", "ms", "manpower", "subs", "trips", "fin", "tender"].map((k, i) => (
                <TabsTrigger key={k} value={k} className="text-xs">
                  {["Initiation", "Milestones & Deps", "Manpower", "Subcontracted", "Trips Plan", "Financial Planning", "Tender Packages"][i]}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="init" className="mt-3 glass-card p-5 text-sm">
              <div className="label-eyebrow mb-2">Initiation</div>
              <p className="text-muted-foreground">Project charter signed. Kick-off held 2026-04-12. PMO baseline locked at v3.</p>
            </TabsContent>
            <TabsContent value="ms" className="mt-3 glass-card overflow-hidden">
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
            <TabsContent value="manpower" className="mt-3 glass-card p-5 text-sm">
              <div className="label-eyebrow mb-3">Manpower requirements</div>
              <Table>
                <TableHeader><TableRow><TableHead>Role</TableHead><TableHead>FTE</TableHead><TableHead>Skill level</TableHead><TableHead>Period</TableHead><TableHead>Sourcing</TableHead></TableRow></TableHeader>
                <TableBody>
                  <TableRow><TableCell>Solution Architect</TableCell><TableCell>1.0</TableCell><TableCell>Senior</TableCell><TableCell>Jun–Sep</TableCell><TableCell>Internal</TableCell></TableRow>
                  <TableRow><TableCell>QA Engineer</TableCell><TableCell>2.0</TableCell><TableCell>Mid</TableCell><TableCell>Jul–Sep</TableCell><TableCell>Internal + Subcontract</TableCell></TableRow>
                  <TableRow><TableCell>Integration Dev</TableCell><TableCell>1.5</TableCell><TableCell>Mid</TableCell><TableCell>Jun–Aug</TableCell><TableCell>Internal</TableCell></TableRow>
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="subs" className="mt-3 glass-card p-5 text-sm text-muted-foreground">Subcontracted packages plan — civil works, integration testing, training rollout.</TabsContent>
            <TabsContent value="trips" className="mt-3 glass-card p-5 text-sm text-muted-foreground">Business trips: 4 planned. Site visits (Jun, Aug), training (Jul), go-live support (Sep).</TabsContent>
            <TabsContent value="fin" className="mt-3 glass-card p-5 text-sm text-muted-foreground">CAPEX $2.4M / OPEX $0.8M. Quarterly milestone-linked revenue recognition.</TabsContent>
            <TabsContent value="tender" className="mt-3 glass-card p-5 text-sm text-muted-foreground">Tender packages: Hardware (RFP-013), Integration partner (RFP-014).</TabsContent>
          </Tabs>
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


        <TabsContent value="Team & Allocation" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead>Allocation %</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{[
              { n: project.pm, r: "PM", a: 80, p: "Apr–Sep", s: "green" },
              { n: "Mei Chen", r: "Security Lead", a: 40, p: "May–Aug", s: "green" },
              { n: "Priya Iyer", r: "Tech Lead", a: 100, p: "Jun–Sep", s: "amber" },
              { n: "Diego Ortiz", r: "BI Engineer", a: 30, p: "Jul–Aug", s: "blue" },
            ].map((m) => (
              <TableRow key={m.n}><TableCell className="font-medium">{m.n}</TableCell><TableCell>{m.r}</TableCell><TableCell><div className="flex items-center gap-2"><Progress value={m.a} className="h-1.5 w-32" /><span className="num-mono text-xs">{m.a}%</span></div></TableCell><TableCell>{m.p}</TableCell><TableCell><RagBadge rag={m.s as any} /></TableCell></TableRow>
            ))}</TableBody>
          </Table>
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
