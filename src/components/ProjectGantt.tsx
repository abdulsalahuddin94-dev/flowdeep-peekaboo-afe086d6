import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ColorKey = "blue" | "green" | "peach" | "pink" | "violet" | "amber";

interface Task {
  id: string;
  project_id: string;
  lane: string;
  label: string;
  start_date: string; // YYYY-MM-DD
  duration_days: number;
  assignee: string | null;
  color: ColorKey;
  sort_order: number;
}

const palette: Record<ColorKey, { bg: string; bd: string; tx: string; av: string }> = {
  blue:   { bg: "bg-blue-500/15",    bd: "border-blue-500/30",    tx: "text-blue-300",    av: "bg-blue-500/30 text-blue-100" },
  green:  { bg: "bg-emerald-500/15", bd: "border-emerald-500/30", tx: "text-emerald-300", av: "bg-emerald-500/30 text-emerald-100" },
  peach:  { bg: "bg-orange-500/15",  bd: "border-orange-500/30",  tx: "text-orange-200",  av: "bg-orange-500/30 text-orange-100" },
  pink:   { bg: "bg-pink-500/15",    bd: "border-pink-500/30",    tx: "text-pink-200",    av: "bg-pink-500/30 text-pink-100" },
  violet: { bg: "bg-violet-500/15",  bd: "border-violet-500/30",  tx: "text-violet-200",  av: "bg-violet-500/30 text-violet-100" },
  amber:  { bg: "bg-amber-500/15",   bd: "border-amber-500/30",   tx: "text-amber-200",   av: "bg-amber-500/30 text-amber-100" },
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function startOfWeek(d: Date) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = out.getDay();
  const diff = (day + 6) % 7; // Monday start
  out.setDate(out.getDate() - diff);
  return out;
}
function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}
function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fromISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function diffDays(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}
function initials(name: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).map((s) => s[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

export function ProjectGantt({ projectId, defaultAssignee }: { projectId: string; defaultAssignee?: string }) {
  const qc = useQueryClient();
  const today = useMemo(() => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }, []);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = days[6];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["project_tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true })
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["project_tasks", projectId] });

  const createMut = useMutation({
    mutationFn: async (input: Omit<Task, "id" | "sort_order"> & { sort_order?: number }) => {
      const { error } = await supabase.from("project_tasks").insert({
        ...input,
        sort_order: input.sort_order ?? (tasks.length ? Math.max(...tasks.map((t) => t.sort_order)) + 1 : 0),
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Task added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      const { error } = await supabase.from("project_tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Task deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Lanes: unique, preserve sort_order grouping
  const lanes = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of tasks) if (!seen.has(t.lane)) { seen.add(t.lane); out.push(t.lane); }
    return out;
  }, [tasks]);

  // Track grid for drag math
  const gridRef = useRef<HTMLDivElement | null>(null);

  function onBarPointerDown(e: React.PointerEvent, task: Task, mode: "move" | "resize") {
    e.preventDefault();
    e.stopPropagation();
    const grid = gridRef.current;
    if (!grid) return;
    const dayCells = grid.querySelectorAll<HTMLDivElement>("[data-daycell='1']");
    if (!dayCells.length) return;
    const dayWidth = dayCells[0].getBoundingClientRect().width;
    const startX = e.clientX;
    const origStart = fromISO(task.start_date);
    const origDur = task.duration_days;
    let nextStart = origStart;
    let nextDur = origDur;
    (e.target as Element).setPointerCapture?.(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const deltaDays = Math.round((ev.clientX - startX) / dayWidth);
      if (mode === "move") {
        nextStart = addDays(origStart, deltaDays);
        nextDur = origDur;
      } else {
        nextDur = Math.max(1, origDur + deltaDays);
        nextStart = origStart;
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (toISO(nextStart) !== task.start_date || nextDur !== task.duration_days) {
        updateMut.mutate({ id: task.id, patch: { start_date: toISO(nextStart), duration_days: nextDur } });
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const weekLabel = `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${weekEnd.getMonth() === weekStart.getMonth() ? weekEnd.getDate() : `${MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}`}, ${weekEnd.getFullYear()}`;

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="label-eyebrow">Gantt — week of {weekLabel}</div>
          <div className="mt-1 text-xs text-muted-foreground">Drag a bar to move · drag the right edge to resize · click to edit</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>‹ Prev</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next ›</Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add task
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1000px]" ref={gridRef}>
          {/* Header */}
          <div className="grid grid-cols-[200px_repeat(7,minmax(110px,1fr))] border-b border-border">
            <div />
            {days.map((d, i) => {
              const isToday = d.getTime() === today.getTime();
              return (
                <div key={i} className={`px-3 py-3 text-center ${isToday ? "bg-accent-dim/40 rounded-t-md" : ""}`}>
                  <div className={`text-xs ${isToday ? "text-accent font-medium" : "text-muted-foreground"}`}>{MONTHS[d.getMonth()]}, {d.getDate()}</div>
                  <div className={`mt-0.5 text-sm font-medium ${isToday ? "text-accent" : "text-foreground"}`}>{WEEKDAYS[d.getDay()]}</div>
                </div>
              );
            })}
          </div>

          {/* Loading / empty */}
          {isLoading && <div className="px-3 py-10 text-center text-sm text-muted-foreground">Loading tasks…</div>}
          {!isLoading && lanes.length === 0 && (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              No tasks yet. Click <span className="text-foreground">Add task</span> to create one.
            </div>
          )}

          {/* Rows */}
          {lanes.map((lane) => (
            <div key={lane} className="grid grid-cols-[200px_repeat(7,minmax(110px,1fr))] border-b border-border/60" style={{ minHeight: 72 }}>
              <div className="flex items-center px-3 py-4 text-sm text-foreground">{lane}</div>
              {days.map((d, di) => {
                const isToday = d.getTime() === today.getTime();
                return (
                  <div key={di} data-daycell="1" className={`relative border-l border-border/40 ${isToday ? "bg-accent-dim/20" : ""}`}>
                    {tasks
                      .filter((t) => t.lane === lane)
                      .map((t) => {
                        const ts = fromISO(t.start_date);
                        const offset = diffDays(ts, weekStart);
                        if (offset !== di) return null;
                        // Clip bar to visible week
                        const visibleLen = Math.min(t.duration_days, 7 - di);
                        if (visibleLen <= 0) return null;
                        const p = palette[t.color] ?? palette.blue;
                        return (
                          <div
                            key={t.id}
                            role="button"
                            onClick={(e) => { e.stopPropagation(); setEditing(t); setDialogOpen(true); }}
                            onPointerDown={(e) => onBarPointerDown(e, t, "move")}
                            className={`group absolute top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full border ${p.bg} ${p.bd} px-2 py-1.5 shadow-sm cursor-grab active:cursor-grabbing select-none`}
                            style={{ left: 6, width: `calc(${visibleLen} * 100% - 12px)`, zIndex: 2 }}
                          >
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarFallback className={`text-[10px] ${p.av}`}>{initials(t.assignee)}</AvatarFallback>
                            </Avatar>
                            <span className={`truncate text-xs font-medium ${p.tx}`}>{t.label}</span>
                            {/* Resize handle */}
                            <div
                              onPointerDown={(e) => onBarPointerDown(e, t, "resize")}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-r-full opacity-0 group-hover:opacity-100 bg-foreground/20"
                              aria-label="Resize"
                            />
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        defaultAssignee={defaultAssignee}
        defaultStart={toISO(weekStart)}
        onSubmit={(values) => {
          if (editing) {
            updateMut.mutate({ id: editing.id, patch: values });
          } else {
            createMut.mutate({ ...values, project_id: projectId });
          }
          setDialogOpen(false);
        }}
        onDelete={editing ? () => { deleteMut.mutate(editing.id); setDialogOpen(false); } : undefined}
      />
    </div>
  );
}

function TaskDialog({
  open, onOpenChange, editing, defaultAssignee, defaultStart, onSubmit, onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Task | null;
  defaultAssignee?: string;
  defaultStart: string;
  onSubmit: (values: { lane: string; label: string; start_date: string; duration_days: number; assignee: string | null; color: ColorKey }) => void;
  onDelete?: () => void;
}) {
  const [lane, setLane] = useState("");
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState(defaultStart);
  const [duration, setDuration] = useState(2);
  const [assignee, setAssignee] = useState("");
  const [color, setColor] = useState<ColorKey>("blue");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setLane(editing.lane);
      setLabel(editing.label);
      setStartDate(editing.start_date);
      setDuration(editing.duration_days);
      setAssignee(editing.assignee ?? "");
      setColor(editing.color);
    } else {
      setLane("");
      setLabel("");
      setStartDate(defaultStart);
      setDuration(2);
      setAssignee(defaultAssignee ?? "");
      setColor("blue");
    }
  }, [open, editing, defaultAssignee, defaultStart]);

  const submit = () => {
    if (!lane.trim() || !label.trim() || !startDate) {
      toast.error("Lane, label, and start date are required");
      return;
    }
    onSubmit({
      lane: lane.trim(),
      label: label.trim(),
      start_date: startDate,
      duration_days: Math.max(1, Number(duration) || 1),
      assignee: assignee.trim() || null,
      color,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="lane">Lane</Label>
            <Input id="lane" value={lane} onChange={(e) => setLane(e.target.value)} placeholder="e.g. UI design for web" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="label">Task</Label>
            <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What needs doing?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="start">Start date</Label>
              <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dur">Duration (days)</Label>
              <Input id="dur" type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="assignee">Assignee</Label>
            <Input id="assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Name" />
          </div>
          <div className="grid gap-1.5">
            <Label>Color</Label>
            <Select value={color} onValueChange={(v) => setColor(v as ColorKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(palette) as ColorKey[]).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex sm:justify-between gap-2">
          {onDelete ? (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {editing ? "Save" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
