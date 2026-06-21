import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { roleCatalogue } from "@/lib/mock-data";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/roles")({
  component: RolesPage,
  head: () => ({ meta: [{ title: "Roles & Permissions — Nexus PMO" }, { name: "description", content: "RBAC — manage roles, 70-permission matrix, inheritance and user assignment." }] }),
});

const DOMAINS = [
  "Portfolio", "Project", "Pipeline", "Resources", "Financials",
  "Procurement", "Risk & Issues", "Reports", "Organization", "Admin",
];

const ACTIONS = ["view", "create", "edit", "approve", "delete", "export", "admin"] as const;

function RolesPage() {
  const [open, setOpen] = useState<typeof roleCatalogue[number] | null>(null);
  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle="70-permission matrix across 10 domains · 8 default roles"
        actions={<NewRoleDialog />}
      />
      <div className="">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Role</TableHead><TableHead>Description</TableHead>
            <TableHead className="text-right">Users</TableHead><TableHead className="text-right">Permissions</TableHead><TableHead />
          </TableRow></TableHeader>
          <TableBody>{roleCatalogue.map((r) => (
            <TableRow key={r.name} className="cursor-pointer hover:bg-accent-dim/40" onClick={() => setOpen(r)}>
              <TableCell className="font-medium text-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                  {r.name}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">{r.desc}</TableCell>
              <TableCell className="text-right num-mono"><span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{r.users}</span></TableCell>
              <TableCell className="text-right num-mono"><Badge variant="outline" className="border-accent/40 bg-accent-dim text-accent">{r.perms} / 70</Badge></TableCell>
              <TableCell><Button size="sm" variant="outline">Edit</Button></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-[640px] overflow-y-auto bg-surface sm:max-w-[640px]">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: open.color }} />
                  {open.name}
                </SheetTitle>
              </SheetHeader>
              <p className="mt-2 text-sm text-muted-foreground">{open.desc}</p>
              <div className="mt-5">
                <div className="label-eyebrow mb-3">Permission matrix</div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Domain</TableHead>{ACTIONS.map((a) => <TableHead key={a} className="text-center capitalize">{a}</TableHead>)}</TableRow>
                    </TableHeader>
                    <TableBody>{DOMAINS.map((d, i) => (
                      <TableRow key={d}>
                        <TableCell className="text-foreground">{d}</TableCell>
                        {ACTIONS.map((a, j) => (
                          <TableCell key={a} className="text-center"><Checkbox defaultChecked={(i + j) % 3 !== 0} /></TableCell>
                        ))}
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1" onClick={() => toast.success("Permissions updated")}>Save changes</Button>
                <Button variant="outline">Duplicate role</Button>
                <Button variant="outline" className="text-rag-red border-rag-red/40">Delete</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NewRoleDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />New Role</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create new role</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Role name</Label><Input placeholder="e.g. Programme Director" /></div>
          <div><Label>Description</Label><Textarea placeholder="Short description of responsibilities" /></div>
          <div><Label>Inherits from</Label><Input placeholder="Portfolio Director" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground" onClick={() => { toast.success("Role created"); setOpen(false); }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
