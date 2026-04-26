/**
 * embed-cycle.ts
 *
 * Cycle detection for NoteEmbed / WikiEmbed cross-references.
 * Prevents A → B → A embed loops by traversing the embed graph.
 */

import type { WikiArticle, Note } from "./types"

/* ── Types ────────────────────────────────────────────── */

export type EmbedKind = "note" | "wiki"

interface StoreSnapshot {
  notes: Note[]
  wikiArticles: WikiArticle[]
}

/* ── Internal: collect embed children from a TipTap doc ── */

/**
 * Walk a TipTap JSON doc and collect all noteEmbed + wikiEmbed node targets.
 * Returns { notes: string[], wikis: string[] }
 */
function collectEmbedsInDoc(
  doc: Record<string, unknown> | null | undefined,
): { notes: string[]; wikis: string[] } {
  const notes: string[] = []
  const wikis: string[] = []
  if (!doc || typeof doc !== "object") return { notes, wikis }

  function walk(node: Record<string, unknown>) {
    const type = node.type as string | undefined
    if (type === "noteEmbed") {
      const noteId = (node.attrs as Record<string, unknown>)?.noteId
      if (typeof noteId === "string" && noteId) notes.push(noteId)
    } else if (type === "wikiEmbed") {
      const articleId = (node.attrs as Record<string, unknown>)?.articleId
      if (typeof articleId === "string" && articleId) wikis.push(articleId)
    }
    const content = (node.content as Record<string, unknown>[] | undefined) ?? []
    for (const child of content) {
      walk(child as Record<string, unknown>)
    }
  }

  walk(doc as Record<string, unknown>)
  return { notes, wikis }
}

/* ── Public API ───────────────────────────────────────── */

const MAX_DEPTH = 10

/**
 * BFS/DFS traversal: return all note IDs and wiki article IDs reachable
 * via embed links starting from (rootId, rootKind).
 * Includes the root itself in the visited set to prevent self-embed.
 */
export function getEmbedDescendants(
  rootId: string,
  rootKind: EmbedKind,
  store: StoreSnapshot,
): { notes: Set<string>; wikis: Set<string> } {
  const visitedNotes = new Set<string>()
  const visitedWikis = new Set<string>()

  // Queue: [id, kind, depth]
  const queue: Array<[string, EmbedKind, number]> = [[rootId, rootKind, 0]]

  // Mark root as visited so it's excluded from picker
  if (rootKind === "note") visitedNotes.add(rootId)
  else visitedWikis.add(rootId)

  while (queue.length > 0) {
    const [id, kind, depth] = queue.shift()!
    if (depth >= MAX_DEPTH) continue

    let childNotes: string[] = []
    let childWikis: string[] = []

    if (kind === "note") {
      const note = store.notes.find((n) => n.id === id)
      if (note?.contentJson) {
        const result = collectEmbedsInDoc(note.contentJson as Record<string, unknown>)
        childNotes = result.notes
        childWikis = result.wikis
      }
    } else {
      // wiki: iterate blocks, collect from text blocks' contentJson
      const article = store.wikiArticles.find((a) => a.id === id)
      if (article) {
        for (const block of article.blocks) {
          if (block.type === "text" && block.contentJson) {
            const result = collectEmbedsInDoc(block.contentJson as Record<string, unknown>)
            childNotes.push(...result.notes)
            childWikis.push(...result.wikis)
          }
        }
      }
    }

    for (const nId of childNotes) {
      if (!visitedNotes.has(nId)) {
        visitedNotes.add(nId)
        queue.push([nId, "note", depth + 1])
      }
    }
    for (const wId of childWikis) {
      if (!visitedWikis.has(wId)) {
        visitedWikis.add(wId)
        queue.push([wId, "wiki", depth + 1])
      }
    }
  }

  return { notes: visitedNotes, wikis: visitedWikis }
}

/**
 * Returns true if embedding `targetId` (targetKind) into `sourceId` (sourceKind)
 * would create a cycle.
 *
 * Logic: would it be a cycle? → if sourceId is reachable from target
 * (i.e., sourceId ∈ descendants(target)).
 */
export function wouldCreateCycle(
  sourceId: string,
  sourceKind: EmbedKind,
  targetId: string,
  targetKind: EmbedKind,
  store: StoreSnapshot,
): boolean {
  // Self-embed is always a cycle
  if (sourceId === targetId && sourceKind === targetKind) return true

  const { notes: descNotes, wikis: descWikis } = getEmbedDescendants(
    targetId,
    targetKind,
    store,
  )

  if (sourceKind === "note") return descNotes.has(sourceId)
  return descWikis.has(sourceId)
}
