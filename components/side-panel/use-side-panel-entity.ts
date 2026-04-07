"use client"

import { usePlotStore } from "@/lib/store"
import type { Note, WikiArticle, Reference } from "@/lib/types"

export type SidePanelEntityResult =
  | { type: "note"; noteId: string; wikiArticleId: null; referenceId: null; note: Note | null; wikiArticle: null; reference: null }
  | { type: "wiki"; noteId: null; wikiArticleId: string; referenceId: null; note: null; wikiArticle: WikiArticle | null; reference: null }
  | { type: "reference"; noteId: null; wikiArticleId: null; referenceId: string; note: null; wikiArticle: null; reference: Reference | null }
  | { type: null; noteId: null; wikiArticleId: null; referenceId: null; note: null; wikiArticle: null; reference: null }

export function useSidePanelEntity(): SidePanelEntityResult {
  const ctx = usePlotStore((s) => s.sidePanelContext)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const previewNoteId = usePlotStore((s) => s.previewNoteId)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const references = usePlotStore((s) => s.references)

  // If context is explicitly set, use it
  if (ctx?.type === "wiki") {
    const article = wikiArticles.find((a) => a.id === ctx.id) ?? null
    return { type: "wiki" as const, noteId: null, wikiArticleId: ctx.id, referenceId: null, note: null, wikiArticle: article, reference: null }
  }

  if (ctx?.type === "reference") {
    const ref = references[ctx.id] ?? null
    return { type: "reference" as const, noteId: null, wikiArticleId: null, referenceId: ctx.id, note: null, wikiArticle: null, reference: ref }
  }

  if (ctx?.type === "note") {
    const note = notes.find((n) => n.id === ctx.id) ?? null
    return { type: "note" as const, noteId: ctx.id, wikiArticleId: null, referenceId: null, note, wikiArticle: null, reference: null }
  }

  // Fallback: legacy behavior (selectedNoteId || previewNoteId)
  const fallbackId = selectedNoteId || previewNoteId
  if (fallbackId) {
    const note = notes.find((n) => n.id === fallbackId) ?? null
    return { type: "note" as const, noteId: fallbackId, wikiArticleId: null, referenceId: null, note, wikiArticle: null, reference: null }
  }

  return { type: null, noteId: null, wikiArticleId: null, referenceId: null, note: null, wikiArticle: null, reference: null }
}
