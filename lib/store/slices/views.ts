import type { SavedView } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createViewsSlice(set: Set) {
  return {
    createSavedView: (name: string, config?: Partial<SavedView>) => {
      const id = genId()
      const view: SavedView = {
        id,
        name,
        filters: [],
        ...config,
        createdAt: now(),
        updatedAt: now(),
      }
      set((state: any) => ({
        savedViews: [...state.savedViews, view],
      }))
      return id
    },

    updateSavedView: (id: string, updates: Partial<SavedView>) => {
      set((state: any) => ({
        savedViews: state.savedViews.map((v: SavedView) =>
          v.id === id ? { ...v, ...updates, updatedAt: now() } : v
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
