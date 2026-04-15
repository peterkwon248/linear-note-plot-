"use client"

import { useState, useMemo, useRef, useCallback, useEffect, type ReactNode } from "react"
import type { FilterRule, ViewState, ViewContextKey } from "@/lib/view-engine/types"
import { buildViewStateForContext } from "@/lib/view-engine/defaults"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { WIKI_VIEW_CONFIG, WIKI_CATEGORY_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { useRouter } from "next/navigation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { IconWiki, IconChevronRight } from "@/components/plot-icons"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft"
import { PencilLine } from "@phosphor-icons/react/dist/ssr/PencilLine"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { ArrowLineUp } from "@phosphor-icons/react/dist/ssr/ArrowLineUp"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft"
import { ColumnPresetToggle } from "@/components/wiki-editor/column-preset-toggle"
import { TextAa } from "@phosphor-icons/react/dist/ssr/TextAa"
import { SplitHorizontal } from "@phosphor-icons/react/dist/ssr/SplitHorizontal"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute, getSecondarySpace, setSecondarySpace, getActiveSpace } from "@/lib/table-route"
import { usePane } from "@/components/workspace/pane-context"
import { useWikiViewMode, setWikiViewMode, setPendingMergeIds, useActiveCategoryId, setActiveCategoryView } from "@/lib/wiki-view-mode"
import { ViewHeader } from "@/components/view-header"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { toast } from "sonner"
import { WikiArticleReader } from "./wiki-article-reader"
import { WikiDashboard } from "./wiki-dashboard"
import { WikiList } from "./wiki-list"
import { WikiFloatingActionBar } from "@/components/wiki-floating-action-bar"
import { WikiArticleRenderer } from "@/components/wiki-editor/wiki-article-renderer"
import { useWikiCategoryFilter, setWikiCategoryFilter } from "@/lib/wiki-category-filter"
import { usePendingWikiArticle, consumePendingWikiArticle } from "@/lib/wiki-article-nav"
import { WikiMergePreview } from "@/components/wiki-merge-preview"
import { WikiMergePage } from "./wiki-merge-page"
import { WikiSplitPage } from "./wiki-split-page"
import { WikiCategoryPage } from "./wiki-category-page"
import { WikiTemplatePickerDialog } from "@/components/wiki-template-picker-dialog"
import { isWikiStub } from "@/lib/wiki-utils"

export function WikiView() {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
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
  const pane = usePane()

  const wikiViewMode = useWikiViewMode()
  const activeCategoryId = useActiveCategoryId()

  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)

  // Wiki-category display state from store (unified via viewStateByContext)
  const catViewState = usePlotStore((s) => s.viewStateByContext["wiki-category"]) ?? buildViewStateForContext("wiki-category")
  const setViewState = usePlotStore((s) => s.setViewState)
  const updateCatViewState = useCallback(
    (patch: Partial<ViewState>) => setViewState("wiki-category" as ViewContextKey, patch),
    [setViewState]
  )

  // Derived convenience aliases for passing to children
  const categoryViewMode = (catViewState.viewMode === "board" ? "board" : "list") as "list" | "board"
  const categoryOrdering = catViewState.sortField as "title" | "articles" | "updatedAt" | "parent" | "tier" | "sub"
  const categoryGrouping = catViewState.groupBy as "none" | "tier" | "parent" | "family"
  const categorySortDirection = catViewState.sortDirection
  const categoryShowDescription = catViewState.toggles?.showDescription !== false
  const categoryShowEmpty = catViewState.showEmptyGroups
  const categoryDisplayProps = catViewState.visibleColumns

  // Category-specific filters (tier and status) from viewState.filters
  const [categoryFilters, setCategoryFilters] = useState<FilterRule[]>([])
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
  const [dashFilter, setDashFilter] = useState<"all" | "articles" | "stubs">("all")

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

  // Article reader state (Note-based legacy)
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [isEditingArticle, setIsEditingArticle] = useState(false)

  // WikiArticle viewer state (new Assembly Model)
  const [selectedWikiArticleId, setSelectedWikiArticleId] = useState<string | null>(null)
  const [isEditingWikiArticle, setIsEditingWikiArticle] = useState(false)

  // Collapse/Expand all sections: null = idle, "collapse" | "expand" = command
  const [collapseAllCmd, setCollapseAllCmd] = useState<"collapse" | "expand" | null>(null)
  // Track whether all sections are currently collapsed (reported by child)
  const [allSectionsCollapsed, setAllSectionsCollapsed] = useState(false)

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

  // Sync sidePanelContext when wiki article selection changes + auto-open side panel
  // Only primary pane sets sidePanelContext — secondary uses secondaryEntityContext instead
  // NOTE: Don't clear context when no article selected — let previous context persist
  // so _savedPrimaryContext always has a valid value for split view swapping
  useEffect(() => {
    if (pane === 'secondary') return
    if (selectedWikiArticleId) {
      usePlotStore.getState().setSidePanelContext({ type: "wiki", id: selectedWikiArticleId })
      usePlotStore.getState().setSidePanelOpen(true)
    } else if (selectedArticleId) {
      usePlotStore.getState().setSidePanelContext({ type: "note", id: selectedArticleId })
      usePlotStore.getState().setSidePanelOpen(true)
    }
  }, [pane, selectedWikiArticleId, selectedArticleId])

  // Sync secondary pane entity context so the sidebar can follow wiki article selections
  useEffect(() => {
    if (pane === 'secondary') {
      if (selectedWikiArticleId) {
        usePlotStore.getState().setSecondaryEntityContext({ type: "wiki", id: selectedWikiArticleId })
      } else {
        usePlotStore.getState().setSecondaryEntityContext(null)
      }
    }
  }, [pane, selectedWikiArticleId])

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

  // Phase 1: opens template picker first instead of immediately creating a Blank article
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const handleCreateWiki = useCallback(() => {
    setTemplatePickerOpen(true)
  }, [])
  const handleTemplatePicked = useCallback(
    (templateId: string) => {
      const id = createWikiArticle({ title: "Untitled Wiki", templateId })
      setSelectedWikiArticleId(id)
      setIsEditingWikiArticle(true)
    },
    [createWikiArticle],
  )

  const handleCreateFromRedLink = useCallback(
    (title: string) => {
      const id = createWikiArticle({ title })
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

  // Wiki data comes from wikiArticles (separate entity since v47)
  const wikiNotes = wikiArticles

  // Filter wiki notes
  const filteredWikiNotes = useMemo(() => {
    let result = wikiNotes
    // Apply category filter from sidebar
    if (categoryFilterTagId) {
      result = result.filter(n => (n.categoryIds ?? []).includes(categoryFilterTagId))
    }
    return result
  }, [wikiNotes, categoryFilterTagId])

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

  const handleArticleSelectAll = useCallback((ids: string[]) => {
    setSelectedArticleIds(new Set(ids))
  }, [])

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
    const articles = wikiArticles.filter(a => q.length === 0 || a.title.toLowerCase().includes(q))
    const rl = redLinks.filter(r => q.length === 0 || r.title.toLowerCase().includes(q))
    return { articles, redLinks: rl }
  }, [wikiArticles, redLinks, importTargetQuery])

  // Stats
  const stats = useMemo(() => {
    const articleCount = wikiNotes.length
    // Count unique internal links across all wiki notes + wiki articles
    const linkSet = new Set<string>()
    for (const n of wikiNotes) {
      for (const link of n.linksOut ?? []) linkSet.add(link.toLowerCase())
    }
    for (const a of wikiArticles) {
      if (a.linksOut) {
        for (const link of a.linksOut) linkSet.add(link.toLowerCase())
      }
    }
    const internalLinkCount = linkSet.size

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
      total: wikiNotes.length,
      internalLinks: internalLinkCount,
      connectedNotes: connectedNoteIds.size,
    }
  }, [wikiNotes, wikiArticles, notes])

  // Stub count: wiki articles with minimal content
  const stubCount = useMemo(
    () => wikiArticles.filter(isWikiStub).length,
    [wikiArticles]
  )

  // Article count: total wiki articles minus stubs
  const articleCount = useMemo(
    () => wikiNotes.length - stubCount,
    [wikiNotes, stubCount]
  )


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

  // ── WikiArticle View (Assembly Model) ──
  const selectedWikiArticle = selectedWikiArticleId
    ? wikiArticles.find((a) => a.id === selectedWikiArticleId)
    : null

  // Bug fix (2026-04-14): 사이드바에서 Merge/Split/Categories 클릭 시 wikiViewMode 변경되어도
  // selectedWikiArticleId가 남아있으면 article view가 계속 렌더됨. wikiViewMode가
  // "merge"/"split"/"category"일 때는 해당 전용 페이지(WikiMergePage/WikiSplitPage/category view)가
  // 렌더되도록 article view 조건에서 제외.
  const isDedicatedModePage =
    wikiViewMode === "merge" || wikiViewMode === "split" || wikiViewMode === "category"

  if (selectedWikiArticleId && selectedWikiArticle && !isDedicatedModePage) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <ViewHeader
          icon={<IconWiki size={20} />}
          title={selectedWikiArticle.title || "Untitled"}
          actions={
            <div className="flex items-center gap-2">
              {/* Font size dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-hover-bg hover:text-muted-foreground transition-all duration-100"
                    title="Font size"
                  >
                    <TextAa size={18} weight="regular" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-2.5" sideOffset={4}>
                  <div className="flex items-center gap-1.5">
                    {([
                      { label: "S", value: 0.85 },
                      { label: "M", value: 1 },
                      { label: "L", value: 1.15 },
                      { label: "XL", value: 1.3 },
                    ] as const).map((opt) => {
                      const active = (selectedWikiArticle.fontSize ?? 1) === opt.value
                      return (
                        <button
                          key={opt.label}
                          onClick={() => updateWikiArticle(selectedWikiArticleId, { fontSize: opt.value === 1 ? undefined : opt.value })}
                          className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-100",
                            active
                              ? "bg-accent/20 text-accent"
                              : "text-foreground/60 hover:bg-hover-bg"
                          )}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="my-1.5 border-t border-white/[0.08]" />
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateWikiArticle(selectedWikiArticleId, { contentAlign: undefined })}
                      className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        !selectedWikiArticle.contentAlign || selectedWikiArticle.contentAlign === "left"
                          ? "bg-accent/20 text-accent"
                          : "text-foreground/60 hover:bg-hover-bg"
                      )}
                    >
                      Left
                    </button>
                    <button
                      onClick={() => updateWikiArticle(selectedWikiArticleId, { contentAlign: "center" })}
                      className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        selectedWikiArticle.contentAlign === "center"
                          ? "bg-accent/20 text-accent"
                          : "text-foreground/60 hover:bg-hover-bg"
                      )}
                    >
                      Center
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Collapse/Expand all sections */}
              {selectedWikiArticle.blocks.some((b) => b.type === "section") && (
                <button
                  onClick={(e) => {
                    setCollapseAllCmd(allSectionsCollapsed ? "expand" : "collapse")
                    // Also toggle internal TipTap collapsibles + footer sections.
                    // Scope to current wiki editor container (primary/secondary split independence).
                    const scope = (e.currentTarget as HTMLElement).closest('[data-editor-scope]')
                    const target: EventTarget = scope ?? window
                    target.dispatchEvent(new CustomEvent("plot:set-all-collapsed", {
                      detail: { collapsed: !allSectionsCollapsed },
                      bubbles: true,
                    }))
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-hover-bg hover:text-muted-foreground transition-all duration-100"
                  title={allSectionsCollapsed ? "Expand all sections" : "Collapse all sections"}
                >
                  <svg width={17} height={17} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {allSectionsCollapsed ? (
                      <path d="M4 6l4 4 4-4" />
                    ) : (
                      <path d="M12 10l-4-4-4 4" />
                    )}
                  </svg>
                </button>
              )}

              {/* Phase 2-2-A: 1·2·3 컬럼 프리셋 빠른 전환 */}
              <ColumnPresetToggle articleId={selectedWikiArticleId} />

              {isEditingWikiArticle ? (
                <button
                  onClick={() => setIsEditingWikiArticle(false)}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-note font-medium text-white transition-colors duration-150 hover:bg-emerald-700"
                >
                  <PhCheck size={14} weight="bold" />
                  Done
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingWikiArticle(true)}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-note font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
                >
                  <PencilLine size={14} weight="regular" />
                  Edit
                </button>
              )}

              <span className="mx-0.5 h-4 w-px bg-border" />

              {/* Split View button */}
              <button
                onClick={() => {
                  const s = usePlotStore.getState()
                  if (s.secondaryNoteId || getSecondarySpace()) {
                    s.closeSecondary()
                  } else {
                    setSecondarySpace(getActiveSpace())
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-hover-bg hover:text-muted-foreground transition-all duration-100"
                title="Split View"
              >
                <SplitHorizontal size={16} weight="regular" />
              </button>

              {/* Sidebar toggle button */}
              <button
                onClick={() => usePlotStore.getState().toggleSidePanel()}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-all duration-100",
                  sidePanelOpen
                    ? "text-accent bg-accent/10 hover:bg-accent/20"
                    : "text-muted-foreground/60 hover:bg-hover-bg hover:text-muted-foreground"
                )}
                title="Toggle sidebar"
              >
                <SidebarSimple size={16} weight="regular" />
              </button>
            </div>
          }
        >
          <div className="flex items-center gap-2 border-b border-border px-5 py-1.5">
            <button
              onClick={() => { setSelectedWikiArticleId(null); setIsEditingWikiArticle(false) }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-note text-muted-foreground transition-colors duration-150 hover:bg-hover-bg hover:text-foreground"
            >
              <ArrowLeft size={14} weight="regular" />
              Back
            </button>
            <WikiPickerChevron
              currentArticleId={selectedWikiArticleId}
              onSelect={(id) => { setSelectedWikiArticleId(id); setIsEditingWikiArticle(false) }}
            />
          </div>
        </ViewHeader>

        <WikiArticleRenderer
          articleId={selectedWikiArticleId}
          editable={isEditingWikiArticle}
          variant={(selectedWikiArticle.layout?.columns.length ?? 1) >= 2 ? "encyclopedia" : "default"}
          collapseAllCmd={collapseAllCmd}
          onCollapseAllDone={() => setCollapseAllCmd(null)}
          onAllCollapsedChange={setAllSectionsCollapsed}
          fontSize={selectedWikiArticle.fontSize}
          onDelete={() => {
            deleteWikiArticle(selectedWikiArticleId)
            setSelectedWikiArticleId(null)
            setIsEditingWikiArticle(false)
            toast.success("Article deleted")
          }}
        />
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
                    className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground transition-colors duration-150 hover:bg-hover-bg hover:text-foreground"
                    aria-label="More actions"
                  >
                    <DotsThree size={16} weight="bold" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1">
                  <button
                    onClick={() => { toggleTrash(selectedArticleId); setSelectedArticleId(null) }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-note text-destructive transition-colors duration-150 hover:bg-destructive/10"
                  >
                    <Warning size={14} weight="regular" />
                    Move to Trash
                  </button>
                </PopoverContent>
              </Popover>
              {isEditingArticle ? (
                <button
                  onClick={handleDoneEditing}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-note font-medium text-white transition-colors duration-150 hover:bg-emerald-700"
                >
                  <PhCheck size={14} weight="bold" />
                  Done
                </button>
              ) : (
                <button
                  onClick={handleEditArticle}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-note font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
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
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-note text-muted-foreground transition-colors duration-150 hover:bg-hover-bg hover:text-foreground"
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
    <div data-editor-scope="wiki" className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<IconWiki size={20} />}
        title="Wiki"
        count={stats.total}
        showFilter={wikiViewMode !== "dashboard"}
        hasActiveFilters={wikiViewMode === "category" ? categoryFilters.length > 0 : wikiFilters.length > 0}
        filterContent={
          wikiViewMode === "category" ? (
            <FilterPanel
              categories={WIKI_CATEGORY_VIEW_CONFIG.filterCategories}
              activeFilters={categoryFilters}
              onToggle={(rule) => {
                setCategoryFilters(prev => {
                  const exists = prev.some(f => f.field === rule.field && f.value === rule.value)
                  return exists ? prev.filter(f => !(f.field === rule.field && f.value === rule.value)) : [...prev, rule]
                })
              }}
            />
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
            <DisplayPanel
              config={WIKI_CATEGORY_VIEW_CONFIG.displayConfig}
              viewState={catViewState}
              onViewStateChange={updateCatViewState}
              showViewMode
              toggleStates={catViewState.toggles ?? {}}
              onToggleChange={(key, value) =>
                updateCatViewState({ toggles: { ...(catViewState.toggles ?? {}), [key]: value } })
              }
            />
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
            usePlotStore.setState({ sidePanelMode: 'detail' })
          } else if (store.sidePanelMode === 'detail') {
            store.setSidePanelOpen(false)
          } else {
            usePlotStore.setState({ sidePanelMode: 'detail' })
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
                    className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-note font-medium text-foreground transition-colors duration-150 hover:bg-hover-bg"
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
                            className="h-8 w-full rounded-md bg-secondary/50 pl-8 pr-3 text-note text-foreground placeholder:text-muted-foreground focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto py-1">
                        {importableNotes.length === 0 ? (
                          <p className="px-3 py-4 text-center text-2xs text-muted-foreground">
                            {importQuery.trim() ? "No matching notes" : "No notes to import"}
                          </p>
                        ) : (
                          importableNotes.map((note) => (
                            <button
                              key={note.id}
                              onClick={() => handleImportSelectNote(note.id)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-note text-foreground transition-colors duration-150 hover:bg-hover-bg"
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
                            className="h-8 w-full rounded-md bg-secondary/50 pl-8 pr-3 text-note text-foreground placeholder:text-muted-foreground focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto py-1">
                        {/* Create new article */}
                        <button
                          onClick={handleImportCreateNew}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-note text-accent transition-colors duration-150 hover:bg-hover-bg"
                        >
                          <PhPlus className="shrink-0" size={14} weight="bold" />
                          <span className="font-medium">Create new article</span>
                        </button>

                        {/* Articles */}
                        {importTargets.articles.length > 0 && (
                          <>
                            <p className="mt-1 px-3 py-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground">Wiki Articles</p>
                            {importTargets.articles.map((a) => (
                              <button
                                key={a.id}
                                onClick={() => handleImportIntoExisting(a.id)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-note text-foreground transition-colors duration-150 hover:bg-hover-bg"
                              >
                                <BookOpen size={14} weight="regular" className="shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1 truncate">{a.title}</span>
                              </button>
                            ))}
                          </>
                        )}

                        {/* Unresolved Links */}
                        {importTargets.redLinks.length > 0 && (
                          <>
                            <p className="mt-1 px-3 py-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground">Unresolved Links</p>
                            {importTargets.redLinks.map((r) => (
                              <button
                                key={r.title}
                                onClick={() => handleImportIntoRedLink(r.title)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-note text-foreground transition-colors duration-150 hover:bg-hover-bg"
                              >
                                <Warning size={14} weight="regular" className="shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1 truncate">{r.title}</span>
                                <span className="shrink-0 text-2xs text-muted-foreground">{r.refCount} refs</span>
                              </button>
                            ))}
                          </>
                        )}

                        {importTargets.articles.length === 0 && importTargets.redLinks.length === 0 && importTargetQuery.trim() && (
                          <p className="px-3 py-4 text-center text-2xs text-muted-foreground">No matching targets</p>
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
          categoryTierFilter={categoryFilters.find(f => f.field === "wikiTier")?.value ?? null}
          categoryStatusFilter={null}
          categoryShowDescription={categoryShowDescription}
          categoryShowEmpty={categoryShowEmpty}
          categoryGrouping={categoryGrouping}
          categoryDisplayProps={categoryDisplayProps}
          categorySortDirection={categorySortDirection}
          onOrderingChange={(ordering) => updateCatViewState({ sortField: ordering as any })}
          onSortDirectionChange={(dir) => updateCatViewState({ sortDirection: dir })}
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
            stubCount={stubCount}
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
            onSelectAll={handleArticleSelectAll}
            stubCount={stubCount}
            wikiArticles={wikiArticles}
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

      {/* Phase 1: Template picker for new wiki articles */}
      <WikiTemplatePickerDialog
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onSelect={handleTemplatePicked}
      />
    </div>
  )
}

function WikiPickerChevron({ currentArticleId, onSelect }: { currentArticleId: string; onSelect: (articleId: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return wikiArticles
      .filter((a) => a.id !== currentArticleId && a.title.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 20)
  }, [wikiArticles, query, currentArticleId])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery("") }}>
      <PopoverTrigger asChild>
        <button className="shrink-0 rounded p-0.5 text-muted-foreground/40 hover:text-muted-foreground hover:bg-hover-bg transition-colors">
          <IconChevronRight size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0" sideOffset={4}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search wiki articles..."
          className="w-full px-3.5 py-2.5 text-note bg-transparent border-b border-border text-foreground outline-none placeholder:text-muted-foreground/50"
        />
        <div className="max-h-[360px] overflow-y-auto py-1">
          {filtered.map((a) => {
            const stub = isWikiStub(a)
            return (
              <button
                key={a.id}
                onClick={() => {
                  onSelect(a.id)
                  setOpen(false)
                  setQuery("")
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-foreground/80 hover:bg-hover-bg transition-colors"
              >
                <IconWiki size={16} className="shrink-0 text-muted-foreground" />
                <span className="truncate text-note font-medium flex-1">{a.title || "Untitled"}</span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${stub ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {stub ? 'stub' : 'article'}
                </span>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="px-3.5 py-6 text-note text-muted-foreground/50 text-center">
              No articles found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
