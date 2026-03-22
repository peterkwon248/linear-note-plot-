import type { SavedView } from "../../types"
import { genId } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createSavedViewsSlice(set: Set) {
  return {
    createSavedView: (name: string, viewState?: Partial<SavedView['viewState']>, space?: SavedView['space']) => {
      const now = new Date().toISOString()
      const id = genId()
      set((state: any) => ({
        savedViews: [...state.savedViews, {
          id,
          name,
          description: "",
          icon: undefined,
          color: "#6366f1",
          space: (space || "all") as SavedView['space'],
          viewState: {
            viewMode: "list" as const,
            sortField: "updatedAt",
            sortDirection: "desc" as const,
            groupBy: "none",
            filters: [],
            visibleColumns: ["status", "folder", "tags", "updatedAt"],
            showEmptyGroups: false,
            ...viewState,
          },
          pinned: false,
          pinnedOrder: 0,
          createdAt: now,
          updatedAt: now,
        }],
      }))
      return id
    },

    updateSavedView: (id: string, updates: Partial<SavedView>) => {
      set((state: any) => ({
        savedViews: state.savedViews.map((v: SavedView) =>
          v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
        ),
      }))
    },

    deleteSavedView: (id: string) => {
      set((state: any) => ({
        savedViews: state.savedViews.filter((v: SavedView) => v.id !== id),
      }))
    },
  }
}
