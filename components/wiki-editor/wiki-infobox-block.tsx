"use client"

/**
 * WikiInfoboxBlock — Phase 2-2-C wrapper.
 *
 * Thin adapter between the `WikiBlock` system and the existing `WikiInfobox`
 * component. Infobox data lives on `WikiBlock.fields` / `WikiBlock.headerColor`
 * so the infobox behaves like any other block (drag/delete/add via standard UI).
 */

import type { WikiBlock } from "@/lib/types"
import { WikiInfobox } from "@/components/editor/wiki-infobox"
import type { DraggableSyntheticListeners } from "@dnd-kit/core"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"

export interface WikiInfoboxBlockProps {
  block: WikiBlock
  articleId: string
  editable?: boolean
  onUpdate?: (patch: Partial<Omit<WikiBlock, "id">>) => void
  onDelete?: () => void
  dragHandleProps?: DraggableSyntheticListeners
}

export function WikiInfoboxBlock({ block, articleId, editable = false, onUpdate, onDelete, dragHandleProps }: WikiInfoboxBlockProps) {
  return (
    <div className="group/infobox-block relative">
      {/* Drag handle — same pattern as other wiki blocks */}
      {editable && dragHandleProps && (
        <div
          className="absolute -left-7 top-2 z-10 flex h-6 w-6 cursor-grab items-center justify-center rounded-md text-muted-foreground/0 transition-colors group-hover/infobox-block:text-muted-foreground/40 hover:!text-muted-foreground active:cursor-grabbing"
          {...dragHandleProps}
        >
          <DotsSixVertical size={14} weight="bold" />
        </div>
      )}
      <WikiInfobox
        noteId={articleId}
        entityType="wiki"
        entries={block.fields ?? []}
        editable={editable}
        headerColor={block.headerColor ?? null}
        onEntriesChange={editable ? (fields) => onUpdate?.({ fields }) : undefined}
        onHeaderColorChange={editable ? (color) => onUpdate?.({ headerColor: color }) : undefined}
      />
    </div>
  )
}
