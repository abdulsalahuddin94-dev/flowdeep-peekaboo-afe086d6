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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { businessLines, departments } from "@/lib/mock-data";
import { useTags, useProjects } from "@/lib/projects-store";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="business-lines">Business Lines</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="tags">Tags & Classifications</TabsTrigger>
        </TabsList>

        <TabsContent value="business-lines" className="mt-5">
          <SectionHeader title="Business Lines" desc="First-level project classification used across Portfolio filters."
            cta={<AddBusinessLineDialog />} />
          <div className="glass-card overflow-hidden">
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
          <div className="glass-card overflow-hidden">
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
      <DialogTrigger asChild><Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Add Business Line</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Business Line</DialogTitle><DialogDescription>Used as filter chips in Portfolio and as color tag on cards.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input placeholder="e.g. Renewables" /></div>
          <div><Label>Description</Label><Textarea placeholder="Brief description" /></div>
          <div><Label>Color tag</Label><Input type="color" defaultValue="#51CAAD" className="h-10 w-20" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground" onClick={() => { toast.success("Business Line created"); setOpen(false); }}>Save</Button>
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
