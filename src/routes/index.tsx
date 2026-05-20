import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { RagBadge } from "@/components/RagBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowUpRight, AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { portfolioSummary, projects, milestones, pipelineItems } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [{ title: "Dashboard — Nexus PMO" }, { name: "description", content: "Role-adaptive PMO dashboard with portfolio health, approvals, risks, and capacity." }],
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
        subtitle="Tuesday, May 20, 2026 · FY2026 portfolio overview"
        actions={
          <Tabs value={role} onValueChange={(v) => setRole(v as Role)}>
            <TabsList className="bg-secondary/40">
              {ROLES.map((r) => (
                <TabsTrigger key={r} value={r} className="text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">{r}</TabsTrigger>
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

function ExecutiveView() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="glass-card col-span-2 p-6">
        <div className="flex items-baseline justify-between">
          <div className="label-eyebrow">Portfolio Health</div>
          <span className="text-xs text-muted-foreground">22 active · FY2026</span>
        </div>
        <div className="mt-4 space-y-3">
          {[
            { label: "On Track", count: portfolioSummary.onTrack, color: "rag-green", pct: 64 },
            { label: "At Risk", count: portfolioSummary.atRisk, color: "rag-amber", pct: 23 },
            { label: "Critical", count: portfolioSummary.critical, color: "rag-red", pct: 14, pulse: true },
          ].map((r) => (
            <div key={r.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <span className={`h-2 w-2 rounded-full bg-${r.color} ${r.pulse ? "pulse-dot" : ""}`} />
                  {r.count} {r.label}
                </span>
                <span className="text-muted-foreground">{r.pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
                <div className={`h-full bg-${r.color}`} style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <Link to="/portfolio" className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:underline">
          View full portfolio <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <KpiCard label="Budget Burn Rate" value={`$${portfolioSummary.budgetUsed.toFixed(1)}M`} sub={`of $${portfolioSummary.budgetTotal.toFixed(0)}M total · $4.2M / month`} accent="teal">
        <Progress value={62} className="h-2" />
        <div className="mt-2 text-xs text-rag-amber">▲ +8% vs last month</div>
      </KpiCard>

      <KpiCard label="Portfolio Risk Score" value="7.2" sub="3 critical risks require attention" accent="red" icon={<AlertCircle className="h-4 w-4" />} />

      <div className="glass-card col-span-2 p-6">
        <div className="label-eyebrow">Active projects by status</div>
        <div className="mt-4 flex items-center gap-8">
          <DonutChart />
          <div className="space-y-2 text-sm">
            {[
              { label: "On Track", v: 14, c: "rag-green" },
              { label: "At Risk", v: 5, c: "rag-amber" },
              { label: "Critical", v: 3, c: "rag-red" },
              { label: "Not Started", v: 2, c: "rag-blue" },
              { label: "On Hold", v: 1, c: "rag-grey" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full bg-${s.c}`} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="ml-auto font-medium text-foreground">{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ActionItemsCard />
    </div>
  );
}

function DirectorView() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KpiCard label="Portfolio Health" value="22" sub="14 green · 5 amber · 3 red" accent="teal" />
      <ApprovalQueueCard />
      <EscalationsCard />
      <MilestoneCalendar />
      <KpiCard label="Budget Overview" value={`$${portfolioSummary.budgetUsed.toFixed(1)}M`} sub={`Spent of $${portfolioSummary.budgetTotal.toFixed(0)}M (62%)`} accent="teal">
        <Progress value={62} className="h-2" />
      </KpiCard>
      <div className="md:col-span-3 glass-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="label-eyebrow">Cross-project dependency alerts</div>
            <div className="mt-1 text-sm text-foreground">3 active dependency conflicts across Coastal Refinery, Substation Bravo, and LNG Refit — shared crew window in week 27.</div>
          </div>
          <Button variant="outline" size="sm" className="border-accent/40 text-accent">Review</Button>
        </div>
      </div>
    </div>
  );
}

function ResourceView() {
  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <div className="label-eyebrow mb-3">Team utilization heatmap · next 6 weeks</div>
        <Heatmap />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Over-allocated" value="3" sub="John Smith 110% · Priya Iyer 102% · …" accent="red" />
        <KpiCard label="Skill Demand" value="Solution Arch ×4" sub="High demand next 3 sprints" accent="amber" />
        <KpiCard label="Upcoming Capacity Gaps" value="5" sub="Roles unstaffed weeks 24–28" accent="amber" />
      </div>
    </div>
  );
}

function PMView() {
  const mine = projects.slice(0, 4);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="glass-card col-span-2 p-5">
        <div className="label-eyebrow">My projects</div>
        <div className="mt-3 space-y-3">
          {mine.map((p) => (
            <Link to="/portfolio/$projectId" params={{ projectId: p.id }} key={p.id} className="flex items-center gap-3 rounded-md border border-border bg-background/30 p-3 hover:border-accent/40">
              <RagBadge rag={p.rag} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.businessLine} · {p.endDate}</div>
              </div>
              <div className="w-32"><Progress value={p.progress} className="h-1.5" /></div>
              <span className="num-mono w-10 text-right text-xs text-muted-foreground">{p.progress}%</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="glass-card p-5">
        <div className="label-eyebrow">Open RAID (7)</div>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-rag-red pulse-dot" />Vendor delivery delay</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-rag-amber" />Scope creep risk</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-rag-amber" />Key resource gap</li>
        </ul>
      </div>
      <div className="glass-card col-span-2 p-5">
        <div className="label-eyebrow">Milestone tracker · next 4 weeks</div>
        <MilestoneStrip />
      </div>
      <div className="glass-card p-5">
        <div className="label-eyebrow">Status report due</div>
        <div className="mt-2 text-sm text-foreground">Week 21 — submit by 5pm Friday</div>
        <Button size="sm" className="mt-3 bg-accent text-accent-foreground hover:bg-accent/90">Open draft</Button>
      </div>
    </div>
  );
}

function FinanceView() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="glass-card md:col-span-4 p-5">
        <div className="label-eyebrow">Portfolio budget summary</div>
        <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { l: "Total Budget", v: "$68.0M" },
            { l: "Total Spent", v: "$42.3M" },
            { l: "Remaining", v: "$25.7M" },
            { l: "Burn / mo", v: "$4.2M" },
            { l: "Over budget", v: "2", a: "red" as const },
          ].map((m) => (
            <div key={m.l}>
              <div className="label-eyebrow">{m.l}</div>
              <div className={`mt-1 text-2xl font-medium num-mono ${m.a === "red" ? "text-rag-red" : "text-foreground"}`}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card md:col-span-2 p-5">
        <div className="label-eyebrow">Top 5 variance projects</div>
        <ul className="mt-3 divide-y divide-border text-sm">
          {projects.filter((p) => p.rag === "red" || p.rag === "amber").slice(0, 5).map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2"><RagBadge rag={p.rag} />{p.name}</span>
              <span className="num-mono text-muted-foreground">+{Math.round((p.budgetUsed / p.budgetTotal) * 100 - 60)}%</span>
            </li>
          ))}
        </ul>
      </div>
      <KpiCard label="CapEx / OpEx split" value="64 / 36" sub="CapEx vs OpEx ratio" accent="teal" />
      <KpiCard label="Pending CRs" value="4" sub="Awaiting Finance sign-off" accent="amber" icon={<Clock className="h-4 w-4" />} />
    </div>
  );
}

function TeamMemberView() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="glass-card col-span-2 p-5">
        <div className="label-eyebrow">My tasks today</div>
        <ul className="mt-3 space-y-2 text-sm">
          {["Review test cases — ERP UAT", "Update sprint board", "Sync with vendor (10:30)", "Submit timesheet"].map((t) => (
            <li key={t} className="flex items-center gap-2 rounded-md border border-border bg-background/30 p-2">
              <input type="checkbox" className="accent-accent" />
              <span className="text-foreground">{t}</span>
            </li>
          ))}
        </ul>
      </div>
      <KpiCard label="My project" value="ERP Upgrade" sub="Critical · 61%" accent="red" />
      <div className="glass-card col-span-3 p-5">
        <div className="label-eyebrow">Recent updates</div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Sara closed milestone "Integration Layer Build"</li>
          <li>Mei opened risk R-091 (Vendor delivery delay)</li>
          <li>Finance approved CR-014 ($120K scope add)</li>
        </ul>
      </div>
    </div>
  );
}

function DonutChart() {
  const segments = [
    { v: 14, c: "#10B981" }, { v: 5, c: "#F59E0B" }, { v: 3, c: "#EF4444" }, { v: 2, c: "#3B82F6" }, { v: 1, c: "#64748B" },
  ];
  const total = segments.reduce((s, x) => s + x.v, 0);
  let offset = 0;
  return (
    <svg viewBox="0 0 42 42" className="h-32 w-32 -rotate-90">
      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      {segments.map((s, i) => {
        const dash = (s.v / total) * 100;
        const el = <circle key={i} cx="21" cy="21" r="15.915" fill="transparent" stroke={s.c} strokeWidth="6"
          strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={-offset} />;
        offset += dash;
        return el;
      })}
      <text x="21" y="21" textAnchor="middle" dy=".35em" transform="rotate(90 21 21)" fill="#E2E8F0" fontSize="6" fontWeight="500">25</text>
    </svg>
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
        {["W21", "W22", "W23", "W24", "W25", "W26"].map((w) => <div key={w} className="text-center">{w}</div>)}
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

function ApprovalQueueCard() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">Approval Queue</div>
        <Link to="/pipeline" className="text-xs text-accent hover:underline">View all</Link>
      </div>
      <ul className="mt-3 space-y-2">
        {pipelineItems.slice(0, 3).map((p) => (
          <li key={p.id} className="rounded-md border border-border bg-background/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{p.title}</span>
              <span className="num-mono rounded bg-accent-dim px-1.5 py-0.5 text-[10px] text-accent">{p.score}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" className="h-7 bg-accent text-accent-foreground hover:bg-accent/90">Approve</Button>
              <Button size="sm" variant="outline" className="h-7">Review</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EscalationsCard() {
  return (
    <div className="glass-card p-5">
      <div className="label-eyebrow">Escalations pending</div>
      <ul className="mt-3 space-y-2 text-sm">
        {[
          { p: "ERP Upgrade", note: "Vendor SLA breach", days: 2 },
          { p: "Security Hardening", note: "Pen-test overrun", days: 4 },
          { p: "Wellhead Auto.", note: "Critical risk R-081", days: 1 },
        ].map((e) => (
          <li key={e.p} className="flex items-center justify-between rounded-md border border-border bg-background/30 p-2.5">
            <div>
              <div className="text-foreground">{e.p}</div>
              <div className="text-xs text-muted-foreground">{e.note}</div>
            </div>
            <span className="text-xs text-rag-red">{e.days}d</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionItemsCard() {
  return (
    <div className="glass-card p-5">
      <div className="label-eyebrow">My action items</div>
      <ul className="mt-3 space-y-2 text-sm">
        <li className="flex items-center gap-2 text-foreground"><CheckCircle2 className="h-4 w-4 text-accent" /> Approve BC-018 · 2d</li>
        <li className="flex items-center gap-2 text-foreground"><AlertCircle className="h-4 w-4 text-rag-red" /> Escalation: ERP UAT · 1d</li>
        <li className="flex items-center gap-2 text-foreground"><TrendingUp className="h-4 w-4 text-rag-amber" /> Review Q3 forecast · 4d</li>
        <li className="flex items-center gap-2 text-foreground"><Clock className="h-4 w-4 text-muted-foreground" /> Board prep deck · 6d</li>
      </ul>
      <Link to="/pipeline" className="mt-3 inline-block text-xs text-accent hover:underline">View all (12)</Link>
    </div>
  );
}

function MilestoneCalendar() {
  return (
    <div className="glass-card md:col-span-2 p-5">
      <div className="label-eyebrow">Milestones · next 30 days</div>
      <ul className="mt-3 divide-y divide-border text-sm">
        {milestones.map((m) => (
          <li key={m.name} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <RagBadge rag={m.status as any} />
              <div>
                <div className="text-foreground">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.project}</div>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-foreground">{m.due}</div>
              <div className="text-muted-foreground">in {m.in}d</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MilestoneStrip() {
  return (
    <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
      {["W21", "W22", "W23", "W24"].map((w, i) => (
        <div key={w} className="rounded-md border border-border bg-background/30 p-3">
          <div className="text-muted-foreground">{w}</div>
          <div className="mt-1 text-foreground">{["UAT Sign-off", "Integration", "Go-live cutover", "Stabilize"][i]}</div>
          <Avatar className="mt-2 h-5 w-5"><AvatarFallback className="bg-accent-dim text-[10px] text-accent">{["SA","MC","OH","SA"][i]}</AvatarFallback></Avatar>
        </div>
      ))}
    </div>
  );
}
