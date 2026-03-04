"use client"

import { usePlotStore } from "@/lib/store"
import { NoteList } from "@/components/note-list"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import type { NoteFilter } from "@/lib/types"

/**
 * Shared page shell for all note-list routes.
 * Handles the two-state layout:
 *   - No note selected: full-width NoteList
 *   - Note selected: Editor + Inspector
 */
export function NoteListPage({ filter }: { filter: NoteFilter }) {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const hasSelectedNote = selectedNoteId !== null

  if (hasSelectedNote) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <NoteEditor />
        <NoteInspector />
      </div>
    )
  }

  return <NoteList filter={filter} />
}
