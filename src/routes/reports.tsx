import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { reports } from "@/lib/mock-data";
import { FileBarChart, Calendar, Download, Play } from "lucide-react";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports — Nexus PMO" }, { name: "description", content: "Scheduled and on-demand reports for executive, finance, resource and governance audiences." }] }),
});

function ReportsPage() {
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
              <Button size="sm" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"><Play className="mr-1 h-3.5 w-3.5" />Run</Button>
              <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
