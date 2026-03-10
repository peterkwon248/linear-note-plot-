"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import {
  X,
  FileText,
  Calendar,
  Clock,
  Link2,
  Sparkles,
  ArrowRight,
  Bell,
  CircleDot,
  Signal,
  ExternalLink,
  Check,
  AlarmClock,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Inbox,
  Plus,
  Pencil,
  Archive as ArchiveIcon,
  RotateCcw,
  Merge,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"
import { StatusBadge, PriorityBadge } from "@/components/note-fields"
import { RemindPicker } from "@/components/remind-picker"
import { isReadyToPromote, needsReview, isStaleSuggest, getInboxNotes, getSnoozeTime } from "@/lib/queries/notes"
import { suggestBacklinks } from "@/lib/backlinks"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import type { Note } from "@/lib/types"

/* ── Section ───────────────────────────────────────────── */

function PanelSection({
  title,
  icon,
  count,
  children,
}: {
  title: string
  icon: React.ReactNode
  count?: number
  children: React.ReactNode
}) {
  return (
    <div className="px-5 py-3">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[12px] font-medium text-muted-foreground">
          {title}
        </span>
        {count !== undefined && (
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[11px] tabular-nums font-medium text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

/* ── Metadata row ──────────────────────────────────────── */

function MetaRow({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="flex items-center gap-2 text-[14px] text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-[14px] text-foreground">{children}</span>
    </div>
  )
}

/* ── Note link item ────────────────────────────────────── */

function NoteLink({
  note,
  onOpen,
}: {
  note: Note
  onOpen: (id: string) => void
}) {
  return (
    <button
      onClick={() => onOpen(note.id)}
      className="group/link flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary/50"
    >
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground/60" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[14px] text-foreground group-hover/link:text-accent">
          {note.title || "Untitled"}
        </span>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/0 transition-colors group-hover/link:text-muted-foreground" />
    </button>
  )
}

/* ── NoteDetailPanel ───────────────────────────────────── */

export function NoteDetailPanel({
  noteId,
  onClose,
  onOpenNote,
  onEditNote,
  onTriageAction,
  embedded = false,
}: {
  noteId: string
  onClose: () => void
  onOpenNote: (id: string) => void
  onEditNote: () => void
  onTriageAction?: () => void
  embedded?: boolean
}) {
  const notes = usePlotStore((s) => s.notes)
  const updateNote = usePlotStore((s) => s.updateNote)
  const triageKeep = usePlotStore((s) => s.triageKeep)
  const triageSnooze = usePlotStore((s) => s.triageSnooze)
  const triageTrash = usePlotStore((s) => s.triageTrash)
  const promoteToPermanent = usePlotStore((s) => s.promoteToPermanent)
  const undoPromote = usePlotStore((s) => s.undoPromote)
  const moveBackToInbox = usePlotStore((s) => s.moveBackToInbox)
  const addWikiLink = usePlotStore((s) => s.addWikiLink)
  const setReminder = usePlotStore((s) => s.setReminder)
  const clearReminder = usePlotStore((s) => s.clearReminder)
  const setMergePickerOpen = usePlotStore((s) => s.setMergePickerOpen)
  const setLinkPickerOpen = usePlotStore((s) => s.setLinkPickerOpen)

  const backlinksIndex = useBacklinksIndex()

  const note = notes.find((n) => n.id === noteId)

  const backlinks = useBacklinksFor(note?.id ?? null)

  const suggestions = useMemo(
    () => (note ? suggestBacklinks(noteId, notes, { limit: 10 }) : []),
    [noteId, notes, note]
  )

  const ready = useMemo(
    () => (note ? isReadyToPromote(note, backlinksIndex) : false),
    [note, backlinksIndex]
  )

  const stale = note ? needsReview(note) : false
  const staleSuggest = note ? isStaleSuggest(note) : false
  const linkCount = note ? (backlinksIndex.get(note.id) ?? 0) : 0

  // Days since note was created (for capture age nudge)
  const daysInCapture = note && note.status === "capture"
    ? Math.floor((Date.now() - new Date(note.createdAt).getTime()) / (24 * 60 * 60 * 1000))
    : 0
  // Show capture age nudge only when not already covered by staleSuggest (14d lastTouched check)
  const showCaptureAgeNudge = note?.status === "capture" && !staleSuggest && daysInCapture >= 14

  // Advance to next inbox note after triage action
  const advanceToNext = useCallback(() => {
    const inbox = getInboxNotes(notes, backlinksIndex)
    const next = inbox.find((n) => n.id !== noteId)
    if (next) onOpenNote(next.id)
    else onClose()
    onTriageAction?.()
  }, [notes, backlinksIndex, noteId, onOpenNote, onClose, onTriageAction])

  const handleDone = useCallback(() => {
    triageKeep(noteId)
    toast("Done — moved to Capture")
    advanceToNext()
  }, [triageKeep, noteId, advanceToNext])

  const handleSnooze = useCallback(
    (reviewAt: string) => {
      triageSnooze(noteId, reviewAt)
      toast("Snoozed")
      advanceToNext()
    },
    [triageSnooze, noteId, advanceToNext]
  )

  const handleTrash = useCallback(() => {
    triageTrash(noteId)
    toast("Trashed")
    advanceToNext()
  }, [triageTrash, noteId, advanceToNext])

  const handlePromote = useCallback(() => {
    promoteToPermanent(noteId)
    toast("Promoted to Permanent")
  }, [promoteToPermanent, noteId])

  const handleDemote = useCallback(() => {
    undoPromote(noteId)
    toast("Demoted to Capture")
  }, [undoPromote, noteId])

  const handleMoveBack = useCallback(() => {
    moveBackToInbox(noteId)
    toast("Moved back to Inbox")
  }, [moveBackToInbox, noteId])

  const handleLinkSuggestion = useCallback((targetTitle: string) => {
    addWikiLink(noteId, targetTitle)
    toast("Link added")
  }, [addWikiLink, noteId])

  // Keyboard shortcuts
  useEffect(() => {
    if (!note) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return
      if (target.closest("[role='dialog']") || target.closest("[data-radix-popper-content-wrapper]")) return

      if (note.status === "inbox" && note.triageStatus !== "trashed") {
        if (e.key === "d" || e.key === "D") { e.preventDefault(); handleDone() }
        if (e.key === "s" || e.key === "S") { e.preventDefault(); handleSnooze(getSnoozeTime("tomorrow")) }
        if (e.key === "t" || e.key === "T") { e.preventDefault(); handleTrash() }
      }
      if (note.status === "capture") {
        if (e.key === "p" || e.key === "P") { e.preventDefault(); handlePromote() }
        if (e.key === "b" || e.key === "B") { e.preventDefault(); handleMoveBack() }
      }
      if (note.status === "permanent") {
        if (e.key === "d" || e.key === "D") { e.preventDefault(); handleDemote() }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [note, handleDone, handleSnooze, handleTrash, handlePromote, handleDemote, handleMoveBack])

  if (!note) return null

  const preview = note.preview

  const Wrapper = embedded ? "div" : "aside"
  const wrapperClass = embedded
    ? "flex h-full flex-1 flex-col overflow-hidden bg-card"
    : "flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-l border-border bg-card animate-in slide-in-from-right-4 fade-in duration-200"

  return (
    <Wrapper className={wrapperClass}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-[15px] font-medium text-foreground truncate">
            Details
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEditNote}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Open in editor"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Stage-aware workflow action bar — hidden when embedded (parent provides its own triage bar) */}
      {!embedded && note.status === "inbox" && note.triageStatus !== "trashed" && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-secondary/20 px-4 py-2">
          <button
            onClick={handleDone}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[14px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
          >
            <Check className="h-3.5 w-3.5" />
            Done
            <kbd className="ml-1 rounded bg-accent-foreground/10 px-1 py-0.5 text-[11px] font-mono leading-none text-accent-foreground/60">D</kbd>
          </button>
          <RemindPicker
            onSelect={(date) => handleSnooze(date)}
            triggerContent={
              <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[14px] font-medium text-foreground transition-colors hover:bg-secondary">
                <AlarmClock className="h-3.5 w-3.5" />
                Snooze
                <kbd className="ml-1 rounded bg-muted px-1 py-0.5 text-[11px] font-mono leading-none text-muted-foreground">S</kbd>
              </button>
            }
            align="start"
          />
          <button
            onClick={handleTrash}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[14px] font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Trash
            <kbd className="ml-1 rounded bg-muted px-1 py-0.5 text-[11px] font-mono leading-none text-muted-foreground">T</kbd>
          </button>
        </div>
      )}

      {note.status === "capture" && (
        <div className="shrink-0 border-b border-border">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20">
            <button
              onClick={handlePromote}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[14px] font-medium transition-colors ${
                ready
                  ? "bg-[#45d483] text-[#0a0a0a] hover:bg-[#45d483]/80"
                  : "border border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Promote
              <kbd className="ml-1 rounded bg-foreground/10 px-1 py-0.5 text-[11px] font-mono leading-none opacity-60">P</kbd>
            </button>
            <button
              onClick={handleMoveBack}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Inbox className="h-3.5 w-3.5" />
              Back to Inbox
              <kbd className="ml-1 rounded bg-muted px-1 py-0.5 text-[11px] font-mono leading-none text-muted-foreground">B</kbd>
            </button>
            <RemindPicker
              onSelect={(date) => { setReminder(noteId, date); toast("Reminder set", { description: format(new Date(date), "MMM d, h:mm a") }) }}
              triggerContent={
                <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[14px] font-medium text-foreground transition-colors hover:bg-secondary">
                  <Bell className="h-3.5 w-3.5" />
                  Remind
                </button>
              }
            />
          </div>
          {staleSuggest && (
            <div className="flex items-center gap-2 bg-destructive/5 px-4 py-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-[14px] text-destructive">Untouched for 14+ days.</span>
              <button
                onClick={handleMoveBack}
                className="ml-auto text-[12px] font-medium text-destructive underline underline-offset-2 hover:no-underline"
              >
                Move back to Inbox?
              </button>
            </div>
          )}
          {!staleSuggest && stale && (
            <div className="flex items-center gap-2 bg-chart-3/5 px-4 py-2">
              <AlertTriangle className="h-4 w-4 text-chart-3" />
              <span className="text-[14px] text-chart-3">Review needed - untouched for 7+ days.</span>
            </div>
          )}
          {showCaptureAgeNudge && (
            <div className="flex items-center gap-2 px-4 py-2">
              <Clock className="h-4 w-4 text-muted-foreground/60" />
              <span className="text-[13px] text-muted-foreground/70">
                In capture for {daysInCapture} days. Consider promoting or archiving.
              </span>
            </div>
          )}
        </div>
      )}

      {note.status === "permanent" && (
        <div className="shrink-0 border-b border-border">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20">
            <button
              onClick={handleDemote}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              Demote to Capture
              <kbd className="ml-1 rounded bg-muted px-1 py-0.5 text-[11px] font-mono leading-none text-muted-foreground">D</kbd>
            </button>
            <RemindPicker
              onSelect={(date) => { setReminder(noteId, date); toast("Reminder set", { description: format(new Date(date), "MMM d, h:mm a") }) }}
              triggerContent={
                <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[14px] font-medium text-foreground transition-colors hover:bg-secondary">
                  <Bell className="h-3.5 w-3.5" />
                  Remind
                </button>
              }
            />
          </div>
          {linkCount === 0 && (
            <div className="flex items-center gap-2 bg-chart-3/5 px-4 py-2">
              <Link2 className="h-4 w-4 text-chart-3" />
              <span className="text-[14px] text-chart-3">
                Unlinked permanent note — add connections to strengthen your knowledge graph.
                {suggestions.length > 0 && (
                  <span className="ml-1 text-chart-3/80">
                    {suggestions.length} suggested {suggestions.length === 1 ? "connection" : "connections"} below.
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Note title */}
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[16px] font-semibold leading-tight text-foreground text-balance">
            {note.title || "Untitled"}
          </h2>
          {preview && (
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground line-clamp-3">
              {preview}
            </p>
          )}
        </div>

        {/* Metadata */}
        <PanelSection title="Metadata" icon={<CircleDot className="h-4 w-4" />}>
          <div className="space-y-0.5">
            <MetaRow label="Status" icon={<CircleDot className="h-3.5 w-3.5" />}>
              <StatusBadge status={note.status} />
            </MetaRow>
            <MetaRow label="Priority" icon={<Signal className="h-3.5 w-3.5" />}>
              <span className="flex items-center gap-1.5">
                <PriorityBadge priority={note.priority} />
                <span className="text-[14px] capitalize text-muted-foreground">
                  {note.priority === "none" ? "No priority" : note.priority}
                </span>
              </span>
            </MetaRow>
            <MetaRow label="Created" icon={<Calendar className="h-3.5 w-3.5" />}>
              {format(new Date(note.createdAt), "MMM d, yyyy")}
            </MetaRow>
            <MetaRow label="Updated" icon={<Clock className="h-3.5 w-3.5" />}>
              {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </MetaRow>
            {note.reviewAt && note.status !== "inbox" && (
              <div className="flex items-center justify-between py-1.5">
                <span className="flex items-center gap-2 text-[14px] text-muted-foreground">
                  <Bell className="h-3.5 w-3.5" />
                  Reminder
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] text-foreground">{format(new Date(note.reviewAt), "MMM d, h:mm a")}</span>
                  <button onClick={() => clearReminder(noteId)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </PanelSection>

        <div className="mx-5 border-b border-border" />

        {/* Backlinks */}
        <PanelSection
          title="Backlinks"
          icon={<Link2 className="h-4 w-4" />}
          count={backlinks.length}
        >
          {backlinks.length > 0 ? (
            <div className="space-y-0.5">
              {backlinks.map((bl) => (
                <NoteLink key={bl.id} note={bl} onOpen={onOpenNote} />
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-muted-foreground/60">
              No other notes reference this note yet.
            </p>
          )}
        </PanelSection>

        <div className="mx-5 border-b border-border" />

        {/* Related Notes */}
        <PanelSection
          title="Related Notes"
          icon={<Sparkles className="h-4 w-4" />}
          count={suggestions.length}
        >
          {suggestions.length > 0 ? (
            <div className="space-y-0.5">
              {suggestions.map((s) => {
                const candidateNote = notes.find((n) => n.id === s.noteId)
                if (!candidateNote) return null
                return (
                  <div
                    key={s.noteId}
                    className="group/link flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-secondary/50"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <button
                        onClick={() => onOpenNote(candidateNote.id)}
                        className="truncate text-left text-[14px] text-foreground hover:text-accent"
                      >
                        {candidateNote.title || "Untitled"}
                      </button>
                      <span className="truncate text-[11px] text-muted-foreground/60">
                        {s.reasons.join(" · ")}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-[11px] tabular-nums font-medium text-accent">
                      {s.score}
                    </span>
                    <button
                      onClick={() => handleLinkSuggestion(candidateNote.title)}
                      className="shrink-0 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      Link
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-[14px] text-muted-foreground/60">
              No suggestions found. Try adding tags or organizing notes into folders.
            </p>
          )}
        </PanelSection>

        <div className="mx-5 border-b border-border" />

        {/* Actions */}
        <PanelSection title="Actions" icon={<Merge className="h-4 w-4" />}>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setMergePickerOpen(true, note.id)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[14px] font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Merge className="h-3.5 w-3.5" />
              Merge with...
            </button>
            <button
              onClick={() => setLinkPickerOpen(true, note.id)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[14px] font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Link2 className="h-3.5 w-3.5" />
              Link to...
            </button>
          </div>
        </PanelSection>
      </div>
    </Wrapper>
  )
}
