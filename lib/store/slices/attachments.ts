import type { Attachment } from "../../types"
import { genId, now, removeAttachmentBlob, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createAttachmentsSlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  return {
    addAttachment: (partial: Omit<Attachment, "id" | "createdAt">) => {
      const id = genId()
      const attachment: Attachment = { ...partial, id, createdAt: now() }
      set((state: any) => ({ attachments: [...state.attachments, attachment] }))
      // Note-side event (existing) — surfaces on note's timeline.
      appendEvent(partial.noteId, "attachment_added", { attachmentId: id, name: partial.name })
      // PR 5c: file-side entity event — surfaces on file's own timeline.
      appendEvent({ kind: "file", id }, "created", { name: partial.name, noteId: partial.noteId })
      return id
    },

    removeAttachment: (attachmentId: string) => {
      const attachment = (get().attachments as Attachment[]).find((a) => a.id === attachmentId)
      if (!attachment) return
      set((state: any) => ({
        attachments: state.attachments.map((a: Attachment) =>
          a.id === attachmentId ? { ...a, trashed: true, trashedAt: new Date().toISOString() } : a
        ),
      }))
      // Don't delete blob yet — only on permanent delete
      appendEvent(attachment.noteId, "attachment_removed", { attachmentId, name: attachment.name })
      // PR 5c: file-side entity event
      appendEvent({ kind: "file", id: attachmentId }, "trashed")
    },

    restoreAttachment: (attachmentId: string) => {
      set((state: any) => ({
        attachments: state.attachments.map((a: Attachment) =>
          a.id === attachmentId ? { ...a, trashed: false, trashedAt: null } : a
        ),
      }))
      // PR 5c: file-side entity event
      appendEvent({ kind: "file", id: attachmentId }, "untrashed")
    },

    permanentlyDeleteAttachment: (attachmentId: string) => {
      const attachment = (get().attachments as Attachment[]).find((a) => a.id === attachmentId)
      if (!attachment) return
      set((state: any) => ({
        attachments: state.attachments.filter((a: Attachment) => a.id !== attachmentId),
        // PR 5c: hard delete cascade — drop this file's events.
        entityEvents: state.entityEvents.filter(
          (e: any) => !(e.entity?.kind === "file" && e.entity?.id === attachmentId),
        ),
      }))
      removeAttachmentBlob(attachmentId)
    },
  }
}
