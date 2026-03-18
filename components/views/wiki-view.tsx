"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Search, Plus, FileQuestion, ExternalLink, X, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import type { Note } from "@/lib/types"

type WikiTab = "articles" | "redlinks"
type ArticleSortBy = "title" | "updatedAt"

// Simple relative time
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return `${months}mo`
}

export function WikiView() {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const createWikiStub = usePlotStore((s) => s.createWikiStub)
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<WikiTab>("articles")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<ArticleSortBy>("title")

  // Navigate to notes view and open the note
  const navigateToNote = (noteId: string) => {
    openNote(noteId)
    setActiveRoute("/notes")
    router.push("/notes")
  }

  // All non-trashed wiki articles
  const wikiArticles = useMemo(
    () => notes.filter((n) => n.isWiki && !n.trashed),
    [notes]
  )

  // Filtered articles (by search)
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return wikiArticles
    const q = searchQuery.toLowerCase()
    return wikiArticles.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.aliases.some((a) => a.toLowerCase().includes(q))
    )
  }, [wikiArticles, searchQuery])

  // Sorted articles
  const sortedArticles = useMemo(() => {
    const result = [...filteredArticles]
    if (sortBy === "title") {
      return result.sort((a, b) =>
        (a.title || "Untitled").localeCompare(b.title || "Untitled")
      )
    }
    return result.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }, [filteredArticles, sortBy])

  // Red links: collect all [[link]] targets from all notes, find ones without a matching wiki note
  const redLinks = useMemo(() => {
    // Build a set of all wiki titles (lowercased) for quick lookup
    const wikiTitleSet = new Set(
      notes
        .filter((n) => n.isWiki && !n.trashed)
        .map((n) => n.title.toLowerCase())
    )
    // Also include aliases
    notes
      .filter((n) => n.isWiki && !n.trashed)
      .forEach((n) => n.aliases.forEach((a) => wikiTitleSet.add(a.toLowerCase())))

    // Collect link target -> Set of source note ids
    const linkRefs = new Map<string, Set<string>>()
    for (const note of notes) {
      if (note.trashed) continue
      for (const link of note.linksOut) {
        const normalized = link.toLowerCase()
        if (!wikiTitleSet.has(normalized)) {
          if (!linkRefs.has(link)) {
            linkRefs.set(link, new Set())
          }
          linkRefs.get(link)!.add(note.id)
        }
      }
    }

    // Convert to sorted array
    return Array.from(linkRefs.entries())
      .map(([title, refs]) => ({ title, refCount: refs.size }))
      .sort((a, b) => b.refCount - a.refCount || a.title.localeCompare(b.title))
  }, [notes])

  // Filtered red links
  const filteredRedLinks = useMemo(() => {
    if (!searchQuery.trim()) return redLinks
    const q = searchQuery.toLowerCase()
    return redLinks.filter((r) => r.title.toLowerCase().includes(q))
  }, [redLinks, searchQuery])

  const handleCreateWiki = () => {
    const id = createWikiStub("Untitled Wiki")
    navigateToNote(id)
  }

  const handleCreateFromRedLink = (title: string) => {
    const id = createWikiStub(title)
    navigateToNote(id)
  }

  const articlesCount = wikiArticles.length
  const redLinksCount = redLinks.length

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Wiki</h1>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wiki..."
            className="h-8 w-52 rounded-md border border-border bg-background pl-8 pr-7 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* New Wiki button */}
        <button
          onClick={handleCreateWiki}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          New Wiki
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border px-4">
        <button
          onClick={() => setActiveTab("articles")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors",
            activeTab === "articles"
              ? "border-primary font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Articles ({articlesCount})
        </button>
        <button
          onClick={() => setActiveTab("redlinks")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors",
            activeTab === "redlinks"
              ? "border-primary font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileQuestion className="h-3.5 w-3.5" />
          Red Links
          {redLinksCount > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                activeTab === "redlinks"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {redLinksCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === "articles" && (
          <ArticlesTab
            articles={sortedArticles}
            totalCount={articlesCount}
            sortBy={sortBy}
            onSortChange={setSortBy}
            searchQuery={searchQuery}
            onOpenNote={navigateToNote}
            onCreateWiki={handleCreateWiki}
          />
        )}
        {activeTab === "redlinks" && (
          <RedLinksTab
            redLinks={filteredRedLinks}
            searchQuery={searchQuery}
            onCreateFromRedLink={handleCreateFromRedLink}
          />
        )}
      </div>
    </div>
  )
}

/* ── Articles Tab ────────────────────────────────── */

interface ArticlesTabProps {
  articles: Note[]
  totalCount: number
  sortBy: ArticleSortBy
  onSortChange: (s: ArticleSortBy) => void
  searchQuery: string
  onOpenNote: (id: string) => void
  onCreateWiki: () => void
}

function ArticlesTab({
  articles,
  totalCount,
  sortBy,
  onSortChange,
  searchQuery,
  onOpenNote,
  onCreateWiki,
}: ArticlesTabProps) {
  if (totalCount === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <BookOpen className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">No wiki articles yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Build your personal knowledge base
          </p>
        </div>
        <button
          onClick={onCreateWiki}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create your first wiki
        </button>
      </div>
    )
  }

  if (articles.length === 0 && searchQuery) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        No articles match &ldquo;{searchQuery}&rdquo;
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Sort toolbar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-1.5">
        <span className="text-xs text-muted-foreground">
          {articles.length} article{articles.length !== 1 ? "s" : ""}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => onSortChange(sortBy === "title" ? "updatedAt" : "title")}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortBy === "title" ? "A–Z" : "Recently updated"}
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_180px_80px_64px] items-center border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
        <span>Title</span>
        <span>Aliases</span>
        <span>Tags</span>
        <span className="text-right">Updated</span>
      </div>

      {/* Article rows */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-border/50">
          {articles.map((note) => (
            <button
              key={note.id}
              onClick={() => onOpenNote(note.id)}
              className="grid w-full grid-cols-[1fr_180px_80px_64px] items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-secondary/40"
            >
              {/* Title */}
              <span className="truncate text-sm font-medium text-foreground">
                {note.title || "Untitled"}
              </span>

              {/* Aliases */}
              <span className="truncate text-xs text-muted-foreground">
                {note.aliases.length > 0
                  ? note.aliases.join(", ")
                  : null}
              </span>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 overflow-hidden">
                {note.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
                {note.tags.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{note.tags.length - 2}
                  </span>
                )}
              </div>

              {/* Updated */}
              <span className="text-right text-xs tabular-nums text-muted-foreground">
                {relativeTime(note.updatedAt)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Red Links Tab ───────────────────────────────── */

interface RedLinkItem {
  title: string
  refCount: number
}

interface RedLinksTabProps {
  redLinks: RedLinkItem[]
  searchQuery: string
  onCreateFromRedLink: (title: string) => void
}

function RedLinksTab({ redLinks, searchQuery, onCreateFromRedLink }: RedLinksTabProps) {
  if (redLinks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">No red links</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery
              ? `No missing links match "${searchQuery}"`
              : "All [[wiki links]] have matching articles"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Description */}
      <div className="border-b border-border bg-destructive/5 px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          These wiki links are referenced in your notes but don&apos;t have a corresponding article.
          Click to create a stub.
        </p>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_120px] items-center border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
        <span>Missing article</span>
        <span className="text-right">Referenced by</span>
      </div>

      {/* Red link rows */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-border/50">
          {redLinks.map((item) => (
            <button
              key={item.title}
              onClick={() => onCreateFromRedLink(item.title)}
              className="group grid w-full grid-cols-[1fr_120px] items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-secondary/40"
            >
              {/* Title — styled red-ish to signal missing */}
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="truncate text-sm text-red-400/90 group-hover:text-red-400">
                  {item.title}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              {/* Ref count */}
              <span className="text-right text-xs tabular-nums text-muted-foreground">
                {item.refCount} note{item.refCount !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
