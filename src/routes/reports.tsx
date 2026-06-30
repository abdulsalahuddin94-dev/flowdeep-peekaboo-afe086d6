import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { reports } from "@/lib/mock-data";
import { FileBarChart, Calendar, Download, Play, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports — Nexus PMO" }, { name: "description", content: "Scheduled and on-demand reports for executive, finance, resource and governance audiences." }] }),
});

// ── Static preview content per report ─────────────────────────────────────────

const REPORT_CONTENT: Record<string, { summary: string; rows: { label: string; value: string; rag?: string }[] }> = {
  "RPT-EXEC": {
    summary: "Portfolio snapshot as of this week. 22 active projects across 5 business lines.",
    rows: [
      { label: "On Track", value: "14 projects", rag: "green" },
      { label: "At Risk", value: "5 projects", rag: "amber" },
      { label: "Off-Track", value: "3 projects", rag: "red" },
      { label: "Total Budget", value: "$248.5M" },
      { label: "Budget Utilisation", value: "61.4%" },
      { label: "Avg. Progress", value: "58%" },
    ],
  },
  "RPT-FIN": {
    summary: "Budget burn-down across the active portfolio. YTD variance within acceptable range.",
    rows: [
      { label: "Total Approved", value: "$248.5M" },
      { label: "Spent to Date", value: "$152.6M" },
      { label: "Remaining", value: "$95.9M" },
      { label: "Forecast Overrun", value: "+$4.2M", rag: "amber" },
      { label: "Top Overspend", value: "ERP Upgrade (+8%)", rag: "red" },
    ],
  },
  "RPT-RES": {
    summary: "Resource utilisation heatmap — 8 staff, 3 over-allocated.",
    rows: [
      { label: "Total Headcount", value: "8" },
      { label: "Over-allocated (>100%)", value: "1", rag: "red" },
      { label: "Near capacity (80–100%)", value: "2", rag: "amber" },
      { label: "Available capacity", value: "5", rag: "green" },
      { label: "Highest utilisation", value: "Priya Iyer — 102%", rag: "red" },
    ],
  },
  "RPT-RAID": {
    summary: "RAID roll-up across all active projects this week.",
    rows: [
      { label: "Open Risks", value: "18", rag: "amber" },
      { label: "Open Issues", value: "11", rag: "red" },
      { label: "Assumptions", value: "6" },
      { label: "Dependencies", value: "9" },
      { label: "Critical RAID items", value: "4", rag: "red" },
    ],
  },
  "RPT-GOV": {
    summary: "Governance decisions log for board review — May 2026.",
    rows: [
      { label: "Decisions logged", value: "7" },
      { label: "Stage gates passed", value: "3", rag: "green" },
      { label: "Pending sign-off", value: "2", rag: "amber" },
      { label: "Escalations", value: "1", rag: "red" },
    ],
  },
  "RPT-VEN": {
    summary: "Vendor performance scorecard — Q2 2026.",
    rows: [
      { label: "Active vendors", value: "4" },
      { label: "Avg. performance score", value: "81/100" },
      { label: "Contracts expiring soon", value: "1", rag: "amber" },
      { label: "Top performer", value: "Siemens MENA (91)" },
      { label: "Underperforming", value: "None", rag: "green" },
    ],
  },
};

const RAG_CLASS: Record<string, string> = {
  green: "text-rag-green",
  amber: "text-rag-amber",
  red: "text-rag-red",
};

// ── Page ──────────────────────────────────────────────────────────────────────

function ReportsPage() {
  const [preview, setPreview] = useState<typeof reports[number] | null>(null);

  function run(r: typeof reports[number]) {
    setPreview(r);
    toast.success(`Running ${r.name}…`, { description: "Report generated" });
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Scheduled and on-demand reports for every audience"
        actions={<Button className="bg-accent text-accent-foreground hover:bg-accent/90">Build custom report</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => (
          <div key={r.id} className="glass-card flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-dim text-accent">
                <FileBarChart className="h-5 w-5" />
              </div>
              <span className="rounded bg-secondary/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{r.frequency}</span>
            </div>
            <h3 className="mt-3 text-base font-medium text-foreground">{r.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Audience · {r.audience}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />Last run {r.lastRun}
            </div>
            <div className="mt-auto flex gap-2 pt-4">
              <Button size="sm" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => run(r)}>
                <Play className="mr-1 h-3.5 w-3.5" />Run
              </Button>
              <Button size="sm" variant="outline" onClick={() => { run(r); toast.success("Download started"); }}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Report preview dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => { if (!o) setPreview(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileBarChart className="h-4 w-4 text-accent" />
              {preview?.name}
            </DialogTitle>
          </DialogHeader>
          {preview && (() => {
            const content = REPORT_CONTENT[preview.id];
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{preview.frequency}</Badge>
                  <Badge variant="outline" className="text-[10px]">{preview.audience}</Badge>
                  <span className="ml-auto flex items-center gap-1 text-xs text-rag-green">
                    <CheckCircle2 className="h-3 w-3" />Generated just now
                  </span>
                </div>
                {content && (
                  <>
                    <p className="text-sm text-muted-foreground">{content.summary}</p>
                    <div className="overflow-hidden">
                      <Table>
                        <TableBody>
                          {content.rows.map((row) => (
                            <TableRow key={row.label}>
                              <TableCell className="text-muted-foreground">{row.label}</TableCell>
                              <TableCell className={`text-right font-medium num-mono ${row.rag ? RAG_CLASS[row.rag] : "text-foreground"}`}>
                                {row.value}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { toast.success("Download started"); setPreview(null); }}>
                    <Download className="mr-1.5 h-3.5 w-3.5" />Download
                  </Button>
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setPreview(null)}>
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
