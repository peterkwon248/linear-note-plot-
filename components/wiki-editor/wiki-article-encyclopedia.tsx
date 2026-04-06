"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, WikiBlock, WikiSectionIndex } from "@/lib/types"
import { WikiBlockRenderer, AddBlockButton } from "./wiki-block-renderer"
import { SortableBlockItem } from "./sortable-block-item"
import { InlineCategoryTags } from "./wiki-article-view"
import { WikiInfobox } from "@/components/editor/wiki-infobox"
import { UrlInputDialog } from "@/components/editor/url-input-dialog"
import { cn } from "@/lib/utils"
import { shortRelative } from "@/lib/format-utils"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Image as PhImage } from "@phosphor-icons/react/dist/ssr/Image"
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
  const handleAddBlock = useCallback((type: string, afterBlockId?: string, level?: number) => {
    if (type === "table") {
      const block: Omit<WikiBlock, "id"> = {
        type: "table",
        tableCaption: "",
        tableHeaders: ["Header 1", "Header 2", "Header 3"],
        tableRows: [["", "", ""]],
        tableColumnAligns: ["center", "center", "center"],
      }
      addWikiBlock(article.id, block, afterBlockId)
      return
    }

    if (type === "url") {
      setUrlBlockDialog({ open: true, afterBlockId })
      return
    }

    // Content blocks: create Text block with pre-filled TipTap content
    if (type.startsWith("text:")) {
      const subtype = type.split(":")[1]
      const contentJson = getInitialContentJson(subtype)
      const block: Omit<WikiBlock, "id"> = { type: "text", content: "", contentJson }
      addWikiBlock(article.id, block, afterBlockId)
      return
    }

    const block: Omit<WikiBlock, "id"> = { type: type as WikiBlock["type"] }
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
  const [urlBlockDialog, setUrlBlockDialog] = useState<{ open: boolean; afterBlockId?: string }>({ open: false })

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
        {isEditing && <AddBlockButton onAdd={(type, level) => handleAddBlock(type, undefined, level)} />}

        {/* Empty state */}
        {article.blocks.length === 0 && !isEditing && (
          <p className="py-8 text-center text-note text-white/40">
            This article has no content yet.
          </p>
        )}

        {/* Clear float */}
        <div className="clear-both" />

        {/* ── Bottom Reference Sections ── */}
        <EncyclopediaFooter article={article} />
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

/* ── Encyclopedia Footer (Sources / See Also / Article Info) ── */

function EncyclopediaFooter({ article }: { article: WikiArticle }) {
  const notes = usePlotStore((s) => s.notes)
  const attachments = usePlotStore((s) => s.attachments)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  // Sources: note-ref blocks and image blocks
  const sourceBlocks = useMemo(() => {
    const items: { id: string; blockId: string; type: "note" | "image"; label: string }[] = []
    const seenNotes = new Set<string>()
    const seenAttachments = new Set<string>()

    for (const block of article.blocks) {
      if (block.type === "note-ref" && block.noteId && !seenNotes.has(block.noteId)) {
        seenNotes.add(block.noteId)
        const note = notes.find((n) => n.id === block.noteId)
        items.push({
          id: block.noteId,
          blockId: block.id,
          type: "note",
          label: note?.title || "Untitled",
        })
      }
      if (block.type === "image" && block.attachmentId && !seenAttachments.has(block.attachmentId)) {
        seenAttachments.add(block.attachmentId)
        const att = attachments.find((a) => a.id === block.attachmentId)
        items.push({
          id: block.attachmentId,
          blockId: block.id,
          type: "image",
          label: att?.name || block.caption || "Image",
        })
      }
    }
    return items
  }, [article.blocks, notes, attachments])

  // See Also: related wiki articles (referenced by this article + articles that reference this one)
  const relatedArticles = useMemo(() => {
    const related = new Map<string, { id: string; title: string }>()

    // 1. Notes referenced by this article → check if they're wiki articles
    for (const block of article.blocks) {
      if (block.type === "note-ref" && block.noteId) {
        const wa = wikiArticles.find((a) => a.id === block.noteId)
        if (wa && wa.id !== article.id) {
          related.set(wa.id, { id: wa.id, title: wa.title })
        }
      }
    }

    // 2. Backlinks: other wiki articles that reference this article via note-ref blocks
    for (const wa of wikiArticles) {
      if (wa.id === article.id) continue
      for (const block of wa.blocks) {
        if (block.type === "note-ref" && block.noteId === article.id) {
          related.set(wa.id, { id: wa.id, title: wa.title })
          break
        }
      }
    }

    return Array.from(related.values())
  }, [article, wikiArticles])

  // Counts
  const noteRefCount = useMemo(
    () => article.blocks.filter((b) => b.type === "note-ref" && b.noteId).length,
    [article.blocks]
  )
  const imageCount = useMemo(
    () => article.blocks.filter((b) => b.type === "image").length,
    [article.blocks]
  )

  const hasAnySections = sourceBlocks.length > 0 || relatedArticles.length > 0

  if (!hasAnySections && article.blocks.length === 0) return null

  return (
    <div className="mt-12 border-t border-border/40 pt-6 space-y-8 text-lg text-foreground/70">
      {/* Sources (출처) */}
      {sourceBlocks.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-3">Sources</h3>
          <ol className="list-decimal list-inside space-y-1">
            {sourceBlocks.map((src, i) => (
              <li key={`${src.type}-${src.id}`} className="flex items-center gap-2">
                <span className="shrink-0 text-sm font-semibold text-accent/70 tabular-nums w-5 text-right">
                  {i + 1}.
                </span>
                {src.type === "note" && <FileText className="shrink-0 text-muted-foreground/60" size={13} weight="regular" />}
                {src.type === "image" && <PhImage className="shrink-0 text-muted-foreground/60" size={13} weight="regular" />}
                <button
                  onClick={() => {
                    if (src.type === "note") {
                      usePlotStore.getState().openSidePeek(src.id)
                    } else {
                      document.getElementById(`wiki-block-${src.blockId}`)?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      })
                    }
                  }}
                  className="text-accent hover:text-accent hover:underline transition-colors truncate"
                >
                  {src.label}
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* See Also (관련 문서) */}
      {relatedArticles.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-3">See Also</h3>
          <ul className="space-y-1">
            {relatedArticles.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => navigateToWikiArticle(a.id)}
                  className="text-accent hover:text-accent hover:underline transition-colors"
                >
                  {a.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Article Info (문서 정보) */}
      <section>
        <h3 className="text-xl font-semibold text-foreground mb-3">Article Info</h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-1">
          <dt className="text-muted-foreground">Blocks</dt>
          <dd>{article.blocks.length}</dd>
          <dt className="text-muted-foreground">References</dt>
          <dd>{noteRefCount}</dd>
          <dt className="text-muted-foreground">Images</dt>
          <dd>{imageCount}</dd>
          <dt className="text-muted-foreground">Last modified</dt>
          <dd>{shortRelative(article.updatedAt)}</dd>
        </dl>
      </section>
    </div>
  )
}
