import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Star } from "lucide-react";
import { rfps, contracts, vendors } from "@/lib/mock-data";

export const Route = createFileRoute("/procurement")({
  component: ProcurementPage,
  head: () => ({ meta: [{ title: "Procurement — Nexus PMO" }, { name: "description", content: "RFI/RFP, contracts, vendor evaluation, ERP sync and cross-project subcontracted packages." }] }),
});

function ProcurementPage() {
  return (
    <div>
      <PageHeader
        title="Procurement"
        subtitle="RFI/RFP, contracts, vendor evaluation, ERP sync"
        actions={<Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />New RFP</Button>}
      />

      <Tabs defaultValue="rfp">
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="rfp">RFI / RFP Requests</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="eval">Vendor Evaluation</TabsTrigger>
          <TabsTrigger value="erp">ERP Sync</TabsTrigger>
          <TabsTrigger value="subs">Subcontracted Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="rfp" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>ID</TableHead><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Bidders</TableHead><TableHead>Due</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>{rfps.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="num-mono text-xs">{r.id}</TableCell>
                <TableCell className="font-medium text-foreground">{r.title}</TableCell>
                <TableCell><Badge variant="outline" className="border-accent/40 bg-accent-dim text-accent">{r.type}</Badge></TableCell>
                <TableCell><Badge variant="outline" className={
                  r.status === "Open" ? "border-rag-green/40 bg-rag-green/10 text-rag-green" :
                  r.status === "Evaluation" ? "border-rag-amber/40 bg-rag-amber/10 text-rag-amber" :
                  r.status === "Awarded" ? "border-role-director/40 bg-role-director/10 text-role-director" : "border-border bg-secondary/40 text-muted-foreground"}>{r.status}</Badge></TableCell>
                <TableCell className="num-mono">{r.bidders}</TableCell>
                <TableCell className="text-xs">{r.due}</TableCell>
                <TableCell><Button size="sm" variant="outline">Open</Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="contracts" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>ID</TableHead><TableHead>Vendor</TableHead><TableHead>Project</TableHead>
              <TableHead>Value</TableHead><TableHead>Status</TableHead><TableHead>End</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>{contracts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="num-mono text-xs">{c.id}</TableCell>
                <TableCell className="font-medium">{c.vendor}</TableCell>
                <TableCell>{c.project}</TableCell>
                <TableCell className="num-mono">${c.value}M</TableCell>
                <TableCell><Badge variant="outline" className={c.status === "Active" ? "border-rag-green/40 bg-rag-green/10 text-rag-green" : "border-rag-amber/40 bg-rag-amber/10 text-rag-amber"}>{c.status}</Badge></TableCell>
                <TableCell className="text-xs">{c.end}</TableCell>
                <TableCell><Button size="sm" variant="outline">Open</Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="eval" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Score</TableHead><TableHead>Delivery</TableHead><TableHead>Quality</TableHead><TableHead>Commercial</TableHead><TableHead>Last review</TableHead></TableRow></TableHeader>
            <TableBody>{vendors.map((v) => (
              <TableRow key={v.name}>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell><span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-rag-amber text-rag-amber" /><span className="num-mono">{v.eval}</span></span></TableCell>
                <TableCell className="num-mono">{(v.eval * 0.95).toFixed(1)}</TableCell>
                <TableCell className="num-mono">{(v.eval * 1.02).toFixed(1)}</TableCell>
                <TableCell className="num-mono">{(v.eval * 0.97).toFixed(1)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">Q1 2026</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="erp" className="mt-5 glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-eyebrow">ERP integration</div>
              <div className="mt-1 text-foreground">SAP S/4HANA · Last sync 3 min ago · 142 PO records pushed today</div>
            </div>
            <Button variant="outline" size="sm"><RefreshCw className="mr-1 h-4 w-4" />Sync now</Button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              { l: "POs synced today", v: "142" }, { l: "GR confirmations", v: "98" },
              { l: "Invoices matched", v: "61" }, { l: "Sync errors", v: "0", c: "text-rag-green" },
            ].map((k) => (
              <div key={k.l} className="rounded-md border border-border bg-background/30 p-3"><div className="label-eyebrow">{k.l}</div><div className={`mt-1 text-xl font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div></div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subs" className="mt-5 glass-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Package</TableHead><TableHead>Project</TableHead><TableHead>Subcontractor</TableHead>
              <TableHead>Value</TableHead><TableHead>Progress</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{[
              { p: "Civil works phase 1", pr: "Refinery Expansion", s: "Bechtel Subcontract", v: 9.4, prog: 62, st: "amber" },
              { p: "Crane operations Q3", pr: "LNG Refit", s: "Local Crane Co.", v: 1.1, prog: 28, st: "green" },
              { p: "Cyber pen-testing", pr: "Security Hardening", s: "Cyberguard", v: 0.6, prog: 81, st: "green" },
              { p: "Training rollout", pr: "ERP Upgrade", s: "Oracle Consulting", v: 0.3, prog: 12, st: "blue" },
            ].map((r) => (
              <TableRow key={r.p}>
                <TableCell className="font-medium">{r.p}</TableCell><TableCell>{r.pr}</TableCell><TableCell>{r.s}</TableCell>
                <TableCell className="num-mono">${r.v}M</TableCell>
                <TableCell className="w-40">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/50"><div className={`h-full bg-rag-${r.st}`} style={{ width: `${r.prog}%` }} /></div>
                    <span className="num-mono text-xs">{r.prog}%</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className={`border-rag-${r.st}/40 bg-rag-${r.st}/10 text-rag-${r.st}`}>{r.st === "green" ? "On Track" : r.st === "amber" ? "At Risk" : "Not Started"}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
