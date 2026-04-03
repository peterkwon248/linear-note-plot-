"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, WikiBlock } from "@/lib/types"
import { WikiBlockRenderer, AddBlockButton } from "./wiki-block-renderer"
import { SortableBlockItem } from "./sortable-block-item"
import { WikiInfobox } from "@/components/editor/wiki-infobox"
import { shortRelative } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import { Virtuoso } from "react-virtuoso"
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
  type DragEndEvent,
  useDroppable,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Image as PhImage } from "@phosphor-icons/react/dist/ssr/Image"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"

/** Floating drag-and-drop bar that appears at the bottom of the screen during drag */
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

  // Show max 3 other articles for horizontal layout
  const displayArticles = otherArticles.slice(0, 3)

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-6 fade-in duration-200">
      <div className="flex items-stretch gap-2.5 rounded-lg border border-border bg-surface-overlay px-4 py-3 shadow-2xl">
        {/* New Article drop zone */}
        <div
          ref={newRef}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-6 min-h-[80px] min-w-[120px] transition-all duration-200 cursor-default",
            isOverNew
              ? "border-accent bg-accent/10 text-accent scale-[1.03] shadow-md shadow-accent/10 animate-pulse"
              : "border-border-subtle text-muted-foreground/60 hover:border-border hover:text-muted-foreground/80 hover:scale-[1.01]"
          )}
        >
          <Scissors size={20} weight="regular" />
          <span className="text-2xs font-medium whitespace-nowrap">
            {isOverNew ? "Drop to split" : "New Article"}
          </span>
        </div>

        {/* Existing article drop zones */}
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

/** Drop target for moving blocks to an existing article (inside FloatingDragDropBar) */
function ExistingArticleDropTarget({ articleId, title, isOver }: { articleId: string; title: string; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: `drop-article-${articleId}` })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-lg border px-4 min-h-[80px] min-w-[100px] max-w-[160px] transition-all duration-200 cursor-default",
        isOver
          ? "border-accent bg-accent/10 text-accent scale-[1.03] shadow-md shadow-accent/10 animate-pulse"
          : "border-border-subtle text-muted-foreground/50 hover:border-border-subtle hover:text-muted-foreground/70 hover:scale-[1.01]"
      )}
    >
      <BookOpen size={16} weight="regular" className="shrink-0" />
      <span className="text-2xs font-medium truncate max-w-full text-center">{title}</span>
    </div>
  )
}

interface WikiArticleViewProps {
  articleId: string
  editable?: boolean
  onDelete?: () => void
  collapseAllCmd?: "collapse" | "expand" | null
  onCollapseAllDone?: () => void
  onAllCollapsedChange?: (allCollapsed: boolean) => void
  fontSize?: number
}

/** Compute section numbers (1., 2., 2.1., etc.) for section blocks */
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

/* ── Initial content JSON for compound block types ── */

function getInitialContentJson(subtype: string): Record<string, unknown> {
  switch (subtype) {
    case "infobox":
      return {
        type: "doc",
        content: [{ type: "infoboxBlock", attrs: { entries: [{ key: "Key", value: "Value" }] } }]
      }
    case "callout":
      return {
        type: "doc",
        content: [{ type: "calloutBlock", content: [{ type: "paragraph", content: [{ type: "text", text: "Callout text here" }] }] }]
      }
    case "blockquote":
      return {
        type: "doc",
        content: [{ type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "Quote text here" }] }] }]
      }
    case "toggle":
      return {
        type: "doc",
        content: [{ type: "details", content: [
          { type: "detailsSummary", content: [{ type: "paragraph", content: [{ type: "text", text: "Toggle title" }] }] },
          { type: "detailsContent", content: [{ type: "paragraph", content: [{ type: "text", text: "Toggle content" }] }] },
        ]}]
      }
    case "divider":
      return {
        type: "doc",
        content: [{ type: "horizontalRule" }, { type: "paragraph" }]
      }
    case "spacer":
      return {
        type: "doc",
        content: [{ type: "paragraph" }, { type: "paragraph" }, { type: "paragraph" }]
      }
    default:
      return { type: "doc", content: [{ type: "paragraph" }] }
  }
}

export function WikiArticleView({ articleId, editable = false, onDelete, collapseAllCmd, onCollapseAllDone, onAllCollapsedChange, fontSize }: WikiArticleViewProps) {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const addWikiBlock = usePlotStore((s) => s.addWikiBlock)
  const removeWikiBlock = usePlotStore((s) => s.removeWikiBlock)
  const updateWikiBlock = usePlotStore((s) => s.updateWikiBlock)
  const reorderWikiBlocks = usePlotStore((s) => s.reorderWikiBlocks)
  const setWikiArticleInfobox = usePlotStore((s) => s.setWikiArticleInfobox)
  const splitWikiArticle = usePlotStore((s) => s.splitWikiArticle)

  const [splitMode, setSplitMode] = useState(false)
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
  const [splitTitle, setSplitTitle] = useState("")
  const [dragOverDropzone, setDragOverDropzone] = useState(false)
  // Improvement 1: isDragging state
  const [isDragging, setIsDragging] = useState(false)
  // Improvement 2: drag split title prompt
  const [dragSplitPrompt, setDragSplitPrompt] = useState<{ blockId: string; defaultTitle: string } | null>(null)
  // Improvement 4: DragOverlay active drag ID
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  // Improvement 5: track which existing article drop zone is hovered
  const [dragOverArticleId, setDragOverArticleId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  )

  const article = useMemo(
    () => wikiArticles.find((a) => a.id === articleId),
    [wikiArticles, articleId]
  )

  // Improvement 5: other articles for drop targets
  const otherArticles = useMemo(
    () => wikiArticles.filter((a) => a.id !== articleId).slice(0, 5),
    [wikiArticles, articleId]
  )

  // Handle collapse/expand all command from parent (default view stores collapsed on each block)
  const sectionBlocks = useMemo(
    () => (article?.blocks ?? []).filter((b) => b.type === "section"),
    [article?.blocks]
  )

  useEffect(() => {
    if (!collapseAllCmd || !article) return
    const collapsed = collapseAllCmd === "collapse"
    for (const block of sectionBlocks) {
      if (!!block.collapsed !== collapsed) {
        updateWikiBlock(article.id, block.id, { collapsed })
      }
    }
    onCollapseAllDone?.()
  }, [collapseAllCmd, article, sectionBlocks, updateWikiBlock, onCollapseAllDone])

  // Report allCollapsed state to parent
  useEffect(() => {
    const allCollapsed = sectionBlocks.length > 0 && sectionBlocks.every((b) => !!b.collapsed)
    onAllCollapsedChange?.(allCollapsed)
  }, [sectionBlocks, onAllCollapsedChange])

  /** Split a section and its child blocks into a new article */
  const handleSplitSection = useCallback((sectionBlockId: string) => {
    if (!article) return
    const blocks = article.blocks
    const sectionIdx = blocks.findIndex(b => b.id === sectionBlockId)
    if (sectionIdx === -1) return

    const sectionBlock = blocks[sectionIdx]
    const sectionLevel = sectionBlock.level ?? 2

    // Collect this section + all blocks until next same-or-higher level section
    const blockIds: string[] = [sectionBlockId]
    for (let i = sectionIdx + 1; i < blocks.length; i++) {
      const b = blocks[i]
      if (b.type === "section" && (b.level ?? 2) <= sectionLevel) break
      blockIds.push(b.id)
    }

    const title = sectionBlock.title || "Untitled Section"
    const newId = splitWikiArticle(articleId, blockIds, title)
    if (newId) {
      toast.success(`Moved "${title}" to new article`)
      navigateToWikiArticle(newId)
    }
  }, [article, articleId, splitWikiArticle])

  /** Move a section (and its child blocks) to an existing article */
  const handleMoveToArticle = useCallback((sectionBlockId: string, targetArticleId: string) => {
    if (!article) return
    const blocks = article.blocks
    const sectionIdx = blocks.findIndex(b => b.id === sectionBlockId)
    if (sectionIdx === -1) return

    const sectionBlock = blocks[sectionIdx]
    const sectionLevel = sectionBlock.level ?? 2

    // Collect this section + all blocks until next same-or-higher level section
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
    store.updateWikiArticle(articleId, {
      blocks: remainingBlocks,
    })

    toast.success(`Moved ${blockIds.length} block(s) to "${targetArticle.title}"`)
  }, [article, articleId])


  // Improvement 2: confirm drag split with custom title
  const handleConfirmDragSplit = useCallback(() => {
    if (!dragSplitPrompt || !article) return
    const blocks = article.blocks
    const sectionIdx = blocks.findIndex(b => b.id === dragSplitPrompt.blockId)
    if (sectionIdx === -1) return

    const sectionBlock = blocks[sectionIdx]

    // Improvement 3: handle non-section blocks too
    let blockIds: string[]
    if (sectionBlock.type === "section") {
      const sectionLevel = sectionBlock.level ?? 2
      blockIds = [dragSplitPrompt.blockId]
      for (let i = sectionIdx + 1; i < blocks.length; i++) {
        const b = blocks[i]
        if (b.type === "section" && (b.level ?? 2) <= sectionLevel) break
        blockIds.push(b.id)
      }
    } else {
      blockIds = [dragSplitPrompt.blockId]
    }

    const newId = splitWikiArticle(articleId, blockIds, dragSplitPrompt.defaultTitle.trim() || "Untitled")
    if (newId) {
      toast.success(`Split "${dragSplitPrompt.defaultTitle}" to new article`)
      navigateToWikiArticle(newId)
    }
    setDragSplitPrompt(null)
  }, [dragSplitPrompt, article, articleId, splitWikiArticle])

  const handleAddBlock = useCallback((type: string, afterBlockId?: string, level?: number) => {
    if (type === "table") {
      const block: Omit<WikiBlock, "id"> = {
        type: "table",
        tableCaption: "",
        tableHeaders: ["Header 1", "Header 2", "Header 3"],
        tableRows: [["", "", ""]],
        tableColumnAligns: ["center", "center", "center"],
      }
      addWikiBlock(articleId, block, afterBlockId)
      return
    }

    if (type === "url") {
      const url = window.prompt("Enter URL:")
      if (!url) return
      const block: Omit<WikiBlock, "id"> = { type: "url", url, urlTitle: "" }
      addWikiBlock(articleId, block, afterBlockId)
      return
    }

    // Content blocks: create Text block with pre-filled TipTap content
    if (type.startsWith("text:")) {
      const subtype = type.split(":")[1]
      const contentJson = getInitialContentJson(subtype)
      const block: Omit<WikiBlock, "id"> = { type: "text", content: "", contentJson }
      addWikiBlock(articleId, block, afterBlockId)
      return
    }

    const block: Omit<WikiBlock, "id"> = { type: type as WikiBlock["type"] }
    if (type === "section") { block.title = ""; block.level = level ?? 2 }
    if (type === "text") { block.content = "" }
    addWikiBlock(articleId, block, afterBlockId)
  }, [articleId, addWikiBlock])

  const handleDeleteBlock = useCallback((blockId: string) => {
    removeWikiBlock(articleId, blockId)
  }, [articleId, removeWikiBlock])

  // Improvement 1: onDragStart handler
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setIsDragging(true)
    setActiveDragId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDragOverDropzone(false)
    setIsDragging(false)
    setActiveDragId(null)
    setDragOverArticleId(null)
    const { active, over } = event
    if (!over || !article) return

    // Improvement 2+3: Dropped on split dropzone -> show title prompt for any block type
    if (over.id === "split-dropzone") {
      const draggedBlockId = active.id as string
      const block = article.blocks.find((b) => b.id === draggedBlockId)
      if (block) {
        if (block.type === "section") {
          setDragSplitPrompt({ blockId: block.id, defaultTitle: block.title ?? "Untitled" })
        } else {
          setDragSplitPrompt({ blockId: block.id, defaultTitle: "Untitled" })
        }
      }
      return
    }

    // Improvement 5: Dropped on existing article
    if (typeof over.id === "string" && over.id.startsWith("drop-article-")) {
      const targetArticleId = over.id.replace("drop-article-", "")
      const draggedBlockId = active.id as string
      const block = article.blocks.find((b) => b.id === draggedBlockId)
      if (!block) return

      // Collect block IDs to move
      let blockIds: string[]
      if (block.type === "section") {
        const sectionIdx = article.blocks.indexOf(block)
        const sectionLevel = block.level ?? 2
        blockIds = [block.id]
        for (let i = sectionIdx + 1; i < article.blocks.length; i++) {
          const b = article.blocks[i]
          if (b.type === "section" && (b.level ?? 2) <= sectionLevel) break
          blockIds.push(b.id)
        }
      } else {
        blockIds = [block.id]
      }

      const store = usePlotStore.getState()
      const targetArticle = store.wikiArticles.find((a) => a.id === targetArticleId)
      if (!targetArticle) return

      const blocksToMove = article.blocks.filter((b) => blockIds.includes(b.id))
      const remainingBlocks = article.blocks.filter((b) => !blockIds.includes(b.id))

      // Append to target, remove from source
      store.updateWikiArticle(targetArticleId, {
        blocks: [...targetArticle.blocks, ...blocksToMove],
      })
      store.updateWikiArticle(articleId, {
        blocks: remainingBlocks,
      })

      const targetTitle = otherArticles.find((a) => a.id === targetArticleId)?.title ?? "article"
      toast.success(`Moved ${blockIds.length} block(s) to "${targetTitle}"`)
      return
    }

    if (active.id === over.id) return
    const oldIndex = article.blocks.findIndex((b) => b.id === active.id)
    const newIndex = article.blocks.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(
      article.blocks.map((b) => b.id),
      oldIndex,
      newIndex
    )
    reorderWikiBlocks(articleId, newOrder)
  }, [article, articleId, reorderWikiBlocks, otherArticles])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id as string ?? ""
    setDragOverDropzone(overId === "split-dropzone")
    setDragOverArticleId(overId.startsWith("drop-article-") ? overId.replace("drop-article-", "") : null)
  }, [])

  if (!article) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
          <BookOpen className="text-muted-foreground/40" size={20} weight="regular" />
        </div>
        <p className="text-note text-muted-foreground/60">Article not found</p>
      </div>
    )
  }

  // Section numbers: blockId -> "1", "2.1", etc.
  const sectionNumbers = useMemo(() => computeSectionNumbers(article.blocks), [article.blocks])

  // Flatten visible blocks (skip collapsed section children)
  const visibleBlocks = useMemo(() => {
    const result: WikiBlock[] = []
    let collapsingLevel: number | null = null

    for (const block of article.blocks) {
      if (block.type === "section") {
        const level = block.level ?? 2
        // If we're collapsing and hit a same/higher level section, stop collapsing
        if (collapsingLevel !== null && level <= collapsingLevel) {
          collapsingLevel = null
        }
        result.push(block) // always show section headers
        // If this section is collapsed, start hiding everything after it
        if (block.collapsed) {
          collapsingLevel = level
        }
      } else if (collapsingLevel === null) {
        result.push(block)
      }
    }
    return result
  }, [article.blocks])

  // Map blockId -> nearest section level at-or-above that block
  const nearestSectionLevelByBlockId = useMemo(() => {
    const result = new Map<string, number>()
    let currentLevel: number | undefined
    for (const block of article.blocks) {
      if (block.type === "section") {
        currentLevel = block.level ?? 2
      }
      if (currentLevel !== undefined) {
        result.set(block.id, currentLevel)
      }
    }
    return result
  }, [article.blocks])

  // TOC from section blocks
  const tocSections = useMemo(() => {
    const sections: { id: string; title: string; level: number; number: string }[] = []
    for (const block of article.blocks) {
      if (block.type === "section") {
        const num = sectionNumbers.get(block.id) ?? ""
        sections.push({
          id: block.id,
          title: block.title || "Untitled",
          level: block.level ?? 2,
          number: num,
        })
      }
    }
    return sections
  }, [article.blocks, sectionNumbers])

  // Stats
  const noteRefCount = article.blocks.filter(b => b.type === "note-ref").length
  const textBlockCount = article.blocks.filter(b => b.type === "text").length

  // Improvement 4: compute child block count for drag overlay
  const getDragChildCount = (blockId: string) => {
    const block = article.blocks.find(b => b.id === blockId)
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
  }

  const outerContent = (
    <div className="flex flex-1 min-h-0 overflow-hidden" style={fontSize ? { fontSize: `${fontSize}em` } : undefined}>
      {/* TOC Sidebar */}
      <aside className="min-w-[200px] max-w-[280px] w-auto shrink-0 overflow-y-auto border-r border-border-subtle px-3 py-4">
        <div className="sticky top-0">
          <h4 className="text-2xs text-muted-foreground uppercase tracking-wider mb-2">
            Contents
          </h4>
          {tocSections.length > 0 ? (
            <nav className="space-y-0.5">
              {tocSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    document.getElementById(`wiki-block-${s.id}`)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-note text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors duration-100"
                  style={{ paddingLeft: `${(s.level - 2) * 12 + 8}px` }}
                >
                  <span className="shrink-0 text-accent font-semibold text-2xs">{s.number}.</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </nav>
          ) : (
            <p className="px-2 text-2xs text-muted-foreground/40">No sections yet</p>
          )}
        </div>
      </aside>

      {/* Blocks Content */}
      <div className="flex-1 overflow-y-auto flex flex-col" id="wiki-article-scroll-container">
        <div className={cn("px-8 py-6 space-y-1 flex-1", article.contentAlign === "center" ? "max-w-4xl mx-auto" : "max-w-[780px]")}>
          {/* Title (editable) */}
          {editable ? (
            <input
              defaultValue={article.title}
              onBlur={(e) => {
                const v = e.target.value.trim()
                if (v && v !== article.title) {
                  usePlotStore.getState().updateWikiArticle(article.id, { title: v })
                }
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
              className="text-[26px] font-bold text-foreground mb-1 bg-transparent outline-none border-b border-transparent hover:border-accent/30 focus:border-accent/50 w-full transition-colors"
            />
          ) : (
            <h1 className="text-[26px] font-bold text-foreground mb-1">
              {article.title}
            </h1>
          )}
          {/* Aliases (editable) */}
          {editable ? (
            <input
              defaultValue={article.aliases.join(", ")}
              placeholder="Aliases (comma separated)"
              onBlur={(e) => {
                const aliases = e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                usePlotStore.getState().updateWikiArticle(article.id, { aliases })
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
              className="text-note text-muted-foreground/50 mb-2 bg-transparent outline-none border-b border-transparent hover:border-accent/30 focus:border-accent/50 w-full transition-colors"
            />
          ) : article.aliases.length > 0 ? (
            <p className="text-note text-muted-foreground/50 mb-2">
              {article.aliases.join(" · ")}
            </p>
          ) : null}

          {/* Category tag row */}
          <InlineCategoryTags articleId={articleId} categoryIds={article.categoryIds ?? []} editable={editable} />

          {/* Blocks */}
          {editable && (
            <AddBlockButton onAdd={(type, level) => handleAddBlock(type, "__prepend__", level)} />
          )}

          {editable ? (
              <SortableContext items={visibleBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                {visibleBlocks.map((block) => (
                  <div
                    key={block.id}
                    className={cn(
                      "relative",
                      splitMode && selectedBlockIds.has(block.id) && "bg-accent/5 rounded-lg ring-1 ring-accent/20"
                    )}
                  >
                    {splitMode && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 cursor-pointer z-10"
                        onClick={() => {
                          setSelectedBlockIds(prev => {
                            const next = new Set(prev)
                            if (next.has(block.id)) next.delete(block.id)
                            else next.add(block.id)
                            return next
                          })
                        }}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                          selectedBlockIds.has(block.id)
                            ? "bg-accent border-accent text-white"
                            : "border-muted-foreground/30 hover:border-muted-foreground/50"
                        )}>
                          {selectedBlockIds.has(block.id) && <PhCheck size={10} weight="bold" />}
                        </div>
                      </div>
                    )}
                    <SortableBlockItem
                      block={block}
                      editable={editable}
                      sectionNumber={block.type === "section" ? sectionNumbers.get(block.id) : undefined}
                      onUpdate={(patch) => updateWikiBlock(articleId, block.id, patch)}
                      onDelete={() => handleDeleteBlock(block.id)}
                      onAddBlock={(type, level) => handleAddBlock(type, block.id, level)}
                      nearestSectionLevel={nearestSectionLevelByBlockId.get(block.id)}
                      articleId={articleId}
                      onSplitSection={handleSplitSection}
                      onMoveToArticle={handleMoveToArticle}
                    />
                  </div>
                ))}
              </SortableContext>
          ) : visibleBlocks.length > 50 ? (
            <Virtuoso
              data={visibleBlocks}
              increaseViewportBy={200}
              itemContent={(_index, block) => (
                <div key={block.id} id={`wiki-block-${block.id}`}>
                  <WikiBlockRenderer
                    block={block}
                    editable={false}
                    sectionNumber={block.type === "section" ? sectionNumbers.get(block.id) : undefined}
                    onUpdate={(patch) => updateWikiBlock(articleId, block.id, patch)}
                    onDelete={() => handleDeleteBlock(block.id)}
                  />
                </div>
              )}
              style={{ height: "100%" }}
            />
          ) : (
            visibleBlocks.map((block) => (
              <div key={block.id} id={`wiki-block-${block.id}`}>
                <WikiBlockRenderer
                  block={block}
                  editable={false}
                  sectionNumber={block.type === "section" ? sectionNumbers.get(block.id) : undefined}
                  onUpdate={(patch) => updateWikiBlock(articleId, block.id, patch)}
                  onDelete={() => handleDeleteBlock(block.id)}
                />
              </div>
            ))
          )}

          {/* Add block at bottom */}
          {editable && (
            <AddBlockButton onAdd={(type, level) => handleAddBlock(type, undefined, level)} />
          )}

          {article.blocks.length === 0 && !editable && (
            <p className="py-8 text-center text-note text-muted-foreground/40">
              This article has no content yet.
            </p>
          )}
        </div>

        {splitMode && (
          <div className="sticky bottom-0 z-20 border-t border-border bg-popover px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-2xs text-muted-foreground mb-1.5">
                  {selectedBlockIds.size} block{selectedBlockIds.size !== 1 ? "s" : ""} selected
                </p>
                <input
                  type="text"
                  value={splitTitle}
                  onChange={(e) => setSplitTitle(e.target.value)}
                  placeholder="New article title..."
                  className="h-8 w-full rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <button
                onClick={() => { setSplitMode(false); setSelectedBlockIds(new Set()); setSplitTitle("") }}
                className="rounded-md px-3 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedBlockIds.size === 0 || !splitTitle.trim()) return
                  const newId = splitWikiArticle(articleId, Array.from(selectedBlockIds), splitTitle.trim())
                  if (newId) {
                    toast.success(`Split "${splitTitle.trim()}" from "${article.title}"`)
                    setSplitMode(false)
                    setSelectedBlockIds(new Set())
                    setSplitTitle("")
                    navigateToWikiArticle(newId)
                  }
                }}
                disabled={selectedBlockIds.size === 0 || !splitTitle.trim()}
                className="rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Scissors size={12} weight="regular" className="inline mr-1" />
                Extract
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Infobox + Quality + Activity */}
      <aside className="w-[240px] shrink-0 overflow-y-auto border-l border-border-subtle px-4 py-5 space-y-4">
        {/* Infobox */}
        <WikiInfobox
          noteId={articleId}
          entries={article.infobox}
          editable={true}
          className="w-full"
        />

        {/* Sources -- auto-extracted from blocks */}
        <SourcesList blocks={article.blocks} />

        {/* Activity */}
        <div className="space-y-2">
          <h4 className="text-2xs font-medium uppercase tracking-wide text-muted-foreground/40">
            Activity
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs text-muted-foreground">Blocks</span>
              <span className="text-2xs font-medium text-foreground">{article.blocks.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xs text-muted-foreground">Embedded notes</span>
              <span className="text-2xs font-medium text-foreground">{noteRefCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xs text-muted-foreground">Last modified</span>
              <span className="text-2xs font-medium text-foreground">{shortRelative(article.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Split / Delete article */}
        {(editable || onDelete) && (
          <div className="pt-2 border-t border-border-subtle space-y-0.5">
            {editable && !splitMode && (
              <button
                onClick={() => setSplitMode(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-2xs text-muted-foreground/70 hover:text-foreground hover:bg-hover-bg transition-colors duration-100"
              >
                <Scissors size={12} weight="regular" />
                Split wiki
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-2xs text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors duration-100"
              >
                <Trash size={12} weight="regular" />
                Delete article
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  )

  // Wrap with DndContext when editable so drop zone in sidebar works
  if (editable) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        {outerContent}

        <FloatingDragDropBar
          isDragging={isDragging}
          isOverNew={dragOverDropzone}
          otherArticles={otherArticles}
          dragOverArticleId={dragOverArticleId}
        />

        {/* Drag split title prompt (floating dialog) */}
        {dragSplitPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <div className="w-[340px] rounded-lg border border-border bg-surface-overlay p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <p className="text-note font-medium text-foreground">New article title</p>
              <input
                autoFocus
                type="text"
                value={dragSplitPrompt.defaultTitle}
                onChange={(e) => setDragSplitPrompt(prev => prev ? { ...prev, defaultTitle: e.target.value } : null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmDragSplit()
                  if (e.key === "Escape") setDragSplitPrompt(null)
                }}
                className="h-8 w-full rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground focus:outline-none focus:border-accent"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setDragSplitPrompt(null)} className="rounded-md px-3 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-hover-bg transition-colors">Cancel</button>
                <button onClick={handleConfirmDragSplit} className="rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-white hover:bg-accent/90 transition-colors">Split</button>
              </div>
            </div>
          </div>
        )}

        {/* DragOverlay for drag preview */}
        <DragOverlay dropAnimation={null}>
          {activeDragId && (() => {
            const block = article?.blocks.find(b => b.id === activeDragId)
            if (!block) return null
            const childCount = getDragChildCount(activeDragId)
            const previewText = block.type === "section"
              ? `\u00A7 ${block.title || "Untitled"}`
              : block.type === "text"
              ? (block.content?.slice(0, 50) || "Empty text block")
              : block.type === "note-ref"
              ? "Note reference"
              : block.type === "image"
              ? "Image block"
              : "Block"
            return (
              <div
                className="rounded-lg border border-accent/30 bg-surface-overlay/95 px-4 py-2.5 shadow-xl backdrop-blur-sm max-w-[400px]"
                style={{ transform: "rotate(-1.5deg)" }}
              >
                <p className="text-2xs font-medium text-foreground truncate">
                  {previewText}
                </p>
                {block.type === "section" && childCount > 0 && (
                  <p className="text-2xs text-muted-foreground/60 mt-0.5">
                    + {childCount} child block{childCount !== 1 ? "s" : ""}
                  </p>
                )}
                {block.type === "text" && block.content && block.content.length > 50 && (
                  <p className="text-2xs text-muted-foreground/40 mt-0.5">...</p>
                )}
              </div>
            )
          })()}
        </DragOverlay>
      </DndContext>
    )
  }

  return outerContent
}

/* -- Sources List -- */
function SourcesList({ blocks }: { blocks: WikiBlock[] }) {
  const notes = usePlotStore((s) => s.notes)
  const attachments = usePlotStore((s) => s.attachments)

  const sources = useMemo(() => {
    const items: { id: string; blockId: string; type: "note" | "image"; label: string; sub?: string }[] = []
    const seenNotes = new Set<string>()
    const seenAttachments = new Set<string>()

    for (const block of blocks) {
      if (block.type === "note-ref" && block.noteId && !seenNotes.has(block.noteId)) {
        seenNotes.add(block.noteId)
        const note = notes.find(n => n.id === block.noteId)
        items.push({
          id: block.noteId,
          blockId: block.id,
          type: "note",
          label: note?.title || "Untitled",
          sub: note?.status,
        })
      }
      if (block.type === "image" && block.attachmentId && !seenAttachments.has(block.attachmentId)) {
        seenAttachments.add(block.attachmentId)
        const att = attachments.find(a => a.id === block.attachmentId)
        items.push({
          id: block.attachmentId,
          blockId: block.id,
          type: "image",
          label: att?.name || block.caption || "Image",
          sub: att ? `${(att.size / 1024).toFixed(0)} KB` : undefined,
        })
      }
    }
    return items
  }, [blocks, notes, attachments])

  if (sources.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-2xs font-medium uppercase tracking-wide text-muted-foreground/40">
        Sources
      </h4>
      <div className="space-y-px">
        {sources.map((src, i) => (
          <button
            key={`${src.type}-${src.id}`}
            onClick={() => {
              if (src.type === "note") {
                // Open note in side peek panel
                usePlotStore.getState().openSidePeek(src.id)
              } else {
                // Scroll to block for images
                document.getElementById(`wiki-block-${src.blockId}`)?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                })
              }
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-100 hover:bg-hover-bg"
          >
            <span className="shrink-0 text-2xs font-semibold text-accent/40 tabular-nums w-4">
              {i + 1}
            </span>
            {src.type === "note" && <FileText className="shrink-0 text-muted-foreground/40" size={12} weight="regular" />}
            {src.type === "image" && <PhImage className="shrink-0 text-muted-foreground/40" size={12} weight="regular" />}
            <span className="flex-1 min-w-0 truncate text-2xs text-foreground/70">
              {src.label}
            </span>
            {src.sub && (
              <span className="shrink-0 text-2xs text-muted-foreground/30">{src.sub}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── InlineCategoryTags — shown below title in article body ── */

export function InlineCategoryTags({
  articleId,
  categoryIds,
  editable = true,
}: {
  articleId: string
  categoryIds: string[]
  editable?: boolean
}) {
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const setArticleCategories = usePlotStore((s) => s.setArticleCategories)
  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [creatingUnder, setCreatingUnder] = useState<string | null>(null)
  const [newChildName, setNewChildName] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const assignedSet = useMemo(() => new Set(categoryIds), [categoryIds])
  const assignedCategories = wikiCategories.filter((c) => assignedSet.has(c.id))

  // Build tree: root categories (no parent) with children
  const rootCategories = useMemo(
    () => wikiCategories.filter((c) => c.parentIds.length === 0),
    [wikiCategories]
  )

  const childrenOf = useMemo(() => {
    const map = new Map<string, typeof wikiCategories>()
    for (const cat of wikiCategories) {
      if (cat.parentIds.length > 0) {
        const parentId = cat.parentIds[0]
        if (!map.has(parentId)) map.set(parentId, [])
        map.get(parentId)!.push(cat)
      }
    }
    return map
  }, [wikiCategories])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [dropdownOpen])

  useEffect(() => {
    if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [dropdownOpen])

  const toggleAssign = (catId: string) => {
    if (assignedSet.has(catId)) {
      setArticleCategories(articleId, categoryIds.filter((id) => id !== catId))
    } else {
      setArticleCategories(articleId, [...categoryIds, catId])
    }
  }

  const toggleExpand = (catId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  // Filter tree by search
  const matchesSearch = useCallback((cat: typeof wikiCategories[number]): boolean => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    if (cat.name.toLowerCase().includes(q)) return true
    // Check children
    const children = childrenOf.get(cat.id) ?? []
    return children.some((c) => matchesSearch(c))
  }, [search, childrenOf])

  // Render tree node recursively
  const renderNode = (cat: typeof wikiCategories[number], depth: number) => {
    if (!matchesSearch(cat)) return null
    const children = childrenOf.get(cat.id) ?? []
    const hasChildren = children.length > 0 || creatingUnder === cat.id
    const isExpanded = expanded.has(cat.id) || search.trim().length > 0 || creatingUnder === cat.id
    const isAssigned = assignedSet.has(cat.id)

    return (
      <div key={cat.id}>
        <div
          className="group/node flex items-center gap-1 rounded-md px-1.5 py-1 text-2xs transition-colors hover:bg-white/[0.06]"
          style={{ paddingLeft: depth * 16 + 6 }}
        >
          {/* Expand/collapse toggle */}
          {(children.length > 0) ? (
            <button
              onClick={() => toggleExpand(cat.id)}
              className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
            >
              {isExpanded
                ? <CaretDown size={10} weight="bold" />
                : <CaretRight size={10} weight="bold" />
              }
            </button>
          ) : (
            <span className="w-[18px]" />
          )}

          {/* Category name + check toggle */}
          <button
            onClick={() => toggleAssign(cat.id)}
            className="flex-1 flex items-center gap-1.5 text-left text-foreground/80 truncate"
          >
            <span className={cn(
              "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors",
              isAssigned
                ? "bg-accent border-accent"
                : "border-white/20 hover:border-white/40"
            )}>
              {isAssigned && <PhCheck size={9} weight="bold" className="text-white" />}
            </span>
            <span className="truncate">{cat.name}</span>
          </button>

          {/* [+] add child button (hover only) */}
          <button
            onClick={(e) => { e.stopPropagation(); setCreatingUnder(cat.id); setExpanded(prev => new Set([...prev, cat.id])) }}
            className="opacity-0 group-hover/node:opacity-100 p-0.5 text-muted-foreground/40 hover:text-accent transition-all shrink-0"
            title={`Add subcategory under ${cat.name}`}
          >
            <PhPlus size={9} weight="bold" />
          </button>
        </div>

        {/* Inline child creation input */}
        {creatingUnder === cat.id && (
          <div style={{ paddingLeft: (depth + 1) * 16 + 6 }} className="flex items-center gap-1 px-1.5 py-1">
            <input
              autoFocus
              value={newChildName}
              onChange={e => setNewChildName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && newChildName.trim()) {
                  const id = createWikiCategory(newChildName.trim(), [cat.id])
                  if (id) { toggleAssign(id); setCreatingUnder(null); setNewChildName("") }
                }
                if (e.key === "Escape") { setCreatingUnder(null); setNewChildName("") }
              }}
              onBlur={() => { setTimeout(() => { setCreatingUnder(null); setNewChildName("") }, 150) }}
              placeholder="New subcategory..."
              className="flex-1 bg-transparent text-2xs text-foreground outline-none placeholder:text-muted-foreground/30 border-b border-accent/30"
            />
          </div>
        )}

        {/* Children */}
        {isExpanded && (childrenOf.get(cat.id) ?? []).map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  // Breadcrumb for hover tooltip
  const getBreadcrumb = useCallback((cat: typeof wikiCategories[number]): string => {
    const parts: string[] = []
    let current = cat
    while (current.parentIds.length > 0) {
      const parent = wikiCategories.find((c) => c.id === current.parentIds[0])
      if (!parent) break
      parts.unshift(parent.name)
      current = parent
    }
    parts.push(cat.name)
    return parts.join(" > ")
  }, [wikiCategories])

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-5 min-h-[24px]">
      {/* Display: flat names, hover tooltip shows full breadcrumb */}
      {assignedCategories.map((cat) => (
        <span
          key={cat.id}
          title={cat.parentIds.length > 0 ? getBreadcrumb(cat) : undefined}
          className="group inline-flex items-center gap-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-2xs font-medium text-foreground/60 transition-colors hover:border-white/[0.14] hover:text-foreground/80"
        >
          {cat.name}
          {editable && (
            <button
              onClick={() => toggleAssign(cat.id)}
              className="ml-0.5 hidden rounded-full p-0 text-muted-foreground/40 transition-colors hover:text-foreground/70 group-hover:inline-flex"
            >
              <PhX size={9} weight="bold" />
            </button>
          )}
        </span>
      ))}

      {/* + Add with tree dropdown (edit mode only) */}
      {editable && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-white/[0.10] px-2 py-0.5 text-2xs text-white/40 transition-colors hover:border-white/[0.20] hover:text-white/60"
          >
            <PhPlus size={10} weight="regular" />
            Add
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-lg border border-white/[0.08] bg-popover shadow-xl">
              {/* Search */}
              <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-white/[0.06]">
                <MagnifyingGlass size={12} weight="regular" className="text-muted-foreground/40 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { setDropdownOpen(false); setSearch("") } }}
                  placeholder="Search categories..."
                  className="flex-1 bg-transparent text-2xs text-foreground outline-none placeholder:text-muted-foreground/30"
                />
              </div>

              {/* Tree */}
              <div className="max-h-52 overflow-y-auto p-1">
                {rootCategories.map((cat) => renderNode(cat, 0))}
                {rootCategories.length === 0 && !search.trim() && (
                  <p className="px-2 py-2 text-2xs text-muted-foreground/40 text-center">No categories yet</p>
                )}

                {/* Search = Create pattern */}
                {search.trim() && !wikiCategories.some(c => c.name.toLowerCase() === search.trim().toLowerCase()) && (
                  <div className="border-t border-white/[0.06] p-1 mt-1">
                    <button
                      onClick={() => {
                        const id = createWikiCategory(search.trim())
                        if (id) { toggleAssign(id); setSearch("") }
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-2xs text-accent transition-colors hover:bg-white/[0.06]"
                    >
                      <PhPlus size={10} /> Create &ldquo;{search.trim()}&rdquo; as root
                    </button>
                    {/* Offer to create under last-expanded parent */}
                    {(() => {
                      const expandedArr = Array.from(expanded)
                      const lastExpanded = expandedArr.length > 0 ? expandedArr[expandedArr.length - 1] : null
                      const parentCat = lastExpanded ? wikiCategories.find(c => c.id === lastExpanded) : null
                      if (!parentCat) return null
                      return (
                        <button
                          onClick={() => {
                            const id = createWikiCategory(search.trim(), [parentCat.id])
                            if (id) { toggleAssign(id); setSearch("") }
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-2xs text-accent transition-colors hover:bg-white/[0.06]"
                        >
                          <PhPlus size={10} /> Create &ldquo;{search.trim()}&rdquo; under {parentCat.name}
                        </button>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* -- Tag Badges -- */
function TagBadges({ tagIds }: { tagIds: string[] }) {
  const tags = usePlotStore((s) => s.tags)
  return (
    <>
      {tagIds.map((tagId) => {
        const tag = tags.find((t) => t.id === tagId)
        return (
          <span
            key={tagId}
            className="rounded-sm bg-secondary/50 px-1.5 py-0.5 text-2xs font-medium text-foreground/70"
          >
            {tag?.name ?? tagId}
          </span>
        )
      })}
    </>
  )
}

/* ── ArticleCategories (WikiCategory DAG) ── */

export function ArticleCategories({
  articleId,
  categoryIds,
  editable,
}: {
  articleId: string
  categoryIds: string[]
  editable: boolean
}) {
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const setArticleCategories = usePlotStore((s) => s.setArticleCategories)
  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [newCatName, setNewCatName] = useState("")

  const assignedCategories = wikiCategories.filter((c) => categoryIds.includes(c.id))
  const availableCategories = wikiCategories.filter((c) => !categoryIds.includes(c.id))

  // Build breadcrumb path for a category
  const getBreadcrumb = (cat: typeof wikiCategories[number]): string => {
    if (cat.parentIds.length === 0) return cat.name
    const parent = wikiCategories.find((c) => c.id === cat.parentIds[0])
    if (!parent) return cat.name
    return `${parent.name} / ${cat.name}`
  }

  const handleRemove = (catId: string) => {
    setArticleCategories(articleId, categoryIds.filter((id) => id !== catId))
  }

  const handleAdd = (catId: string) => {
    setArticleCategories(articleId, [...categoryIds, catId])
    setDropdownOpen(false)
  }

  const handleCreateAndAdd = () => {
    if (!newCatName.trim()) return
    const id = createWikiCategory(newCatName.trim())
    if (!id) return
    setArticleCategories(articleId, [...categoryIds, id])
    setNewCatName("")
    setDropdownOpen(false)
  }

  return (
    <div className="space-y-2">
      <h4 className="text-2xs font-medium uppercase tracking-wide text-muted-foreground/40">
        Categories
      </h4>
      {assignedCategories.length === 0 && !editable && (
        <p className="text-2xs text-muted-foreground/40">No categories</p>
      )}
      <div className="flex flex-wrap gap-1">
        {assignedCategories.map((cat) => (
          <span
            key={cat.id}
            className="group inline-flex items-center gap-0.5 rounded-sm bg-secondary/50 px-1.5 py-0.5 text-2xs font-medium text-foreground/70"
            title={getBreadcrumb(cat)}
          >
            {cat.parentIds.length > 0 && (
              <>
                <span className="text-muted-foreground/40">
                  {wikiCategories.find((p) => p.id === cat.parentIds[0])?.name ?? ""}
                </span>
                <CaretRight size={8} weight="bold" className="text-muted-foreground/30" />
              </>
            )}
            {cat.name}
            {editable && (
              <button
                onClick={() => handleRemove(cat.id)}
                className="ml-0.5 hidden rounded-sm p-0 text-muted-foreground/40 transition-colors hover:text-foreground group-hover:inline-flex"
              >
                <PhX size={10} weight="bold" />
              </button>
            )}
          </span>
        ))}
      </div>
      {editable && (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-2xs font-medium text-muted-foreground/50 transition-colors hover:bg-hover-bg hover:text-foreground/70"
          >
            <PhPlus size={12} weight="regular" />
            Add category
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border border-border-subtle bg-surface-overlay p-1 shadow-lg">
              {availableCategories.length > 0 && (
                <div className="max-h-40 overflow-y-auto">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleAdd(cat.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-2xs text-foreground/80 transition-colors hover:bg-hover-bg"
                    >
                      <span className="truncate">{getBreadcrumb(cat)}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="border-t border-border-subtle pt-1 mt-1">
                <div className="flex items-center gap-1 px-1">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateAndAdd() }}
                    placeholder="New category..."
                    className="flex-1 rounded-md bg-transparent px-1.5 py-1 text-2xs text-foreground outline-none placeholder:text-muted-foreground/30"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateAndAdd}
                    disabled={!newCatName.trim()}
                    className="rounded-md px-2 py-1 text-2xs font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-30"
                  >
                    Create
                  </button>
                </div>
              </div>
              <button
                onClick={() => setDropdownOpen(false)}
                className="mt-1 w-full rounded-md px-2 py-1 text-center text-2xs text-muted-foreground/40 transition-colors hover:bg-hover-bg"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
