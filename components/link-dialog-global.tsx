"use client"

import { useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { NotePickerDialog } from "@/components/note-picker-dialog"
import { toast } from "sonner"

/**
 * Global link dialog flow:
 * 1. Store sets linkPickerOpen=true + linkPickerSourceId
 * 2. NotePickerDialog opens → user picks a target note
 * 3. addWikiLink creates [[target]] in the source note
 * 4. Toast confirms, dialog closes
 */
export function LinkDialogGlobal() {
  const linkPickerOpen = usePlotStore((s) => s.linkPickerOpen)
  const linkPickerSourceId = usePlotStore((s) => s.linkPickerSourceId)
  const setLinkPickerOpen = usePlotStore((s) => s.setLinkPickerOpen)
  const addWikiLink = usePlotStore((s) => s.addWikiLink)
  const notes = usePlotStore((s) => s.notes)

  const handleSelect = useCallback(
    (targetNoteId: string) => {
      if (!linkPickerSourceId) return
      const targetNote = notes.find((n) => n.id === targetNoteId)
      const sourceNote = notes.find((n) => n.id === linkPickerSourceId)
      if (!targetNote) return

      addWikiLink(linkPickerSourceId, targetNote.title || "Untitled")
      setLinkPickerOpen(false)

      toast.success(
        `Linked "${sourceNote?.title || "Untitled"}" → "${targetNote.title || "Untitled"}"`,
      )
    },
    [linkPickerSourceId, notes, addWikiLink, setLinkPickerOpen],
  )

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) setLinkPickerOpen(false)
    },
    [setLinkPickerOpen],
  )

  return (
    <NotePickerDialog
      open={linkPickerOpen}
      onOpenChange={handleClose}
      title="Link to..."
      excludeIds={linkPickerSourceId ? [linkPickerSourceId] : []}
      onSelect={handleSelect}
    />
  )
}
