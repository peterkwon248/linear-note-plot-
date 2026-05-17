"use client"

/**
 * EntityNoteListRow — DRY row component for the note list inside an entity
 * sub-page (Labels / Tags / Stickers / etc.). Notes table parity (영구 룰 21
 * entity-uniformity):
 *   - Hover-only checkbox (왼쪽, opacity-0 group-hover:opacity-100)
 *   - Single click anywhere = toggle selection (checkbox 같이)
 *   - Double click anywhere = navigate to the note
 *
 * Pre-2026-05-16: row was a plain `<button>` whose only action was navigate
 * on single-click. The user requested a checkbox + dblclick-to-navigate
 * pattern so multi-select is possible inside the entity sub-page (영구 룰
 * 21 entity-uniformity).
 */

import { cn } from "@/lib/utils"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { shortRelative } from "@/lib/format-utils"
import type { Note } from "@/lib/types"

export interface EntityNoteListRowProps {
  note: Note
  isSelected: boolean
  onToggleSelect: () => void
  onNavigate: () => void
}

export function EntityNoteListRow({
  note,
  isSelected,
  onToggleSelect,
  onNavigate,
}: EntityNoteListRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        // Click on the checkbox itself bubbles up to here — skip the
        // duplicate toggle.
        if ((e.target as HTMLElement).closest("[data-row-checkbox]")) return
        onToggleSelect()
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onNavigate()
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          onNavigate()
        } else if (e.key === " ") {
          e.preventDefault()
          onToggleSelect()
        }
      }}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-3 px-6 py-3 text-left transition-colors",
        isSelected ? "bg-accent/5 hover:bg-accent/10" : "hover:bg-hover-bg",
      )}
    >
      {/* Hover-only checkbox (w-4 → 16px). Notes/Wiki/Books table 패턴 정합:
          always visible when selected; opacity-0 + group-hover:opacity-100
          otherwise. Click is captured here (stopPropagation) so the row's
          single-click handler doesn't fire twice. */}
      <div
        data-row-checkbox
        onClick={(e) => {
          e.stopPropagation()
          onToggleSelect()
        }}
        className={cn(
          "flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border shadow-sm transition-all",
          isSelected
            ? "border-accent bg-accent opacity-100"
            : "border-zinc-400 bg-card opacity-0 group-hover:opacity-100 hover:border-zinc-500 dark:border-zinc-600 dark:hover:border-zinc-500",
        )}
      >
        {isSelected && <PhCheck size={10} weight="bold" className="text-accent-foreground" />}
      </div>

      <span className="flex-1 truncate text-ui text-foreground">
        {note.title || "Untitled"}
      </span>
      <span className="text-note capitalize text-muted-foreground">
        {note.status}
      </span>
      <span className="text-note tabular-nums text-muted-foreground">
        {shortRelative(note.updatedAt)}
      </span>
    </div>
  )
}
