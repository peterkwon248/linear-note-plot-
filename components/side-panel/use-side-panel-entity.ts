"use client"

import { usePlotStore } from "@/lib/store"
import { usePane } from "@/components/workspace/pane-context"
import type { Note, WikiArticle, Reference } from "@/lib/types"

export type SidePanelEntityResult =
  | { type: "note"; noteId: string; wikiArticleId: null; referenceId: null; note: Note | null; wikiArticle: null; reference: null }
  | { type: "wiki"; noteId: null; wikiArticleId: string; referenceId: null; note: null; wikiArticle: WikiArticle | null; reference: null }
  | { type: "reference"; noteId: null; wikiArticleId: null; referenceId: string; note: null; wikiArticle: null; reference: Reference | null }
  | { type: null; noteId: null; wikiArticleId: null; referenceId: null; note: null; wikiArticle: null; reference: null }

function resolveCtx(
  ctx: any,
  noteId: string | null,
  notes: Note[],
  wikiArticles: WikiArticle[],
  references: Record<string, Reference>
): SidePanelEntityResult | null {
  // If context is explicitly set, use it
  if (ctx?.type === "wiki") {
    const article = wikiArticles.find((a) => a.id === ctx.id) ?? null
    if (article) {
      return { type: "wiki" as const, noteId: null, wikiArticleId: ctx.id, referenceId: null, note: null, wikiArticle: article, reference: null }
    }
  }

  if (ctx?.type === "reference") {
    const ref = references[ctx.id] ?? null
    if (ref) {
      return { type: "reference" as const, noteId: null, wikiArticleId: null, referenceId: ctx.id, note: null, wikiArticle: null, reference: ref }
    }
  }

  if (ctx?.type === "note") {
    const note = notes.find((n) => n.id === ctx.id) ?? null
    if (note) {
      return { type: "note" as const, noteId: ctx.id, wikiArticleId: null, referenceId: null, note, wikiArticle: null, reference: null }
    }
  }

  // Fallback: use the pane's own note ID
  if (noteId) {
    const note = notes.find((n) => n.id === noteId) ?? null
    if (note) {
      return { type: "note" as const, noteId, wikiArticleId: null, referenceId: null, note, wikiArticle: null, reference: null }
    }
  }

  return null
}

export function useSidePanelEntity(): SidePanelEntityResult {
  const pane = usePane()
  const primaryCtx = usePlotStore((s) => s.sidePanelContext)
  const secondaryCtx = usePlotStore((s) => s.secondarySidePanelContext)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const secondaryNoteId = usePlotStore((s) => s.secondaryNoteId)
  const previewNoteId = usePlotStore((s) => s.previewNoteId)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const references = usePlotStore((s) => s.references)

  // Try active pane first
  const primaryNoteId = selectedNoteId || previewNoteId
  const activeResult = pane === 'secondary'
    ? resolveCtx(secondaryCtx, secondaryNoteId, notes, wikiArticles, references)
    : resolveCtx(primaryCtx, primaryNoteId, notes, wikiArticles, references)

  if (activeResult) return activeResult

  // Cross-pane fallback: if active pane has nothing, try the OTHER pane
  // This handles cases like Wiki+Note split where one pane has no panel-compatible entity
  const otherResult = pane === 'secondary'
    ? resolveCtx(primaryCtx, primaryNoteId, notes, wikiArticles, references)
    : resolveCtx(secondaryCtx, secondaryNoteId, notes, wikiArticles, references)

  if (otherResult) return otherResult

  return { type: null, noteId: null, wikiArticleId: null, referenceId: null, note: null, wikiArticle: null, reference: null }
}
