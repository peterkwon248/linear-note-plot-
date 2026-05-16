import type { Note, Tag } from "../../types"
import { genId, now, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createTagsSlice(set: Set, appendEvent: AppendEventFn) {
  return {
    // v109: `color` defaults to null (opt-in). Tags created from hashtags or
    // the picker start uncolored; users set a color explicitly via context
    // menu when desired.
    createTag: (name: string, color: string | null = null) => {
      const id = genId()
      set((state: any) => ({
        tags: [...state.tags, { id, name, color }],
      }))
      // PR 5c: entity event log
      appendEvent({ kind: "tag", id }, "created", { name })
      return id
    },

    updateTag: (id: string, updates: Partial<Tag>) => {
      set((state: any) => ({
        tags: state.tags.map((t: Tag) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }))
      // PR 5c: entity event log — distinguish color/rename for richer UX.
      if (updates.color !== undefined) {
        appendEvent({ kind: "tag", id }, "color_changed", { color: updates.color })
      } else if (updates.name !== undefined) {
        appendEvent({ kind: "tag", id }, "renamed", { name: updates.name })
      } else {
        appendEvent({ kind: "tag", id }, "updated")
      }
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
      // PR 5c: entity event log
      appendEvent({ kind: "tag", id }, "trashed")
    },

    restoreTag: (id: string) => {
      set((state: any) => ({
        tags: state.tags.map((t: Tag) =>
          t.id === id ? { ...t, trashed: false, trashedAt: null } : t
        ),
      }))
      // PR 5c: entity event log
      appendEvent({ kind: "tag", id }, "untrashed")
    },

    permanentlyDeleteTag: (id: string) => {
      set((state: any) => ({
        tags: state.tags.filter((t: Tag) => t.id !== id),
        // PR 5c: hard delete cascade — drop this tag's events.
        entityEvents: state.entityEvents.filter(
          (e: any) => !(e.entity?.kind === "tag" && e.entity?.id === id),
        ),
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
      // PR 5c: tag-side cross-entity membership event.
      appendEvent({ kind: "tag", id: tagId }, "member_added", { noteId })
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
      // PR 5c: tag-side membership event (fires regardless of orphan-cleanup).
      appendEvent({ kind: "tag", id: tagId }, "member_removed", { noteId })
    },
  }
}
