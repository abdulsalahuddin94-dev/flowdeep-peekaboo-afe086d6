import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { projects, portfolioSummary } from "@/lib/mock-data";
import { Download, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/financials")({
  component: FinancialsPage,
  head: () => ({ meta: [{ title: "Financials — Nexus PMO" }, { name: "description", content: "Portfolio-wide budgets, CAPEX/OPEX split, change requests and milestone-linked revenue recognition." }] }),
});

function FinancialsPage() {
  return (
    <div>
      <PageHeader
        title="Financials"
        subtitle="Portfolio budgets, burn rates, CRs and revenue recognition"
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" />Export</Button>
            <Button variant="outline" size="sm"><FileSpreadsheet className="mr-1 h-4 w-4" />Open in Excel</Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { l: "Total Budget", v: `$${portfolioSummary.budgetTotal.toFixed(1)}M` },
          { l: "Total Spent", v: `$${portfolioSummary.budgetUsed.toFixed(1)}M`, c: "text-accent" },
          { l: "Remaining", v: `$${(portfolioSummary.budgetTotal - portfolioSummary.budgetUsed).toFixed(1)}M` },
          { l: "Burn / month", v: "$4.2M" },
          { l: "Projects > budget", v: "2", c: "text-rag-red" },
        ].map((k) => (
          <div key={k.l} className="glass-card p-4"><div className="label-eyebrow">{k.l}</div><div className={`mt-1 text-2xl font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div></div>
        ))}
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">By Project</TabsTrigger>
          <TabsTrigger value="capex">CapEx / OpEx</TabsTrigger>
          <TabsTrigger value="cr">Change Requests</TabsTrigger>
          <TabsTrigger value="rev">Revenue Recognition</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-5">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Project</TableHead><TableHead>Business Line</TableHead><TableHead>Budget</TableHead>
              <TableHead>Spent</TableHead><TableHead>Burn</TableHead><TableHead>Variance</TableHead><TableHead>Forecast</TableHead>
            </TableRow></TableHeader>
            <TableBody>{projects.slice(0, 12).map((p) => {
              const pct = (p.budgetUsed / p.budgetTotal) * 100;
              const variance = pct - p.progress;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.businessLine}</TableCell>
                  <TableCell className="num-mono">${p.budgetTotal.toFixed(2)}M</TableCell>
                  <TableCell className="num-mono">${p.budgetUsed.toFixed(2)}M</TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className={`h-1.5 ${pct > 90 ? "[&>div]:bg-rag-red" : pct > 70 ? "[&>div]:bg-rag-amber" : "[&>div]:bg-rag-green"}`} />
                      <span className="num-mono text-xs">{Math.round(pct)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className={`num-mono text-xs ${variance > 5 ? "text-rag-red" : variance > 0 ? "text-rag-amber" : "text-rag-green"}`}>{variance > 0 ? "+" : ""}{Math.round(variance)}%</TableCell>
                  <TableCell className="num-mono text-xs">${(p.budgetTotal * 1.04).toFixed(2)}M</TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="capex" className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="glass-card p-5">
            <div className="label-eyebrow">CapEx / OpEx split</div>
            <div className="mt-3 flex items-center justify-center">
              <svg viewBox="0 0 42 42" className="h-40 w-40 -rotate-90">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#51CAAD" strokeWidth="6" strokeDasharray="64 36" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#0EA5E9" strokeWidth="6" strokeDasharray="36 64" strokeDashoffset="-64" />
              </svg>
            </div>
            <div className="mt-3 flex justify-center gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" />CapEx 64%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-role-director" />OpEx 36%</span>
            </div>
          </div>
          <div className="glass-card p-5 md:col-span-2">
            <div className="label-eyebrow mb-3">Breakdown by business line</div>
            <Table>
              <TableHeader><TableRow><TableHead>Business Line</TableHead><TableHead>CapEx</TableHead><TableHead>OpEx</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
              <TableBody>{[
                ["Software Solutions", 6.2, 4.1], ["EPC", 22.4, 6.8], ["Consultation", 1.1, 3.2], ["Maintenance", 4.0, 5.8],
              ].map(([bl, c, o]) => (
                <TableRow key={bl as string}><TableCell>{bl}</TableCell><TableCell className="num-mono">${c}M</TableCell><TableCell className="num-mono">${o}M</TableCell><TableCell className="num-mono">${((c as number) + (o as number)).toFixed(1)}M</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="cr" className="mt-5">
          <Table>
            <TableHeader><TableRow><TableHead>CR</TableHead><TableHead>Project</TableHead><TableHead>Type</TableHead><TableHead>Impact</TableHead><TableHead>Stage</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>{[
              { id: "CR-2026-014", p: "ERP Upgrade", t: "Scope", i: "+$120K · +3w", s: "Approved", c: "green" },
              { id: "CR-2026-013", p: "ERP Upgrade", t: "Schedule", i: "-1w", s: "Rejected", c: "red" },
              { id: "CR-2026-012", p: "Refinery Expansion", t: "Budget", i: "+$1.4M", s: "Pending Finance", c: "amber" },
              { id: "CR-2026-011", p: "Security Hardening", t: "Resource", i: "+2 FTE", s: "Pending Director", c: "amber" },
            ].map((r) => (
              <TableRow key={r.id}>
                <TableCell className="num-mono text-xs">{r.id}</TableCell>
                <TableCell className="font-medium">{r.p}</TableCell>
                <TableCell><Badge variant="outline" className="border-border bg-secondary/40">{r.t}</Badge></TableCell>
                <TableCell className="text-xs">{r.i}</TableCell>
                <TableCell><Badge variant="outline" className={`bg-rag-${r.c}/10 text-rag-${r.c} border-rag-${r.c}/30`}>{r.s}</Badge></TableCell>
                <TableCell><Button size="sm" variant="outline">Open</Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="rev" className="mt-5 glass-card p-5">
          <div className="label-eyebrow mb-3">Milestone-linked revenue · FY2026</div>
          <Table>
            <TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Milestone</TableHead><TableHead>Due</TableHead><TableHead>Recognised</TableHead><TableHead>Pending</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{[
              ["ERP Upgrade", "UAT Sign-off", "Jun 15", "$0.4M", "$0.8M", "amber"],
              ["Customer Portal v3", "Production cutover", "Aug 30", "$0.6M", "$0.2M", "green"],
              ["Refinery Expansion", "Civil phase complete", "Sep 22", "$8.0M", "$4.2M", "amber"],
              ["Salesforce Migration", "Hypercare exit", "Jul 22", "$0.9M", "$0.1M", "green"],
            ].map((r) => (
              <TableRow key={r[0] as string}>
                <TableCell className="font-medium">{r[0]}</TableCell><TableCell>{r[1]}</TableCell>
                <TableCell className="text-xs">{r[2]}</TableCell>
                <TableCell className="num-mono">{r[3]}</TableCell>
                <TableCell className="num-mono">{r[4]}</TableCell>
                <TableCell><span className={`inline-block h-2 w-2 rounded-full bg-rag-${r[5]}`} /></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
