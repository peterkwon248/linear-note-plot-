"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { shortRelative } from "@/lib/format-utils"
import { useT } from "@/lib/i18n"
import type { Note, WikiArticle, WikiStatus } from "@/lib/types"
import { STATUS_CONFIG } from "@/components/note-fields"
import { StatusShapeIcon } from "@/components/status-icon"
import { WIKI_STATUS_ORDER } from "@/lib/view-engine/wiki-list-pipeline"
import { WikiInsightsChart } from "@/components/wiki-editor/wiki-insights-chart"
import {
  BookOpen,
  Search as MagnifyingGlass,
  Plus as PhPlus,
  Clock as PhClock,
  TrendingUp as TrendUp,
  AlertTriangle as Warning,
  FileText,
  ArrowRight,
  Sparkles as Sparkle,
  Pin as PushPin,
} from "lucide-react"

/* ── Types ── */

interface WikiDashboardProps {
  wikiNotes: WikiArticle[]
  wikiArticles: WikiArticle[]
  /** All notes — used for the growth chart's "New Notes" overlay. */
  notes: Note[]
  stats: {
    total: number
    internalLinks: number
    connectedNotes: number
  }
  /** v151: 4-stage status breakdown (manual, unified with Notes). */
  statusCounts: Record<WikiStatus, number>
  redLinks: { title: string; refCount: number }[]
  recentChanges: WikiArticle[]
  mostConnected: { note: WikiArticle; count: number }[]
  staleDocuments: { note: WikiArticle; daysAgo: number }[]
  categories: { items: { id: string; name: string; parentIds: string[]; count: number }[]; uncategorized: number }

  // Search
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchFocused: boolean
  setSearchFocused: (f: boolean) => void
  searchInputRef: React.RefObject<HTMLInputElement | null>
  searchResults: WikiArticle[]
  showSearchDropdown: boolean

  // Actions
  onOpenWikiArticle?: (id: string) => void
  onCreateFromRedLink: (title: string) => void
  onViewAll: () => void
  /** v151: drill into the list filtered to a specific 4-stage status. */
  onViewStatus?: (status: WikiStatus) => void
  onViewRedLinks?: () => void
  onCategoryClick?: (categoryId: string) => void
}

/* ── Dashboard ── */

export function WikiDashboard({
  wikiNotes,
  wikiArticles,
  notes,
  stats,
  statusCounts,
  redLinks,
  recentChanges,
  mostConnected,
  staleDocuments,
  categories,
  searchQuery,
  setSearchQuery,
  searchFocused,
  setSearchFocused,
  searchInputRef,
  searchResults,
  showSearchDropdown,
  onOpenWikiArticle,
  onCreateFromRedLink,
  onViewAll,
  onViewStatus,
  onViewRedLinks,
  onCategoryClick,
}: WikiDashboardProps) {
  const t = useT()

  // Featured article: most recently edited article
  const featured = useMemo(() => {
    return wikiNotes
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      [0] ?? null
  }, [wikiNotes])

  return (
    <div className="flex-1 overflow-y-auto bg-secondary/20">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">

        {/* ── Search ── */}
        <div className="relative mb-6">
          <div className="relative">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} strokeWidth={2.5} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => { setTimeout(() => setSearchFocused(false), 150) }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchResults.length > 0) {
                  onOpenWikiArticle?.(searchResults[0].id)
                  setSearchQuery("")
                }
                if (e.key === "Escape") {
                  setSearchQuery("")
                  searchInputRef.current?.blur()
                }
              }}
              placeholder={t("wiki.search_articles")}
              className="h-9 w-full rounded-lg border border-border-subtle bg-secondary/30 pl-9 pr-3 text-note text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
            />
          </div>
          {showSearchDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border-subtle bg-surface-overlay shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
              <div className="max-h-64 overflow-y-auto py-1">
                {searchResults.map((note) => (
                  <button
                    key={note.id}
                    onMouseDown={(e) => { e.preventDefault(); onOpenWikiArticle?.(note.id); setSearchQuery("") }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-note text-foreground transition-colors duration-100 hover:bg-hover-bg"
                  >
                    <span className="truncate">{note.title || "Untitled"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Status Breakdown Row ── */}
        {/* v151: 4-stage status breakdown (Backlog / Todo / In Progress / Done),
            unified with Notes. Each card shows the shared 4-circle icon + count;
            clicking a status drills into the list filtered to it. */}
        <div className="mb-3 grid grid-cols-2 gap-3 min-[800px]:grid-cols-4">
          {WIKI_STATUS_ORDER.map((status) => {
            const cfg = STATUS_CONFIG[status]
            return (
              <button
                key={status}
                onClick={() => onViewStatus?.(status)}
                className={cn(
                  "rounded-lg border border-border bg-card px-3 py-2.5 text-left shadow-sm",
                  "transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03] hover:shadow",
                )}
              >
                <p className="text-xl font-semibold tabular-nums" style={{ color: cfg.color }}>
                  {statusCounts[status]}
                </p>
                <p className="flex items-center gap-1 text-2xs font-medium text-foreground">
                  <StatusShapeIcon status={status} size={11} />
                  {t(cfg.labelKey)}
                </p>
              </button>
            )
          })}
        </div>

        {/* Uncategorized — amber "needs attention" hue. */}
        <div className="mb-6 grid grid-cols-2 gap-3 min-[800px]:grid-cols-3">
          <MiniStat
            label={t("wiki.stats.articles")}
            value={stats.total}
            sub={t("wiki.stats.articles_total").replace("{count}", String(stats.total))}
            color="text-emerald-600 dark:text-emerald-400"
            onClick={onViewAll}
          />
          <MiniStat
            label={t("wiki.stats.uncategorized")}
            value={wikiArticles.filter(a => !a.categoryIds || a.categoryIds.length === 0).length}
            sub={t("wiki.stats.uncategorized_need_categories")}
            color="text-amber-600 dark:text-amber-400"
          />
        </div>

        {/* ── Featured Article ── */}
        {featured && (
          <button
            onClick={() => onOpenWikiArticle?.(featured.id)}
            className="group mb-6 flex w-full items-start gap-4 rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03] hover:shadow"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Sparkle className="text-accent" size={16} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">{t("wiki.featured_article")}</span>
              </div>
              <h3 className="text-note font-semibold text-foreground group-hover:text-accent transition-colors">
                {featured.title || t("common.untitled")}
              </h3>
              <p className="mt-0.5 text-2xs text-muted-foreground line-clamp-1">
                {t("display.ordering.updated")} {shortRelative(featured.updatedAt)}
                {(featured.categoryIds?.length ?? 0) > 0 && ` · ${t("wiki.featured.categories_count").replace("{count}", String(featured.categoryIds!.length))}`}
              </p>
            </div>
            <ArrowRight className="mt-1 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-accent" size={16} strokeWidth={2} />
          </button>
        )}

        {/* ── Pinned Articles ── */}
        {(() => {
          const pinned = (wikiArticles as WikiArticle[]).filter(
            (a) => a.pinned && !(a as { trashed?: boolean }).trashed,
          )
          if (pinned.length === 0) return null
          return (
            <div className="mb-6">
              <SectionLabel>
                <span className="inline-flex items-center gap-1.5">
                  <PushPin size={11} fill="currentColor" />
                  {t("wiki.section.pinned")}
                </span>
              </SectionLabel>
              <div className="grid grid-cols-1 gap-2 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3">
                {pinned.slice(0, 6).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onOpenWikiArticle?.(a.id)}
                    className="group flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left shadow-sm transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03] hover:shadow"
                  >
                    <PushPin
                      size={12}
                      fill="currentColor"
                      className="shrink-0 text-accent"
                    />
                    <span className="truncate text-note text-foreground group-hover:text-accent">
                      {a.title || "Untitled"}
                    </span>
                    <span className="ml-auto shrink-0 text-2xs text-muted-foreground">
                      {shortRelative(a.updatedAt)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        {/* ── Categories Grid ── */}
        {categories.items.length > 0 && (
          <div className="mb-6">
            <SectionLabel>{t("wiki.section.categories")}</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {categories.items.slice(0, 12).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryClick?.(cat.id)}
                  className="rounded-md bg-secondary px-2.5 py-1 text-2xs font-medium text-foreground transition-colors hover:bg-accent/10 hover:text-accent cursor-pointer"
                >
                  {cat.name}
                  <span className="ml-1 text-muted-foreground tabular-nums">{cat.count}</span>
                </button>
              ))}
              {categories.uncategorized > 0 && (
                <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-2xs font-medium text-amber-600 dark:text-amber-400">
                  {t("wiki.stats.uncategorized")}
                  <span className="ml-1 tabular-nums">{categories.uncategorized}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Growth Chart ── */}
        <div className="mb-6">
          <WikiInsightsChart notes={notes} wikiArticles={wikiArticles} />
        </div>

        {/* ── Two-Column Content ── */}
        <div className="grid grid-cols-1 gap-5 min-[700px]:grid-cols-2">

          {/* Left Column */}
          <div className="space-y-5">
            {/* Recent Changes */}
            {recentChanges.length > 0 && (
              <ContentCard title={t("wiki.section.recent_changes")} icon={PhClock}>
                {recentChanges.map((note) => (
                  <ArticleItem
                    key={note.id}
                    title={note.title || t("common.untitled")}
                    meta={shortRelative(note.updatedAt)}
                    onClick={() => onOpenWikiArticle?.(note.id)}
                  />
                ))}
              </ContentCard>
            )}

            {/* Most Connected */}
            {mostConnected.length > 0 && mostConnected[0].count > 0 && (
              <ContentCard title={t("wiki.section.hub_articles")} icon={TrendUp}>
                {mostConnected.filter(({ count }) => count > 0).map(({ note, count }) => (
                  <ArticleItem
                    key={note.id}
                    title={note.title || t("common.untitled")}
                    meta={t("wiki.meta.links_count").replace("{count}", String(count))}
                    onClick={() => onOpenWikiArticle?.(note.id)}
                  />
                ))}
              </ContentCard>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Stale Documents */}
            {staleDocuments.length > 0 && (
              <ContentCard title={t("wiki.section.needs_review")} icon={FileText}>
                {staleDocuments.map(({ note, daysAgo }) => (
                  <ArticleItem
                    key={note.id}
                    title={note.title || t("common.untitled")}
                    meta={t("wiki.meta.days_ago").replace("{count}", String(daysAgo))}
                    onClick={() => onOpenWikiArticle?.(note.id)}
                  />
                ))}
              </ContentCard>
            )}
          </div>
        </div>

        {/* ── Wiki Articles (Assembly Model) ── */}
        {wikiArticles.length > 0 && (
          <div className="mt-6">
            <SectionLabel>{t("wiki.stats.articles")}</SectionLabel>
            <div className="grid grid-cols-1 gap-2 min-[700px]:grid-cols-2">
              {wikiArticles.slice(0, 6).map((article) => (
                <button
                  key={article.id}
                  onClick={() => onOpenWikiArticle?.(article.id)}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03] hover:shadow"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-note font-semibold text-foreground group-hover:text-accent transition-colors">
                      {article.title}
                    </h4>
                    <p className="mt-0.5 text-2xs text-muted-foreground">
                      {t("wiki.meta.blocks_count").replace("{count}", String(article.blocks.length))}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {wikiArticles.length > 6 && (
              <button
                onClick={onViewAll}
                className="mt-3 w-full rounded-lg border border-border bg-secondary/50 py-2 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
              >
                {t("wiki.view_all_count").replace("{count}", String(wikiArticles.length))}
              </button>
            )}
          </div>
        )}

        {/* ── Empty State ── */}
        {wikiNotes.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
              <BookOpen className="text-muted-foreground" size={20} strokeWidth={2} />
            </div>
            <p className="text-note font-medium text-muted-foreground">{t("wiki.empty.title")}</p>
            <p className="text-2xs text-muted-foreground/60">{t("wiki.empty.hint")}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-Components ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  )
}

function MiniStat({
  label,
  value,
  sub,
  color,
  onClick,
}: {
  label: string
  value: number
  sub: string
  color: string
  onClick?: () => void
}) {
  const Wrapper = onClick ? "button" : "div"
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border bg-card px-3 py-2.5 text-left shadow-sm",
        onClick && "cursor-pointer transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03] hover:shadow"
      )}
    >
      <p className={cn("text-xl font-semibold tabular-nums", color)}>{value}</p>
      <p className="text-2xs font-medium text-foreground">{label}</p>
      <p className="text-2xs text-muted-foreground">{sub}</p>
    </Wrapper>
  )
}


function ContentCard({
  title,
  icon: Icon,
  iconColor = "text-muted-foreground",
  children,
}: {
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>
  iconColor?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Icon className={cn("h-3.5 w-3.5", iconColor)} strokeWidth={1.5} />
        <h3 className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      <div className="px-1.5 py-1">{children}</div>
    </div>
  )
}

function ArticleItem({
  title,
  meta,
  onClick,
}: {
  title: string
  meta: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors duration-100 hover:bg-hover-bg"
    >
      <span className="min-w-0 flex-1 truncate text-note text-foreground group-hover:text-foreground">{title}</span>
      <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">{meta}</span>
    </button>
  )
}
