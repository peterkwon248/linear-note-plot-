"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import type { FilterRule, FilterField, ViewState } from "@/lib/view-engine/types"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { WIKI_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Plus,
  Search,
  AlertTriangle,
  ArrowLeft,
  PenLine,
  Check,
  ArrowUpFromLine,
  FileText,
  MoreHorizontal,
  ArrowDownFromLine,
  Merge,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { startAutoEnrollment, stopAutoEnrollment } from "@/lib/wiki-auto-enroll"
import type { StubSource } from "@/lib/types"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { useWikiViewMode, setWikiViewMode } from "@/lib/wiki-view-mode"
import { ViewHeader } from "@/components/view-header"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { toast } from "sonner"
import { ViewDistributionPanel, type DistributionItem } from "@/components/view-distribution-panel"
import { WikiArticleReader } from "./wiki-article-reader"
import { WikiDashboard } from "./wiki-dashboard"
import { WikiList } from "./wiki-list"
import { WikiArticleView } from "@/components/wiki-editor/wiki-article-view"
import { useWikiCategoryFilter, setWikiCategoryFilter } from "@/lib/wiki-category-filter"
import { usePendingWikiArticle, consumePendingWikiArticle } from "@/lib/wiki-article-nav"

export function WikiView() {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const createWikiStub = usePlotStore((s) => s.createWikiStub)
  const createWikiArticle = usePlotStore((s) => s.createWikiArticle)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const toggleTrash = usePlotStore((s) => s.toggleTrash)
  const mergeWikiArticles = usePlotStore((s) => s.mergeWikiArticles)
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

  // Wiki merge state
  const [wikiMergeSourceId, setWikiMergeSourceId] = useState<string | null>(null)

  // Dashboard filter
  const [dashFilter, setDashFilter] = useState<"all" | "stubs" | "drafts" | "complete">("all")

  // Category filter from sidebar click
  const categoryFilterTagId = useWikiCategoryFilter()

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
    toggles: {},
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
    // Auto-enrollment disabled — WikiArticle (Assembly Model) replaces Note-based wiki
    // TODO: Re-enable with createWikiArticle instead of createWikiStub/convertToWiki
    // startAutoEnrollment(getState, actions)
    // return () => stopAutoEnrollment()
  }, [])

  // Article reader state (Note-based legacy)
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [isEditingArticle, setIsEditingArticle] = useState(false)

  // WikiArticle viewer state (new Assembly Model)
  const [selectedWikiArticleId, setSelectedWikiArticleId] = useState<string | null>(null)
  const [isEditingWikiArticle, setIsEditingWikiArticle] = useState(false)

  // Navigate to WikiArticle when triggered from outside (e.g., "Referenced in" badge)
  const pendingArticleId = usePendingWikiArticle()
  useEffect(() => {
    if (pendingArticleId) {
      setSelectedWikiArticleId(pendingArticleId)
      consumePendingWikiArticle()
    }
  }, [pendingArticleId])

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
  const openArticle = useCallback((id: string) => {
    // Check if id is a WikiArticle directly
    const directArticle = wikiArticles.find((a) => a.id === id)
    if (directArticle) {
      setSelectedWikiArticleId(id)
      return
    }
    // Check if there's a WikiArticle with matching title for a note
    const note = notes.find((n) => n.id === id)
    if (note) {
      const matchingArticle = wikiArticles.find(
        (a) => a.title.toLowerCase() === note.title.toLowerCase()
      )
      if (matchingArticle) {
        setSelectedWikiArticleId(matchingArticle.id)
        return
      }
    }
    setSelectedArticleId(id)
  }, [notes, wikiArticles])

  // Smart navigation: wiki articles open in-view, non-wiki go to /notes
  const handleNavigate = useCallback(
    (noteId: string) => {
      const target = notes.find((n) => n.id === noteId)
      if (!target || target.trashed) return
      // Check if there's a matching WikiArticle
      const matchingWiki = wikiArticles.find(
        (a) => a.title.toLowerCase() === target.title.toLowerCase()
      )
      if (matchingWiki) {
        setSelectedWikiArticleId(matchingWiki.id)
      } else {
        navigateToNote(noteId)
      }
    },
    [notes, wikiArticles, navigateToNote]
  )

  const handleCreateWiki = useCallback(() => {
    const id = createWikiArticle({ title: "Untitled Wiki" })
    setSelectedWikiArticleId(id)
    setIsEditingWikiArticle(true)
  }, [createWikiArticle])

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

  // Wiki data comes from wikiArticles (separate entity since v47)
  const wikiNotes = wikiArticles

  // Filter by wikiStatus
  const filteredWikiNotes = useMemo(() => {
    let result = wikiNotes
    // Apply status filter
    if (dashFilter === "stubs") result = result.filter(n => n.wikiStatus === "stub")
    else if (dashFilter === "drafts") result = result.filter(n => n.wikiStatus === "draft")
    else if (dashFilter === "complete") result = result.filter(n => n.wikiStatus === "complete")
    // Apply category filter from sidebar
    if (categoryFilterTagId) {
      result = result.filter(n => n.tags.includes(categoryFilterTagId))
    }
    return result
  }, [wikiNotes, dashFilter, categoryFilterTagId])

  // Sorted by updatedAt descending for articles table-list
  const sortedFilteredWikiNotes = useMemo(
    () =>
      [...filteredWikiNotes].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [filteredWikiNotes]
  )

  // Non-trashed notes available to import
  const importableNotes = useMemo(() => {
    const q = importQuery.toLowerCase().trim()
    return notes
      .filter((n) => !n.trashed)
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
    // WikiArticle doesn't track linksOut — use 0 for now
    const internalLinkCount = 0

    // Connected notes: unique non-wiki notes that have backlinks TO wiki articles
    const wikiTitles = new Set(
      wikiNotes.flatMap((w) => [
        w.title.toLowerCase(),
        ...w.aliases.map((a) => a.toLowerCase()),
      ])
    )
    const wikiIds = new Set(wikiNotes.map((n) => n.id))
    const connectedNoteIds = new Set<string>()
    for (const note of notes) {
      if (note.trashed || wikiIds.has(note.id)) continue
      for (const link of note.linksOut) {
        if (wikiTitles.has(link.toLowerCase())) {
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

  // Coverage stats: how many non-trashed notes are connected to wiki
  const coverageStats = useMemo(() => {
    const nonTrashedNotes = notes.filter((n) => !n.trashed)
    const total = nonTrashedNotes.length
    if (total === 0) return { connected: 0, total: 0, percent: 0 }

    const wikiTitleSet = new Set(
      wikiArticles.flatMap((w) => [
        w.title.toLowerCase(),
        ...w.aliases.map((a) => a.toLowerCase()),
      ])
    )

    const connectedIds = new Set<string>()

    // Notes that reference wiki articles (via linksOut)
    for (const n of nonTrashedNotes) {
      if (n.linksOut.some((link) => wikiTitleSet.has(link.toLowerCase()))) {
        connectedIds.add(n.id)
      }
    }

    const connected = connectedIds.size
    const percent = Math.round((connected / total) * 100)
    return { connected, total, percent }
  }, [notes, wikiArticles])

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
          { key: "complete", label: "Complete", count: counts.complete, color: WIKI_STATUS_HEX.complete },
          { key: "draft", label: "Draft", count: counts.draft, color: WIKI_STATUS_HEX.draft },
          { key: "stub", label: "Stub", count: counts.stub, color: WIKI_STATUS_HEX.stub },
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
        for (const tagId of n.tags) {
          tagCounts.set(tagId, (tagCounts.get(tagId) ?? 0) + 1)
        }
      }
    }
    return {
      tags: Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([tagId, count]) => ({
          name: tags.find(t => t.id === tagId)?.name ?? tagId,
          count,
        })),
      uncategorized,
    }
  }, [wikiNotes, tags])

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

  // ── WikiArticle View (Assembly Model) ──
  const selectedWikiArticle = selectedWikiArticleId
    ? wikiArticles.find((a) => a.id === selectedWikiArticleId)
    : null

  if (selectedWikiArticleId && selectedWikiArticle) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <ViewHeader
          icon={<BookOpen className="h-5 w-5" strokeWidth={1.5} />}
          title={selectedWikiArticle.title || "Untitled"}
          actions={
            <div className="flex items-center gap-2">
              {isEditingWikiArticle ? (
                <button
                  onClick={() => setIsEditingWikiArticle(false)}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Done
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingWikiArticle(true)}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
                >
                  <PenLine className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Edit
                </button>
              )}
            </div>
          }
        >
          <div className="flex items-center gap-2 border-b border-border px-5 py-1.5">
            <button
              onClick={() => { setSelectedWikiArticleId(null); setIsEditingWikiArticle(false) }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              Back
            </button>
          </div>
        </ViewHeader>

        <WikiArticleView
          articleId={selectedWikiArticleId}
          editable={isEditingWikiArticle}
        />
      </div>
    )
  }

  // ── Article Reader Mode (Legacy Note-based) ──
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
            toggleStates={wikiViewState.toggles}
            onToggleChange={(key, value) =>
              setWikiViewState((prev) => ({
                ...prev,
                toggles: { ...prev.toggles, [key]: value },
              }))
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
          <WikiDashboard
            wikiNotes={wikiNotes}
            wikiArticles={wikiArticles}
            stats={stats}
            articleCount={articleCount}
            coverageStats={coverageStats}
            redLinks={redLinks}
            recentChanges={recentChanges}
            mostConnected={mostConnected}
            staleDocuments={staleDocuments}
            categories={categories}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchFocused={searchFocused}
            setSearchFocused={setSearchFocused}
            searchInputRef={searchInputRef}
            searchResults={searchResults}
            showSearchDropdown={showSearchDropdown}
            onOpenWikiArticle={setSelectedWikiArticleId}
            onCreateFromRedLink={handleCreateFromRedLink}
            onViewAll={() => { setWikiViewMode("list"); setDashFilter("all") }}
            onViewStubs={() => { setWikiViewMode("list"); setDashFilter("stubs") }}
            onCategoryClick={(tagName) => {
              const tag = tags.find(t => t.name === tagName)
              if (tag) {
                setWikiCategoryFilter(tag.id)
                setWikiViewMode("list")
              }
            }}
          />
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
          <WikiList
            filteredWikiNotes={filteredWikiNotes}
            sortedFilteredWikiNotes={sortedFilteredWikiNotes}
            backlinkCounts={backlinkCounts}
            dashFilter={dashFilter}
            setDashFilter={setDashFilter}
            showAllArticles={showAllArticles}
            setShowAllArticles={setShowAllArticles}
            categoryFilterLabel={categoryFilterTagId ? tags.find(t => t.id === categoryFilterTagId)?.name ?? null : null}
            onClearCategoryFilter={() => setWikiCategoryFilter(null)}
            onOpenArticle={openArticle}
            onMergeArticle={(sourceId) => setWikiMergeSourceId(sourceId)}
          />
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

      {/* Wiki Merge Picker Dialog */}
      {wikiMergeSourceId && (
        <Dialog open={!!wikiMergeSourceId} onOpenChange={(open) => !open && setWikiMergeSourceId(null)}>
          <DialogContent className="max-w-sm gap-0 p-0 overflow-hidden">
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle className="flex items-center gap-2 text-ui">
                <Merge className="h-4 w-4" />
                Merge Wiki Article
              </DialogTitle>
              <DialogDescription className="text-note">
                Select target article to merge into
              </DialogDescription>
            </DialogHeader>
            <div className="px-5 py-2 max-h-[300px] overflow-y-auto">
              {wikiArticles
                .filter((a) => a.id !== wikiMergeSourceId)
                .map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      mergeWikiArticles(a.id, wikiMergeSourceId)
                      const sourceTitle = wikiArticles.find((s) => s.id === wikiMergeSourceId)?.title ?? "article"
                      toast.success(`Merged "${sourceTitle}" into "${a.title}"`)
                      setWikiMergeSourceId(null)
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-secondary/40 text-left"
                  >
                    <BookOpen className="h-4 w-4 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-foreground">{a.title || "Untitled"}</p>
                    </div>
                    <span className={cn(
                      "rounded-[4px] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide shrink-0",
                      a.wikiStatus === "complete" ? "bg-wiki-complete/8 text-wiki-complete/70" :
                      a.wikiStatus === "draft" ? "bg-accent/8 text-accent/70" :
                      "bg-chart-3/8 text-chart-3/70"
                    )}>
                      {a.wikiStatus}
                    </span>
                  </button>
                ))}
              {wikiArticles.filter((a) => a.id !== wikiMergeSourceId).length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground/40">No other articles to merge into</p>
              )}
            </div>
            <div className="border-t border-border px-5 py-3 flex justify-end">
              <button
                onClick={() => setWikiMergeSourceId(null)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
