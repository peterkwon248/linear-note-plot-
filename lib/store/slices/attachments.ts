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
      appendEvent(partial.noteId, "attachment_added", { attachmentId: id, name: partial.name })
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
    },

    restoreAttachment: (attachmentId: string) => {
      set((state: any) => ({
        attachments: state.attachments.map((a: Attachment) =>
          a.id === attachmentId ? { ...a, trashed: false, trashedAt: null } : a
        ),
      }))
    },

    permanentlyDeleteAttachment: (attachmentId: string) => {
      const attachment = (get().attachments as Attachment[]).find((a) => a.id === attachmentId)
      if (!attachment) return
      set((state: any) => ({
        attachments: state.attachments.filter((a: Attachment) => a.id !== attachmentId),
      }))
      removeAttachmentBlob(attachmentId)
    },
  }
}
