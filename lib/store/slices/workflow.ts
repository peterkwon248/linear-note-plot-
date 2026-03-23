import type { Note } from "../../types"
import { now, type AppendEventFn } from "../helpers"
import { computeNextStep, dueAtFromStep } from "../../srs"
import type { SRSState, SRSRating } from "../../srs"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createWorkflowSlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  return {
    triageKeep: (id: string) => {
      const reviewAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id
            ? { ...n, status: "capture" as const, triageStatus: "kept" as const, reviewAt, lastTouchedAt: now(), updatedAt: now() }
            : n
        ),
      }))
      appendEvent(id, "triage_keep")
    },

    triageSnooze: (id: string, reviewAt: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id
            ? { ...n, triageStatus: "snoozed" as const, reviewAt, snoozeCount: (n.snoozeCount ?? 0) + 1, lastTouchedAt: now(), updatedAt: now() }
            : n
        ),
      }))
      appendEvent(id, "triage_snooze", { reviewAt })
    },

    triageTrash: (id: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id
            ? { ...n, triageStatus: "trashed" as const, trashed: true, trashedAt: now(), lastTouchedAt: now(), updatedAt: now() }
            : n
        ),
      }))
      appendEvent(id, "triage_trash")
    },

    promoteToPermanent: (id: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id
            ? { ...n, status: "permanent" as const, promotedAt: now(), lastTouchedAt: now(), updatedAt: now() }
            : n
        ),
      }))
      appendEvent(id, "promoted")
      get().enrollSRS(id)
    },

    undoPromote: (id: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id
            ? { ...n, status: "capture" as const, promotedAt: null, lastTouchedAt: now(), updatedAt: now() }
            : n
        ),
      }))
      get().unenrollSRS(id)
      appendEvent(id, "updated", { action: "undoPromote" })
    },

    moveBackToInbox: (id: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id
            ? { ...n, status: "inbox" as const, triageStatus: "untriaged" as const, lastTouchedAt: now(), updatedAt: now() }
            : n
        ),
      }))
      appendEvent(id, "updated", { action: "moveBackToInbox" })
    },

    setReminder: (id: string, reviewAt: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id ? { ...n, reviewAt, updatedAt: now() } : n
        ),
      }))
      appendEvent(id, "updated", { action: "setReminder", reviewAt })
    },

    clearReminder: (id: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === id ? { ...n, reviewAt: null, updatedAt: now() } : n
        ),
      }))
      appendEvent(id, "updated", { action: "clearReminder" })
    },

    batchSetReminder: (ids: string[], reviewAt: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          ids.includes(n.id) ? { ...n, reviewAt, updatedAt: now() } : n
        ),
      }))
      ids.forEach((id) => appendEvent(id, "updated", { action: "setReminder", reviewAt }))
    },

    // SRS Actions
    reviewSRS: (noteId: string, rating: SRSRating) => {
      const prev = get().srsStateByNoteId[noteId]
      if (!prev) return
      const result = computeNextStep(rating, prev.step)
      set((state: any) => ({
        srsStateByNoteId: {
          ...state.srsStateByNoteId,
          [noteId]: {
            ...prev,
            step: result.step,
            dueAt: dueAtFromStep(result.step),
            lastReviewedAt: now(),
            lapses: prev.lapses + result.lapseDelta,
            introducedAt: prev.introducedAt,
          },
        },
      }))
      appendEvent(noteId, "srs_reviewed", { rating, step: result.step })
    },

    enrollSRS: (noteId: string) => {
      if (get().srsStateByNoteId[noteId]) return
      set((state: any) => ({
        srsStateByNoteId: {
          ...state.srsStateByNoteId,
          [noteId]: {
            step: 0,
            dueAt: dueAtFromStep(0),
            lastReviewedAt: now(),
            introducedAt: now(),
            lapses: 0,
          },
        },
      }))
    },

    unenrollSRS: (noteId: string) => {
      set((state: any) => {
        const { [noteId]: _, ...rest } = state.srsStateByNoteId
        return { srsStateByNoteId: rest }
      })
    },

    enrollAllPermanentSRS: () => {
      const state = get()
      const toEnroll = state.notes.filter(
        (n: Note) => n.status === "permanent" && !n.trashed && !state.srsStateByNoteId[n.id]
      )
      if (toEnroll.length === 0) return 0
      const timestamp = now()
      const newMap = { ...state.srsStateByNoteId }
      for (const n of toEnroll) {
        newMap[n.id] = {
          step: 0,
          dueAt: dueAtFromStep(0),
          lastReviewedAt: timestamp,
          introducedAt: timestamp,
          lapses: 0,
        }
      }
      set({ srsStateByNoteId: newMap })
      return toEnroll.length
    },
  }
}
