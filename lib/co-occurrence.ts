"use client"

import type { Note, CoOccurrence } from "./types"

/**
 * Compute concept co-occurrences across all notes.
 * For each note with 2+ wiki-links, generate all pairs
 * and track how many notes each pair co-occurs in.
 */
export function computeCoOccurrences(
  notes: Note[],
  maxItems: number = 500,
): CoOccurrence[] {
  const pairMap = new Map<string, { count: number; noteIds: string[] }>()

  for (const note of notes) {
    if (note.archived || note.trashed) continue

    const links = note.linksOut
    if (links.length < 2) continue

    // Dedupe links within this note
    const unique = Array.from(new Set(links))

    // Generate all pairs with canonical key (sorted)
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const [a, b] = [unique[i], unique[j]].sort()
        const key = `${a}||${b}`

        const existing = pairMap.get(key)
        if (existing) {
          if (!existing.noteIds.includes(note.id)) {
            existing.count++
            existing.noteIds.push(note.id)
          }
        } else {
          pairMap.set(key, { count: 1, noteIds: [note.id] })
        }
      }
    }
  }

  // Convert to CoOccurrence array
  const result: CoOccurrence[] = []
  for (const [key, val] of pairMap) {
    const sep = key.indexOf("||")
    result.push({
      conceptA: key.slice(0, sep),
      conceptB: key.slice(sep + 2),
      count: val.count,
      noteIds: val.noteIds,
    })
  }

  // Sort by count descending
  result.sort((a, b) => b.count - a.count)
  return result.slice(0, maxItems)
}
