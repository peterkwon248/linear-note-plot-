/**
 * extract-attachment-refs — file-entity-prd §3.
 *
 * Usage index = derived from content, not stored separately. A file's
 * "Used in N notes / M wikis" stat is computed by walking the relevant
 * ProseMirror JSON trees (note.contentJson + wiki text-block contentJson)
 * for `attachment://<id>` URIs, plus the direct `WikiBlock.attachmentId`
 * field on image blocks.
 *
 * Why derive and not persist:
 *   - Content mutations are the only source of usage change. React memo
 *     keeps recompute cost trivial.
 *   - A persisted reverse index would have to be kept in sync with every
 *     content edit — high sync cost for low payoff (UX shows usage in a
 *     side panel, not a hot path).
 *
 * If perf shows up on huge corpora the PRD §7 Q3 fallback is a lazy
 * compute on detail-panel open.
 */

import { parseAttachmentUrl } from "./use-attachment-url"
import type { WikiBlock, Note, WikiArticle } from "./types"

/**
 * Walk a ProseMirror JSON tree and collect every attachment ID referenced
 * via `attachment://<id>` URIs (image `src`, link `href`, mark `href`, etc.).
 *
 * Returns deduplicated IDs in insertion order. Safe to call with `null`,
 * `undefined`, or any non-object input.
 */
export function extractAttachmentRefs(node: unknown): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  const tryPush = (s: unknown) => {
    if (typeof s !== "string") return
    const id = parseAttachmentUrl(s)
    if (id && !seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }

  const walk = (n: any): void => {
    if (!n || typeof n !== "object") return
    if (n.attrs) {
      tryPush(n.attrs.src)
      tryPush(n.attrs.href)
    }
    if (Array.isArray(n.marks)) {
      for (const m of n.marks) {
        if (m?.attrs) tryPush(m.attrs.href)
      }
    }
    if (Array.isArray(n.content)) {
      for (const c of n.content) walk(c)
    }
  }

  walk(node)
  return out
}

/**
 * Wiki-blocks variant: scans both
 *   1. `image` block `attachmentId` (direct ref)
 *   2. `text` block `contentJson` (ProseMirror tree)
 *
 * `image` is by far the common case; text-block scanning covers inline
 * file links inside Tiptap content authored from the same insert-menu
 * path used by notes.
 */
export function extractAttachmentRefsFromWikiBlocks(blocks: WikiBlock[] | undefined): string[] {
  if (!blocks || blocks.length === 0) return []
  const seen = new Set<string>()
  const out: string[] = []
  const pushUnique = (id: string) => {
    if (!seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  for (const b of blocks) {
    if (b.type === "image" && b.attachmentId) pushUnique(b.attachmentId)
    if (b.type === "text" && b.contentJson) {
      for (const id of extractAttachmentRefs(b.contentJson)) pushUnique(id)
    }
  }
  return out
}

/**
 * findAttachmentUsage — file-entity-prd §5 helper for hard-delete warnings.
 *
 * Returns the live notes + wiki articles that currently reference the given
 * attachment id. Skips trashed entities (a trashed note that references the
 * file isn't blocking — restoring it would resurrect a dangling ref, but
 * that's an existing UX problem the §5 graceful fallback handles).
 *
 * Cost is O(N) over the corpus per call. v1 callers are confirm-dialog
 * paths so the perf budget is generous; bulk-delete with N>10k attachments
 * is a fast-follow concern.
 */
export function findAttachmentUsage(
  attachmentId: string,
  notes: Note[],
  wikiArticles: WikiArticle[],
): { notes: Note[]; wikis: WikiArticle[] } {
  const usedNotes = notes.filter((n) => {
    if (n.trashed) return false
    if (!n.contentJson) return false
    return extractAttachmentRefs(n.contentJson).includes(attachmentId)
  })
  const usedWikis = wikiArticles.filter((a) => {
    if ((a as { trashed?: boolean }).trashed) return false
    return extractAttachmentRefsFromWikiBlocks(a.blocks).includes(attachmentId)
  })
  return { notes: usedNotes, wikis: usedWikis }
}

/**
 * buildAttachmentDeleteWarning — composes the user-facing warning string for
 * `window.confirm` (PRD §5). Returns `null` when the file has no live
 * references — caller falls back to the generic delete prompt.
 */
export function buildAttachmentDeleteWarning(
  attachmentId: string,
  attachmentName: string,
  notes: Note[],
  wikiArticles: WikiArticle[],
): string | null {
  const { notes: usedNotes, wikis: usedWikis } = findAttachmentUsage(attachmentId, notes, wikiArticles)
  const total = usedNotes.length + usedWikis.length
  if (total === 0) return null
  const lines: string[] = []
  if (usedNotes.length > 0) {
    const titles = usedNotes.slice(0, 5).map((n) => `  • ${n.title || "Untitled"}`).join("\n")
    const more = usedNotes.length > 5 ? `\n  • …and ${usedNotes.length - 5} more` : ""
    lines.push(`${usedNotes.length} note${usedNotes.length === 1 ? "" : "s"}:\n${titles}${more}`)
  }
  if (usedWikis.length > 0) {
    const titles = usedWikis.slice(0, 5).map((a) => `  • ${a.title || "Untitled"}`).join("\n")
    const more = usedWikis.length > 5 ? `\n  • …and ${usedWikis.length - 5} more` : ""
    lines.push(`${usedWikis.length} wiki article${usedWikis.length === 1 ? "" : "s"}:\n${titles}${more}`)
  }
  return (
    `"${attachmentName}" is still used in ${total} item${total === 1 ? "" : "s"}.\n\n` +
    lines.join("\n\n") +
    `\n\nDeleting will leave broken references. Permanently delete anyway?`
  )
}
