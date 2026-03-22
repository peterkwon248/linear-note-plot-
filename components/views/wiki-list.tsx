"use client"

import { cn } from "@/lib/utils"
import { ArrowLeft, BookOpen, List, X } from "lucide-react"
import { groupByInitial, INDEX_GROUPS } from "@/lib/korean-utils"
import { shortRelative } from "@/lib/format-utils"
import { setWikiViewMode } from "@/lib/wiki-view-mode"
import type { Note } from "@/lib/types"

/* ── Types ── */

interface WikiListProps {
  filteredWikiNotes: Note[]
  sortedFilteredWikiNotes: Note[]
  backlinkCounts: Map<string, number>

  // Filter state
  dashFilter: "all" | "stubs" | "drafts" | "complete"
  setDashFilter: (f: "all" | "stubs" | "drafts" | "complete") => void
  showAllArticles: boolean
  setShowAllArticles: (show: boolean) => void

  // Category filter
  categoryFilterLabel?: string | null
  onClearCategoryFilter?: () => void

  // Actions
  onOpenArticle: (id: string) => void
}

/* ── Status Badge ── */

const STATUS_STYLES: Record<string, string> = {
  stub: "bg-chart-3/8 text-chart-3/70",
  draft: "bg-accent/8 text-accent/70",
  complete: "bg-chart-5/8 text-chart-5/70",
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null
  return (
    <span
      className={cn(
        "rounded-[4px] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide",
        STATUS_STYLES[status] ?? "bg-muted/10 text-muted-foreground/50"
      )}
    >
      {status}
    </span>
  )
}

/* ── Column Header ── */

function ColumnHeaders() {
  return (
    <div className="flex items-center px-5 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/30 border-b border-border/30">
      <span className="w-[80px]">Status</span>
      <span className="min-w-0 flex-1">Title</span>
      <span className="w-[60px] text-right">Links</span>
      <span className="w-[70px] text-right">Updated</span>
    </div>
  )
}

/* ── Article Row ── */

function ArticleTableRow({
  note,
  backlinkCount,
  onClick,
}: {
  note: Note
  backlinkCount: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center px-5 py-2.5 hover:bg-white/[0.02] transition-colors duration-75 cursor-pointer border-b border-border/[0.06] text-left"
    >
      <span className="w-[80px] shrink-0">
        <StatusBadge status={note.wikiStatus} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground/90">
        {note.title || "Untitled"}
      </span>
      <span className="w-[60px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/40">
        {backlinkCount > 0 ? backlinkCount : "\u2014"}
      </span>
      <span className="w-[70px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/30">
        {shortRelative(note.updatedAt)}
      </span>
    </button>
  )
}

/* ── Index Row (used in alphabetical view) ── */

function IndexTableRow({
  note,
  backlinkCount,
  onClick,
}: {
  note: Note
  backlinkCount: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center px-5 py-2 hover:bg-white/[0.02] transition-colors duration-75 cursor-pointer border-b border-border/[0.06] text-left"
    >
      <span className="w-[80px] shrink-0">
        <StatusBadge status={note.wikiStatus} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/90">
        {note.title || "Untitled"}
      </span>
      <span className="w-[60px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/40">
        {backlinkCount > 0 ? backlinkCount : "\u2014"}
      </span>
      <span className="w-[70px] shrink-0 text-right text-2xs tabular-nums text-muted-foreground/30">
        {shortRelative(note.updatedAt)}
      </span>
    </button>
  )
}

/* ── Empty State ── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/60">
        <BookOpen className="h-5 w-5 text-muted-foreground/40" strokeWidth={1.5} />
      </div>
      <p className="text-sm text-muted-foreground/60">No articles found</p>
    </div>
  )
}

/* ── List View ── */

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
}: WikiListProps) {
  const groupedArticles = groupByInitial(filteredWikiNotes, (n: Note) => n.title || "Untitled")

  const counts = {
    all: sortedFilteredWikiNotes.length,
    complete: filteredWikiNotes.filter(n => n.wikiStatus === "complete").length,
    drafts: filteredWikiNotes.filter(n => n.wikiStatus === "draft").length,
    stubs: filteredWikiNotes.filter(n => n.wikiStatus === "stub").length,
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Controls Bar ── */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border/50 px-5 py-2">
        {/* Back to Overview */}
        <button
          onClick={() => { setWikiViewMode("dashboard"); onClearCategoryFilter?.() }}
          className="flex items-center gap-1 text-[13px] text-muted-foreground/50 hover:text-foreground transition-colors duration-100 mr-1"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
          Overview
        </button>

        <span className="h-4 w-px bg-border/50" />

        {/* Filter Tabs */}
        {(["all", "complete", "drafts", "stubs"] as const).map((tab) => {
          const labels = { all: "All", complete: "Complete", drafts: "Draft", stubs: "Stub" }
          return (
            <button
              key={tab}
              onClick={() => {
                setDashFilter(tab)
                setShowAllArticles(false)
              }}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-100",
                dashFilter === tab && !showAllArticles
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground/60 hover:bg-white/[0.04] hover:text-muted-foreground"
              )}
            >
              {labels[tab]}
              {counts[tab] > 0 && (
                <span className="ml-1 tabular-nums text-muted-foreground/40">
                  {counts[tab]}
                </span>
              )}
            </button>
          )
        })}

        {/* Category filter badge */}
        {categoryFilterLabel && (
          <>
            <span className="h-4 w-px bg-border/50" />
            <span className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
              {categoryFilterLabel}
              <button
                onClick={onClearCategoryFilter}
                className="ml-0.5 rounded-sm p-0.5 hover:bg-accent/20 transition-colors duration-100"
              >
                <X className="h-2.5 w-2.5" strokeWidth={2} />
              </button>
            </span>
          </>
        )}

        <span className="h-4 w-px bg-border/50" />

        {/* Index Toggle */}
        <button
          onClick={() => setShowAllArticles(!showAllArticles)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-100",
            showAllArticles
              ? "bg-white/10 text-foreground"
              : "text-muted-foreground/60 hover:bg-white/[0.04] hover:text-muted-foreground"
          )}
        >
          <List className="h-3 w-3" strokeWidth={1.5} />
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
                <div className="sticky top-0 z-10 bg-background py-1.5 px-5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/40 border-b border-border/20">
                  {group}
                </div>
                {(articles as Note[]).map(note => (
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
          <ColumnHeaders />
          {sortedFilteredWikiNotes.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {sortedFilteredWikiNotes.map(note => (
                <ArticleTableRow
                  key={note.id}
                  note={note}
                  backlinkCount={backlinkCounts.get(note.id) ?? 0}
                  onClick={() => onOpenArticle(note.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
