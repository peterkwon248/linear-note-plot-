"use client"

import { useState, useMemo, useRef, useCallback, useEffect, type ReactNode } from "react"
import type { FilterRule, ViewState } from "@/lib/view-engine/types"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { WIKI_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { useRouter } from "next/navigation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { IconWiki, IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft"
import { PencilLine } from "@phosphor-icons/react/dist/ssr/PencilLine"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { ArrowLineUp } from "@phosphor-icons/react/dist/ssr/ArrowLineUp"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { ArrowLineDown } from "@phosphor-icons/react/dist/ssr/ArrowLineDown"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft"
import { Layout } from "@phosphor-icons/react/dist/ssr/Layout"
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
import { useWikiViewMode, setWikiViewMode, setPendingMergeIds, useActiveCategoryId, setActiveCategoryView } from "@/lib/wiki-view-mode"
import { ViewHeader } from "@/components/view-header"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { toast } from "sonner"
import { WikiArticleReader } from "./wiki-article-reader"
import { WikiDashboard } from "./wiki-dashboard"
import { WikiList } from "./wiki-list"
import { WikiFloatingActionBar } from "@/components/wiki-floating-action-bar"
import { WikiArticleView } from "@/components/wiki-editor/wiki-article-view"
import { WikiArticleEncyclopedia } from "@/components/wiki-editor/wiki-article-encyclopedia"
import { useWikiCategoryFilter, setWikiCategoryFilter } from "@/lib/wiki-category-filter"
import { usePendingWikiArticle, consumePendingWikiArticle } from "@/lib/wiki-article-nav"
import { WikiMergePreview } from "@/components/wiki-merge-preview"
import { WikiMergePage } from "./wiki-merge-page"
import { WikiSplitPage } from "./wiki-split-page"
import { WikiCategoryPage } from "./wiki-category-page"

/* ── Toggle Row (mini switch for display panel) ── */
function ToggleRow({ label, icon, checked, onChange }: { label: string; icon?: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md px-1 py-1">
      <div className="flex items-center gap-2 text-sm text-foreground/80">
        {icon && <span className="text-muted-foreground/50">{icon}</span>}
        {label}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-[34px] rounded-full shrink-0 transition-colors duration-200",
          checked ? "bg-accent" : "bg-white/[0.12]"
        )}
      >
        <div className={cn(
          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-all duration-200",
          checked ? "left-[16px]" : "left-0.5"
        )} />
      </button>
    </div>
  )
}

export function WikiView() {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const createWikiStub = usePlotStore((s) => s.createWikiStub)
  const createWikiArticle = usePlotStore((s) => s.createWikiArticle)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const toggleTrash = usePlotStore((s) => s.toggleTrash)
  const mergeWikiArticles = usePlotStore((s) => s.mergeWikiArticles)
  const deleteWikiArticle = usePlotStore((s) => s.deleteWikiArticle)
  const updateWikiArticle = usePlotStore((s) => s.updateWikiArticle)
  const addWikiBlock = usePlotStore((s) => s.addWikiBlock)
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const router = useRouter()
  const backlinkCounts = useBacklinksIndex()

  const wikiViewMode = useWikiViewMode()
  const activeCategoryId = useActiveCategoryId()

  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)

  const [categoryViewMode, setCategoryViewMode] = useState<"tree" | "list">("tree")
  const [categoryOrdering, setCategoryOrdering] = useState<"name" | "articles" | "updated">("name")
  const [categoryGrouping, setCategoryGrouping] = useState<"none" | "tier" | "parent" | "family">("none")
  const [categoryTierFilter, setCategoryTierFilter] = useState<string | null>(null)
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<string | null>(null)
  const [categoryShowDescription, setCategoryShowDescription] = useState(true)
  const [categoryShowEmpty, setCategoryShowEmpty] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Import Note popover state (2-step flow)
  const [importOpen, setImportOpen] = useState(false)
  const [importQuery, setImportQuery] = useState("")
  const [importStep, setImportStep] = useState<"select-note" | "select-target">("select-note")
  const [importSelectedNoteId, setImportSelectedNoteId] = useState<string | null>(null)
  const [importTargetQuery, setImportTargetQuery] = useState("")
  const importInputRef = useRef<HTMLInputElement>(null)
  const importTargetInputRef = useRef<HTMLInputElement>(null)

  // Wiki merge state
  const [wikiMergeSourceId, setWikiMergeSourceId] = useState<string | null>(null)

  // Dashboard filter
  const [dashFilter, setDashFilter] = useState<"all" | "stubs" | "articles" | "redlinks">("all")

  // Category filter from sidebar click
  const categoryFilterTagId = useWikiCategoryFilter()

  // All Articles view state
  const [showAllArticles, setShowAllArticles] = useState(false)

  // Wiki article selection state (for floating action bar)
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<string>>(new Set())
  const lastClickedIndexRef = useRef<number>(-1)

  const clearArticleSelection = useCallback(() => {
    setSelectedArticleIds(new Set())
    lastClickedIndexRef.current = -1
  }, [])

  // Filter / Display state
  const [wikiFilters, setWikiFilters] = useState<FilterRule[]>([])
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
    groupOrder: null,
    subGroupOrder: null,
    subGroupSortBy: "default" as const,
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
    clearArticleSelection()
    // PhCheck if id is a WikiArticle directly
    const directArticle = wikiArticles.find((a) => a.id === id)
    if (directArticle) {
      setSelectedWikiArticleId(id)
      return
    }
    // PhCheck if there's a WikiArticle with matching title for a note
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
  }, [notes, wikiArticles, clearArticleSelection])

  // Smart navigation: wiki articles open in-view, non-wiki go to /notes
  const handleNavigate = useCallback(
    (noteId: string) => {
      const target = notes.find((n) => n.id === noteId)
      if (!target || target.trashed) return
      // PhCheck if there's a matching WikiArticle
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
      const id = createWikiArticle({ title, wikiStatus: "stub", stubSource: "red-link" })
      if (id) setSelectedWikiArticleId(id)
    },
    [createWikiArticle]
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
      if (status === "article") {
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
    if (dashFilter === "stubs") result = result.filter(n => n.wikiStatus === "stub" || (n.wikiStatus as string) === "draft")
    else if (dashFilter === "articles") result = result.filter(n => n.wikiStatus === "article" || (n.wikiStatus as string) === "complete")
    // Apply toggle-based filtering
    if (wikiViewState.toggles.showStubs === false) {
      result = result.filter(n => n.wikiStatus !== "stub")
    }
    // Apply category filter from sidebar
    if (categoryFilterTagId) {
      result = result.filter(n => (n.categoryIds ?? []).includes(categoryFilterTagId))
    }
    return result
  }, [wikiNotes, dashFilter, categoryFilterTagId, wikiViewState.toggles.showStubs])

  // Sorted by updatedAt descending for articles table-list
  const sortedFilteredWikiNotes = useMemo(
    () =>
      [...filteredWikiNotes].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [filteredWikiNotes]
  )

  // Selection handlers (need sortedFilteredWikiNotes)
  const handleArticleSelect = useCallback((id: string, options: { multi?: boolean; shift?: boolean; index?: number }) => {
    const { multi, shift, index } = options
    setSelectedArticleIds(prev => {
      // Shift+Click range selection
      if (shift && lastClickedIndexRef.current >= 0 && index !== undefined && index !== lastClickedIndexRef.current) {
        const lo = Math.min(lastClickedIndexRef.current, index)
        const hi = Math.max(lastClickedIndexRef.current, index)
        const next = new Set(prev)
        for (let i = lo; i <= hi; i++) {
          if (i < sortedFilteredWikiNotes.length) {
            next.add(sortedFilteredWikiNotes[i].id)
          }
        }
        return next
      }
      // Ctrl/Cmd+Click toggle
      const next = new Set(multi ? prev : [])
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    if (options.index !== undefined) {
      lastClickedIndexRef.current = options.index
    }
  }, [sortedFilteredWikiNotes])

  // Clear selection when filter changes
  useEffect(() => {
    setSelectedArticleIds(new Set())
    lastClickedIndexRef.current = -1
  }, [dashFilter])

  // Ctrl+A select all / Escape clear selection keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only when in list view mode (not dashboard, not viewing an article)
      if (wikiViewMode !== "list" || selectedWikiArticleId || selectedArticleId) return

      if (e.key === "Escape") {
        if (selectedArticleIds.size > 0) {
          e.preventDefault()
          clearArticleSelection()
        }
      }
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        // Don't override if focused on an input
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === "INPUT" || tag === "TEXTAREA") return
        e.preventDefault()
        setSelectedArticleIds(new Set(sortedFilteredWikiNotes.map(n => n.id)))
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [wikiViewMode, selectedWikiArticleId, selectedArticleId, selectedArticleIds, sortedFilteredWikiNotes, clearArticleSelection])

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

  // Step 1: select a note → advance to step 2
  const handleImportSelectNote = useCallback((noteId: string) => {
    setImportSelectedNoteId(noteId)
    setImportStep("select-target")
    setImportTargetQuery("")
    setTimeout(() => importTargetInputRef.current?.focus(), 50)
  }, [])

  // Reset import popover state
  const resetImport = useCallback(() => {
    setImportOpen(false)
    setImportQuery("")
    setImportTargetQuery("")
    setImportStep("select-note")
    setImportSelectedNoteId(null)
  }, [])

  // Step 2a: import into existing article/stub
  const handleImportIntoExisting = useCallback((targetArticleId: string) => {
    if (!importSelectedNoteId) return
    addWikiBlock(targetArticleId, { type: "note-ref", noteId: importSelectedNoteId })
    toast.success("Note added to wiki article")
    resetImport()
    setSelectedWikiArticleId(targetArticleId)
  }, [importSelectedNoteId, addWikiBlock, resetImport])

  // Step 2b: import into red link (create new article from red link title)
  const handleImportIntoRedLink = useCallback((title: string) => {
    if (!importSelectedNoteId) return
    const blocks = [
      { id: crypto.randomUUID(), type: "section" as const, title: "Overview", level: 2 },
      { id: crypto.randomUUID(), type: "note-ref" as const, noteId: importSelectedNoteId },
      { id: crypto.randomUUID(), type: "section" as const, title: "See Also", level: 2 },
    ]
    const articleId = createWikiArticle({ title, blocks })
    toast.success(`Wiki article "${title}" created`)
    resetImport()
    if (articleId) setSelectedWikiArticleId(articleId)
  }, [importSelectedNoteId, createWikiArticle, resetImport])

  // Step 2c: create new article
  const handleImportCreateNew = useCallback(() => {
    if (!importSelectedNoteId) return
    const note = notes.find(n => n.id === importSelectedNoteId)
    const title = note?.title || "Untitled"
    const blocks = [
      { id: crypto.randomUUID(), type: "section" as const, title: "Overview", level: 2 },
      { id: crypto.randomUUID(), type: "note-ref" as const, noteId: importSelectedNoteId },
      { id: crypto.randomUUID(), type: "section" as const, title: "See Also", level: 2 },
    ]
    const articleId = createWikiArticle({ title, blocks })
    toast.success(`Wiki article "${title}" created`)
    resetImport()
    if (articleId) setSelectedWikiArticleId(articleId)
  }, [importSelectedNoteId, notes, createWikiArticle, resetImport])

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

  // Filtered targets for import step 2
  const importTargets = useMemo(() => {
    const q = importTargetQuery.toLowerCase().trim()
    const articles = wikiArticles.filter(a => (a.wikiStatus === "article" || (a.wikiStatus as string) === "complete") && (q.length === 0 || a.title.toLowerCase().includes(q)))
    const stubs = wikiArticles.filter(a => (a.wikiStatus === "stub" || (a.wikiStatus as string) === "draft") && (q.length === 0 || a.title.toLowerCase().includes(q)))
    const rl = redLinks.filter(r => q.length === 0 || r.title.toLowerCase().includes(q))
    return { articles, stubs, redLinks: rl }
  }, [wikiArticles, redLinks, importTargetQuery])

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
      articles: wikiNotes.filter(n => n.wikiStatus === "article" || n.wikiStatus === "complete" as string).length,
      redLinks: redLinkCount,
      internalLinks: internalLinkCount,
      connectedNotes: connectedNoteIds.size,
      stubs: wikiNotes.filter(n => n.wikiStatus === "stub" || n.wikiStatus === "draft" as string).length,
    }
  }, [wikiNotes, redLinks, notes])

  // Article count: articles only (excludes stubs)
  const articleCount = useMemo(
    () => wikiNotes.filter((n) => n.wikiStatus === "article" || n.wikiStatus === "complete" as string).length,
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

  // MagnifyingGlass results (simple title/alias filter)
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

  // Card data: categories (from WikiCategory entities via article.categoryIds)
  const categories = useMemo(() => {
    const catCounts = new Map<string, number>()
    let uncategorized = 0
    for (const n of wikiNotes) {
      const catIds = n.categoryIds ?? []
      if (catIds.length === 0) {
        uncategorized++
      } else {
        for (const catId of catIds) {
          catCounts.set(catId, (catCounts.get(catId) ?? 0) + 1)
        }
      }
    }
    return {
      items: Array.from(catCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([catId, count]) => {
          const cat = wikiCategories.find(c => c.id === catId)
          return {
            id: catId,
            name: cat?.name ?? catId,
            parentIds: cat?.parentIds ?? [],
            count,
          }
        }),
      uncategorized,
    }
  }, [wikiNotes, wikiCategories])

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
          icon={<IconWiki size={20} />}
          title={selectedWikiArticle.title || "Untitled"}
          actions={
            <div className="flex items-center gap-2">
              {/* Layout toggle */}
              <button
                onClick={() => {
                  const next = selectedWikiArticle.layout === "encyclopedia" ? "default" : "encyclopedia"
                  updateWikiArticle(selectedWikiArticleId, { layout: next })
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors duration-150",
                  selectedWikiArticle.layout === "encyclopedia"
                    ? "bg-accent/15 text-accent hover:bg-accent/25"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                title={selectedWikiArticle.layout === "encyclopedia" ? "Switch to default layout" : "Switch to encyclopedia layout"}
              >
                <Layout size={14} weight="regular" />
                {selectedWikiArticle.layout === "encyclopedia" ? "Encyclopedia" : "Default"}
              </button>

              {isEditingWikiArticle ? (
                <button
                  onClick={() => setIsEditingWikiArticle(false)}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700"
                >
                  <PhCheck size={14} weight="bold" />
                  Done
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingWikiArticle(true)}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
                >
                  <PencilLine size={14} weight="regular" />
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
              <ArrowLeft size={14} weight="regular" />
              Back
            </button>
          </div>
        </ViewHeader>

        {selectedWikiArticle.layout === "encyclopedia" ? (
          <WikiArticleEncyclopedia
            article={selectedWikiArticle}
            isEditing={isEditingWikiArticle}
            onBack={() => { setSelectedWikiArticleId(null); setIsEditingWikiArticle(false) }}
          />
        ) : (
          <WikiArticleView
            articleId={selectedWikiArticleId}
            editable={isEditingWikiArticle}
            onDelete={() => {
              deleteWikiArticle(selectedWikiArticleId)
              setSelectedWikiArticleId(null)
              setIsEditingWikiArticle(false)
              toast.success("Article deleted")
            }}
          />
        )}
      </div>
    )
  }

  // ── Article Reader Mode (Legacy Note-based) ──
  if (selectedArticleId && selectedNote) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <ViewHeader
          icon={<IconWiki size={20} />}
          title={selectedNote.title || "Untitled"}
          actions={
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
                    aria-label="More actions"
                  >
                    <DotsThree size={16} weight="bold" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1">
                  {selectedNote?.wikiStatus !== "stub" && (
                    <button
                      onClick={() => handleDemote(selectedArticleId)}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors duration-150 hover:bg-secondary"
                    >
                      <ArrowLineDown className="text-muted-foreground" size={14} weight="regular" />
                      Demote to Stub
                    </button>
                  )}
                  <button
                    onClick={() => { toggleTrash(selectedArticleId); setSelectedArticleId(null) }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-destructive transition-colors duration-150 hover:bg-destructive/10"
                  >
                    <Warning size={14} weight="regular" />
                    Move to Trash
                  </button>
                </PopoverContent>
              </Popover>
              {isEditingArticle ? (
                <button
                  onClick={handleDoneEditing}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700"
                >
                  <PhCheck size={14} weight="bold" />
                  Done
                </button>
              ) : (
                <button
                  onClick={handleEditArticle}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
                >
                  <PencilLine size={14} weight="regular" />
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
              <ArrowLeft size={14} weight="regular" />
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
        icon={<IconWiki size={20} />}
        title="Wiki"
        count={stats.articles}
        showFilter
        hasActiveFilters={wikiViewMode === "category" ? (categoryTierFilter !== null || categoryStatusFilter !== null) : wikiFilters.length > 0}
        filterContent={
          wikiViewMode === "category" ? (
            <div className="w-[280px]">
              {/* Search */}
              <div className="border-b border-border/50 px-3 py-2">
                <div className="relative">
                  <svg className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/40" width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="14" y2="14" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="h-7 w-full rounded-md bg-transparent pl-7 pr-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tier */}
              <div className="px-1 py-1">
                <button
                  onClick={() => setCategoryTierFilter(categoryTierFilter === "1st" ? null : "1st")}
                  className={cn(
                    "group/row flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] text-sm transition-colors",
                    categoryTierFilter === "1st" ? "bg-accent/10 text-accent" : "text-foreground/80 hover:bg-secondary/50"
                  )}
                >
                  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><circle cx="8" cy="8" r="5.5"/></svg>
                  <span className="flex-1 text-left">1st tier</span>
                  {categoryTierFilter === "1st" && <span className="text-accent text-xs">Active</span>}
                </button>
                <button
                  onClick={() => setCategoryTierFilter(categoryTierFilter === "2nd" ? null : "2nd")}
                  className={cn(
                    "group/row flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] text-sm transition-colors",
                    categoryTierFilter === "2nd" ? "bg-accent/10 text-accent" : "text-foreground/80 hover:bg-secondary/50"
                  )}
                >
                  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.3"/></svg>
                  <span className="flex-1 text-left">2nd tier</span>
                  {categoryTierFilter === "2nd" && <span className="text-accent text-xs">Active</span>}
                </button>
                <button
                  onClick={() => setCategoryTierFilter(categoryTierFilter === "3rd+" ? null : "3rd+")}
                  className={cn(
                    "group/row flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] text-sm transition-colors",
                    categoryTierFilter === "3rd+" ? "bg-accent/10 text-accent" : "text-foreground/80 hover:bg-secondary/50"
                  )}
                >
                  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.3"/><circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="0.8" opacity="0.3"/></svg>
                  <span className="flex-1 text-left">3rd+ tier</span>
                  {categoryTierFilter === "3rd+" && <span className="text-accent text-xs">Active</span>}
                </button>
              </div>

              <div className="mx-3 h-px bg-border/50" />

              {/* Status */}
              <div className="px-1 py-1">
                <button
                  onClick={() => setCategoryStatusFilter(categoryStatusFilter === "has-articles" ? null : "has-articles")}
                  className={cn(
                    "group/row flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] text-sm transition-colors",
                    categoryStatusFilter === "has-articles" ? "bg-accent/10 text-accent" : "text-foreground/80 hover:bg-secondary/50"
                  )}
                >
                  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 2h12v12H2z" rx="1.5"/><line x1="5" y1="6" x2="11" y2="6"/><line x1="5" y1="9" x2="9" y2="9"/></svg>
                  <span className="flex-1 text-left">Has articles</span>
                  {categoryStatusFilter === "has-articles" && <span className="text-accent text-xs">Active</span>}
                </button>
                <button
                  onClick={() => setCategoryStatusFilter(categoryStatusFilter === "has-stubs" ? null : "has-stubs")}
                  className={cn(
                    "group/row flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] text-sm transition-colors",
                    categoryStatusFilter === "has-stubs" ? "bg-accent/10 text-accent" : "text-foreground/80 hover:bg-secondary/50"
                  )}
                >
                  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 2h12v12H2z" rx="1.5"/><line x1="5" y1="8" x2="11" y2="8"/></svg>
                  <span className="flex-1 text-left">Has stubs</span>
                  {categoryStatusFilter === "has-stubs" && <span className="text-accent text-xs">Active</span>}
                </button>
                <button
                  onClick={() => setCategoryStatusFilter(categoryStatusFilter === "empty" ? null : "empty")}
                  className={cn(
                    "group/row flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] text-sm transition-colors",
                    categoryStatusFilter === "empty" ? "bg-accent/10 text-accent" : "text-foreground/80 hover:bg-secondary/50"
                  )}
                >
                  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 2h12v12H2z" rx="1.5"/></svg>
                  <span className="flex-1 text-left">Empty</span>
                  {categoryStatusFilter === "empty" && <span className="text-accent text-xs">Active</span>}
                </button>
              </div>
            </div>
          ) : (
            <FilterPanel
              categories={WIKI_VIEW_CONFIG.filterCategories}
              activeFilters={wikiFilters}
              onToggle={handleWikiFilterToggle}
            />
          )
        }
        showDisplay
        displayContent={
          wikiViewMode === "category" ? (
            <div className="flex flex-col gap-3 p-3">
              {/* View Mode Tabs */}
              <div className="flex rounded-lg border border-border/80 bg-card p-0.5">
                {(["tree", "list"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCategoryViewMode(mode)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                      categoryViewMode === mode
                        ? "bg-foreground/10 text-foreground shadow-sm"
                        : "text-muted-foreground/60 hover:text-foreground/80",
                    )}
                  >
                    {mode === "tree" ? (
                      <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="9" y="3" width="6" height="3" rx="0.8"/><rect x="9" y="9" width="6" height="3" rx="0.8"/><line x1="6" y1="4.5" x2="9" y2="4.5"/><line x1="6" y1="4.5" x2="6" y2="10.5"/><line x1="6" y1="10.5" x2="9" y2="10.5"/></svg>
                    ) : (
                      <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="2.5" y1="4" x2="13.5" y2="4"/><line x1="2.5" y1="8" x2="13.5" y2="8"/><line x1="2.5" y1="12" x2="13.5" y2="12"/></svg>
                    )}
                    {mode === "tree" ? "Tree" : "List"}
                  </button>
                ))}
              </div>

              {/* Grouping (list mode only) */}
              {categoryViewMode === "list" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Grouping</span>
                  <div className="relative">
                    <select
                      value={categoryGrouping}
                      onChange={(e) => setCategoryGrouping(e.target.value as any)}
                      className="appearance-none rounded-md border border-border/60 bg-card pl-2.5 pr-7 py-1 text-sm font-medium text-foreground cursor-pointer focus:outline-none focus:border-accent/40 hover:bg-secondary/50 transition-colors"
                    >
                      <option value="none">No grouping</option>
                      <option value="tier">Tier</option>
                      <option value="parent">Parent</option>
                      <option value="family">Family</option>
                    </select>
                    <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50" width={10} height={10} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4 6 8 10 12 6"/></svg>
                  </div>
                </div>
              )}

              {/* Ordering (list mode only) */}
              {categoryViewMode === "list" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ordering</span>
                  <div className="relative">
                    <select
                      value={categoryOrdering}
                      onChange={(e) => setCategoryOrdering(e.target.value as any)}
                      className="appearance-none rounded-md border border-border/60 bg-card pl-2.5 pr-7 py-1 text-sm font-medium text-foreground cursor-pointer focus:outline-none focus:border-accent/40 hover:bg-secondary/50 transition-colors"
                    >
                      <option value="name">Name</option>
                      <option value="articles">Articles</option>
                      <option value="updated">Updated</option>
                    </select>
                    <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50" width={10} height={10} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4 6 8 10 12 6"/></svg>
                  </div>
                </div>
              )}

              {/* Divider */}
              {categoryViewMode === "list" && <div className="h-px bg-border/50" />}

              {/* List options (list mode only) */}
              {categoryViewMode === "list" && (
                <>
                  <div className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wide">
                    List options
                  </div>
                  <div className="space-y-1">
                    <ToggleRow
                      label="Show description"
                      icon={<svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="2.5" y1="4" x2="13.5" y2="4"/><line x1="2.5" y1="8" x2="10" y2="8"/><line x1="2.5" y1="12" x2="7" y2="12"/></svg>}
                      checked={categoryShowDescription}
                      onChange={setCategoryShowDescription}
                    />
                    <ToggleRow
                      label="Show empty"
                      icon={<svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 2h12v12H2z" rx="1.5"/></svg>}
                      checked={categoryShowEmpty}
                      onChange={setCategoryShowEmpty}
                    />
                  </div>
                </>
              )}

              {/* Display properties (list mode only) */}
              {categoryViewMode === "list" && (
                <>
                  <div className="h-px bg-border/50" />
                  <div className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wide">
                    Display properties
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: "parent", label: "Parent", icon: <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"><path d="M14 12.5a1 1 0 01-1 1H3a1 1 0 01-1-1V3.5a1 1 0 011-1h3.5l1.5 2H13a1 1 0 011 1z"/></svg> },
                      { key: "tier", label: "Tier", icon: <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="13" x2="3" y2="10"/><line x1="6.5" y1="13" x2="6.5" y2="7"/><line x1="10" y1="13" x2="10" y2="4"/></svg> },
                      { key: "articles", label: "Articles" },
                      { key: "stubs", label: "Stubs" },
                      { key: "sub", label: "Sub" },
                      { key: "updated", label: "Updated", icon: <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="11" rx="1.5"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5.3" y1="1.3" x2="5.3" y2="4.7"/><line x1="10.7" y1="1.3" x2="10.7" y2="4.7"/></svg> },
                    ].map((prop) => (
                      <button
                        key={prop.key}
                        className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                      >
                        {prop.icon}
                        {prop.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
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
          )
        }
        showDetailPanel
        detailPanelOpen={sidePanelOpen}
        onDetailPanelToggle={() => {
          const store = usePlotStore.getState()
          if (!store.sidePanelOpen) {
            store.setSidePanelOpen(true)
            usePlotStore.setState({ sidePanelMode: 'context' })
          } else if (store.sidePanelMode === 'context') {
            store.setSidePanelOpen(false)
          } else {
            usePlotStore.setState({ sidePanelMode: 'context' })
          }
        }}
        actions={
          wikiViewMode === "category" ? undefined : (
            <div className="flex items-center gap-2">
              <Popover open={importOpen} onOpenChange={(o) => {
                if (o) {
                  setImportOpen(true)
                  setImportStep("select-note")
                  setImportSelectedNoteId(null)
                  setImportQuery("")
                  setImportTargetQuery("")
                  setTimeout(() => importInputRef.current?.focus(), 50)
                } else {
                  resetImport()
                }
              }}>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-secondary"
                  >
                    <ArrowLineUp size={14} weight="regular" />
                    Import Note
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  {importStep === "select-note" ? (
                    <>
                      <div className="border-b border-border px-3 py-2">
                        <p className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground">Step 1 — Select a note</p>
                        <div className="relative">
                          <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} weight="regular" />
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
                              onClick={() => handleImportSelectNote(note.id)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors duration-150 hover:bg-secondary"
                            >
                              <FileText className="shrink-0 text-muted-foreground" size={14} weight="regular" />
                              <span className="min-w-0 flex-1 truncate">
                                {note.title || "Untitled"}
                              </span>
                              <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-2xs font-medium text-muted-foreground capitalize">
                                {note.status}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="border-b border-border px-3 py-2">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <button onClick={() => { setImportStep("select-note"); setImportTargetQuery("") }} className="text-muted-foreground hover:text-foreground transition-colors">
                            <CaretLeft size={14} weight="bold" />
                          </button>
                          <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Step 2 — Select target</p>
                        </div>
                        <div className="relative">
                          <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} weight="regular" />
                          <input
                            ref={importTargetInputRef}
                            type="text"
                            value={importTargetQuery}
                            onChange={(e) => setImportTargetQuery(e.target.value)}
                            placeholder="Search articles, stubs, red links..."
                            className="h-8 w-full rounded-md bg-secondary/50 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto py-1">
                        {/* Create new article */}
                        <button
                          onClick={handleImportCreateNew}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-accent transition-colors duration-150 hover:bg-secondary"
                        >
                          <PhPlus className="shrink-0" size={14} weight="bold" />
                          <span className="font-medium">Create new article</span>
                        </button>

                        {/* Articles */}
                        {importTargets.articles.length > 0 && (
                          <>
                            <p className="mt-1 px-3 py-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground">Articles</p>
                            {importTargets.articles.map((a) => (
                              <button
                                key={a.id}
                                onClick={() => handleImportIntoExisting(a.id)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors duration-150 hover:bg-secondary"
                              >
                                <IconWikiArticle size={14} className="shrink-0 text-wiki-complete" />
                                <span className="min-w-0 flex-1 truncate">{a.title}</span>
                              </button>
                            ))}
                          </>
                        )}

                        {/* Stubs */}
                        {importTargets.stubs.length > 0 && (
                          <>
                            <p className="mt-1 px-3 py-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground">Stubs</p>
                            {importTargets.stubs.map((a) => (
                              <button
                                key={a.id}
                                onClick={() => handleImportIntoExisting(a.id)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors duration-150 hover:bg-secondary"
                              >
                                <IconWikiStub size={14} className="shrink-0 text-chart-3" />
                                <span className="min-w-0 flex-1 truncate">{a.title}</span>
                              </button>
                            ))}
                          </>
                        )}

                        {/* Red Links */}
                        {importTargets.redLinks.length > 0 && (
                          <>
                            <p className="mt-1 px-3 py-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground">Red Links</p>
                            {importTargets.redLinks.map((r) => (
                              <button
                                key={r.title}
                                onClick={() => handleImportIntoRedLink(r.title)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors duration-150 hover:bg-secondary"
                              >
                                <Warning size={14} weight="regular" className="shrink-0 text-destructive" />
                                <span className="min-w-0 flex-1 truncate">{r.title}</span>
                                <span className="shrink-0 text-2xs text-muted-foreground">{r.refCount} refs</span>
                              </button>
                            ))}
                          </>
                        )}

                        {importTargets.articles.length === 0 && importTargets.stubs.length === 0 && importTargets.redLinks.length === 0 && importTargetQuery.trim() && (
                          <p className="px-3 py-4 text-center text-xs text-muted-foreground">No matching targets</p>
                        )}
                      </div>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          )
        }
        onCreateNew={wikiViewMode === "category" ? () => createWikiCategory("New Category") : handleCreateWiki}
      />

      {wikiViewMode === "category" ? (
        <WikiCategoryPage
          categoryId={activeCategoryId}
          onOpenArticle={setSelectedWikiArticleId}
          onNavigateCategory={(catId) => setActiveCategoryView(catId)}
          categoryViewMode={categoryViewMode}
          categoryOrdering={categoryOrdering}
          categoryTierFilter={categoryTierFilter}
          categoryStatusFilter={categoryStatusFilter}
          categoryShowDescription={categoryShowDescription}
          categoryShowEmpty={categoryShowEmpty}
          categoryGrouping={categoryGrouping}
        />
      ) : wikiViewMode === "merge" ? (
        <WikiMergePage />
      ) : wikiViewMode === "split" ? (
        <WikiSplitPage />
      ) : wikiViewMode === "dashboard" ? (
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
            onViewRedLinks={() => { setWikiViewMode("list"); setDashFilter("redlinks") }}
            onCategoryClick={(categoryId) => {
              setWikiCategoryFilter(categoryId)
              setWikiViewMode("list")
            }}
          />
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
            categoryFilterLabel={categoryFilterTagId ? wikiCategories.find(c => c.id === categoryFilterTagId)?.name ?? null : null}
            onClearCategoryFilter={() => setWikiCategoryFilter(null)}
            onOpenArticle={openArticle}
            onMergeArticle={(sourceId) => setWikiMergeSourceId(sourceId)}
            onSplitArticle={(id) => {
              setSelectedWikiArticleId(id)
              setIsEditingWikiArticle(true)
            }}
            onDeleteArticle={(id) => {
              deleteWikiArticle(id)
              toast.success("Article deleted")
            }}
            redLinks={redLinks}
            onCreateFromRedLink={handleCreateFromRedLink}
            selectedIds={selectedArticleIds}
            onSelect={(id, opts) => handleArticleSelect(id, opts)}
          />
          {selectedArticleIds.size > 0 && (
            <WikiFloatingActionBar
              selectedIds={selectedArticleIds}
              articles={wikiArticles}
              onClearSelection={clearArticleSelection}
              onMerge={(sourceId) => setWikiMergeSourceId(sourceId)}
              onMultiMerge={(ids) => {
                setPendingMergeIds(ids)
                setWikiViewMode("merge")
                clearArticleSelection()
              }}
              onSplit={(id) => {
                setSelectedWikiArticleId(id)
                setIsEditingWikiArticle(true)
              }}
            />
          )}
        </div>
      )}

      {/* Wiki Merge Preview Dialog */}
      {wikiMergeSourceId && (
        <WikiMergePreview
          sourceId={wikiMergeSourceId}
          articles={wikiArticles}
          onClose={() => setWikiMergeSourceId(null)}
          onComplete={(survivorId) => {
            setWikiMergeSourceId(null)
            setSelectedWikiArticleId(survivorId)
          }}
        />
      )}
    </div>
  )
}
