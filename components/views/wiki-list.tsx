"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { groupByInitial } from "@/lib/korean-utils"
import { shortRelative } from "@/lib/format-utils"
import { setWikiViewMode } from "@/lib/wiki-view-mode"
import type { WikiArticle } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { ListBullets } from "@phosphor-icons/react/dist/ssr/ListBullets"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"

/* ── Types ── */

interface WikiListProps {
  filteredWikiNotes: WikiArticle[]
  sortedFilteredWikiNotes: WikiArticle[]
  backlinkCounts: Map<string, number>

  // Filter state
  dashFilter: "all" | "articles" | "redlinks"
  setDashFilter: (f: "all" | "articles" | "redlinks") => void
  showAllArticles: boolean
  setShowAllArticles: (show: boolean) => void

  // Category filter
  categoryFilterLabel?: string | null
  onClearCategoryFilter?: () => void

  // Red links
  redLinks: { title: string; refCount: number }[]
  onCreateFromRedLink: (title: string) => void

  // Actions
  onOpenArticle: (id: string) => void
  onMergeArticle?: (sourceId: string) => void
  onSplitArticle?: (id: string) => void
  onDeleteArticle?: (id: string) => void

  // Selection
  selectedIds?: Set<string>
  onSelect?: (id: string, opts: { multi?: boolean; shift?: boolean; index?: number }) => void
}

/* ── Column Header ── */

function ColumnHeaders({ hasSelection }: { hasSelection?: boolean }) {
  return (
    <div className="flex items-center px-5 py-2 text-2xs font-medium text-muted-foreground/50 border-b border-border-subtle">
      {hasSelection && <span className="w-7 shrink-0" />}
      <span className="min-w-0 flex-1">Title</span>
      <span className="w-[60px] text-right">Links</span>
      <span className="w-[36px]" />
      <span className="w-[70px] text-right">Updated</span>
    </div>
  )
}

/* ── Article Row ── */

function ArticleTableRow({
  note,
  backlinkCount,
  index,
  onClick,
  onMerge,
  onSplit,
  onDelete,
  isSelected,
  selectionActive,
  onSelect,
}: {
  note: WikiArticle
  backlinkCount: number
  index?: number
  onClick: () => void
  onMerge?: () => void
  onSplit?: () => void
  onDelete?: () => void
  isSelected?: boolean
  selectionActive?: boolean
  onSelect?: (opts: { multi?: boolean; shift?: boolean; index?: number }) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className={cn(
        "group flex w-full items-center px-5 py-2.5 hover:bg-hover-bg transition-colors duration-100",
        isSelected && "bg-accent/5"
      )}
      onContextMenu={(e) => {
        if (onMerge || onSplit || onDelete) {
          e.preventDefault()
          setMenuOpen(true)
        }
      }}
    >
      {/* Checkbox */}
      {onSelect && (
        <div
          className={cn(
            "w-7 shrink-0 flex items-center justify-center cursor-pointer",
            selectionActive || isSelected ? "visible" : "invisible group-hover:visible"
          )}
          onClick={(e) => {
            e.stopPropagation()
            onSelect({ multi: true, shift: e.shiftKey, index })
          }}
        >
          <div className={cn(
            "h-4 w-4 rounded border flex items-center justify-center transition-colors",
            isSelected
              ? "bg-accent border-accent text-white"
              : "border-muted-foreground/30 hover:border-muted-foreground/50"
          )}>
            {isSelected && <PhCheck size={10} weight="bold" />}
          </div>
        </div>
      )}
      <button
        onClick={(e) => {
          if (onSelect && (e.metaKey || e.ctrlKey || e.shiftKey)) {
            onSelect({ multi: e.metaKey || e.ctrlKey, shift: e.shiftKey, index })
          } else {
            onClick()
          }
        }}
        className="flex flex-1 items-center text-left min-w-0"
      >
        <span className="min-w-0 flex-1 truncate text-note font-medium text-foreground/90">
          {note.title || "Untitled"}
        </span>
      </button>
      <span className="w-[60px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
        {backlinkCount > 0 ? backlinkCount : "\u2014"}
      </span>

      {/* Context menu */}
      <span className="w-[36px] shrink-0 flex justify-center">
        {(onMerge || onSplit || onDelete) ? (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(true) }}
                className="rounded-md p-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:bg-active-bg hover:text-muted-foreground/60 transition-all duration-100"
              >
                <DotsThree size={14} weight="bold" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
              {onMerge && (
                <button
                  onClick={() => { setMenuOpen(false); onMerge() }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
                >
                  <GitMerge size={14} weight="regular" /> Merge into...
                </button>
              )}
              {onSplit && (
                <button
                  onClick={() => { setMenuOpen(false); onSplit() }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-foreground/80 hover:bg-active-bg transition-colors"
                >
                  <Scissors size={14} weight="regular" /> Split wiki
                </button>
              )}
              {(onMerge || onSplit) && onDelete && (
                <div className="my-1 h-px bg-border/40" />
              )}
              {onDelete && (
                <button
                  onClick={() => { setMenuOpen(false); onDelete() }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-2xs text-destructive hover:bg-active-bg transition-colors"
                >
                  <Trash size={14} weight="regular" /> Delete
                </button>
              )}
            </PopoverContent>
          </Popover>
        ) : null}
      </span>

      <span className="w-[70px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
        {shortRelative(note.updatedAt)}
      </span>
    </div>
  )
}

/* ── Red Link Row ── */

function RedLinkRow({
  title,
  refCount,
  onClick,
  isSelected,
  selectionActive,
  onSelect,
}: {
  title: string
  refCount: number
  onClick: () => void
  isSelected?: boolean
  selectionActive?: boolean
  onSelect?: (opts: { multi?: boolean }) => void
}) {
  return (
    <div className={cn(
      "group flex w-full items-center px-5 py-2.5 hover:bg-hover-bg transition-colors duration-100",
      isSelected && "bg-accent/5"
    )}>
      {/* Checkbox */}
      {onSelect && (
        <div
          className={cn(
            "w-7 shrink-0 flex items-center justify-center cursor-pointer",
            selectionActive || isSelected ? "visible" : "invisible group-hover:visible"
          )}
          onClick={(e) => {
            e.stopPropagation()
            onSelect({ multi: true })
          }}
        >
          <div className={cn(
            "h-4 w-4 rounded border flex items-center justify-center transition-colors",
            isSelected
              ? "bg-accent border-accent text-white"
              : "border-muted-foreground/30 hover:border-muted-foreground/50"
          )}>
            {isSelected && <PhCheck size={10} weight="bold" />}
          </div>
        </div>
      )}
      <button
        onClick={onClick}
        className="flex flex-1 items-center text-left min-w-0"
      >
        <span className="w-[100px] shrink-0">
          <span className="inline-flex items-center gap-1.5 text-2xs font-medium text-destructive">
            <Warning size={14} weight="regular" />
            Red Link
          </span>
        </span>
        <span className="min-w-0 flex-1 truncate text-note font-medium text-destructive/80">
          {title}
        </span>
      </button>
      <span className="w-[60px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
        {refCount > 0 ? `${refCount}` : "\u2014"}
      </span>
      <span className="w-[36px]" />
      <span className="w-[70px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
        {"\u2014"}
      </span>
    </div>
  )
}

/* ── Index Row (used in alphabetical view) ── */

function IndexTableRow({
  note,
  backlinkCount,
  onClick,
}: {
  note: WikiArticle
  backlinkCount: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center px-5 py-2 hover:bg-hover-bg transition-colors duration-100 cursor-pointer text-left"
    >
      <span className="min-w-0 flex-1 truncate text-note text-foreground/90">
        {note.title || "Untitled"}
      </span>
      <span className="w-[60px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
        {backlinkCount > 0 ? backlinkCount : "\u2014"}
      </span>
      <span className="w-[70px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/60">
        {shortRelative(note.updatedAt)}
      </span>
    </button>
  )
}

/* ── Empty State ── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
        <BookOpen className="text-muted-foreground/40" size={20} weight="regular" />
      </div>
      <p className="text-note text-muted-foreground/60">No articles found</p>
    </div>
  )
}

/* ── ListBullets View ── */

export function WikiList({
  filteredWikiNotes,
  sortedFilteredWikiNotes,
  backlinkCounts,
  dashFilter,
  setDashFilter,
  showAllArticles,
  setShowAllArticles,
  categoryFilterLabel,
  onClearCategoryFilter,
  onOpenArticle,
  onMergeArticle,
  onSplitArticle,
  onDeleteArticle,
  redLinks,
  onCreateFromRedLink,
  selectedIds,
  onSelect,
}: WikiListProps) {
  const selectionActive = selectedIds ? selectedIds.size > 0 : false
  const groupedArticles = groupByInitial(filteredWikiNotes, (n: WikiArticle) => n.title || "Untitled")

  const counts = {
    all: sortedFilteredWikiNotes.length + redLinks.length,
    articles: sortedFilteredWikiNotes.length,
    redlinks: redLinks.length,
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Controls Bar ── */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-5 py-2">
        {/* Back to Overview */}
        <button
          onClick={() => { setWikiViewMode("dashboard"); onClearCategoryFilter?.() }}
          className="flex items-center gap-1 text-note text-muted-foreground/50 hover:text-foreground transition-colors duration-100 mr-1"
        >
          <ArrowLeft size={12} weight="regular" />
          Overview
        </button>

        <span className="h-4 w-px bg-border/50" />

        {/* Filter Tabs */}
        {(["all", "articles", "redlinks"] as const).map((tab) => {
          const labels: Record<string, string> = { all: "All", articles: "Articles", redlinks: "Red Links" }
          const tabCount = counts[tab as keyof typeof counts]
          return (
            <button
              key={tab}
              onClick={() => {
                setDashFilter(tab)
                setShowAllArticles(false)
              }}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-2xs font-medium transition-all duration-100",
                tab === "redlinks" && "text-destructive/70",
                dashFilter === tab && !showAllArticles
                  ? tab === "redlinks" ? "bg-destructive/10 text-destructive" : "bg-foreground/10 text-foreground"
                  : tab === "redlinks" ? "text-destructive/50 hover:bg-hover-bg hover:text-destructive/70" : "text-muted-foreground/60 hover:bg-hover-bg hover:text-muted-foreground"
              )}
            >
              {labels[tab]}
              {tabCount !== undefined && tabCount > 0 && (
                <span className="ml-1 tabular-nums text-muted-foreground/40">
                  {tabCount}
                </span>
              )}
            </button>
          )
        })}

        {/* Category filter badge */}
        {categoryFilterLabel && (
          <>
            <span className="h-4 w-px bg-border/50" />
            <span className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-2xs font-medium text-accent">
              {categoryFilterLabel}
              <button
                onClick={onClearCategoryFilter}
                className="ml-0.5 rounded-sm p-0.5 hover:bg-accent/20 transition-colors duration-100"
              >
                <PhX size={10} weight="regular" />
              </button>
            </span>
          </>
        )}

        <span className="h-4 w-px bg-border/50" />

        {/* Index Toggle */}
        <button
          onClick={() => setShowAllArticles(!showAllArticles)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-2xs font-medium transition-all duration-100",
            showAllArticles
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground/60 hover:bg-hover-bg hover:text-muted-foreground"
          )}
        >
          <ListBullets size={12} weight="regular" />
          Index
        </button>
      </div>

      {/* ── Table Content ── */}
      {showAllArticles ? (
        /* ── Alphabetical Index ── */
        <div className="flex-1 overflow-y-auto">
          <ColumnHeaders />
          <div>
            {Array.from(groupedArticles.entries()).map(([group, articles]) => (
              <div key={group} id={`wiki-group-${group}`}>
                <div className="sticky top-0 z-10 bg-background py-1.5 px-5 text-2xs font-medium text-muted-foreground/50 border-b border-border-subtle">
                  {group}
                </div>
                {(articles as WikiArticle[]).map(note => (
                  <IndexTableRow
                    key={note.id}
                    note={note}
                    backlinkCount={backlinkCounts.get(note.id) ?? 0}
                    onClick={() => onOpenArticle(note.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Filtered Article Table ── */
        <div className="flex-1 overflow-y-auto">
          <ColumnHeaders hasSelection={!!onSelect} />
          {sortedFilteredWikiNotes.length === 0 && redLinks.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {/* Article/Stub rows */}
              {dashFilter !== "redlinks" && sortedFilteredWikiNotes.map((note, idx) => (
                <ArticleTableRow
                  key={note.id}
                  note={note}
                  backlinkCount={backlinkCounts.get(note.id) ?? 0}
                  index={idx}
                  onClick={() => onOpenArticle(note.id)}
                  onMerge={onMergeArticle ? () => onMergeArticle(note.id) : undefined}
                  onSplit={onSplitArticle ? () => onSplitArticle(note.id) : undefined}
                  onDelete={onDeleteArticle ? () => onDeleteArticle(note.id) : undefined}
                  isSelected={selectedIds?.has(note.id)}
                  selectionActive={selectionActive}
                  onSelect={onSelect ? (opts) => onSelect(note.id, { ...opts, index: idx }) : undefined}
                />
              ))}
              {/* Red Link rows */}
              {(dashFilter === "all" || dashFilter === "redlinks") && redLinks.map(rl => (
                <RedLinkRow
                  key={`rl-${rl.title}`}
                  title={rl.title}
                  refCount={rl.refCount}
                  onClick={() => onCreateFromRedLink(rl.title)}
                  isSelected={selectedIds?.has(`rl-${rl.title}`)}
                  selectionActive={selectionActive}
                  onSelect={onSelect ? (opts) => onSelect(`rl-${rl.title}`, opts) : undefined}
                />
              ))}
              {/* Empty state for redlinks filter with no red links */}
              {dashFilter === "redlinks" && redLinks.length === 0 && <EmptyState />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
