"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import type { Note } from "@/lib/types"

/**
 * Returns Note objects that have wiki-links pointing to the given noteId.
 * Uses the same linksOut-based pattern as NoteDetailPanel's getBacklinkNotes().
 */
export function useBacklinksFor(noteId: string | null): Note[] {
  const notes = usePlotStore((s) => s.notes)

  return useMemo(() => {
    if (!noteId) return []
    const target = notes.find((n) => n.id === noteId)
    if (!target) return []

    const targetTitle = target.title.toLowerCase()
    if (!targetTitle) return []

    return notes.filter(
      (n) => n.id !== noteId && !n.trashed && n.linksOut.includes(targetTitle)
    )
  }, [noteId, notes])
}
