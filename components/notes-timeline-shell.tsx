"use client"

/**
 * NotesTimelineShell — data + selection wrapper around NotesTimelineView.
 *
 * Mirrors NotesTable's data-loading shape (`useNotesView` + `selectedIds` +
 * `openNote`/`onSelect` handlers) so the timeline view drops in alongside
 * the other view modes from NotesTableView's mode switch.
 */

import { useState, useCallback } from "react"
import type { ViewContextKey } from "@/lib/view-engine/types"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import { NotesTimelineView } from "@/components/views/notes-timeline-view"

interface NotesTimelineShellProps {
  context: ViewContextKey
  folderId?: string
  tagId?: string
  labelId?: string
  /** Single-click → side-panel preview (Notes parity). */
  onRowClick?: (noteId: string) => void
  activePreviewId?: string | null
}

export function NotesTimelineShell({
  context,
  folderId,
  tagId,
  labelId,
  onRowClick,
  activePreviewId,
}: NotesTimelineShellProps) {
  const backlinksMap = useBacklinksIndex()
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  const { flatNotes, groups, viewState } = useNotesView(context, {
    backlinksMap,
    folderId,
    tagId,
    labelId,
  })

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  /** Double-click semantics — open the note in the workspace editor. */
  const handleOpenNote = useCallback(
    (id: string) => {
      // Single-click should preview, double-click (or explicit open) edits.
      // NotesTimelineView wires the click to `onOpenArticle` which we treat
      // as the preview signal; an actual open uses `setSelectedNoteId`.
      onRowClick?.(id)
    },
    [onRowClick],
  )

  const handleSelect = useCallback(
    (id: string, opts: { multi?: boolean; shift?: boolean; index?: number }) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (opts.multi) {
          if (next.has(id)) next.delete(id)
          else next.add(id)
        } else {
          next.clear()
          next.add(id)
        }
        return next
      })
    },
    [],
  )

  return (
    <NotesTimelineView
      notes={flatNotes}
      viewState={viewState}
      noteGroups={groups}
      selectedIds={selectedIds}
      activeNoteId={activePreviewId ?? null}
      onOpenNote={handleOpenNote}
      onSelect={handleSelect}
    />
  )
}
