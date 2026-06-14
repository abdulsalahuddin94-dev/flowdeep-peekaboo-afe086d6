import { useMemo, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, Columns3, Diamond } from "lucide-react";
import { RagBadge } from "@/components/RagBadge";
import { useSidebar } from "@/components/ui/sidebar";

// ── Shared types (mirror parent file) ────────────────────────────────────────
export type ItemKind = "Milestone" | "Activity" | "Task";
export type Rag = "green" | "amber" | "red" | "blue" | "grey";
export type RoleReq = { role: string; skill: "Junior" | "Mid" | "Senior" | "Lead"; fte: number };
export type PaymentLink = { kind: "None" | "Client Revenue" | "Package Cost"; amount: string; packageId?: string };
export type ScheduleItem = {
  name: string;
  kind: ItemKind;
  startDate: string;
  endDate: string;
  owner: string;
  rag: Rag;
  dep: string;
  roles: RoleReq[];
  payment?: PaymentLink;
  progress?: number;
  parent?: string;
  assignee?: string;
};

type Scale = "day" | "week" | "month";

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}
function diffDays(a: Date, b: Date) { return Math.round((a.getTime() - b.getTime()) / 86400000); }
function addDays(d: Date, n: number) { const o = new Date(d); o.setDate(o.getDate() + n); return o; }
function fmt(d: Date) { return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Column config ────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "type",     label: "Type",        w: 90 },
  { key: "start",    label: "Start",       w: 100 },
  { key: "end",      label: "End",         w: 100 },
  { key: "owner",    label: "Owner",       w: 110 },
  { key: "assignee", label: "Assignee",    w: 130 },
  { key: "status",   label: "Status",      w: 110 },
  { key: "progress", label: "% Complete",  w: 110 },
  { key: "dep",      label: "Depends on",  w: 110 },
  { key: "roles",    label: "Roles",       w: 180 },
  { key: "payment",  label: "Payment link",w: 160 },
] as const;
type ColKey = typeof COLUMNS[number]["key"];
type WidthKey = ColKey | "name";

const ROW_H = 36;
const DEFAULT_NAME_W = 280;
const MIN_COL_W = 56;
const MAX_COL_W = 800;
const COL_PAD = 28; // px of horizontal padding for autofit (px-3 on both sides + border)

// Shared canvas for text measurement (Excel-like auto-fit)
let _measureCtx: CanvasRenderingContext2D | null = null;
function measureText(text: string, font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto") {
  if (typeof document === "undefined") return text.length * 7;
  if (!_measureCtx) {
    const c = document.createElement("canvas");
    _measureCtx = c.getContext("2d");
  }
  if (!_measureCtx) return text.length * 7;
  _measureCtx.font = font;
  return _measureCtx.measureText(text).width;
}

export function ProjectSchedule({
  items,
  AddItemSlot,
}: {
  items: ScheduleItem[];
  AddItemSlot?: React.ReactNode;
}) {
  const [scale, setScale] = useState<Scale>("week");
  const [critical, setCritical] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(
    () => new Set<ColKey>(["type", "start", "end", "assignee", "status", "progress", "dep"]),
  );
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(items.map(i => i.name)));
  const [leftPct, setLeftPct] = useState(48);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const leftScrollRef = useRef<HTMLDivElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-collapse app sidebar while viewing the schedule for more horizontal room
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();
  useEffect(() => {
    const wasOpen = sidebarOpen;
    setSidebarOpen(false);
    return () => { if (wasOpen) setSidebarOpen(true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-expand newly added parents
  useEffect(() => {
    setExpanded(prev => {
      const next = new Set(prev);
      for (const it of items) if (!prev.has(it.name)) next.add(it.name);
      return next;
    });
  }, [items]);

  // Build tree: top-level = items with no parent matching another item's name.
  const nameSet = useMemo(() => new Set(items.map(i => i.name)), [items]);
  const childrenOf = useMemo(() => {
    const m = new Map<string, ScheduleItem[]>();
    for (const it of items) {
      const p = it.parent && nameSet.has(it.parent) ? it.parent : "__root__";
      if (!m.has(p)) m.set(p, []);
      m.get(p)!.push(it);
    }
    return m;
  }, [items, nameSet]);

  // Flatten visible rows in tree order, with depth
  const visibleRows = useMemo(() => {
    const out: { item: ScheduleItem; depth: number; hasChildren: boolean }[] = [];
    function walk(parent: string, depth: number) {
      const kids = childrenOf.get(parent) ?? [];
      for (const it of kids) {
        const hasChildren = (childrenOf.get(it.name)?.length ?? 0) > 0;
        out.push({ item: it, depth, hasChildren });
        if (hasChildren && expanded.has(it.name)) walk(it.name, depth + 1);
      }
    }
    walk("__root__", 0);
    return out;
  }, [childrenOf, expanded]);

  // Date range
  const { minDate, maxDate } = useMemo(() => {
    const ds = items.flatMap(i => [parseISO(i.startDate), parseISO(i.endDate)]).filter(Boolean) as Date[];
    if (!ds.length) {
      const now = new Date(); now.setHours(0,0,0,0);
      return { minDate: now, maxDate: addDays(now, 30) };
    }
    let min = ds[0], max = ds[0];
    for (const d of ds) { if (d < min) min = d; if (d > max) max = d; }
    return { minDate: addDays(min, -3), maxDate: addDays(max, 3) };
  }, [items]);

  // Scale config
  const dayWidth = scale === "day" ? 36 : scale === "week" ? 18 : 6;
  const totalDays = Math.max(1, diffDays(maxDate, minDate) + 1);
  const chartWidth = totalDays * dayWidth;

  // Critical path: items reachable backward via `dep` from the latest-ending item.
  const criticalSet = useMemo(() => {
    const set = new Set<string>();
    if (!critical || !items.length) return set;
    const byName = new Map(items.map(i => [i.name.toLowerCase(), i]));
    const findDep = (depStr: string): ScheduleItem | undefined => {
      const q = depStr.trim().toLowerCase();
      if (!q || q === "—") return undefined;
      if (byName.has(q)) return byName.get(q);
      // fuzzy substring match either way
      return items.find(i =>
        i.name.toLowerCase().includes(q) || q.includes(i.name.toLowerCase()),
      );
    };
    // Pick latest-ending item
    let last = items[0];
    for (const it of items) {
      const a = parseISO(it.endDate), b = parseISO(last.endDate);
      if (a && b && a > b) last = it;
    }
    let cur: ScheduleItem | undefined = last;
    const guard = new Set<string>();
    while (cur && !guard.has(cur.name)) {
      guard.add(cur.name);
      set.add(cur.name);
      cur = findDep(cur.dep);
    }
    return set;
  }, [critical, items]);

  // Header buckets per scale
  const headerCells = useMemo(() => {
    type Cell = { label: string; widthDays: number; sub?: string };
    const cells: Cell[] = [];
    if (scale === "day") {
      for (let i = 0; i < totalDays; i++) {
        const d = addDays(minDate, i);
        cells.push({ label: String(d.getDate()), widthDays: 1, sub: MONTHS[d.getMonth()] });
      }
    } else if (scale === "week") {
      let i = 0;
      while (i < totalDays) {
        const d = addDays(minDate, i);
        const dow = d.getDay();
        const remainingToSunday = (7 - dow) % 7 || 7;
        const w = Math.min(remainingToSunday, totalDays - i);
        cells.push({ label: `${MONTHS[d.getMonth()]} ${d.getDate()}`, widthDays: w });
        i += w;
      }
    } else {
      let i = 0;
      while (i < totalDays) {
        const d = addDays(minDate, i);
        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const remaining = daysInMonth - d.getDate() + 1;
        const w = Math.min(remaining, totalDays - i);
        cells.push({ label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, widthDays: w });
        i += w;
      }
    }
    return cells;
  }, [scale, minDate, totalDays]);

  // Sync vertical scroll between panes
  function onLeftScroll() {
    if (rightScrollRef.current && leftScrollRef.current) {
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
    }
  }
  function onRightScroll() {
    if (leftScrollRef.current && rightScrollRef.current) {
      leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
    }
  }

  // Resizable divider
  function startDrag(e: React.PointerEvent) {
    e.preventDefault();
    const rect = splitRef.current?.getBoundingClientRect();
    if (!rect) return;
    const onMove = (ev: PointerEvent) => {
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(80, Math.max(20, pct)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // Row index map for arrow drawing
  const rowIndex = useMemo(() => {
    const m = new Map<string, number>();
    visibleRows.forEach((r, i) => m.set(r.item.name, i));
    return m;
  }, [visibleRows]);

  function findDepItem(depStr: string): ScheduleItem | undefined {
    const q = depStr?.trim().toLowerCase();
    if (!q || q === "—") return undefined;
    return items.find(i =>
      i.name.toLowerCase() === q ||
      i.name.toLowerCase().includes(q) ||
      q.includes(i.name.toLowerCase()),
    );
  }

  function xForDate(d: Date) { return diffDays(d, minDate) * dayWidth; }

  const statusText: Record<Rag, string> = {
    green: "Completed", amber: "In Progress", red: "Overdue", blue: "Not Started", grey: "On Hold",
  };

  function colVisible(k: ColKey) { return visibleCols.has(k); }

  return (
    <div className="glass-card overflow-hidden">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <div className="flex items-center gap-3">
          <div className="label-eyebrow">Project Schedule</div>
          <Badge variant="outline" className="border-border bg-secondary/40">{items.length} items</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            type="single"
            value={scale}
            onValueChange={(v) => v && setScale(v as Scale)}
            className="rounded-md border border-border bg-secondary/40 p-0.5"
          >
            <ToggleGroupItem value="day" className="h-7 px-2 text-xs">Days</ToggleGroupItem>
            <ToggleGroupItem value="week" className="h-7 px-2 text-xs">Weeks</ToggleGroupItem>
            <ToggleGroupItem value="month" className="h-7 px-2 text-xs">Months</ToggleGroupItem>
          </ToggleGroup>

          <div className="flex items-center gap-2">
            <Switch id="critpath" checked={critical} onCheckedChange={setCritical} />
            <Label htmlFor="critpath" className="text-xs text-muted-foreground">Critical path</Label>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <Columns3 className="h-3.5 w-3.5" />Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Show columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COLUMNS.map(c => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={visibleCols.has(c.key)}
                  onCheckedChange={(v) => {
                    setVisibleCols(prev => {
                      const next = new Set(prev);
                      if (v) next.add(c.key); else next.delete(c.key);
                      return next;
                    });
                  }}
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {AddItemSlot}
        </div>
      </div>

      {/* Split pane */}
      <div ref={splitRef} className="relative flex" style={{ height: 560 }}>
        {/* LEFT: table */}
        <div className="flex flex-col overflow-hidden border-r border-border" style={{ width: `${leftPct}%` }}>
          {/* Body (header is sticky inside so it scrolls horizontally with columns) */}
          <div ref={leftScrollRef} onScroll={onLeftScroll} className="flex-1 overflow-auto">
            <div style={{ width: NAME_COL_W + COLUMNS.filter(c => colVisible(c.key)).reduce((s,c) => s + c.w, 0) }}>
              {/* Header */}
              <div className="sticky top-0 z-20 flex border-b border-border bg-secondary/60 backdrop-blur text-xs font-medium text-muted-foreground" style={{ height: ROW_H }}>
                <div className="flex items-center px-3" style={{ width: NAME_COL_W }}>Task Name</div>
                {COLUMNS.filter(c => colVisible(c.key)).map(c => (
                  <div key={c.key} className="flex items-center border-l border-border px-3" style={{ width: c.w }}>{c.label}</div>
                ))}
              </div>
              {visibleRows.map(({ item, depth, hasChildren }) => {
                const isOpen = expanded.has(item.name);
                const isCrit = criticalSet.has(item.name);
                const isMs = item.kind === "Milestone";
                return (
                  <div key={item.name} className={`flex border-b border-border/60 text-xs ${isCrit ? "bg-rag-red/5" : ""}`} style={{ height: ROW_H }}>
                    <div className="flex items-center gap-1 px-2" style={{ width: NAME_COL_W, paddingLeft: 8 + depth * 14 }}>
                      {hasChildren ? (
                        <button
                          onClick={() => setExpanded(prev => {
                            const n = new Set(prev);
                            if (n.has(item.name)) n.delete(item.name); else n.add(item.name);
                            return n;
                          })}
                          className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                      ) : (
                        <span className="inline-block h-4 w-4" />
                      )}
                      {isMs && <Diamond className="h-3 w-3 shrink-0 text-accent" />}
                      <span className={`truncate font-medium ${hasChildren ? "text-foreground" : "text-foreground/90"} ${isCrit ? "text-rag-red" : ""}`}>{item.name}</span>
                    </div>
                    {colVisible("type") && (
                      <div className="flex items-center border-l border-border/60 px-3" style={{ width: 90 }}>
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{item.kind}</span>
                      </div>
                    )}
                    {colVisible("start") && (
                      <div className="flex items-center border-l border-border/60 px-3 num-mono" style={{ width: 100 }}>{item.startDate || "—"}</div>
                    )}
                    {colVisible("end") && (
                      <div className="flex items-center border-l border-border/60 px-3 num-mono" style={{ width: 100 }}>{item.endDate || "—"}</div>
                    )}
                    {colVisible("owner") && (
                      <div className="flex items-center border-l border-border/60 px-3 truncate" style={{ width: 110 }}>{item.owner}</div>
                    )}
                    {colVisible("assignee") && (
                      <div className="flex items-center border-l border-border/60 px-3 truncate" style={{ width: 130 }}>
                        {item.assignee ? (
                          <span className="truncate">{item.assignee}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    )}
                    {colVisible("status") && (
                      <div className="flex items-center border-l border-border/60 px-3" style={{ width: 110 }}>
                        <RagBadge rag={item.rag} label={statusText[item.rag]} />
                      </div>
                    )}
                    {colVisible("progress") && (
                      <div className="flex items-center gap-2 border-l border-border/60 px-3" style={{ width: 110 }}>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/60">
                          <div className="h-full bg-accent" style={{ width: `${item.progress ?? 0}%` }} />
                        </div>
                        <span className="num-mono text-[10px] text-muted-foreground">{item.progress ?? 0}%</span>
                      </div>
                    )}
                    {colVisible("dep") && (
                      <div className="flex items-center border-l border-border/60 px-3 text-muted-foreground truncate" style={{ width: 110 }}>{item.dep || "—"}</div>
                    )}
                    {colVisible("roles") && (
                      <div className="flex items-center gap-1 overflow-hidden border-l border-border/60 px-3" style={{ width: 180 }}>
                        {item.roles.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="truncate text-[10px] text-muted-foreground">
                            {item.roles.map(r => `${r.role} (${r.fte})`).join(", ")}
                          </span>
                        )}
                      </div>
                    )}
                    {colVisible("payment") && (
                      <div className="flex items-center border-l border-border/60 px-3" style={{ width: 160 }}>
                        {!item.payment || item.payment.kind === "None" ? (
                          <span className="text-muted-foreground">—</span>
                        ) : item.payment.kind === "Client Revenue" ? (
                          <Badge variant="outline" className="border-rag-green/40 bg-rag-green/10 text-rag-green text-[10px]">
                            Revenue · {item.payment.amount || "—"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-rag-amber/40 bg-rag-amber/10 text-rag-amber text-[10px]">
                            {item.payment.packageId || "Pkg"} · {item.payment.amount || "—"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          onPointerDown={startDrag}
          className="w-1 cursor-col-resize bg-border hover:bg-accent/60 transition-colors"
          style={{ zIndex: 10 }}
          aria-label="Resize panes"
        />

        {/* RIGHT: gantt */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div ref={rightScrollRef} onScroll={onRightScroll} className="flex-1 overflow-auto">
            <div style={{ width: chartWidth, minWidth: "100%" }}>
              {/* Header */}
              <div className="sticky top-0 z-20 bg-secondary/30 border-b border-border" style={{ height: ROW_H }}>
                <div className="flex h-full">
                  {headerCells.map((c, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center justify-center border-l border-border/60 text-[10px] text-muted-foreground"
                      style={{ width: c.widthDays * dayWidth }}
                    >
                      <span className="font-medium">{c.label}</span>
                      {c.sub && <span className="text-[9px] opacity-70">{c.sub}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Body with grid + bars + arrows */}
              <div className="relative" style={{ height: visibleRows.length * ROW_H }}>
                {/* Vertical grid lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {headerCells.map((c, i) => (
                    <div key={i} className="border-l border-border/30" style={{ width: c.widthDays * dayWidth }} />
                  ))}
                </div>
                {/* Row stripes */}
                {visibleRows.map((r, i) => (
                  <div
                    key={r.item.name}
                    className={`absolute left-0 right-0 border-b border-border/40 ${criticalSet.has(r.item.name) ? "bg-rag-red/5" : ""}`}
                    style={{ top: i * ROW_H, height: ROW_H }}
                  />
                ))}

                {/* SVG dependency arrows */}
                <svg className="absolute inset-0 pointer-events-none" width={chartWidth} height={visibleRows.length * ROW_H}>
                  <defs>
                    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M0,0 L10,5 L0,10 z" fill="#94A3B8" />
                    </marker>
                    <marker id="arr-crit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M0,0 L10,5 L0,10 z" fill="#EF4444" />
                    </marker>
                  </defs>
                  {visibleRows.map(({ item }, toIdx) => {
                    const from = findDepItem(item.dep);
                    if (!from) return null;
                    const fromIdx = rowIndex.get(from.name);
                    if (fromIdx === undefined) return null;
                    const fromEnd = parseISO(from.endDate);
                    const toStart = parseISO(item.startDate);
                    if (!fromEnd || !toStart) return null;
                    const x1 = xForDate(fromEnd) + dayWidth;
                    const y1 = fromIdx * ROW_H + ROW_H / 2;
                    const x2 = xForDate(toStart);
                    const y2 = toIdx * ROW_H + ROW_H / 2;
                    const isCrit = criticalSet.has(item.name) && criticalSet.has(from.name);
                    const stroke = isCrit ? "#EF4444" : "#94A3B8";
                    const midX = Math.max(x1 + 8, x2 - 8);
                    const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
                    return (
                      <path
                        key={`${from.name}->${item.name}`}
                        d={d}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={1.2}
                        opacity={0.7}
                        markerEnd={isCrit ? "url(#arr-crit)" : "url(#arr)"}
                      />
                    );
                  })}
                </svg>

                {/* Bars / Milestones */}
                {visibleRows.map(({ item, hasChildren }, i) => {
                  const s = parseISO(item.startDate);
                  const e = parseISO(item.endDate);
                  if (!s || !e) return null;
                  const isMs = item.kind === "Milestone" || diffDays(e, s) === 0;
                  const isCrit = criticalSet.has(item.name);
                  const x = xForDate(s);
                  const top = i * ROW_H;
                  const progress = Math.max(0, Math.min(100, item.progress ?? 0));

                  if (isMs) {
                    const cx = x + dayWidth / 2;
                    const cy = top + ROW_H / 2;
                    return (
                      <div
                        key={item.name}
                        title={`${item.name} · ${item.endDate}`}
                        className="absolute"
                        style={{ left: cx - 8, top: cy - 8, width: 16, height: 16 }}
                      >
                        <div
                          className={`h-full w-full rotate-45 border ${isCrit ? "border-rag-red bg-rag-red" : "border-accent bg-accent"} shadow`}
                        />
                      </div>
                    );
                  }

                  const days = Math.max(1, diffDays(e, s) + 1);
                  const w = days * dayWidth;
                  const barH = hasChildren ? 12 : 18;
                  const barTop = top + (ROW_H - barH) / 2;

                  if (hasChildren) {
                    // Summary bar (bracket-like)
                    return (
                      <div key={item.name} className="absolute" style={{ left: x, top: barTop, width: w, height: barH }}>
                        <div className={`relative h-full w-full ${isCrit ? "bg-rag-red" : "bg-foreground"} opacity-80 rounded-sm`}>
                          <div className="absolute left-0 top-full h-2 w-2 -translate-x-0 border-t-[6px] border-l-[3px] border-r-[3px] border-transparent" style={{ borderTopColor: isCrit ? "#EF4444" : "currentColor" }} />
                          <div className="absolute right-0 top-full h-2 w-2 border-t-[6px] border-l-[3px] border-r-[3px] border-transparent" style={{ borderTopColor: isCrit ? "#EF4444" : "currentColor" }} />

                        </div>
                      </div>
                    );
                  }

                  const baseColor = isCrit ? "bg-rag-red/30" : "bg-accent/30";
                  const fillColor = isCrit ? "bg-rag-red" : "bg-accent";
                  return (
                    <div
                      key={item.name}
                      title={`${item.name} · ${fmt(s)} → ${fmt(e)} · ${progress}%`}
                      className={`absolute rounded-md border ${isCrit ? "border-rag-red/60" : "border-accent/60"} overflow-hidden`}
                      style={{ left: x, top: barTop, width: w, height: barH }}
                    >
                      <div className={`absolute inset-0 ${baseColor}`} />
                      <div className={`absolute inset-y-0 left-0 ${fillColor}`} style={{ width: `${progress}%` }} />
                      <div className="absolute inset-0 flex items-center px-1.5">
                        <span className="truncate text-[10px] font-medium text-foreground/90">{item.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border bg-secondary/20 px-3 py-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Diamond className="h-3 w-3 text-accent" /> Milestone</span>
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-accent" /> Task / Activity (fill = % complete)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-foreground/80" /> Summary</span>
          {critical && <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-rag-red" /> Critical path</span>}
        </div>
        <div>Range: {fmt(minDate)} – {fmt(maxDate)}</div>
      </div>
    </div>
  );
}
