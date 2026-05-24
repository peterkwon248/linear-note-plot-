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
      // Note-side event: file-entity-prd §2-1 — surface on note's timeline
      // only when origin is actually a note (wiki/library origins have no
      // note-timeline to attach to).
      if (partial.originEntity?.kind === "note") {
        appendEvent(partial.originEntity.id, "attachment_added", { attachmentId: id, name: partial.name })
      }
      // File-side entity event — surfaces on file's own timeline.
      appendEvent({ kind: "file", id }, "created", { name: partial.name, originEntity: partial.originEntity ?? null })
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
      if (attachment.originEntity?.kind === "note") {
        appendEvent(attachment.originEntity.id, "attachment_removed", { attachmentId, name: attachment.name })
      }
      appendEvent({ kind: "file", id: attachmentId }, "trashed")
    },

    restoreAttachment: (attachmentId: string) => {
      set((state: any) => ({
        attachments: state.attachments.map((a: Attachment) =>
          a.id === attachmentId ? { ...a, trashed: false, trashedAt: null } : a
        ),
      }))
      appendEvent({ kind: "file", id: attachmentId }, "untrashed")
    },

    permanentlyDeleteAttachment: (attachmentId: string) => {
      const attachment = (get().attachments as Attachment[]).find((a) => a.id === attachmentId)
      if (!attachment) return
      set((state: any) => ({
        attachments: state.attachments.filter((a: Attachment) => a.id !== attachmentId),
        entityEvents: state.entityEvents.filter(
          (e: any) => !(e.entity?.kind === "file" && e.entity?.id === attachmentId),
        ),
      }))
      removeAttachmentBlob(attachmentId)
    },
  }
}
