"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Plus,
  Search,
  Clock,
  TrendingUp,
  CircleDot,
  FolderOpen,
  AlertTriangle,
  ArrowLeft,
  PenLine,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { ViewHeader } from "@/components/view-header"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import { shortRelative } from "@/lib/format-utils"
import { NoteEditorAdapter } from "@/components/editor/NoteEditorAdapter"
import { WikiTOC } from "@/components/editor/wiki-toc"
import { WikiInfobox } from "@/components/editor/wiki-infobox"
import { WikiCategories } from "@/components/editor/wiki-categories"
import { WikiDisambig } from "@/components/editor/wiki-disambig"
import { WikiRelatedDocs } from "@/components/editor/wiki-related-docs"
import { BacklinksFooter } from "@/components/editor/backlinks-footer"

export function WikiView() {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const createWikiStub = usePlotStore((s) => s.createWikiStub)
  const router = useRouter()
  const backlinkCounts = useBacklinksIndex()

  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Article reader state
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)

  // Navigate to notes view (for non-wiki notes)
  const navigateToNote = useCallback(
    (noteId: string) => {
      openNote(noteId)
      setActiveRoute("/notes")
      router.push("/notes")
    },
    [openNote, router]
  )

  // Open article within WikiView
  const openArticle = useCallback((noteId: string) => {
    setSelectedArticleId(noteId)
  }, [])

  // Smart navigation: wiki notes open in-view, non-wiki go to /notes
  const handleNavigate = useCallback(
    (noteId: string) => {
      const target = notes.find((n) => n.id === noteId)
      if (target?.isWiki && !target.trashed) {
        openArticle(noteId)
      } else {
        navigateToNote(noteId)
      }
    },
    [notes, openArticle, navigateToNote]
  )

  const handleCreateWiki = useCallback(() => {
    const id = createWikiStub("Untitled Wiki")
    // Open new wiki in edit mode in /notes
    navigateToNote(id)
  }, [createWikiStub, navigateToNote])

  const handleCreateFromRedLink = useCallback(
    (title: string) => {
      const id = createWikiStub(title)
      openArticle(id)
    },
    [createWikiStub, openArticle]
  )

  const handleEditArticle = useCallback(() => {
    if (!selectedArticleId) return
    openNote(selectedArticleId)
    setActiveRoute("/notes")
    router.push("/notes")
  }, [selectedArticleId, openNote, router])

  const handleBack = useCallback(() => {
    setSelectedArticleId(null)
  }, [])

  // All non-trashed wiki articles
  const wikiNotes = useMemo(
    () => notes.filter((n) => n.isWiki && !n.trashed),
    [notes]
  )

  // Reset selectedArticleId if note was deleted
  const selectedNote = selectedArticleId
    ? notes.find((n) => n.id === selectedArticleId && !n.trashed)
    : null
  if (selectedArticleId && !selectedNote) {
    // Use effect-free reset: will be null on next render
    // We need to handle this in render to avoid stale state
  }

  // Red links: collect all [[link]] targets that don't have a matching wiki note
  const redLinks = useMemo(() => {
    const wikiTitleSet = new Set(
      wikiNotes.map((n) => n.title.toLowerCase())
    )
    wikiNotes.forEach((n) =>
      n.aliases.forEach((a) => wikiTitleSet.add(a.toLowerCase()))
    )

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

    return Array.from(linkRefs.entries())
      .map(([title, refs]) => ({ title, refCount: refs.size }))
      .sort((a, b) => b.refCount - a.refCount || a.title.localeCompare(b.title))
  }, [notes, wikiNotes])

  // Stats
  const stats = useMemo(() => {
    const articleCount = wikiNotes.length
    const redLinkCount = redLinks.length
    const internalLinkCount = wikiNotes.reduce(
      (sum, n) => sum + (n.linksOut?.length ?? 0),
      0
    )

    // Connected notes: unique non-wiki notes that have backlinks TO wiki notes
    const wikiIds = new Set(wikiNotes.map((n) => n.id))
    const connectedNoteIds = new Set<string>()
    for (const note of notes) {
      if (note.trashed || wikiIds.has(note.id)) continue
      for (const link of note.linksOut) {
        const normalized = link.toLowerCase()
        const hasMatch = wikiNotes.some(
          (w) =>
            w.title.toLowerCase() === normalized ||
            w.aliases.some((a) => a.toLowerCase() === normalized)
        )
        if (hasMatch) {
          connectedNoteIds.add(note.id)
          break
        }
      }
    }

    return {
      articles: articleCount,
      redLinks: redLinkCount,
      internalLinks: internalLinkCount,
      connectedNotes: connectedNoteIds.size,
    }
  }, [wikiNotes, redLinks, notes])

  // Search results (simple title/alias filter)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return wikiNotes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.aliases.some((a) => a.toLowerCase().includes(q))
      )
      .slice(0, 8)
  }, [wikiNotes, searchQuery])

  const showSearchDropdown =
    searchFocused && searchQuery.trim().length > 0 && searchResults.length > 0

  // Card data: recent changes
  const recentChanges = useMemo(
    () =>
      [...wikiNotes]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5),
    [wikiNotes]
  )

  // Card data: most connected (by backlink count)
  const mostConnected = useMemo(() => {
    return [...wikiNotes]
      .map((n) => ({ note: n, count: backlinkCounts.get(n.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [wikiNotes, backlinkCounts])

  // Card data: categories (tags used on wiki notes)
  const categories = useMemo(() => {
    const tagCounts = new Map<string, number>()
    let uncategorized = 0
    for (const n of wikiNotes) {
      if (n.tags.length === 0) {
        uncategorized++
      } else {
        for (const tag of n.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
        }
      }
    }
    return {
      tags: Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count })),
      uncategorized,
    }
  }, [wikiNotes])

  // Card data: stale documents (14+ days since update)
  const staleDocuments = useMemo(() => {
    const now = Date.now()
    const DAY = 86400000
    return wikiNotes
      .filter((n) => now - new Date(n.updatedAt).getTime() > 14 * DAY)
      .sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      )
      .slice(0, 5)
      .map((n) => {
        const daysAgo = Math.floor(
          (now - new Date(n.updatedAt).getTime()) / DAY
        )
        return { note: n, daysAgo }
      })
  }, [wikiNotes])

  // ── Article Reader Mode ──
  if (selectedArticleId && selectedNote) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <ViewHeader
          icon={<BookOpen className="h-5 w-5" strokeWidth={1.5} />}
          title={selectedNote.title || "Untitled"}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handleEditArticle}
                className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
              >
                <PenLine className="h-3.5 w-3.5" strokeWidth={1.5} />
                Edit
              </button>
            </div>
          }
        >
          {/* Back button row below ViewHeader */}
          <div className="flex items-center gap-2 border-b border-border px-5 py-1.5">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              Back
            </button>
          </div>
        </ViewHeader>

        <WikiArticleReader
          noteId={selectedArticleId}
          onNavigate={handleNavigate}
        />
      </div>
    )
  }

  // ── Dashboard Mode ──
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<BookOpen className="h-5 w-5" strokeWidth={1.5} />}
        title="Wiki"
        count={stats.articles}
        actions={
          <button
            onClick={handleCreateWiki}
            className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            New Article
          </button>
        }
      />

      {/* Scrollable dashboard */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-12 py-10">
          {/* Hero Section */}
          <div className="mb-10 text-center">
            <div className="mb-3 flex items-center justify-center gap-2.5">
              <BookOpen
                className="h-6 w-6 text-accent"
                strokeWidth={1.5}
              />
              <h2 className="text-xl font-semibold text-foreground">
                Plot Wiki
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Your personal encyclopedia
            </p>

            {/* Stat bar */}
            <div className="mt-5 flex items-center justify-center gap-6">
              <StatItem value={stats.articles} label="Articles" />
              <StatDivider />
              <StatItem
                value={stats.redLinks}
                label="Red Links"
                valueColor="text-destructive"
              />
              <StatDivider />
              <StatItem value={stats.internalLinks} label="Internal Links" />
              <StatDivider />
              <StatItem value={stats.connectedNotes} label="Connected Notes" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mx-auto mb-10 max-w-[640px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  setTimeout(() => setSearchFocused(false), 150)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults.length > 0) {
                    openArticle(searchResults[0].id)
                    setSearchQuery("")
                  }
                  if (e.key === "Escape") {
                    setSearchQuery("")
                    searchInputRef.current?.blur()
                  }
                }}
                placeholder="Search wiki articles..."
                className="h-11 w-full rounded-xl border border-border bg-secondary/50 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Search dropdown */}
            {showSearchDropdown && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-md">
                <div className="max-h-64 overflow-y-auto py-1">
                  {searchResults.map((note) => (
                    <button
                      key={note.id}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        openArticle(note.id)
                        setSearchQuery("")
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors duration-150 hover:bg-secondary"
                    >
                      <BookOpen
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        strokeWidth={1.5}
                      />
                      <span className="truncate">
                        {note.title || "Untitled"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card Grid */}
          <div className="grid grid-cols-3 gap-5 mt-2">
            {/* Card 1: Recent Changes */}
            <DashboardCard
              icon={
                <Clock
                  className="h-4 w-4 text-muted-foreground"
                  strokeWidth={1.5}
                />
              }
              title="Recent Changes"
            >
              {recentChanges.length === 0 ? (
                <EmptyCardMessage>No changes yet</EmptyCardMessage>
              ) : (
                <ul className="space-y-0.5">
                  {recentChanges.map((note) => (
                    <CardListItem
                      key={note.id}
                      onClick={() => openArticle(note.id)}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-accent" />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {note.title || "Untitled"}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {shortRelative(note.updatedAt)}
                      </span>
                    </CardListItem>
                  ))}
                </ul>
              )}
            </DashboardCard>

            {/* Card 2: Most Connected */}
            <DashboardCard
              icon={
                <TrendingUp
                  className="h-4 w-4 text-muted-foreground"
                  strokeWidth={1.5}
                />
              }
              title="Most Connected"
            >
              {mostConnected.length === 0 ||
              mostConnected[0].count === 0 ? (
                <EmptyCardMessage>No connected articles</EmptyCardMessage>
              ) : (
                <ul className="space-y-0.5">
                  {mostConnected
                    .filter((item) => item.count > 0)
                    .map((item) => (
                      <CardListItem
                        key={item.note.id}
                        onClick={() => openArticle(item.note.id)}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-accent" />
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                          {item.note.title || "Untitled"}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {item.count} notes
                        </span>
                      </CardListItem>
                    ))}
                </ul>
              )}
            </DashboardCard>

            {/* Card 3: Red Links (missing concepts) */}
            <DashboardCard
              icon={
                <CircleDot
                  className="h-4 w-4 text-destructive"
                  strokeWidth={1.5}
                />
              }
              title="Missing Concepts"
              titleColor="text-destructive"
            >
              {redLinks.length === 0 ? (
                <EmptyCardMessage>No red links</EmptyCardMessage>
              ) : (
                <ul className="space-y-0.5">
                  {redLinks.slice(0, 5).map((item) => (
                    <li key={item.title} className="group">
                      <button
                        onClick={() => handleCreateFromRedLink(item.title)}
                        className="flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-md cursor-pointer transition-colors duration-150 hover:bg-secondary"
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-destructive" />
                        <span className="min-w-0 flex-1 truncate text-sm text-destructive">
                          {item.title}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground group-hover:hidden">
                          {item.refCount} mentions
                        </span>
                        <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-accent group-hover:flex">
                          <Plus className="h-3 w-3" strokeWidth={1.5} />
                          Create
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>

            {/* Card 4: Categories (col-span-2) */}
            <DashboardCard
              icon={
                <FolderOpen
                  className="h-4 w-4 text-muted-foreground"
                  strokeWidth={1.5}
                />
              }
              title="Categories"
              className="col-span-2"
            >
              {categories.tags.length === 0 &&
              categories.uncategorized === 0 ? (
                <EmptyCardMessage>No tags</EmptyCardMessage>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.tags.map((tag) => (
                    <span
                      key={tag.name}
                      className="rounded-full bg-accent/10 text-accent px-2.5 py-0.5 text-xs font-medium"
                    >
                      {tag.name} ({tag.count})
                    </span>
                  ))}
                  {categories.uncategorized > 0 && (
                    <span className="rounded-full bg-yellow-500/10 text-yellow-500 px-2.5 py-0.5 text-xs font-medium">
                      Uncategorized ({categories.uncategorized})
                    </span>
                  )}
                </div>
              )}
            </DashboardCard>

            {/* Card 5: Stale Documents */}
            <DashboardCard
              icon={
                <AlertTriangle
                  className="h-4 w-4 text-muted-foreground"
                  strokeWidth={1.5}
                />
              }
              title="Stale Articles"
            >
              {staleDocuments.length === 0 ? (
                <EmptyCardMessage>No stale articles</EmptyCardMessage>
              ) : (
                <ul className="space-y-0.5">
                  {staleDocuments.map(({ note, daysAgo }) => (
                    <CardListItem
                      key={note.id}
                      onClick={() => openArticle(note.id)}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          daysAgo >= 30
                            ? "bg-destructive"
                            : "bg-yellow-500"
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {note.title || "Untitled"}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {shortRelative(note.updatedAt)}
                      </span>
                    </CardListItem>
                  ))}
                </ul>
              )}
            </DashboardCard>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Article Reader ──────────────────────────────── */

function WikiArticleReader({
  noteId,
  onNavigate,
}: {
  noteId: string
  onNavigate: (id: string) => void
}) {
  const notes = usePlotStore((s) => s.notes)
  const allTags = usePlotStore((s) => s.tags)
  const relations = usePlotStore((s) => s.relations)
  const backlinks = useBacklinksFor(noteId)

  const note = notes.find((n) => n.id === noteId)
  if (!note) return null

  const backlinkCount = backlinks.length
  const relationCount = relations.filter(
    (r) => r.sourceNoteId === noteId || r.targetNoteId === noteId
  ).length

  return (
    <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex">
      {/* Left: TOC sidebar */}
      <aside className="w-[200px] shrink-0 overflow-y-auto border-r border-border p-4">
        <div className="sticky top-0">
          <WikiTOC content={note.content} className="w-full" />
        </div>
      </aside>

      {/* Center: Article content */}
      <div className="flex-1 overflow-y-auto">
        <div className="wiki-read-content px-8 py-6 max-w-[780px]">
          {/* Disambig banner */}
          <WikiDisambig noteId={note.id} noteTitle={note.title} onNavigate={onNavigate} />

          {/* Title */}
          <h1 className="text-[28px] font-bold text-foreground mb-1">
            {note.title || "Untitled"}
          </h1>

          {/* Aliases as subtitle */}
          {note.aliases && note.aliases.length > 0 && (
            <p className="text-sm text-muted-foreground mb-6">
              {note.aliases.join(" \u00b7 ")}
            </p>
          )}

          {/* Article body */}
          <NoteEditorAdapter note={note} editable={false} />

          {/* Related wiki docs */}
          <WikiRelatedDocs noteId={note.id} onNavigate={onNavigate} />

          {/* Backlinks */}
          <BacklinksFooter noteId={note.id} onNavigate={onNavigate} />
        </div>
      </div>

      {/* Right: Infobox sidebar */}
      <aside className="w-[260px] shrink-0 overflow-y-auto border-l border-border p-4 space-y-4">
        {/* Infobox */}
        {(note.wikiInfobox ?? []).length > 0 && (
          <WikiInfobox
            noteId={note.id}
            entries={note.wikiInfobox ?? []}
            editable={false}
            className="w-full"
          />
        )}

        {/* Categories as badges */}
        {note.tags.length > 0 && (
          <WikiCategories noteTagIds={note.tags} allTags={allTags} />
        )}

        {/* Activity stats */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Activity
          </h4>
          <div className="space-y-1.5">
            <StatRow label="Connected notes" value={`${backlinkCount}`} />
            <StatRow label="Ontology links" value={`${relationCount}`} />
            <StatRow label="Last modified" value={shortRelative(note.updatedAt)} />
          </div>
        </div>
      </aside>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────── */

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-2xs text-muted-foreground">{label}</span>
      <span className="text-2xs font-medium text-foreground">{value}</span>
    </div>
  )
}

function StatItem({
  value,
  label,
  valueColor,
}: {
  value: number
  label: string
  valueColor?: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={cn(
          "text-lg font-semibold tabular-nums",
          valueColor ?? "text-foreground"
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function StatDivider() {
  return (
    <span className="text-sm text-muted-foreground/40 select-none">
      ·
    </span>
  )
}

function DashboardCard({
  icon,
  title,
  titleColor,
  className,
  children,
}: {
  icon: React.ReactNode
  title: string
  titleColor?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 min-h-[160px] transition-colors duration-150 hover:bg-card/80",
        className
      )}
    >
      <div
        className={cn(
          "text-sm font-semibold mb-3 flex items-center gap-2",
          titleColor ?? "text-muted-foreground"
        )}
      >
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}

function CardListItem({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-md cursor-pointer transition-colors duration-150 hover:bg-secondary"
      >
        {children}
      </button>
    </li>
  )
}

function EmptyCardMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground py-2">{children}</p>
  )
}
