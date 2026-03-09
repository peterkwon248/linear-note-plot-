"use client"

import { useState, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { NotePickerDialog } from "@/components/note-picker-dialog"
import { MergeDialog } from "@/components/merge-dialog"

/**
 * Global merge dialog flow:
 * 1. Store sets mergePickerOpen=true + mergePickerSourceId
 * 2. NotePickerDialog opens → user picks a second note
 * 3. MergeDialog opens with [sourceId, pickedId] → user confirms target
 * 4. Merge executes, dialogs close
 */
export function MergeDialogGlobal() {
  const mergePickerOpen = usePlotStore((s) => s.mergePickerOpen)
  const mergePickerSourceId = usePlotStore((s) => s.mergePickerSourceId)
  const setMergePickerOpen = usePlotStore((s) => s.setMergePickerOpen)

  const [mergeIds, setMergeIds] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  // When user picks a note from the picker
  const handlePickerSelect = useCallback(
    (pickedNoteId: string) => {
      if (!mergePickerSourceId) return
      setMergeIds([mergePickerSourceId, pickedNoteId])
      setMergePickerOpen(false)
      setConfirmOpen(true)
    },
    [mergePickerSourceId, setMergePickerOpen]
  )

  // Close picker
  const handlePickerClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setMergePickerOpen(false)
      }
    },
    [setMergePickerOpen]
  )

  // Close confirm
  const handleConfirmClose = useCallback((open: boolean) => {
    if (!open) {
      setConfirmOpen(false)
      setMergeIds([])
    }
  }, [])

  return (
    <>
      {/* Step 1: Note picker */}
      <NotePickerDialog
        open={mergePickerOpen}
        onOpenChange={handlePickerClose}
        title="Merge with..."
        excludeIds={mergePickerSourceId ? [mergePickerSourceId] : []}
        onSelect={handlePickerSelect}
      />

      {/* Step 2: Merge confirmation */}
      {mergeIds.length >= 2 && (
        <MergeDialog
          open={confirmOpen}
          onOpenChange={handleConfirmClose}
          noteIds={mergeIds}
          onComplete={() => {
            setConfirmOpen(false)
            setMergeIds([])
          }}
        />
      )}
    </>
  )
}
