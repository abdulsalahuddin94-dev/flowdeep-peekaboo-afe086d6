// Mock data for the Nexus PMO UI mockup. No backend.

export type Rag = "green" | "amber" | "red" | "blue" | "grey";

export interface Project {
  id: string;
  name: string;
  businessLine: string;
  department: string;
  pm: string;
  pmAvatar: string;
  progress: number;
  budgetUsed: number;
  budgetTotal: number;
  endDate: string;
  rag: Rag;
  risks: number;
  issues: number;
  stage: "Initiation" | "Planning" | "Execution" | "Monitoring" | "Closure";
  tags: string[];
  client?: string;
  ragNote?: string;
  calendarId?: string;
}

// Working calendar: which weekdays count as work days (0=Sun..6=Sat),
// hours per work day, and a list of named non-working holidays (YYYY-MM-DD).
export interface WorkCalendar {
  id: string;
  name: string;
  workingDays: number[];        // e.g. [0,1,2,3,4] (Sun–Thu) for Egypt
  hoursPerDay: number;
  holidays: { date: string; label: string }[];
}

const pms = [
  ["Sara Al-Rashid", "SA"], ["John Smith", "JS"], ["Mei Chen", "MC"],
  ["Omar Haddad", "OH"], ["Priya Iyer", "PI"], ["Liam Walker", "LW"],
  ["Hana Tanaka", "HT"], ["Diego Ortiz", "DO"],
];

const lines = ["Software Solutions", "EPC", "Consultation", "Maintenance"];
const depts = ["Engineering", "IT", "Operations", "R&D", "Finance"];
const tags = ["Strategic", "Compliance", "Innovation", "Cost-Saving", "Customer-Facing"];

const seed = [
  ["ERP System Upgrade", "red", 61, 2.1, 3.2, "Jun 15, 2026", "Critical", "Execution"],
  ["Coastal Refinery Expansion", "amber", 38, 14.2, 42.0, "Dec 02, 2026", "Vendor SLA", "Execution"],
  ["Salesforce Migration", "green", 84, 0.84, 1.10, "Jul 22, 2026", "On Track", "Monitoring"],
  ["Smart Grid Pilot", "green", 22, 0.45, 2.8, "Mar 14, 2027", "On Track", "Planning"],
  ["Warehouse Robotics", "amber", 56, 3.7, 5.4, "Oct 08, 2026", "Scope creep", "Execution"],
  ["Customer Portal v3", "green", 71, 0.62, 0.95, "Aug 30, 2026", "On Track", "Execution"],
  ["Data Lake Foundation", "blue", 8, 0.05, 1.6, "Jan 19, 2027", "Initiating", "Initiation"],
  ["Plant Maintenance Q3", "amber", 47, 0.88, 1.40, "Sep 12, 2026", "Parts delay", "Execution"],
  ["AI Forecasting Engine", "green", 33, 0.31, 1.20, "Nov 05, 2026", "On Track", "Planning"],
  ["Security Hardening 2026", "red", 19, 0.42, 0.60, "Jul 03, 2026", "Audit findings", "Execution"],
  ["Mobile Workforce App", "green", 64, 0.55, 0.90, "Aug 11, 2026", "On Track", "Execution"],
  ["EPC Substation Bravo", "amber", 51, 7.2, 12.5, "Feb 28, 2027", "Permit risk", "Execution"],
  ["Document AI Pilot", "blue", 4, 0.02, 0.40, "Apr 22, 2027", "Initiating", "Initiation"],
  ["Procurement Modernization", "green", 77, 1.10, 1.50, "Jul 30, 2026", "On Track", "Monitoring"],
  ["Cloud Cost Optimization", "green", 89, 0.18, 0.22, "Jun 09, 2026", "On Track", "Closure"],
  ["LNG Terminal Refit", "amber", 41, 9.4, 18.0, "Mar 30, 2027", "Weather slip", "Execution"],
  ["HRIS Replacement", "green", 58, 0.74, 1.30, "Oct 21, 2026", "On Track", "Execution"],
  ["Asset Tracking IoT", "green", 27, 0.21, 0.90, "Dec 14, 2026", "On Track", "Planning"],
  ["Regulatory Reporting", "amber", 62, 0.49, 0.70, "Aug 02, 2026", "SME shortage", "Execution"],
  ["Solar Microgrid", "grey", 12, 0.10, 3.4, "—", "On Hold", "Planning"],
  ["BI Self-Service", "green", 44, 0.38, 0.85, "Nov 18, 2026", "On Track", "Execution"],
  ["Wellhead Automation", "red", 35, 5.1, 6.8, "Sep 27, 2026", "Critical vendor", "Execution"],
] as const;

export const projects: Project[] = seed.map((row, i) => {
  const [name, rag, progress, used, total, endDate, ragNote, stage] = row;
  const [pmName, pmAvatar] = pms[i % pms.length];
  return {
    id: `p-${(i + 1).toString().padStart(3, "0")}`,
    name,
    businessLine: lines[i % lines.length],
    department: depts[i % depts.length],
    pm: pmName,
    pmAvatar,
    progress,
    budgetUsed: used,
    budgetTotal: total,
    endDate,
    rag: rag as Rag,
    risks: (i * 3) % 7,
    issues: (i * 2) % 5,
    stage: stage as Project["stage"],
    tags: [tags[i % tags.length], tags[(i + 2) % tags.length]],
    client: i % 3 === 0 ? "ACME Energy" : i % 3 === 1 ? "Northwind Logistics" : "Internal",
    ragNote,
  };
});

export const portfolioSummary = {
  active: projects.length,
  onTrack: projects.filter((p) => p.rag === "green").length,
  atRisk: projects.filter((p) => p.rag === "amber").length,
  critical: projects.filter((p) => p.rag === "red").length,
  onHold: projects.filter((p) => p.rag === "grey").length,
  notStarted: projects.filter((p) => p.rag === "blue").length,
  budgetUsed: projects.reduce((s, p) => s + p.budgetUsed, 0),
  budgetTotal: projects.reduce((s, p) => s + p.budgetTotal, 0),
};

export const businessLines = [
  { name: "Software Solutions", color: "#51CAAD", projects: 7, description: "Enterprise software delivery & integrations" },
  { name: "EPC", color: "#F97316", projects: 5, description: "Engineering, Procurement & Construction" },
  { name: "Consultation", color: "#0EA5E9", projects: 4, description: "Advisory & strategy engagements" },
  { name: "Maintenance", color: "#8B5CF6", projects: 6, description: "Recurring service contracts" },
];

export const departments = [
  { name: "Engineering", parent: "—", head: "Sara Al-Rashid", members: 42 },
  { name: "IT", parent: "—", head: "Mei Chen", members: 18 },
  { name: "Operations", parent: "—", head: "Omar Haddad", members: 31 },
  { name: "R&D", parent: "Engineering", head: "Priya Iyer", members: 12 },
  { name: "Finance", parent: "—", head: "Liam Walker", members: 9 },
  { name: "Procurement", parent: "Operations", head: "Hana Tanaka", members: 7 },
];

export const workCalendars: WorkCalendar[] = [
  {
    id: "cal-eg",
    name: "Egypt — Standard",
    workingDays: [0, 1, 2, 3, 4], // Sun–Thu
    hoursPerDay: 8,
    holidays: [
      { date: "2026-01-07", label: "Coptic Christmas" },
      { date: "2026-04-25", label: "Sinai Liberation Day" },
      { date: "2026-05-01", label: "Labour Day" },
      { date: "2026-07-23", label: "Revolution Day" },
      { date: "2026-10-06", label: "Armed Forces Day" },
    ],
  },
  {
    id: "cal-sa",
    name: "Saudi Arabia — Standard",
    workingDays: [0, 1, 2, 3, 4], // Sun–Thu (Fri/Sat off)
    hoursPerDay: 8,
    holidays: [
      { date: "2026-02-22", label: "Founding Day" },
      { date: "2026-09-23", label: "National Day" },
    ],
  },
  {
    id: "cal-intl",
    name: "International — Mon–Fri",
    workingDays: [1, 2, 3, 4, 5],
    hoursPerDay: 8,
    holidays: [
      { date: "2026-01-01", label: "New Year's Day" },
      { date: "2026-12-25", label: "Christmas Day" },
    ],
  },
];

export const orgTags = [
  { name: "Strategic", color: "#51CAAD", usage: 11 },
  { name: "Compliance", color: "#EF4444", usage: 6 },
  { name: "Innovation", color: "#8B5CF6", usage: 9 },
  { name: "Cost-Saving", color: "#10B981", usage: 5 },
  { name: "Customer-Facing", color: "#0EA5E9", usage: 8 },
];

export const clients = [
  { name: "ACME Energy", contact: "R. Hadid", projects: 4, revenue: 18.2, status: "Active" },
  { name: "Northwind Logistics", contact: "K. Bauer", projects: 3, revenue: 6.4, status: "Active" },
  { name: "Helios Solar", contact: "M. Park", projects: 2, revenue: 3.1, status: "Active" },
  { name: "Atlas Mining", contact: "T. Okafor", projects: 1, revenue: 2.7, status: "Prospect" },
];

export const vendors = [
  { name: "Siemens MENA", type: "Vendor", category: "Hardware", contracts: 6, spend: 12.4, eval: 4.6 },
  { name: "Oracle Consulting", type: "Vendor", category: "Software", contracts: 3, spend: 4.8, eval: 4.1 },
  { name: "Bechtel Subcontract", type: "Subcontractor", category: "EPC", contracts: 2, spend: 22.6, eval: 4.3 },
  { name: "Local Crane Co.", type: "Subcontractor", category: "Logistics", contracts: 4, spend: 1.1, eval: 3.8 },
  { name: "Cyberguard", type: "Vendor", category: "Security", contracts: 1, spend: 0.9, eval: 4.7 },
];

export const pipelineItems = [
  { id: "BC-2026-018", title: "AI-driven Predictive Maintenance", stage: "Under Review", score: 84, roi: "$3.2M", submittedBy: "Sara Al-Rashid", sponsor: "Ahmed Al-Mansouri", dept: "Innovation", date: "3d ago", pillar: "Innovation" },
  { id: "BC-2026-017", title: "Coastal Wind Farm Phase 2", stage: "Submitted", score: 71, roi: "$12.4M", submittedBy: "John Smith", sponsor: "Khalid Al-Farsi", dept: "Engineering", date: "5d ago", pillar: "Growth" },
  { id: "BC-2026-016", title: "Internal Audit Tooling", stage: "Revision Requested", score: 52, roi: "$0.8M", submittedBy: "Mei Chen", sponsor: "Nora Hassan", dept: "IT & Digital", date: "1w ago", pillar: "Compliance" },
  { id: "BC-2026-015", title: "Customer Loyalty Platform", stage: "Approved", score: 88, roi: "$5.6M", submittedBy: "Priya Iyer", sponsor: "Layla Mahmoud", dept: "Growth", date: "2w ago", pillar: "Growth" },
  { id: "BC-2026-014", title: "Legacy Decommissioning", stage: "Deferred", score: 38, roi: "$1.1M", submittedBy: "Liam Walker", sponsor: "Youssef Barakat", dept: "Operations", date: "3w ago", pillar: "Efficiency" },
  { id: "BC-2026-013", title: "Remote Operations Center", stage: "Under Review", score: 76, roi: "$4.0M", submittedBy: "Omar Haddad", sponsor: "Ahmed Al-Mansouri", dept: "Operations", date: "4d ago", pillar: "Operations" },
  { id: "BC-2026-012", title: "Carbon Tracking System", stage: "Submitted", score: 64, roi: "$2.2M", submittedBy: "Hana Tanaka", sponsor: "Reem Al-Dosari", dept: "ESG", date: "6d ago", pillar: "ESG" },
  { id: "BC-2026-011", title: "Field Engineer App Refresh", stage: "Rejected", score: 31, roi: "$0.4M", submittedBy: "Diego Ortiz", sponsor: "Khalid Al-Farsi", dept: "Engineering", date: "1mo ago", pillar: "Efficiency" },
];

export const risks = [
  { id: "R-091", project: "ERP System Upgrade", title: "Vendor delivery delay > 4 weeks", category: "Vendor", prob: 4, impact: 5, score: 20, status: "Open", owner: "Sara Al-Rashid", mitigation: "Switch to backup vendor; weekly SLA reviews" },
  { id: "R-088", project: "Coastal Refinery Expansion", title: "Permit approval slip", category: "Regulatory", prob: 3, impact: 5, score: 15, status: "Mitigating", owner: "John Smith", mitigation: "Direct govt liaison engaged" },
  { id: "R-085", project: "Security Hardening 2026", title: "Audit finding remediation overrun", category: "Compliance", prob: 4, impact: 4, score: 16, status: "Open", owner: "Mei Chen", mitigation: "Daily standups, executive escalation" },
  { id: "R-081", project: "Wellhead Automation", title: "Specialist resource attrition", category: "Resource", prob: 3, impact: 4, score: 12, status: "Open", owner: "Omar Haddad", mitigation: "Retention bonus + knowledge transfer" },
  { id: "R-077", project: "Warehouse Robotics", title: "Scope creep from operations", category: "Scope", prob: 4, impact: 3, score: 12, status: "Mitigating", owner: "Priya Iyer", mitigation: "CR board weekly; baselined scope locked" },
  { id: "R-074", project: "LNG Terminal Refit", title: "Severe weather window miss", category: "Schedule", prob: 3, impact: 4, score: 12, status: "Open", owner: "Liam Walker", mitigation: "Parallel work packages prepared" },
  { id: "R-070", project: "Plant Maintenance Q3", title: "Spare parts long lead-time", category: "Supply", prob: 3, impact: 3, score: 9, status: "Mitigating", owner: "Hana Tanaka", mitigation: "Pre-orders placed; safety stock" },
  { id: "R-066", project: "Regulatory Reporting", title: "SME shortage during peak", category: "Resource", prob: 4, impact: 2, score: 8, status: "Open", owner: "Diego Ortiz", mitigation: "Contractor backfill arranged" },
];

export const resources = [
  { name: "Sara Al-Rashid", role: "Solution Architect", dept: "Engineering", util: 96, capacity: 40, projects: ["ERP", "Salesforce"] },
  { name: "John Smith", role: "PM", dept: "Operations", util: 110, capacity: 40, projects: ["Coastal Refinery", "LNG Terminal"] },
  { name: "Mei Chen", role: "Security Lead", dept: "IT", util: 88, capacity: 40, projects: ["Security Hardening"] },
  { name: "Omar Haddad", role: "Field Engineer", dept: "Operations", util: 72, capacity: 40, projects: ["Wellhead", "Substation"] },
  { name: "Priya Iyer", role: "Tech Lead", dept: "R&D", util: 102, capacity: 40, projects: ["AI Forecasting", "Robotics"] },
  { name: "Liam Walker", role: "Finance Analyst", dept: "Finance", util: 55, capacity: 40, projects: ["Cost Opt"] },
  { name: "Hana Tanaka", role: "Procurement Lead", dept: "Operations", util: 78, capacity: 40, projects: ["Modernization"] },
  { name: "Diego Ortiz", role: "BI Engineer", dept: "IT", util: 64, capacity: 40, projects: ["Self-Service BI"] },
];

export const contracts = [
  { id: "CT-2026-041", vendor: "Siemens MENA", project: "Substation Bravo", value: 4.2, status: "Active", end: "Dec 2026" },
  { id: "CT-2026-038", vendor: "Oracle Consulting", project: "ERP Upgrade", value: 1.6, status: "Active", end: "Sep 2026" },
  { id: "CT-2026-035", vendor: "Bechtel Subcontract", project: "Refinery Expansion", value: 18.0, status: "Active", end: "Mar 2027" },
  { id: "CT-2026-029", vendor: "Cyberguard", project: "Security Hardening", value: 0.9, status: "Expiring", end: "Jul 2026" },
];

export const rfps = [
  { id: "RFP-014", title: "Robotics Integration Partner", type: "RFP", status: "Open", bidders: 5, due: "Jun 30" },
  { id: "RFI-009", title: "AI Vendor Capability Survey", type: "RFI", status: "Closed", bidders: 12, due: "May 12" },
  { id: "RFP-013", title: "Substation Civil Works", type: "RFP", status: "Evaluation", bidders: 4, due: "May 28" },
  { id: "RFP-012", title: "Cloud Reseller Agreement", type: "RFP", status: "Awarded", bidders: 6, due: "Apr 18" },
];

export const reports = [
  { id: "RPT-EXEC", name: "Executive Portfolio Snapshot", audience: "C-Level", frequency: "Weekly", lastRun: "Today" },
  { id: "RPT-FIN", name: "Finance Burn-Down", audience: "Finance Manager", frequency: "Weekly", lastRun: "Yesterday" },
  { id: "RPT-RES", name: "Resource Utilization Heatmap", audience: "Resource Manager", frequency: "Daily", lastRun: "Today" },
  { id: "RPT-RAID", name: "Portfolio RAID Roll-up", audience: "Director", frequency: "Weekly", lastRun: "2d ago" },
  { id: "RPT-GOV", name: "Governance Decisions Log", audience: "Board", frequency: "Monthly", lastRun: "May 03" },
  { id: "RPT-VEN", name: "Vendor Performance Scorecard", audience: "Procurement", frequency: "Quarterly", lastRun: "Apr 01" },
];

export const roleCatalogue = [
  { name: "Super Admin", users: 2, color: "#8B5CF6", perms: 70, desc: "Full system access & RBAC editor" },
  { name: "Executive / C-Level", users: 6, color: "#8B5CF6", perms: 22, desc: "Portfolio + governance visibility" },
  { name: "Portfolio Director", users: 4, color: "#0EA5E9", perms: 48, desc: "Approves & monitors entire portfolio" },
  { name: "Project Manager", users: 24, color: "#10B981", perms: 36, desc: "Owns project execution & reporting" },
  { name: "Resource Manager", users: 3, color: "#F97316", perms: 28, desc: "Capacity planning & allocation" },
  { name: "Finance Manager", users: 4, color: "#F59E0B", perms: 24, desc: "Budgets, CRs, financial reports" },
  { name: "Team Member", users: 86, color: "#64748B", perms: 14, desc: "Tasks, timesheets, status updates" },
  { name: "Client (External)", users: 12, color: "#475569", perms: 6, desc: "Portal-only project visibility" },
];

export const milestones = [
  { project: "ERP System Upgrade", name: "UAT Sign-off", due: "Jun 15, 2026", in: 18, status: "amber" },
  { project: "Customer Portal v3", name: "Production cutover", due: "Aug 30, 2026", in: 94, status: "green" },
  { project: "Security Hardening 2026", name: "Pen-test remediation", due: "Jul 03, 2026", in: 36, status: "red" },
  { project: "Coastal Refinery Expansion", name: "Civil phase complete", due: "Sep 22, 2026", in: 117, status: "amber" },
  { project: "Smart Grid Pilot", name: "Pilot kick-off", due: "Jun 02, 2026", in: 5, status: "green" },
];
