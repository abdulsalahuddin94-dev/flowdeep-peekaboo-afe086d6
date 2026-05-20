import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Star, Building2 } from "lucide-react";
import { clients, vendors } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/clients-vendors")({
  component: ClientsVendorsPage,
  head: () => ({ meta: [{ title: "Clients & Vendors — Nexus PMO" }, { name: "description", content: "Manage external parties: clients with active engagements and approved vendor / subcontractor pool." }] }),
});

function ClientsVendorsPage() {
  return (
    <div>
      <PageHeader title="Clients & Vendors" subtitle="External parties — clients with engagements, vendors and subcontractors approved for procurement" />
      <Tabs defaultValue="clients">
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
          <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-5">
          <Toolbar add={<AddClientDialog />} />
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Client</TableHead><TableHead>Primary Contact</TableHead>
                <TableHead className="text-right">Active Projects</TableHead>
                <TableHead className="text-right">Revenue (FY26)</TableHead>
                <TableHead>Status</TableHead><TableHead className="w-24" />
              </TableRow></TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.name} className="hover:bg-accent-dim/30">
                    <TableCell className="font-medium text-foreground"><span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-accent" />{c.name}</span></TableCell>
                    <TableCell className="text-muted-foreground">{c.contact}</TableCell>
                    <TableCell className="text-right num-mono">{c.projects}</TableCell>
                    <TableCell className="text-right num-mono">${c.revenue.toFixed(1)}M</TableCell>
                    <TableCell><Badge variant="outline" className={c.status === "Active" ? "border-rag-green/40 bg-rag-green/10 text-rag-green" : "border-rag-blue/40 bg-rag-blue/10 text-rag-blue"}>{c.status}</Badge></TableCell>
                    <TableCell><Button size="sm" variant="outline">View</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="mt-5">
          <VendorsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VendorsTab() {
  const [type, setType] = useState<"All" | "Vendor" | "Subcontractor">("All");
  const list = vendors.filter((v) => type === "All" || v.type === type);
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["All", "Vendor", "Subcontractor"] as const).map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={`rounded-full border px-3 py-1 text-xs ${type === t ? "border-accent bg-accent text-accent-foreground" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
        <div className="ml-auto"><AddVendorDialog /></div>
      </div>
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Vendor</TableHead><TableHead>Type</TableHead><TableHead>Category</TableHead>
            <TableHead className="text-right">Contracts</TableHead><TableHead className="text-right">Total Spend</TableHead>
            <TableHead>Evaluation</TableHead><TableHead className="w-24" />
          </TableRow></TableHeader>
          <TableBody>
            {list.map((v) => (
              <TableRow key={v.name}>
                <TableCell className="font-medium text-foreground">{v.name}</TableCell>
                <TableCell><Badge variant="outline" className={v.type === "Vendor" ? "border-role-director/40 bg-role-director/10 text-role-director" : "border-role-resource/40 bg-role-resource/10 text-role-resource"}>{v.type}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{v.category}</TableCell>
                <TableCell className="text-right num-mono">{v.contracts}</TableCell>
                <TableCell className="text-right num-mono">${v.spend.toFixed(1)}M</TableCell>
                <TableCell><span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-rag-amber text-rag-amber" /><span className="num-mono">{v.eval.toFixed(1)}</span></span></TableCell>
                <TableCell><Button size="sm" variant="outline">View</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function Toolbar({ add }: { add: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="relative max-w-xs flex-1">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search…" className="pl-8" />
      </div>
      <div className="ml-auto">{add}</div>
    </div>
  );
}

function AddClientDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Add Client</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Company name</Label><Input placeholder="ACME Energy" /></div>
          <div><Label>Primary contact</Label><Input placeholder="Full name" /></div>
          <div><Label>Email</Label><Input placeholder="contact@" /></div>
          <div><Label>Phone</Label><Input /></div>
          <div><Label>Status</Label>
            <Select defaultValue="prospect"><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="prospect">Prospect</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground" onClick={() => { toast.success("Client added"); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddVendorDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" />Add Vendor</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Vendor / Subcontractor</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Company name</Label><Input /></div>
          <div><Label>Type</Label>
            <Select defaultValue="vendor"><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="vendor">Vendor</SelectItem><SelectItem value="sub">Subcontractor</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Category</Label><Input placeholder="Hardware / Software / EPC…" /></div>
          <div className="col-span-2"><Label>Approval notes</Label><Input placeholder="Pre-qualification reference" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-accent text-accent-foreground" onClick={() => { toast.success("Vendor added to pool"); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
