import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RagBadge, RagDot } from "@/components/RagBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, LayoutGrid, List, GanttChartSquare, Search, Filter, X } from "lucide-react";
import { projects, pipelineItems, type Project, type Rag } from "@/lib/mock-data";
import { useProjects } from "@/lib/projects-store";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/portfolio/")({
  component: PortfolioPage,
  head: () => ({ meta: [{ title: "Portfolio — Nexus PMO" }, { name: "description", content: "All active projects, governance, and business case intake across the enterprise portfolio." }] }),
});

const LINES = ["All", "Software Solutions", "EPC", "Consultation", "Maintenance"] as const;
const VIEWS = ["grid", "list", "gantt"] as const;
type View = typeof VIEWS[number];

const ALL_RAGS = [
  { v: "green", l: "On Track" }, { v: "amber", l: "At Risk" },
  { v: "red", l: "Critical" },   { v: "blue", l: "Not Started" }, { v: "grey", l: "On Hold" },
] as const;
const ALL_STAGES = ["Initiation", "Planning", "Execution", "Monitoring", "Closure"] as const;
const ALL_TAGS    = Array.from(new Set(projects.flatMap((p) => p.tags)));
const ALL_DEPTS   = Array.from(new Set(projects.map((p) => p.department)));
const ALL_CLIENTS = Array.from(new Set(projects.map((p) => p.client).filter(Boolean))) as string[];

function PortfolioPage() {
  const { projects: projectList, addProject } = useProjects();
  return (
    <div>
      <PageHeader
        title="Portfolio"
        subtitle={`${projectList.length} active projects · FY2026`}
        actions={
          <div className="flex gap-2">
            <NewProjectDialog onAdd={addProject} />
          </div>
        }
      />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="mine">My Projects</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="bc">Business Cases</TabsTrigger>
          <TabsTrigger value="gov">Governance History</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-5"><AllProjectsTab projectList={projectList} /></TabsContent>
        <TabsContent value="mine" className="mt-5"><AllProjectsTab projectList={projectList} restrict /></TabsContent>
        <TabsContent value="archived" className="mt-5"><ArchivedTab /></TabsContent>
        <TabsContent value="bc" className="mt-5"><BusinessCasesTab /></TabsContent>
        <TabsContent value="gov" className="mt-5"><GovernanceTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function AllProjectsTab({ restrict, projectList }: { restrict?: boolean; projectList: Project[] }) {
  const [line, setLine]           = useState<(typeof LINES)[number]>("All");
  const [view, setView]           = useState<View>("grid");
  const [query, setQuery]         = useState("");
  const [active, setActive]       = useState<Project | null>(null);
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);
  const [ragFilter, setRagFilter]   = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter]   = useState<string[]>([]);
  const [deptFilter, setDeptFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  const activeCount = ragFilter.length + stageFilter.length + tagFilter.length + (deptFilter ? 1 : 0) + (clientFilter ? 1 : 0);

  const list = useMemo(() => {
    let l = projectList;
    if (restrict) l = l.slice(0, 6);
    if (line !== "All") l = l.filter((p) => p.businessLine === line);
    if (query) l = l.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    if (ragFilter.length > 0) l = l.filter((p) => ragFilter.includes(p.rag));
    if (stageFilter.length > 0) l = l.filter((p) => stageFilter.includes(p.stage));
    if (tagFilter.length > 0) l = l.filter((p) => p.tags.some((t) => tagFilter.includes(t)));
    if (deptFilter) l = l.filter((p) => p.department === deptFilter);
    if (clientFilter) l = l.filter((p) => p.client === clientFilter);
    return l;
  }, [projectList, line, query, restrict, ragFilter, stageFilter, tagFilter, deptFilter, clientFilter]);

  function clearAll() { setRagFilter([]); setStageFilter([]); setTagFilter([]); setDeptFilter(""); setClientFilter(""); }

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: "Active", v: projectList.length },
          { l: "On Track", v: projectList.filter((p) => p.rag === "green").length, c: "rag-green" },
          { l: "Budget Used", v: `$${projectList.reduce((s, p) => s + p.budgetUsed, 0).toFixed(1)}M / $${projectList.reduce((s, p) => s + p.budgetTotal, 0).toFixed(0)}M` },
          { l: "Critical", v: projectList.filter((p) => p.rag === "red").length, c: "rag-red", pulse: true },
        ].map((m) => (
          <div key={m.l} className="glass-card p-4">
            <div className="label-eyebrow">{m.l}</div>
            <div className="mt-1 flex items-center gap-2">
              {m.c && <span className={`h-2 w-2 rounded-full bg-${m.c} ${m.pulse ? "pulse-dot" : ""}`} />}
              <span className="text-xl font-medium num-mono text-foreground">{m.v}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {LINES.map((l) => (
          <button key={l} onClick={() => setLine(l)}
            className={`rounded-full border px-3 py-1 text-xs ${line === l ? "border-accent bg-accent text-accent-foreground" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"}`}>
            {l}
          </button>
        ))}
        <div className="relative ml-auto w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search projects…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => setFilterOpen((o) => !o)}
          className={activeCount > 0 ? "border-accent/40 bg-accent-dim text-accent" : ""}
        >
          <Filter className="mr-1 h-3.5 w-3.5" />
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
        <div className="flex overflow-hidden rounded-md border border-border bg-secondary/40">
          {([["grid", LayoutGrid], ["list", List], ["gantt", GanttChartSquare]] as const).map(([k, Icon]) => (
            <button key={k} onClick={() => setView(k as View)} className={`p-2 ${view === k ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}><Icon className="h-4 w-4" /></button>
          ))}
        </div>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div className="mb-3 rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
          {/* RAG */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 w-14 text-xs text-muted-foreground">RAG</span>
            {ALL_RAGS.map(({ v, l }) => {
              const on = ragFilter.includes(v);
              const dot = v === "green" ? "bg-rag-green" : v === "amber" ? "bg-rag-amber" : v === "red" ? "bg-rag-red" : v === "blue" ? "bg-rag-blue" : "bg-muted-foreground";
              return (
                <button key={v} onClick={() => setRagFilter((prev) => on ? prev.filter((x) => x !== v) : [...prev, v])}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${on ? "border-accent bg-accent text-accent-foreground" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{l}
                </button>
              );
            })}
          </div>

          {/* Stage */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 w-14 text-xs text-muted-foreground">Stage</span>
            {ALL_STAGES.map((s) => {
              const on = stageFilter.includes(s);
              return (
                <button key={s} onClick={() => setStageFilter((prev) => on ? prev.filter((x) => x !== s) : [...prev, s])}
                  className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-accent bg-accent text-accent-foreground" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"}`}>
                  {s}
                </button>
              );
            })}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 w-14 text-xs text-muted-foreground">Tags</span>
            {ALL_TAGS.map((t) => {
              const on = tagFilter.includes(t);
              return (
                <button key={t} onClick={() => setTagFilter((prev) => on ? prev.filter((x) => x !== t) : [...prev, t])}
                  className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-accent bg-accent text-accent-foreground" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"}`}>
                  {t}
                </button>
              );
            })}
          </div>

          {/* Dept + Client + Clear */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={deptFilter || "all"} onValueChange={(v) => setDeptFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Department…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {ALL_DEPTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={clientFilter || "all"} onValueChange={(v) => setClientFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Client…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {ALL_CLIENTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {activeCount > 0 && (
              <button className="ml-auto text-xs text-muted-foreground hover:text-rag-red" onClick={clearAll}>Clear all</button>
            )}
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {ragFilter.map((v) => {
            const label = ALL_RAGS.find((r) => r.v === v)?.l ?? v;
            return (
              <span key={v} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
                {label}<button onClick={() => setRagFilter((p) => p.filter((x) => x !== v))} className="ml-0.5 hover:text-rag-red"><X className="h-3 w-3" /></button>
              </span>
            );
          })}
          {stageFilter.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
              {s}<button onClick={() => setStageFilter((p) => p.filter((x) => x !== s))} className="ml-0.5 hover:text-rag-red"><X className="h-3 w-3" /></button>
            </span>
          ))}
          {tagFilter.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
              {t}<button onClick={() => setTagFilter((p) => p.filter((x) => x !== t))} className="ml-0.5 hover:text-rag-red"><X className="h-3 w-3" /></button>
            </span>
          ))}
          {deptFilter && (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
              Dept: {deptFilter}<button onClick={() => setDeptFilter("")} className="ml-0.5 hover:text-rag-red"><X className="h-3 w-3" /></button>
            </span>
          )}
          {clientFilter && (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
              Client: {clientFilter}<button onClick={() => setClientFilter("")} className="ml-0.5 hover:text-rag-red"><X className="h-3 w-3" /></button>
            </span>
          )}
        </div>
      )}

      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <Filter className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No projects match the current filters.</p>
          <button className="text-xs text-accent hover:underline" onClick={clearAll}>Clear all filters</button>
        </div>
      )}

      {view === "grid" && list.length > 0 && <ProjectGrid items={list} onOpen={(p) => navigate({ to: "/portfolio/$projectId", params: { projectId: p.id } })} />}
      {view === "list" && list.length > 0 && <ProjectListView items={list} onOpen={(p) => navigate({ to: "/portfolio/$projectId", params: { projectId: p.id } })} />}
      {view === "gantt" && list.length > 0 && <GanttView items={list} />}
    </>
  );
}

function ProjectGrid({ items, onOpen }: { items: Project[]; onOpen: (p: Project) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <button key={p.id} onClick={() => onOpen(p)} className="glass-card group flex flex-col p-4 text-left">
          <div className="flex items-start justify-between gap-2">
            <RagBadge rag={p.rag} />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.stage}</span>
          </div>
          <h3 className="mt-2 line-clamp-2 text-base font-medium text-foreground group-hover:text-accent">{p.name}</h3>
          <div className="mt-1 text-xs text-muted-foreground">{p.businessLine} · {p.department}</div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span className="num-mono text-foreground">{p.progress}%</span></div>
            <Progress value={p.progress} className="h-1.5" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div><div className="label-eyebrow">Budget</div><div className="num-mono text-foreground">${p.budgetUsed.toFixed(1)}M / ${p.budgetTotal.toFixed(1)}M</div></div>
            <div><div className="label-eyebrow">End</div><div className="text-foreground">{p.endDate}</div></div>
          </div>
          {p.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {p.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-accent/20 bg-accent-dim/30 px-1.5 py-px text-[10px] text-accent">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{p.risks} risks</span><span>{p.issues} issues</span>
            </div>
            <Avatar className="h-6 w-6"><AvatarFallback className="bg-accent-dim text-[10px] text-accent">{p.pmAvatar}</AvatarFallback></Avatar>
          </div>
        </button>
      ))}
    </div>
  );
}

function ProjectListView({ items, onOpen }: { items: Project[]; onOpen: (p: Project) => void }) {
  return (
    <div className="">
      <Table>
        <TableHeader><TableRow>
          <TableHead className="w-6" /><TableHead>Project</TableHead><TableHead>Business Line</TableHead>
          <TableHead>PM</TableHead><TableHead>Department</TableHead><TableHead>Progress</TableHead>
          <TableHead>Budget</TableHead><TableHead>End</TableHead><TableHead>RAID</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {items.map((p) => (
            <TableRow key={p.id} onClick={() => onOpen(p)} className="cursor-pointer hover:bg-accent-dim/40">
              <TableCell><RagDot rag={p.rag} /></TableCell>
              <TableCell className="font-medium text-foreground">{p.name}</TableCell>
              <TableCell className="text-muted-foreground">{p.businessLine}</TableCell>
              <TableCell>{p.pm}</TableCell>
              <TableCell className="text-muted-foreground">{p.department}</TableCell>
              <TableCell className="w-40"><div className="flex items-center gap-2"><Progress value={p.progress} className="h-1.5" /><span className="num-mono text-xs">{p.progress}%</span></div></TableCell>
              <TableCell className="num-mono text-xs">${p.budgetUsed.toFixed(1)}/${p.budgetTotal.toFixed(1)}M</TableCell>
              <TableCell className="text-xs text-muted-foreground">{p.endDate}</TableCell>
              <TableCell className="text-xs">{p.risks + p.issues}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function GanttView({ items }: { items: Project[] }) {
  return (
    <div className="glass-card overflow-x-auto p-4">
      <div className="mb-2 grid grid-cols-[180px_repeat(12,minmax(40px,1fr))] gap-px text-[10px] text-muted-foreground">
        <div></div>
        {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map((m, i) => (
          <div key={i} className="text-center">{m}</div>
        ))}
      </div>
      {items.map((p, i) => {
        const start = (i * 7) % 9;
        const length = 3 + (i % 6);
        const color = p.rag === "green" ? "#10B981" : p.rag === "amber" ? "#F59E0B" : p.rag === "red" ? "#EF4444" : p.rag === "blue" ? "#3B82F6" : "#64748B";
        return (
          <div key={p.id} className="grid grid-cols-[180px_repeat(12,minmax(40px,1fr))] items-center gap-px py-1 text-xs">
            <div className="truncate pr-2 text-foreground">{p.name}</div>
            {Array.from({ length: 12 }).map((_, c) => (
              <div key={c} className="h-5 border-l border-border/40">
                {c >= start && c < start + length && <div className="h-full rounded-sm" style={{ background: color, opacity: 0.7 }} />}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function ProjectSlideOver({ project, onClose }: { project: Project | null; onClose: () => void }) {
  return (
    <Sheet open={!!project} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[480px] overflow-y-auto bg-surface text-foreground sm:max-w-[480px]">
        {project && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2"><RagBadge rag={project.rag} /><span className="text-xs text-muted-foreground">{project.stage}</span></div>
              <h2 className="mt-2 text-lg font-medium">{project.name}</h2>
              <p className="text-xs text-muted-foreground">{project.department} · PM: {project.pm}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-background/30 p-3">
                <div className="label-eyebrow">Completion</div>
                <div className="mt-1 text-2xl font-medium num-mono">{project.progress}%</div>
                <Progress value={project.progress} className="mt-1 h-1.5" />
              </div>
              <div className="rounded-md border border-border bg-background/30 p-3">
                <div className="label-eyebrow">Budget burn</div>
                <div className="mt-1 num-mono">${project.budgetUsed.toFixed(1)}M / ${project.budgetTotal.toFixed(1)}M</div>
                <div className="mt-1 text-xs text-rag-amber">▲ +4% vs plan</div>
              </div>
            </div>

            <div>
              <div className="label-eyebrow mb-2">Top risks (3)</div>
              <ul className="space-y-2 text-sm">
                {[
                  { t: "Vendor delivery delay", s: 8, st: "Open", c: "red" },
                  { t: "Scope creep risk", s: 6, st: "Mitig.", c: "amber" },
                  { t: "Key resource gap", s: 5, st: "Open", c: "amber" },
                ].map((r, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-md border border-border bg-background/30 p-2">
                    <span className={`h-2 w-2 rounded-full bg-rag-${r.c} ${r.c === "red" ? "pulse-dot" : ""}`} />
                    <span className="flex-1">{r.t}</span>
                    <Badge variant="outline" className="border-border bg-secondary/40 text-[10px]">Score {r.s}</Badge>
                    <span className="text-xs text-muted-foreground">{r.st}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="label-eyebrow mb-2">Last status report</div>
              <div className="rounded-md border border-border bg-background/30 p-3 text-sm">
                <div className="text-xs text-muted-foreground">Week 18 · Sara · 3 days ago</div>
                <p className="mt-1 text-foreground">Integration layer testing delayed by 1 week. Fallback plan in review with IT Director. No impact on go-live yet.</p>
                <button className="mt-2 text-xs text-accent hover:underline">View full ↗</button>
              </div>
            </div>

            <div>
              <div className="label-eyebrow mb-2">Next milestone</div>
              <div className="rounded-md border border-border bg-background/30 p-3 text-sm">
                <div className="text-foreground">UAT Sign-off</div>
                <div className="text-xs text-muted-foreground">Due {project.endDate} · ⏳ 18 days remaining</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button asChild className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/portfolio/$projectId" params={{ projectId: project.id }}>Open Full Project →</Link>
              </Button>
              <Button variant="outline" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ArchivedTab() {
  return (
    <div className="">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Project</TableHead><TableHead>Business Line</TableHead><TableHead>PM</TableHead>
          <TableHead>Closure</TableHead><TableHead>Final RAG</TableHead><TableHead>Budget vs Actual</TableHead><TableHead>Outcome</TableHead><TableHead />
        </TableRow></TableHeader>
        <TableBody>
          {[
            { n: "Tablet Rollout 2025", bl: "Software", pm: "Mei Chen", c: "Dec 2025", r: "green" as const, b: "+2%", o: "Closed — success" },
            { n: "North Site Upgrade", bl: "EPC", pm: "John Smith", c: "Oct 2025", r: "amber" as const, b: "+11%", o: "Closed — partial" },
            { n: "POS Modernization", bl: "Software", pm: "Priya Iyer", c: "Aug 2025", r: "red" as const, b: "+24%", o: "Cancelled" },
          ].map((r) => (
            <TableRow key={r.n}>
              <TableCell className="font-medium text-foreground">{r.n}</TableCell>
              <TableCell className="text-muted-foreground">{r.bl}</TableCell>
              <TableCell>{r.pm}</TableCell>
              <TableCell className="text-xs">{r.c}</TableCell>
              <TableCell><RagBadge rag={r.r} /></TableCell>
              <TableCell className="num-mono text-xs">{r.b}</TableCell>
              <TableCell className="text-xs">{r.o}</TableCell>
              <TableCell><Button size="sm" variant="outline">View</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BusinessCasesTab() {
  return (
    <div className="">
      <Table>
        <TableHeader><TableRow>
          <TableHead>#</TableHead><TableHead>Project</TableHead><TableHead>Pillar</TableHead>
          <TableHead>Submitted</TableHead><TableHead>Score</TableHead>
          <TableHead>Est. ROI</TableHead><TableHead>Stage</TableHead><TableHead />
        </TableRow></TableHeader>
        <TableBody>
          {pipelineItems.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="num-mono text-xs text-muted-foreground">{b.id}</TableCell>
              <TableCell className="font-medium text-foreground">{b.title}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{b.pillar}</TableCell>
              <TableCell className="text-xs">{b.submittedBy} · {b.date}</TableCell>
              <TableCell>
                <span className={`num-mono rounded px-1.5 py-0.5 text-xs ${
                  b.score >= 71 ? "bg-rag-green/10 text-rag-green" : b.score >= 41 ? "bg-rag-amber/10 text-rag-amber" : "bg-rag-red/10 text-rag-red"
                }`}>{b.score}</span>
              </TableCell>
              <TableCell className="num-mono text-xs">{b.roi}</TableCell>
              <TableCell><StageBadge stage={b.stage} /></TableCell>
              <TableCell><Button size="sm" variant="outline">Review</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, string> = {
    "Approved": "border-rag-green/40 bg-rag-green/10 text-rag-green",
    "Under Review": "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
    "Submitted": "border-rag-blue/40 bg-rag-blue/10 text-rag-blue",
    "Deferred": "border-rag-grey/40 bg-rag-grey/10 text-rag-grey",
    "Rejected": "border-rag-red/40 bg-rag-red/10 text-rag-red",
    "Revision Requested": "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
  };
  return <Badge variant="outline" className={map[stage] ?? ""}>{stage}</Badge>;
}

function GovernanceTab() {
  const entries = [
    { d: "May 18", actor: "A. Khoury", action: "Approved", target: "BC-015 Customer Loyalty Platform", note: "Pillar: Growth · Score 88" },
    { d: "May 14", actor: "M. Cole", action: "Deferred", target: "BC-014 Legacy Decommissioning", note: "Revisit Q3 with revised ROI" },
    { d: "May 12", actor: "A. Khoury", action: "Requested revision", target: "BC-016 Internal Audit Tooling", note: "Add risk mitigation plan" },
    { d: "May 09", actor: "Board", action: "Approved budget", target: "Coastal Refinery Expansion", note: "+$2.4M change order" },
    { d: "May 03", actor: "Finance", action: "Locked baseline", target: "ERP Upgrade", note: "Baseline v3 frozen" },
  ];
  return (
    <div className="">
      <Table>
        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
        <TableBody>{entries.map((e, i) => (
          <TableRow key={i}>
            <TableCell className="text-xs text-muted-foreground">{e.d}</TableCell>
            <TableCell>{e.actor}</TableCell>
            <TableCell><Badge variant="outline" className="border-accent/40 bg-accent-dim text-accent">{e.action}</Badge></TableCell>
            <TableCell className="text-foreground">{e.target}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{e.note}</TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    </div>
  );
}

const PM_LIST = ["Sara Al-Rashid", "John Smith", "Mei Chen", "Omar Haddad", "Priya Iyer", "Liam Walker", "Hana Tanaka", "Diego Ortiz"];

function NewProjectDialog({ onAdd }: { onAdd: (p: Project) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [businessLine, setBusinessLine] = useState("Software Solutions");
  const [department, setDepartment] = useState("Engineering");
  const [client, setClient] = useState("Internal");
  const [pm, setPm] = useState("Sara Al-Rashid");
  const [stage, setStage] = useState<Project["stage"]>("Initiation");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  function reset() { setName(""); setBudget(""); setEndDate(""); setTagsInput(""); }

  function handleCreate() {
    if (!name.trim()) { toast.error("Project name is required"); return; }
    const avatar = pm.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const newProject: Project = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      businessLine,
      department,
      client,
      pm,
      pmAvatar: avatar,
      progress: 0,
      budgetUsed: 0,
      budgetTotal: parseFloat(budget) || 0,
      endDate: endDate ? new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "TBD",
      rag: "blue" as Rag,
      risks: 0,
      issues: 0,
      stage,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      ragNote: "New",
    };
    onAdd(newProject);
    toast.success(`Project "${newProject.name}" created`);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); setOpen(o); }}>
      <DialogTrigger asChild>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-1 h-4 w-4" />New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Create a project directly in the portfolio. For new initiatives requiring approval, use Submit Business Case instead.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Project name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ERP Integration Phase 2" />
          </div>
          <div>
            <Label>Business Line</Label>
            <Select value={businessLine} onValueChange={setBusinessLine}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Software Solutions", "EPC", "Consultation", "Maintenance"].map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Engineering", "IT", "Operations", "R&D", "Finance"].map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Project Manager</Label>
            <Select value={pm} onValueChange={setPm}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PM_LIST.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Client</Label>
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Internal">Internal</SelectItem>
                <SelectItem value="ACME Energy">ACME Energy</SelectItem>
                <SelectItem value="Northwind Logistics">Northwind Logistics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Stage</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as Project["stage"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["Initiation", "Planning", "Execution", "Monitoring", "Closure"] as const).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target end date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <Label>Budget total ($M)</Label>
            <Input type="number" min="0" step="0.1" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 2.5" />
          </div>
          <div className="col-span-2">
            <Label>Tags (comma-separated, optional)</Label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Strategic, Innovation…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleCreate}>Create Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewBusinessCaseDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />New Business Case</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Business Case</DialogTitle>
          <DialogDescription>This will enter the Pipeline for scoring and approval routing.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Project name</Label><Input placeholder="e.g. Predictive Maintenance Platform" /></div>
          <div><Label>Business Line</Label>
            <Select defaultValue="sw"><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sw">Software Solutions</SelectItem><SelectItem value="epc">EPC</SelectItem>
                <SelectItem value="cons">Consultation</SelectItem><SelectItem value="maint">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Strategic Pillar</Label>
            <Select defaultValue="growth"><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="growth">Growth</SelectItem><SelectItem value="eff">Efficiency</SelectItem>
                <SelectItem value="inn">Innovation</SelectItem><SelectItem value="comp">Compliance</SelectItem>
                <SelectItem value="esg">ESG</SelectItem><SelectItem value="ops">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Est. budget (CapEx)</Label><Input placeholder="$" /></div>
          <div><Label>Est. budget (OpEx)</Label><Input placeholder="$" /></div>
          <div className="col-span-2"><Label>Strategic objective</Label><Textarea placeholder="Why are we doing this?" /></div>
          <div className="col-span-2"><Label>Expected ROI</Label><Input placeholder="$ value or %" /></div>
          <div className="col-span-2"><Label>Tags (optional)</Label><Input placeholder="Strategic, Compliance…" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Save draft</Button>
          <Button className="bg-accent text-accent-foreground" onClick={() => { toast.success("Business Case submitted for review"); setOpen(false); }}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
