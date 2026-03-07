import type { Note, Tag } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createTagsSlice(set: Set) {
  return {
    createTag: (name: string, color: string) => {
      set((state: any) => ({
        tags: [...state.tags, { id: genId(), name, color }],
      }))
    },

    updateTag: (id: string, updates: Partial<Tag>) => {
      set((state: any) => ({
        tags: state.tags.map((t: Tag) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }))
    },

    deleteTag: (id: string) => {
      set((state: any) => ({
        tags: state.tags.filter((t: Tag) => t.id !== id),
        notes: state.notes.map((n: Note) => ({
          ...n,
          tags: n.tags.filter((t) => t !== id),
        })),
      }))
    },

    addTagToNote: (noteId: string, tagId: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === noteId && !n.tags.includes(tagId)
            ? { ...n, tags: [...n.tags, tagId], updatedAt: now(), lastTouchedAt: now() }
            : n
        ),
      }))
    },

    removeTagFromNote: (noteId: string, tagId: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === noteId
            ? { ...n, tags: n.tags.filter((t) => t !== tagId), updatedAt: now(), lastTouchedAt: now() }
            : n
        ),
      }))
    },
  }
}
