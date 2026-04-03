"use client"

import { usePlotStore } from "@/lib/store"
import type { Note, WikiArticle } from "@/lib/types"

export type SidePanelEntityResult =
  | { type: "note"; noteId: string; wikiArticleId: null; note: Note | null; wikiArticle: null }
  | { type: "wiki"; noteId: null; wikiArticleId: string; note: null; wikiArticle: WikiArticle | null }
  | { type: null; noteId: null; wikiArticleId: null; note: null; wikiArticle: null }

export function useSidePanelEntity(): SidePanelEntityResult {
  const ctx = usePlotStore((s) => s.sidePanelContext)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const previewNoteId = usePlotStore((s) => s.previewNoteId)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  // If context is explicitly set, use it
  if (ctx?.type === "wiki") {
    const article = wikiArticles.find((a) => a.id === ctx.id) ?? null
    return { type: "wiki" as const, noteId: null, wikiArticleId: ctx.id, note: null, wikiArticle: article }
  }

  if (ctx?.type === "note") {
    const note = notes.find((n) => n.id === ctx.id) ?? null
    return { type: "note" as const, noteId: ctx.id, wikiArticleId: null, note, wikiArticle: null }
  }

  // Fallback: legacy behavior (selectedNoteId || previewNoteId)
  const fallbackId = selectedNoteId || previewNoteId
  if (fallbackId) {
    const note = notes.find((n) => n.id === fallbackId) ?? null
    return { type: "note" as const, noteId: fallbackId, wikiArticleId: null, note, wikiArticle: null }
  }

  return { type: null, noteId: null, wikiArticleId: null, note: null, wikiArticle: null }
}
