"use client"

/**
 * WikiInfoboxBlock — Phase 2-2-C wrapper.
 *
 * Thin adapter between the `WikiBlock` system and the existing `WikiInfobox`
 * component. Previously infobox data lived on `WikiArticle.infobox` (scalar)
 * and header color on `WikiArticle.infoboxHeaderColor`; now it lives on
 * `WikiBlock.fields` / `WikiBlock.headerColor` so the infobox behaves like
 * any other block (drag/delete/add via standard UI).
 *
 * 진실의 원천: docs/BRAINSTORM-2026-04-14-column-template-system.md
 */

import type { WikiBlock } from "@/lib/types"
import { WikiInfobox } from "@/components/editor/wiki-infobox"

export interface WikiInfoboxBlockProps {
  block: WikiBlock
  articleId: string
  editable?: boolean
  onUpdate?: (patch: Partial<Omit<WikiBlock, "id">>) => void
}

export function WikiInfoboxBlock({ block, articleId, editable = false, onUpdate }: WikiInfoboxBlockProps) {
  return (
    <WikiInfobox
      // `noteId` here is really the article id — WikiInfobox named the prop for
      // its original note-hosted use case. Safe because we pipe persistence via
      // onEntriesChange below (the store action path is skipped).
      noteId={articleId}
      entityType="wiki"
      entries={block.fields ?? []}
      editable={editable}
      headerColor={block.headerColor ?? null}
      onEntriesChange={editable ? (fields) => onUpdate?.({ fields }) : undefined}
      onHeaderColorChange={editable ? (color) => onUpdate?.({ headerColor: color }) : undefined}
    />
  )
}
