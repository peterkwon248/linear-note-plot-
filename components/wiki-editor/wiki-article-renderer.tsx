"use client"

/**
 * WikiArticleRenderer — Phase 2-1B-1.
 *
 * Read-only unified renderer using ColumnRenderer + WikiTitle + WikiThemeProvider.
 * Replaces hand-rolled read-mode logic in `wiki-article-view.tsx` and
 * `wiki-article-encyclopedia.tsx`. Editable mode (split UI, DnD, Virtuoso, etc.)
 * stays in the legacy renderers for now — Phase 2-1B-2 will absorb it here.
 *
 * Used by:
 *   - `note-hover-preview.tsx` (호버 프리뷰)
 *   - `wiki-embed-node.tsx` (위키 임베드)
 * Phase 2-1B-2 will migrate `wiki-view.tsx` and `secondary-panel-content.tsx`.
 *
 * 진실의 원천: docs/BRAINSTORM-2026-04-14-column-template-system.md
 */

import { useMemo, useState, useCallback, useEffect, type ReactNode } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiArticle, ColumnPath, ColumnStructure } from "@/lib/types"
import { WikiBlockRenderer, type WikiBlockVariant } from "./wiki-block-renderer"
import { InlineCategoryTags } from "./wiki-article-view"
import { WikiInfobox } from "@/components/editor/wiki-infobox"
import { WikiFootnotesSection, WikiReferencesSection } from "./wiki-footnotes-section"
import { ColumnRenderer, pathKey } from "./column-renderer"
import { WikiTitle } from "./wiki-title"
import { WikiThemeProvider } from "./wiki-theme-provider"
import { computeSectionNumbers, buildVisibleBlocks } from "@/lib/wiki-block-utils"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { cn } from "@/lib/utils"

export interface WikiArticleRendererProps {
  articleId: string
  /**
   * Variant influences block-level heading styles (encyclopedia = namu-wiki style numbered headings).
   * Layout structure itself comes from `article.columnLayout`.
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
}

/* ── Public component ─────────────────────────────────────────── */

export function WikiArticleRenderer({
  articleId,
  variant = "default",
  fontSize,
  hideTitle = false,
  hideCategories = false,
  hideFootnotes = false,
  className,
  padding,
  collapseAllCmd,
  onCollapseAllDone,
}: WikiArticleRendererProps) {
  const article = usePlotStore((s) => s.wikiArticles.find((a) => a.id === articleId))

  if (!article) {
    return (
      <div className={cn("flex-1 flex items-center justify-center text-muted-foreground/40 text-note", className)}>
        Article not found
      </div>
    )
  }

  return (
    <WikiArticleRendererInner
      article={article}
      variant={variant}
      fontSize={fontSize}
      hideTitle={hideTitle}
      hideCategories={hideCategories}
      hideFootnotes={hideFootnotes}
      className={className}
      padding={padding}
      collapseAllCmd={collapseAllCmd}
      onCollapseAllDone={onCollapseAllDone}
    />
  )
}

/* ── Inner (article guaranteed non-null) ──────────────────────── */

function WikiArticleRendererInner({
  article,
  variant,
  fontSize,
  hideTitle,
  hideCategories,
  hideFootnotes,
  className,
  padding,
  collapseAllCmd,
  onCollapseAllDone,
}: Required<Pick<WikiArticleRendererProps, "variant" | "hideTitle" | "hideCategories" | "hideFootnotes">> & {
  article: WikiArticle
  fontSize?: number
  className?: string
  padding?: string
  collapseAllCmd?: "collapse" | "expand" | null
  onCollapseAllDone?: () => void
}) {
  /* ── Section numbers + visible blocks (respecting collapsed sections) ── */
  const sectionNumbers = useMemo(() => computeSectionNumbers(article.blocks), [article.blocks])

  // Collapsed state: read mode uses local Set + collapseAll command. Persisted block.collapsed
  // is also honored as initial state.
  const initialCollapsed = useMemo(() => {
    const s = new Set<string>()
    for (const b of article.blocks) {
      if (b.type === "section" && b.collapsed) s.add(b.id)
    }
    return s
  }, [article.blocks])
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(initialCollapsed)
  const toggleSection = useCallback((blockId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(blockId)) next.delete(blockId)
      else next.add(blockId)
      return next
    })
  }, [])

  // Honor collapseAllCmd from parent
  const sectionBlockIds = useMemo(
    () => article.blocks.filter((b) => b.type === "section").map((b) => b.id),
    [article.blocks],
  )
  useEffect(() => {
    if (!collapseAllCmd) return
    setCollapsedSections(collapseAllCmd === "collapse" ? new Set(sectionBlockIds) : new Set())
    onCollapseAllDone?.()
  }, [collapseAllCmd, sectionBlockIds, onCollapseAllDone])

  const visibleBlocks = useMemo(
    () => buildVisibleBlocks(article.blocks, (id) => collapsedSections.has(id)),
    [article.blocks, collapsedSections],
  )
  const visibleBlockIdSet = useMemo(() => new Set(visibleBlocks.map((b) => b.id)), [visibleBlocks])

  /* ── Footnote offsets (each text block reports its footnote count) ── */
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

  /* ── Layout + column assignments (with safe fallbacks) ── */
  const layout: ColumnStructure = article.columnLayout ?? {
    type: "columns",
    columns: [{ ratio: 1, content: { type: "blocks", blockIds: article.blocks.map((b) => b.id) } }],
  }
  const isMultiColumn = layout.columns.length > 1

  /* ── Meta slot positions: TOC + infobox ── */
  const tocStyle = article.tocStyle ?? {
    show: true,
    // Multi-column → TOC in last column; single → top of main column
    position: isMultiColumn ? [layout.columns.length - 1] as ColumnPath : [0] as ColumnPath,
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
    if (article.infobox.length > 0) {
      const key = pathKey(infoboxColumnPath)
      slots[key] = (
        <div className={isMultiColumn ? "" : "max-w-sm mx-auto"}>
          <WikiInfobox
            noteId={article.id}
            entityType="wiki"
            entries={article.infobox}
            editable={false}
            headerColor={article.infoboxHeaderColor ?? null}
          />
        </div>
      )
    }
    return slots
  }, [tocStyle, tocSections, article.infobox, article.id, article.infoboxHeaderColor, infoboxColumnPath, isMultiColumn])

  /* ── Block render callback ── */
  const renderBlock = useCallback(
    (blockId: string) => {
      // Skip blocks hidden by collapsed sections
      if (!visibleBlockIdSet.has(blockId)) return null
      const block = article.blocks.find((b) => b.id === blockId)
      if (!block) return null
      const num = block.type === "section" ? sectionNumbers.get(block.id) : undefined
      return (
        <div key={block.id} id={`wiki-block-${block.id}`}>
          <WikiBlockRenderer
            block={block}
            editable={false}
            sectionNumber={num}
            variant={variant}
            onToggleCollapse={() => toggleSection(block.id)}
            collapsed={collapsedSections.has(block.id)}
            footnoteStartOffset={footnoteOffsets.get(block.id) ?? 0}
            onFootnoteCount={handleFootnoteCount}
          />
        </div>
      )
    },
    [visibleBlockIdSet, article.blocks, sectionNumbers, variant, collapsedSections, toggleSection, footnoteOffsets, handleFootnoteCount],
  )

  /* ── Render ── */
  const fontStyle = fontSize ? { fontSize: `${fontSize}em` } : undefined
  const padClass = padding ?? (variant === "encyclopedia" ? "px-10 py-6" : "px-8 py-6")

  return (
    <WikiThemeProvider
      themeColor={article.themeColor}
      className={cn("wiki-article-renderer flex-1 overflow-y-auto", className)}
      as="article"
    >
      <div className={padClass} style={fontStyle}>
        {/* Title area */}
        {!hideTitle && (
          <WikiTitle
            title={article.title}
            aliases={article.aliases}
            titleStyle={article.titleStyle}
            themeColor={article.themeColor}
            editable={false}
          />
        )}

        {/* Categories row */}
        {!hideCategories && (
          <div className="mb-4">
            <InlineCategoryTags articleId={article.id} categoryIds={article.categoryIds ?? []} editable={false} />
          </div>
        )}

        {/* Column-based body */}
        <ColumnRenderer layout={layout} renderBlock={renderBlock} metaSlots={metaSlots} />

        {/* Empty state */}
        {article.blocks.length === 0 && (
          <p className="py-8 text-center text-note text-muted-foreground/40">
            This article has no content yet.
          </p>
        )}

        {/* Footnotes / references (Wikipedia style) */}
        {!hideFootnotes && (
          <>
            <WikiFootnotesSection article={article} />
            <WikiReferencesSection article={article} editable={false} />
          </>
        )}
      </div>
    </WikiThemeProvider>
  )
}

/* ── Inline Collapsible TOC (Wikipedia / namu-wiki style) ─────── */

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
    <div className="rounded-lg border border-border bg-secondary/30 max-w-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-3 w-full text-left"
      >
        <span className="font-bold text-foreground/80">Contents</span>
        <CaretDown
          size={14}
          weight="bold"
          className={cn(
            "text-muted-foreground transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-3.5 space-y-1">
          {sections.map((s) => (
            <div key={s.id} style={{ paddingLeft: (s.level - 2) * 16 }}>
              <button
                onClick={() => {
                  document.getElementById(`wiki-block-${s.id}`)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }}
                className="text-accent/80 hover:text-accent transition-colors text-note"
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
