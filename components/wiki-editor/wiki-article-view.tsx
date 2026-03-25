"use client"

import { useState, useMemo, useCallback } from "react"
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
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
  type DragOverEvent,
} from "@dnd-kit/core"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { CaretUp } from "@phosphor-icons/react/dist/ssr/CaretUp"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Image as PhImage } from "@phosphor-icons/react/dist/ssr/Image"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"

/** Drop zone for splitting sections into new articles via drag */
function SplitDropZone({ isOver }: { isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: "split-dropzone" })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mt-4 rounded-lg border-2 border-dashed px-3 py-4 text-center transition-all duration-150",
        isOver
          ? "border-accent bg-accent/10 text-accent"
          : "border-border/40 text-muted-foreground/40"
      )}
    >
      <Scissors size={16} weight="regular" className="mx-auto mb-1" />
      <p className="text-2xs font-medium">
        {isOver ? "Drop to split" : "Drag section here"}
      </p>
    </div>
  )
}

interface WikiArticleViewProps {
  articleId: string
  editable?: boolean
  onDelete?: () => void
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

export function WikiArticleView({ articleId, editable = false, onDelete }: WikiArticleViewProps) {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const addWikiBlock = usePlotStore((s) => s.addWikiBlock)
  const removeWikiBlock = usePlotStore((s) => s.removeWikiBlock)
  const updateWikiBlock = usePlotStore((s) => s.updateWikiBlock)
  const reorderWikiBlocks = usePlotStore((s) => s.reorderWikiBlocks)
  const setWikiArticleStatus = usePlotStore((s) => s.setWikiArticleStatus)
  const setWikiArticleInfobox = usePlotStore((s) => s.setWikiArticleInfobox)
  const splitWikiArticle = usePlotStore((s) => s.splitWikiArticle)

  const [splitMode, setSplitMode] = useState(false)
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
  const [splitTitle, setSplitTitle] = useState("")
  const [dragOverDropzone, setDragOverDropzone] = useState(false)

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

  const handleAddBlock = useCallback((type: WikiBlock["type"], afterBlockId?: string, level?: number) => {
    const block: Omit<WikiBlock, "id"> = { type }
    if (type === "section") { block.title = ""; block.level = level ?? 2 }
    if (type === "text") { block.content = "" }
    addWikiBlock(articleId, block, afterBlockId)
  }, [articleId, addWikiBlock])

  const handleDeleteBlock = useCallback((blockId: string) => {
    removeWikiBlock(articleId, blockId)
  }, [articleId, removeWikiBlock])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDragOverDropzone(false)
    const { active, over } = event
    if (!over || !article) return

    // Dropped on split dropzone → split this section into new article
    if (over.id === "split-dropzone") {
      const draggedBlockId = active.id as string
      const block = article.blocks.find((b) => b.id === draggedBlockId)
      if (block?.type === "section") {
        handleSplitSection(draggedBlockId)
      }
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
  }, [article, articleId, reorderWikiBlocks])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setDragOverDropzone(event.over?.id === "split-dropzone")
  }, [])

  if (!article) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/60">
          <BookOpen className="text-muted-foreground/40" size={20} weight="regular" />
        </div>
        <p className="text-sm text-muted-foreground/60">Article not found</p>
      </div>
    )
  }

  // Section numbers: blockId → "1", "2.1", etc.
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

  // Map blockId → nearest section level at-or-above that block
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

  const outerContent = (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* TOC Sidebar */}
      <aside className="w-[200px] shrink-0 overflow-y-auto border-r border-border/50 px-3 py-4">
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
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-note text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors duration-100"
                  style={{ paddingLeft: `${(s.level - 2) * 12 + 8}px` }}
                >
                  <span className="shrink-0 text-accent font-semibold text-2xs">{s.number}.</span>
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </nav>
          ) : (
            <p className="px-2 text-2xs text-muted-foreground/40">No sections yet</p>
          )}
          {editable && <SplitDropZone isOver={dragOverDropzone} />}
        </div>
      </aside>

      {/* Blocks Content */}
      <div className="flex-1 overflow-y-auto flex flex-col" id="wiki-article-scroll-container">
        <div className="max-w-[780px] px-8 py-6 space-y-1 flex-1">
          {/* Title */}
          <h1 className="text-[26px] font-bold text-foreground mb-1">
            {article.title}
          </h1>
          {article.aliases.length > 0 && (
            <p className="text-note text-muted-foreground/50 mb-6">
              {article.aliases.join(" · ")}
            </p>
          )}

          {/* Blocks */}
          {editable && (
            <AddBlockButton onAdd={(type) => handleAddBlock(type)} />
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

          {article.blocks.length === 0 && !editable && (
            <p className="py-8 text-center text-sm text-muted-foreground/40">
              This article has no content yet.
            </p>
          )}
        </div>

        {splitMode && (
          <div className="sticky bottom-0 z-20 border-t border-border bg-popover px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1.5">
                  {selectedBlockIds.size} block{selectedBlockIds.size !== 1 ? "s" : ""} selected
                </p>
                <input
                  type="text"
                  value={splitTitle}
                  onChange={(e) => setSplitTitle(e.target.value)}
                  placeholder="New article title..."
                  className="h-8 w-full rounded-md border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <button
                onClick={() => { setSplitMode(false); setSelectedBlockIds(new Set()); setSplitTitle("") }}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
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
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Scissors size={12} weight="regular" className="inline mr-1" />
                Extract
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Infobox + Quality + Activity */}
      <aside className="w-[240px] shrink-0 overflow-y-auto border-l border-border/50 px-4 py-5 space-y-4">
        {/* Infobox */}
        <WikiInfobox
          noteId={articleId}
          entries={article.infobox}
          editable={true}
          className="w-full"
        />

        {/* Tags as categories */}
        {article.tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-2xs font-medium uppercase tracking-wide text-muted-foreground/40">
              Categories
            </h4>
            <div className="flex flex-wrap gap-1">
              <TagBadges tagIds={article.tags} />
            </div>
          </div>
        )}

        {/* Quality */}
        <div className="space-y-2">
          <h4 className="text-2xs font-medium uppercase tracking-wide text-muted-foreground/40">
            Quality
          </h4>
          {(() => {
            const isArticle = article.wikiStatus === "article" || (article.wikiStatus as string) === "complete"
            const label = isArticle ? "Article" : "Stub"
            return (
              <>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isArticle ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {label}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {!isArticle && (
                    <button
                      onClick={() => setWikiArticleStatus(articleId, "article")}
                      className="flex items-center gap-1 rounded-md bg-emerald-500/8 px-2 py-1 text-xs font-medium text-emerald-400 transition-colors duration-100 hover:bg-emerald-500/15"
                    >
                      <CaretUp size={12} weight="regular" />
                      Promote to Article
                    </button>
                  )}
                  {isArticle && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <PhCheck size={12} weight="bold" />
                      Article
                    </span>
                  )}
                </div>
              </>
            )
          })()}
        </div>

        {/* Sources — auto-extracted from blocks */}
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
          <div className="pt-2 border-t border-border/30 space-y-0.5">
            {editable && !splitMode && (
              <button
                onClick={() => setSplitMode(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground/70 hover:text-foreground hover:bg-secondary/60 transition-colors duration-100"
              >
                <Scissors size={12} weight="regular" />
                Split wiki
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors duration-100"
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
        {outerContent}
      </DndContext>
    )
  }

  return outerContent
}

/* ── Sources List ── */
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
            className="flex w-full items-center gap-2 rounded-md px-2 py-[6px] text-left transition-colors duration-100 hover:bg-hover-bg"
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

/* ── Tag Badges ── */
function TagBadges({ tagIds }: { tagIds: string[] }) {
  const tags = usePlotStore((s) => s.tags)
  return (
    <>
      {tagIds.map((tagId) => {
        const tag = tags.find((t) => t.id === tagId)
        return (
          <span
            key={tagId}
            className="rounded-[5px] bg-secondary/50 px-1.5 py-0.5 text-2xs font-medium text-foreground/70"
          >
            {tag?.name ?? tagId}
          </span>
        )
      })}
    </>
  )
}
