import type { Note, Label } from "../../types"
import { genId, now, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createLabelsSlice(set: Set, appendEvent: AppendEventFn) {
  return {
    createLabel: (name: string, color: string) => {
      const id = genId()
      set((state: any) => ({
        labels: [...state.labels, { id, name, color }],
      }))
      // entity event log
      appendEvent({ kind: "label", id }, "created", { name })
    },

    updateLabel: (id: string, updates: Partial<Label>) => {
      set((state: any) => ({
        labels: state.labels.map((l: Label) =>
          l.id === id ? { ...l, ...updates } : l
        ),
      }))
      // entity event log — distinguish color/rename for richer UX.
      if (updates.color !== undefined) {
        appendEvent({ kind: "label", id }, "color_changed", { color: updates.color })
      } else if (updates.name !== undefined) {
        appendEvent({ kind: "label", id }, "renamed", { name: updates.name })
      } else {
        appendEvent({ kind: "label", id }, "updated")
      }
    },

    deleteLabel: (id: string) => {
      set((state: any) => ({
        labels: state.labels.map((l: Label) =>
          l.id === id ? { ...l, trashed: true, trashedAt: new Date().toISOString() } : l
        ),
      }))
      // entity event log
      appendEvent({ kind: "label", id }, "trashed")
    },

    restoreLabel: (id: string) => {
      set((state: any) => ({
        labels: state.labels.map((l: Label) =>
          l.id === id ? { ...l, trashed: false, trashedAt: null } : l
        ),
      }))
      // entity event log
      appendEvent({ kind: "label", id }, "untrashed")
    },

    permanentlyDeleteLabel: (id: string) => {
      set((state: any) => ({
        labels: state.labels.filter((l: Label) => l.id !== id),
        // Hard delete cascade — drop this label's events.
        entityEvents: state.entityEvents.filter(
          (e: any) => !(e.entity?.kind === "label" && e.entity?.id === id),
        ),
        notes: state.notes.map((n: Note) =>
          n.labelId === id ? { ...n, labelId: null } : n
        ),
      }))
    },

    setNoteLabel: (noteId: string, labelId: string | null) => {
      // Capture previous label id before mutation for member_removed event.
      // Zustand set() with an updater fn runs synchronously so we can read
      // state inside the updater and stash the old value before returning.
      let oldLabelId: string | null = null
      set((state: any) => {
        const note = (state.notes as Note[]).find((n) => n.id === noteId)
        oldLabelId = note?.labelId ?? null
        return {
          notes: state.notes.map((n: Note) =>
            n.id === noteId
              ? { ...n, labelId, updatedAt: now(), lastTouchedAt: now() }
              : n
          ),
        }
      })
      // entity event log — handle set / clear / switch correctly
      if (oldLabelId !== null && oldLabelId !== labelId) {
        appendEvent({ kind: "label", id: oldLabelId }, "member_removed", { noteId })
      }
      if (labelId !== null && labelId !== oldLabelId) {
        appendEvent({ kind: "label", id: labelId }, "member_added", { noteId })
      }
    },
  }
}
