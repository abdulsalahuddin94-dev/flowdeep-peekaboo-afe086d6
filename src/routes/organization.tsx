import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, CalendarDays, CalendarIcon, PartyPopper } from "lucide-react";
import { businessLines, departments, type WorkCalendar } from "@/lib/mock-data";
import { useTags, useProjects, useCalendars } from "@/lib/projects-store";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/organization")({
  component: OrganizationPage,
  head: () => ({ meta: [{ title: "Organization — Nexus PMO" }, { name: "description", content: "Manage business lines, departments and classification tags." }] }),
});

function OrganizationPage() {
  return (
    <div>
      <PageHeader title="Organization" subtitle="Define internal structure — required before projects can be created" />
      <Tabs defaultValue="business-lines">
        <TabsList>
          <TabsTrigger value="business-lines">Business Types</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="tags">Tags & Classifications</TabsTrigger>
          <TabsTrigger value="calendars">Calendars</TabsTrigger>
        </TabsList>

        <TabsContent value="business-lines" className="mt-5">
          <SectionHeader title="Business Types" desc="High-level project categories (such as business lines) used across Portfolio filters."
            cta={<AddBusinessLineDialog />} />
          <div className="">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead><TableHead>Description</TableHead>
                <TableHead className="text-right">Active Projects</TableHead>
                <TableHead>Color</TableHead><TableHead className="w-24" />
              </TableRow></TableHeader>
              <TableBody>
                {businessLines.map((b) => (
                  <TableRow key={b.name}>
                    <TableCell className="font-medium text-foreground">{b.name}</TableCell>
                    <TableCell className="text-muted-foreground">{b.description}</TableCell>
                    <TableCell className="text-right num-mono">{b.projects}</TableCell>
                    <TableCell><span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: b.color }} /><span className="text-xs text-muted-foreground">{b.color}</span></span></TableCell>
                    <TableCell><RowActions /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="mt-5">
          <SectionHeader title="Departments / Units" desc="Org chart units. A project may span multiple departments."
            cta={<AddDepartmentDialog />} />
          <div className="">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Department</TableHead><TableHead>Parent</TableHead><TableHead>Head</TableHead>
                <TableHead className="text-right">Members</TableHead><TableHead className="w-24" />
              </TableRow></TableHeader>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d.name}>
                    <TableCell className="font-medium text-foreground">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">{d.parent}</TableCell>
                    <TableCell>{d.head}</TableCell>
                    <TableCell className="text-right num-mono">{d.members}</TableCell>
                    <TableCell><RowActions /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="tags" className="mt-5">
          <TagsTab />
        </TabsContent>

        <TabsContent value="calendars" className="mt-5">
          <CalendarsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TagsTab() {
  const { tags } = useTags();
  return (
    <>
      <SectionHeader title="Tags & Classifications" desc="Customizable labels applied to business cases and projects."
        cta={<AddTagDialog />} />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tags.map((t) => (
          <div key={t.name} className="glass-card flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ background: t.color }} />
              <div>
                <div className="font-medium text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">Used by {t.usage} projects</div>
              </div>
            </div>
            <RowActions />
          </div>
        ))}
      </div>
    </>
  );
}

function SectionHeader({ title, desc, cta }: { title: string; desc: string; cta: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-medium text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      {cta}
    </div>
  );
}

function RowActions() {
  return (
    <div className="flex justify-end gap-1">
      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-accent"><Pencil className="h-3.5 w-3.5" /></Button>
      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-rag-red"><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

function AddBusinessLineDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Add Business Type</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Business Type</DialogTitle><DialogDescription>High-level category (such as business lines). Used as filter chips in Portfolio and as color tag on cards.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input placeholder="e.g. Renewables" /></div>
          <div><Label>Description</Label><Textarea placeholder="Brief description" /></div>
          <div><Label>Color tag</Label><Input type="color" defaultValue="#51CAAD" className="h-10 w-20" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground" onClick={() => { toast.success("Business Type created"); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddDepartmentDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Add Department</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Department</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input placeholder="e.g. Quality Assurance" /></div>
          <div><Label>Parent Unit (optional)</Label><Input placeholder="Engineering" /></div>
          <div><Label>Head</Label><Input placeholder="Search user…" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground" onClick={() => { toast.success("Department created"); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddTagDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#51CAAD");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const { addTag } = useTags();
  const { projects } = useProjects();

  const filtered = projects.filter((p) =>
    !search.trim() || p.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function reset() {
    setName(""); setColor("#51CAAD"); setSearch(""); setSelected([]);
  }

  function save() {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Tag name is required"); return; }
    addTag({ name: trimmed, color }, selected);
    toast.success(
      selected.length
        ? `Tag "${trimmed}" created and assigned to ${selected.length} project${selected.length === 1 ? "" : "s"}`
        : `Tag "${trimmed}" created`
    );
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild><Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Add Tag</Button></DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Tag</DialogTitle>
          <DialogDescription>Create a tag and optionally assign it to existing projects.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <Label>Tag name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sustainability" />
            </div>
            <div>
              <Label>Color</Label>
              <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20" />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>Assign to projects {selected.length > 0 && <span className="ml-1 text-xs text-muted-foreground">({selected.length} selected)</span>}</Label>
              {selected.length > 0 && (
                <button type="button" onClick={() => setSelected([])} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
              )}
            </div>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects…" className="mb-2" />
            <ScrollArea className="h-56 rounded-md border border-border">
              <div className="divide-y divide-border/60">
                {filtered.length === 0 && (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">No projects match</div>
                )}
                {filtered.map((p) => {
                  const checked = selected.includes(p.id);
                  return (
                    <label key={p.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-secondary/40">
                      <Checkbox checked={checked} onCheckedChange={() => toggle(p.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-foreground">{p.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{p.businessLine} · {p.department}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground" onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarsTab() {
  const { calendars } = useCalendars();
  const [editing, setEditing] = useState<WorkCalendar | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <SectionHeader
        title="Calendars"
        desc="Define working days, daily hours and official holidays per country/region. Link a calendar when creating a project."
        cta={<Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setCreateOpen(true)}><Plus className="mr-1 h-4 w-4" />New Calendar</Button>}
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {calendars.map((c) => (
          <div key={c.id} className="glass-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-accent" />
                <div className="font-medium text-foreground">{c.name}</div>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-accent" onClick={() => setEditing(c)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {DAY_LABELS.map((d, i) => (
                <span key={d} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${c.workingDays.includes(i) ? "bg-accent/15 text-accent" : "bg-secondary/40 text-muted-foreground line-through"}`}>{d}</span>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{c.hoursPerDay}h/day · {c.holidays.length} holiday{c.holidays.length === 1 ? "" : "s"}</div>
          </div>
        ))}
      </div>
      <CalendarDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editing && <CalendarDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} calendar={editing} />}
    </>
  );
}

function CalendarDialog({ open, onOpenChange, calendar }: { open: boolean; onOpenChange: (v: boolean) => void; calendar?: WorkCalendar }) {
  const { addCalendar, updateCalendar } = useCalendars();
  const isEdit = !!calendar;
  const [name, setName] = useState(calendar?.name ?? "");
  const [workingDays, setWorkingDays] = useState<number[]>(calendar?.workingDays ?? [1, 2, 3, 4, 5]);
  const [hoursPerDay, setHoursPerDay] = useState<number>(calendar?.hoursPerDay ?? 8);
  const [holidays, setHolidays] = useState<{ date: string; label: string }[]>(calendar?.holidays ?? []);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newLabel, setNewLabel] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const holidayDates = holidays.map((h) => parseISO(h.date));

  function toggleDay(d: number) {
    setWorkingDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());
  }
  function addHoliday() {
    if (!newDate) { toast.error("Pick a date"); return; }
    const iso = format(newDate, "yyyy-MM-dd");
    if (holidays.some((h) => h.date === iso)) { toast.error("Holiday already added for that date"); return; }
    setHolidays((prev) => [...prev, { date: iso, label: newLabel.trim() || "Holiday" }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewDate(undefined); setNewLabel("");
  }
  function removeHoliday(date: string) {
    setHolidays((prev) => prev.filter((h) => h.date !== date));
  }
  function save() {
    if (!name.trim()) { toast.error("Calendar name is required"); return; }
    if (workingDays.length === 0) { toast.error("Select at least one working day"); return; }
    if (isEdit && calendar) {
      updateCalendar(calendar.id, { name: name.trim(), workingDays, hoursPerDay, holidays });
      toast.success("Calendar updated");
    } else {
      addCalendar({ id: `cal-${Date.now()}`, name: name.trim(), workingDays, hoursPerDay, holidays });
      toast.success(`Calendar "${name.trim()}" created`);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Calendar" : "New Calendar"}</DialogTitle>
          <DialogDescription>Working schedule and official holidays. Projects can be bound to this calendar for scheduling.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Egypt — Standard" />
            </div>
            <div>
              <Label>Hours / day</Label>
              <Input type="number" min={1} max={24} step={0.5} value={hoursPerDay} onChange={(e) => setHoursPerDay(parseFloat(e.target.value) || 0)} className="w-24" />
            </div>
          </div>
          <div>
            <Label>Working days</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {DAY_LABELS.map((d, i) => {
                const on = workingDays.includes(i);
                return (
                  <button key={d} type="button" onClick={() => toggleDay(i)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${on ? "border-accent bg-accent/15 text-accent" : "border-border bg-secondary/40 text-muted-foreground"}`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Official holidays</Label>
            <div className="mt-1.5 flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-3 sm:flex-row sm:items-center">
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className={`w-full justify-start gap-2 sm:w-44 ${!newDate ? "text-muted-foreground" : ""}`}>
                    <CalendarIcon className="h-4 w-4 text-accent" />
                    {newDate ? format(newDate, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={(d) => { setNewDate(d); if (d) setPickerOpen(false); }}
                    initialFocus
                    modifiers={{ holiday: holidayDates }}
                    modifiersClassNames={{ holiday: "bg-rag-red/20 text-rag-red font-semibold rounded-md" }}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (e.g. Labour Day)" className="flex-1" />
              <Button type="button" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={addHoliday}>
                <Plus className="mr-1 h-4 w-4" />Add
              </Button>
            </div>
            <ScrollArea className="mt-2 h-48 rounded-lg border border-border bg-card">
              <div className="divide-y divide-border/60">
                {holidays.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 px-3 py-10 text-center">
                    <PartyPopper className="h-6 w-6 text-muted-foreground/60" />
                    <div className="text-xs text-muted-foreground">No holidays yet — pick a date above to add one</div>
                  </div>
                )}
                {holidays.map((h) => {
                  const d = parseISO(h.date);
                  return (
                    <div key={h.date} className="group flex items-center gap-3 px-3 py-2 transition hover:bg-accent/5">
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md border border-rag-red/30 bg-rag-red/10 text-rag-red">
                        <span className="text-[9px] font-semibold uppercase leading-none">{format(d, "MMM")}</span>
                        <span className="text-sm font-bold leading-none">{format(d, "d")}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">{h.label}</div>
                        <div className="text-[11px] text-muted-foreground">{format(d, "EEEE, yyyy")}</div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-rag-red" onClick={() => removeHoliday(h.date)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground" onClick={save}>{isEdit ? "Save changes" : "Create Calendar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
