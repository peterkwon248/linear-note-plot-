"use client"

import { usePlotStore } from "@/lib/store"
import type { Note, WikiArticle, Reference, NoteTemplate } from "@/lib/types"

export type SidePanelEntityResult =
  | { type: "note"; noteId: string; wikiArticleId: null; referenceId: null; templateId: null; note: Note | null; wikiArticle: null; reference: null; template: null }
  | { type: "wiki"; noteId: null; wikiArticleId: string; referenceId: null; templateId: null; note: null; wikiArticle: WikiArticle | null; reference: null; template: null }
  | { type: "reference"; noteId: null; wikiArticleId: null; referenceId: string; templateId: null; note: null; wikiArticle: null; reference: Reference | null; template: null }
  | { type: "template"; noteId: null; wikiArticleId: null; referenceId: null; templateId: string; note: null; wikiArticle: null; reference: null; template: NoteTemplate | null }
  | { type: null; noteId: null; wikiArticleId: null; referenceId: null; templateId: null; note: null; wikiArticle: null; reference: null; template: null }

const EMPTY: SidePanelEntityResult = {
  type: null,
  noteId: null,
  wikiArticleId: null,
  referenceId: null,
  templateId: null,
  note: null,
  wikiArticle: null,
  reference: null,
  template: null,
}

/** Resolve an entity ID to a note or wiki article. */
function resolveEntityById(
  id: string | null,
  notes: Note[],
  wikiArticles: WikiArticle[],
): SidePanelEntityResult | null {
  if (!id) return null
  const note = notes.find((n) => n.id === id) ?? null
  if (note) {
    return { type: "note" as const, noteId: id, wikiArticleId: null, referenceId: null, templateId: null, note, wikiArticle: null, reference: null, template: null }
  }
  const article = wikiArticles.find((a) => a.id === id) ?? null
  if (article) {
    return { type: "wiki" as const, noteId: null, wikiArticleId: id, referenceId: null, templateId: null, note: null, wikiArticle: article, reference: null, template: null }
  }
  return null
}

export function useSidePanelEntity(): SidePanelEntityResult {
  const sidePanelContext = usePlotStore((s) => s.sidePanelContext)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const references = usePlotStore((s) => s.references)
  const templates = usePlotStore((s) => s.templates ?? [])

  // Reference
  if (sidePanelContext?.type === 'reference') {
    const ref = references[sidePanelContext.id] ?? null
    if (ref) {
      return { type: "reference" as const, noteId: null, wikiArticleId: null, referenceId: sidePanelContext.id, templateId: null, note: null, wikiArticle: null, reference: ref, template: null }
    }
  }

  // Template (Plot PR template-b: side panel surfaces template properties)
  if (sidePanelContext?.type === 'template') {
    const tmpl = templates.find((t) => t.id === sidePanelContext.id) ?? null
    return { type: "template" as const, noteId: null, wikiArticleId: null, referenceId: null, templateId: sidePanelContext.id, note: null, wikiArticle: null, reference: null, template: tmpl }
  }

  // Note or Wiki
  if (sidePanelContext?.type === 'wiki' || sidePanelContext?.type === 'note') {
    const result = resolveEntityById(sidePanelContext.id, notes, wikiArticles)
    if (result) return result
  }

  return EMPTY
}
