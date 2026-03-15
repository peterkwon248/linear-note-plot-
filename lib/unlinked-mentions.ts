"use client"

import type { Note } from "./types"

export interface UnlinkedMention {
  noteId: string       // The note whose title/alias was found
  title: string        // The matched text
  count: number        // How many times it appears
}

/**
 * Detect note titles/aliases that appear in a note's content
 * without being wrapped in [[brackets]].
 */
export function detectUnlinkedMentions(
  targetNoteId: string,
  notes: Note[],
): UnlinkedMention[] {
  const target = notes.find((n) => n.id === targetNoteId)
  if (!target || !target.content) return []

  const content = target.content
  const contentLower = content.toLowerCase()

  // Already-linked titles (lowercased) — skip these
  const linkedTitles = new Set(target.linksOut)

  // Build candidates: other notes' titles and aliases (>2 chars, not already linked)
  const candidates: { noteId: string; title: string; titleLower: string }[] = []
  for (const note of notes) {
    if (note.id === targetNoteId || note.archived || note.trashed) continue
    if (note.title.trim().length > 2 && !linkedTitles.has(note.title.toLowerCase())) {
      candidates.push({ noteId: note.id, title: note.title, titleLower: note.title.toLowerCase() })
    }
    if (note.aliases) {
      for (const alias of note.aliases) {
        if (alias.trim().length > 2 && !linkedTitles.has(alias.toLowerCase())) {
          candidates.push({ noteId: note.id, title: alias, titleLower: alias.toLowerCase() })
        }
      }
    }
  }

  // Sort longest first to prevent "React" from matching inside "React Native"
  candidates.sort((a, b) => b.titleLower.length - a.titleLower.length)

  // Find [[...]] block positions to exclude
  const bracketRanges: [number, number][] = []
  const bracketRegex = /\[\[([^\]]+)\]\]/g
  let m
  while ((m = bracketRegex.exec(content)) !== null) {
    bracketRanges.push([m.index, m.index + m[0].length])
  }

  const isInsideBrackets = (pos: number, len: number): boolean => {
    for (const [start, end] of bracketRanges) {
      if (pos >= start && pos + len <= end) return true
    }
    return false
  }

  // Track claimed character positions (longest-match-first)
  const claimed = new Set<number>()
  const WB = /[\s\n,;.!?:()\[\]{}'"\-\/]/  // word boundary chars

  const results: UnlinkedMention[] = []

  for (const candidate of candidates) {
    let count = 0
    let searchFrom = 0

    while (searchFrom < contentLower.length) {
      const pos = contentLower.indexOf(candidate.titleLower, searchFrom)
      if (pos === -1) break

      const endPos = pos + candidate.titleLower.length
      const before = pos > 0 ? contentLower[pos - 1] : " "
      const after = endPos < contentLower.length ? contentLower[endPos] : " "

      if (
        (WB.test(before) || pos === 0) &&
        (WB.test(after) || endPos === contentLower.length) &&
        !isInsideBrackets(pos, candidate.titleLower.length) &&
        !claimed.has(pos)
      ) {
        count++
        for (let i = pos; i < endPos; i++) claimed.add(i)
      }
      searchFrom = pos + 1
    }

    if (count > 0) {
      results.push({ noteId: candidate.noteId, title: candidate.title, count })
    }
  }

  return results
}
