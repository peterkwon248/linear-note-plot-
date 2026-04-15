"use client"

/**
 * WikiArticleRenderer — Phase 2-1B-2 (editable 흡수 완료).
 *
 * Unified renderer for wiki articles — both read-only and editable modes.
 * Built on ColumnRenderer + WikiTitle + WikiThemeProvider infrastructure.
 *
 * Replaces `wiki-article-view.tsx` (Default, 1220줄) + `wiki-article-encyclopedia.tsx`
 * (Encyclopedia, 406줄). Phase 2-1B-3 will delete the legacy renderers.
 *
 * Used by:
 *   - `components/views/wiki-view.tsx`
 *   - `components/workspace/secondary-panel-content.tsx`
 *   - `components/editor/nodes/wiki-embed-node.tsx`
 *   - `components/editor/note-hover-preview.tsx`
 *
 * 진실의 원천: docs/BRAINSTORM-2026-04-14-column-template-system.md
 */

import { useMemo, useState, useCallback, useEffect, type ReactNode, Fragment } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, WikiBlock, ColumnPath, ColumnStructure } from "@/lib/types"
import { WikiBlockRenderer, AddBlockButton, type WikiBlockVariant } from "./wiki-block-renderer"
import { SortableBlockItem } from "./sortable-block-item"
import { InlineCategoryTags } from "./inline-category-tags"
import { WikiInfobox } from "@/components/editor/wiki-infobox"
import { UrlInputDialog } from "@/components/editor/url-input-dialog"
import { WikiFootnotesSection, WikiReferencesSection } from "./wiki-footnotes-section"
import { ColumnRenderer, pathKey } from "./column-renderer"
import { WikiTitle } from "./wiki-title"
import { WikiThemeProvider } from "./wiki-theme-provider"
import { computeSectionNumbers, buildVisibleBlocks } from "@/lib/wiki-block-utils"
import { useWikiBlockActions } from "@/hooks/use-wiki-block-actions"
import { toast } from "sonner"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { cn } from "@/lib/utils"

export interface WikiArticleRendererProps {
  articleId: string
  /** Edit mode — enables SortableContext, AddBlockButton, splitMode, DnD, editable Title/Aliases/Infobox. */
  editable?: boolean
  /**
   * Variant influences block-level heading styles (encyclopedia = namu-wiki style numbered headings).
   * Layout structure itself comes from `article.layout`.
   */
  variant?: WikiBlockVariant
  /** Optional global font scale (em multiplier applied via inline style). */
  fontSize?: number
  /** Hide the title area (used by hover preview / embed when title shown elsewhere). */
  hideTitle?: boolean
  /** Hide the categories row. */
  hideCategories?: boolean
  /** Hide footnotes/references sections (compact preview mode). */
  hideFootnotes?: boolean
  /** Optional className applied to the outermost wrapper. */
  className?: string
  /** Optional padding override (default reads sensible per-variant). */
  padding?: string
  /** Optional collapse/expand all command from parent. */
  collapseAllCmd?: "collapse" | "expand" | null
  onCollapseAllDone?: () => void
  /** Report whether all sections are collapsed (editor header uses this). */
  onAllCollapsedChange?: (allCollapsed: boolean) => void
  /** Edit mode only — called when user clicks the Delete action after selecting blocks via splitMode. */
  onDelete?: () => void
}

/* ── Public component ─────────────────────────────────────────── */

export function WikiArticleRenderer(props: WikiArticleRendererProps) {
  const article = usePlotStore((s) => s.wikiArticles.find((a) => a.id === props.articleId))

  if (!article) {
    return (
      <div className={cn("flex-1 flex items-center justify-center text-muted-foreground/40 text-note", props.className)}>
        Article not found
      </div>
    )
  }

  return <WikiArticleRendererInner {...props} article={article} />
}

/* ── Inner (article guaranteed non-null) ──────────────────────── */

function WikiArticleRendererInner({
  article,
  articleId,
  editable = false,
  variant = "default",
  fontSize,
  hideTitle = false,
  hideCategories = false,
  hideFootnotes = false,
  className,
  padding,
  collapseAllCmd,
  onCollapseAllDone,
  onAllCollapsedChange,
  onDelete,
}: WikiArticleRendererProps & { article: WikiArticle }) {
  const updateWikiBlock = usePlotStore((s) => s.updateWikiBlock)
  const reorderWikiBlocks = usePlotStore((s) => s.reorderWikiBlocks)
  const splitWikiArticle = usePlotStore((s) => s.splitWikiArticle)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  const {
    addWikiBlock,
    handleAddBlock,
    handleDeleteBlock,
    handleSplitSection,
    handleMoveToArticle,
    urlBlockDialog,
    setUrlBlockDialog,
  } = useWikiBlockActions(articleId)

  /* ── Section numbers + visible blocks ── */
  const sectionNumbers = useMemo(() => computeSectionNumbers(article.blocks), [article.blocks])

  // Collapsed state: read-mode uses local Set, edit-mode derives from block.collapsed
  const initialCollapsed = useMemo(() => {
    const s = new Set<string>()
    for (const b of article.blocks) {
      if (b.type === "section" && b.collapsed) s.add(b.id)
    }
    return s
  }, [article.blocks])
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(initialCollapsed)
  const toggleSection = useCallback(
    (blockId: string) => {
      if (editable) {
        // Persist to block.collapsed in edit mode
        const block = article.blocks.find((b) => b.id === blockId)
        if (block) updateWikiBlock(articleId, blockId, { collapsed: !block.collapsed })
      }
      setCollapsedSections((prev) => {
        const next = new Set(prev)
        if (next.has(blockId)) next.delete(blockId)
        else next.add(blockId)
        return next
      })
    },
    [editable, article.blocks, articleId, updateWikiBlock],
  )

  // collapseAllCmd from parent
  const sectionBlockIds = useMemo(
    () => article.blocks.filter((b) => b.type === "section").map((b) => b.id),
    [article.blocks],
  )
  useEffect(() => {
    if (!collapseAllCmd) return
    setCollapsedSections(collapseAllCmd === "collapse" ? new Set(sectionBlockIds) : new Set())
    onCollapseAllDone?.()
  }, [collapseAllCmd, sectionBlockIds, onCollapseAllDone])

  // Report allCollapsed to parent
  useEffect(() => {
    if (!onAllCollapsedChange) return
    const allCollapsed = sectionBlockIds.length > 0 && sectionBlockIds.every((id) => collapsedSections.has(id))
    onAllCollapsedChange(allCollapsed)
  }, [collapsedSections, sectionBlockIds, onAllCollapsedChange])

  const visibleBlocks = useMemo(
    () => buildVisibleBlocks(article.blocks, (id) => collapsedSections.has(id)),
    [article.blocks, collapsedSections],
  )
  const visibleBlockIdSet = useMemo(() => new Set(visibleBlocks.map((b) => b.id)), [visibleBlocks])

  /* ── Nearest section level (editable only — used for heading nesting UI) ── */
  const nearestSectionLevelByBlockId = useMemo(() => {
    const result = new Map<string, number>()
    let currentLevel: number | undefined
    for (const block of article.blocks) {
      if (block.type === "section") currentLevel = block.level ?? 2
      if (currentLevel !== undefined) result.set(block.id, currentLevel)
    }
    return result
  }, [article.blocks])

  /* ── Footnote offsets ── */
  const [footnoteCounts, setFootnoteCounts] = useState<Map<string, number>>(new Map())
  const handleFootnoteCount = useCallback((blockId: string, count: number) => {
    setFootnoteCounts((prev) => {
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
      if (block.type === "text") cumulative += footnoteCounts.get(block.id) ?? 0
    }
    return offsets
  }, [article.blocks, footnoteCounts])

  /* ── Split mode (edit only) ── */
  const [splitMode, setSplitMode] = useState(false)
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
  const [splitTitle, setSplitTitle] = useState("")

  const exitSplitMode = useCallback(() => {
    setSplitMode(false)
    setSelectedBlockIds(new Set())
    setSplitTitle("")
  }, [])

  const confirmSplit = useCallback(() => {
    if (selectedBlockIds.size === 0 || !splitTitle.trim()) return
    const newId = splitWikiArticle(articleId, Array.from(selectedBlockIds), splitTitle.trim())
    if (newId) {
      toast.success(`Split "${splitTitle.trim()}" from "${article.title}"`)
      exitSplitMode()
      navigateToWikiArticle(newId)
    }
  }, [articleId, article.title, selectedBlockIds, splitTitle, splitWikiArticle, exitSplitMode])

  /* ── Drag state (edit only — cross-article drag) ── */
  const [isDragging, setIsDragging] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [dragOverDropzone, setDragOverDropzone] = useState(false)
  const [dragOverArticleId, setDragOverArticleId] = useState<string | null>(null)
  const [dragSplitPrompt, setDragSplitPrompt] = useState<{ blockId: string; defaultTitle: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const otherArticles = useMemo(
    () => wikiArticles.filter((a) => a.id !== articleId),
    [wikiArticles, articleId],
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setIsDragging(true)
    setActiveDragId(String(event.active.id))
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null
    setDragOverDropzone(overId === "split-dropzone")
    if (overId?.startsWith("drop-article-")) {
      setDragOverArticleId(overId.slice("drop-article-".length))
    } else {
      setDragOverArticleId(null)
    }
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragging(false)
      setActiveDragId(null)
      setDragOverDropzone(false)
      setDragOverArticleId(null)

      const { active, over } = event
      if (!over) return
      const activeId = String(active.id)
      const overId = String(over.id)

      // Split to new article
      if (overId === "split-dropzone") {
        const block = article.blocks.find((b) => b.id === activeId)
        const defaultTitle = block?.type === "section" ? block.title ?? "Untitled" : "Untitled"
        setDragSplitPrompt({ blockId: activeId, defaultTitle })
        return
      }

      // Move to another article
      if (overId.startsWith("drop-article-")) {
        const targetId = overId.slice("drop-article-".length)
        handleMoveToArticle(activeId, targetId)
        return
      }

      // Reorder within same article
      if (activeId === overId) return
      const oldIndex = article.blocks.findIndex((b) => b.id === activeId)
      const newIndex = article.blocks.findIndex((b) => b.id === overId)
      if (oldIndex === -1 || newIndex === -1) return
      const newOrder = arrayMove(article.blocks.map((b) => b.id), oldIndex, newIndex)
      reorderWikiBlocks(articleId, newOrder)
    },
    [article.blocks, articleId, reorderWikiBlocks, handleMoveToArticle],
  )

  const handleConfirmDragSplit = useCallback(() => {
    if (!dragSplitPrompt) return
    const title = dragSplitPrompt.defaultTitle.trim() || "Untitled"
    const newId = splitWikiArticle(articleId, [dragSplitPrompt.blockId], title)
    if (newId) {
      toast.success(`Split "${title}" from "${article.title}"`)
      navigateToWikiArticle(newId)
    }
    setDragSplitPrompt(null)
  }, [dragSplitPrompt, articleId, article.title, splitWikiArticle])

  const getDragChildCount = useCallback(
    (blockId: string) => {
      const block = article.blocks.find((b) => b.id === blockId)
      if (!block || block.type !== "section") return 0
      const sectionIdx = article.blocks.indexOf(block)
      const sectionLevel = block.level ?? 2
      let count = 0
      for (let i = sectionIdx + 1; i < article.blocks.length; i++) {
        const b = article.blocks[i]
        if (b.type === "section" && (b.level ?? 2) <= sectionLevel) break
        count++
      }
      return count
    },
    [article.blocks],
  )

  /* ── Layout + meta slots ── */
  const layout: ColumnStructure = article.layout ?? {
    type: "columns",
    columns: [{ ratio: 1, content: { type: "blocks", blockIds: article.blocks.map((b) => b.id) } }],
  }
  const isMultiColumn = layout.columns.length > 1

  const tocStyle = article.tocStyle ?? {
    show: true,
    position: isMultiColumn ? ([layout.columns.length - 1] as ColumnPath) : ([0] as ColumnPath),
    collapsed: false,
  }
  const infoboxColumnPath: ColumnPath =
    article.infoboxColumnPath ?? (isMultiColumn ? [layout.columns.length - 1] : [0])

  const tocSections = useMemo(() => {
    const out: { id: string; title: string; level: number; number: string }[] = []
    for (const block of article.blocks) {
      if (block.type === "section") {
        out.push({
          id: block.id,
          title: block.title || "Untitled",
          level: block.level ?? 2,
          number: sectionNumbers.get(block.id) ?? "",
        })
      }
    }
    return out
  }, [article.blocks, sectionNumbers])

  const metaSlots = useMemo(() => {
    const slots: Record<string, ReactNode> = {}
    if (tocStyle.show && tocSections.length > 0) {
      slots[pathKey(tocStyle.position)] = (
        <CollapsibleTOC sections={tocSections} initialCollapsed={tocStyle.collapsed ?? false} />
      )
    }
    if (article.infobox.length > 0 || editable) {
      const key = pathKey(infoboxColumnPath)
      slots[key] = (
        <div className={isMultiColumn ? "" : "max-w-sm"}>
          <WikiInfobox
            noteId={article.id}
            entityType="wiki"
            entries={article.infobox}
            editable={editable}
            headerColor={article.infoboxHeaderColor ?? null}
            onHeaderColorChange={
              editable
                ? (color) =>
                    usePlotStore.getState().updateWikiArticle(article.id, { infoboxHeaderColor: color })
                : undefined
            }
          />
        </div>
      )
    }
    return slots
  }, [
    tocStyle,
    tocSections,
    article.infobox,
    article.id,
    article.infoboxHeaderColor,
    infoboxColumnPath,
    isMultiColumn,
    editable,
  ])

  /* ── renderBlock callback ── */
  const renderBlock = useCallback(
    (blockId: string) => {
      if (!visibleBlockIdSet.has(blockId)) return null
      const block = article.blocks.find((b) => b.id === blockId)
      if (!block) return null
      const num = block.type === "section" ? sectionNumbers.get(block.id) : undefined
      const startOffset = footnoteOffsets.get(block.id) ?? 0

      if (editable) {
        return (
          <div
            key={block.id}
            id={`wiki-block-${block.id}`}
            className={cn(
              "relative",
              splitMode && selectedBlockIds.has(block.id) && "rounded-lg bg-accent/5 ring-1 ring-accent/20",
            )}
          >
            {splitMode && (
              <div
                className="absolute left-0 top-1/2 z-10 -translate-x-8 -translate-y-1/2 cursor-pointer"
                onClick={() => {
                  setSelectedBlockIds((prev) => {
                    const next = new Set(prev)
                    if (next.has(block.id)) next.delete(block.id)
                    else next.add(block.id)
                    return next
                  })
                }}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                    selectedBlockIds.has(block.id)
                      ? "border-accent bg-accent text-white"
                      : "border-muted-foreground/30 hover:border-muted-foreground/50",
                  )}
                >
                  {selectedBlockIds.has(block.id) && <PhCheck size={10} weight="bold" />}
                </div>
              </div>
            )}
            <SortableBlockItem
              block={block}
              editable={true}
              sectionNumber={num}
              articleId={articleId}
              onUpdate={(patch) => updateWikiBlock(articleId, block.id, patch)}
              onDelete={() => handleDeleteBlock(block.id)}
              onSplitSection={handleSplitSection}
              onMoveToArticle={handleMoveToArticle}
              onAddBlock={(type, level) => handleAddBlock(type, block.id, level)}
              nearestSectionLevel={nearestSectionLevelByBlockId.get(block.id)}
              variant={variant}
              onToggleCollapse={() => toggleSection(block.id)}
              collapsed={collapsedSections.has(block.id)}
              footnoteStartOffset={startOffset}
              onFootnoteCount={handleFootnoteCount}
            />
          </div>
        )
      }

      return (
        <div key={block.id} id={`wiki-block-${block.id}`}>
          <WikiBlockRenderer
            block={block}
            editable={false}
            sectionNumber={num}
            variant={variant}
            onToggleCollapse={() => toggleSection(block.id)}
            collapsed={collapsedSections.has(block.id)}
            footnoteStartOffset={startOffset}
            onFootnoteCount={handleFootnoteCount}
          />
        </div>
      )
    },
    [
      visibleBlockIdSet,
      article.blocks,
      articleId,
      sectionNumbers,
      footnoteOffsets,
      editable,
      splitMode,
      selectedBlockIds,
      variant,
      collapsedSections,
      toggleSection,
      handleFootnoteCount,
      nearestSectionLevelByBlockId,
      updateWikiBlock,
      handleDeleteBlock,
      handleSplitSection,
      handleMoveToArticle,
      handleAddBlock,
    ],
  )

  /* ── Body (common to both modes) ── */
  const fontStyle = fontSize ? { fontSize: `${fontSize}em` } : undefined
  const padClass = padding ?? (variant === "encyclopedia" ? "px-10 py-6" : "px-8 py-6")

  const body = (
    <WikiThemeProvider
      themeColor={article.themeColor}
      className={cn("wiki-article-renderer flex-1 overflow-y-auto", className)}
      as="article"
    >
      <div className={padClass} style={fontStyle}>
        {!hideTitle && (
          <WikiTitle
            title={article.title}
            aliases={article.aliases}
            titleStyle={article.titleStyle}
            themeColor={article.themeColor}
            editable={editable}
            onTitleChange={
              editable
                ? (title) => usePlotStore.getState().updateWikiArticle(articleId, { title })
                : undefined
            }
            onAliasesChange={
              editable
                ? (aliases) => usePlotStore.getState().updateWikiArticle(articleId, { aliases })
                : undefined
            }
          />
        )}

        {!hideCategories && (
          <div className="mb-4">
            <InlineCategoryTags articleId={articleId} categoryIds={article.categoryIds ?? []} editable={editable} />
          </div>
        )}

        {/* Split toggle (edit only, not already in splitMode) */}
        {editable && !splitMode && (
          <div className="mb-2 flex items-center gap-2">
            <button
              onClick={() => setSplitMode(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs text-muted-foreground/70 transition-colors duration-100 hover:bg-hover-bg hover:text-foreground"
            >
              <Scissors size={12} weight="regular" />
              Split wiki
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs text-muted-foreground/70 transition-colors duration-100 hover:bg-destructive/10 hover:text-destructive"
              >
                Delete
              </button>
            )}
          </div>
        )}

        {/* Top AddBlock */}
        {editable && <AddBlockButton onAdd={(type, level) => handleAddBlock(type, "__prepend__", level)} />}

        {/* Column-based body */}
        {editable ? (
          <SortableContext items={visibleBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <ColumnRenderer layout={layout} renderBlock={renderBlock} metaSlots={metaSlots} />
          </SortableContext>
        ) : (
          <ColumnRenderer layout={layout} renderBlock={renderBlock} metaSlots={metaSlots} />
        )}

        {/* Bottom AddBlock */}
        {editable && <AddBlockButton onAdd={(type, level) => handleAddBlock(type, undefined, level)} />}

        {/* Empty state */}
        {article.blocks.length === 0 && !editable && (
          <p className="py-8 text-center text-note text-muted-foreground/40">
            This article has no content yet.
          </p>
        )}

        {!hideFootnotes && (
          <Fragment>
            <WikiFootnotesSection article={article} />
            <WikiReferencesSection article={article} editable={editable} />
          </Fragment>
        )}

        {/* SplitMode bottom bar */}
        {editable && splitMode && (
          <div className="sticky bottom-0 z-20 -mx-8 mt-6 border-t border-border bg-popover px-4 py-3 md:-mx-10">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="mb-1.5 text-2xs text-muted-foreground">
                  {selectedBlockIds.size} block{selectedBlockIds.size !== 1 ? "s" : ""} selected
                </p>
                <input
                  type="text"
                  value={splitTitle}
                  onChange={(e) => setSplitTitle(e.target.value)}
                  placeholder="New article title..."
                  className="h-8 w-full rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                />
              </div>
              <button
                onClick={exitSplitMode}
                className="rounded-md px-3 py-1.5 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg"
              >
                Cancel
              </button>
              <button
                onClick={confirmSplit}
                disabled={selectedBlockIds.size === 0 || !splitTitle.trim()}
                className="rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Scissors size={12} weight="regular" className="mr-1 inline" />
                Extract
              </button>
            </div>
          </div>
        )}
      </div>
    </WikiThemeProvider>
  )

  /* ── Read mode: just return body ── */
  if (!editable) return body

  /* ── Edit mode: wrap with DndContext + FloatingDragDropBar + DragOverlay ── */
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      {body}

      <FloatingDragDropBar
        isDragging={isDragging}
        isOverNew={dragOverDropzone}
        otherArticles={otherArticles}
        dragOverArticleId={dragOverArticleId}
      />

      {dragSplitPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="w-[340px] space-y-3 rounded-lg border border-border bg-surface-overlay p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <p className="text-note font-medium text-foreground">New article title</p>
            <input
              autoFocus
              type="text"
              value={dragSplitPrompt.defaultTitle}
              onChange={(e) =>
                setDragSplitPrompt((prev) => (prev ? { ...prev, defaultTitle: e.target.value } : null))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmDragSplit()
                if (e.key === "Escape") setDragSplitPrompt(null)
              }}
              className="h-8 w-full rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground focus:border-accent focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDragSplitPrompt(null)}
                className="rounded-md px-3 py-1.5 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDragSplit}
                className="rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-white transition-colors hover:bg-accent/90"
              >
                Split
              </button>
            </div>
          </div>
        </div>
      )}

      <DragOverlay dropAnimation={null}>
        {activeDragId &&
          (() => {
            const block = article.blocks.find((b) => b.id === activeDragId)
            if (!block) return null
            const childCount = getDragChildCount(activeDragId)
            const previewText =
              block.type === "section"
                ? `§ ${block.title || "Untitled"}`
                : block.type === "text"
                ? block.content?.slice(0, 50) || "Empty text block"
                : block.type === "note-ref"
                ? "Note reference"
                : block.type === "image"
                ? "Image block"
                : "Block"
            return (
              <div
                className="max-w-[400px] rounded-lg border border-accent/30 bg-surface-overlay/95 px-4 py-2.5 shadow-xl backdrop-blur-sm"
                style={{ transform: "rotate(-1.5deg)" }}
              >
                <p className="truncate text-2xs font-medium text-foreground">{previewText}</p>
                {block.type === "section" && childCount > 0 && (
                  <p className="mt-0.5 text-2xs text-muted-foreground/60">
                    + {childCount} child block{childCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )
          })()}
      </DragOverlay>

      <UrlInputDialog
        open={urlBlockDialog.open}
        mode="link"
        onClose={() => setUrlBlockDialog({ open: false })}
        onSubmit={(url) => {
          const block: Omit<WikiBlock, "id"> = { type: "url", url, urlTitle: "" }
          addWikiBlock(articleId, block, urlBlockDialog.afterBlockId)
          setUrlBlockDialog({ open: false })
        }}
      />
    </DndContext>
  )
}

/* ── Floating drag-and-drop bar (cross-article) ─────────────────── */

function FloatingDragDropBar({
  isDragging,
  isOverNew,
  otherArticles,
  dragOverArticleId,
}: {
  isDragging: boolean
  isOverNew: boolean
  otherArticles: WikiArticle[]
  dragOverArticleId: string | null
}) {
  const { setNodeRef: newRef } = useDroppable({ id: "split-dropzone" })
  if (!isDragging) return null
  const displayArticles = otherArticles.slice(0, 3)

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-6 fade-in duration-200">
      <div className="flex items-stretch gap-2.5 rounded-lg border border-border bg-surface-overlay px-4 py-3 shadow-2xl">
        <div
          ref={newRef}
          className={cn(
            "flex min-h-[80px] min-w-[120px] cursor-default flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-6 transition-all duration-200",
            isOverNew
              ? "animate-pulse border-accent bg-accent/10 text-accent scale-[1.03] shadow-md shadow-accent/10"
              : "border-border-subtle text-muted-foreground/60 hover:border-border hover:text-muted-foreground/80 hover:scale-[1.01]",
          )}
        >
          <Scissors size={20} weight="regular" />
          <span className="text-2xs font-medium whitespace-nowrap">
            {isOverNew ? "Drop to split" : "New Article"}
          </span>
        </div>
        {displayArticles.map((a) => (
          <ExistingArticleDropTarget
            key={a.id}
            articleId={a.id}
            title={a.title}
            isOver={dragOverArticleId === a.id}
          />
        ))}
      </div>
    </div>
  )
}

function ExistingArticleDropTarget({
  articleId,
  title,
  isOver,
}: {
  articleId: string
  title: string
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: `drop-article-${articleId}` })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[80px] min-w-[100px] max-w-[160px] cursor-default flex-col items-center justify-center gap-1 rounded-lg border px-4 transition-all duration-200",
        isOver
          ? "animate-pulse border-accent bg-accent/10 text-accent scale-[1.03] shadow-md shadow-accent/10"
          : "border-border-subtle text-muted-foreground/50 hover:border-border-subtle hover:text-muted-foreground/70 hover:scale-[1.01]",
      )}
    >
      <BookOpen size={16} weight="regular" className="shrink-0" />
      <span className="max-w-full truncate text-center text-2xs font-medium">{title}</span>
    </div>
  )
}

/* ── Inline Collapsible TOC ────────────────────────────────────── */

function CollapsibleTOC({
  sections,
  initialCollapsed,
}: {
  sections: { id: string; title: string; level: number; number: string }[]
  initialCollapsed: boolean
}) {
  const [open, setOpen] = useState(!initialCollapsed)
  if (sections.length === 0) return null

  return (
    <div className="max-w-sm rounded-lg border border-border bg-secondary/30">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <span className="font-bold text-foreground/80">Contents</span>
        <CaretDown
          size={14}
          weight="bold"
          className={cn("text-muted-foreground transition-transform duration-200", !open && "-rotate-90")}
        />
      </button>
      {open && (
        <div className="space-y-1 px-4 pb-3.5">
          {sections.map((s) => (
            <div key={s.id} style={{ paddingLeft: (s.level - 2) * 16 }}>
              <button
                onClick={() => {
                  document.getElementById(`wiki-block-${s.id}`)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }}
                className="text-note text-accent/80 transition-colors hover:text-accent"
              >
                {s.number}. {s.title}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
