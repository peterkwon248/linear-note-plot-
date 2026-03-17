"use client"

import { useMemo, useState, useCallback } from "react"
import { X, Zap, Check, Trash2, ArrowUpRight, ArrowDownLeft, Inbox, Merge, Link2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { StatusDropdown, PriorityDropdown } from "@/components/note-fields"
import { RemindPicker } from "@/components/remind-picker"
import { NotePickerDialog } from "@/components/note-picker-dialog"
import type { ViewContextKey } from "@/lib/view-engine/types"
import type { Note, NoteStatus, NotePriority } from "@/lib/types"
import { MergeDialog } from "@/components/merge-dialog"
import { pushUndo } from "@/lib/undo-manager"

/* ── Props ────────────────────────────────────────────── */

interface FloatingActionBarProps {
  selectedIds: Set<string>
  effectiveTab: ViewContextKey
  notes: Note[]
  onClearSelection: () => void
}

/* ── Divider ──────────────────────────────────────────── */

function Divider() {
  return <div className="h-7 w-px bg-border mx-1.5" />
}

/* ── FloatingActionBar ────────────────────────────────── */

export function FloatingActionBar({
  selectedIds,
  effectiveTab,
  notes,
  onClearSelection,
}: FloatingActionBarProps) {
  const batchUpdateNotes = usePlotStore((s) => s.batchUpdateNotes)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermanent = usePlotStore((s) => s.promoteToPermanent)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)
  const batchSetReminder = usePlotStore((s) => s.batchSetReminder)
  const toggleTrash = usePlotStore((s) => s.toggleTrash)
  const deleteNote = usePlotStore((s) => s.deleteNote)

  const ids = useMemo(() => Array.from(selectedIds), [selectedIds])
  const count = ids.length

  const addWikiLink = usePlotStore((s) => s.addWikiLink)
  const setMergePickerOpen = usePlotStore((s) => s.setMergePickerOpen)

  /* ── Merge ── */
  const [mergeOpen, setMergeOpen] = useState(false)
  /* ── Link ── */
  const [linkOpen, setLinkOpen] = useState(false)

  const selectedNotes = useMemo(
    () => notes.filter((n) => selectedIds.has(n.id)),
    [notes, selectedIds],
  )

  /* ── Batch handlers ──────────────────────────────────── */

  const handleStatusChange = (status: NoteStatus) => {
    const prevStatuses = ids.map((id) => {
      const n = notes.find((n) => n.id === id)
      return { id, status: n?.status ?? "inbox" as NoteStatus }
    })
    batchUpdateNotes(ids, { status })
    pushUndo(`Status → ${status}`, () => {
      prevStatuses.forEach(({ id, status: prev }) => batchUpdateNotes([id], { status: prev }))
    })
    toast(`Updated status for ${count} note${count > 1 ? "s" : ""}`)
  }

  const handlePriorityChange = (priority: NotePriority) => {
    const prevPriorities = ids.map((id) => {
      const n = notes.find((n) => n.id === id)
      return { id, priority: n?.priority ?? "none" as NotePriority }
    })
    batchUpdateNotes(ids, { priority })
    pushUndo(`Priority → ${priority}`, () => {
      prevPriorities.forEach(({ id, priority: prev }) => batchUpdateNotes([id], { priority: prev }))
    })
    toast(`Updated priority for ${count} note${count > 1 ? "s" : ""}`)
  }

  const handleKeepAll = () => {
    ids.forEach((id) => triageKeep(id))
    onClearSelection()
    pushUndo(`Triage ${count} to Capture`, () => ids.forEach((id) => moveBackToInbox(id)))
    toast(`Moved ${count} note${count > 1 ? "s" : ""} to Capture`, {
      action: { label: "Undo", onClick: () => ids.forEach((id) => moveBackToInbox(id)) },
      duration: 5000,
    })
  }

  const handleTrashAll = () => {
    ids.forEach((id) => triageTrash(id))
    onClearSelection()
    pushUndo(`Trash ${count} note${count > 1 ? "s" : ""}`, () => ids.forEach((id) => toggleTrash(id)))
    toast(`Trashed ${count} note${count > 1 ? "s" : ""}`, {
      duration: 5000,
    })
  }

  const handlePromoteAll = () => {
    ids.forEach((id) => promoteToPermanent(id))
    onClearSelection()
    pushUndo(`Promote ${count} to Permanent`, () => ids.forEach((id) => undoPromote(id)))
    toast(`Promoted ${count} note${count > 1 ? "s" : ""} to Permanent`, {
      action: { label: "Undo", onClick: () => ids.forEach((id) => undoPromote(id)) },
      duration: 5000,
    })
  }

  const handleDemoteAll = () => {
    ids.forEach((id) => undoPromote(id))
    onClearSelection()
    pushUndo(`Demote ${count} to Capture`, () => ids.forEach((id) => promoteToPermanent(id)))
    toast(`Demoted ${count} note${count > 1 ? "s" : ""} to Capture`, {
      duration: 5000,
    })
  }

  const handleMoveBackAll = () => {
    ids.forEach((id) => moveBackToInbox(id))
    onClearSelection()
    pushUndo(`Move ${count} back to Inbox`, () => ids.forEach((id) => triageKeep(id)))
    toast(`Moved ${count} note${count > 1 ? "s" : ""} back to Inbox`, {
      duration: 5000,
    })
  }

  const handleRemind = (isoDate: string) => {
    batchSetReminder(ids, isoDate)
    pushUndo(`Set reminder for ${count} note${count > 1 ? "s" : ""}`, () => batchSetReminder(ids, ""))
    toast(`Reminder set for ${count} note${count > 1 ? "s" : ""}`)
  }

  const handleRestoreAll = () => {
    ids.forEach((id) => toggleTrash(id))
    onClearSelection()
    pushUndo(`Restore ${count} note${count > 1 ? "s" : ""}`, () => ids.forEach((id) => toggleTrash(id)))
    toast(`Restored ${count} note${count > 1 ? "s" : ""}`, { duration: 5000 })
  }

  const handleDeletePermanently = () => {
    ids.forEach((id) => deleteNote(id))
    onClearSelection()
    toast(`Permanently deleted ${count} note${count > 1 ? "s" : ""}`, { duration: 5000 })
  }

  /* ── Workflow buttons (conditional on tab) ───────────── */

  const renderWorkflowButtons = () => {
    switch (effectiveTab) {
      case "trash":
        return (
          <>
            <button
              onClick={handleRestoreAll}
              className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-3 py-2 text-ui font-medium text-accent hover:bg-accent/20 transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> Restore
            </button>
            <button
              onClick={handleDeletePermanently}
              className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-2 text-ui font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </>
        )

      case "inbox":
        return (
          <>
            <button
              onClick={handleKeepAll}
              className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-3 py-2 text-ui font-medium text-accent hover:bg-accent/20 transition-colors"
            >
              <Check className="h-4 w-4" /> Done
            </button>
            <button
              onClick={handleTrashAll}
              className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-2 text-ui font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Trash
            </button>
          </>
        )

      case "capture":
        return (
          <>
            <button
              onClick={handlePromoteAll}
              className="inline-flex items-center gap-1 rounded-md bg-chart-5/10 px-3 py-2 text-ui font-medium text-chart-5 hover:bg-chart-5/20 transition-colors"
            >
              <ArrowUpRight className="h-4 w-4" /> Promote
            </button>
            <button
              onClick={handleMoveBackAll}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-ui font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              <Inbox className="h-4 w-4" /> Back to Inbox
            </button>
          </>
        )

      case "permanent":
        return (
          <button
            onClick={handleDemoteAll}
            className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-ui font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            <ArrowDownLeft className="h-4 w-4" /> Demote
          </button>
        )

      case "all":
      case "unlinked": {
        const hasInbox = selectedNotes.some((n) => n.status === "inbox")
        const hasCapture = selectedNotes.some((n) => n.status === "capture")
        const hasPermanent = selectedNotes.some((n) => n.status === "permanent")
        return (
          <>
            {hasInbox && (
              <>
                <button
                  onClick={handleKeepAll}
                  className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-3 py-2 text-ui font-medium text-accent hover:bg-accent/20 transition-colors"
                >
                  <Check className="h-4 w-4" /> Done
                </button>
                <button
                  onClick={handleTrashAll}
                  className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-2 text-ui font-medium text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Trash
                </button>
              </>
            )}
            {hasCapture && (
              <button
                onClick={handlePromoteAll}
                className="inline-flex items-center gap-1 rounded-md bg-chart-5/10 px-3 py-2 text-ui font-medium text-chart-5 hover:bg-chart-5/20 transition-colors"
              >
                <ArrowUpRight className="h-4 w-4" /> Promote
              </button>
            )}
            {hasPermanent && (
              <button
                onClick={handleDemoteAll}
                className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-ui font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                <ArrowDownLeft className="h-4 w-4" /> Demote
              </button>
            )}
          </>
        )
      }

      default:
        return null
    }
  }

  const workflowContent = renderWorkflowButtons()

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 rounded-xl border border-border bg-card shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-1 px-4 py-2.5">
        {/* Selection info */}
        <div className="flex items-center gap-1.5 px-1.5">
          <Zap className="h-4 w-4 text-accent" />
          <span className="text-ui font-medium text-foreground whitespace-nowrap">
            {count} selected
          </span>
          <button
            onClick={onClearSelection}
            className="rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {effectiveTab === "trash" ? (
          <>
            <Divider />
            <div className="flex items-center gap-1">
              {workflowContent}
            </div>
          </>
        ) : (
          <>
            <Divider />

            {/* Status */}
            <div onClick={(e) => e.stopPropagation()}>
              <StatusDropdown
                value={selectedNotes[0]?.status ?? "inbox"}
                onChange={handleStatusChange}
                variant="inline"
              />
            </div>

            {/* Priority */}
            <div onClick={(e) => e.stopPropagation()}>
              <PriorityDropdown
                value={selectedNotes[0]?.priority ?? "none"}
                onChange={handlePriorityChange}
                variant="inline"
              />
            </div>

            {/* Workflow buttons (if any) */}
            {workflowContent && (
              <>
                <Divider />
                <div className="flex items-center gap-1">
                  {workflowContent}
                </div>
              </>
            )}

            {/* Merge */}
            <Divider />
            <button
              onClick={() => {
                if (count === 1) {
                  setMergePickerOpen(true, ids[0])
                } else {
                  setMergeOpen(true)
                }
              }}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-ui font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Merge className="h-4 w-4" /> Merge
            </button>

            {/* Link */}
            <Divider />
            <button
              onClick={() => setLinkOpen(true)}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-ui font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Link2 className="h-4 w-4" /> Link
            </button>

            {/* Remind */}
            <Divider />
            <RemindPicker onSelect={handleRemind} align="center" />
          </>
        )}
      </div>

      {/* Merge Dialog */}
      {mergeOpen && (
        <MergeDialog
          open={mergeOpen}
          onOpenChange={setMergeOpen}
          noteIds={ids}
          onComplete={() => {
            setMergeOpen(false)
            onClearSelection()
          }}
        />
      )}

      {/* Link Dialog */}
      <NotePickerDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        title="Link to..."
        excludeIds={ids}
        onSelect={(targetId) => {
          const targetNote = notes.find((n) => n.id === targetId)
          if (!targetNote) return
          const targetTitle = targetNote.title || "Untitled"
          ids.forEach((id) => addWikiLink(id, targetTitle))
          setLinkOpen(false)
          toast.success(
            count === 1
              ? `Linked to "${targetTitle}"`
              : `Linked ${count} notes to "${targetTitle}"`,
          )
        }}
      />
    </div>
  )
}
