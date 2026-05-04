import type { Note, Tag } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createTagsSlice(set: Set) {
  return {
    // v109: `color` defaults to null (opt-in). Tags created from hashtags or
    // the picker start uncolored; users set a color explicitly via context
    // menu when desired.
    createTag: (name: string, color: string | null = null) => {
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
        tags: state.tags.map((t: Tag) =>
          t.id === id ? { ...t, trashed: true, trashedAt: new Date().toISOString() } : t
        ),
        ...(state.activeView?.type === "tag" && state.activeView?.tagId === id
          ? { activeView: { type: "all" } }
          : {}),
      }))
    },

    restoreTag: (id: string) => {
      set((state: any) => ({
        tags: state.tags.map((t: Tag) =>
          t.id === id ? { ...t, trashed: false, trashedAt: null } : t
        ),
      }))
    },

    permanentlyDeleteTag: (id: string) => {
      set((state: any) => ({
        tags: state.tags.filter((t: Tag) => t.id !== id),
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
      set((state: any) => {
        const updatedNotes = state.notes.map((n: Note) =>
          n.id === noteId
            ? { ...n, tags: n.tags.filter((t: string) => t !== tagId), updatedAt: now(), lastTouchedAt: now() }
            : n
        )
        // Auto-remove orphaned tag (no notes reference it anymore)
        const stillUsed = updatedNotes.some((n: Note) => n.tags.includes(tagId))
        return {
          notes: updatedNotes,
          ...(stillUsed ? {} : {
            tags: state.tags.filter((t: Tag) => t.id !== tagId),
          }),
        }
      })
    },
  }
}
