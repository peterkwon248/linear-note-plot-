"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import type { FilterRule, FilterField, ViewState } from "@/lib/view-engine/types"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { WIKI_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Plus,
  Search,
  TrendingUp,
  CircleDot,
  AlertTriangle,
  ArrowLeft,
  PenLine,
  Check,
  ArrowUpFromLine,
  FileText,
  List,
  ChevronUp,
  Clock,
  MoreHorizontal,
  ArrowDownFromLine,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { groupByInitial, INDEX_GROUPS } from "@/lib/korean-utils"
import { startAutoEnrollment, stopAutoEnrollment } from "@/lib/wiki-auto-enroll"
import type { WikiStatus, StubSource } from "@/lib/types"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { useWikiViewMode, setWikiViewMode } from "@/lib/wiki-view-mode"
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
import { WikiCollectionSidebar } from "@/components/editor/wiki-collection-sidebar"
import { toast } from "sonner"
import { ViewDistributionPanel, type DistributionItem } from "@/components/view-distribution-panel"

export function WikiView() {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const createWikiStub = usePlotStore((s) => s.createWikiStub)
  const toggleTrash = usePlotStore((s) => s.toggleTrash)
  const router = useRouter()
  const backlinkCounts = useBacklinksIndex()

  const wikiViewMode = useWikiViewMode()

  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Import Note popover state
  const [importOpen, setImportOpen] = useState(false)
  const [importQuery, setImportQuery] = useState("")
  const importInputRef = useRef<HTMLInputElement>(null)

  // Dashboard filter
  const [dashFilter, setDashFilter] = useState<"all" | "stubs" | "drafts" | "complete">("all")

  // All Articles view state
  const [showAllArticles, setShowAllArticles] = useState(false)

  // Filter / Display state
  const [wikiFilters, setWikiFilters] = useState<FilterRule[]>([])
  const [showDistribution, setShowDistribution] = useState(false)
  const [wikiViewState, setWikiViewState] = useState<ViewState>({
    viewMode: "list" as const,
    sortField: "updatedAt" as const,
    sortDirection: "desc" as const,
    groupBy: "none" as const,
    subGroupBy: "none" as const,
    filters: [] as FilterRule[],
    visibleColumns: ["status", "links", "tags", "updatedAt"],
    showEmptyGroups: false,
    orderPermanentByRecency: false,
    showThread: false,
  })
  const handleWikiFilterToggle = (rule: FilterRule) => {
    setWikiFilters((prev) => {
      const exists = prev.some(
        (f) => f.field === rule.field && f.value === rule.value
      )
      return exists
        ? prev.filter(
            (f) => !(f.field === rule.field && f.value === rule.value)
          )
        : [...prev, rule]
    })
  }

  // Auto-enrollment
  const setWikiStatus = usePlotStore((s) => s.setWikiStatus)
  const convertToWiki = usePlotStore((s) => s.convertToWiki)
  const tags = usePlotStore((s) => s.tags)

  useEffect(() => {
    const getState = () => ({
      notes: usePlotStore.getState().notes,
      tags: usePlotStore.getState().tags,
    })
    const store = usePlotStore.getState()
    const actions = {
      createWikiStub: (title: string, aliases?: string[], stubSource?: string) =>
        store.createWikiStub(title, aliases, stubSource as StubSource | undefined),
      convertToWiki: (noteId: string, stubSource?: string) =>
        store.convertToWiki(noteId, stubSource as StubSource | undefined),
    }
    startAutoEnrollment(getState, actions)
    return () => stopAutoEnrollment()
  }, [])

  // Article reader state
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [isEditingArticle, setIsEditingArticle] = useState(false)

  // Reset edit mode whenever we navigate to a different article
  useEffect(() => {
    setIsEditingArticle(false)
  }, [selectedArticleId])

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
      const id = createWikiStub(title, [], "red-link")
      openArticle(id)
    },
    [createWikiStub, openArticle]
  )

  const handleEditArticle = useCallback(() => {
    setIsEditingArticle(true)
  }, [])

  const handleDoneEditing = useCallback(() => {
    setIsEditingArticle(false)
  }, [])

  const handleBack = useCallback(() => {
    setIsEditingArticle(false)
    setSelectedArticleId(null)
  }, [])

  const handleDemote = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId)
      if (!note) return
      const status = note.wikiStatus
      if (status === "complete") {
        setWikiStatus(noteId, "draft")
        toast.success(`"${note.title || "Untitled"}" demoted to Draft`)
      } else if (status === "draft") {
        setWikiStatus(noteId, "stub")
        toast.success(`"${note.title || "Untitled"}" demoted to Stub`)
      }
      // stub has no demotion — it's the bottom of the lifecycle
    },
    [notes, setWikiStatus]
  )

  // All non-trashed wiki articles
  const wikiNotes = useMemo(
    () => notes.filter((n) => n.isWiki && !n.trashed),
    [notes]
  )

  // Filter by wikiStatus
  const filteredWikiNotes = useMemo(() => {
    if (dashFilter === "all") return wikiNotes
    if (dashFilter === "stubs") return wikiNotes.filter(n => n.wikiStatus === "stub")
    if (dashFilter === "drafts") return wikiNotes.filter(n => n.wikiStatus === "draft")
    if (dashFilter === "complete") return wikiNotes.filter(n => n.wikiStatus === "complete")
    return wikiNotes
  }, [wikiNotes, dashFilter])

  // Sorted by updatedAt descending for articles table-list
  const sortedFilteredWikiNotes = useMemo(
    () =>
      [...filteredWikiNotes].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [filteredWikiNotes]
  )

  // Grouped by 초성 for All Articles view (uses filtered notes when filter active)
  const groupedArticles = useMemo(
    () => groupByInitial(filteredWikiNotes, (n) => n.title || "Untitled"),
    [filteredWikiNotes]
  )

  // Non-wiki, non-trashed, non-archived notes available to import
  const importableNotes = useMemo(() => {
    const q = importQuery.toLowerCase().trim()
    return notes
      .filter((n) => !n.isWiki && !n.trashed && !n.archived)
      .filter((n) =>
        q.length === 0
          ? true
          : (n.title || "Untitled").toLowerCase().includes(q)
      )
      .slice(0, 12)
  }, [notes, importQuery])

  const handleImportNote = useCallback(
    (noteId: string) => {
      usePlotStore.getState().convertToWiki(noteId, "manual")
      setImportOpen(false)
      setImportQuery("")
      // Open the freshly promoted article
      setSelectedArticleId(noteId)
    },
    []
  )

  // Reset selectedArticleId if note was deleted
  const selectedNote = selectedArticleId
    ? notes.find((n) => n.id === selectedArticleId && !n.trashed)
    : null
  useEffect(() => {
    if (selectedArticleId && !notes.find((n) => n.id === selectedArticleId && !n.trashed)) {
      setSelectedArticleId(null)
    }
  }, [selectedArticleId, notes])

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
      stubs: wikiNotes.filter(n => n.wikiStatus === "stub").length,
      drafts: wikiNotes.filter(n => n.wikiStatus === "draft").length,
      complete: wikiNotes.filter(n => n.wikiStatus === "complete").length,
    }
  }, [wikiNotes, redLinks, notes])

  // Article count: draft + complete only (excludes stubs)
  const articleCount = useMemo(
    () => wikiNotes.filter((n) => n.wikiStatus !== "stub").length,
    [wikiNotes]
  )

  // Coverage stats: how many non-wiki notes are connected to wiki
  const coverageStats = useMemo(() => {
    const nonWikiNotes = notes.filter((n) => !n.isWiki && !n.trashed)
    const total = nonWikiNotes.length
    if (total === 0) return { connected: 0, total: 0, percent: 0 }

    const wikiTitleSet = new Set(
      wikiNotes.flatMap((w) => [
        w.title.toLowerCase(),
        ...w.aliases.map((a) => a.toLowerCase()),
      ])
    )

    const connectedIds = new Set<string>()

    // A: non-wiki notes that reference wiki (via linksOut)
    for (const n of nonWikiNotes) {
      if (n.linksOut.some((link) => wikiTitleSet.has(link.toLowerCase()))) {
        connectedIds.add(n.id)
      }
    }

    // B: non-wiki notes referenced BY wiki notes
    for (const w of wikiNotes) {
      for (const link of w.linksOut) {
        const normalized = link.toLowerCase()
        for (const n of nonWikiNotes) {
          if (connectedIds.has(n.id)) continue
          const titles = [n.title.toLowerCase(), ...n.aliases.map((a) => a.toLowerCase())]
          if (titles.includes(normalized)) {
            connectedIds.add(n.id)
          }
        }
      }
    }

    const connected = connectedIds.size
    const percent = Math.round((connected / total) * 100)
    return { connected, total, percent }
  }, [notes, wikiNotes])

  const wikiDistributionTabs = useMemo(() => [
    { key: "wikiStatus", label: "Wiki Status" },
    { key: "tags", label: "Categories" },
    { key: "backlinks", label: "Backlinks" },
  ], [])

  const getWikiDistribution = useCallback((tabKey: string): DistributionItem[] => {
    switch (tabKey) {
      case "wikiStatus": {
        const counts: Record<string, number> = { stub: 0, draft: 0, complete: 0 }
        for (const n of wikiNotes) {
          if (n.wikiStatus) counts[n.wikiStatus] = (counts[n.wikiStatus] ?? 0) + 1
        }
        return [
          { key: "complete", label: "Complete", count: counts.complete, color: "#45d483" },
          { key: "draft", label: "Draft", count: counts.draft, color: "#f5a623" },
          { key: "stub", label: "Stub", count: counts.stub, color: "rgba(255,255,255,0.32)" },
        ].filter(i => i.count > 0)
      }
      case "tags": {
        const counts: Record<string, number> = {}
        for (const n of wikiNotes) {
          for (const tId of n.tags) {
            counts[tId] = (counts[tId] ?? 0) + 1
          }
        }
        return Object.entries(counts)
          .map(([tId, count]) => ({
            key: tId,
            label: tags.find(t => t.id === tId)?.name ?? "Unknown",
            count,
          }))
          .sort((a, b) => b.count - a.count)
      }
      case "backlinks": {
        const ranges = { "0": 0, "1-4": 0, "5-9": 0, "10+": 0 }
        for (const n of wikiNotes) {
          const bc = backlinkCounts.get(n.id) ?? 0
          if (bc === 0) ranges["0"]++
          else if (bc <= 4) ranges["1-4"]++
          else if (bc <= 9) ranges["5-9"]++
          else ranges["10+"]++
        }
        return [
          { key: "10+", label: "10+ backlinks", count: ranges["10+"] },
          { key: "5-9", label: "5-9 backlinks", count: ranges["5-9"] },
          { key: "1-4", label: "1-4 backlinks", count: ranges["1-4"] },
          { key: "0", label: "No backlinks", count: ranges["0"] },
        ].filter(i => i.count > 0)
      }
      default:
        return []
    }
  }, [wikiNotes, tags, backlinkCounts])

  const handleWikiDistributionClick = useCallback((tabKey: string, itemKey: string) => {
    const fieldMap: Record<string, FilterField> = {
      wikiStatus: "isWiki",
      tags: "tags",
      backlinks: "links",
    }
    const field = fieldMap[tabKey]
    if (!field) return
    const rule: FilterRule = { field, operator: "eq", value: itemKey }
    const exists = wikiFilters.some(
      f => f.field === rule.field && f.operator === rule.operator && f.value === rule.value
    )
    if (!exists) {
      setWikiFilters(prev => [...prev, rule])
    }
  }, [wikiFilters])

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

  // Card data: stubs grouped by source
  const stubsBySource = useMemo(() => {
    const counts = new Map<string, number>()
    for (const n of wikiNotes) {
      if (n.wikiStatus !== "stub") continue
      const src = n.stubSource ?? "manual"
      counts.set(src, (counts.get(src) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
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
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1">
                  {selectedNote?.wikiStatus !== "stub" && (
                    <button
                      onClick={() => handleDemote(selectedArticleId)}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors duration-150 hover:bg-secondary"
                    >
                      <ArrowDownFromLine className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                      {selectedNote?.wikiStatus === "complete" ? "Demote to Draft" : "Demote to Stub"}
                    </button>
                  )}
                  <button
                    onClick={() => { toggleTrash(selectedArticleId); setSelectedArticleId(null) }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-destructive transition-colors duration-150 hover:bg-destructive/10"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Move to Trash
                  </button>
                </PopoverContent>
              </Popover>
              {isEditingArticle ? (
                <button
                  onClick={handleDoneEditing}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Done
                </button>
              ) : (
                <button
                  onClick={handleEditArticle}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
                >
                  <PenLine className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Edit
                </button>
              )}
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
          isEditing={isEditingArticle}
        />
      </div>
    )
  }

  // ── Wiki View (Dashboard or List mode) ──
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<BookOpen className="h-5 w-5" strokeWidth={1.5} />}
        title="Wiki"
        count={stats.articles}
        showFilter
        hasActiveFilters={wikiFilters.length > 0}
        filterContent={
          <FilterPanel
            categories={WIKI_VIEW_CONFIG.filterCategories}
            activeFilters={wikiFilters}
            onToggle={handleWikiFilterToggle}
          />
        }
        showDisplay
        displayContent={
          <DisplayPanel
            config={WIKI_VIEW_CONFIG.displayConfig}
            viewState={wikiViewState}
            onViewStateChange={(patch) =>
              setWikiViewState((prev) => ({ ...prev, ...patch }))
            }
          />
        }
        showDetailPanel
        detailPanelOpen={showDistribution}
        onDetailPanelToggle={() => setShowDistribution(!showDistribution)}
        actions={
          <div className="flex items-center gap-2">
            <Popover open={importOpen} onOpenChange={(o) => {
              setImportOpen(o)
              if (!o) setImportQuery("")
              else setTimeout(() => importInputRef.current?.focus(), 50)
            }}>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-secondary"
                >
                  <ArrowUpFromLine className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Import Note
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0">
                <div className="border-b border-border px-3 py-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      ref={importInputRef}
                      type="text"
                      value={importQuery}
                      onChange={(e) => setImportQuery(e.target.value)}
                      placeholder="Search notes..."
                      className="h-8 w-full rounded-md bg-secondary/50 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {importableNotes.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                      {importQuery.trim() ? "No matching notes" : "No notes to import"}
                    </p>
                  ) : (
                    importableNotes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => handleImportNote(note.id)}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors duration-150 hover:bg-secondary"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                        <span className="min-w-0 flex-1 truncate">
                          {note.title || "Untitled"}
                        </span>
                        <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                          {note.status}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <button
              onClick={handleCreateWiki}
              className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              New Article
            </button>
          </div>
        }
      />

      {wikiViewMode === "dashboard" ? (
        /* ══════════════════════════════════════════════════
           Dashboard Mode
           ══════════════════════════════════════════════════ */
        <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[860px] px-6 py-8">
            {/* Hero Section */}
            <div className="mb-10 text-center">
              <div className="mb-3 flex items-center justify-center gap-2.5">
                <BookOpen className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <h2 className="text-xl font-semibold text-foreground">Overview</h2>
              </div>
              <p className="text-sm text-muted-foreground">Your personal encyclopedia</p>
            </div>

            {/* Search bar */}
            <div className="relative mb-8">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
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
                  className="h-9 w-full rounded-lg border border-border bg-secondary/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
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
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                        <span className="truncate">{note.title || "Untitled"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5 stat cards — clickable drill-down */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              <StatCard icon={BookOpen} label="Total" value={stats.articles} color="text-foreground" onClick={() => { setWikiViewMode("list"); setDashFilter("all") }} />
              <StatCard icon={FileText} label="Articles" value={articleCount} color="text-accent" onClick={() => { setWikiViewMode("list"); setDashFilter("all") }} />
              <StatCard icon={CircleDot} label="Stubs" value={stats.stubs} color="text-chart-3" onClick={() => { setWikiViewMode("list"); setDashFilter("stubs") }} />
              <StatCard icon={AlertTriangle} label="Red Links" value={stats.redLinks} color="text-destructive" />
              {/* Coverage card with progress bar */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-chart-5" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-muted-foreground">Coverage</span>
                </div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">{coverageStats.percent}%</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-chart-5 transition-all duration-300" style={{ width: `${coverageStats.percent}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{coverageStats.connected} / {coverageStats.total}</p>
              </div>
            </div>

            {/* Actionable insight cards -- 2-column grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Stale Documents */}
              {staleDocuments.length > 0 && (
                <DashboardCard title="Stale Documents" subtitle="Not updated in 14+ days">
                  {staleDocuments.map(({ note: staleNote, daysAgo }) => (
                    <button
                      key={staleNote.id}
                      onClick={() => openArticle(staleNote.id)}
                      className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-secondary"
                    >
                      <Clock className="h-3 w-3 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                      <span className="min-w-0 flex-1 truncate text-xs text-foreground">{staleNote.title || "Untitled"}</span>
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground group-hover:hidden">{daysAgo}d ago</span>
                      <span className="hidden shrink-0 text-[10px] font-medium text-accent group-hover:block">Open</span>
                    </button>
                  ))}
                </DashboardCard>
              )}

              {/* Red Links */}
              {redLinks.length > 0 && (
                <DashboardCard title="Red Links" subtitle="Referenced but not created">
                  {redLinks.slice(0, 5).map((item) => (
                    <div key={item.title} className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-secondary">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                      <span className="min-w-0 flex-1 truncate text-xs text-destructive">{item.title}</span>
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground group-hover:hidden">{item.refCount} refs</span>
                      <button
                        onClick={() => handleCreateFromRedLink(item.title)}
                        className="hidden shrink-0 items-center gap-0.5 text-[10px] font-medium text-accent group-hover:flex"
                      >
                        <Plus className="h-3 w-3" strokeWidth={1.5} />
                        Create
                      </button>
                    </div>
                  ))}
                </DashboardCard>
              )}

              {/* Most Connected */}
              {mostConnected.length > 0 && mostConnected[0].count > 0 && (
                <DashboardCard title="Most Connected" subtitle="Hub articles">
                  {mostConnected.filter(({ count }) => count > 0).map(({ note: connNote, count }) => (
                    <button
                      key={connNote.id}
                      onClick={() => openArticle(connNote.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-secondary"
                    >
                      <WikiStatusDot status={connNote.wikiStatus} />
                      <span className="min-w-0 flex-1 truncate text-xs text-foreground">{connNote.title || "Untitled"}</span>
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{count} links</span>
                    </button>
                  ))}
                </DashboardCard>
              )}

              {/* Recent Changes */}
              {recentChanges.length > 0 && (
                <DashboardCard title="Recent Changes">
                  {recentChanges.map((rcNote) => (
                    <button
                      key={rcNote.id}
                      onClick={() => openArticle(rcNote.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-secondary"
                    >
                      <WikiStatusDot status={rcNote.wikiStatus} />
                      <span className="min-w-0 flex-1 truncate text-xs text-foreground">{rcNote.title || "Untitled"}</span>
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{shortRelative(rcNote.updatedAt)}</span>
                    </button>
                  ))}
                </DashboardCard>
              )}
            </div>
          </div>
        </div>
        {showDistribution && (
          <ViewDistributionPanel
            tabs={wikiDistributionTabs}
            getDistribution={getWikiDistribution}
            onItemClick={handleWikiDistributionClick}
            onClose={() => setShowDistribution(false)}
          />
        )}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════
           List Mode (table-list view)
           ══════════════════════════════════════════════════ */
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Main content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6">
              {/* Back to Overview */}
              <div className="mb-4">
                <button
                  onClick={() => setWikiViewMode("dashboard")}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Overview
                </button>
              </div>

              {/* Search bar */}
              <div className="relative mb-6">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
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
                    className="h-9 w-full rounded-lg border border-border bg-secondary/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
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
                          <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                          <span className="truncate">{note.title || "Untitled"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stat cards row */}
              <div className="grid grid-cols-5 gap-4 mb-8">
                <StatCard icon={BookOpen} label="Total" value={stats.articles} color="text-foreground" onClick={() => setDashFilter("all")} />
                <StatCard icon={FileText} label="Articles" value={articleCount} color="text-accent" onClick={() => setDashFilter("all")} />
                <StatCard icon={CircleDot} label="Stubs" value={stats.stubs} color="text-chart-3" onClick={() => setDashFilter("stubs")} />
                <StatCard icon={AlertTriangle} label="Red Links" value={stats.redLinks} color="text-destructive" />
                <StatCard icon={TrendingUp} label="Connected" value={stats.connectedNotes} color="text-chart-5" />
              </div>

              {/* Articles section header */}
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Articles</h3>
                <div className="flex items-center gap-1">
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
                          "rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150",
                          dashFilter === tab && !showAllArticles
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        {labels[tab]}
                      </button>
                    )
                  })}
                  <span className="mx-1.5 text-border">|</span>
                  <button
                    onClick={() => setShowAllArticles(!showAllArticles)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150",
                      showAllArticles
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <List className="h-3 w-3" strokeWidth={1.5} />
                    Index
                  </button>
                </div>
              </div>

              {/* Articles list OR Index view */}
              {showAllArticles ? (
                /* ── All Articles Alphabetical Index ── */
                <div>
                  {/* Jump Navigation */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {INDEX_GROUPS.filter(g => groupedArticles.has(g)).map(group => (
                      <button
                        key={group}
                        onClick={() => {
                          const el = document.getElementById(`wiki-group-${group}`)
                          el?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }}
                        className="w-7 h-7 rounded text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-150"
                      >
                        {group}
                      </button>
                    ))}
                  </div>

                  {/* Grouped List */}
                  <div className="space-y-6">
                    {Array.from(groupedArticles.entries()).map(([group, articles]) => (
                      <div key={group} id={`wiki-group-${group}`}>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 sticky top-0 bg-background py-1 z-10">
                          {group}
                        </h3>
                        <div className="space-y-0.5">
                          {articles.map(note => (
                            <button
                              key={note.id}
                              onClick={() => openArticle(note.id)}
                              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-secondary"
                            >
                              <WikiStatusDot status={note.wikiStatus} />
                              <span className="min-w-0 flex-1 truncate text-foreground">
                                {note.title || "Untitled"}
                              </span>
                              {note.wikiStatus && (
                                <span className={cn(
                                  "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize",
                                  note.wikiStatus === "stub" ? "bg-chart-3/10 text-chart-3" :
                                  note.wikiStatus === "draft" ? "bg-accent/10 text-accent" :
                                  "bg-chart-5/10 text-chart-5"
                                )}>
                                  {note.wikiStatus}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* ── Articles Table-List ── */
                <div>
                  {sortedFilteredWikiNotes.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-muted-foreground">No articles found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border rounded-lg border border-border">
                      {sortedFilteredWikiNotes.map(note => (
                        <ArticleRow
                          key={note.id}
                          note={note}
                          onOpen={openArticle}
                          backlinkCount={backlinkCounts.get(note.id) ?? 0}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-[280px] shrink-0 border-l border-border overflow-y-auto px-5 py-6">
            {/* Categories */}
            <SidebarSection title="Categories">
              {categories.tags.length === 0 && categories.uncategorized === 0 ? (
                <p className="text-xs text-muted-foreground">No categories</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {categories.tags.map((tag) => (
                    <span
                      key={tag.name}
                      className="rounded-full bg-accent/10 text-accent px-2 py-0.5 text-xs font-medium"
                    >
                      {tag.name} ({tag.count})
                    </span>
                  ))}
                  {categories.uncategorized > 0 && (
                    <span className="rounded-full bg-chart-3/10 text-chart-3 px-2 py-0.5 text-xs font-medium">
                      Uncategorized ({categories.uncategorized})
                    </span>
                  )}
                </div>
              )}
            </SidebarSection>

            {/* Recent */}
            <SidebarSection title="Recent">
              {recentChanges.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent changes</p>
              ) : (
                <ul className="space-y-0.5">
                  {recentChanges.map((note) => (
                    <li key={note.id}>
                      <button
                        onClick={() => openArticle(note.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-secondary"
                      >
                        <WikiStatusDot status={note.wikiStatus} />
                        <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                          {note.title || "Untitled"}
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                          {shortRelative(note.updatedAt)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </SidebarSection>

            {/* Red Links */}
            {redLinks.length > 0 && (
              <SidebarSection title="Red Links">
                <ul className="space-y-0.5">
                  {redLinks.slice(0, 5).map((item) => (
                    <li key={item.title} className="group">
                      <button
                        onClick={() => handleCreateFromRedLink(item.title)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-secondary"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                        <span className="min-w-0 flex-1 truncate text-xs text-destructive">
                          {item.title}
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground group-hover:hidden">
                          {item.refCount}
                        </span>
                        <span className="hidden shrink-0 items-center gap-0.5 text-[10px] font-medium text-accent group-hover:flex">
                          <Plus className="h-3 w-3" strokeWidth={1.5} />
                          Create
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </SidebarSection>
            )}

            {/* Stubs by Source */}
            {stats.stubs > 0 && (
              <SidebarSection title="Stubs by Source">
                <StubsBySourceList items={stubsBySource} />
              </SidebarSection>
            )}
          </div>
          {showDistribution && (
            <ViewDistributionPanel
              tabs={wikiDistributionTabs}
              getDistribution={getWikiDistribution}
              onItemClick={handleWikiDistributionClick}
              onClose={() => setShowDistribution(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

/* ── Article Reader ──────────────────────────────── */

function WikiArticleReader({
  noteId,
  onNavigate,
  isEditing = false,
}: {
  noteId: string
  onNavigate: (id: string) => void
  isEditing?: boolean
}) {
  const notes = usePlotStore((s) => s.notes)
  const allTags = usePlotStore((s) => s.tags)
  const relations = usePlotStore((s) => s.relations)
  const setWikiStatus = usePlotStore((s) => s.setWikiStatus)
  const backlinks = useBacklinksFor(noteId)
  const editorRef = useRef<any>(null)

  const note = notes.find((n) => n.id === noteId)
  if (!note) return null

  const backlinkCount = backlinks.length
  const relationCount = relations.filter(
    (r) => r.sourceNoteId === noteId || r.targetNoteId === noteId
  ).length

  // Edit mode: editor + collection sidebar
  if (isEditing) {
    return (
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 max-w-[780px]">
            <NoteEditorAdapter
              note={note}
              editable={true}
              onEditorReady={(ed) => { editorRef.current = ed }}
            />
          </div>
        </div>
        <WikiCollectionSidebar
          noteId={noteId}
          onNavigate={onNavigate}
          onInsertLink={(title: string) => {
            const editor = editorRef.current
            if (editor) {
              editor.chain().focus().insertContent(`[[${title}]]`).run()
              toast.success(`Inserted [[${title}]]`, { duration: 1500 })
            }
          }}
          onInsertQuote={(sourceNoteId: string, sourceTitle: string, quotedText: string) => {
            const editor = editorRef.current
            if (editor) {
              editor.chain().focus().insertContent({
                type: "wikiQuote",
                attrs: {
                  sourceNoteId,
                  sourceTitle,
                  quotedText,
                  quotedAt: new Date().toISOString(),
                },
              }).run()
              toast.success(`Quote from "${sourceTitle}" inserted`, { duration: 1500 })
            }
          }}
        />
      </div>
    )
  }

  // Read mode: 3-column layout
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
          <WikiCategories noteTagIds={note.tags} allTags={allTags.filter((t) => !t.trashed)} />
        )}

        {/* Wiki Quality Track */}
        {note.isWiki && note.wikiStatus && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quality
            </h4>
            <div className="flex items-center gap-2">
              <WikiStatusBadge status={note.wikiStatus} />
              {note.stubSource && note.wikiStatus === "stub" && (
                <span className="text-[10px] text-muted-foreground">
                  via {note.stubSource}
                </span>
              )}
            </div>
            {/* Promotion buttons */}
            <div className="flex gap-1.5">
              {note.wikiStatus === "stub" && (
                <button
                  onClick={() => setWikiStatus(note.id, "draft")}
                  className="flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500 transition-colors hover:bg-blue-500/20"
                >
                  <ChevronUp className="h-3 w-3" />
                  Promote to Draft
                </button>
              )}
              {note.wikiStatus === "draft" && (
                <button
                  onClick={() => setWikiStatus(note.id, "complete")}
                  className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500 transition-colors hover:bg-emerald-500/20"
                >
                  <ChevronUp className="h-3 w-3" />
                  Mark Complete
                </button>
              )}
              {note.wikiStatus === "complete" && (
                <span className="flex items-center gap-1 text-xs text-emerald-500">
                  <Check className="h-3 w-3" />
                  Complete
                </span>
              )}
            </div>
          </div>
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

function StatCard({ icon: Icon, label, value, color, onClick }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>; label: string; value: number; color: string; onClick?: () => void }) {
  const Wrapper = onClick ? "button" : "div"
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border bg-card p-4 text-left",
        onClick && "transition-colors duration-150 hover:bg-secondary/50 hover:border-accent/30 cursor-pointer"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-4 w-4", color)} strokeWidth={1.5} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </Wrapper>
  )
}

function ArticleRow({ note, onOpen, backlinkCount }: { note: { id: string; title: string; wikiStatus: WikiStatus | null; preview?: string; updatedAt: string }; onOpen: (id: string) => void; backlinkCount: number }) {
  return (
    <button
      onClick={() => onOpen(note.id)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-secondary/50"
    >
      <WikiStatusDot status={note.wikiStatus} />
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground">{note.title || "Untitled"}</span>
        {note.preview && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{note.preview}</p>
        )}
      </div>
      {backlinkCount > 0 && (
        <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
          {backlinkCount} links
        </span>
      )}
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {shortRelative(note.updatedAt)}
      </span>
    </button>
  )
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      {children}
    </div>
  )
}

function DashboardCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{title}</h3>
      {subtitle && <p className="text-[10px] text-muted-foreground mb-3">{subtitle}</p>}
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function WikiStatusDot({ status }: { status: WikiStatus | null }) {
  if (!status) return <span className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/30" />
  const colors: Record<string, string> = {
    stub: "bg-chart-3",
    draft: "bg-accent",
    complete: "bg-chart-5",
  }
  return <span className={cn("h-2 w-2 rounded-full shrink-0", colors[status] ?? "bg-muted-foreground/30")} />
}

const STUB_SOURCE_LABELS: Record<string, string> = {
  "red-link": "Red Links",
  "tag": "Tags",
  "backlink": "Backlinks",
  "manual": "Manual",
}

const STUB_SOURCE_COLORS: Record<string, string> = {
  "red-link": "bg-destructive/10 text-destructive",
  "tag": "bg-accent/10 text-accent",
  "backlink": "bg-blue-500/10 text-blue-500",
  "manual": "bg-secondary text-muted-foreground",
}

function StubsBySourceList({ items }: { items: [string, number][] }) {
  return (
    <div className="space-y-2">
      {items.map(([source, count]) => (
        <div key={source} className="flex items-center justify-between">
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STUB_SOURCE_COLORS[source] ?? "bg-secondary text-muted-foreground")}>
            {STUB_SOURCE_LABELS[source] ?? source}
          </span>
          <span className="text-xs tabular-nums font-medium text-foreground">{count}</span>
        </div>
      ))}
    </div>
  )
}

function WikiStatusBadge({ status }: { status: WikiStatus }) {
  const styles: Record<string, string> = {
    stub: "bg-yellow-500/10 text-yellow-500",
    draft: "bg-blue-500/10 text-blue-500",
    complete: "bg-emerald-500/10 text-emerald-500",
  }
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", styles[status])}>
      {status}
    </span>
  )
}
