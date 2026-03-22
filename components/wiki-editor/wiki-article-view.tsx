"use client"

import { useMemo, useCallback } from "react"
import { BookOpen, ChevronUp, Check, FileText, ImageIcon } from "lucide-react"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, WikiBlock } from "@/lib/types"
import { WikiBlockRenderer, AddBlockButton } from "./wiki-block-renderer"
import { WikiInfobox } from "@/components/editor/wiki-infobox"
import { shortRelative } from "@/lib/format-utils"

interface WikiArticleViewProps {
  articleId: string
  editable?: boolean
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

export function WikiArticleView({ articleId, editable = false }: WikiArticleViewProps) {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const addWikiBlock = usePlotStore((s) => s.addWikiBlock)
  const removeWikiBlock = usePlotStore((s) => s.removeWikiBlock)
  const updateWikiBlock = usePlotStore((s) => s.updateWikiBlock)
  const setWikiArticleStatus = usePlotStore((s) => s.setWikiArticleStatus)
  const setWikiArticleInfobox = usePlotStore((s) => s.setWikiArticleInfobox)

  const article = useMemo(
    () => wikiArticles.find((a) => a.id === articleId),
    [wikiArticles, articleId]
  )

  const handleAddBlock = useCallback((type: WikiBlock["type"], afterBlockId?: string) => {
    const block: Omit<WikiBlock, "id"> = { type }
    if (type === "section") { block.title = ""; block.level = 2 }
    if (type === "text") { block.content = "" }
    addWikiBlock(articleId, block, afterBlockId)
  }, [articleId, addWikiBlock])

  const handleDeleteBlock = useCallback((blockId: string) => {
    removeWikiBlock(articleId, blockId)
  }, [articleId, removeWikiBlock])

  if (!article) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/60">
          <BookOpen className="h-5 w-5 text-muted-foreground/40" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-muted-foreground/60">Article not found</p>
      </div>
    )
  }

  // Section numbers: blockId → "1", "2.1", etc.
  const sectionNumbers = useMemo(() => computeSectionNumbers(article.blocks), [article.blocks])

  // Compute which blocks are hidden due to collapsed sections
  const hiddenBlockIds = useMemo(() => {
    const hidden = new Set<string>()
    let collapsingLevel: number | null = null

    for (const block of article.blocks) {
      if (block.type === "section") {
        const level = block.level ?? 2
        // If we're collapsing and hit a same/higher level section, stop collapsing
        if (collapsingLevel !== null && level <= collapsingLevel) {
          collapsingLevel = null
        }
        // If this section is collapsed, start hiding everything after it
        if (block.collapsed) {
          collapsingLevel = level
          continue
        }
      } else if (collapsingLevel !== null) {
        hidden.add(block.id)
      }
    }
    return hidden
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

  return (
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
        </div>
      </aside>

      {/* Blocks Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[780px] px-8 py-6 space-y-1">
          {/* Title */}
          <h1 className="text-[26px] font-bold text-foreground mb-1">
            {article.title}
          </h1>
          {article.aliases.length > 0 && (
            <p className="text-[13px] text-muted-foreground/50 mb-6">
              {article.aliases.join(" · ")}
            </p>
          )}

          {/* Blocks */}
          {editable && (
            <AddBlockButton onAdd={(type) => handleAddBlock(type)} />
          )}

          {article.blocks.filter((b) => !hiddenBlockIds.has(b.id)).map((block) => (
              <div key={block.id} id={`wiki-block-${block.id}`}>
                <WikiBlockRenderer
                  block={block}
                  editable={editable}
                  sectionNumber={block.type === "section" ? sectionNumbers.get(block.id) : undefined}
                  onUpdate={(patch) => updateWikiBlock(articleId, block.id, patch)}
                  onDelete={() => handleDeleteBlock(block.id)}
                />
                {editable && (
                  <AddBlockButton
                    onAdd={(type) => handleAddBlock(type, block.id)}
                  />
                )}
              </div>
          ))}

          {article.blocks.length === 0 && !editable && (
            <p className="py-8 text-center text-sm text-muted-foreground/40">
              This article has no content yet.
            </p>
          )}
        </div>
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
            <h4 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/40">
              Categories
            </h4>
            <div className="flex flex-wrap gap-1">
              <TagBadges tagIds={article.tags} />
            </div>
          </div>
        )}

        {/* Quality */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/40">
            Quality
          </h4>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
              article.wikiStatus === "stub" ? "bg-yellow-500/10 text-yellow-500" :
              article.wikiStatus === "draft" ? "bg-blue-500/10 text-blue-500" :
              "bg-emerald-500/10 text-emerald-500"
            }`}>
              {article.wikiStatus}
            </span>
          </div>
          <div className="flex gap-1.5">
            {article.wikiStatus === "stub" && (
              <button
                onClick={() => setWikiArticleStatus(articleId, "draft")}
                className="flex items-center gap-1 rounded-md bg-blue-500/8 px-2 py-1 text-xs font-medium text-blue-400 transition-colors duration-100 hover:bg-blue-500/15"
              >
                <ChevronUp className="h-3 w-3" />
                Promote to Draft
              </button>
            )}
            {article.wikiStatus === "draft" && (
              <button
                onClick={() => setWikiArticleStatus(articleId, "complete")}
                className="flex items-center gap-1 rounded-md bg-emerald-500/8 px-2 py-1 text-xs font-medium text-emerald-400 transition-colors duration-100 hover:bg-emerald-500/15"
              >
                <ChevronUp className="h-3 w-3" />
                Mark Complete
              </button>
            )}
            {article.wikiStatus === "complete" && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Check className="h-3 w-3" />
                Complete
              </span>
            )}
          </div>
        </div>

        {/* Sources — auto-extracted from blocks */}
        <SourcesList blocks={article.blocks} />

        {/* Activity */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/40">
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
      </aside>
    </div>
  )
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
      <h4 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/40">
        Sources
      </h4>
      <div className="space-y-px">
        {sources.map((src, i) => (
          <button
            key={`${src.type}-${src.id}`}
            onClick={() => {
              document.getElementById(`wiki-block-${src.blockId}`)?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              })
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-[6px] text-left transition-colors duration-100 hover:bg-white/[0.03]"
          >
            <span className="shrink-0 text-2xs font-semibold text-accent/40 tabular-nums w-4">
              {i + 1}
            </span>
            {src.type === "note" && <FileText className="h-3 w-3 shrink-0 text-muted-foreground/40" strokeWidth={1.5} />}
            {src.type === "image" && <ImageIcon className="h-3 w-3 shrink-0 text-muted-foreground/40" strokeWidth={1.5} />}
            <span className="flex-1 min-w-0 truncate text-[11px] text-foreground/70">
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
            className="rounded-[5px] bg-secondary/50 px-1.5 py-0.5 text-[11px] font-medium text-foreground/70"
          >
            {tag?.name ?? tagId}
          </span>
        )
      })}
    </>
  )
}
