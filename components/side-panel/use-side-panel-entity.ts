"use client"

import { usePlotStore } from "@/lib/store"
import type { Note, WikiArticle, Reference, NoteTemplate, Book } from "@/lib/types"

export type SidePanelEntityResult =
  | { type: "note"; noteId: string; wikiArticleId: null; referenceId: null; templateId: null; bookId: null; note: Note | null; wikiArticle: null; reference: null; template: null; book: null }
  | { type: "wiki"; noteId: null; wikiArticleId: string; referenceId: null; templateId: null; bookId: null; note: null; wikiArticle: WikiArticle | null; reference: null; template: null; book: null }
  | { type: "reference"; noteId: null; wikiArticleId: null; referenceId: string; templateId: null; bookId: null; note: null; wikiArticle: null; reference: Reference | null; template: null; book: null }
  | { type: "template"; noteId: null; wikiArticleId: null; referenceId: null; templateId: string; bookId: null; note: null; wikiArticle: null; reference: null; template: NoteTemplate | null; book: null }
  | { type: "book"; noteId: null; wikiArticleId: null; referenceId: null; templateId: null; bookId: string; note: null; wikiArticle: null; reference: null; template: null; book: Book | null }
  | { type: null; noteId: null; wikiArticleId: null; referenceId: null; templateId: null; bookId: null; note: null; wikiArticle: null; reference: null; template: null; book: null }

const EMPTY: SidePanelEntityResult = {
  type: null,
  noteId: null,
  wikiArticleId: null,
  referenceId: null,
  templateId: null,
  bookId: null,
  note: null,
  wikiArticle: null,
  reference: null,
  template: null,
  book: null,
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
    return { type: "note" as const, noteId: id, wikiArticleId: null, referenceId: null, templateId: null, bookId: null, note, wikiArticle: null, reference: null, template: null, book: null }
  }
  const article = wikiArticles.find((a) => a.id === id) ?? null
  if (article) {
    return { type: "wiki" as const, noteId: null, wikiArticleId: id, referenceId: null, templateId: null, bookId: null, note: null, wikiArticle: article, reference: null, template: null, book: null }
  }
  return null
}

export function useSidePanelEntity(): SidePanelEntityResult {
  const sidePanelContext = usePlotStore((s) => s.sidePanelContext)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const references = usePlotStore((s) => s.references)
  const templates = usePlotStore((s) => s.templates ?? [])
  const books = usePlotStore((s) => s.books ?? [])

  // Reference
  if (sidePanelContext?.type === 'reference') {
    const ref = references[sidePanelContext.id] ?? null
    if (ref) {
      return { type: "reference" as const, noteId: null, wikiArticleId: null, referenceId: sidePanelContext.id, templateId: null, bookId: null, note: null, wikiArticle: null, reference: ref, template: null, book: null }
    }
  }

  // Template (Plot PR template-b: side panel surfaces template properties)
  if (sidePanelContext?.type === 'template') {
    const tmpl = templates.find((t) => t.id === sidePanelContext.id) ?? null
    return { type: "template" as const, noteId: null, wikiArticleId: null, referenceId: null, templateId: sidePanelContext.id, bookId: null, note: null, wikiArticle: null, reference: null, template: tmpl, book: null }
  }

  // Book (entity-side-panel-uniformity PR 2: Book gains 4-tab side panel)
  if (sidePanelContext?.type === 'book') {
    const book = books.find((b: Book) => b.id === sidePanelContext.id) ?? null
    return { type: "book" as const, noteId: null, wikiArticleId: null, referenceId: null, templateId: null, bookId: sidePanelContext.id, note: null, wikiArticle: null, reference: null, template: null, book }
  }

  // Note or Wiki
  if (sidePanelContext?.type === 'wiki' || sidePanelContext?.type === 'note') {
    const result = resolveEntityById(sidePanelContext.id, notes, wikiArticles)
    if (result) return result
  }

  return EMPTY
}
