"use client"

import type { Note } from "./types"

/**
 * Count how many other notes reference a given note by title.
 * Looks for [[title]] wiki-link syntax or plain title mentions in content.
 */
export function countBacklinks(noteId: string, notes: Note[]): number {
  const note = notes.find((n) => n.id === noteId)
  if (!note || !note.title.trim()) return 0

  const title = note.title.toLowerCase()
  let count = 0

  for (const other of notes) {
    if (other.id === noteId) continue
    const content = other.content.toLowerCase()
    // Check for [[title]] wiki-links or plain title mention
    if (
      content.includes(`[[${title}]]`) ||
      (title.length > 3 && content.includes(title))
    ) {
      count++
    }
  }

  return count
}

/**
 * Build a map of noteId -> backlink count for all notes.
 */
export function buildBacklinksMap(notes: Note[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const note of notes) {
    map.set(note.id, countBacklinks(note.id, notes))
  }
  return map
}
