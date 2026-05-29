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
 * (NotesGridShell) owns ViewHeader, FilterChipBar, `useNotesView`, and the
 * selection state (selectedIds + FloatingActionBar) — same split as
 * NotesTimelineView / NotesTimelineShell.
 *
 * Interaction (board/table parity): single click toggles selection (a hover
 * checkbox surfaces top-right), double click opens the editor (list-nav).
 */

import { Pin as PushPin, Check as PhCheck } from "lucide-react"
import { StatusShapeIcon } from "@/components/status-icon"
import { shortRelative } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import { useListNavCapture } from "@/hooks/use-list-nav-capture"
import type { Note } from "@/lib/types"

interface NotesGridViewProps {
  notes: Note[]
  /** Single-click → side-panel preview (when no selection handler is wired). */
  onRowClick?: (noteId: string) => void
  /** Double-click → open editor (parity with notes-table/notes-board). */
  onOpenEditor?: (noteId: string) => void
  /** Screen label for the editor's list-nav bar ("Notes" / folder / view…). */
  label?: string
  activePreviewId?: string | null
  /** Selected note ids (board/table-parity multi-select). */
  selectedIds?: Set<string>
  /** Toggle a card's selection (hover checkbox / single click). */
  onSelect?: (noteId: string) => void
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
  isSelected,
  onOpen,
  onDoubleClick,
  onSelect,
}: {
  note: Note
  isActive: boolean
  isSelected: boolean
  onOpen: () => void
  onDoubleClick?: () => void
  onSelect?: () => void
}) {
  const preview = plaintextPreview(note.content)
  const words = wordCount(note.content)
  return (
    <div
      data-note-id={note.id}
      onClick={(e) => {
        if (onSelect) {
          e.stopPropagation()
          onSelect()
        } else {
          onOpen()
        }
      }}
      onDoubleClick={onDoubleClick}
      className={cn(
        "group relative flex cursor-pointer flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-all",
        note.trashed
          ? "border-border/60 opacity-50"
          : "border-border/60 hover:bg-hover-bg hover:border-border hover:shadow-sm",
        isSelected
          ? "border-accent/60 bg-accent/[0.04] ring-1 ring-accent/20"
          : isActive && "border-accent/60 bg-accent/[0.04]",
      )}
    >
      {/* Selection checkbox — surfaces on hover or when selected (board/table
          parity). Stops propagation so the card's single-click toggle and the
          checkbox toggle don't double-fire. */}
      <div
        className={cn(
          "absolute right-2 top-2 z-10 flex h-4 w-4 items-center justify-center rounded border transition-all",
          isSelected
            ? "border-accent bg-accent opacity-100"
            : "border-border bg-card opacity-0 group-hover:opacity-100 hover:border-foreground/50",
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.()
        }}
      >
        {isSelected && <PhCheck className="text-accent-foreground" size={10} strokeWidth={2.5} />}
      </div>

      {/* Pin indicator — yields its slot to the checkbox on hover/select so
          the two don't overlap in the top-right corner. */}
      {note.pinned && (
        <PushPin
          size={11}
          fill="currentColor"
          strokeWidth={2}
          className={cn(
            "absolute top-2 text-amber-500 transition-all",
            isSelected ? "right-8" : "right-2 group-hover:right-8",
          )}
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
    </div>
  )
}

export function NotesGridView({
  notes,
  onRowClick,
  onOpenEditor,
  label,
  activePreviewId,
  selectedIds,
  onSelect,
}: NotesGridViewProps) {
  // list-context-navigation: freeze the grid's row-major note order into
  // listNavContext right before opening the editor (double-click → "← N/M →").
  const captureListNav = useListNavCapture("notes")
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
            isSelected={selectedIds?.has(note.id) ?? false}
            onSelect={onSelect ? () => onSelect(note.id) : undefined}
            onOpen={() => onRowClick?.(note.id)}
            onDoubleClick={
              onOpenEditor
                ? () => {
                    captureListNav(notes.map((n) => n.id), note.id, label ?? "Notes")
                    onOpenEditor(note.id)
                  }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}
