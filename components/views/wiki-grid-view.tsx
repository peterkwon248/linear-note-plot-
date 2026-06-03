"use client"

/**
 * WikiGridView — Books-grid-parity card grid for Wiki articles.
 *
 * Before this existed, Wiki grid mode fell through to the default list
 * (WikiList row table). User signal (2026-05-24): "북스의 그리드
 * 디스플레이처럼 해야지" — true card grid like
 * `components/books/book-grid-card.tsx` + the books-view `grid` branch.
 *
 * 2026-06-04 (#6): board parity — grid cards gain the top-right selection
 * checkbox (so multi-select works) + a `visibleColumns`-driven property chip
 * row (status/category/links/reads/tags/aliases/parent/children/time) mirroring
 * the wiki BOARD card. Chip-building logic is intentionally a 1:1 mirror of
 * wiki-board.tsx CardInner so both surfaces stay consistent.
 *
 * Pure presentational. Caller (wiki-view.tsx) owns ViewHeader, filter
 * panel, and selection state (`selectedArticleIds`).
 */

import { useMemo } from "react"
import { Pin as PushPin, Check as PhCheck } from "lucide-react"
import { StatusShapeIcon } from "@/components/status-icon"
import { STATUS_CONFIG, PriorityBadge } from "@/components/note-fields"
import { shortRelative } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"
import { usePlotStore } from "@/lib/store"
import { useListNavCapture } from "@/hooks/use-list-nav-capture"
import {
  LinksChip,
  ReadsChip,
  CategoryChip,
  UpdatedChip,
  CreatedChip,
  ParentChip,
  ChildrenChip,
  AliasesChip,
  PropertyChipRow,
} from "@/components/property-chips"
import type { WikiArticle, WikiCategory } from "@/lib/types"

interface WikiGridViewProps {
  articles: WikiArticle[]
  onOpen: (articleId: string) => void
  activeArticleId?: string | null
  /** Display Properties — which meta chips to surface (board/list parity).
   *  Undefined = show all (back-compat). */
  visibleColumns?: string[]
  /** WikiCategory entities for category-chip name/color resolution. */
  wikiCategories?: WikiCategory[]
  /** Inbound backlink counts (id → count). Drives the "Backlinks" chip with
   *  the same semantics as the board (NOT linksOut). Optional — when omitted
   *  the chip is suppressed. */
  backlinkCounts?: Map<string, number>
  /** Selected article ids (board/list-parity multi-select). */
  selectedIds?: Set<string>
  /** Toggle a card's selection (hover checkbox / single click). */
  onSelect?: (id: string, e: React.MouseEvent) => void
}

function WikiGridCard({
  article,
  isActive,
  isSelected,
  visibleColumns,
  wikiCategories,
  backlinks,
  parentTitle,
  childrenCount,
  onOpen,
  onSelect,
}: {
  article: WikiArticle
  isActive: boolean
  isSelected: boolean
  visibleColumns?: string[]
  wikiCategories: WikiCategory[]
  backlinks: number
  parentTitle?: string
  childrenCount?: number
  onOpen: () => void
  onSelect?: (id: string, e: React.MouseEvent) => void
}) {
  const t = useT()
  const blockCount = article.blocks?.length ?? 0
  const statusCfg = STATUS_CONFIG[article.status] ?? STATUS_CONFIG.backlog

  // Display Property gates — undefined visibleColumns = show all (back-compat).
  const isVisible = (key: string) => !visibleColumns || visibleColumns.includes(key)
  const showStatus = isVisible("status")

  // Resolve every category to {name, color} so CategoryChip can colour them.
  const categoryEntries = useMemo(() => {
    const ids = article.categoryIds ?? []
    if (ids.length === 0) return []
    return ids
      .map((id) => {
        const c = wikiCategories.find((wc) => wc.id === id)
        return c ? { id, name: c.name, color: c.color } : null
      })
      .filter((c): c is { id: string; name: string; color: string } => !!c)
  }, [article.categoryIds, wikiCategories])

  const reads = article.reads ?? 0
  const aliases = article.aliases ?? []

  // Build the property chip row — 1:1 mirror of wiki-board.tsx CardInner.
  // Grid has no groupBy suppression (flat grid), so every visible property
  // renders. Status chip stays anchored left; the rest collapse via the row cap.
  const propertyChips = useMemo(() => {
    const out: React.ReactNode[] = []
    if (isVisible("priority") && article.priority && article.priority !== "none") {
      out.push(<PriorityBadge key="priority" priority={article.priority} />)
    }
    if (isVisible("tags") && categoryEntries.length > 0) {
      for (const c of categoryEntries) {
        out.push(<CategoryChip key={`cat-${c.id}`} name={c.name} color={c.color} />)
      }
    }
    if (parentTitle && isVisible("parent")) {
      out.push(<ParentChip key="parent" title={parentTitle} />)
    }
    if (isVisible("children") && (childrenCount ?? 0) > 0) {
      out.push(<ChildrenChip key="children" count={childrenCount!} />)
    }
    if (isVisible("links") && backlinks > 0) {
      out.push(<LinksChip key="links" count={backlinks} />)
    }
    if (isVisible("reads") && reads > 0) {
      out.push(<ReadsChip key="reads" count={reads} />)
    }
    if (isVisible("aliases") && aliases.length > 0) {
      out.push(<AliasesChip key="aliases" count={aliases.length} />)
    }
    if (isVisible("updatedAt")) {
      out.push(<UpdatedChip key="updated" iso={article.updatedAt} />)
    }
    if (isVisible("createdAt")) {
      out.push(<CreatedChip key="created" iso={article.createdAt} />)
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visibleColumns, categoryEntries, parentTitle, childrenCount,
    backlinks, reads, aliases.length, article.updatedAt, article.createdAt, article.priority,
  ])

  const trashed = (article as { trashed?: boolean }).trashed

  return (
    <div
      data-wiki-grid-card
      data-article-id={article.id}
      onClick={(e) => {
        // Board/list parity: single click toggles selection when a select
        // handler is wired; otherwise opens the article. Double-click opens.
        if (onSelect && !trashed) {
          e.stopPropagation()
          onSelect(article.id, e)
        } else {
          onOpen()
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-all",
        trashed
          ? "border-border/60 opacity-50 cursor-default"
          : "border-border/60 hover:bg-hover-bg hover:border-border hover:shadow-sm",
        isSelected
          ? "border-accent/60 bg-accent/[0.04] ring-1 ring-accent/20"
          : isActive && "border-accent/60 bg-accent/[0.04]",
      )}
    >
      {/* Selection checkbox — hover or selected (board/list parity).
          Click stops propagation so it never opens the article. */}
      {onSelect && (
        <div
          className={cn(
            "absolute right-2 top-2 z-10 flex h-4 w-4 items-center justify-center rounded border transition-all cursor-pointer",
            isSelected
              ? "border-accent bg-accent opacity-100"
              : "border-border bg-card opacity-0 group-hover:opacity-100 hover:border-foreground/50",
          )}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(article.id, e)
          }}
        >
          {isSelected && <PhCheck className="text-accent-foreground" size={10} strokeWidth={2.5} />}
        </div>
      )}

      {/* Pin — yields its slot to the checkbox on hover/select. */}
      {article.pinned && (
        <PushPin
          size={11}
          fill="currentColor"
          strokeWidth={2}
          className={cn(
            "absolute top-2 text-amber-500 transition-all",
            isSelected ? "right-8" : "right-2 group-hover:right-8",
          )}
        />
      )}

      {/* Status icon — shared 4-circle StatusShapeIcon (manual 4-stage status,
          unified with Notes — v151). LOCKED #103: color tone only, no box. */}
      <StatusShapeIcon status={article.status} size={22} />

      {/* Title */}
      <h3 className="text-note font-medium text-foreground line-clamp-2 leading-snug">
        {article.title || "Untitled"}
      </h3>

      {/* Property chip row — status chip keeps its own left-anchored slot
          (board parity) so it stays put when the rest overflow into "+N". */}
      {(showStatus || propertyChips.length > 0) && (
        <div className="flex items-center gap-1 min-w-0">
          {showStatus && (
            <span
              className="inline-flex items-center gap-1 h-5 rounded-sm px-1.5 text-2xs font-medium leading-none whitespace-nowrap shrink-0"
              style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
            >
              <StatusShapeIcon status={article.status} size={10} />
              {t(statusCfg.labelKey)}
            </span>
          )}
          {propertyChips.length > 0 && (
            <PropertyChipRow chips={propertyChips} maxVisible={3} />
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Footer — block count + relative time (Books "N items · time" parity). */}
      <div className="mt-1 flex items-center gap-2 text-2xs text-muted-foreground/70">
        <span className="tabular-nums">
          {blockCount} block{blockCount === 1 ? "" : "s"}
        </span>
        <span>·</span>
        <span>{shortRelative(article.updatedAt)}</span>
      </div>
    </div>
  )
}

export function WikiGridView({
  articles,
  onOpen,
  activeArticleId,
  visibleColumns,
  wikiCategories = [],
  backlinkCounts,
  selectedIds,
  onSelect,
}: WikiGridViewProps) {
  // list-context-navigation: freeze the grid's row-major article order into
  // listNavContext right before opening (editor "← N/M →").
  const captureListNav = useListNavCapture("wiki")

  // PR e parity (board): subscribe to the full wikiArticles slice so parent /
  // children chips resolve against articles OUTSIDE the current filtered view.
  // Gated on whether the chip is actually displayable to avoid needless work.
  const allWikiArticles = usePlotStore((s) => s.wikiArticles) as WikiArticle[]
  const showParentChip = !visibleColumns || visibleColumns.includes("parent")
  const showChildrenChip = !visibleColumns || visibleColumns.includes("children")

  const articlesById = useMemo(() => {
    if (!showParentChip) return null
    const m = new Map<string, WikiArticle>()
    for (const a of allWikiArticles) m.set(a.id, a)
    return m
  }, [allWikiArticles, showParentChip])

  const childrenCountByParent = useMemo(() => {
    if (!showChildrenChip) return null
    const m = new Map<string, number>()
    for (const a of allWikiArticles) {
      if (a.parentArticleId) m.set(a.parentArticleId, (m.get(a.parentArticleId) ?? 0) + 1)
    }
    return m
  }, [allWikiArticles, showChildrenChip])

  if (articles.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">No wiki articles</p>
      </div>
    )
  }
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 p-6">
        {articles.map((a) => (
          <WikiGridCard
            key={a.id}
            article={a}
            isActive={activeArticleId === a.id}
            isSelected={selectedIds?.has(a.id) ?? false}
            visibleColumns={visibleColumns}
            wikiCategories={wikiCategories}
            backlinks={backlinkCounts?.get(a.id) ?? 0}
            parentTitle={
              a.parentArticleId ? articlesById?.get(a.parentArticleId)?.title : undefined
            }
            childrenCount={childrenCountByParent?.get(a.id) ?? 0}
            onSelect={onSelect}
            onOpen={() => { captureListNav(articles.map((x) => x.id), a.id, "Wiki"); onOpen(a.id) }}
          />
        ))}
      </div>
    </div>
  )
}
