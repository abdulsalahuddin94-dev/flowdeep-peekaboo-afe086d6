import { useMemo, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronLeft, ChevronRight, Columns3, Diamond, PanelLeftClose, PanelLeftOpen, Plus, UserPlus } from "lucide-react";
import { RagBadge } from "@/components/RagBadge";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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
  onItemPatch,
  onRequestSkill,
}: {
  items: ScheduleItem[];
  AddItemSlot?: React.ReactNode;
  onItemPatch?: (name: string, patch: Partial<ScheduleItem>) => void;
  onRequestSkill?: (itemName: string, role: RoleReq) => void;
}) {
  const [scale, setScale] = useState<Scale>("week");
  const [critical, setCritical] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(
    () => new Set<ColKey>(["type", "start", "end", "assignee", "status", "progress", "dep"]),
  );
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(items.map(i => i.name)));
  const [leftPct, setLeftPct] = useState(48);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  // Live preview overrides while dragging/resizing a bar
  const [dragPreview, setDragPreview] = useState<Record<string, { startDate: string; endDate: string }>>({});
  // Undo history: each entry is the list of patches needed to restore the prior state
  const historyRef = useRef<Array<Array<{ name: string; before: Partial<ScheduleItem> }>>>([]);
  const [widths, setWidths] = useState<Record<WidthKey, number>>(() => {
    const w: Record<string, number> = { name: DEFAULT_NAME_W };
    for (const c of COLUMNS) w[c.key] = c.w;
    return w as Record<WidthKey, number>;
  });
  const userResizedRef = useRef<Set<WidthKey>>(new Set());
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

  // Column resize (Excel-like: drag to resize, double-click to auto-fit)
  function startColResize(key: WidthKey, e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    userResizedRef.current.add(key);
    const startX = e.clientX;
    const startW = widths[key];
    const onMove = (ev: PointerEvent) => {
      const next = Math.min(MAX_COL_W, Math.max(MIN_COL_W, startW + (ev.clientX - startX)));
      setWidths(prev => ({ ...prev, [key]: next }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function computeFitWidth(key: WidthKey): number {
    const MONO_FONT = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    const headerLabel =
      key === "name" ? "Task Name" : (COLUMNS.find(c => c.key === key)?.label ?? "");
    let max = measureText(headerLabel, "600 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto");
    for (const { item, depth, hasChildren } of visibleRows) {
      let txt = "";
      let extra = 0;
      let font: string | undefined;
      switch (key) {
        case "name":
          txt = item.name;
          extra = depth * 14 + 16 + (hasChildren ? 4 : 0) + (item.kind === "Milestone" ? 16 : 0);
          break;
        case "type": txt = item.kind; extra = 20; break;
        case "start": txt = item.startDate || "—"; font = MONO_FONT; break;
        case "end": txt = item.endDate || "—"; font = MONO_FONT; break;
        case "owner": txt = item.owner; break;
        case "assignee": {
          const a = item.assignee?.trim();
          if (!a) { txt = "Request skill"; extra = 14 + 4 + 16 + 2; } // icon + gap + px-2*2 + border
          else if (a.toLowerCase() === "waiting") { txt = "Waiting"; extra = 16 + 2; }
          else { txt = a; extra = 6 + 6 + 16 + 2; } // dot + gap + padding + border
          break;
        }
        case "status": txt = statusText[item.rag]; extra = 6 + 6 + 16 + 2; break; // dot + gap + px-2*2 + border
        case "progress": txt = `${item.progress ?? 0}%`; extra = 60; break;
        case "dep": txt = item.dep || "—"; break;
        case "roles":
          txt = item.roles.length ? item.roles.map(r => `${r.role} (${r.fte})`).join(", ") : "—";
          break;
        case "payment":
          if (!item.payment || item.payment.kind === "None") txt = "—";
          else if (item.payment.kind === "Client Revenue") txt = `Revenue · ${item.payment.amount || "—"}`;
          else txt = `${item.payment.packageId || "Pkg"} · ${item.payment.amount || "—"}`;
          extra = 20;
          break;
      }
      const w = measureText(txt, font) + extra;
      if (w > max) max = w;
    }
    return Math.min(MAX_COL_W, Math.max(MIN_COL_W, Math.ceil(max + COL_PAD)));
  }

  function autoFitCol(key: WidthKey) {
    userResizedRef.current.add(key);
    setWidths(prev => ({ ...prev, [key]: computeFitWidth(key) }));
  }

  // Auto-fit all columns whenever data, visible cols, or expansion changes,
  // for any column the user has not manually resized.
  useEffect(() => {
    setWidths(prev => {
      const next = { ...prev };
      const keys: WidthKey[] = ["name", ...COLUMNS.map(c => c.key as WidthKey)];
      for (const k of keys) {
        if (userResizedRef.current.has(k)) continue;
        next[k] = computeFitWidth(k);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, visibleCols, expanded]);


  // Row index map for arrow drawing
  const rowIndex = useMemo(() => {
    const m = new Map<string, number>();
    visibleRows.forEach((r, i) => m.set(r.item.name, i));
    return m;
  }, [visibleRows]);

  // ── Undo (Ctrl+Z) ──────────────────────────────────────────────────────────
  function pushUndo(entry: Array<{ name: string; before: Partial<ScheduleItem> }>) {
    if (!entry.length) return;
    historyRef.current.push(entry);
    if (historyRef.current.length > 50) historyRef.current.shift();
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const z = (e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z") && !e.shiftKey;
      if (!z) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      const entry = historyRef.current.pop();
      if (!entry) return;
      e.preventDefault();
      for (const p of entry) onItemPatch?.(p.name, p.before);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onItemPatch]);

  // ── Bar drag / resize on the Gantt ─────────────────────────────────────────
  // Build dependents map (item.name -> names that depend on it)
  const dependentsOf = useMemo(() => {
    const m = new Map<string, string[]>();
    const byNameLc = new Map(items.map(i => [i.name.toLowerCase(), i]));
    for (const it of items) {
      const q = it.dep?.trim().toLowerCase();
      if (!q || q === "—") continue;
      const dep =
        byNameLc.get(q) ??
        items.find(i => i.name.toLowerCase().includes(q) || q.includes(i.name.toLowerCase()));
      if (dep) {
        if (!m.has(dep.name)) m.set(dep.name, []);
        m.get(dep.name)!.push(it.name);
      }
    }
    return m;
  }, [items]);

  function fmtISO(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  }

  // Collect cascading shift: returns map of name -> {startDate, endDate} after applying.
  // mode: 'move' shifts start+end; 'resize-end' shifts end only (dependents shift by delta);
  // 'resize-start' shifts start only (no dependent cascade).
  function computeShift(rootName: string, deltaDays: number, mode: "move" | "resize-end" | "resize-start") {
    const result: Record<string, { startDate: string; endDate: string }> = {};
    const byName = new Map(items.map(i => [i.name, i]));
    const root = byName.get(rootName);
    if (!root) return result;
    const rs = parseISO(root.startDate), re = parseISO(root.endDate);
    if (!rs || !re) return result;
    if (mode === "move") {
      result[rootName] = { startDate: fmtISO(addDays(rs, deltaDays)), endDate: fmtISO(addDays(re, deltaDays)) };
    } else if (mode === "resize-end") {
      const newEnd = addDays(re, deltaDays);
      if (diffDays(newEnd, rs) < 0) return result;
      result[rootName] = { startDate: root.startDate, endDate: fmtISO(newEnd) };
    } else {
      const newStart = addDays(rs, deltaDays);
      if (diffDays(re, newStart) < 0) return result;
      result[rootName] = { startDate: fmtISO(newStart), endDate: root.endDate };
    }
    if (mode === "resize-start") return result;
    // Cascade to dependents by the same delta (their end-anchor moves with predecessor end)
    const queue = [rootName];
    const seen = new Set([rootName]);
    while (queue.length) {
      const n = queue.shift()!;
      const deps = dependentsOf.get(n) ?? [];
      for (const dn of deps) {
        if (seen.has(dn)) continue;
        seen.add(dn);
        const di = byName.get(dn);
        if (!di) continue;
        const ds = parseISO(di.startDate), de = parseISO(di.endDate);
        if (!ds || !de) continue;
        result[dn] = { startDate: fmtISO(addDays(ds, deltaDays)), endDate: fmtISO(addDays(de, deltaDays)) };
        queue.push(dn);
      }
    }
    return result;
  }

  function beginBarDrag(name: string, mode: "move" | "resize-end" | "resize-start", e: React.PointerEvent) {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const byName = new Map(items.map(i => [i.name, i]));
    let lastDelta = 0;
    const onMove = (ev: PointerEvent) => {
      const delta = Math.round((ev.clientX - startX) / dayWidth);
      if (delta === lastDelta) return;
      lastDelta = delta;
      setDragPreview(delta === 0 ? {} : computeShift(name, delta, mode));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      const final = lastDelta === 0 ? {} : computeShift(name, lastDelta, mode);
      const names = Object.keys(final);
      if (names.length) {
        const undoEntry = names.map(n => {
          const orig = byName.get(n)!;
          return { name: n, before: { startDate: orig.startDate, endDate: orig.endDate } };
        });
        pushUndo(undoEntry);
        for (const n of names) onItemPatch?.(n, final[n]);
      }
      setDragPreview({});
    };
    document.body.style.cursor = mode === "move" ? "grabbing" : "ew-resize";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // Pan empty Gantt area (click-drag to scroll)
  function beginPan(e: React.PointerEvent) {
    if (e.button !== 0) return;
    const el = rightScrollRef.current;
    if (!el) return;
    const startX = e.clientX, startY = e.clientY;
    const startL = el.scrollLeft, startT = el.scrollTop;
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      moved = true;
      el.scrollLeft = startL - dx;
      el.scrollTop = startT - dy;
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "grabbing";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }


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

  // Inline edit helpers
  const editable = !!onItemPatch;
  const ragOptions: Rag[] = ["blue", "amber", "green", "red", "grey"];
  function patch(name: string, p: Partial<ScheduleItem>) { onItemPatch?.(name, p); }

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
        <div
          className={`flex flex-col overflow-hidden border-r border-border transition-[width] duration-200 ${leftCollapsed ? "border-r-0" : ""}`}
          style={{ width: leftCollapsed ? 0 : `${leftPct}%` }}
        >
          {/* Body (header is sticky inside so it scrolls horizontally with columns) */}
          <div ref={leftScrollRef} onScroll={onLeftScroll} className="flex-1 overflow-auto">
            <div style={{ width: widths.name + COLUMNS.filter(c => colVisible(c.key)).reduce((s,c) => s + widths[c.key], 0) }}>
              {/* Header */}
              <div className="sticky top-0 z-20 flex border-b border-border bg-secondary/60 backdrop-blur text-xs font-medium text-muted-foreground" style={{ height: ROW_H }}>
                <ColHeader label="Task Name" width={widths.name} onResize={(e) => startColResize("name", e)} onAutoFit={() => autoFitCol("name")} first />
                {COLUMNS.filter(c => colVisible(c.key)).map(c => (
                  <ColHeader key={c.key} label={c.label} width={widths[c.key]} onResize={(e) => startColResize(c.key, e)} onAutoFit={() => autoFitCol(c.key)} />
                ))}
              </div>
              {visibleRows.map(({ item, depth, hasChildren }) => {
                const isOpen = expanded.has(item.name);
                const isCrit = criticalSet.has(item.name);
                const isMs = item.kind === "Milestone";
                return (
                  <div key={item.name} className={`flex border-b border-border/60 text-xs ${isCrit ? "bg-rag-red/5" : ""}`} style={{ height: ROW_H }}>
                    <div className="flex items-center gap-1 px-2 overflow-hidden" style={{ width: widths.name, paddingLeft: 8 + depth * 14 }}>
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
                      <EditableText
                        value={item.name}
                        editable={editable}
                        className={`truncate font-medium ${hasChildren ? "text-foreground" : "text-foreground/90"} ${isCrit ? "text-rag-red" : ""}`}
                        onCommit={(v) => v && v !== item.name && patch(item.name, { name: v })}
                      />
                    </div>
                    {colVisible("type") && (
                      <div className="flex items-center border-l border-border/60 px-3 overflow-hidden" style={{ width: widths.type }}>
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground truncate">{item.kind}</span>
                      </div>
                    )}
                    {colVisible("start") && (
                      <div className="flex items-center border-l border-border/60 px-3 num-mono overflow-hidden" style={{ width: widths.start }}>
                        <DateRangeCell
                          item={item}
                          field="start"
                          editable={editable}
                          onCommit={(p) => patch(item.name, p)}
                        />
                      </div>
                    )}
                    {colVisible("end") && (
                      <div className="flex items-center border-l border-border/60 px-3 num-mono overflow-hidden" style={{ width: widths.end }}>
                        <DateRangeCell
                          item={item}
                          field="end"
                          editable={editable}
                          onCommit={(p) => patch(item.name, p)}
                        />
                      </div>
                    )}
                    {colVisible("owner") && (
                      <div className="flex items-center border-l border-border/60 px-3 overflow-hidden" style={{ width: widths.owner }}>
                        <EditableText
                          value={item.owner}
                          editable={editable}
                          onCommit={(v) => patch(item.name, { owner: v })}
                        />
                      </div>
                    )}
                    {colVisible("assignee") && (
                      <div className="flex items-center border-l border-border/60 px-3 overflow-hidden" style={{ width: widths.assignee }}>
                        <AssigneeCell
                          item={item}
                          editable={editable}
                          onCommit={(v) => patch(item.name, { assignee: v || undefined })}
                          onRequestSkill={(role) => onRequestSkill?.(item.name, role)}
                        />
                      </div>
                    )}
                    {colVisible("status") && (
                      <div className="flex items-center border-l border-border/60 px-3 overflow-hidden" style={{ width: widths.status }}>
                        {editable ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="outline-none focus:ring-1 focus:ring-accent rounded-md">
                                <RagBadge rag={item.rag} label={statusText[item.rag]} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-44">
                              {ragOptions.map((r) => (
                                <DropdownMenuItem
                                  key={r}
                                  onClick={() => patch(item.name, { rag: r })}
                                  className="gap-2"
                                >
                                  <RagBadge rag={r} label={statusText[r]} />
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <RagBadge rag={item.rag} label={statusText[item.rag]} />
                        )}
                      </div>
                    )}
                    {colVisible("progress") && (
                      <div className="flex items-center gap-2 border-l border-border/60 px-3 overflow-hidden" style={{ width: widths.progress }}>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/60">
                          <div className="h-full bg-accent" style={{ width: `${item.progress ?? 0}%` }} />
                        </div>
                        {editable ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.progress ?? 0}
                            onChange={(e) => {
                              const n = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                              patch(item.name, { progress: n });
                            }}
                            className="num-mono w-10 rounded bg-transparent text-right text-[10px] text-muted-foreground outline-none focus:ring-1 focus:ring-accent"
                          />
                        ) : (
                          <span className="num-mono text-[10px] text-muted-foreground">{item.progress ?? 0}%</span>
                        )}
                      </div>
                    )}
                    {colVisible("dep") && (
                      <div className="flex items-center border-l border-border/60 px-3 text-muted-foreground overflow-hidden" style={{ width: widths.dep }}>
                        <EditableText
                          value={item.dep || ""}
                          placeholder="—"
                          editable={editable}
                          onCommit={(v) => patch(item.name, { dep: v })}
                        />
                      </div>
                    )}
                    {colVisible("roles") && (
                      <div className="flex items-center gap-1 overflow-hidden border-l border-border/60 px-3" style={{ width: widths.roles }}>
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
                      <div className="flex items-center border-l border-border/60 px-3 overflow-hidden" style={{ width: widths.payment }}>
                        {!item.payment || item.payment.kind === "None" ? (
                          <span className="text-muted-foreground">—</span>
                        ) : item.payment.kind === "Client Revenue" ? (
                          <Badge variant="outline" className="border-rag-green/40 bg-rag-green/10 text-rag-green text-[10px] truncate">
                            Revenue · {item.payment.amount || "—"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-rag-amber/40 bg-rag-amber/10 text-rag-amber text-[10px] truncate">
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

        {/* Divider with collapse toggle */}
        <div className="relative flex items-stretch" style={{ zIndex: 10, width: leftCollapsed ? 0 : 4 }}>
          {!leftCollapsed && (
            <div
              onPointerDown={startDrag}
              className="w-1 cursor-col-resize bg-border hover:bg-accent/60 transition-colors"
              aria-label="Resize panes"
            />
          )}
          <button
            type="button"
            onClick={() => setLeftCollapsed((v) => !v)}
            title={leftCollapsed ? "Show table" : "Hide table"}
            aria-label={leftCollapsed ? "Show table" : "Hide table"}
            className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-1/2 z-30 flex h-7 w-5 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors"
          >
            {leftCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        </div>


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
              <div
                className="relative cursor-grab"
                style={{ height: visibleRows.length * ROW_H }}
                onPointerDown={beginPan}
              >
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
                    const fromOv = dragPreview[from.name];
                    const toOv = dragPreview[item.name];
                    const fromEnd = parseISO(fromOv?.endDate ?? from.endDate);
                    const toStart = parseISO(toOv?.startDate ?? item.startDate);
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
                  const ov = dragPreview[item.name];
                  const s = parseISO(ov?.startDate ?? item.startDate);
                  const e = parseISO(ov?.endDate ?? item.endDate);
                  if (!s || !e) return null;
                  const isMs = item.kind === "Milestone" || diffDays(e, s) === 0;
                  const x = xForDate(s);
                  const top = i * ROW_H;
                  const progress = Math.max(0, Math.min(100, item.progress ?? 0));

                  const ragColor: Record<typeof item.rag, { solid: string; soft: string; border: string; hex: string }> = {
                    green: { solid: "bg-rag-green", soft: "bg-rag-green/30", border: "border-rag-green/60", hex: "#22C55E" },
                    amber: { solid: "bg-rag-amber", soft: "bg-rag-amber/30", border: "border-rag-amber/60", hex: "#F59E0B" },
                    red:   { solid: "bg-rag-red",   soft: "bg-rag-red/30",   border: "border-rag-red/60",   hex: "#EF4444" },
                    blue:  { solid: "bg-rag-blue",  soft: "bg-rag-blue/30",  border: "border-rag-blue/60",  hex: "#3B82F6" },
                    grey:  { solid: "bg-rag-grey",  soft: "bg-rag-grey/30",  border: "border-rag-grey/60",  hex: "#94A3B8" },
                  } as const;
                  const rc = ragColor[item.rag];

                  if (isMs) {
                    const cx = x + dayWidth / 2;
                    const cy = top + ROW_H / 2;
                    return (
                      <div
                        key={item.name}
                        title={`${item.name} · ${ov?.endDate ?? item.endDate}`}
                        className={`absolute ${editable ? "cursor-grab active:cursor-grabbing" : ""}`}
                        style={{ left: cx - 8, top: cy - 8, width: 16, height: 16 }}
                        onPointerDown={(ev) => beginBarDrag(item.name, "move", ev)}
                      >
                        <div className={`h-full w-full rotate-45 border ${rc.border} ${rc.solid} shadow`} />
                      </div>
                    );
                  }

                  const days = Math.max(1, diffDays(e, s) + 1);
                  const w = days * dayWidth;
                  const barH = hasChildren ? 12 : 18;
                  const barTop = top + (ROW_H - barH) / 2;

                  if (hasChildren) {
                    return (
                      <div
                        key={item.name}
                        className={`absolute ${editable ? "cursor-grab active:cursor-grabbing" : ""}`}
                        style={{ left: x, top: barTop, width: w, height: barH }}
                        onPointerDown={(ev) => beginBarDrag(item.name, "move", ev)}
                      >
                        <div className={`relative h-full w-full ${rc.solid} opacity-80 rounded-sm`}>
                          <div className="absolute left-0 top-full h-2 w-2 -translate-x-0 border-t-[6px] border-l-[3px] border-r-[3px] border-transparent" style={{ borderTopColor: rc.hex }} />
                          <div className="absolute right-0 top-full h-2 w-2 border-t-[6px] border-l-[3px] border-r-[3px] border-transparent" style={{ borderTopColor: rc.hex }} />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.name}
                      title={`${item.name} · ${fmt(s)} → ${fmt(e)} · ${progress}%`}
                      className={`absolute rounded-md border ${rc.border} overflow-hidden ${editable ? "cursor-grab active:cursor-grabbing" : ""}`}
                      style={{ left: x, top: barTop, width: w, height: barH }}
                      onPointerDown={(ev) => beginBarDrag(item.name, "move", ev)}
                    >
                      <div className={`absolute inset-0 ${rc.soft}`} />
                      <div className={`absolute inset-y-0 left-0 ${rc.solid}`} style={{ width: `${progress}%` }} />
                      <div className="absolute inset-0 flex items-center px-1.5 pointer-events-none">
                        <span className="truncate text-[10px] font-medium text-foreground/90">{item.name}</span>
                      </div>
                      {editable && (
                        <>
                          <div
                            onPointerDown={(ev) => beginBarDrag(item.name, "resize-start", ev)}
                            className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize hover:bg-foreground/30"
                          />
                          <div
                            onPointerDown={(ev) => beginBarDrag(item.name, "resize-end", ev)}
                            className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize hover:bg-foreground/30"
                          />
                        </>
                      )}
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

// ── Column header with drag-to-resize + double-click auto-fit ────────────────
function ColHeader({
  label,
  width,
  onResize,
  onAutoFit,
  first,
}: {
  label: string;
  width: number;
  onResize: (e: React.PointerEvent) => void;
  onAutoFit: () => void;
  first?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center px-3 ${first ? "" : "border-l border-border"}`}
      style={{ width }}
    >
      <span className="truncate">{label}</span>
      <div
        onPointerDown={onResize}
        onDoubleClick={onAutoFit}
        title="Drag to resize · Double-click to auto-fit"
        className="absolute right-0 top-0 z-30 h-full w-1.5 cursor-col-resize select-none hover:bg-accent/60"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}

// ── Inline-editable text/date cell (click to edit, Enter/blur to commit) ─────
function EditableText({
  value,
  onCommit,
  editable = true,
  type = "text",
  placeholder,
  className,
}: {
  value: string;
  onCommit: (v: string) => void;
  editable?: boolean;
  type?: "text" | "date";
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);

  if (!editable) {
    return (
      <span className={`truncate ${className ?? ""}`}>
        {value || <span className="text-muted-foreground">{placeholder ?? "—"}</span>}
      </span>
    );
  }

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className={`block w-full cursor-text truncate rounded px-0.5 hover:bg-accent/10 ${className ?? ""}`}
        title="Click to edit"
      >
        {value || <span className="text-muted-foreground">{placeholder ?? "—"}</span>}
      </span>
    );
  }

  return (
    <input
      autoFocus
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); if (draft !== value) onCommit(draft); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); }
        else if (e.key === "Escape") { setDraft(value); setEditing(false); }
      }}
      className={`w-full rounded bg-background px-1 py-0.5 text-xs outline-none ring-1 ring-accent ${className ?? ""}`}
    />
  );
}

// ── Date range cell with two-month calendar popover ─────────────────────────
function DateRangeCell({
  item,
  field,
  editable,
  onCommit,
}: {
  item: ScheduleItem;
  field: "start" | "end";
  editable: boolean;
  onCommit: (patch: Partial<ScheduleItem>) => void;
}) {
  const [open, setOpen] = useState(false);
  const start = parseISO(item.startDate);
  const end = parseISO(item.endDate);
  const display = field === "start" ? item.startDate : item.endDate;

  const trigger = (
    <button
      className="block w-full cursor-text truncate rounded px-0.5 text-left hover:bg-accent/10"
      title="Click to edit dates"
    >
      {display || <span className="text-muted-foreground">—</span>}
    </button>
  );

  if (!editable) {
    return (
      <span className="truncate">
        {display || <span className="text-muted-foreground">—</span>}
      </span>
    );
  }

  const fmtISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  };
  const duration = start && end ? Math.max(1, diffDays(end, start) + 1) : 1;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-4 pointer-events-auto" align="start">
        <div className="mb-3 grid grid-cols-3 gap-3">
          <div>
            <Label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">Start date</Label>
            <Input
              type="date"
              value={item.startDate || ""}
              onChange={(e) => onCommit({ startDate: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">Due date</Label>
            <Input
              type="date"
              value={item.endDate || ""}
              onChange={(e) => onCommit({ endDate: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">Duration</Label>
            <Input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => {
                const n = Math.max(1, Number(e.target.value) || 1);
                if (start) onCommit({ endDate: fmtISO(addDays(start, n - 1)) });
              }}
              className="h-8 text-xs num-mono"
            />
          </div>
        </div>
        <Calendar
          mode="range"
          numberOfMonths={2}
          defaultMonth={start ?? new Date()}
          selected={start && end ? { from: start, to: end } : start ? { from: start, to: start } : undefined}
          onSelect={(r) => {
            if (!r) return;
            const patch: Partial<ScheduleItem> = {};
            if (r.from) patch.startDate = fmtISO(r.from);
            if (r.to) patch.endDate = fmtISO(r.to);
            else if (r.from) patch.endDate = fmtISO(r.from);
            onCommit(patch);
          }}
          className={cn("p-0 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

// ── Assignee cell: name pill / Waiting / request skill popover ──────────────
function AssigneeCell({
  item,
  editable,
  onCommit,
  onRequestSkill,
}: {
  item: ScheduleItem;
  editable: boolean;
  onCommit: (v: string) => void;
  onRequestSkill: (role: RoleReq) => void;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("");
  const [skill, setSkill] = useState<RoleReq["skill"]>("Mid");
  const [fte, setFte] = useState("1");

  const a = item.assignee?.trim();
  const isWaiting = a?.toLowerCase() === "waiting";
  const isEmpty = !a;

  if (!editable) {
    if (isEmpty) return <span className="text-muted-foreground">—</span>;
    if (isWaiting)
      return (
        <Badge variant="outline" className="border-rag-amber/40 bg-rag-amber/10 text-rag-amber text-[10px]">
          Waiting
        </Badge>
      );
    return <span className="truncate text-foreground/90">{a}</span>;
  }

  if (isWaiting) {
    return (
      <Badge variant="outline" className="border-rag-amber/40 bg-rag-amber/10 text-rag-amber text-[10px]">
        Waiting
      </Badge>
    );
  }

  if (!isEmpty) {
    return (
      <button
        onClick={() => onCommit("")}
        title="Click to clear"
        className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-foreground hover:bg-accent/20"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="truncate">{a}</span>
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-accent hover:text-foreground">
          <UserPlus className="h-3 w-3 shrink-0" /> Request skill
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="mb-2 text-xs font-medium">Request a skill</div>
        <p className="mb-3 text-[11px] text-muted-foreground">
          Sent to Resources. When fulfilled, the assignee will appear here.
        </p>
        <div className="space-y-2">
          <div>
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. QA Engineer" className="h-8 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Skill level</Label>
              <Select value={skill} onValueChange={(v) => setSkill(v as RoleReq["skill"])}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Junior", "Mid", "Senior", "Lead"] as const).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">FTE</Label>
              <Input type="number" min={0.1} step={0.1} value={fte} onChange={(e) => setFte(e.target.value)} className="h-8 text-xs num-mono" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={!role.trim()}
            onClick={() => {
              onRequestSkill({ role: role.trim(), skill, fte: parseFloat(fte) || 1 });
              setOpen(false);
              setRole(""); setSkill("Mid"); setFte("1");
            }}
          >
            <Plus className="mr-1 h-3 w-3" /> Send request
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
