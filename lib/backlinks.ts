"use client"

import type { Note } from "./types"

/** Simple English stopwords */
const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
  "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "and", "but", "or", "nor", "not", "so", "yet", "both",
  "either", "neither", "each", "every", "all", "any", "few", "more",
  "most", "other", "some", "such", "no", "only", "own", "same",
  "than", "too", "very", "just", "because", "if", "when", "while",
  "this", "that", "these", "those", "it", "its", "he", "she", "we",
  "they", "i", "me", "my", "your", "his", "her", "our", "their",
])

/**
 * Simple tokenizer: lowercase, remove special chars, filter short/stopwords.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w))
}

/**
 * Suggest backlinks for a target note based on keyword overlap,
 * unlinked mentions, and shared metadata.
 * Uses precomputed preview/linksOut fields for performance.
 */
export function suggestBacklinks(
  targetNoteId: string,
  notes: Note[],
  opts?: { limit?: number }
): Array<{ noteId: string; score: number; reasons: string[] }> {
  const limit = opts?.limit ?? 10
  const target = notes.find((n) => n.id === targetNoteId)
  if (!target) return []

  const targetTitle = target.title.toLowerCase()
  const targetTokens = new Set(tokenize(target.title + " " + target.preview))
  const existingLinks = new Set(target.linksOut)

  const results: Array<{ noteId: string; score: number; reasons: string[] }> = []

  for (const other of notes) {
    if (other.id === targetNoteId) continue
    if (other.archived) continue
    // Skip if already wiki-linked from target
    if (existingLinks.has(other.title.toLowerCase())) continue

    let score = 0
    const reasons: string[] = []

    // (A) Keyword overlap (using preview instead of full content)
    const otherTokens = new Set(tokenize(other.title + " " + other.preview))
    let overlap = 0
    for (const token of targetTokens) {
      if (otherTokens.has(token)) overlap++
    }
    if (overlap >= 3) {
      score += Math.min(overlap, 10)
      reasons.push(`${overlap} shared keywords`)
    }

    // (B) Unlinked mention: other note has target title in linksOut
    if (other.linksOut.includes(targetTitle)) {
      score += 15
      reasons.push("links to this note")
    }

    // (B2) Target preview mentions other's title (potential unlinked mention)
    const otherTitle = other.title.toLowerCase()
    if (!existingLinks.has(otherTitle) && otherTitle.length > 3 && target.preview.toLowerCase().includes(otherTitle)) {
      score += 15
      reasons.push("this note mentions their title")
    }

    // (C) Shared tags
    const sharedTags = other.tags.filter((t) => target.tags.includes(t))
    if (sharedTags.length > 0) {
      score += sharedTags.length * 3
      reasons.push(`${sharedTags.length} shared tag(s)`)
    }

    // (C) Same folder
    if (target.folderId && other.folderId === target.folderId) {
      score += 2
      reasons.push("same folder")
    }

    // (C) Same category
    if (target.category && other.category === target.category) {
      score += 2
      reasons.push("same category")
    }

    if (score > 0) {
      results.push({ noteId: other.id, score, reasons })
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Incremental backlinks index.
 * Maintains outlinks and backlinks maps, updated per-note rather than full recompute.
 * O(k) per update where k = links in the changed note.
 * Uses precomputed linksOut field instead of content scanning.
 */
export class BacklinksIndex {
  private outlinks = new Map<string, Set<string>>()   // noteId -> Set<linkedNoteId>
  private backlinks = new Map<string, Set<string>>()   // noteId -> Set<referrerId>
  private titleToId = new Map<string, string>()        // lowercase title -> noteId

  /** Build the full index from scratch. Call once on init. */
  buildFromScratch(notes: { id: string; title: string; linksOut: string[] }[]): void {
    this.outlinks.clear()
    this.backlinks.clear()
    this.titleToId.clear()

    // Build title->id lookup
    for (const note of notes) {
      if (note.title.trim()) {
        this.titleToId.set(note.title.toLowerCase(), note.id)
      }
    }

    // Build outlinks for each note using precomputed linksOut
    for (const note of notes) {
      const linkedIds = this.resolveLinksOut(note.id, note.linksOut)
      this.outlinks.set(note.id, linkedIds)
      // Register backlinks
      for (const linkedId of linkedIds) {
        if (!this.backlinks.has(linkedId)) {
          this.backlinks.set(linkedId, new Set())
        }
        this.backlinks.get(linkedId)!.add(note.id)
      }
    }
  }

  /** Update a single note. Diffs old vs new outlinks. */
  upsert(noteId: string, title: string, linksOut: string[]): void {
    // Update title index
    // Remove old title mapping for this note
    for (const [t, id] of this.titleToId) {
      if (id === noteId) {
        this.titleToId.delete(t)
        break
      }
    }
    if (title.trim()) {
      this.titleToId.set(title.toLowerCase(), noteId)
    }

    const oldLinks = this.outlinks.get(noteId) ?? new Set<string>()
    const newLinks = this.resolveLinksOut(noteId, linksOut)

    // Remove backlinks for links that no longer exist
    for (const oldId of oldLinks) {
      if (!newLinks.has(oldId)) {
        this.backlinks.get(oldId)?.delete(noteId)
      }
    }

    // Add backlinks for new links
    for (const newId of newLinks) {
      if (!oldLinks.has(newId)) {
        if (!this.backlinks.has(newId)) {
          this.backlinks.set(newId, new Set())
        }
        this.backlinks.get(newId)!.add(noteId)
      }
    }

    this.outlinks.set(noteId, newLinks)
  }

  /** Remove a note from the index. */
  remove(noteId: string): void {
    // Remove outlinks (and their backlink references)
    const links = this.outlinks.get(noteId)
    if (links) {
      for (const linkedId of links) {
        this.backlinks.get(linkedId)?.delete(noteId)
      }
      this.outlinks.delete(noteId)
    }

    // Remove backlinks TO this note
    this.backlinks.delete(noteId)

    // Remove title mapping
    for (const [t, id] of this.titleToId) {
      if (id === noteId) {
        this.titleToId.delete(t)
        break
      }
    }
  }

  /** Get backlink count for a note. */
  getBacklinkCount(noteId: string): number {
    return this.backlinks.get(noteId)?.size ?? 0
  }

  /** Get all backlink note IDs for a note. */
  getBacklinkers(noteId: string): Set<string> {
    return this.backlinks.get(noteId) ?? new Set()
  }

  /** Get a map of noteId -> backlink count (compatible with old buildBacklinksMap). */
  toCountMap(): Map<string, number> {
    const map = new Map<string, number>()
    for (const [noteId] of this.outlinks) {
      map.set(noteId, this.getBacklinkCount(noteId))
    }
    // Also include notes that have backlinks but may not have outlinks
    for (const [noteId, refs] of this.backlinks) {
      if (!map.has(noteId)) {
        map.set(noteId, refs.size)
      }
    }
    return map
  }

  /** Resolve linksOut titles to note IDs. */
  private resolveLinksOut(noteId: string, linksOut: string[]): Set<string> {
    const linkedIds = new Set<string>()
    for (const linkTitle of linksOut) {
      const targetId = this.titleToId.get(linkTitle)
      if (targetId && targetId !== noteId) {
        linkedIds.add(targetId)
      }
    }
    return linkedIds
  }
}
