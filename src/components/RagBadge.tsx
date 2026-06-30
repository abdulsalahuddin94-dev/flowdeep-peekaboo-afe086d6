import type { Rag } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const map: Record<Rag, { label: string; dot: string; text: string; bg: string; border: string }> = {
  green: { label: "On Track", dot: "bg-rag-green", text: "text-rag-green", bg: "bg-rag-green/10", border: "border-rag-green/30" },
  amber: { label: "At Risk", dot: "bg-rag-amber", text: "text-rag-amber", bg: "bg-rag-amber/10", border: "border-rag-amber/30" },
  red: { label: "Off-Track", dot: "bg-rag-red pulse-dot", text: "text-rag-red", bg: "bg-rag-red/10", border: "border-rag-red/30" },
  blue: { label: "Not Started", dot: "bg-rag-blue", text: "text-rag-blue", bg: "bg-rag-blue/10", border: "border-rag-blue/30" },
  grey: { label: "On Hold", dot: "bg-rag-grey", text: "text-rag-grey", bg: "bg-rag-grey/10", border: "border-rag-grey/30" },
};

export function RagDot({ rag, className }: { rag: Rag; className?: string }) {
  return <span className={cn("inline-block h-2 w-2 rounded-full", map[rag].dot, className)} />;
}

export function RagBadge({ rag, label, className }: { rag: Rag; label?: string; className?: string }) {
  const m = map[rag];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium", m.bg, m.text, m.border, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {label ?? m.label}
    </span>
  );
}
