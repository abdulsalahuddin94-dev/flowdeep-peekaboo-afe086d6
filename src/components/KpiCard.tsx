import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function KpiCard({
  label, value, sub, accent, icon, className, children,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "teal" | "red" | "amber" | "green" | "blue";
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  const accentMap = {
    teal: "text-accent",
    red: "text-rag-red",
    amber: "text-rag-amber",
    green: "text-rag-green",
    blue: "text-rag-blue",
  } as const;
  return (
    <div className={cn("glass-card p-5", className)}>
      <div className="flex items-start justify-between">
        <div className="label-eyebrow">{label}</div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className={cn("mt-2 text-3xl font-medium num-mono", accent ? accentMap[accent] : "text-foreground")}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
