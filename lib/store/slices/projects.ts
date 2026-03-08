import type { Project } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createProjectsSlice(set: Set) {
  return {
    createProject: (name: string) => {
      const id = genId()
      const newProject: Project = {
        id,
        name,
        status: "planning",
        focus: null,
        description: "",
        targetDate: null,
        createdAt: now(),
        updatedAt: now(),
      }
      set((state: any) => ({
        projects: [newProject, ...state.projects],
      }))
      return id
    },

    updateProject: (id: string, updates: Partial<Project>) => {
      set((state: any) => ({
        projects: state.projects.map((p: Project) =>
          p.id === id ? { ...p, ...updates, updatedAt: now() } : p
        ),
      }))
    },

    deleteProject: (id: string) => {
      set((state: any) => ({
        projects: state.projects.filter((p: Project) => p.id !== id),
        // Also unlink notes from this project
        notes: state.notes.map((n: any) =>
          n.projectId === id ? { ...n, projectId: null } : n
        ),
      }))
    },
  }
}
