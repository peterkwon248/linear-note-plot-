"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { WikiBlock } from "@/lib/types"
import { WikiBlockRenderer, AddBlockButton } from "./wiki-block-renderer"

interface SortableBlockItemProps {
  block: WikiBlock
  editable?: boolean
  sectionNumber?: string
  onUpdate?: (patch: Partial<Omit<WikiBlock, "id">>) => void
  onDelete?: () => void
  onAddBlock?: (type: WikiBlock["type"], level?: number) => void
  /** Level of the nearest section block at/above this block, for Subsection affordance */
  nearestSectionLevel?: number
  /** Parent article ID — needed for unmerge and split operations */
  articleId?: string
  /** Callback to split this section into a new article */
  onSplitSection?: (blockId: string) => void
  /** Callback to move section to an existing article */
  onMoveToArticle?: (blockId: string, targetArticleId: string) => void
}

export function SortableBlockItem({
  block,
  editable,
  sectionNumber,
  onUpdate,
  onDelete,
  onAddBlock,
  nearestSectionLevel,
  articleId,
  onSplitSection,
  onMoveToArticle,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} id={`wiki-block-${block.id}`}>
      <WikiBlockRenderer
        block={block}
        editable={editable}
        sectionNumber={sectionNumber}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={listeners}
        articleId={articleId}
        onSplitSection={onSplitSection}
        onMoveToArticle={onMoveToArticle}
      />
      {editable && onAddBlock && (
        <AddBlockButton onAdd={onAddBlock} nearestSectionLevel={nearestSectionLevel} />
      )}
    </div>
  )
}
