import type { Note, Label } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createLabelsSlice(set: Set) {
  return {
    createLabel: (name: string, color: string) => {
      set((state: any) => ({
        labels: [...state.labels, { id: genId(), name, color }],
      }))
    },

    updateLabel: (id: string, updates: Partial<Label>) => {
      set((state: any) => ({
        labels: state.labels.map((l: Label) =>
          l.id === id ? { ...l, ...updates } : l
        ),
      }))
    },

    deleteLabel: (id: string) => {
      set((state: any) => ({
        labels: state.labels.filter((l: Label) => l.id !== id),
        notes: state.notes.map((n: Note) =>
          n.labelId === id ? { ...n, labelId: null } : n
        ),
      }))
    },

    setNoteLabel: (noteId: string, labelId: string | null) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === noteId
            ? { ...n, labelId, updatedAt: now(), lastTouchedAt: now() }
            : n
        ),
      }))
    },
  }
}
