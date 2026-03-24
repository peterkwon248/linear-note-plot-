"use client"

import { useMemo, useState, useCallback } from "react"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { StatusDropdown, PriorityDropdown } from "@/components/note-fields"
import { RemindPicker } from "@/components/remind-picker"
import { NotePickerDialog } from "@/components/note-picker-dialog"
import type { ViewContextKey } from "@/lib/view-engine/types"
import type { Note, NoteStatus, NotePriority } from "@/lib/types"
import { MergeDialog } from "@/components/merge-dialog"
import { WikiAssemblyDialog } from "@/components/wiki-assembly-dialog"
import { pushUndo } from "@/lib/undo-manager"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight"
import { ArrowDownLeft } from "@phosphor-icons/react/dist/ssr/ArrowDownLeft"
import { Tray } from "@phosphor-icons/react/dist/ssr/Tray"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"

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

  /* ── GitMerge ── */
  const [mergeOpen, setMergeOpen] = useState(false)
  /* ── Link ── */
  const [linkOpen, setLinkOpen] = useState(false)
  /* ── Wiki Assembly ── */
  const [wikiAssemblyOpen, setWikiAssemblyOpen] = useState(false)

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
    }, () => batchUpdateNotes(ids, { status }))
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
    }, () => batchUpdateNotes(ids, { priority }))
    toast(`Updated priority for ${count} note${count > 1 ? "s" : ""}`)
  }

  const handleKeepAll = () => {
    ids.forEach((id) => triageKeep(id))
    onClearSelection()
    pushUndo(`Triage ${count} to Capture`, () => ids.forEach((id) => moveBackToInbox(id)), () => ids.forEach((id) => triageKeep(id)))
    toast(`Moved ${count} note${count > 1 ? "s" : ""} to Capture`, {
      action: { label: "Undo", onClick: () => ids.forEach((id) => moveBackToInbox(id)) },
      duration: 5000,
    })
  }

  const handleTrashAll = () => {
    ids.forEach((id) => triageTrash(id))
    onClearSelection()
    pushUndo(`Trash ${count} note${count > 1 ? "s" : ""}`, () => ids.forEach((id) => toggleTrash(id)), () => ids.forEach((id) => triageTrash(id)))
    toast(`Trashed ${count} note${count > 1 ? "s" : ""}`, {
      duration: 5000,
    })
  }

  const handlePromoteAll = () => {
    ids.forEach((id) => promoteToPermanent(id))
    onClearSelection()
    pushUndo(`Promote ${count} to Permanent`, () => ids.forEach((id) => undoPromote(id)), () => ids.forEach((id) => promoteToPermanent(id)))
    toast(`Promoted ${count} note${count > 1 ? "s" : ""} to Permanent`, {
      action: { label: "Undo", onClick: () => ids.forEach((id) => undoPromote(id)) },
      duration: 5000,
    })
  }

  const handleDemoteAll = () => {
    ids.forEach((id) => undoPromote(id))
    onClearSelection()
    pushUndo(`Demote ${count} to Capture`, () => ids.forEach((id) => promoteToPermanent(id)), () => ids.forEach((id) => undoPromote(id)))
    toast(`Demoted ${count} note${count > 1 ? "s" : ""} to Capture`, {
      duration: 5000,
    })
  }

  const handleMoveBackAll = () => {
    ids.forEach((id) => moveBackToInbox(id))
    onClearSelection()
    pushUndo(`Move ${count} back to Tray`, () => ids.forEach((id) => triageKeep(id)), () => ids.forEach((id) => moveBackToInbox(id)))
    toast(`Moved ${count} note${count > 1 ? "s" : ""} back to Tray`, {
      duration: 5000,
    })
  }

  const handleRemind = (isoDate: string) => {
    batchSetReminder(ids, isoDate)
    pushUndo(`Set reminder for ${count} note${count > 1 ? "s" : ""}`, () => batchSetReminder(ids, ""), () => batchSetReminder(ids, isoDate))
    toast(`Reminder set for ${count} note${count > 1 ? "s" : ""}`)
  }

  const handleRestoreAll = () => {
    ids.forEach((id) => toggleTrash(id))
    onClearSelection()
    pushUndo(`Restore ${count} note${count > 1 ? "s" : ""}`, () => ids.forEach((id) => toggleTrash(id)), () => ids.forEach((id) => toggleTrash(id)))
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
              <ArrowCounterClockwise size={16} weight="regular" /> Restore
            </button>
            <button
              onClick={handleDeletePermanently}
              className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-2 text-ui font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash size={16} weight="regular" /> Delete
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
              <PhCheck size={16} weight="bold" /> Done
            </button>
            <button
              onClick={handleTrashAll}
              className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-2 text-ui font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash size={16} weight="regular" /> Trash
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
              <ArrowUpRight size={16} weight="regular" /> Promote
            </button>
            <button
              onClick={handleMoveBackAll}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-ui font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              <Tray size={16} weight="regular" /> Back to Tray
            </button>
          </>
        )

      case "permanent":
        return (
          <button
            onClick={handleDemoteAll}
            className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-ui font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            <ArrowDownLeft size={16} weight="regular" /> Demote
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
                  <PhCheck size={16} weight="bold" /> Done
                </button>
                <button
                  onClick={handleTrashAll}
                  className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-2 text-ui font-medium text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <Trash size={16} weight="regular" /> Trash
                </button>
              </>
            )}
            {hasCapture && (
              <button
                onClick={handlePromoteAll}
                className="inline-flex items-center gap-1 rounded-md bg-chart-5/10 px-3 py-2 text-ui font-medium text-chart-5 hover:bg-chart-5/20 transition-colors"
              >
                <ArrowUpRight size={16} weight="regular" /> Promote
              </button>
            )}
            {hasPermanent && (
              <button
                onClick={handleDemoteAll}
                className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-ui font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                <ArrowDownLeft size={16} weight="regular" /> Demote
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
          <Lightning className="text-accent" size={16} weight="regular" />
          <span className="text-ui font-medium text-foreground whitespace-nowrap">
            {count} selected
          </span>
          <button
            onClick={onClearSelection}
            className="rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <PhX size={16} weight="regular" />
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

            {/* GitMerge */}
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
              <GitMerge size={16} weight="regular" /> GitMerge
            </button>

            {/* Wiki Assembly */}
            <button
              onClick={() => setWikiAssemblyOpen(true)}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-ui font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <BookOpen size={16} weight="regular" /> Wiki
            </button>

            {/* Link */}
            <Divider />
            <button
              onClick={() => setLinkOpen(true)}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-3 py-2 text-ui font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <PhLink size={16} weight="regular" /> Link
            </button>

            {/* Remind */}
            <Divider />
            <RemindPicker onSelect={handleRemind} align="center" />
          </>
        )}
      </div>

      {/* GitMerge Dialog */}
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

      {/* Wiki Assembly Dialog */}
      {wikiAssemblyOpen && (
        <WikiAssemblyDialog
          open={wikiAssemblyOpen}
          onOpenChange={setWikiAssemblyOpen}
          noteIds={ids}
          onComplete={() => {
            setWikiAssemblyOpen(false)
            onClearSelection()
          }}
        />
      )}
    </div>
  )
}
