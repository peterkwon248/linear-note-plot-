"use client"

import { usePlotStore } from "@/lib/store"
import type { Note, WikiArticle, Reference, NoteTemplate, Attachment, Book, Tag, Sticker, Label } from "@/lib/types"

export type SidePanelEntityResult =
  | { type: "note"; noteId: string; wikiArticleId: null; referenceId: null; templateId: null; attachmentId: null; bookId: null; tagId: null; stickerId: null; labelId: null; note: Note | null; wikiArticle: null; reference: null; template: null; attachment: null; book: null; tag: null; sticker: null; label: null }
  | { type: "wiki"; noteId: null; wikiArticleId: string; referenceId: null; templateId: null; attachmentId: null; bookId: null; tagId: null; stickerId: null; labelId: null; note: null; wikiArticle: WikiArticle | null; reference: null; template: null; attachment: null; book: null; tag: null; sticker: null; label: null }
  | { type: "reference"; noteId: null; wikiArticleId: null; referenceId: string; templateId: null; attachmentId: null; bookId: null; tagId: null; stickerId: null; labelId: null; note: null; wikiArticle: null; reference: Reference | null; template: null; attachment: null; book: null; tag: null; sticker: null; label: null }
  | { type: "template"; noteId: null; wikiArticleId: null; referenceId: null; templateId: string; attachmentId: null; bookId: null; tagId: null; stickerId: null; labelId: null; note: null; wikiArticle: null; reference: null; template: NoteTemplate | null; attachment: null; book: null; tag: null; sticker: null; label: null }
  | { type: "file"; noteId: null; wikiArticleId: null; referenceId: null; templateId: null; attachmentId: string; bookId: null; tagId: null; stickerId: null; labelId: null; note: null; wikiArticle: null; reference: null; template: null; attachment: Attachment | null; book: null; tag: null; sticker: null; label: null }
  | { type: "book"; noteId: null; wikiArticleId: null; referenceId: null; templateId: null; attachmentId: null; bookId: string; tagId: null; stickerId: null; labelId: null; note: null; wikiArticle: null; reference: null; template: null; attachment: null; book: Book | null; tag: null; sticker: null; label: null }
  | { type: "tag"; noteId: null; wikiArticleId: null; referenceId: null; templateId: null; attachmentId: null; bookId: null; tagId: string; stickerId: null; labelId: null; note: null; wikiArticle: null; reference: null; template: null; attachment: null; book: null; tag: Tag | null; sticker: null; label: null }
  | { type: "sticker"; noteId: null; wikiArticleId: null; referenceId: null; templateId: null; attachmentId: null; bookId: null; tagId: null; stickerId: string; labelId: null; note: null; wikiArticle: null; reference: null; template: null; attachment: null; book: null; tag: null; sticker: Sticker | null; label: null }
  | { type: "label"; noteId: null; wikiArticleId: null; referenceId: null; templateId: null; attachmentId: null; bookId: null; tagId: null; stickerId: null; labelId: string; note: null; wikiArticle: null; reference: null; template: null; attachment: null; book: null; tag: null; sticker: null; label: Label | null }
  | { type: null; noteId: null; wikiArticleId: null; referenceId: null; templateId: null; attachmentId: null; bookId: null; tagId: null; stickerId: null; labelId: null; note: null; wikiArticle: null; reference: null; template: null; attachment: null; book: null; tag: null; sticker: null; label: null }

const EMPTY: SidePanelEntityResult = {
  type: null,
  noteId: null,
  wikiArticleId: null,
  referenceId: null,
  templateId: null,
  attachmentId: null,
  bookId: null,
  tagId: null,
  stickerId: null,
  labelId: null,
  note: null,
  wikiArticle: null,
  reference: null,
  template: null,
  attachment: null,
  book: null,
  tag: null,
  sticker: null,
  label: null,
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
    return { type: "note" as const, noteId: id, wikiArticleId: null, referenceId: null, templateId: null, attachmentId: null, bookId: null, tagId: null, stickerId: null, labelId: null, note, wikiArticle: null, reference: null, template: null, attachment: null, book: null, tag: null, sticker: null, label: null }
  }
  const article = wikiArticles.find((a) => a.id === id) ?? null
  if (article) {
    return { type: "wiki" as const, noteId: null, wikiArticleId: id, referenceId: null, templateId: null, attachmentId: null, bookId: null, tagId: null, stickerId: null, labelId: null, note: null, wikiArticle: article, reference: null, template: null, attachment: null, book: null, tag: null, sticker: null, label: null }
  }
  return null
}

export function useSidePanelEntity(): SidePanelEntityResult {
  const sidePanelContext = usePlotStore((s) => s.sidePanelContext)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const references = usePlotStore((s) => s.references)
  const templates = usePlotStore((s) => s.templates ?? [])
  const attachments = usePlotStore((s) => s.attachments ?? [])
  const books = usePlotStore((s) => s.books ?? [])
  const tags = usePlotStore((s) => s.tags ?? [])
  const stickers = usePlotStore((s) => s.stickers ?? [])
  const labels = usePlotStore((s) => s.labels ?? [])

  // Reference
  if (sidePanelContext?.type === 'reference') {
    const ref = references[sidePanelContext.id] ?? null
    if (ref) {
      return { type: "reference" as const, noteId: null, wikiArticleId: null, referenceId: sidePanelContext.id, templateId: null, attachmentId: null, bookId: null, tagId: null, stickerId: null, labelId: null, note: null, wikiArticle: null, reference: ref, template: null, attachment: null, book: null, tag: null, sticker: null, label: null }
    }
  }

  // Template
  if (sidePanelContext?.type === 'template') {
    const tmpl = templates.find((t) => t.id === sidePanelContext.id) ?? null
    return { type: "template" as const, noteId: null, wikiArticleId: null, referenceId: null, templateId: sidePanelContext.id, attachmentId: null, bookId: null, tagId: null, stickerId: null, labelId: null, note: null, wikiArticle: null, reference: null, template: tmpl, attachment: null, book: null, tag: null, sticker: null, label: null }
  }

  // File (Attachment) — Library Files entity.
  if (sidePanelContext?.type === 'file') {
    const att = attachments.find((a: Attachment) => a.id === sidePanelContext.id) ?? null
    return { type: "file" as const, noteId: null, wikiArticleId: null, referenceId: null, templateId: null, attachmentId: sidePanelContext.id, bookId: null, tagId: null, stickerId: null, labelId: null, note: null, wikiArticle: null, reference: null, template: null, attachment: att, book: null, tag: null, sticker: null, label: null }
  }

  // Book
  if (sidePanelContext?.type === 'book') {
    const book = books.find((b: Book) => b.id === sidePanelContext.id) ?? null
    return { type: "book" as const, noteId: null, wikiArticleId: null, referenceId: null, templateId: null, attachmentId: null, bookId: sidePanelContext.id, tagId: null, stickerId: null, labelId: null, note: null, wikiArticle: null, reference: null, template: null, attachment: null, book, tag: null, sticker: null, label: null }
  }

  // Tag — Library Tags entity.
  if (sidePanelContext?.type === 'tag') {
    const tag = tags.find((t: Tag) => t.id === sidePanelContext.id) ?? null
    return { type: "tag" as const, noteId: null, wikiArticleId: null, referenceId: null, templateId: null, attachmentId: null, bookId: null, tagId: sidePanelContext.id, stickerId: null, labelId: null, note: null, wikiArticle: null, reference: null, template: null, attachment: null, book: null, tag, sticker: null, label: null }
  }

  // Sticker — Library Stickers entity.
  if (sidePanelContext?.type === 'sticker') {
    const sticker = stickers.find((s: Sticker) => s.id === sidePanelContext.id) ?? null
    return { type: "sticker" as const, noteId: null, wikiArticleId: null, referenceId: null, templateId: null, attachmentId: null, bookId: null, tagId: null, stickerId: sidePanelContext.id, labelId: null, note: null, wikiArticle: null, reference: null, template: null, attachment: null, book: null, tag: null, sticker, label: null }
  }

  // Label — Library Labels entity. Tag와 거의 동일 패턴.
  if (sidePanelContext?.type === 'label') {
    const label = labels.find((l: Label) => l.id === sidePanelContext.id) ?? null
    return { type: "label" as const, noteId: null, wikiArticleId: null, referenceId: null, templateId: null, attachmentId: null, bookId: null, tagId: null, stickerId: null, labelId: sidePanelContext.id, note: null, wikiArticle: null, reference: null, template: null, attachment: null, book: null, tag: null, sticker: null, label }
  }

  // Note or Wiki
  if (sidePanelContext?.type === 'wiki' || sidePanelContext?.type === 'note') {
    const result = resolveEntityById(sidePanelContext.id, notes, wikiArticles)
    if (result) return result
  }

  return EMPTY
}
