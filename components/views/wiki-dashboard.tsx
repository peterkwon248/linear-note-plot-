"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { shortRelative } from "@/lib/format-utils"
import type { WikiArticle } from "@/lib/types"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Clock as PhClock } from "@phosphor-icons/react/dist/ssr/Clock"
import { TrendUp } from "@phosphor-icons/react/dist/ssr/TrendUp"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"

/* ── Types ── */

interface WikiDashboardProps {
  wikiNotes: WikiArticle[]
  wikiArticles: WikiArticle[]
  stats: {
    total: number
    redLinks: number
    internalLinks: number
    connectedNotes: number
  }
  articleCount: number
  stubCount: number
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
  onViewStubs?: () => void
  onViewRedLinks?: () => void
  onCategoryClick?: (categoryId: string) => void
}

/* ── Dashboard ── */

export function WikiDashboard({
  wikiNotes,
  wikiArticles,
  stats,
  articleCount,
  stubCount,
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
  onViewStubs,
  onViewRedLinks,
  onCategoryClick,
}: WikiDashboardProps) {

  // Featured article: most recently edited article
  const featured = useMemo(() => {
    return wikiNotes
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      [0] ?? null
  }, [wikiNotes])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-6">

        {/* ── Search ── */}
        <div className="relative mb-6">
          <div className="relative">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} weight="regular" />
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
              placeholder="Search wiki articles..."
              className="h-9 w-full rounded-lg border border-border-subtle bg-secondary/30 pl-9 pr-3 text-note text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
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

        {/* ── Top Stats Row ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 min-[800px]:grid-cols-3">
          <MiniStat
            label="Wiki Articles"
            value={articleCount}
            sub={`${stats.total} total`}
            color="text-accent"
            onClick={onViewAll}
          />
          <MiniStat
            label="Stubs"
            value={stubCount}
            sub="need content"
            color="text-amber-500"
            onClick={onViewStubs}
          />
          <MiniStat
            label="Red Links"
            value={stats.redLinks}
            sub="missing articles"
            color="text-destructive"
            onClick={onViewRedLinks}
          />
          <MiniStat
            label="Uncategorized"
            value={wikiArticles.filter(a => !a.categoryIds || a.categoryIds.length === 0).length}
            sub="need categories"
            color="text-orange-400"
          />
        </div>

        {/* ── Featured Article ── */}
        {featured && (
          <button
            onClick={() => onOpenWikiArticle?.(featured.id)}
            className="group mb-6 flex w-full items-start gap-4 rounded-lg border border-border-subtle bg-card/30 p-4 text-left transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Sparkle className="text-accent" size={16} weight="regular" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground/40">Featured Article</span>
              </div>
              <h3 className="text-note font-semibold text-foreground group-hover:text-accent transition-colors">
                {featured.title || "Untitled"}
              </h3>
              <p className="mt-0.5 text-2xs text-muted-foreground/60 line-clamp-1">
                Updated {shortRelative(featured.updatedAt)}
                {(featured.categoryIds?.length ?? 0) > 0 && ` · ${featured.categoryIds!.length} categories`}
              </p>
            </div>
            <ArrowRight className="mt-1 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-accent" size={16} weight="regular" />
          </button>
        )}

        {/* ── Categories Grid ── */}
        {categories.items.length > 0 && (
          <div className="mb-6">
            <SectionLabel>Categories</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {categories.items.slice(0, 12).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryClick?.(cat.id)}
                  className="rounded-sm bg-secondary/50 px-2 py-1 text-2xs font-medium text-foreground/80 transition-colors hover:bg-hover-bg cursor-pointer"
                >
                  {cat.name}
                  <span className="ml-1 text-muted-foreground/40 tabular-nums">{cat.count}</span>
                </button>
              ))}
              {categories.uncategorized > 0 && (
                <span className="rounded-sm bg-chart-3/5 px-2 py-1 text-2xs font-medium text-chart-3/70">
                  Uncategorized
                  <span className="ml-1 tabular-nums">{categories.uncategorized}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Two-Column Content ── */}
        <div className="grid grid-cols-1 gap-5 min-[700px]:grid-cols-2">

          {/* Left Column */}
          <div className="space-y-5">
            {/* Recent Changes */}
            {recentChanges.length > 0 && (
              <ContentCard title="Recent Changes" icon={PhClock}>
                {recentChanges.map((note) => (
                  <ArticleItem
                    key={note.id}
                    title={note.title || "Untitled"}
                    meta={shortRelative(note.updatedAt)}
                    onClick={() => onOpenWikiArticle?.(note.id)}
                  />
                ))}
              </ContentCard>
            )}

            {/* Most Connected */}
            {mostConnected.length > 0 && mostConnected[0].count > 0 && (
              <ContentCard title="Hub Articles" icon={TrendUp}>
                {mostConnected.filter(({ count }) => count > 0).map(({ note, count }) => (
                  <ArticleItem
                    key={note.id}
                    title={note.title || "Untitled"}
                    meta={`${count} links`}
                    onClick={() => onOpenWikiArticle?.(note.id)}
                  />
                ))}
              </ContentCard>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Red Links */}
            {redLinks.length > 0 && (
              <ContentCard title="Red Links" icon={Warning} iconColor="text-destructive/60">
                {redLinks.slice(0, 6).map((item) => (
                  <div key={item.title} className="group flex items-center gap-2 rounded-md px-2.5 py-2 transition-colors duration-100 hover:bg-hover-bg">
                    <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-destructive/60" />
                    <span className="min-w-0 flex-1 truncate text-note text-destructive/80">{item.title}</span>
                    <span className="shrink-0 text-2xs tabular-nums text-muted-foreground/50 group-hover:hidden">{item.refCount} refs</span>
                    <button
                      onClick={() => onCreateFromRedLink(item.title)}
                      className="hidden shrink-0 items-center gap-0.5 text-2xs font-medium text-accent group-hover:flex"
                    >
                      <PhPlus size={12} weight="regular" />
                      Create
                    </button>
                  </div>
                ))}
              </ContentCard>
            )}

            {/* Stale Documents */}
            {staleDocuments.length > 0 && (
              <ContentCard title="Needs Review" icon={FileText}>
                {staleDocuments.map(({ note, daysAgo }) => (
                  <ArticleItem
                    key={note.id}
                    title={note.title || "Untitled"}
                    meta={`${daysAgo}d ago`}
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
            <SectionLabel>Wiki Articles</SectionLabel>
            <div className="grid grid-cols-1 gap-2 min-[700px]:grid-cols-2">
              {wikiArticles.slice(0, 6).map((article) => (
                <button
                  key={article.id}
                  onClick={() => onOpenWikiArticle?.(article.id)}
                  className="group flex items-start gap-3 rounded-lg border border-border-subtle bg-card/30 p-3 text-left transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03]"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-note font-semibold text-foreground group-hover:text-accent transition-colors">
                      {article.title}
                    </h4>
                    <p className="mt-0.5 text-2xs text-muted-foreground/40">
                      {article.blocks.length} blocks
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {wikiArticles.length > 6 && (
              <button
                onClick={onViewAll}
                className="mt-3 w-full rounded-lg border border-border-subtle py-2 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
              >
                View all {wikiArticles.length} articles
              </button>
            )}
          </div>
        )}

        {/* ── Empty State ── */}
        {wikiNotes.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
              <BookOpen className="text-muted-foreground" size={20} weight="regular" />
            </div>
            <p className="text-note font-medium text-muted-foreground">No wiki articles yet</p>
            <p className="text-2xs text-muted-foreground/60">Create your first article or import existing notes</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-Components ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground/40">
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
        "rounded-lg border border-border-subtle bg-card/50 px-3 py-2.5 text-left",
        onClick && "cursor-pointer transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03]"
      )}
    >
      <p className={cn("text-xl font-semibold tabular-nums", color)}>{value}</p>
      <p className="text-2xs font-medium text-foreground/70">{label}</p>
      <p className="text-2xs text-muted-foreground/40">{sub}</p>
    </Wrapper>
  )
}


function ContentCard({
  title,
  icon: Icon,
  iconColor = "text-muted-foreground/40",
  children,
}: {
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>
  iconColor?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-card/30">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
        <Icon className={cn("h-3.5 w-3.5", iconColor)} strokeWidth={1.5} />
        <h3 className="text-2xs font-medium uppercase tracking-wide text-muted-foreground/50">{title}</h3>
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
      <span className="min-w-0 flex-1 truncate text-note text-foreground/90">{title}</span>
      <span className="shrink-0 text-2xs tabular-nums text-muted-foreground/40">{meta}</span>
    </button>
  )
}
