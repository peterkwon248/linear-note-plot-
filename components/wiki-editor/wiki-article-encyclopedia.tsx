"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, WikiBlock, WikiSectionIndex } from "@/lib/types"
import { WikiBlockRenderer, AddBlockButton } from "./wiki-block-renderer"
import { SortableBlockItem } from "./sortable-block-item"
import { ArticleCategories } from "./wiki-article-view"
import { WikiInfobox } from "@/components/editor/wiki-infobox"
import { cn } from "@/lib/utils"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { toast } from "sonner"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"

/* ── Section number computation (reused from wiki-article-view) ── */

function computeSectionNumbers(blocks: WikiBlock[]): Map<string, string> {
  const result = new Map<string, string>()
  const sectionBlocks = blocks.filter((b) => b.type === "section")
  if (sectionBlocks.length === 0) return result

  const minLevel = Math.min(...sectionBlocks.map((b) => b.level ?? 2))
  const counters: number[] = []

  for (const block of blocks) {
    if (block.type !== "section") continue
    const depth = (block.level ?? 2) - minLevel
    while (counters.length <= depth) counters.push(0)
    counters[depth]++
    for (let i = depth + 1; i < counters.length; i++) counters[i] = 0
    result.set(block.id, counters.slice(0, depth + 1).join("."))
  }
  return result
}

/* ── Collapsible TOC (inline, namu-wiki style) ── */

function CollapsibleTOC({ sections, sectionNumbers }: {
  sections: WikiSectionIndex[]
  sectionNumbers: Map<string, string>
}) {
  const [open, setOpen] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number | null>(null)

  // Base width for font scaling (default 300px = scale 1.0)
  const BASE_WIDTH = 300
  const fontScale = width ? Math.max(0.75, Math.min(1.5, width / BASE_WIDTH)) : 1

  // Right-edge resize (width only)
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const el = containerRef.current
    if (!el) return
    const startX = e.clientX
    const startW = el.offsetWidth

    const onMove = (ev: PointerEvent) => {
      const newW = Math.max(180, Math.min(600, startW + ev.clientX - startX))
      setWidth(newW)
    }
    const onUp = () => {
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
    }
    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }, [])

  // Corner resize (diagonal — width + font scale)
  const handleCornerResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const el = containerRef.current
    if (!el) return
    const startX = e.clientX
    const startW = el.offsetWidth

    const onMove = (ev: PointerEvent) => {
      const newW = Math.max(180, Math.min(600, startW + ev.clientX - startX))
      setWidth(newW)
    }
    const onUp = () => {
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
    }
    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }, [])

  if (sections.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="mb-6 rounded-lg border border-white/[0.08] bg-white/[0.02] inline-block min-w-[180px] relative"
      style={width ? { width } : { maxWidth: 400 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-3 w-full text-left"
      >
        <span className="font-bold text-white/80" style={{ fontSize: `${fontScale}rem` }}>Contents</span>
        <CaretDown
          size={14}
          weight="bold"
          className={cn(
            "text-white/40 transition-transform duration-200",
            !open && "-rotate-90"
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-3.5 space-y-1">
          {sections.map((s) => {
            const num = sectionNumbers.get(s.id) ?? ""
            return (
              <div
                key={s.id}
                style={{ paddingLeft: (s.level - 2) * 16 }}
              >
                <button
                  onClick={() => {
                    document.getElementById(`wiki-block-${s.id}`)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }}
                  className="text-accent/70 hover:text-accent transition-colors"
                  style={{ fontSize: `${Math.max(11, fontScale * 13)}px` }}
                >
                  {num}. {s.title}
                </button>
              </div>
            )
          })}
        </div>
      )}
      {/* Right-edge resize handle (width only) */}
      <div
        onPointerDown={handleResizeStart}
        className="absolute right-0 top-0 bottom-4 w-1.5 cursor-col-resize group hover:bg-accent/20 rounded-r-lg transition-colors"
      >
        <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-white/10 group-hover:bg-accent/50 transition-colors" />
      </div>
      {/* Corner resize handle (diagonal — scales font) */}
      <div
        onPointerDown={handleCornerResizeStart}
        className="absolute right-0 bottom-0 w-4 h-4 cursor-nwse-resize group hover:bg-accent/20 rounded-br-lg transition-colors"
      >
        <svg className="absolute right-1 bottom-1 text-white/15 group-hover:text-accent/50 transition-colors" width="6" height="6" viewBox="0 0 6 6">
          <path d="M6 0L6 6L0 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  )
}

/* ── Main Encyclopedia Layout ── */

interface WikiArticleEncyclopediaProps {
  article: WikiArticle
  isEditing: boolean
  onBack: () => void
}

export function WikiArticleEncyclopedia({ article, isEditing, onBack }: WikiArticleEncyclopediaProps) {
  const addWikiBlock = usePlotStore((s) => s.addWikiBlock)
  const removeWikiBlock = usePlotStore((s) => s.removeWikiBlock)
  const updateWikiBlock = usePlotStore((s) => s.updateWikiBlock)
  const reorderWikiBlocks = usePlotStore((s) => s.reorderWikiBlocks)
  const splitWikiArticle = usePlotStore((s) => s.splitWikiArticle)

  // Section numbers
  const sectionNumbers = useMemo(
    () => computeSectionNumbers(article.blocks),
    [article.blocks]
  )

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  // Add / delete blocks
  const handleAddBlock = useCallback((type: WikiBlock["type"], afterBlockId?: string, level?: number) => {
    if (type === "url") {
      const url = window.prompt("Enter URL:")
      if (!url) return
      addWikiBlock(article.id, { type: "url", url, urlTitle: "" }, afterBlockId)
      return
    }
    const block: Omit<WikiBlock, "id"> = { type }
    if (type === "section") { block.title = ""; block.level = level ?? 2 }
    if (type === "text") { block.content = "" }
    addWikiBlock(article.id, block, afterBlockId)
  }, [article.id, addWikiBlock])

  const handleDeleteBlock = useCallback((blockId: string) => {
    removeWikiBlock(article.id, blockId)
  }, [article.id, removeWikiBlock])

  // Split section to new article
  const handleSplitSection = useCallback((sectionBlockId: string) => {
    const blocks = article.blocks
    const sectionIdx = blocks.findIndex((b) => b.id === sectionBlockId)
    if (sectionIdx === -1) return

    const sectionBlock = blocks[sectionIdx]
    const sectionLevel = sectionBlock.level ?? 2

    const blockIds: string[] = [sectionBlockId]
    for (let i = sectionIdx + 1; i < blocks.length; i++) {
      const b = blocks[i]
      if (b.type === "section" && (b.level ?? 2) <= sectionLevel) break
      blockIds.push(b.id)
    }

    const title = sectionBlock.title || "Untitled Section"
    const newId = splitWikiArticle(article.id, blockIds, title)
    if (newId) {
      toast.success(`Moved "${title}" to new article`)
      navigateToWikiArticle(newId)
    }
  }, [article, splitWikiArticle])

  // Move section to existing article
  const handleMoveToArticle = useCallback((sectionBlockId: string, targetArticleId: string) => {
    const blocks = article.blocks
    const sectionIdx = blocks.findIndex((b) => b.id === sectionBlockId)
    if (sectionIdx === -1) return

    const sectionBlock = blocks[sectionIdx]
    const sectionLevel = sectionBlock.level ?? 2

    const blockIds: string[] = [sectionBlockId]
    if (sectionBlock.type === "section") {
      for (let i = sectionIdx + 1; i < blocks.length; i++) {
        const b = blocks[i]
        if (b.type === "section" && (b.level ?? 2) <= sectionLevel) break
        blockIds.push(b.id)
      }
    }

    const store = usePlotStore.getState()
    const targetArticle = store.wikiArticles.find((a) => a.id === targetArticleId)
    if (!targetArticle) return

    const blocksToMove = blocks.filter((b) => blockIds.includes(b.id))
    const remainingBlocks = blocks.filter((b) => !blockIds.includes(b.id))

    store.updateWikiArticle(targetArticleId, {
      blocks: [...targetArticle.blocks, ...blocksToMove],
    })
    store.updateWikiArticle(article.id, {
      blocks: remainingBlocks,
    })

    toast.success(`Moved ${blockIds.length} block(s) to "${targetArticle.title}"`)
  }, [article])

  // DnD handlers — simplified (reorder only, no split/move-to-article via drag)
  const handleDragStart = useCallback((_event: DragStartEvent) => {
    // reserved for future drag state if needed
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = article.blocks.findIndex((b) => b.id === active.id)
    const newIndex = article.blocks.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(
      article.blocks.map((b) => b.id),
      oldIndex,
      newIndex
    )
    reorderWikiBlocks(article.id, newOrder)
  }, [article, reorderWikiBlocks])

  // Collapse state: track collapsed sections locally (not persisted in encyclopedia view)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const toggleSection = useCallback((blockId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(blockId)) next.delete(blockId)
      else next.add(blockId)
      return next
    })
  }, [])

  // Build visible blocks respecting collapsed sections
  const visibleBlocks = useMemo(() => {
    const result: WikiBlock[] = []
    let collapsingLevel: number | null = null

    for (const block of article.blocks) {
      if (block.type === "section") {
        const level = block.level ?? 2
        if (collapsingLevel !== null && level <= collapsingLevel) {
          collapsingLevel = null
        }
        result.push(block)
        if (collapsedSections.has(block.id)) {
          collapsingLevel = level
        }
      } else if (collapsingLevel === null) {
        result.push(block)
      }
    }
    return result
  }, [article.blocks, collapsedSections])

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Category tag row — editable when isEditing */}
      <div className="px-10 pt-4 pb-2">
        <ArticleCategories
          articleId={article.id}
          categoryIds={article.categoryIds ?? []}
          editable={isEditing}
        />
      </div>

      {/* Title */}
      <div className="px-10 pt-2 pb-4">
        <h1 className="text-3xl font-bold text-white/90">{article.title}</h1>
        {article.aliases.length > 0 && (
          <p className="mt-1 text-note text-white/40">
            {article.aliases.join(", ")}
          </p>
        )}
      </div>

      {/* Main content area */}
      <div className="px-10 pb-8">
        {/* Infobox (float right) — editable when isEditing */}
        {(article.infobox.length > 0 || isEditing) && (
          <div className="float-right ml-6 mb-4 w-[320px]">
            <WikiInfobox
              noteId={article.id}
              entries={article.infobox}
              editable={isEditing}
            />
          </div>
        )}

        {/* TOC (collapsible) */}
        <CollapsibleTOC
          sections={article.sectionIndex}
          sectionNumbers={sectionNumbers}
        />

        {/* Block rendering */}
        {isEditing ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleBlocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {visibleBlocks.map((block) => {
                const num = block.type === "section" ? sectionNumbers.get(block.id) : undefined
                return (
                  <SortableBlockItem
                    key={block.id}
                    block={block}
                    editable={true}
                    sectionNumber={num}
                    articleId={article.id}
                    onUpdate={(patch) => updateWikiBlock(article.id, block.id, patch)}
                    onDelete={() => handleDeleteBlock(block.id)}
                    onSplitSection={handleSplitSection}
                    onMoveToArticle={handleMoveToArticle}
                    onAddBlock={(type, level) => handleAddBlock(type, block.id, level)}
                    variant="encyclopedia"
                    onToggleCollapse={() => toggleSection(block.id)}
                    collapsed={collapsedSections.has(block.id)}
                  />
                )
              })}
            </SortableContext>
          </DndContext>
        ) : (
          visibleBlocks.map((block) => {
            const num = block.type === "section" ? sectionNumbers.get(block.id) : undefined
            return (
              <WikiBlockRenderer
                key={block.id}
                block={block}
                editable={false}
                sectionNumber={num}
                variant="encyclopedia"
                onToggleCollapse={() => toggleSection(block.id)}
                collapsed={collapsedSections.has(block.id)}
              />
            )
          })
        )}

        {/* Add block at end when editing */}
        {isEditing && <AddBlockButton onAdd={(type) => handleAddBlock(type)} />}

        {/* Empty state */}
        {article.blocks.length === 0 && !isEditing && (
          <p className="py-8 text-center text-note text-white/40">
            This article has no content yet.
          </p>
        )}

        {/* Clear float */}
        <div className="clear-both" />
      </div>
    </div>
  )
}
