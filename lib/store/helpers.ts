import type { NoteBody, NoteStatus, Note, NoteEvent, NoteEventType, WikiBlock } from "../types"
import { saveBody as saveBodyToIDB, deleteBody as deleteBodyFromIDB } from "../note-body-store"
import { saveBlob as saveBlobToIDB, deleteBlob as deleteBlobFromIDB } from "../attachment-store"
import type { AttachmentBlob } from "../attachment-store"
import { saveBlockBody as saveBlockBodyToIDB, deleteBlockBody as deleteBlockBodyFromIDB } from "../wiki-block-body-store"
import type { WikiBlockBody } from "../wiki-block-body-store"
import { saveArticleBlocks as saveArticleBlocksToIDB, deleteArticleBlocks as deleteArticleBlocksFromIDB } from "../wiki-block-meta-store"

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

/** Fire-and-forget IDB attachment blob write (guarded for SSR) */
export function persistAttachmentBlob(blob: AttachmentBlob) {
  if (typeof indexedDB === "undefined") return
  saveBlobToIDB(blob).catch((err) => console.warn("[Plot] Attachment blob save failed:", err))
}

/** Fire-and-forget IDB attachment blob delete (guarded for SSR) */
export function removeAttachmentBlob(id: string) {
  if (typeof indexedDB === "undefined") return
  deleteBlobFromIDB(id).catch((err) => console.warn("[Plot] Attachment blob delete failed:", err))
}

/** Fire-and-forget IDB wiki block body write (guarded for SSR) */
export function persistBlockBody(body: WikiBlockBody) {
  if (typeof indexedDB === "undefined") return
  saveBlockBodyToIDB(body).catch((err) => console.warn("[Plot] Block body save failed:", err))
}

/** Fire-and-forget IDB wiki block body delete (guarded for SSR) */
export function removeBlockBody(id: string) {
  if (typeof indexedDB === "undefined") return
  deleteBlockBodyFromIDB(id).catch((err) => console.warn("[Plot] Block body delete failed:", err))
}

/** Fire-and-forget IDB article blocks write (guarded for SSR) */
export function persistArticleBlocks(articleId: string, blocks: WikiBlock[]) {
  if (typeof indexedDB === "undefined") return
  saveArticleBlocksToIDB(articleId, blocks).catch((err) => console.warn("[Plot] Article blocks save failed:", err))
}

/** Fire-and-forget IDB article blocks delete (guarded for SSR) */
export function removeArticleBlocks(articleId: string) {
  if (typeof indexedDB === "undefined") return
  deleteArticleBlocksFromIDB(articleId).catch((err) => console.warn("[Plot] Article blocks delete failed:", err))
}

export const genId = () => crypto.randomUUID()
export const now = () => new Date().toISOString()

/** Default workflow fields for a note */
export function workflowDefaults(status: NoteStatus = "inbox"): Pick<
  Note,
  "triageStatus" | "reviewAt" | "inboxRank" | "summary" | "source" | "promotedAt" | "lastTouchedAt" | "snoozeCount" | "trashedAt" | "parentNoteId"
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
    trashedAt: null,
    parentNoteId: null,
  }
}

const MAX_EVENTS_TOTAL = 10000

/** Create the appendEvent helper bound to a Zustand set function */
export function createAppendEvent(set: (fn: (state: { noteEvents: NoteEvent[] }) => { noteEvents: NoteEvent[] }) => void) {
  return (noteId: string, type: NoteEventType, meta?: Record<string, unknown>) => {
    const event: NoteEvent = { id: genId(), noteId, type, at: now(), meta }
    set((state) => {
      const updated = [...state.noteEvents, event]
      if (updated.length > MAX_EVENTS_TOTAL) {
        return { noteEvents: updated.slice(updated.length - MAX_EVENTS_TOTAL) }
      }
      return { noteEvents: updated }
    })
  }
}

/** Type alias for the appendEvent function */
export type AppendEventFn = ReturnType<typeof createAppendEvent>
