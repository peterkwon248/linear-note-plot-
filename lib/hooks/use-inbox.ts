"use client"
import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { isWikiStub } from "@/lib/wiki-utils"
import type { EntityKind } from "@/lib/types"

export interface InboxItem {
  kind: EntityKind  // "note" | "wiki" | "reference" | "file"
  id: string
  title: string
  /** Original entity timestamp for sort (createdAt or updatedAt) */
  ts: string
  /** Optional secondary label (folder/tag/age 등 UI에서 사용) */
  meta?: string
}

export function useInbox(): InboxItem[] {
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const references = usePlotStore((s) => s.references)
  const attachments = usePlotStore((s) => s.attachments)
  const dismissedInboxItems = usePlotStore((s) => s.dismissedInboxItems)
  const snoozedInboxItems = usePlotStore((s) => s.snoozedInboxItems)

  return useMemo(() => {
    const now = new Date().toISOString()

    // Build dismiss/snooze lookup sets for O(1) checks
    const dismissedSet = new Set(
      dismissedInboxItems.map((item) => `${item.kind}:${item.id}`)
    )
    const snoozedSet = new Set(
      snoozedInboxItems
        .filter((item) => item.snoozedUntil > now)
        .map((item) => `${item.kind}:${item.id}`)
    )

    function isVisible(kind: EntityKind, id: string): boolean {
      const key = `${kind}:${id}`
      return !dismissedSet.has(key) && !snoozedSet.has(key)
    }

    const items: InboxItem[] = []

    // Notes: status === "stone" && !trashed && no folder && no tags && no label
    for (const note of notes) {
      if (
        note.status === "stone" &&
        !note.trashed &&
        note.folderIds.length === 0 &&
        note.tags.length === 0 &&
        !note.labelId &&
        isVisible("note", note.id)
      ) {
        items.push({
          kind: "note",
          id: note.id,
          title: note.title,
          ts: note.createdAt,
        })
      }
    }

    // Wiki stubs
    for (const article of wikiArticles) {
      if (isWikiStub(article) && isVisible("wiki", article.id)) {
        items.push({
          kind: "wiki",
          id: article.id,
          title: article.title,
          ts: article.createdAt,
        })
      }
    }

    // References: not linked by any note or wiki article, not trashed
    const linkedReferenceIds = new Set<string>()
    for (const note of notes) {
      for (const refId of note.referenceIds) {
        linkedReferenceIds.add(refId)
      }
    }
    for (const article of wikiArticles) {
      for (const refId of article.referenceIds ?? []) {
        linkedReferenceIds.add(refId)
      }
    }
    for (const ref of Object.values(references)) {
      if (
        !ref.trashed &&
        !linkedReferenceIds.has(ref.id) &&
        isVisible("reference", ref.id)
      ) {
        items.push({
          kind: "reference",
          id: ref.id,
          title: ref.title,
          ts: ref.createdAt,
        })
      }
    }

    // Files (Attachments): not trashed, not linked to a note
    for (const attachment of attachments) {
      if (
        !attachment.trashed &&
        (!attachment.noteId || attachment.noteId === "") &&
        isVisible("file", attachment.id)
      ) {
        items.push({
          kind: "file",
          id: attachment.id,
          title: attachment.name,
          ts: attachment.createdAt,
        })
      }
    }

    // Sort by ts desc (newest first)
    items.sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0))

    return items
  }, [notes, wikiArticles, references, attachments, dismissedInboxItems, snoozedInboxItems])
}
