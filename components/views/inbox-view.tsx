"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import {
  getInboxNotes,
  getSnoozeTime,
} from "@/lib/queries/notes"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { NoteDetailPanel } from "@/components/note-detail-panel"
import { FloatingActionBar } from "@/components/floating-action-bar"
import { RemindPicker } from "@/components/remind-picker"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Inbox,
  Check,
  Clock,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import type { Note } from "@/lib/types"

/* ── InboxView ─────────────────────────────────────────── */

export function InboxView() {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const createNote = usePlotStore((s) => s.createNote)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)

  const backlinks = useBacklinksIndex()

  const [previewId, setPreviewId] = useState<string | null>(null)

  const inboxNotes = useMemo(() => getInboxNotes(notes, backlinks), [notes, backlinks])

  // Navigate to next inbox item after triage action
  const goNext = useCallback(
    (currentId: string) => {
      const idx = inboxNotes.findIndex((n) => n.id === currentId)
      const next = inboxNotes[idx + 1] ?? inboxNotes[idx - 1] ?? null
      setPreviewId(next?.id ?? null)
    },
    [inboxNotes]
  )

  const handleDone = useCallback(
    (id: string) => {
      triageKeep(id)
      toast("Done — moved to Capture")
      goNext(id)
    },
    [triageKeep, goNext]
  )

  const handleSnooze = useCallback(
    (id: string, reviewAt: string) => {
      triageSnooze(id, reviewAt)
      toast("Snoozed", { description: "Note will reappear later." })
      goNext(id)
    },
    [triageSnooze, goNext]
  )

  const handleTrash = useCallback(
    (id: string) => {
      triageTrash(id)
      toast("Trashed", { description: "Note moved to trash." })
      goNext(id)
    },
    [triageTrash, goNext]
  )

  // Keyboard shortcuts (K, S, T) when preview is active
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!previewId) return
      const target = e.target as HTMLElement
      if (target.closest("input") || target.closest("textarea") || target.closest("[role='dialog']")) return

      const note = notes.find((n) => n.id === previewId)
      if (!note || note.status !== "inbox" || note.triageStatus === "trashed") return

      switch (e.key.toLowerCase()) {
        case "d":
          e.preventDefault()
          handleDone(previewId)
          break
        case "s":
          e.preventDefault()
          handleSnooze(previewId, getSnoozeTime("tomorrow"))
          break
        case "t":
          e.preventDefault()
          handleTrash(previewId)
          break
        case "escape":
          if (!target.closest("[data-radix-popper-content-wrapper]")) {
            setPreviewId(null)
          }
          break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [previewId, notes, handleDone, handleSnooze, handleTrash])

  // Full editor mode
  if (selectedNoteId) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <NoteEditor />
        <NoteInspector />
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-foreground">Inbox</h1>
            {inboxNotes.length > 0 && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[12px] font-medium tabular-nums text-accent">
                {inboxNotes.length}
              </span>
            )}
          </div>
          <button
            className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[14px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            onClick={() => createNote({ status: "inbox" })}
          >
            + New
          </button>
        </header>

        {/* Content */}
        {inboxNotes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Inbox className="mb-4 h-12 w-12 text-muted-foreground/20" />
            <p className="text-[15px] text-muted-foreground">Inbox zero — all caught up</p>
            <p className="mt-1 text-[14px] text-muted-foreground/60">
              Create a new note to get started.
            </p>
            <button
              onClick={() => createNote({ status: "inbox" })}
              className="mt-4 rounded-md bg-accent px-3 py-1.5 text-[14px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            >
              New note
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {inboxNotes.map((note) => (
              <InboxRow
                key={note.id}
                note={note}
                isActive={previewId === note.id}
                onClick={() => setPreviewId(note.id)}
                onDoubleClick={() => openNote(note.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Detail panel with triage bar */}
      {previewId && (
        <InboxDetailPanel
          noteId={previewId}
          onClose={() => setPreviewId(null)}
          onOpenNote={(id) => setPreviewId(id)}
          onEditNote={() => {
            openNote(previewId)
            setPreviewId(null)
          }}
          onDone={handleDone}
          onSnooze={handleSnooze}
          onTrash={handleTrash}
        />
      )}

      {/* Floating action bar */}
      {previewId && (
        <FloatingActionBar
          selectedIds={new Set([previewId])}
          effectiveTab="inbox"
          notes={notes}
          onClearSelection={() => setPreviewId(null)}
        />
      )}
    </div>
  )
}

/* ── Inbox Row ─────────────────────────────────────────── */

function InboxRow({
  note,
  isActive,
  onClick,
  onDoubleClick,
}: {
  note: Note
  isActive: boolean
  onClick: () => void
  onDoubleClick: () => void
}) {
  const isSnoozed = note.triageStatus === "snoozed"

  return (
    <div
      className={`group flex items-center px-5 py-2.5 transition-colors cursor-pointer ${
        isActive
          ? "bg-accent/8 border-l-2 border-l-accent"
          : "hover:bg-secondary/30"
      }`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Title */}
      <div className="flex flex-1 items-center gap-2 min-w-0 pr-3">
        <span className="truncate text-[15px] text-foreground">
          {note.title || "Untitled"}
        </span>
        {isSnoozed && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-chart-3/10 px-1.5 py-0.5 text-[11px] font-medium text-chart-3">
            <Clock className="h-2.5 w-2.5" />
            Snoozed
          </span>
        )}
        {note.source && note.source !== "manual" && (
          <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
            {note.source}
          </span>
        )}
      </div>

      {/* Date */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="shrink-0 text-[14px] tabular-nums text-muted-foreground cursor-default">
            {format(new Date(note.createdAt), "MMM d")}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[12px]">
          {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

/* ── Inbox Detail Panel (with Triage Bar) ──────────────── */

function InboxDetailPanel({
  noteId,
  onClose,
  onOpenNote,
  onEditNote,
  onDone,
  onSnooze,
  onTrash,
}: {
  noteId: string
  onClose: () => void
  onOpenNote: (id: string) => void
  onEditNote: () => void
  onDone: (id: string) => void
  onSnooze: (id: string, reviewAt: string) => void
  onTrash: (id: string) => void
}) {
  const notes = usePlotStore((s) => s.notes)
  const note = notes.find((n) => n.id === noteId)

  if (!note) return null

  const showTriageBar =
    note.status === "inbox" && note.triageStatus !== "trashed"

  return (
    <aside className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-l border-border bg-card animate-in slide-in-from-right-4 fade-in duration-200">
      <NoteDetailPanel
        noteId={noteId}
        onClose={onClose}
        onOpenNote={onOpenNote}
        onEditNote={onEditNote}
        embedded
      />

      {/* Triage Bar */}
      {showTriageBar && (
        <div className="shrink-0 border-t border-border bg-secondary/30 px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Done */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDone(noteId)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-chart-5/10 px-3 py-2 text-[14px] font-medium text-chart-5 transition-colors hover:bg-chart-5/20"
                >
                  <Check className="h-4 w-4" />
                  Done
                  <kbd className="ml-1 rounded border border-chart-5/20 px-1 py-0.5 font-mono text-[9px]">D</kbd>
                </button>
              </TooltipTrigger>
              <TooltipContent>Move to Capture</TooltipContent>
            </Tooltip>

            {/* Snooze */}
            <RemindPicker
              onSelect={(date) => onSnooze(noteId, date)}
              triggerContent={
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-chart-3/10 px-3 py-2 text-[14px] font-medium text-chart-3 transition-colors hover:bg-chart-3/20">
                  <Clock className="h-4 w-4" />
                  Snooze
                  <kbd className="ml-1 rounded border border-chart-3/20 px-1 py-0.5 font-mono text-[9px]">S</kbd>
                </button>
              }
              align="center"
            />

            {/* Trash */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTrash(noteId)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-[14px] font-medium text-destructive transition-colors hover:bg-destructive/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Trash
                  <kbd className="ml-1 rounded border border-destructive/20 px-1 py-0.5 font-mono text-[9px]">T</kbd>
                </button>
              </TooltipTrigger>
              <TooltipContent>Soft delete this note</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </aside>
  )
}
