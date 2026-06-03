import { createContext, useContext, useState, type ReactNode } from "react";
import { projects as initialProjects, type Project } from "./mock-data";

type ProjectsContextValue = {
  projects: Project[];
  addProject: (p: Project) => void;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  function addProject(p: Project) {
    setProjects((prev) => [p, ...prev]);
  }
  return <ProjectsContext.Provider value={{ projects, addProject }}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}
