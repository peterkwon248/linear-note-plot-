import type { Note } from "../types"

/**
 * Stage 3: Lightweight text search on title + preview.
 * Case-insensitive substring match.
 * Full-text search is handled by the Worker search engine (Phase 3).
 */
export function applySearch(notes: Note[], query: string): Note[] {
  const trimmed = query.trim()
  if (!trimmed) return notes

  const lower = trimmed.toLowerCase()

  return notes.filter((note) => {
    if ((note.title || "Untitled").toLowerCase().includes(lower)) return true
    if (note.preview && note.preview.toLowerCase().includes(lower)) return true
    return false
  })
}
