"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import {
  getInboxNotes,
  computeInboxRank,
  computeReadyScore,
  getReviewQueue,
  getSnoozeTime,
} from "@/lib/queries/notes"
import type { ReviewItem } from "@/lib/queries/notes"
import { computeAlerts, ALERT_TYPE_CONFIG } from "@/lib/alerts"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { NoteDetailPanel } from "@/components/note-detail-panel"
import { FloatingActionBar } from "@/components/floating-action-bar"
import { RemindPicker } from "@/components/remind-picker"
import { PriorityBadge } from "@/components/note-fields"
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
  ChevronRight,
  ChevronDown,
  Zap,
  FileText,
  AlertCircle,
  Bell,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import type { Note, Alert } from "@/lib/types"

/* ── Collapsible Section ───────────────────────────────── */

function InboxSection({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string
  count: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        className="flex w-full items-center gap-2 px-5 py-2 text-left hover:bg-secondary/20 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="text-[13px] font-medium text-foreground">{title}</span>
        <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-accent">
          {count}
        </span>
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

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
  const srsStateByNoteId = usePlotStore((s) => s.srsStateByNoteId)
  const dismissedAlertIds = usePlotStore((s) => s.dismissedAlertIds)
  const dismissAlert = usePlotStore((s) => s.dismissAlert)

  const backlinks = useBacklinksIndex()

  const [previewId, setPreviewId] = useState<string | null>(null)

  const inboxNotes = useMemo(() => getInboxNotes(notes, backlinks), [notes, backlinks])

  const reviewQueue = useMemo(
    () => getReviewQueue(notes, backlinks, srsStateByNoteId),
    [notes, backlinks, srsStateByNoteId]
  )

  const alerts = useMemo(() => {
    const dismissed = new Set(dismissedAlertIds ?? [])
    return computeAlerts(notes, srsStateByNoteId, dismissed)
  }, [notes, srsStateByNoteId, dismissedAlertIds])

  const totalCount = inboxNotes.length + reviewQueue.length + alerts.length

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
        <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-foreground">Inbox</h1>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[12px] font-medium tabular-nums text-accent">
              {totalCount}
            </span>
          </div>
          <button
            className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[14px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            onClick={() => createNote({ status: "inbox" })}
          >
            + New
          </button>
        </header>

        {/* Content */}
        {totalCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Inbox className="mb-4 h-12 w-12 text-muted-foreground/20" />
            <p className="text-[15px] text-muted-foreground">Inbox zero</p>
            <p className="mt-1 text-[14px] text-muted-foreground/60">
              All notes have been triaged. Create a new note to get started.
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
            {/* Section 1: Triage */}
            <InboxSection title="Triage" count={inboxNotes.length}>
              {inboxNotes.length === 0 ? (
                <div className="px-5 py-4 text-[13px] text-muted-foreground/60">
                  All triaged
                </div>
              ) : (
                inboxNotes.map((note) => (
                  <InboxRow
                    key={note.id}
                    note={note}
                    isActive={previewId === note.id}
                    backlinks={backlinks}
                    onClick={() => setPreviewId(note.id)}
                    onDoubleClick={() => openNote(note.id)}
                  />
                ))
              )}
            </InboxSection>

            {/* Section 2: Review */}
            <InboxSection title="Review" count={reviewQueue.length}>
              {reviewQueue.length === 0 ? (
                <div className="px-5 py-4 text-[13px] text-muted-foreground/60">
                  No reviews pending
                </div>
              ) : (
                reviewQueue.map((item) => (
                  <ReviewRow
                    key={`${item.note.id}-${item.reason}`}
                    item={item}
                    backlinks={backlinks}
                    isActive={previewId === item.note.id}
                    onClick={() => setPreviewId(item.note.id)}
                    onDoubleClick={() => openNote(item.note.id)}
                  />
                ))
              )}
            </InboxSection>

            {/* Section 3: Alerts */}
            <InboxSection title="Alerts" count={alerts.length}>
              {alerts.length === 0 ? (
                <div className="px-5 py-4 text-[13px] text-muted-foreground/60">
                  No alerts
                </div>
              ) : (
                alerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    isActive={previewId === alert.noteId}
                    onClick={() => setPreviewId(alert.noteId)}
                    onDismiss={() => dismissAlert(alert.id)}
                  />
                ))
              )}
            </InboxSection>
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
      className={`group flex items-center px-5 py-2.5 transition-colors cursor-pointer ${
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
            <span className={`flex items-center gap-0.5 text-[12px] tabular-nums font-medium ${
              rank >= 15 ? "text-accent" : rank >= 10 ? "text-muted-foreground" : "text-muted-foreground/50"
            }`}>
              <Zap className="h-2.5 w-2.5" />
              {rank}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[12px]">Inbox rank: {rank}</TooltipContent>
        </Tooltip>
      </div>

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

/* ── Review Row ────────────────────────────────────────── */

const REVIEW_REASON_LABELS: Record<string, string> = {
  "inbox-untriaged": "Untriaged inbox note",
  "snoozed-due": "Snooze expired",
  "stale-capture": "Stale capture",
  "unlinked-permanent": "Unlinked permanent",
  "srs-due": "SRS review due",
  "remind-due": "Reminder due",
}

function ReviewRow({
  item,
  backlinks,
  isActive,
  onClick,
  onDoubleClick,
}: {
  item: ReviewItem
  backlinks: Map<string, number>
  isActive: boolean
  onClick: () => void
  onDoubleClick: () => void
}) {
  const { note, reason } = item

  const score = useMemo(() => {
    if (note.status === "inbox") return computeInboxRank(note, backlinks)
    if (note.status === "capture") return computeReadyScore(note, backlinks)
    return backlinks.get(note.id) ?? 0
  }, [note, backlinks])

  const reviewAt = note.reviewAt ? new Date(note.reviewAt) : null

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
      {/* Priority */}
      <div className="w-7 shrink-0 flex justify-center">
        <PriorityBadge priority={note.priority} />
      </div>

      {/* Score indicator */}
      <div className="w-8 shrink-0 flex justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`flex items-center gap-0.5 text-[12px] tabular-nums font-medium ${
              score >= 5 ? "text-chart-5" : score >= 2 ? "text-muted-foreground" : "text-muted-foreground/50"
            }`}>
              <FileText className="h-2.5 w-2.5" />
              {score}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[12px]">Score: {score}</TooltipContent>
        </Tooltip>
      </div>

      {/* Title + reason */}
      <div className="flex flex-1 flex-col min-w-0 pr-3">
        <span className="truncate text-[15px] text-foreground">
          {note.title || "Untitled"}
        </span>
        <span className="truncate text-[12px] text-muted-foreground/70">
          {REVIEW_REASON_LABELS[reason] ?? reason}
        </span>
      </div>

      {/* Due date */}
      {reviewAt && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0 text-[12px] tabular-nums text-chart-3 cursor-default">
              {format(reviewAt, "MMM d")}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[12px]">
            Due {format(reviewAt, "MMM d, yyyy 'at' h:mm a")}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

/* ── Alert Row ─────────────────────────────────────────── */

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-chart-2",
  warning: "bg-chart-3",
  urgent: "bg-destructive",
}

function AlertRow({
  alert,
  isActive,
  onClick,
  onDismiss,
}: {
  alert: Alert
  isActive: boolean
  onClick: () => void
  onDismiss: () => void
}) {
  const config = ALERT_TYPE_CONFIG[alert.type]

  return (
    <div
      className={`group flex items-center px-5 py-2.5 transition-colors cursor-pointer ${
        isActive
          ? "bg-accent/8 border-l-2 border-l-accent"
          : "hover:bg-secondary/30"
      }`}
      onClick={onClick}
    >
      {/* Severity dot */}
      <div className="w-7 shrink-0 flex justify-center">
        <span className={`h-2 w-2 rounded-full shrink-0 ${SEVERITY_DOT[alert.severity] ?? "bg-muted-foreground"}`} />
      </div>

      {/* Message + badge */}
      <div className="flex flex-1 items-center gap-2 min-w-0 pr-2">
        <span className="truncate text-[14px] text-foreground">{alert.message}</span>
        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${config?.badgeClass ?? "bg-muted text-muted-foreground"}`}>
          {config?.label ?? alert.type}
        </span>
      </div>

      {/* Dismiss button */}
      <button
        className="shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation()
          onDismiss()
        }}
        aria-label="Dismiss alert"
      >
        <X className="h-3.5 w-3.5" />
      </button>
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
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-chart-5/10 px-3 py-2 text-[14px] font-medium text-chart-5 transition-colors hover:bg-chart-5/20"
                >
                  <Check className="h-4 w-4" />
                  Keep
                  <kbd className="ml-1 rounded border border-chart-5/20 px-1 py-0.5 font-mono text-[9px]">K</kbd>
                </button>
              </TooltipTrigger>
              <TooltipContent>Move to Capture, review in 3 days</TooltipContent>
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
                  className="flex items-center justify-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-[14px] font-medium text-destructive transition-colors hover:bg-destructive/20"
                >
                  <Trash2 className="h-4 w-4" />
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
