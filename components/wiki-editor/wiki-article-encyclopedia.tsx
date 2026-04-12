"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, WikiBlock, WikiSectionIndex } from "@/lib/types"
import { WikiBlockRenderer, AddBlockButton } from "./wiki-block-renderer"
import { SortableBlockItem } from "./sortable-block-item"
import { InlineCategoryTags } from "./wiki-article-view"
import { WikiInfobox } from "@/components/editor/wiki-infobox"
import { UrlInputDialog } from "@/components/editor/url-input-dialog"
import { WikiFootnotesSection, WikiReferencesSection } from "./wiki-footnotes-section"
import { cn } from "@/lib/utils"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { computeSectionNumbers, getInitialContentJson, buildVisibleBlocks } from "@/lib/wiki-block-utils"
import { useWikiBlockActions } from "@/hooks/use-wiki-block-actions"
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

/* ── Collapsible TOC (inline, namu-wiki style) ── */

function CollapsibleTOC({ sections, sectionNumbers }: {
  sections: WikiSectionIndex[]
  sectionNumbers: Map<string, string>
}) {
  const [open, setOpen] = useState(true)

  if (sections.length === 0) return null

  return (
    <div className="mb-6 rounded-lg border border-white/[0.08] bg-white/[0.02] max-w-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-3 w-full text-left"
      >
        <span className="font-bold text-white/80">Contents</span>
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
                >
                  {num}. {s.title}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Main Encyclopedia Layout ── */

interface WikiArticleEncyclopediaProps {
  article: WikiArticle
  isEditing: boolean
  onBack: () => void
  collapseAllCmd?: "collapse" | "expand" | null
  onCollapseAllDone?: () => void
  onAllCollapsedChange?: (allCollapsed: boolean) => void
  fontSize?: number
}

export function WikiArticleEncyclopedia({ article, isEditing, onBack, collapseAllCmd, onCollapseAllDone, onAllCollapsedChange, fontSize }: WikiArticleEncyclopediaProps) {
  const updateWikiBlock = usePlotStore((s) => s.updateWikiBlock)
  const reorderWikiBlocks = usePlotStore((s) => s.reorderWikiBlocks)

  const { addWikiBlock, handleAddBlock, handleDeleteBlock, handleSplitSection, handleMoveToArticle, urlBlockDialog, setUrlBlockDialog } = useWikiBlockActions(article.id)

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

  // Footnote offset tracking
  const [footnoteCounts, setFootnoteCounts] = useState<Map<string, number>>(new Map())

  const handleFootnoteCount = useCallback((blockId: string, count: number) => {
    setFootnoteCounts(prev => {
      if (prev.get(blockId) === count) return prev
      const next = new Map(prev)
      next.set(blockId, count)
      return next
    })
  }, [])

  const footnoteOffsets = useMemo(() => {
    const offsets = new Map<string, number>()
    let cumulative = 0
    for (const block of article.blocks) {
      offsets.set(block.id, cumulative)
      if (block.type === "text") {
        cumulative += (footnoteCounts.get(block.id) ?? 0)
      }
    }
    return offsets
  }, [article.blocks, footnoteCounts])

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

  // Handle collapse/expand all command from parent
  const sectionBlockIds = useMemo(
    () => article.blocks.filter((b) => b.type === "section").map((b) => b.id),
    [article.blocks]
  )

  useEffect(() => {
    if (!collapseAllCmd) return
    if (collapseAllCmd === "collapse") {
      setCollapsedSections(new Set(sectionBlockIds))
    } else {
      setCollapsedSections(new Set())
    }
    onCollapseAllDone?.()
  }, [collapseAllCmd, sectionBlockIds, onCollapseAllDone])

  // Report allCollapsed state to parent
  useEffect(() => {
    const allCollapsed = sectionBlockIds.length > 0 && sectionBlockIds.every((id) => collapsedSections.has(id))
    onAllCollapsedChange?.(allCollapsed)
  }, [collapsedSections, sectionBlockIds, onAllCollapsedChange])

  // Build visible blocks respecting collapsed sections
  const visibleBlocks = useMemo(
    () => buildVisibleBlocks(article.blocks, (id) => collapsedSections.has(id)),
    [article.blocks, collapsedSections]
  )

  return (
    <div className="flex-1 overflow-y-auto" style={fontSize ? { fontSize: `${fontSize}em` } : undefined}>
      {/* Title (editable) */}
      <div className={cn("px-10 pt-4 pb-2", article.contentAlign === "center" && "max-w-4xl mx-auto")}>
        {isEditing ? (
          <input
            defaultValue={article.title}
            onBlur={(e) => {
              const v = e.target.value.trim()
              if (v && v !== article.title) {
                usePlotStore.getState().updateWikiArticle(article.id, { title: v })
              }
            }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
            className="text-3xl font-bold text-white/90 bg-transparent outline-none border-b border-transparent hover:border-accent/30 focus:border-accent/50 w-full transition-colors"
          />
        ) : (
          <h1 className="text-3xl font-bold text-white/90">{article.title}</h1>
        )}
        {isEditing ? (
          <input
            defaultValue={article.aliases.join(", ")}
            placeholder="Aliases (comma separated)"
            onBlur={(e) => {
              const aliases = e.target.value.split(",").map(s => s.trim()).filter(Boolean)
              usePlotStore.getState().updateWikiArticle(article.id, { aliases })
            }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
            className="mt-1 text-note text-white/40 bg-transparent outline-none border-b border-transparent hover:border-accent/30 focus:border-accent/50 w-full transition-colors"
          />
        ) : article.aliases.length > 0 ? (
          <p className="mt-1 text-note text-white/40">
            {article.aliases.join(", ")}
          </p>
        ) : null}
      </div>

      {/* Category tag row — below title */}
      <div className={cn("px-10 pb-4", article.contentAlign === "center" && "max-w-4xl mx-auto")}>
        <InlineCategoryTags
          articleId={article.id}
          categoryIds={article.categoryIds ?? []}
          editable={isEditing}
        />
      </div>

      {/* Main content area */}
      <div className={cn("px-10 pb-8", article.contentAlign === "center" && "max-w-4xl mx-auto")}>
        {article.contentAlign === "center" ? (
          <>
            {/* Center mode: stack vertically — Infobox → TOC → blocks */}
            {(article.infobox.length > 0 || isEditing) && (
              <div className="mb-6 max-w-sm">
                <WikiInfobox
                  noteId={article.id}
                  entries={article.infobox}
                  editable={isEditing}
                />
              </div>
            )}
            <CollapsibleTOC
              sections={article.sectionIndex}
              sectionNumbers={sectionNumbers}
            />
            <div className="mt-8" />
          </>
        ) : (
          <>
            {/* Left mode: float infobox right, TOC inline */}
            {(article.infobox.length > 0 || isEditing) && (
              <div className="float-right ml-6 mb-4 w-[320px]">
                <WikiInfobox
                  noteId={article.id}
                  entries={article.infobox}
                  editable={isEditing}
                />
              </div>
            )}
            <CollapsibleTOC
              sections={article.sectionIndex}
              sectionNumbers={sectionNumbers}
            />
            <div className="clear-both mt-8" />
          </>
        )}

        {/* Add block at top when editing */}
        {isEditing && <AddBlockButton onAdd={(type, level) => handleAddBlock(type, "__prepend__", level)} />}

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
                    footnoteStartOffset={footnoteOffsets.get(block.id) ?? 0}
                    onFootnoteCount={handleFootnoteCount}
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
                footnoteStartOffset={footnoteOffsets.get(block.id) ?? 0}
                onFootnoteCount={handleFootnoteCount}
              />
            )
          })
        )}

        {/* Add block at end when editing */}
        {isEditing && <AddBlockButton onAdd={(type, level) => handleAddBlock(type, undefined, level)} />}

        {/* Empty state */}
        {article.blocks.length === 0 && !isEditing && (
          <p className="py-8 text-center text-note text-white/40">
            This article has no content yet.
          </p>
        )}

        {/* Clear float */}
        <div className="clear-both" />

        {/* Wiki-level footnotes (Wikipedia style) */}
        <WikiFootnotesSection article={article} />
        <WikiReferencesSection article={article} editable={isEditing} />
      </div>
      <UrlInputDialog
        open={urlBlockDialog.open}
        mode="link"
        onClose={() => setUrlBlockDialog({ open: false })}
        onSubmit={(url) => {
          addWikiBlock(article.id, { type: "url", url, urlTitle: "" }, urlBlockDialog.afterBlockId)
          setUrlBlockDialog({ open: false })
        }}
      />
    </div>
  )
}

