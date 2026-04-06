import type { Reference } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createReferencesSlice(set: Set) {
  return {
    createReference: (partial: { title: string; content: string; fields?: Array<{ key: string; value: string }>; tags?: string[] }): string => {
      const id = genId()
      const ref: Reference = {
        id,
        title: partial.title,
        content: partial.content,
        fields: partial.fields ?? [],
        tags: partial.tags,
        createdAt: now(),
        updatedAt: now(),
      }
      set((state: any) => ({
        references: { ...state.references, [id]: ref },
      }))
      return id
    },

    updateReference: (id: string, updates: Partial<Omit<Reference, "id" | "createdAt">>) => {
      set((state: any) => {
        const existing = state.references[id]
        if (!existing) return {}
        return {
          references: {
            ...state.references,
            [id]: { ...existing, ...updates, updatedAt: now() },
          },
        }
      })
    },

    deleteReference: (id: string) => {
      set((state: any) => {
        const { [id]: _, ...rest } = state.references
        return { references: rest }
      })
    },
  }
}
