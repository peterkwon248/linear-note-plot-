/**
 * Peek entity search — pure function to find Peek-able targets (Note + Wiki) by query.
 * Used by PeekEmptyState picker. Mirrors the note/wiki branches of MentionSuggestion.items()
 * but scoped to Peek's allowed entity types.
 */

import { usePlotStore } from "@/lib/store"
import type { PeekContext } from "@/lib/store/types"
import type { NoteStatus } from "@/lib/types"

export type PeekSearchResult = PeekContext & {
  /** Display title. */
  title: string
  /** Optional aliases list for secondary matching. */
  aliases?: string[]
  /** Last-modified timestamp (ISO) for recency ordering. */
  updatedAt?: string
  /** Workflow status — present only for note results. */
  status?: NoteStatus
}

/**
 * Resolved Peek entity — either a note (with workflow status) or a wiki article.
 * Used by list rows that need to render a type-aware icon.
 */
export type PeekEntity =
  | { kind: "note"; id: string; title: string; status: NoteStatus }
  | { kind: "wiki"; id: string; title: string }

const MAX_RESULTS = 10

/**
 * Search notes + wiki articles matching the given query.
 * Empty query → returns most recently updated items.
 */
export function searchPeekable(query: string): PeekSearchResult[] {
  const store = usePlotStore.getState()
  const q = query.trim().toLowerCase()
  const results: PeekSearchResult[] = []

  // Notes
  const notes = store.notes.filter((n) => !n.trashed && n.title.trim())
  if (q.length === 0) {
    const recent = [...notes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
    for (const n of recent) {
      results.push({
        type: "note",
        id: n.id,
        title: n.title,
        updatedAt: n.updatedAt,
        status: n.status,
      })
    }
  } else {
    const matched = notes
      .filter((n) => {
        const t = n.title.toLowerCase()
        if (t.includes(q)) return true
        return n.aliases?.some((a) => a.toLowerCase().includes(q))
      })
      .sort((a, b) => {
        const at = a.title.toLowerCase()
        const bt = b.title.toLowerCase()
        const aExact = at === q ? 0 : 1
        const bExact = bt === q ? 0 : 1
        if (aExact !== bExact) return aExact - bExact
        const aStarts = at.startsWith(q) ? 0 : 1
        const bStarts = bt.startsWith(q) ? 0 : 1
        if (aStarts !== bStarts) return aStarts - bStarts
        return a.title.length - b.title.length
      })
      .slice(0, 6)
    for (const n of matched) {
      results.push({
        type: "note",
        id: n.id,
        title: n.title,
        aliases: n.aliases,
        updatedAt: n.updatedAt,
        status: n.status,
      })
    }
  }

  // Wiki articles
  const wikiArticles = store.wikiArticles ?? []
  if (q.length === 0) {
    const recentWiki = [...wikiArticles]
      .filter((w) => w.title?.trim())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
    for (const w of recentWiki) {
      results.push({ type: "wiki", id: w.id, title: w.title, updatedAt: w.updatedAt })
    }
  } else {
    const matched = wikiArticles
      .filter((w) => {
        if (!w.title?.trim()) return false
        const t = w.title.toLowerCase()
        if (t.includes(q)) return true
        return w.aliases?.some((a) => a.toLowerCase().includes(q))
      })
      .sort((a, b) => {
        const at = a.title.toLowerCase()
        const bt = b.title.toLowerCase()
        const aExact = at === q ? 0 : 1
        const bExact = bt === q ? 0 : 1
        if (aExact !== bExact) return aExact - bExact
        const aStarts = at.startsWith(q) ? 0 : 1
        const bStarts = bt.startsWith(q) ? 0 : 1
        if (aStarts !== bStarts) return aStarts - bStarts
        return a.title.length - b.title.length
      })
      .slice(0, 6)
    for (const w of matched) {
      results.push({
        type: "wiki",
        id: w.id,
        title: w.title,
        aliases: w.aliases,
        updatedAt: w.updatedAt,
      })
    }
  }

  return results.slice(0, MAX_RESULTS)
}

/**
 * Resolve a PeekContext to a display title. Returns "Untitled" fallback.
 * Used by PeekEmptyState to render stored history/pin entries.
 */
export function resolvePeekTitle(ctx: PeekContext): string {
  const store = usePlotStore.getState()
  if (ctx.type === "note") {
    const note = store.notes.find((n) => n.id === ctx.id)
    return note?.title || "Untitled"
  }
  const article = store.wikiArticles.find((a) => a.id === ctx.id)
  return article?.title || "Untitled"
}

/**
 * Resolve a PeekContext to its full entity (title + type-specific fields).
 * Returns `null` if the entity has been deleted. Used by list rows that need
 * to render type-aware icons (workflow status circle for notes, wiki icon for wiki).
 */
export function resolvePeekEntity(ctx: PeekContext): PeekEntity | null {
  const store = usePlotStore.getState()
  if (ctx.type === "note") {
    const note = store.notes.find((n) => n.id === ctx.id && !n.trashed)
    if (!note) return null
    return { kind: "note", id: note.id, title: note.title || "Untitled", status: note.status }
  }
  const article = store.wikiArticles.find((a) => a.id === ctx.id)
  if (!article) return null
  return { kind: "wiki", id: article.id, title: article.title || "Untitled" }
}

/** Check whether a PeekContext still resolves to a live entity (not deleted). */
export function isPeekEntityAlive(ctx: PeekContext): boolean {
  const store = usePlotStore.getState()
  if (ctx.type === "note") {
    return store.notes.some((n) => n.id === ctx.id && !n.trashed)
  }
  return store.wikiArticles.some((a) => a.id === ctx.id)
}
