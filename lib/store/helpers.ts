import type { NoteBody, NoteStatus, Note, NoteEvent, NoteEventType } from "../types"
import { saveBody as saveBodyToIDB, deleteBody as deleteBodyFromIDB } from "../note-body-store"

/** Fire-and-forget IDB body write (guarded for SSR) */
export function persistBody(body: NoteBody) {
  if (typeof indexedDB === "undefined") return
  saveBodyToIDB(body).catch((err) => console.warn("[Plot] Body save failed:", err))
}

/** Fire-and-forget IDB body delete (guarded for SSR) */
export function removeBody(id: string) {
  if (typeof indexedDB === "undefined") return
  deleteBodyFromIDB(id).catch((err) => console.warn("[Plot] Body delete failed:", err))
}

export const genId = () => crypto.randomUUID()
export const now = () => new Date().toISOString()

/** Default workflow fields for a note */
export function workflowDefaults(status: NoteStatus = "inbox"): Pick<
  Note,
  "triageStatus" | "reviewAt" | "inboxRank" | "summary" | "source" | "promotedAt" | "lastTouchedAt" | "snoozeCount" | "archivedAt" | "parentNoteId"
> {
  return {
    triageStatus: status === "inbox" ? "untriaged" : "kept",
    reviewAt: null,
    inboxRank: 0,
    summary: null,
    source: "manual",
    promotedAt: status === "permanent" ? now() : null,
    lastTouchedAt: now(),
    snoozeCount: 0,
    archivedAt: null,
    parentNoteId: null,
  }
}

const MAX_EVENTS_PER_NOTE = 1000

/** Create the appendEvent helper bound to a Zustand set function */
export function createAppendEvent(set: (fn: (state: { noteEvents: NoteEvent[] }) => { noteEvents: NoteEvent[] }) => void) {
  return (noteId: string, type: NoteEventType, meta?: Record<string, unknown>) => {
    const event: NoteEvent = { id: genId(), noteId, type, at: now(), meta }
    set((state) => {
      const updated = [...state.noteEvents, event]
      const noteEventCount = updated.filter(e => e.noteId === noteId).length
      if (noteEventCount > MAX_EVENTS_PER_NOTE) {
        const excess = noteEventCount - MAX_EVENTS_PER_NOTE
        let removed = 0
        return { noteEvents: updated.filter(e => {
          if (e.noteId === noteId && removed < excess) {
            removed++
            return false
          }
          return true
        })}
      }
      return { noteEvents: updated }
    })
  }
}

/** Type alias for the appendEvent function */
export type AppendEventFn = ReturnType<typeof createAppendEvent>
