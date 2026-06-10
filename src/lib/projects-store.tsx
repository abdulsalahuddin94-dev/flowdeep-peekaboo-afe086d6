import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { projects as initialProjects, rfps as initialRfps, orgTags as initialTags, type Project } from "./mock-data";

export type OrgTag = { name: string; color: string };

// ── Shared types ──────────────────────────────────────────────────────────────

export type Notification = {
  id: string;
  tone: "red" | "amber" | "green" | "blue";
  title: string;
  time: string;
  read: boolean;
};

export type RfpEntry = {
  id: string; title: string; type: string;
  status: string; bidders: number; due: string; project?: string;
};

export type ResourceRequest = {
  id: string; project: string; role: string;
  skill: "Junior" | "Mid" | "Senior" | "Lead";
  fte: number; from: string; until: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Pending" | "Fulfilled" | "Declined";
  submittedBy: string; date: string; notes: string;
  assignedTo?: string; declineReason?: string;
};

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_NOTIFS: Notification[] = [
  { id: "n1", tone: "red",   title: "ERP Upgrade slipping — UAT Sign-off in 18 days", time: "12m ago",   read: false },
  { id: "n2", tone: "amber", title: "Business Case BC-018 awaiting your review",       time: "1h ago",    read: false },
  { id: "n3", tone: "green", title: "Salesforce Migration milestone closed",           time: "3h ago",    read: false },
  { id: "n4", tone: "amber", title: "Priya Iyer over-allocated to 102%",              time: "Yesterday", read: false },
  { id: "n5", tone: "blue",  title: "Weekly Executive Report ready",                  time: "Yesterday", read: false },
];

const SEED_RFPS: RfpEntry[] = initialRfps.map((r) => ({ ...r }));

export const SEED_RESOURCE_REQUESTS: ResourceRequest[] = [
  { id: "RR-001", project: "ERP System Upgrade",         role: "Solution Architect", skill: "Senior", fte: 1.0, from: "2026-06", until: "2026-09", priority: "Critical", status: "Pending",   submittedBy: "Sara Al-Rashid", date: "2d ago",  notes: "Must have SAP ECC or S/4HANA experience" },
  { id: "RR-002", project: "Coastal Refinery Expansion",  role: "Field Engineer",    skill: "Senior", fte: 2.0, from: "2026-07", until: "2026-12", priority: "High",     status: "Pending",   submittedBy: "John Smith",     date: "3d ago",  notes: "" },
  { id: "RR-003", project: "Smart Grid Pilot",            role: "QA Engineer",       skill: "Mid",    fte: 1.0, from: "2026-07", until: "2026-09", priority: "Medium",   status: "Pending",   submittedBy: "Priya Iyer",     date: "5d ago",  notes: "" },
  { id: "RR-004", project: "AI Forecasting Engine",       role: "Data Engineer",     skill: "Mid",    fte: 1.5, from: "2026-06", until: "2026-11", priority: "Medium",   status: "Pending",   submittedBy: "Diego Ortiz",    date: "6d ago",  notes: "Python + Spark stack preferred" },
  { id: "RR-005", project: "Security Hardening 2026",     role: "Security Lead",     skill: "Senior", fte: 0.5, from: "2026-08", until: "2026-08", priority: "Critical", status: "Fulfilled", submittedBy: "Mei Chen",       date: "1w ago",  notes: "Pen-test cert required", assignedTo: "Mei Chen" },
  { id: "RR-006", project: "Warehouse Robotics",          role: "Change Manager",    skill: "Mid",    fte: 0.5, from: "2026-09", until: "2026-09", priority: "Low",      status: "Declined",  submittedBy: "Priya Iyer",     date: "1w ago",  notes: "", declineReason: "No available change managers this quarter — recommend external consultant" },
];

// ── Context ───────────────────────────────────────────────────────────────────

type AppContextValue = {
  // Projects
  projects: Project[];
  addProject: (p: Project) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "read">) => void;
  markAllRead: () => void;
  // RFPs
  rfps: RfpEntry[];
  addRfp: (r: RfpEntry) => void;
  // Resource requests
  resourceRequests: ResourceRequest[];
  addResourceRequest: (r: Omit<ResourceRequest, "id" | "date" | "status">) => void;
  updateResourceRequest: (id: string, patch: Partial<ResourceRequest>) => void;
  // Tags
  tags: (OrgTag & { usage: number })[];
  addTag: (tag: OrgTag, projectIds: string[]) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFS);
  const [rfps, setRfps] = useState<RfpEntry[]>(SEED_RFPS);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>(SEED_RESOURCE_REQUESTS);
  const [tagList, setTagList] = useState<OrgTag[]>(initialTags.map(({ name, color }) => ({ name, color })));

  const tags = useMemo(
    () => tagList.map((t) => ({ ...t, usage: projects.filter((p) => p.tags.includes(t.name)).length })),
    [tagList, projects],
  );

  function addTag(tag: OrgTag, projectIds: string[]) {
    setTagList((prev) => prev.some((t) => t.name.toLowerCase() === tag.name.toLowerCase()) ? prev : [...prev, tag]);
    if (projectIds.length) {
      setProjects((prev) => prev.map((p) =>
        projectIds.includes(p.id) && !p.tags.includes(tag.name) ? { ...p, tags: [...p.tags, tag.name] } : p,
      ));
    }
  }


  const unreadCount = notifications.filter((n) => !n.read).length;

  function addProject(p: Project) { setProjects((prev) => [p, ...prev]); }
  function updateProject(id: string, patch: Partial<Project>) {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p));
  }

  function addNotification(n: Omit<Notification, "id" | "read">) {
    setNotifications((prev) => [{ ...n, id: `n-${Date.now()}`, read: false }, ...prev]);
  }
  function markAllRead() { setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); }

  function addRfp(r: RfpEntry) { setRfps((prev) => [r, ...prev]); }

  function addResourceRequest(r: Omit<ResourceRequest, "id" | "date" | "status">) {
    setResourceRequests((prev) => [{
      ...r,
      id: `RR-${String(Date.now()).slice(-4)}`,
      date: "Just now",
      status: "Pending",
    }, ...prev]);
  }
  function updateResourceRequest(id: string, patch: Partial<ResourceRequest>) {
    setResourceRequests((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
  }

  return (
    <AppContext.Provider value={{
      projects, addProject, updateProject,
      notifications, unreadCount, addNotification, markAllRead,
      rfps, addRfp,
      resourceRequests, addResourceRequest, updateResourceRequest,
      tags, addTag,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("Must be used within ProjectsProvider");
  return ctx;
}

export function useProjects() { return useAppContext(); }

export function useNotifications() {
  const { notifications, unreadCount, addNotification, markAllRead } = useAppContext();
  return { notifications, unreadCount, addNotification, markAllRead };
}

export function useRfps() {
  const { rfps, addRfp } = useAppContext();
  return { rfps, addRfp };
}

export function useResourceRequests() {
  const { resourceRequests, addResourceRequest, updateResourceRequest } = useAppContext();
  return { resourceRequests, addResourceRequest, updateResourceRequest };
}

export function useTags() {
  const { tags, addTag } = useAppContext();
  return { tags, addTag };
}
