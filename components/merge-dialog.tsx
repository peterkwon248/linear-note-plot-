"use client"

import { useState, useMemo, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import type { Note } from "@/lib/types"

/* ── Props ──────────────────────────────────────── */

interface MergeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** IDs of notes involved in the merge (2+) */
  noteIds: string[]
  /** Called after merge completes */
  onComplete?: (targetId: string) => void
}

/* ── Status label helper ────────────────────────── */

const STATUS_LABELS: Record<string, string> = {
  inbox: "Inbox",
  capture: "Capture",
  permanent: "Permanent",
}

/* ── Component ──────────────────────────────────── */

export function MergeDialog({
  open,
  onOpenChange,
  noteIds,
  onComplete,
}: MergeDialogProps) {
  const notes = usePlotStore((s) => s.notes)
  const mergeNotes = usePlotStore((s) => s.mergeNotes)
  const openNote = usePlotStore((s) => s.openNote)

  // Default target = first note
  const [targetId, setTargetId] = useState<string>("")

  // Resolve notes
  const mergeNotesList = useMemo(() => {
    const result: Note[] = []
    for (const id of noteIds) {
      const note = notes.find((n) => n.id === id)
      if (note) result.push(note)
    }
    return result
  }, [noteIds, notes])

  // Set default target when noteIds change
  const resolvedTarget = targetId && noteIds.includes(targetId) ? targetId : noteIds[0] ?? ""

  const sourceCount = noteIds.length - 1
  const targetNote = mergeNotesList.find((n) => n.id === resolvedTarget)
  const targetLabel = targetNote
    ? (targetNote.title || "Untitled").slice(0, 30) + (targetNote.title.length > 30 ? "…" : "")
    : "..."

  const handleMerge = useCallback(() => {
    if (!resolvedTarget || noteIds.length < 2) return
    const sourceIds = noteIds.filter((id) => id !== resolvedTarget)
    mergeNotes(resolvedTarget, sourceIds)
    onOpenChange(false)
    openNote(resolvedTarget)
    toast.success(
      `Merged ${sourceIds.length} note${sourceIds.length > 1 ? "s" : ""} into "${targetLabel}"`,
      { description: "Source notes have been trashed." }
    )
    onComplete?.(resolvedTarget)
  }, [resolvedTarget, noteIds, mergeNotes, onOpenChange, openNote, targetLabel, onComplete])

  if (mergeNotesList.length < 2) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-ui">
            <GitMerge size={16} weight="regular" />
            GitMerge Notes
          </DialogTitle>
          <DialogDescription className="text-note">
            Select the target note. {sourceCount > 0 && `${sourceCount} source note${sourceCount > 1 ? "s" : ""} will be trashed.`}
          </DialogDescription>
        </DialogHeader>

        {/* Target selection */}
        <div className="px-5 py-2">
          <RadioGroup
            value={resolvedTarget}
            onValueChange={setTargetId}
            className="gap-1"
          >
            {mergeNotesList.map((note) => (
              <label
                key={note.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-secondary/40 has-[button[data-state=checked]]:bg-secondary/60"
              >
                <RadioGroupItem value={note.id} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {note.title || "Untitled"}
                  </p>
                </div>
                <span className="shrink-0 text-2xs text-muted-foreground/50">
                  {STATUS_LABELS[note.status] ?? note.status}
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Info */}
        <div className="mx-5 mb-3 flex items-center gap-2 rounded-md bg-secondary/30 px-3 py-2">
          <Trash className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            Source notes will be trashed. Content, tags, and reads will be merged into the target.
          </p>
        </div>

        <DialogFooter className="border-t border-border px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-note"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleMerge}
            className="text-note"
          >
            <GitMerge size={14} weight="regular" />
            GitMerge into &ldquo;{targetLabel}&rdquo;
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
