"use client"

/**
 * NotesGridView — Books-grid-parity card grid for Notes.
 *
 * Before this view existed, Notes grid mode fell through to NotesTable's
 * default list rendering (rows with columns). User signal (2026-05-24):
 * "북스의 그리드 디스플레이처럼 해야지" — true card grid like
 * `components/books/book-grid-card.tsx` + the books-view `grid` branch
 * (`grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))]`).
 *
 * Surface here is a pure presentational grid. The Shell wrapper
 * (NotesGridShell) owns ViewHeader, FilterChipBar, and `useNotesView`
 * data hookup — same split as NotesTimelineView / NotesTimelineShell.
 */

import { Pin as PushPin } from "lucide-react"
import { StatusShapeIcon } from "@/components/status-icon"
import { shortRelative } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import type { Note } from "@/lib/types"

interface NotesGridViewProps {
  notes: Note[]
  /** Single-click → side-panel preview (Notes parity). */
  onRowClick?: (noteId: string) => void
  activePreviewId?: string | null
}

function plaintextPreview(content: string | undefined, limit = 120): string {
  if (!content) return ""
  // Strip wiki link syntax + heading hashes for a cleaner preview.
  return content
    .replace(/\[\[wiki:([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, limit)
}

function wordCount(content: string | undefined): number {
  if (!content) return 0
  const trimmed = content.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

function NoteGridCard({
  note,
  isActive,
  onOpen,
}: {
  note: Note
  isActive: boolean
  onOpen: () => void
}) {
  const preview = plaintextPreview(note.content)
  const words = wordCount(note.content)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative flex flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-all",
        note.trashed
          ? "border-border/60 opacity-50 cursor-default"
          : "border-border/60 hover:bg-hover-bg hover:border-border hover:shadow-sm",
        isActive && "border-accent/60 bg-accent/[0.04]",
      )}
    >
      {/* Pin indicator (top-right) */}
      {note.pinned && (
        <PushPin
          size={11}
          fill="currentColor"
          strokeWidth={2}
          className="absolute right-2 top-2 text-amber-500"
        />
      )}

      {/* Status icon — LOCKED #103: no tinted box, color tone only. */}
      <StatusShapeIcon status={note.status} size={22} />

      {/* Title */}
      <h3 className="text-note font-medium text-foreground line-clamp-2 leading-snug">
        {note.title || "Untitled"}
      </h3>

      {/* Content preview (optional) */}
      {preview && (
        <p className="text-2xs text-muted-foreground line-clamp-3 leading-snug">
          {preview}
        </p>
      )}

      <div className="flex-1" />

      {/* Footer — word count + relative time (mirrors Books "N items · updatedAt"). */}
      <div className="mt-1 flex items-center gap-2 text-2xs text-muted-foreground/70">
        {words > 0 && (
          <>
            <span className="tabular-nums">
              {words} word{words === 1 ? "" : "s"}
            </span>
            <span>·</span>
          </>
        )}
        <span>{shortRelative(note.updatedAt)}</span>
      </div>
    </button>
  )
}

export function NotesGridView({ notes, onRowClick, activePreviewId }: NotesGridViewProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">No notes</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 p-6">
        {notes.map((note) => (
          <NoteGridCard
            key={note.id}
            note={note}
            isActive={activePreviewId === note.id}
            onOpen={() => onRowClick?.(note.id)}
          />
        ))}
      </div>
    </div>
  )
}
