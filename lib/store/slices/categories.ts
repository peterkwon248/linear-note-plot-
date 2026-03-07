import type { Note, Category, ActiveView } from "../../types"
import { genId } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createCategoriesSlice(set: Set) {
  return {
    createCategory: (name: string, color: string) => {
      set((state: any) => ({
        categories: [...state.categories, { id: genId(), name, color }],
      }))
    },

    updateCategory: (id: string, updates: Partial<Category>) => {
      set((state: any) => ({
        categories: state.categories.map((c: Category) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }))
    },

    deleteCategory: (id: string) => {
      set((state: any) => ({
        categories: state.categories.filter((c: Category) => c.id !== id),
        notes: state.notes.map((n: Note) =>
          n.category === id ? { ...n, category: "" } : n
        ),
        activeView:
          state.activeView.type === "category" &&
          state.activeView.categoryId === id
            ? ({ type: "all" } as ActiveView)
            : state.activeView,
      }))
    },
  }
}
