import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2, Briefcase, Check, ChevronRight, ChevronLeft, FileText, Target,
  DollarSign, ShieldAlert, Users, ClipboardCheck, Handshake, Trophy, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CaseType = "capital" | "commercial";

const FLOWS: Record<CaseType, { key: string; label: string; icon: any }[]> = {
  capital: [
    { key: "basics",    label: "Project Basics",       icon: FileText },
    { key: "align",     label: "Strategic Alignment",  icon: Target },
    { key: "financial", label: "Financial Case",       icon: DollarSign },
    { key: "risk",      label: "Risks & Benefits",     icon: ShieldAlert },
    { key: "resource",  label: "Resources",            icon: Users },
    { key: "review",    label: "Review & Submit",      icon: ClipboardCheck },
  ],
  commercial: [
    { key: "client",     label: "Client & Opportunity", icon: Handshake },
    { key: "scope",      label: "Scope & Deliverables", icon: Package },
    { key: "commercial", label: "Commercial Terms",     icon: DollarSign },
    { key: "win",        label: "Win Strategy",         icon: Trophy },
    { key: "resource",   label: "Resources & Timeline", icon: Users },
    { key: "review",     label: "Review & Submit",      icon: ClipboardCheck },
  ],
};

export function NewBusinessCaseFlow({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [type, setType] = useState<CaseType | null>(null);
  const [step, setStep] = useState(0);

  function reset() {
    setType(null);
    setStep(0);
  }

  function close() {
    onOpenChange(false);
    setTimeout(reset, 200);
  }

  const steps = type ? FLOWS[type] : [];
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="flex items-center gap-2">
            New Business Case
            {type && (
              <Badge variant="outline" className="ml-2 border-accent/40 bg-accent-dim text-accent">
                {type === "capital" ? "Capital / Internal" : "Commercial / External"}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {!type ? (
          <TypePicker onPick={(t) => { setType(t); setStep(0); }} />
        ) : (
          <div className="grid grid-cols-[240px_1fr]">
            {/* Stepper */}
            <aside className="border-r border-border bg-secondary/20 p-4">
              <ol className="space-y-1">
                {steps.map((s, i) => {
                  const done = i < step;
                  const active = i === step;
                  const Icon = s.icon;
                  return (
                    <li key={s.key}>
                      <button
                        onClick={() => setStep(i)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-xs transition",
                          active ? "bg-accent-dim/60 text-accent" : "text-muted-foreground hover:bg-secondary/40",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px]",
                            done ? "bg-accent text-accent-foreground"
                              : active ? "bg-accent/20 text-accent ring-1 ring-accent/50"
                              : "border border-border bg-secondary/40",
                          )}
                        >
                          {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                        </span>
                        <span className={cn(active && "font-medium")}>{s.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </aside>

            {/* Body */}
            <div className="flex max-h-[70vh] flex-col">
              <div className="flex-1 overflow-y-auto p-6">
                {type === "capital" && <CapitalSteps stepKey={steps[step].key} />}
                {type === "commercial" && <CommercialSteps stepKey={steps[step].key} />}
              </div>

              <DialogFooter className="border-t border-border p-4">
                <div className="flex w-full items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={reset}>← Change type</Button>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                      <ChevronLeft className="mr-1 h-3 w-3" />Back
                    </Button>
                    {!isLast ? (
                      <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setStep((s) => s + 1)}>
                        Next<ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={() => { toast.success(`${type === "capital" ? "Capital" : "Commercial"} business case submitted for review`); close(); }}
                      >
                        Submit for review
                      </Button>
                    )}
                  </div>
                </div>
              </DialogFooter>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TypePicker({ onPick }: { onPick: (t: CaseType) => void }) {
  const cards = [
    {
      key: "capital" as const,
      label: "Capital / Internal",
      blurb: "Internally-funded initiatives, transformation projects, infra upgrades, R&D.",
      icon: Building2,
      bullets: ["Strategic alignment scoring", "CAPEX/OPEX split & ROI", "DoA approval chain"],
      color: "text-accent",
      ring: "ring-accent/40",
    },
    {
      key: "commercial" as const,
      label: "Commercial / External",
      blurb: "Client bids, RFP responses, third-party delivery engagements.",
      icon: Briefcase,
      bullets: ["Client & opportunity profile", "Bid value, margin, terms", "Win strategy & competitors"],
      color: "text-rag-blue",
      ring: "ring-rag-blue/40",
    },
  ];
  return (
    <div className="p-6">
      <p className="mb-5 text-sm text-muted-foreground">Choose the type of business case to start a tailored intake flow.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              onClick={() => onPick(c.key)}
              className={cn("glass-card group p-5 text-left transition hover:ring-2", c.ring)}
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50", c.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-base font-medium text-foreground">{c.label}</div>
                  <div className="text-xs text-muted-foreground">{c.blurb}</div>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                {c.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <Check className={cn("h-3 w-3", c.color)} />{b}
                  </li>
                ))}
              </ul>
              <div className={cn("mt-4 inline-flex items-center text-xs font-medium opacity-0 transition group-hover:opacity-100", c.color)}>
                Start flow <ChevronRight className="ml-1 h-3 w-3" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- Capital / Internal -------------------- */

function CapitalSteps({ stepKey }: { stepKey: string }) {
  if (stepKey === "basics") {
    return (
      <FormGrid title="Project Basics" subtitle="Identify the initiative and its sponsor.">
        <Field label="Project name"><Input placeholder="e.g. ERP Upgrade Phase 2" /></Field>
        <Field label="Business unit">
          <SelectBox options={["Engineering", "Operations", "IT & Digital", "HR", "Finance"]} placeholder="Select BU" />
        </Field>
        <Field label="Executive sponsor"><Input placeholder="e.g. V. Mansour" /></Field>
        <Field label="Proposed PM"><Input placeholder="e.g. John Smith" /></Field>
        <Field label="Target start date"><Input type="date" /></Field>
        <Field label="Expected duration"><Input placeholder="e.g. 8 months" /></Field>
        <Field className="md:col-span-2" label="Problem statement">
          <Textarea placeholder="What problem does this solve? What happens if we don't act?" rows={4} />
        </Field>
      </FormGrid>
    );
  }
  if (stepKey === "align") {
    return (
      <FormGrid title="Strategic Alignment" subtitle="Map to corporate pillars and weighted priorities.">
        <Field label="Strategic pillar">
          <SelectBox options={["Operational Excellence", "Digital Transformation", "Growth", "Sustainability", "Risk & Compliance"]} placeholder="Select pillar" />
        </Field>
        <Field label="Priority tier">
          <SelectBox options={["Tier 1 — Must do", "Tier 2 — Should do", "Tier 3 — Could do"]} placeholder="Select tier" />
        </Field>
        <Field className="md:col-span-2" label="Strategic objectives addressed">
          <Textarea placeholder="List the corporate objectives this case advances." rows={3} />
        </Field>
        <ScoreRow label="Strategic fit"      value={82} />
        <ScoreRow label="Financial return"   value={68} />
        <ScoreRow label="Risk exposure"      value={45} />
        <ScoreRow label="Delivery confidence" value={74} />
      </FormGrid>
    );
  }
  if (stepKey === "financial") {
    return (
      <FormGrid title="Financial Case" subtitle="Capital and operational view, with returns.">
        <Field label="CAPEX (USD)"><Input placeholder="2,400,000" /></Field>
        <Field label="OPEX / year (USD)"><Input placeholder="800,000" /></Field>
        <Field label="Funding source">
          <SelectBox options={["Annual budget", "Special allocation", "Reserves", "External funding"]} placeholder="Select source" />
        </Field>
        <Field label="Payback period (years)"><Input placeholder="2.4" /></Field>
        <Field label="NPV (USD)"><Input placeholder="1,820,000" /></Field>
        <Field label="IRR (%)"><Input placeholder="18.5" /></Field>
        <Field className="md:col-span-2" label="Benefits realization plan">
          <Textarea placeholder="When and how are benefits measured? (e.g. cost avoidance, productivity uplift)" rows={3} />
        </Field>
      </FormGrid>
    );
  }
  if (stepKey === "risk") {
    return (
      <FormGrid title="Risks & Benefits" subtitle="Top risks, mitigations and quantified benefits.">
        <Field className="md:col-span-2" label="Top 3 risks">
          <Textarea placeholder={"1. Vendor SLA breach (H)\n2. Resource gap in Q3 (M)\n3. Change adoption (M)"} rows={4} />
        </Field>
        <Field className="md:col-span-2" label="Mitigation strategy">
          <Textarea placeholder="Specific controls per risk." rows={3} />
        </Field>
        <Field label="Tangible benefits"><Input placeholder="$1.2M / year saved" /></Field>
        <Field label="Intangible benefits"><Input placeholder="Improved reporting accuracy" /></Field>
      </FormGrid>
    );
  }
  if (stepKey === "resource") {
    return (
      <FormGrid title="Resources" subtitle="Initial team and procurement needs.">
        <Field label="Internal FTEs required"><Input placeholder="6.5" /></Field>
        <Field label="External resources required"><Input placeholder="3 contractors" /></Field>
        <Field label="Vendor / partner involvement">
          <SelectBox options={["None", "Single vendor", "Multi-vendor", "Strategic partner"]} placeholder="Select" />
        </Field>
        <Field label="Procurement packages"><Input placeholder="e.g. 2 RFPs (Hardware, Integration)" /></Field>
        <Field className="md:col-span-2" label="Key skills required">
          <Textarea placeholder="Solution architect, integration dev, change manager…" rows={3} />
        </Field>
      </FormGrid>
    );
  }
  return (
    <ReviewBlock
      title="Capital business case — review"
      rows={[
        { l: "Project name", v: "ERP Upgrade Phase 2" },
        { l: "Sponsor / PM", v: "V. Mansour · John Smith" },
        { l: "Strategic pillar", v: "Digital Transformation · Tier 1" },
        { l: "CAPEX / OPEX", v: "$2.40M / $0.80M/yr" },
        { l: "NPV · IRR · Payback", v: "$1.82M · 18.5% · 2.4yr" },
        { l: "Top risk", v: "Vendor SLA breach (High)" },
        { l: "Resources", v: "6.5 FTE internal + 3 contractors" },
        { l: "Approval route", v: "PMO → Finance → CIO → ExCo" },
      ]}
    />
  );
}

/* -------------------- Commercial / External -------------------- */

function CommercialSteps({ stepKey }: { stepKey: string }) {
  if (stepKey === "client") {
    return (
      <FormGrid title="Client & Opportunity" subtitle="Who the bid is for and how it surfaced.">
        <Field label="Client name"><Input placeholder="e.g. Aramco Digital" /></Field>
        <Field label="Account owner"><Input placeholder="e.g. H. Tanaka" /></Field>
        <Field label="Opportunity source">
          <SelectBox options={["RFP / Tender", "Direct invitation", "Existing client expansion", "Inbound lead", "Partner referral"]} placeholder="Select source" />
        </Field>
        <Field label="Industry">
          <SelectBox options={["Energy", "Government", "Financial Services", "Healthcare", "Industrial", "Telecom"]} placeholder="Select industry" />
        </Field>
        <Field label="RFP / Tender ID"><Input placeholder="RFP-2026-014" /></Field>
        <Field label="Submission deadline"><Input type="date" /></Field>
        <Field className="md:col-span-2" label="Client problem / brief">
          <Textarea placeholder="Summary of the client's need and decision criteria." rows={4} />
        </Field>
      </FormGrid>
    );
  }
  if (stepKey === "scope") {
    return (
      <FormGrid title="Scope & Deliverables" subtitle="What you'll deliver and what you explicitly won't.">
        <Field className="md:col-span-2" label="In-scope deliverables">
          <Textarea placeholder={"- Discovery & design (6w)\n- Build & integration (16w)\n- UAT support & go-live (4w)"} rows={5} />
        </Field>
        <Field className="md:col-span-2" label="Out of scope">
          <Textarea placeholder="Anything explicitly excluded from this engagement." rows={3} />
        </Field>
        <Field label="Engagement model">
          <SelectBox options={["Fixed price", "Time & materials", "Outcome-based", "Managed service"]} placeholder="Select model" />
        </Field>
        <Field label="Duration"><Input placeholder="26 weeks" /></Field>
      </FormGrid>
    );
  }
  if (stepKey === "commercial") {
    return (
      <FormGrid title="Commercial Terms" subtitle="Bid value, margin, payment and risk-share.">
        <Field label="Bid value (USD)"><Input placeholder="3,800,000" /></Field>
        <Field label="Internal cost (USD)"><Input placeholder="2,720,000" /></Field>
        <Field label="Gross margin (%)"><Input placeholder="28.4" /></Field>
        <Field label="Contingency (%)"><Input placeholder="8" /></Field>
        <Field label="Payment terms">
          <SelectBox options={["Milestone-based", "Monthly", "30/60/10 split", "On delivery"]} placeholder="Select terms" />
        </Field>
        <Field label="Penalty / SLA exposure"><Input placeholder="e.g. 5% of contract value" /></Field>
        <Field className="md:col-span-2" label="Pricing assumptions">
          <Textarea placeholder="Key assumptions underlying the price." rows={3} />
        </Field>
      </FormGrid>
    );
  }
  if (stepKey === "win") {
    return (
      <FormGrid title="Win Strategy" subtitle="Why we'll win and who we're up against.">
        <Field label="Win probability">
          <SelectBox options={["Low (<25%)", "Medium (25–60%)", "High (60–85%)", "Very high (>85%)"]} placeholder="Select" />
        </Field>
        <Field label="Bid / no-bid decision">
          <SelectBox options={["Recommended bid", "Conditional bid", "Strategic must-win", "Pending decision"]} placeholder="Select" />
        </Field>
        <Field className="md:col-span-2" label="Key win themes">
          <Textarea placeholder={"1. Local delivery footprint\n2. Reference projects in same sector\n3. Pre-built accelerators"} rows={4} />
        </Field>
        <Field className="md:col-span-2" label="Known competitors & differentiators">
          <Textarea placeholder="Competitor A — strong incumbency; we counter with…" rows={3} />
        </Field>
      </FormGrid>
    );
  }
  if (stepKey === "resource") {
    return (
      <FormGrid title="Resources & Timeline" subtitle="Delivery team and high-level plan.">
        <Field label="Proposed delivery lead"><Input placeholder="e.g. K. Bauer" /></Field>
        <Field label="Team size (FTE)"><Input placeholder="11" /></Field>
        <Field label="Mobilization date"><Input type="date" /></Field>
        <Field label="Go-live target"><Input type="date" /></Field>
        <Field label="Subcontractors needed">
          <SelectBox options={["None", "1 specialist", "2–3 specialists", "Multiple"]} placeholder="Select" />
        </Field>
        <Field label="Travel intensity">
          <SelectBox options={["None", "Occasional", "Regular site presence", "Permanent on-site"]} placeholder="Select" />
        </Field>
      </FormGrid>
    );
  }
  return (
    <ReviewBlock
      title="Commercial bid — review"
      rows={[
        { l: "Client / RFP", v: "Aramco Digital · RFP-2026-014" },
        { l: "Account owner", v: "H. Tanaka" },
        { l: "Engagement model", v: "Fixed price · 26 weeks" },
        { l: "Bid value", v: "$3.80M" },
        { l: "Margin · Contingency", v: "28.4% · 8%" },
        { l: "Win probability", v: "High (60–85%) · Recommended bid" },
        { l: "Delivery lead · team", v: "K. Bauer · 11 FTE" },
        { l: "Approval route", v: "Bid Desk → Finance → Commercial Director → CEO" },
      ]}
    />
  );
}

/* -------------------- shared bits -------------------- */

function FormGrid({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-5">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SelectBox({ options, placeholder }: { options: string[]; placeholder: string }) {
  return (
    <Select>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "bg-rag-green" : value >= 50 ? "bg-rag-amber" : "bg-rag-red";
  return (
    <div className="md:col-span-2">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="num-mono text-foreground">{value}/100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
        <div className={cn("h-full", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ReviewBlock({ title, rows }: { title: string; rows: { l: string; v: string }[] }) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Confirm the summary below. After submit, the case enters the approval queue.</p>
      </div>
      <div className="glass-card divide-y divide-border overflow-hidden">
        {rows.map((r) => (
          <div key={r.l} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{r.l}</span>
            <span className="text-foreground">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
