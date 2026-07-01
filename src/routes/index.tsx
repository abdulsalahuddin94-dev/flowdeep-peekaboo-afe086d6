import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RagBadge, RagDot } from "@/components/RagBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowUpRight, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  Activity, Users, DollarSign, GanttChartSquare, Bell, Inbox, Sparkles,
} from "lucide-react";
import { milestones, pipelineItems, risks, resources, type Rag } from "@/lib/mock-data";
import { useProjects, useNotifications, useResourceRequests } from "@/lib/projects-store";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — Nexus PMO" },
      { name: "description", content: "Role-adaptive PMO dashboard: portfolio health, approvals, risks, capacity, schedule." },
    ],
  }),
});

const ROLES = ["Executive", "Director", "Resource Mgr", "PM", "Finance", "Team Member"] as const;
type Role = typeof ROLES[number];

function Dashboard() {
  const [role, setRole] = useState<Role>("Director");

  return (
    <div>
      <PageHeader
        title="Good morning, Aisha"
        subtitle="Saturday, June 6, 2026 · FY2026 portfolio overview"
        actions={
          <Tabs value={role} onValueChange={(v) => setRole(v as Role)}>
            <TabsList>
              {ROLES.map((r) => (
                <TabsTrigger
                  key={r}
                  value={r}
                  className="text-xs"
                >
                  {r}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      {role === "Executive" && <ExecutiveView />}
      {role === "Director" && <DirectorView />}
      {role === "Resource Mgr" && <ResourceView />}
      {role === "PM" && <PMView />}
      {role === "Finance" && <FinanceView />}
      {role === "Team Member" && <TeamMemberView />}
    </div>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function useLiveSummary() {
  const { projects } = useProjects();
  return useMemo(() => {
    const counts: Record<Rag, number> = { green: 0, amber: 0, red: 0, blue: 0, grey: 0 };
    let budgetUsed = 0, budgetTotal = 0, progressSum = 0;
    for (const p of projects) {
      counts[p.rag] += 1;
      budgetUsed += p.budgetUsed;
      budgetTotal += p.budgetTotal;
      progressSum += p.progress;
    }
    return {
      counts,
      total: projects.length,
      budgetUsed,
      budgetTotal,
      budgetPct: budgetTotal ? Math.round((budgetUsed / budgetTotal) * 100) : 0,
      avgProgress: projects.length ? Math.round(progressSum / projects.length) : 0,
      projects,
    };
  }, [projects]);
}

function Tile({
  className = "",
  eyebrow,
  title,
  right,
  children,
}: {
  className?: string;
  eyebrow?: string;
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={`glass-card p-5 ${className}`}>
      {(eyebrow || title || right) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {eyebrow && <div className="label-eyebrow">{eyebrow}</div>}
            {title && <div className="mt-1 text-sm font-medium text-foreground">{title}</div>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

function Stat({
  label, value, sub, tone,
}: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "red" | "amber" | "green" | "accent" }) {
  const toneCls =
    tone === "red" ? "text-rag-red" :
    tone === "amber" ? "text-rag-amber" :
    tone === "green" ? "text-rag-green" :
    tone === "accent" ? "text-accent" : "text-foreground";
  return (
    <div>
      <div className="label-eyebrow">{label}</div>
      <div className={`mt-1 text-2xl font-medium num-mono ${toneCls}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ── Director view (default) — bento ────────────────────────────────────────────

function DirectorView() {
  const s = useLiveSummary();
  const { notifications, unreadCount } = useNotifications();
  const { resourceRequests } = useResourceRequests();
  const pendingReqs = resourceRequests.filter((r) => r.status === "Pending").length;
  const overAllocated = resources.filter((r) => r.util > 100).length;
  const topRisks = [...risks].sort((a, b) => b.score - a.score).slice(0, 4);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Hero KPI band */}
      <Tile className="col-span-12 lg:col-span-8" eyebrow="Portfolio Health" right={
        <Link to="/portfolio" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
          Open portfolio <ArrowUpRight className="h-3 w-3" />
        </Link>
      }>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <Stat label="Active" value={s.total} sub="FY2026" tone="accent" />
          <Stat label="On Track" value={s.counts.green} sub={`${Math.round((s.counts.green / s.total) * 100)}% of portfolio`} tone="green" />
          <Stat label="At Risk" value={s.counts.amber} sub="Watch closely" tone="amber" />
          <Stat label="Off-Track" value={s.counts.red} sub="Action required" tone="red" />
        </div>
        <div className="mt-5">
          <HealthBar counts={s.counts} total={s.total} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <MiniStat icon={<Activity className="h-3.5 w-3.5" />} label="Avg progress" value={`${s.avgProgress}%`} />
          <MiniStat icon={<TrendingUp className="h-3.5 w-3.5" />} label="On-track trend" value="▼ 6% · 8w" tone="amber" />
          <MiniStat icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Open risks" value={String(risks.length)} tone="red" />
        </div>
      </Tile>

      <Tile className="col-span-12 lg:col-span-4" eyebrow="Budget Burn" right={<DollarSign className="h-4 w-4 text-muted-foreground" />}>
        <div className="text-3xl font-medium num-mono text-foreground">
          ${s.budgetUsed.toFixed(1)}<span className="text-base text-muted-foreground">M</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">of ${s.budgetTotal.toFixed(0)}M · {s.budgetPct}% utilized</div>
        <Progress value={s.budgetPct} className="mt-3 h-2" />
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">~ $4.2M / month</span>
          <span className="text-rag-amber">▲ +8% MoM</span>
        </div>
        <Link to="/financials" className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline">
          Open financials <ArrowUpRight className="h-3 w-3" />
        </Link>
      </Tile>

      {/* Approval queue */}
      <Tile className="col-span-12 md:col-span-6 lg:col-span-4" eyebrow="Approval Queue" right={
        <Link to="/pipeline" className="text-xs text-accent hover:underline">View all</Link>
      }>
        <ul className="space-y-2">
          {/* Pipeline approvals */}
          {pipelineItems.filter((p) => p.stage === "Under Review" || p.stage === "Submitted").slice(0, 2).map((p) => (
            <li key={p.id} className="rounded-md border border-border bg-background/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{p.title}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{p.id} · {p.pillar} · {p.roi} ROI</div>
                </div>
                <span className="num-mono shrink-0 rounded bg-accent-dim px-1.5 py-0.5 text-[10px] text-accent">{p.score}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" className="h-7 bg-accent text-accent-foreground hover:bg-accent/90">Approve</Button>
                <Button size="sm" variant="outline" className="h-7">Review</Button>
              </div>
            </li>
          ))}

          {/* Milestone approvals - show pending approvals for current user */}
          {[
            { name: "UAT Sign-off", project: "ERP Upgrade", approvers: 2, pending: true },
            { name: "Production cutover", project: "Customer Portal v3", approvers: 1, pending: true },
          ].slice(0, 1).map((m) => (
            <li key={m.name} className="rounded-md border border-accent/20 bg-accent-dim/20 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{m.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{m.project} · Milestone approval</div>
                </div>
                <span className="shrink-0 rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent font-medium">
                  {m.approvers} approvers
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" className="h-7 bg-accent text-accent-foreground hover:bg-accent/90">Approve</Button>
                <Button size="sm" variant="outline" className="h-7">Review project</Button>
              </div>
            </li>
          ))}
        </ul>
      </Tile>

      {/* Top risks */}
      <Tile className="col-span-12 md:col-span-6 lg:col-span-4" eyebrow="Top Risks" right={
        <Link to="/risks" className="text-xs text-accent hover:underline">RAID</Link>
      }>
        <ul className="space-y-2">
          {topRisks.map((r) => (
            <li key={r.id} className="flex items-start gap-3 rounded-md border border-border bg-background/30 p-2.5">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${r.score >= 16 ? "bg-rag-red pulse-dot" : r.score >= 12 ? "bg-rag-amber" : "bg-rag-blue"}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-foreground">{r.title}</div>
                <div className="text-[11px] text-muted-foreground">{r.project} · {r.owner}</div>
              </div>
              <span className="num-mono shrink-0 text-xs text-muted-foreground">{r.score}</span>
            </li>
          ))}
        </ul>
      </Tile>

      {/* Action items */}
      <Tile className="col-span-12 lg:col-span-4" eyebrow="My Action Items" right={<Inbox className="h-4 w-4 text-muted-foreground" />}>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2 text-foreground"><CheckCircle2 className="h-4 w-4 text-accent" /> Approve BC-018 <span className="ml-auto text-xs text-muted-foreground">2d</span></li>
          <li className="flex items-center gap-2 text-foreground"><AlertTriangle className="h-4 w-4 text-rag-red" /> Escalation: ERP UAT <span className="ml-auto text-xs text-rag-red">1d</span></li>
          <li className="flex items-center gap-2 text-foreground"><TrendingUp className="h-4 w-4 text-rag-amber" /> Review Q3 forecast <span className="ml-auto text-xs text-muted-foreground">4d</span></li>
          <li className="flex items-center gap-2 text-foreground"><Clock className="h-4 w-4 text-muted-foreground" /> Board prep deck <span className="ml-auto text-xs text-muted-foreground">6d</span></li>
          <li className="flex items-center gap-2 text-foreground"><Users className="h-4 w-4 text-accent" /> {pendingReqs} resource requests pending <span className="ml-auto text-xs text-muted-foreground">today</span></li>
        </ul>
      </Tile>

      {/* Milestones */}
      <Tile className="col-span-12 lg:col-span-7" eyebrow="Milestones · next 30 days" right={
        <Link to="/portfolio" className="text-xs text-accent hover:underline">All</Link>
      }>
        <ul className="divide-y divide-border text-sm">
          {milestones.map((m) => (
            <li key={m.name} className="flex items-center gap-3 py-2.5">
              <RagBadge rag={m.status as Rag} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-foreground">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.project}</div>
              </div>
              <div className="text-right text-xs">
                <div className="text-foreground">{m.due}</div>
                <div className="text-muted-foreground">in {m.in}d</div>
              </div>
            </li>
          ))}
        </ul>
      </Tile>

      {/* Notifications */}
      <Tile className="col-span-12 lg:col-span-5" eyebrow="Recent Activity" right={
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Bell className="h-3.5 w-3.5" /> {unreadCount} unread
        </span>
      }>
        <ul className="space-y-2 text-sm">
          {notifications.slice(0, 5).map((n) => (
            <li key={n.id} className="flex items-start gap-2.5 rounded-md border border-border bg-background/30 p-2.5">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                n.tone === "red" ? "bg-rag-red pulse-dot" :
                n.tone === "amber" ? "bg-rag-amber" :
                n.tone === "green" ? "bg-rag-green" : "bg-rag-blue"
              }`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-foreground">{n.title}</div>
                <div className="text-[11px] text-muted-foreground">{n.time}</div>
              </div>
            </li>
          ))}
        </ul>
      </Tile>

      {/* Capacity */}
      <Tile className="col-span-12 lg:col-span-8" eyebrow="Team Utilization · next 6 weeks" right={
        <Link to="/resources" className="text-xs text-accent hover:underline">Open resources</Link>
      }>
        <Heatmap />
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded bg-rag-green/40" /> Healthy</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded bg-rag-amber" /> High</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded bg-orange-500" /> Stretched</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded bg-rag-red" /> Over-allocated</span>
          <span className="ml-auto text-rag-red">{overAllocated} over-allocated</span>
        </div>
      </Tile>

      {/* Schedule shortcut */}
      <Tile className="col-span-12 lg:col-span-4" eyebrow="Schedule" right={<GanttChartSquare className="h-4 w-4 text-muted-foreground" />}>
        <div className="text-sm text-foreground">Critical path projects</div>
        <ul className="mt-2 space-y-2">
          {s.projects.filter((p) => p.rag === "red").slice(0, 3).map((p) => (
            <li key={p.id} className="rounded-md border border-border bg-background/30 p-2.5">
              <Link to="/portfolio/$projectId" params={{ projectId: p.id }} className="flex items-center gap-2">
                <RagDot rag={p.rag} />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-accent">{p.name}</span>
                <span className="num-mono text-xs text-muted-foreground">{p.progress}%</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/portfolio" className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline">
          Open Gantt view <ArrowUpRight className="h-3 w-3" />
        </Link>
      </Tile>

      {/* Cross-project dep banner */}
      <Tile className="col-span-12" eyebrow="Cross-project Dependencies">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-accent" />
            <div className="text-sm text-foreground">
              3 active dependency conflicts across <span className="text-accent">Coastal Refinery</span>, <span className="text-accent">Substation Bravo</span>, and <span className="text-accent">LNG Refit</span> — shared crew window in week 27.
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-accent/40 text-accent">Review</Button>
        </div>
      </Tile>
    </div>
  );
}

// ── Executive view ─────────────────────────────────────────────────────────────

function ExecutiveView() {
  const s = useLiveSummary();
  const stages = ["Initiation", "Planning", "Execution", "Monitoring", "Closure"] as const;
  const byStage = stages.map((st) => ({ st, n: s.projects.filter((p) => p.stage === st).length }));
  return (
    <div className="grid grid-cols-12 gap-4">
      <Tile className="col-span-12 md:col-span-3" eyebrow="Active Projects">
        <div className="text-4xl font-medium num-mono text-foreground">{s.total}</div>
        <div className="mt-1 text-xs text-muted-foreground">{s.counts.green} green · {s.counts.amber} amber · {s.counts.red} red</div>
      </Tile>
      <Tile className="col-span-12 md:col-span-3" eyebrow="Budget Utilized">
        <div className="text-4xl font-medium num-mono text-accent">${s.budgetUsed.toFixed(1)}M</div>
        <div className="mt-1 text-xs text-muted-foreground">of ${s.budgetTotal.toFixed(0)}M · {s.budgetPct}%</div>
        <Progress value={s.budgetPct} className="mt-3 h-1.5" />
      </Tile>
      <Tile className="col-span-12 md:col-span-3" eyebrow="Risk Score">
        <div className="text-4xl font-medium num-mono text-rag-red">7.2</div>
        <div className="mt-1 text-xs text-muted-foreground">{risks.filter((r) => r.score >= 16).length} critical risks</div>
      </Tile>
      <Tile className="col-span-12 md:col-span-3" eyebrow="Avg Progress">
        <div className="text-4xl font-medium num-mono text-foreground">{s.avgProgress}%</div>
        <div className="mt-1 text-xs text-muted-foreground">Across {s.total} projects</div>
      </Tile>

      <Tile className="col-span-12 lg:col-span-7" eyebrow="Portfolio Mix by Stage">
        <div className="space-y-2.5">
          {byStage.map((b) => (
            <div key={b.st}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-foreground">{b.st}</span>
                <span className="num-mono text-muted-foreground">{b.n}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
                <div className="h-full bg-accent" style={{ width: `${(b.n / s.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Tile>

      <Tile className="col-span-12 lg:col-span-5" eyebrow="Top Pipeline Bets" right={<Link to="/pipeline" className="text-xs text-accent hover:underline">All</Link>}>
        <ul className="space-y-2 text-sm">
          {[...pipelineItems].sort((a, b) => b.score - a.score).slice(0, 4).map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-md border border-border bg-background/30 p-2.5">
              <span className="num-mono rounded bg-accent-dim px-1.5 py-0.5 text-[10px] text-accent">{p.score}</span>
              <span className="min-w-0 flex-1 truncate text-foreground">{p.title}</span>
              <span className="text-xs text-muted-foreground">{p.roi}</span>
            </li>
          ))}
        </ul>
      </Tile>
    </div>
  );
}

// ── Resource Mgr view ──────────────────────────────────────────────────────────

function ResourceView() {
  const { resourceRequests } = useResourceRequests();
  const pending = resourceRequests.filter((r) => r.status === "Pending");
  const over = resources.filter((r) => r.util > 100);
  return (
    <div className="grid grid-cols-12 gap-4">
      <Tile className="col-span-12 md:col-span-4" eyebrow="Over-allocated" right={<Users className="h-4 w-4 text-muted-foreground" />}>
        <div className="text-3xl font-medium num-mono text-rag-red">{over.length}</div>
        <div className="mt-1 text-xs text-muted-foreground">{over.map((o) => `${o.name.split(" ")[0]} ${o.util}%`).join(" · ")}</div>
      </Tile>
      <Tile className="col-span-12 md:col-span-4" eyebrow="Pending Requests">
        <div className="text-3xl font-medium num-mono text-rag-amber">{pending.length}</div>
        <div className="mt-1 text-xs text-muted-foreground">{pending.filter((r) => r.priority === "Critical").length} critical</div>
      </Tile>
      <Tile className="col-span-12 md:col-span-4" eyebrow="Capacity Gaps · 6w">
        <div className="text-3xl font-medium num-mono text-rag-amber">5</div>
        <div className="mt-1 text-xs text-muted-foreground">Roles unstaffed weeks 24–28</div>
      </Tile>

      <Tile className="col-span-12" eyebrow="Team Utilization Heatmap · next 6 weeks">
        <Heatmap />
      </Tile>

      <Tile className="col-span-12 lg:col-span-7" eyebrow="Open Resource Requests" right={<Link to="/resources" className="text-xs text-accent hover:underline">Manage</Link>}>
        <ul className="divide-y divide-border text-sm">
          {pending.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <Avatar className="h-7 w-7"><AvatarFallback className="bg-accent-dim text-[10px] text-accent">{r.submittedBy.split(" ").map((x) => x[0]).join("")}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-foreground">{r.role} <span className="text-muted-foreground">· {r.skill} · {r.fte} FTE</span></div>
                <div className="text-xs text-muted-foreground">{r.project} · {r.from} → {r.until}</div>
              </div>
              <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium ${
                r.priority === "Critical" ? "bg-rag-red/10 text-rag-red" :
                r.priority === "High" ? "bg-rag-amber/10 text-rag-amber" :
                "bg-secondary text-muted-foreground"
              }`}>{r.priority}</span>
            </li>
          ))}
        </ul>
      </Tile>

      <Tile className="col-span-12 lg:col-span-5" eyebrow="Skill Demand · next 3 sprints">
        <ul className="space-y-2 text-sm">
          {[
            { skill: "Solution Architect", n: 4, tone: "red" as const },
            { skill: "Data Engineer", n: 3, tone: "amber" as const },
            { skill: "Security Lead", n: 2, tone: "amber" as const },
            { skill: "Field Engineer", n: 2, tone: "green" as const },
          ].map((row) => (
            <li key={row.skill} className="flex items-center gap-3 rounded-md border border-border bg-background/30 p-2.5">
              <span className="flex-1 text-foreground">{row.skill}</span>
              <span className={`num-mono text-xs ${row.tone === "red" ? "text-rag-red" : row.tone === "amber" ? "text-rag-amber" : "text-rag-green"}`}>×{row.n}</span>
            </li>
          ))}
        </ul>
      </Tile>
    </div>
  );
}

// ── PM view ────────────────────────────────────────────────────────────────────

function PMView() {
  const { projects } = useProjects();
  const mine = projects.slice(0, 5);
  const openRisks = risks.filter((r) => r.status === "Open").length;
  return (
    <div className="grid grid-cols-12 gap-4">
      <Tile className="col-span-12 lg:col-span-8" eyebrow="My Projects">
        <ul className="space-y-2">
          {mine.map((p) => (
            <Link key={p.id} to="/portfolio/$projectId" params={{ projectId: p.id }}
              className="flex items-center gap-3 rounded-md border border-border bg-background/30 p-3 transition-colors hover:border-accent/40">
              <RagBadge rag={p.rag} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.businessLine} · ends {p.endDate}</div>
              </div>
              <div className="hidden w-40 md:block"><Progress value={p.progress} className="h-1.5" /></div>
              <span className="num-mono w-10 text-right text-xs text-muted-foreground">{p.progress}%</span>
            </Link>
          ))}
        </ul>
      </Tile>

      <Tile className="col-span-12 lg:col-span-4" eyebrow={`Open RAID (${openRisks})`}>
        <ul className="space-y-2 text-sm">
          {risks.slice(0, 5).map((r) => (
            <li key={r.id} className="flex items-start gap-2">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${r.score >= 16 ? "bg-rag-red pulse-dot" : "bg-rag-amber"}`} />
              <span className="text-foreground">{r.title}</span>
            </li>
          ))}
        </ul>
      </Tile>

      <Tile className="col-span-12 lg:col-span-8" eyebrow="Milestone Tracker · next 4 weeks">
        <MilestoneStrip />
      </Tile>

      <Tile className="col-span-12 lg:col-span-4" eyebrow="Status Report Due">
        <div className="text-sm text-foreground">Week 23 — submit by Friday 5pm</div>
        <Button size="sm" className="mt-3 bg-accent text-accent-foreground hover:bg-accent/90">Open draft</Button>
      </Tile>
    </div>
  );
}

// ── Finance view ───────────────────────────────────────────────────────────────

function FinanceView() {
  const s = useLiveSummary();
  const variance = s.projects.filter((p) => p.rag === "red" || p.rag === "amber").slice(0, 5);
  return (
    <div className="grid grid-cols-12 gap-4">
      <Tile className="col-span-12" eyebrow="Portfolio Budget Summary">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Stat label="Total Budget" value={`$${s.budgetTotal.toFixed(0)}M`} />
          <Stat label="Total Spent" value={`$${s.budgetUsed.toFixed(1)}M`} tone="accent" />
          <Stat label="Remaining" value={`$${(s.budgetTotal - s.budgetUsed).toFixed(1)}M`} />
          <Stat label="Burn / mo" value="$4.2M" />
          <Stat label="Over Budget" value="2" tone="red" />
        </div>
      </Tile>

      <Tile className="col-span-12 lg:col-span-7" eyebrow="Top Variance Projects">
        <ul className="divide-y divide-border text-sm">
          {variance.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2"><RagBadge rag={p.rag} />{p.name}</span>
              <span className="num-mono text-muted-foreground">+{Math.round((p.budgetUsed / p.budgetTotal) * 100 - 60)}%</span>
            </li>
          ))}
        </ul>
      </Tile>

      <Tile className="col-span-12 lg:col-span-5" eyebrow="CapEx / OpEx Split">
        <div className="flex items-end gap-4">
          <div>
            <div className="text-3xl font-medium num-mono text-accent">64 / 36</div>
            <div className="text-xs text-muted-foreground">CapEx vs OpEx</div>
          </div>
          <div className="flex-1">
            <div className="flex h-3 overflow-hidden rounded-full bg-secondary/50">
              <div className="bg-accent" style={{ width: "64%" }} />
              <div className="bg-rag-blue" style={{ width: "36%" }} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-foreground">Pending Change Requests</span>
          <span className="num-mono rounded bg-rag-amber/10 px-2 py-0.5 text-rag-amber">4</span>
        </div>
      </Tile>
    </div>
  );
}

// ── Team Member view ───────────────────────────────────────────────────────────

const MY_TASKS = [
  "Review test cases — ERP UAT",
  "Update sprint board",
  "Sync with vendor (10:30)",
  "Submit timesheet",
];

function TeamMemberView() {
  const [done, setDone] = useState<string[]>([]);
  const { notifications } = useNotifications();
  function toggle(t: string) {
    setDone((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }
  return (
    <div className="grid grid-cols-12 gap-4">
      <Tile className="col-span-12 lg:col-span-8" eyebrow="My Tasks Today" right={
        <span className="num-mono text-xs text-muted-foreground">{done.length}/{MY_TASKS.length} done</span>
      }>
        <ul className="space-y-2 text-sm">
          {MY_TASKS.map((t) => (
            <li
              key={t}
              onClick={() => toggle(t)}
              className={`flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/30 p-2.5 transition-opacity ${done.includes(t) ? "opacity-50" : ""}`}
            >
              <input type="checkbox" className="pointer-events-none accent-accent" checked={done.includes(t)} readOnly />
              <span className={`text-foreground ${done.includes(t) ? "text-muted-foreground line-through" : ""}`}>{t}</span>
            </li>
          ))}
        </ul>
      </Tile>

      <Tile className="col-span-12 lg:col-span-4" eyebrow="My Project">
        <div className="text-lg font-medium text-foreground">ERP Upgrade</div>
        <div className="mt-1 text-xs text-rag-red">Off-Track · 61%</div>
        <Progress value={61} className="mt-3 h-1.5" />
      </Tile>

      <Tile className="col-span-12" eyebrow="Recent Updates">
        <ul className="space-y-2 text-sm">
          {notifications.slice(0, 5).map((n) => (
            <li key={n.id} className="flex items-center gap-2 text-muted-foreground">
              <RagDot rag={(n.tone === "red" ? "red" : n.tone === "amber" ? "amber" : n.tone === "green" ? "green" : "blue") as Rag} />
              {n.title}
            </li>
          ))}
        </ul>
      </Tile>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function HealthBar({ counts, total }: { counts: Record<Rag, number>; total: number }) {
  const rows: { k: Rag; c: string; l: string }[] = [
    { k: "green", c: "var(--rag-green)", l: "On Track" },
    { k: "amber", c: "var(--rag-amber)", l: "At Risk" },
    { k: "red",   c: "var(--rag-red)",   l: "Off-Track" },
    { k: "blue",  c: "var(--rag-blue)",  l: "Not Started" },
    { k: "grey",  c: "var(--rag-grey)",  l: "On Hold" },
  ];
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary/40">
        {rows.map((r) =>
          counts[r.k] ? <div key={r.k} style={{ width: `${(counts[r.k] / total) * 100}%`, background: r.c }} /> : null
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-5">
        {rows.map((r) => (
          <div key={r.k} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.c }} />
            <span className="text-muted-foreground">{r.l}</span>
            <span className="ml-auto num-mono text-foreground">{counts[r.k]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "amber" | "red" }) {
  const t = tone === "red" ? "text-rag-red" : tone === "amber" ? "text-rag-amber" : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-background/30 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <div className={`mt-1 text-sm font-medium ${t}`}>{value}</div>
    </div>
  );
}

function Heatmap() {
  const people = ["Sara", "John", "Mei", "Omar", "Priya", "Liam", "Hana", "Diego"];
  const cells = (n: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const v = (n * 13 + i * 17) % 130;
      const color = v > 100 ? "bg-rag-red" : v > 80 ? "bg-orange-500" : v > 60 ? "bg-rag-amber" : "bg-rag-green/40";
      return <div key={i} className={`h-7 flex-1 rounded ${color}`} title={`${v}%`} />;
    });
  return (
    <div className="space-y-1.5">
      <div className="ml-24 grid grid-cols-6 gap-1 text-[10px] text-muted-foreground">
        {["W23", "W24", "W25", "W26", "W27", "W28"].map((w) => <div key={w} className="text-center">{w}</div>)}
      </div>
      {people.map((p, i) => (
        <div key={p} className="flex items-center gap-2">
          <div className="w-24 truncate text-xs text-muted-foreground">{p}</div>
          <div className="flex flex-1 gap-1">{cells(i)}</div>
        </div>
      ))}
    </div>
  );
}

function MilestoneStrip() {
  return (
    <div className="mt-1 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
      {["W23", "W24", "W25", "W26"].map((w, i) => (
        <div key={w} className="rounded-md border border-border bg-background/30 p-3">
          <div className="text-muted-foreground">{w}</div>
          <div className="mt-1 text-foreground">{["UAT Sign-off", "Integration", "Go-live cutover", "Stabilize"][i]}</div>
          <Avatar className="mt-2 h-5 w-5">
            <AvatarFallback className="bg-accent-dim text-[10px] text-accent">{["SA", "MC", "OH", "SA"][i]}</AvatarFallback>
          </Avatar>
        </div>
      ))}
    </div>
  );
}
