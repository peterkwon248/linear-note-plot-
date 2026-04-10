/**
 * Secondary pane suggestions — derive a list of SecondaryEntityRefs to show in
 * the SecondaryOpenPicker so the picker never feels empty.
 *
 * Priority:
 *   1. If a note is currently being edited, surface its backlinks + outgoing
 *      wikilinks (referenced notes).
 *   2. Fill remaining slots with most-recently-updated notes.
 *   3. Fill remaining slots with most-recently-updated wiki articles.
 *
 * All logic is pure — reads from usePlotStore at call time. Exclusions
 * (pinned / already in recent) are handled by the caller.
 */

import { usePlotStore } from "@/lib/store"
import type { SecondaryEntityRef } from "./entity-search"
import type { Note } from "@/lib/types"

const DEFAULT_LIMIT = 5

function entityKey(ref: SecondaryEntityRef): string { return `${ref.type}:${ref.id}` }

/** Find notes whose `linksOut` references the target note's title or alias. */
function getNoteBacklinks(targetId: string, notes: Note[]): string[] {
  const target = notes.find((n) => n.id === targetId)
  if (!target) return []
  const lookupKeys = new Set<string>()
  if (target.title.trim()) lookupKeys.add(target.title.toLowerCase())
  for (const alias of target.aliases ?? []) {
    if (alias.trim()) lookupKeys.add(alias.toLowerCase())
  }
  if (lookupKeys.size === 0) return []

  const result: string[] = []
  for (const n of notes) {
    if (n.id === targetId || n.trashed) continue
    const links = n.linksOut ?? []
    for (const link of links) {
      if (lookupKeys.has(link.toLowerCase())) {
        result.push(n.id)
        break
      }
    }
  }
  return result
}

/** Resolve the target note's outgoing wikilinks to note IDs (ignoring unresolved links). */
function getNoteOutlinks(targetId: string, notes: Note[]): string[] {
  const target = notes.find((n) => n.id === targetId)
  if (!target || !target.linksOut) return []
  const titleToId = new Map<string, string>()
  for (const n of notes) {
    if (n.trashed) continue
    if (n.title.trim()) titleToId.set(n.title.toLowerCase(), n.id)
    for (const alias of n.aliases ?? []) {
      const lower = alias.toLowerCase()
      if (!titleToId.has(lower)) titleToId.set(lower, n.id)
    }
  }
  const resolved: string[] = []
  for (const link of target.linksOut) {
    const id = titleToId.get(link.toLowerCase())
    if (id && id !== targetId) resolved.push(id)
  }
  return resolved
}

/**
 * Compute secondary pane suggestions.
 *
 * @param opts.currentNoteId If set, suggestions prioritize backlinks/outlinks of this note.
 * @param opts.exclude Pre-filter: any refs already shown elsewhere (pinned/recent) to skip.
 * @param opts.limit Maximum number of suggestions to return.
 */
export function getSecondarySuggestions(opts: {
  currentNoteId: string | null
  exclude?: SecondaryEntityRef[]
  limit?: number
}): SecondaryEntityRef[] {
  const limit = opts.limit ?? DEFAULT_LIMIT
  const store = usePlotStore.getState()
  const notes = store.notes
  const wikiArticles = store.wikiArticles ?? []
  const excludedKeys = new Set<string>((opts.exclude ?? []).map(entityKey))
  // Also exclude the currently-edited note itself
  if (opts.currentNoteId) {
    excludedKeys.add(`note:${opts.currentNoteId}`)
  }

  const seenKeys = new Set<string>()
  const results: SecondaryEntityRef[] = []
  const add = (ref: SecondaryEntityRef): boolean => {
    if (results.length >= limit) return false
    const key = entityKey(ref)
    if (seenKeys.has(key) || excludedKeys.has(key)) return true
    seenKeys.add(key)
    results.push(ref)
    return true
  }

  // Priority 1: contextual (backlinks + outlinks of current note)
  if (opts.currentNoteId) {
    const backlinkIds = getNoteBacklinks(opts.currentNoteId, notes)
    // Prefer more-recently-updated backlinks first for relevance
    const orderedBacklinks = backlinkIds
      .map((id) => notes.find((n) => n.id === id))
      .filter((n): n is Note => !!n)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((n) => n.id)
    for (const id of orderedBacklinks) {
      if (!add({ type: "note", id })) break
    }
    if (results.length < limit) {
      const outlinkIds = getNoteOutlinks(opts.currentNoteId, notes)
      for (const id of outlinkIds) {
        if (!add({ type: "note", id })) break
      }
    }
  }

  // Priority 2: most-recently-updated notes
  if (results.length < limit) {
    const recentNotes = [...notes]
      .filter((n) => !n.trashed && n.title.trim())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit * 2)
    for (const n of recentNotes) {
      if (!add({ type: "note", id: n.id })) break
    }
  }

  // Priority 3: most-recently-updated wiki articles (max 2 to keep a note-first bias)
  if (results.length < limit) {
    const recentWiki = [...wikiArticles]
      .filter((w) => w.title?.trim())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 2)
    for (const w of recentWiki) {
      if (!add({ type: "wiki", id: w.id })) break
    }
  }

  return results
}

/**
 * Label describing where suggestions come from, used for the section sub-label.
 * "Related" when there's a currently-edited note with at least one backlink/outlink,
 * otherwise "Suggested" (generic fallback).
 */
export function getSecondarySuggestionsLabel(currentNoteId: string | null): "Related" | "Suggested" {
  if (!currentNoteId) return "Suggested"
  const store = usePlotStore.getState()
  const hasBack = getNoteBacklinks(currentNoteId, store.notes).length > 0
  const hasOut = getNoteOutlinks(currentNoteId, store.notes).length > 0
  return hasBack || hasOut ? "Related" : "Suggested"
}
