"use client"

import { usePlotStore } from "@/lib/store"
import type { Note, WikiArticle, Reference } from "@/lib/types"

export type SidePanelEntityResult =
  | { type: "note"; noteId: string; wikiArticleId: null; referenceId: null; note: Note | null; wikiArticle: null; reference: null }
  | { type: "wiki"; noteId: null; wikiArticleId: string; referenceId: null; note: null; wikiArticle: WikiArticle | null; reference: null }
  | { type: "reference"; noteId: null; wikiArticleId: null; referenceId: string; note: null; wikiArticle: null; reference: Reference | null }
  | { type: null; noteId: null; wikiArticleId: null; referenceId: null; note: null; wikiArticle: null; reference: null }

/** Resolve an entity ID to a note or wiki article. */
function resolveEntityById(
  id: string | null,
  notes: Note[],
  wikiArticles: WikiArticle[],
): SidePanelEntityResult | null {
  if (!id) return null
  const note = notes.find((n) => n.id === id) ?? null
  if (note) {
    return { type: "note" as const, noteId: id, wikiArticleId: null, referenceId: null, note, wikiArticle: null, reference: null }
  }
  const article = wikiArticles.find((a) => a.id === id) ?? null
  if (article) {
    return { type: "wiki" as const, noteId: null, wikiArticleId: id, referenceId: null, note: null, wikiArticle: article, reference: null }
  }
  return null
}

export function useSidePanelEntity(): SidePanelEntityResult {
  const sidePanelContext = usePlotStore((s) => s.sidePanelContext)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const references = usePlotStore((s) => s.references)

  // Reference
  if (sidePanelContext?.type === 'reference') {
    const ref = references[sidePanelContext.id] ?? null
    if (ref) {
      return { type: "reference" as const, noteId: null, wikiArticleId: null, referenceId: sidePanelContext.id, note: null, wikiArticle: null, reference: ref }
    }
  }

  // Note or Wiki
  if (sidePanelContext?.type === 'wiki' || sidePanelContext?.type === 'note') {
    const result = resolveEntityById(sidePanelContext.id, notes, wikiArticles)
    if (result) return result
  }

  return { type: null, noteId: null, wikiArticleId: null, referenceId: null, note: null, wikiArticle: null, reference: null }
}
