"use client"

import { useMemo } from "react"
import {
  X,
  FileText,
  Calendar,
  Clock,
  Link2,
  Sparkles,
  ArrowRight,
  CircleDot,
  Signal,
  Eye,
  ExternalLink,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { StatusBadge, PriorityBadge } from "@/components/note-fields"
import { ConnectionsGraph } from "@/components/connections-graph"
import type { Note } from "@/lib/types"

/* ── Backlinks helper ──────────────────────────────────── */

function getBacklinkNotes(noteId: string, notes: Note[]): Note[] {
  const note = notes.find((n) => n.id === noteId)
  if (!note || !note.title.trim()) return []

  const title = note.title.toLowerCase()
  return notes.filter((other) => {
    if (other.id === noteId) return false
    const content = other.content.toLowerCase()
    return (
      content.includes(`[[${title}]]`) ||
      (title.length > 3 && content.includes(title))
    )
  })
}

/* ── Suggested links helper ────────────────────────────── */

function getSuggestedLinks(noteId: string, notes: Note[]): Note[] {
  const note = notes.find((n) => n.id === noteId)
  if (!note) return []

  const backlinkIds = new Set(
    getBacklinkNotes(noteId, notes).map((n) => n.id)
  )

  return notes
    .filter((other) => {
      if (other.id === noteId) return false
      if (other.archived) return false
      if (backlinkIds.has(other.id)) return false
      // Match by shared tags
      const sharedTags = other.tags.filter((t) => note.tags.includes(t))
      if (sharedTags.length > 0) return true
      // Match by same folder
      if (note.folderId && other.folderId === note.folderId) return true
      // Match by same category
      if (note.category && other.category === note.category) return true
      // Match by same status
      if (note.status === other.status && note.status !== "capture") return true
      return false
    })
    .slice(0, 5)
}

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
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {count !== undefined && (
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums font-medium text-muted-foreground">
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
      <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-[12px] text-foreground">{children}</span>
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
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[12px] text-foreground group-hover/link:text-accent">
          {note.title || "Untitled"}
        </span>
      </div>
      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/0 transition-colors group-hover/link:text-muted-foreground" />
    </button>
  )
}

/* ── NoteDetailPanel ───────────────────────────────────── */

export function NoteDetailPanel({
  noteId,
  onClose,
  onOpenNote,
  onEditNote,
}: {
  noteId: string
  onClose: () => void
  onOpenNote: (id: string) => void
  onEditNote: () => void
}) {
  const notes = usePlotStore((s) => s.notes)
  const note = notes.find((n) => n.id === noteId)

  const backlinks = useMemo(
    () => (note ? getBacklinkNotes(noteId, notes) : []),
    [noteId, notes, note]
  )

  const suggested = useMemo(
    () => (note ? getSuggestedLinks(noteId, notes) : []),
    [noteId, notes, note]
  )

  if (!note) return null

  const preview = note.content
    .replace(/^#.*$/gm, "")
    .replace(/[*_~`[\]]/g, "")
    .trim()
    .slice(0, 200)

  return (
    <aside className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-l border-border bg-card animate-in slide-in-from-right-4 fade-in duration-200">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-[13px] font-medium text-foreground truncate">
            Details
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEditNote}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Open in editor"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Note title */}
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[16px] font-semibold leading-tight text-foreground text-balance">
            {note.title || "Untitled"}
          </h2>
          {preview && (
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground line-clamp-3">
              {preview}
            </p>
          )}
        </div>

        {/* Metadata */}
        <PanelSection title="Metadata" icon={<CircleDot className="h-3.5 w-3.5" />}>
          <div className="space-y-0.5">
            <MetaRow label="Status" icon={<CircleDot className="h-3 w-3" />}>
              <StatusBadge status={note.status} />
            </MetaRow>
            <MetaRow label="Priority" icon={<Signal className="h-3 w-3" />}>
              <span className="flex items-center gap-1.5">
                <PriorityBadge priority={note.priority} />
                <span className="text-[12px] capitalize text-muted-foreground">
                  {note.priority === "none" ? "No priority" : note.priority}
                </span>
              </span>
            </MetaRow>
            <MetaRow label="Reads" icon={<Eye className="h-3 w-3" />}>
              <span className="tabular-nums">{note.reads}</span>
            </MetaRow>
            <MetaRow label="Created" icon={<Calendar className="h-3 w-3" />}>
              {format(new Date(note.createdAt), "MMM d, yyyy")}
            </MetaRow>
            <MetaRow label="Updated" icon={<Clock className="h-3 w-3" />}>
              {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </MetaRow>
          </div>
        </PanelSection>

        <div className="mx-5 border-b border-border" />

        {/* Backlinks */}
        <PanelSection
          title="Backlinks"
          icon={<Link2 className="h-3.5 w-3.5" />}
          count={backlinks.length}
        >
          {backlinks.length > 0 ? (
            <div className="space-y-0.5">
              {backlinks.map((bl) => (
                <NoteLink key={bl.id} note={bl} onOpen={onOpenNote} />
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground/60">
              No other notes reference this note yet.
            </p>
          )}
        </PanelSection>

        <div className="mx-5 border-b border-border" />

        {/* Connections Graph */}
        <PanelSection
          title="Connections"
          icon={<Link2 className="h-3.5 w-3.5" />}
        >
          <ConnectionsGraph
            noteId={noteId}
            notes={notes}
            onOpenNote={onOpenNote}
          />
        </PanelSection>

        <div className="mx-5 border-b border-border" />

        {/* Suggested Links */}
        <PanelSection
          title="Suggested Links"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          count={suggested.length}
        >
          {suggested.length > 0 ? (
            <div className="space-y-0.5">
              {suggested.map((sl) => (
                <NoteLink key={sl.id} note={sl} onOpen={onOpenNote} />
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground/60">
              No suggestions found. Try adding tags or organizing notes into folders.
            </p>
          )}
        </PanelSection>
      </div>
    </aside>
  )
}
