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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Inbox,
  Check,
  Clock,
  Trash2,
  Plus,
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  Minus,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { shortRelative } from "@/lib/format-utils"
import { StatusBadge } from "@/components/note-fields"
import type { Note, Folder } from "@/lib/types"

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
  const folders = usePlotStore((s) => s.folders)

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
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="flex-1 flex flex-col">
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
                <>
                  {/* Column headers */}
                  <div className="sticky top-0 z-10 flex items-center border-b border-border bg-background px-5 py-2">
                    <span className="flex-1 min-w-0 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Name</span>
                    <span className="w-[100px] shrink-0 text-right text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Status</span>
                    <span className="w-[80px] shrink-0 text-center text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Folder</span>
                    <span className="w-[48px] shrink-0 text-center text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Links</span>
                    <span className="w-[48px] shrink-0 text-center text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Reads</span>
                    <span className="w-[64px] shrink-0 text-center text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Priority</span>
                    <span className="w-[72px] shrink-0 text-right text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Updated</span>
                    <span className="w-[72px] shrink-0 text-right text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Created</span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {inboxNotes.map((note) => (
                      <InboxRow
                        key={note.id}
                        note={note}
                        isActive={previewId === note.id}
                        onClick={() => setPreviewId(note.id)}
                        onDoubleClick={() => openNote(note.id)}
                        folders={folders}
                        links={backlinks.get(note.id) ?? 0}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem
              onClick={() => {
                const id = createNote({ status: "inbox" })
                openNote(id)
              }}
              className="text-[14px]"
            >
              <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
              New note
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
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
  folders,
  links,
}: {
  note: Note
  isActive: boolean
  onClick: () => void
  onDoubleClick: () => void
  folders: Folder[]
  links: number
}) {
  const isSnoozed = note.triageStatus === "snoozed"
  const labels = usePlotStore((s) => s.labels)
  const label = note.labelId ? labels.find((l) => l.id === note.labelId) : null

  return (
    <div
      className={`group flex items-center px-5 py-3 transition-colors cursor-pointer ${
        isActive
          ? "bg-accent/8 border-l-2 border-l-accent"
          : "hover:bg-secondary/20"
      }`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Name column */}
      <div className="flex flex-1 items-center gap-2.5 min-w-0 pr-3">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        <span className="truncate text-[15px] text-foreground">
          {note.title || "Untitled"}
        </span>
        {/* Label badge */}
        {label ? (
          <span
            className="shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: `${label.color}18`, color: label.color }}
          >
            {label.name}
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground/70 bg-muted/50">
            Memo
          </span>
        )}
        {/* Word count */}
        {note.preview.length > 0 && (
          <span
            className="shrink-0 text-[11px] tabular-nums font-medium"
            style={{ color: note.preview.length >= 80 ? "#45d483" : note.preview.length >= 30 ? "#60a5fa" : "#9ca3af" }}
          >
            {note.preview.length >= 120 ? "120+" : note.preview.length}
          </span>
        )}
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

      {/* Status */}
      <div className="w-[100px] shrink-0 flex items-center justify-end">
        <StatusBadge status={note.status} />
      </div>

      {/* Folder */}
      <div className="w-[80px] shrink-0 flex items-center justify-center">
        {note.folderId ? (() => {
          const folder = folders.find((f) => f.id === note.folderId)
          if (!folder) return <span className="text-[15px] text-muted-foreground/30">—</span>
          return <span className="text-[12px] text-muted-foreground truncate">{folder.name}</span>
        })() : (
          <span className="text-[15px] text-muted-foreground/30">—</span>
        )}
      </div>

      {/* Links */}
      <div className="w-[48px] shrink-0 text-center">
        <span className={`text-[15px] tabular-nums ${links === 0 ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
          {links}
        </span>
      </div>

      {/* Reads */}
      <div className="w-[48px] shrink-0 text-center">
        <span className={`text-[15px] tabular-nums ${note.reads === 0 ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
          {note.reads}
        </span>
      </div>

      {/* Priority */}
      <div className="w-[64px] shrink-0 flex justify-center">
        {note.priority === "urgent" && <ChevronsUp className="h-4 w-4 text-red-400" />}
        {note.priority === "high" && <ChevronUp className="h-4 w-4 text-orange-400" />}
        {note.priority === "medium" && <Minus className="h-4 w-4 text-yellow-400" />}
        {note.priority === "low" && <ChevronDown className="h-4 w-4 text-blue-400" />}
        {(!note.priority || note.priority === "none") && <span className="text-[14px] text-muted-foreground">—</span>}
      </div>

      {/* Updated */}
      <div className="w-[72px] shrink-0 text-right">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-[15px] tabular-nums text-muted-foreground cursor-default">
              {shortRelative(note.updatedAt)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[12px]">
            {format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Created */}
      <div className="w-[72px] shrink-0 text-right">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-[15px] tabular-nums text-muted-foreground cursor-default">
              {format(new Date(note.createdAt), "MMM d")}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[12px]">
            {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </TooltipContent>
        </Tooltip>
      </div>
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
