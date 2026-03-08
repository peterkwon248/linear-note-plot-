"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { getInboxNotes, computeInboxRank, getSnoozeTime } from "@/lib/queries/notes"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { NoteDetailPanel } from "@/components/note-detail-panel"
import { PriorityBadge } from "@/components/note-fields"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Inbox,
  Check,
  Clock,
  Trash2,
  ChevronRight,
  Zap,
  FileText,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import type { Note } from "@/lib/types"

/* ── InboxPage ─────────────────────────────────────────── */

export default function InboxPage() {
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

  const handleKeep = useCallback(
    (id: string) => {
      triageKeep(id)
      toast("Moved to Capture", { description: "Note kept for further processing." })
      goNext(id)
    },
    [triageKeep, goNext]
  )

  const handleSnooze = useCallback(
    (id: string, option: "3h" | "tomorrow" | "next-week") => {
      triageSnooze(id, getSnoozeTime(option))
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

  // Keyboard shortcuts (K, S, X) when preview is active
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!previewId) return
      const target = e.target as HTMLElement
      if (target.closest("input") || target.closest("textarea") || target.closest("[role='dialog']")) return

      const note = notes.find((n) => n.id === previewId)
      if (!note || note.status !== "inbox" || note.triageStatus === "trashed") return

      switch (e.key.toLowerCase()) {
        case "k":
          e.preventDefault()
          handleKeep(previewId)
          break
        case "s":
          e.preventDefault()
          handleSnooze(previewId, "tomorrow")
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
  }, [previewId, notes, handleKeep, handleSnooze, handleTrash])

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
        {/* Title */}
        <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-foreground">Inbox</h1>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-accent">
              {inboxNotes.length}
            </span>
          </div>
          <button
            className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            onClick={() => createNote({ status: "inbox" })}
          >
            + New
          </button>
        </header>

        {/* Workflow hint */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-2">
          <span className="text-[11px] text-muted-foreground">
            Triage notes: <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[10px]">K</kbd> Keep <kbd className="ml-2 rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[10px]">S</kbd> Snooze <kbd className="ml-2 rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[10px]">T</kbd> Trash
          </span>
        </div>

        {/* Content */}
        {inboxNotes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Inbox className="mb-4 h-12 w-12 text-muted-foreground/20" />
            <p className="text-[13px] text-muted-foreground">Inbox zero</p>
            <p className="mt-1 text-[12px] text-muted-foreground/60">
              All notes have been triaged. Create a new note to get started.
            </p>
            <button
              onClick={() => createNote({ status: "inbox" })}
              className="mt-4 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
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
                backlinks={backlinks}
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
          onKeep={handleKeep}
          onSnooze={handleSnooze}
          onTrash={handleTrash}
        />
      )}
    </div>
  )
}

/* ── Inbox Row ─────────────────────────────────────────── */

function InboxRow({
  note,
  isActive,
  backlinks,
  onClick,
  onDoubleClick,
}: {
  note: Note
  isActive: boolean
  backlinks: Map<string, number>
  onClick: () => void
  onDoubleClick: () => void
}) {
  const rank = computeInboxRank(note, backlinks)
  const isSnoozed = note.triageStatus === "snoozed"

  return (
    <div
      className={`group flex items-center border-b border-border px-5 py-2.5 transition-colors cursor-pointer ${
        isActive
          ? "bg-accent/8 border-l-2 border-l-accent"
          : "hover:bg-secondary/30"
      }`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Priority */}
      <div className="w-7 shrink-0 flex justify-center">
        <PriorityBadge priority={note.priority} />
      </div>

      {/* Rank indicator */}
      <div className="w-8 shrink-0 flex justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`flex items-center gap-0.5 text-[11px] tabular-nums font-medium ${
              rank >= 15 ? "text-accent" : rank >= 10 ? "text-muted-foreground" : "text-muted-foreground/50"
            }`}>
              <Zap className="h-2.5 w-2.5" />
              {rank}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[11px]">Inbox rank: {rank}</TooltipContent>
        </Tooltip>
      </div>

      {/* Title */}
      <div className="flex flex-1 items-center gap-2 min-w-0 pr-3">
        <span className="truncate text-[13px] text-foreground">
          {note.title || "Untitled"}
        </span>
        {isSnoozed && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-chart-3/10 px-1.5 py-0.5 text-[10px] font-medium text-chart-3">
            <Clock className="h-2.5 w-2.5" />
            Snoozed
          </span>
        )}
        {note.source && note.source !== "manual" && (
          <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {note.source}
          </span>
        )}
      </div>

      {/* Date */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground cursor-default">
            {format(new Date(note.createdAt), "MMM d")}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[11px]">
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
  onKeep,
  onSnooze,
  onTrash,
}: {
  noteId: string
  onClose: () => void
  onOpenNote: (id: string) => void
  onEditNote: () => void
  onKeep: (id: string) => void
  onSnooze: (id: string, option: "3h" | "tomorrow" | "next-week") => void
  onTrash: (id: string) => void
}) {
  const notes = usePlotStore((s) => s.notes)
  const note = notes.find((n) => n.id === noteId)

  if (!note) return null

  const showTriageBar =
    note.status === "inbox" && note.triageStatus !== "trashed"

  return (
    <aside className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-l border-border bg-card animate-in slide-in-from-right-4 fade-in duration-200">
      {/* Scrollable detail content — re-renders NoteDetailPanel's internals */}
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
            {/* Keep */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onKeep(noteId)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-chart-5/10 px-3 py-2 text-[12px] font-medium text-chart-5 transition-colors hover:bg-chart-5/20"
                >
                  <Check className="h-3.5 w-3.5" />
                  Keep
                  <kbd className="ml-1 rounded border border-chart-5/20 px-1 py-0.5 font-mono text-[9px]">K</kbd>
                </button>
              </TooltipTrigger>
              <TooltipContent>Move to Capture, review in 3 days</TooltipContent>
            </Tooltip>

            {/* Snooze */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-chart-3/10 px-3 py-2 text-[12px] font-medium text-chart-3 transition-colors hover:bg-chart-3/20">
                      <Clock className="h-3.5 w-3.5" />
                      Snooze
                      <kbd className="ml-1 rounded border border-chart-3/20 px-1 py-0.5 font-mono text-[9px]">S</kbd>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Snooze and review later</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="center" className="w-44">
                <DropdownMenuItem onClick={() => onSnooze(noteId, "3h")}>
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[12px]">In 3 hours</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze(noteId, "tomorrow")}>
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[12px]">Tomorrow 10am</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze(noteId, "next-week")}>
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[12px]">Next week</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Trash */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTrash(noteId)}
                  className="flex items-center justify-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <kbd className="rounded border border-destructive/20 px-1 py-0.5 font-mono text-[9px]">T</kbd>
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
