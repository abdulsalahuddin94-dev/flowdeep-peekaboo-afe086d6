import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { roleCatalogue } from "@/lib/mock-data";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — Nexus PMO" }, { name: "description", content: "Workspace, profile, notifications, integrations and security settings." }] }),
});

const SEED_USERS = [
  { id: "u1", name: "Aisha Khoury",    email: "aisha@acme.com",   role: "Portfolio Director", status: "Active",  last: "Today" },
  { id: "u2", name: "Sara Al-Rashid",  email: "sara@acme.com",    role: "Project Manager",    status: "Active",  last: "Today" },
  { id: "u3", name: "Priya Iyer",      email: "priya@acme.com",   role: "Project Manager",    status: "Active",  last: "Yesterday" },
  { id: "u4", name: "Mei Chen",        email: "mei@acme.com",     role: "Resource Manager",   status: "Active",  last: "Yesterday" },
  { id: "u5", name: "Diego Ortiz",     email: "diego@acme.com",   role: "Team Member",        status: "Active",  last: "2d ago" },
  { id: "u6", name: "John Smith",      email: "john@acme.com",    role: "Finance Manager",    status: "Active",  last: "3d ago" },
  { id: "u7", name: "External Audit",  email: "audit@partner.com", role: "Read-only",         status: "Pending", last: "—" },
];

const ROLE_OPTIONS = ["Portfolio Director", "Project Manager", "Resource Manager", "Finance Manager", "Team Member", "Read-only"];

function SettingsPage() {
  const [users, setUsers] = useState(SEED_USERS);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Workspace, profile, notifications, integrations & security" />
      <Tabs defaultValue="workspace">
        <TabsList>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="notif">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="mt-5 glass-card p-6 space-y-4 max-w-2xl">
          <div><Label>Organization name</Label><Input defaultValue="Acme Holdings" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Fiscal year start</Label>
              <Select defaultValue="jan"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="jan">January</SelectItem><SelectItem value="apr">April</SelectItem><SelectItem value="jul">July</SelectItem><SelectItem value="oct">October</SelectItem></SelectContent></Select>
            </div>
            <div><Label>Default currency</Label>
              <Select defaultValue="usd"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="usd">USD</SelectItem><SelectItem value="eur">EUR</SelectItem><SelectItem value="aed">AED</SelectItem><SelectItem value="sar">SAR</SelectItem></SelectContent></Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>RAG amber threshold (%)</Label><Input type="number" defaultValue={3} /></div>
            <div><Label>RAG red threshold (%)</Label><Input type="number" defaultValue={5} /></div>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div><Label>Right-to-left (Arabic)</Label><p className="text-xs text-muted-foreground">Toggle RTL layout for Arabic users.</p></div>
            <Switch />
          </div>
          <div className="flex justify-end"><Button className="bg-accent text-accent-foreground" onClick={() => toast.success("Settings saved")}>Save changes</Button></div>
        </TabsContent>

        <TabsContent value="profile" className="mt-5 glass-card p-6 space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Full name</Label><Input defaultValue="Aisha Khoury" /></div>
            <div><Label>Email</Label><Input defaultValue="aisha@acme.com" /></div>
          </div>
          <div><Label>Time zone</Label>
            <Select defaultValue="dxb"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dxb">Dubai (UTC+4)</SelectItem><SelectItem value="lon">London</SelectItem><SelectItem value="nyc">New York</SelectItem></SelectContent></Select>
          </div>
          <div><Label>Data density</Label>
            <Select defaultValue="dense"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sparse">Executive (sparse)</SelectItem><SelectItem value="dense">Operator (dense)</SelectItem></SelectContent></Select>
          </div>
        </TabsContent>

        <TabsContent value="notif" className="mt-5 glass-card p-6 space-y-4 max-w-2xl">
          {[
            "Critical risk created on my projects",
            "Status report overdue",
            "Business case awaiting my approval",
            "Budget variance > 5%",
            "Resource over-allocation alert",
            "Weekly portfolio digest",
          ].map((label) => (
            <div key={label} className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm text-foreground">{label}</span>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">In-app <Switch defaultChecked /></span>
                <span className="flex items-center gap-1.5">Email <Switch defaultChecked /></span>
                <span className="flex items-center gap-1.5">SMS <Switch /></span>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="integrations" className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            { n: "Salesforce", s: "Connected", d: "Bid sync · 12 opps mirrored", c: "rag-green" },
            { n: "SAP S/4HANA", s: "Connected", d: "PO sync every 5 min", c: "rag-green" },
            { n: "Microsoft Teams", s: "Connected", d: "Notifications channel #pmo-alerts", c: "rag-green" },
            { n: "Jira", s: "Not connected", d: "Sync task progress per project", c: "rag-grey" },
            { n: "DocuSign", s: "Connected", d: "Contract e-sign", c: "rag-green" },
            { n: "Power BI", s: "Connected", d: "Embed dashboards", c: "rag-green" },
          ].map((i) => (
            <div key={i.n} className="glass-card flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-foreground">{i.n}</div>
                <div className="text-xs text-muted-foreground">{i.d}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full bg-${i.c}`} />
                <span className="text-xs text-muted-foreground">{i.s}</span>
                <Button size="sm" variant="outline">{i.s === "Connected" ? "Manage" : "Connect"}</Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="security" className="mt-5 glass-card p-6 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between border-b border-border pb-3"><div><div className="text-sm text-foreground">Two-factor authentication</div><div className="text-xs text-muted-foreground">Require TOTP on every login</div></div><Switch defaultChecked /></div>
          <div className="flex items-center justify-between border-b border-border pb-3"><div><div className="text-sm text-foreground">SSO (Azure AD)</div><div className="text-xs text-muted-foreground">Enterprise SSO with role mapping</div></div><Switch defaultChecked /></div>
          <div className="flex items-center justify-between border-b border-border pb-3"><div><div className="text-sm text-foreground">Session timeout</div><div className="text-xs text-muted-foreground">Auto-logout after inactivity</div></div>
            <Select defaultValue="30"><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="15">15 min</SelectItem><SelectItem value="30">30 min</SelectItem><SelectItem value="60">1 hour</SelectItem></SelectContent></Select>
          </div>
          <div><Label>Audit log retention</Label>
            <Select defaultValue="7y"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1y">1 year</SelectItem><SelectItem value="3y">3 years</SelectItem><SelectItem value="7y">7 years</SelectItem></SelectContent></Select>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">{users.length} users</div>
              <div className="text-xs text-muted-foreground">{users.filter(u => u.status === "Active").length} active · {users.filter(u => u.status === "Pending").length} pending invitation</div>
            </div>
            <Button size="sm" className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-3.5 w-3.5" />Invite User
            </Button>
          </div>
          <div className="">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead>
                  <TableHead>Status</TableHead><TableHead>Last active</TableHead><TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-foreground">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-xs ${u.status === "Active" ? "text-rag-green" : "text-rag-amber"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.status === "Active" ? "bg-rag-green" : "bg-rag-amber"}`} />
                        {u.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.last}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-rag-red"
                        onClick={() => { setUsers((prev) => prev.filter(x => x.id !== u.id)); toast.success(`${u.name} removed`); }}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <InviteUserDialog
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            onInvite={(u) => { setUsers((prev) => [...prev, u]); toast.success(`Invitation sent to ${u.email}`); }}
          />
        </TabsContent>

        <TabsContent value="roles" className="mt-5 space-y-4">
          <RolesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Invite User dialog ────────────────────────────────────────────────────────

function InviteUserDialog({
  open, onOpenChange, onInvite,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onInvite: (u: typeof SEED_USERS[number]) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Team Member");

  function submit() {
    if (!name.trim() || !email.trim()) { toast.error("Name and email are required"); return; }
    onInvite({ id: `u-${Date.now()}`, name: name.trim(), email: email.trim(), role, status: "Pending", last: "—" });
    onOpenChange(false); setName(""); setEmail(""); setRole("Team Member");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" />Invite User</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@acme.com" />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={submit}>Send Invitation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Roles & Permissions tab ───────────────────────────────────────────────────

const DOMAINS = [
  "Portfolio", "Project", "Pipeline", "Resources", "Financials",
  "Procurement", "Risk & Issues", "Reports", "Organization", "Admin",
];
const ACTIONS = ["view", "create", "edit", "approve", "delete", "export", "admin"] as const;

function RolesTab() {
  const [open, setOpen] = useState<typeof roleCatalogue[number] | null>(null);
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-foreground">70-permission matrix · {roleCatalogue.length} default roles</div>
          <div className="text-xs text-muted-foreground">Click a role to view and edit its permission matrix</div>
        </div>
        <Button size="sm" className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNewRoleOpen(true)}>
          <ShieldCheck className="h-3.5 w-3.5" />New Role
        </Button>
      </div>

      <div className="">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead className="text-right">Permissions</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {roleCatalogue.map((r) => (
              <TableRow key={r.name} className="cursor-pointer hover:bg-accent-dim/40" onClick={() => setOpen(r)}>
                <TableCell className="font-medium text-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                    {r.name}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{r.desc}</TableCell>
                <TableCell className="text-right num-mono text-sm">{r.users}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="border-accent/40 bg-accent-dim text-accent">{r.perms} / 70</Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setOpen(r); }}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Permission matrix sheet */}
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
                      <TableRow>
                        <TableHead>Domain</TableHead>
                        {ACTIONS.map((a) => <TableHead key={a} className="text-center capitalize">{a}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {DOMAINS.map((d, i) => (
                        <TableRow key={d}>
                          <TableCell className="text-foreground">{d}</TableCell>
                          {ACTIONS.map((a, j) => (
                            <TableCell key={a} className="text-center">
                              <Checkbox defaultChecked={(i + j) % 3 !== 0} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1" onClick={() => toast.success("Permissions updated")}>Save changes</Button>
                <Button variant="outline" onClick={() => toast.success("Role duplicated")}>Duplicate</Button>
                <Button variant="outline" className="text-rag-red border-rag-red/40" onClick={() => { toast.success("Role deleted"); setOpen(null); }}>Delete</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New role dialog */}
      <Dialog open={newRoleOpen} onOpenChange={setNewRoleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create new role</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Role name</Label>
              <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. Programme Director" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} placeholder="Short description of responsibilities" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewRoleOpen(false)}>Cancel</Button>
            <Button className="bg-accent text-accent-foreground" onClick={() => { toast.success(`Role "${newRoleName}" created`); setNewRoleOpen(false); setNewRoleName(""); setNewRoleDesc(""); }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
