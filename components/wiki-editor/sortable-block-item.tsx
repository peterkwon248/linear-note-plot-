"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useSortable } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import type { WikiBlock } from "@/lib/types"
import { usePlotStore } from "@/lib/store"
import { WikiBlockRenderer, AddBlockButton } from "./wiki-block-renderer"
import type { WikiBlockVariant } from "./wiki-block-renderer"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"

interface SortableBlockItemProps {
  block: WikiBlock
  editable?: boolean
  sectionNumber?: string
  onUpdate?: (patch: Partial<Omit<WikiBlock, "id">>) => void
  onDelete?: () => void
  onAddBlock?: (type: string, level?: number) => void
  /** Level of the nearest section block at/above this block, for Subsection affordance */
  nearestSectionLevel?: number
  /** Parent article ID — needed for unmerge and split operations */
  articleId?: string
  /** Callback to split this section into a new article */
  onSplitSection?: (blockId: string) => void
  /** Callback to move section to an existing article */
  onMoveToArticle?: (blockId: string, targetArticleId: string) => void
  /** Layout variant passed through to WikiBlockRenderer */
  variant?: WikiBlockVariant
  /** For encyclopedia variant: toggle collapsed state of a section */
  onToggleCollapse?: () => void
  /** For encyclopedia variant: whether section is currently collapsed */
  collapsed?: boolean
  /** Footnote number offset for wiki-level sequential numbering */
  footnoteStartOffset?: number
  /** Report how many footnoteRef nodes this block contains (for offset calculation) */
  onFootnoteCount?: (blockId: string, count: number) => void
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
  variant,
  onToggleCollapse,
  collapsed,
  footnoteStartOffset,
  onFootnoteCount,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  // Phase 3.1-B: Side drop zones for Notion-style column-group creation.
  // When a block is dragged over the left/right 15% of another block,
  // it signals intent to place side-by-side (column-group).
  // Skip for section blocks (don't make sense inside column-groups) and column-groups themselves.
  const enableSideDrop = editable && block.type !== "column-group"

  // Phase 3.1-B: "+" button on right edge — opens block type menu, then wraps selected block beside this one
  const wrapInColumnGroup = usePlotStore((s) => s.wrapInColumnGroup)
  const addWikiBlock = usePlotStore((s) => s.addWikiBlock)
  const [sideMenuPos, setSideMenuPos] = useState<{ x: number; y: number } | null>(null)
  const sideMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sideMenuPos) return
    const close = (e: globalThis.MouseEvent) => {
      if (sideMenuRef.current?.contains(e.target as Node)) return
      setSideMenuPos(null)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [sideMenuPos])

  const handleSideMenuSelect = (type: string, level?: number) => {
    if (!articleId) return
    const blockData: Partial<Omit<WikiBlock, "id">> & { type: WikiBlock["type"] } = { type: type as WikiBlock["type"] }
    if (type === "section") { blockData.title = ""; blockData.level = level ?? 2 }
    if (type === "text") { blockData.content = "" }
    if (type === "infobox") { blockData.fields = []; blockData.headerColor = null }
    if (type === "toc") { blockData.tocCollapsed = false }
    if (type === "pull-quote") { blockData.quoteText = "" }
    const newBlockId = addWikiBlock(articleId, blockData)
    if (newBlockId) wrapInColumnGroup(articleId, block.id, newBlockId, "right")
    setSideMenuPos(null)
  }

  const { setNodeRef: setLeftRef, isOver: isOverLeft } = useDroppable({
    id: enableSideDrop ? `side-left-${block.id}` : "__disabled_left__",
    disabled: !enableSideDrop,
  })
  const { setNodeRef: setRightRef, isOver: isOverRight } = useDroppable({
    id: enableSideDrop ? `side-right-${block.id}` : "__disabled_right__",
    disabled: !enableSideDrop,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} id={`wiki-block-${block.id}`} className="group/sortable relative">
      {/* Phase 3.1-B: "+" button on right edge — click opens block type menu */}
      {enableSideDrop && (
        <button
          type="button"
          onClick={(e) => {
            const x = Math.min(e.clientX, window.innerWidth - 200)
            const y = Math.min(e.clientY, window.innerHeight - 350)
            setSideMenuPos({ x, y })
          }}
          title="Add block to the right"
          className="absolute -right-3 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-border-subtle bg-surface-overlay text-muted-foreground opacity-0 shadow-sm transition-opacity hover:bg-accent/10 hover:text-accent hover:border-accent/40 group-hover/sortable:opacity-60"
        >
          <PhPlus size={10} weight="bold" />
        </button>
      )}
      {/* Side menu portal — block type picker for "add to right" */}
      {sideMenuPos && typeof document !== "undefined" && createPortal(
        <div
          ref={sideMenuRef}
          className="fixed z-[70] min-w-[180px] rounded-lg border border-border-subtle bg-surface-overlay py-1 shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
          style={{ top: sideMenuPos.y, left: sideMenuPos.x }}
        >
          {[
            { type: "text", label: "Text" },
            { type: "image", label: "Image" },
            { type: "section", label: "Section" },
            { type: "infobox", label: "Infobox" },
            { type: "toc", label: "TOC" },
            { type: "pull-quote", label: "Pull Quote" },
            { type: "note-ref", label: "Note" },
            { type: "url", label: "URL" },
            { type: "table", label: "Table" },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => handleSideMenuSelect(item.type)}
              className="flex w-full items-center px-3 py-1.5 text-left text-note transition-colors hover:bg-hover-bg"
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
      {/* Phase 3.1-B: Left side drop zone — 15% width, invisible normally, highlighted on hover */}
      {enableSideDrop && (
        <div
          ref={setLeftRef}
          className={`absolute left-0 top-0 bottom-0 w-[15%] z-5 transition-colors rounded-l-md ${
            isOverLeft ? "bg-accent/15 ring-2 ring-inset ring-accent/40" : ""
          }`}
          style={{ pointerEvents: "none" }} // pass-through — dnd-kit handles detection via setNodeRef
        />
      )}
      {/* Phase 3.1-B: Right side drop zone */}
      {enableSideDrop && (
        <div
          ref={setRightRef}
          className={`absolute right-0 top-0 bottom-0 w-[15%] z-5 transition-colors rounded-r-md ${
            isOverRight ? "bg-accent/15 ring-2 ring-inset ring-accent/40" : ""
          }`}
          style={{ pointerEvents: "none" }}
        />
      )}
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
        variant={variant}
        onToggleCollapse={onToggleCollapse}
        collapsed={collapsed}
        footnoteStartOffset={footnoteStartOffset}
        onFootnoteCount={onFootnoteCount}
      />
      {editable && onAddBlock && (
        <AddBlockButton onAdd={onAddBlock} nearestSectionLevel={nearestSectionLevel} />
      )}
    </div>
  )
}
