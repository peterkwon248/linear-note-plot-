"use client"

import { useState, useMemo, useCallback, useRef, useEffect, Fragment } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, WikiBlock } from "@/lib/types"
import { WikiBlockRenderer, AddBlockButton } from "./wiki-block-renderer"
import { SortableBlockItem } from "./sortable-block-item"
import { CategoryTreePicker } from "./category-tree-picker"
import { UrlInputDialog } from "@/components/editor/url-input-dialog"
import { NotePickerDialog } from "@/components/note-picker-dialog"
import { WikiPickerDialog } from "@/components/wiki-picker-dialog"
import { getEmbedDescendants } from "@/lib/embed-cycle"
import { WikiFootnotesSection, WikiReferencesSection } from "./wiki-footnotes-section"
import { WikiInfobox } from "@/components/editor/wiki-infobox"
import { INFOBOX_PRESETS } from "@/lib/wiki-infobox-presets"
import { cn } from "@/lib/utils"
import { Virtuoso } from "react-virtuoso"
import { toast } from "sonner"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { computeSectionNumbers, buildVisibleBlocks } from "@/lib/wiki-block-utils"
import { shortRelative } from "@/lib/format-utils"
import { setActiveCategoryView } from "@/lib/wiki-view-mode"
import { setActiveRoute } from "@/lib/table-route"
import { useWikiBlockActions } from "@/hooks/use-wiki-block-actions"
import { WikiBreadcrumb } from "./wiki-breadcrumb"
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
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
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
  preview?: boolean
  onDelete?: () => void
  collapseAllCmd?: "collapse" | "expand" | null
  onCollapseAllDone?: () => void
  onAllCollapsedChange?: (allCollapsed: boolean) => void
  fontSize?: number
}

export function WikiArticleView({ articleId, editable = false, preview = false, onDelete, collapseAllCmd, onCollapseAllDone, onAllCollapsedChange, fontSize }: WikiArticleViewProps) {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const notes = usePlotStore((s) => s.notes)
  const updateWikiBlock = usePlotStore((s) => s.updateWikiBlock)
  const reorderWikiBlocks = usePlotStore((s) => s.reorderWikiBlocks)
  const splitWikiArticle = usePlotStore((s) => s.splitWikiArticle)

  const { addWikiBlock, handleAddBlock, handleDeleteBlock, handleSplitSection, handleMoveToArticle, urlBlockDialog, setUrlBlockDialog } = useWikiBlockActions(articleId)

  const [splitMode, setSplitMode] = useState(false)
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
  const [splitTitle, setSplitTitle] = useState("")
  const [dragOverDropzone, setDragOverDropzone] = useState(false)
  // Improvement 1: isDragging state
  const [isDragging, setIsDragging] = useState(false)
  // Improvement 2: drag split title prompt
  const [dragSplitPrompt, setDragSplitPrompt] = useState<{ blockId: string; defaultTitle: string } | null>(null)
  // Footnote offset tracking: each text block reports how many footnoteRef nodes it has
  const [footnoteCounts, setFootnoteCounts] = useState<Map<string, number>>(new Map())

  // ── Embed picker state (for wiki TextBlock embed-note/embed-wiki slash commands) ──
  const [embedNotePickerOpen, setEmbedNotePickerOpen] = useState(false)
  const embedNoteEditorRef = useRef<import("@tiptap/react").Editor | null>(null)
  const [embedWikiPickerOpen, setEmbedWikiPickerOpen] = useState(false)
  const embedWikiEditorRef = useRef<import("@tiptap/react").Editor | null>(null)

  // Cycle-safe exclude IDs: descendants of the current wiki article
  const embedNoteExcludeIds = useMemo(() => {
    const { notes: descNotes } = getEmbedDescendants(articleId, "wiki", { notes, wikiArticles })
    return [...descNotes]
  }, [articleId, notes, wikiArticles])

  const embedWikiExcludeIds = useMemo(() => {
    const { wikis: descWikis } = getEmbedDescendants(articleId, "wiki", { notes, wikiArticles })
    return [...descWikis]
  }, [articleId, notes, wikiArticles])

  useEffect(() => {
    const handler = (e: CustomEvent<{ editor: import("@tiptap/react").Editor; editorTier?: string }>) => {
      // Only handle events from wiki-tier editors
      if (e.detail.editorTier && e.detail.editorTier !== "wiki") return
      embedNoteEditorRef.current = e.detail.editor
      setEmbedNotePickerOpen(true)
    }
    window.addEventListener("plot:embed-note-pick", handler as EventListener)
    return () => window.removeEventListener("plot:embed-note-pick", handler as EventListener)
  }, [])

  useEffect(() => {
    const handler = (e: CustomEvent<{ editor: import("@tiptap/react").Editor; editorTier?: string }>) => {
      // Only handle events from wiki-tier editors
      if (e.detail.editorTier && e.detail.editorTier !== "wiki") return
      embedWikiEditorRef.current = e.detail.editor
      setEmbedWikiPickerOpen(true)
    }
    window.addEventListener("plot:embed-wiki-pick", handler as EventListener)
    return () => window.removeEventListener("plot:embed-wiki-pick", handler as EventListener)
  }, [])

  const handleEmbedNoteSelect = useCallback((selectedNoteId: string) => {
    const editor = embedNoteEditorRef.current
    if (editor) {
      editor.chain().focus().insertContent({ type: "noteEmbed", attrs: { noteId: selectedNoteId } }).run()
    }
    setEmbedNotePickerOpen(false)
    embedNoteEditorRef.current = null
  }, [])

  const handleEmbedWikiSelect = useCallback((selectedArticleId: string) => {
    const editor = embedWikiEditorRef.current
    if (editor) {
      editor.chain().focus().insertContent({ type: "wikiEmbed", attrs: { articleId: selectedArticleId } }).run()
    }
    setEmbedWikiPickerOpen(false)
    embedWikiEditorRef.current = null
  }, [])

  const handleFootnoteCount = useCallback((blockId: string, count: number) => {
    setFootnoteCounts(prev => {
      if (prev.get(blockId) === count) return prev
      const next = new Map(prev)
      next.set(blockId, count)
      return next
    })
  }, [])

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

  // Compute cumulative footnote offsets per block
  const footnoteOffsets = useMemo(() => {
    const offsets = new Map<string, number>()
    let cumulative = 0
    for (const block of article?.blocks ?? []) {
      offsets.set(block.id, cumulative)
      if (block.type === "text") {
        cumulative += (footnoteCounts.get(block.id) ?? 0)
      }
    }
    return offsets
  }, [article?.blocks, footnoteCounts])

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

  // Improvement 1: onDragStart handler — FloatingDragDropBar only for section blocks
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const block = article?.blocks.find((b) => b.id === event.active.id)
    if (block?.type === "section") setIsDragging(true)
    setActiveDragId(event.active.id as string)
  }, [article])

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
  const visibleBlocks = useMemo(
    () => buildVisibleBlocks(article.blocks, (id) => {
      const block = article.blocks.find((b) => b.id === id)
      return !!block?.collapsed
    }),
    [article.blocks]
  )

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
      {!preview && <aside className="min-w-[160px] max-w-[240px] w-auto shrink overflow-y-auto border-r border-border-subtle px-3 py-4 hidden xl:block">
        <div className="sticky top-0">
          <h4 className="text-[1em] text-muted-foreground/65 font-semibold mb-2.5 pl-2">
            Contents
          </h4>
          {tocSections.length > 0 ? (
            <nav className="space-y-0">
              {tocSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    document.getElementById(`wiki-block-${s.id}`)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[1em] text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors duration-100"
                  style={{ paddingLeft: `${(s.level - 2) * 12 + 8}px` }}
                >
                  <span className="shrink-0 text-accent/70 font-medium text-[1em]">{s.number}.</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </nav>
          ) : (
            <p className="px-2 text-[0.8125em] text-muted-foreground/40">No sections yet</p>
          )}
        </div>
      </aside>}

      {/* Blocks Content */}
      <div className="flex-1 overflow-y-auto flex flex-col" id="wiki-article-scroll-container">
        <div className={cn("px-8 py-6 pb-40 space-y-1 flex-1", !preview && (article.contentAlign === "center" ? "max-w-4xl mx-auto" : "max-w-[780px]"))}>
          {/* Breadcrumb (parent hierarchy) */}
          <WikiBreadcrumb articleId={articleId} />

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
              className="text-[1.75em] font-bold text-foreground mb-1 bg-transparent outline-none border-b border-transparent hover:border-accent/30 focus:border-accent/50 w-full transition-colors"
            />
          ) : (
            <h1 className="text-[1.75em] font-bold text-foreground mb-1">
              {article.title}
            </h1>
          )}
          {/* Updated at */}
          <p className="text-[12px] text-muted-foreground/40 mb-1">
            Updated {shortRelative(article.updatedAt)} ago
          </p>
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

          {/* Split wiki button */}
          {editable && !splitMode && (
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSplitMode(true)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs text-muted-foreground/70 hover:text-foreground hover:bg-hover-bg transition-colors duration-100"
              >
                <Scissors size={12} weight="regular" />
                Split wiki
              </button>
            </div>
          )}

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
                      footnoteStartOffset={footnoteOffsets.get(block.id) ?? 0}
                      onFootnoteCount={handleFootnoteCount}
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
                    articleId={articleId}
                    sectionNumber={block.type === "section" ? sectionNumbers.get(block.id) : undefined}
                    onUpdate={(patch) => updateWikiBlock(articleId, block.id, patch)}
                    onDelete={() => handleDeleteBlock(block.id)}
                    footnoteStartOffset={footnoteOffsets.get(block.id) ?? 0}
                    onFootnoteCount={handleFootnoteCount}
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
                  articleId={articleId}
                  sectionNumber={block.type === "section" ? sectionNumbers.get(block.id) : undefined}
                  onUpdate={(patch) => updateWikiBlock(articleId, block.id, patch)}
                  onDelete={() => handleDeleteBlock(block.id)}
                  footnoteStartOffset={footnoteOffsets.get(block.id) ?? 0}
                  onFootnoteCount={handleFootnoteCount}
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

        {/* Wiki-level footnotes (Wikipedia style) */}
        {article && <WikiFootnotesSection article={article} />}
        {article && <WikiReferencesSection article={article} editable={editable} />}

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

      {/* Infobox Right Panel — Wikipedia style 3-column */}
      {!preview && ((article.infobox?.length ?? 0) > 0 || editable) && (
        <aside className="w-[260px] shrink-0 overflow-y-auto border-l border-border-subtle px-4 py-6 hidden xl:block">
          <div className="sticky top-0">
            <WikiInfobox
              noteId={article.id}
              kind="wiki"
              entries={article.infobox}
              editable={editable}
              headerColor={article.infoboxHeaderColor ?? null}
              onHeaderColorChange={
                editable
                  ? (color) =>
                      usePlotStore
                        .getState()
                        .updateWikiArticle(article.id, { infoboxHeaderColor: color })
                  : undefined
              }
              preset={article.infoboxPreset ?? "custom"}
              onPresetChange={
                editable
                  ? (preset, seed) => {
                      const def = INFOBOX_PRESETS.find((p) => p.preset === preset)
                      usePlotStore.getState().updateWikiArticle(article.id, {
                        infobox: seed,
                        infoboxPreset: preset,
                        // Apply preset's default header color when swapping to a non-custom preset
                        // and the user hasn't customized the header color yet (or is on custom).
                        ...(preset !== "custom" && def?.defaultHeaderColor !== undefined
                          ? { infoboxHeaderColor: def.defaultHeaderColor }
                          : {}),
                      })
                    }
                  : undefined
              }
            />
          </div>
        </aside>
      )}

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

      {/* Embed pickers for wiki TextBlock slash commands */}
      <NotePickerDialog
        open={embedNotePickerOpen}
        onOpenChange={setEmbedNotePickerOpen}
        title="Embed a note"
        excludeIds={embedNoteExcludeIds}
        onSelect={handleEmbedNoteSelect}
      />
      <WikiPickerDialog
        open={embedWikiPickerOpen}
        onOpenChange={setEmbedWikiPickerOpen}
        title="Embed a wiki article"
        excludeIds={embedWikiExcludeIds}
        onSelect={handleEmbedWikiSelect}
      />
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
  const router = useRouter()
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const setArticleCategories = usePlotStore((s) => s.setArticleCategories)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleCategoryClick = useCallback((catId: string) => {
    setSelectedNoteId(null)
    setActiveRoute("/wiki")
    setActiveCategoryView(catId)
    router.push("/wiki")
  }, [router, setSelectedNoteId])

  const assignedSet = useMemo(() => new Set(categoryIds), [categoryIds])
  const assignedCategories = useMemo(() => {
    const seen = new Set<string>()
    return wikiCategories.filter((c) => {
      if (!assignedSet.has(c.id)) return false
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
  }, [wikiCategories, assignedSet])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [dropdownOpen])

  const toggleAssign = useCallback((catId: string) => {
    if (assignedSet.has(catId)) {
      setArticleCategories(articleId, categoryIds.filter((id) => id !== catId))
    } else {
      setArticleCategories(articleId, [...categoryIds, catId])
    }
  }, [articleId, categoryIds, assignedSet, setArticleCategories])

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

  // Don't render anything if no categories and not editable
  if (assignedCategories.length === 0 && !editable) return null

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-md border border-border-subtle bg-secondary/20 px-3 py-1.5 text-[13px] min-h-[34px]">
        {assignedCategories.length > 0 && (
          <>
            <span className="text-muted-foreground/70 font-medium shrink-0">Categories:</span>
            {assignedCategories.map((cat, i) => (
              <Fragment key={cat.id}>
                {i > 0 && <span className="text-border select-none" aria-hidden>|</span>}
                <span className="group/cat inline-flex items-center gap-0.5">
                  <button
                    onClick={() => handleCategoryClick(cat.id)}
                    title={cat.parentIds.length > 0 ? getBreadcrumb(cat) : cat.name}
                    className="text-accent/80 hover:text-accent hover:underline transition-colors"
                  >
                    {cat.name}
                  </button>
                  {editable && (
                    <button
                      onClick={() => toggleAssign(cat.id)}
                      className="opacity-0 group-hover/cat:opacity-100 text-muted-foreground/50 hover:text-destructive transition-all p-0.5 -mr-0.5"
                      title={`Remove ${cat.name}`}
                    >
                      <PhX size={10} weight="bold" />
                    </button>
                  )}
                </span>
              </Fragment>
            ))}
          </>
        )}

        {/* + Add with tree dropdown (edit mode only) */}
        {editable && (
          <>
            {assignedCategories.length > 0 && <span className="text-border select-none" aria-hidden>|</span>}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-1 text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                <PhPlus size={11} weight="regular" />
                {assignedCategories.length === 0 ? "Add category" : "Add"}
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-1.5">
                  <CategoryTreePicker
                    mode="multi"
                    selectedIds={categoryIds}
                    onSelect={toggleAssign}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
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
