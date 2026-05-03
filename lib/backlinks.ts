"use client"

import type { Note, WikiArticle } from "./types"
import { extractLinksFromWikiBlocks } from "./body-helpers"

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
    if (other.trashed) continue
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
    const otherPreview = other.preview.toLowerCase()
    if (!existingLinks.has(otherTitle) && otherTitle.length > 3 && target.preview.toLowerCase().includes(otherTitle)) {
      score += 15
      reasons.push("this note mentions their title")
    }

    // (B3) Alias mentions in other's preview
    if ((target as any).aliases) {
      for (const alias of (target as any).aliases as string[]) {
        const aliasLower = alias.toLowerCase()
        if (aliasLower.length > 3 && otherPreview.includes(aliasLower)) {
          score += 10
          break
        }
      }
    }

    // (C) Shared tags
    const sharedTags = other.tags.filter((t) => target.tags.includes(t))
    if (sharedTags.length > 0) {
      score += sharedTags.length * 3
      reasons.push(`${sharedTags.length} shared tag(s)`)
    }

    // (C) Same folder — v107 N:M: any overlap counts as "same folder"
    const sharedFolders = (target.folderIds ?? []).filter((fid) =>
      (other.folderIds ?? []).includes(fid),
    )
    if (sharedFolders.length > 0) {
      score += 2
      reasons.push("same folder")
    }

    // (D) Staleness boost: surface old related notes for natural review
    // Only applies to notes that already have some relevance (score > 0 after above signals)
    if (score > 0) {
      const daysSinceTouch = (Date.now() - new Date(other.lastTouchedAt).getTime()) / 86400000
      if (daysSinceTouch > 14) {
        const stalenessBonus = Math.min(Math.floor(daysSinceTouch / 7), 8)
        score += stalenessBonus
        reasons.push(`${Math.floor(daysSinceTouch)}d since last visit`)
      }
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
  private idToTitle = new Map<string, string>()        // noteId -> lowercase title (reverse lookup)
  private aliasesById = new Map<string, string[]>()

  /** Build the full index from scratch. Call once on init. */
  buildFromScratch(notes: { id: string; title: string; linksOut: string[]; aliases?: string[] }[]): void {
    this.outlinks.clear()
    this.backlinks.clear()
    this.titleToId.clear()
    this.idToTitle.clear()
    this.aliasesById.clear()

    // Build title->id lookup
    for (const note of notes) {
      if (note.title.trim()) {
        const lower = note.title.toLowerCase()
        this.titleToId.set(lower, note.id)
        this.idToTitle.set(note.id, lower)
      }
      // Register aliases
      if (note.aliases) {
        const aliasLowers = note.aliases.map(a => a.toLowerCase())
        this.aliasesById.set(note.id, aliasLowers)
        for (const aliasLower of aliasLowers) {
          if (!this.titleToId.has(aliasLower)) {
            this.titleToId.set(aliasLower, note.id)
          }
        }
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
  upsert(noteId: string, title: string, linksOut: string[], aliases?: string[]): void {
    // Update title index — O(1) via reverse map
    const oldTitle = this.idToTitle.get(noteId)
    if (oldTitle !== undefined) {
      this.titleToId.delete(oldTitle)
      this.idToTitle.delete(noteId)
    }
    // Clean up old aliases
    const oldAliases = this.aliasesById.get(noteId) ?? []
    for (const oldAlias of oldAliases) {
      if (this.titleToId.get(oldAlias) === noteId) {
        this.titleToId.delete(oldAlias)
      }
    }
    if (title.trim()) {
      const lower = title.toLowerCase()
      this.titleToId.set(lower, noteId)
      this.idToTitle.set(noteId, lower)
    }
    // Register new aliases
    if (aliases && aliases.length > 0) {
      const newAliasLowers = aliases.map(a => a.toLowerCase())
      this.aliasesById.set(noteId, newAliasLowers)
      for (const aliasLower of newAliasLowers) {
        if (!this.titleToId.has(aliasLower)) {
          this.titleToId.set(aliasLower, noteId)
        }
      }
    } else {
      this.aliasesById.delete(noteId)
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

    // Remove title mapping — O(1) via reverse map
    const oldTitle = this.idToTitle.get(noteId)
    if (oldTitle !== undefined) {
      this.titleToId.delete(oldTitle)
      this.idToTitle.delete(noteId)
    }
    // Clean up aliases
    const oldAliases = this.aliasesById.get(noteId) ?? []
    for (const oldAlias of oldAliases) {
      if (this.titleToId.get(oldAlias) === noteId) {
        this.titleToId.delete(oldAlias)
      }
    }
    this.aliasesById.delete(noteId)
  }

  /** Register a WikiArticle in the backlinks index. */
  upsertArticle(article: WikiArticle): void {
    const linksOut = article.linksOut ?? extractLinksFromWikiBlocks(article.blocks)
    this.upsert(article.id, article.title, linksOut, article.aliases)
  }

  /** Remove a WikiArticle from the backlinks index. */
  removeArticle(articleId: string): void {
    this.remove(articleId)
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
