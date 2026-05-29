"use client"

import { useState, useMemo, useRef, useCallback, useEffect, type ReactNode } from "react"
import { useT } from "@/lib/i18n"
import type { FilterRule, ViewState, ViewContextKey } from "@/lib/view-engine/types"
import { buildViewStateForContext } from "@/lib/view-engine/defaults"
import { applyWikiFilters, applyWikiSort, applyWikiGrouping } from "@/lib/view-engine/wiki-list-pipeline"
import type { WikiGroup } from "@/lib/view-engine/wiki-list-pipeline"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { WIKI_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { SPACE_COLORS } from "@/lib/colors"
import { StatusShapeIcon } from "@/components/status-icon"
import { STATUS_CONFIG } from "@/components/note-fields"
import { shortRelative } from "@/lib/format-utils"
import { useRouter } from "next/navigation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { BookOpen } from "lucide-react"
import { IconWiki, IconChevronRight } from "@/components/plot-icons"
import {
  Plus as PhPlus,
  Search as MagnifyingGlass,
  AlertTriangle as Warning,
  ArrowLeft,
} from "lucide-react"
import { WikiReaderSettings } from "@/components/wiki-editor/wiki-reader-settings"
import {
  PenLine as PencilLine,
  Check as PhCheck,
  ArrowUpToLine as ArrowLineUp,
  FileText,
  MoreHorizontal as DotsThree,
  GitMerge,
  ChevronLeft as CaretLeft,
} from "lucide-react"
import { WikiLayoutToggle } from "@/components/wiki-editor/wiki-layout-toggle"
import {
  CaseSensitive as TextAa,
  SplitSquareHorizontal as SplitHorizontal,
  PanelLeft as SidebarSimple,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute, setActiveFolderId, useActiveFolderId, getSecondarySpace, setSecondarySpace, getActiveSpace, useActiveViewId } from "@/lib/table-route"
import { usePane } from "@/components/workspace/pane-context"
import { useWikiViewMode, setWikiViewMode, setPendingMergeIds, useWikiStatusFilter, setWikiStatusFilter } from "@/lib/wiki-view-mode"
import { ViewHeader } from "@/components/view-header"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { toast } from "sonner"
import { WikiArticleReader } from "./wiki-article-reader"
import { WikiDashboard } from "./wiki-dashboard"
import { WikiList, WikiArticleMenuItems } from "./wiki-list"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from "@/components/ui/context-menu"
import { WikiBoard } from "./wiki-board"
import { WikiFloatingActionBar } from "@/components/wiki-floating-action-bar"
import { WikiTemplatePicker } from "@/components/wiki-template-picker"
import { WikiArticleView } from "@/components/wiki-editor/wiki-article-view"
import { WikiArticleEncyclopedia } from "@/components/wiki-editor/wiki-article-encyclopedia"
import { useWikiCategoryFilter, setWikiCategoryFilter } from "@/lib/wiki-category-filter"
import { usePendingWikiArticle, consumePendingWikiArticle } from "@/lib/wiki-article-nav"
import { WikiMergePreview } from "@/components/wiki-merge-preview"
import { WikiMergePage } from "./wiki-merge-page"
import { WikiSplitPage } from "./wiki-split-page"
import { useSaveViewProps } from "@/lib/view-engine/use-save-view-props"
import { useBookContextNav } from "@/hooks/use-book-context-nav"
import { BookContextNav } from "@/components/books/book-context-nav"
import { useListContextNav } from "@/hooks/use-list-context-nav"
import { ListContextNav } from "@/components/list-context-nav"
// 2026-05-24: GalleryView import removed — gallery mode deprecated
import { WikiTimelineView } from "@/components/views/wiki-timeline-view"
import { WikiGridView } from "@/components/views/wiki-grid-view"
import type { WikiArticle, WikiCategory, WikiStatus } from "@/lib/types"

export function WikiView() {
  const t = useT()
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const createWikiArticle = usePlotStore((s) => s.createWikiArticle)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const folders = usePlotStore((s) => s.folders)
  const toggleTrash = usePlotStore((s) => s.toggleTrash)
  const mergeWikiArticles = usePlotStore((s) => s.mergeWikiArticles)
  const trashWikiArticle = usePlotStore((s) => s.trashWikiArticle)
  const updateWikiArticle = usePlotStore((s) => s.updateWikiArticle)
  const incrementWikiArticleReads = usePlotStore((s) => s.incrementWikiArticleReads)
  const addWikiBlock = usePlotStore((s) => s.addWikiBlock)
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)
  const router = useRouter()
  const backlinkCounts = useBacklinksIndex()
  const pane = usePane()

  const wikiViewMode = useWikiViewMode()

  // Plan A++ Phase 1 — Categories own page (/library/categories) renders
  // LibraryCategoriesView instead. wiki-view no longer hosts the category
  // overview UI; sub-category navigation also redirects there.
  const setViewState = usePlotStore((s) => s.setViewState)

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
  // v151: 4-stage status quick-filter (was "all"|"articles"|"stubs").
  // Source of truth lifted to the `wikiStatusFilter` external store so the
  // sidebar status nav links + the in-list status tabs share one value
  // (null = "all"). Local `dashFilter`/`setDashFilter` are thin adapters that
  // map null ↔ "all" at the edge; all call sites below keep working unchanged.
  const wikiStatusFilter = useWikiStatusFilter()
  const dashFilter: "all" | WikiStatus = wikiStatusFilter ?? "all"
  const setDashFilter = useCallback(
    (f: "all" | WikiStatus) => setWikiStatusFilter(f === "all" ? null : f),
    [],
  )

  // Category filter from sidebar click
  const categoryFilterTagId = useWikiCategoryFilter()
  // A+ folder=filter: sidebar wiki folder click sets activeFolderId (table-route,
  // shared with notes/books) → /wiki list scoped to the folder. Mirrors the
  // sidebar category filter below. The /folder/[id] wiki page stays for direct URLs.
  const activeFolderId = useActiveFolderId()

  // Wiki article selection state (for floating action bar)
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<string>>(new Set())
  const lastClickedIndexRef = useRef<number>(-1)

  const clearArticleSelection = useCallback(() => {
    setSelectedArticleIds(new Set())
    lastClickedIndexRef.current = -1
  }, [])

  // Filter / Display state — unified via viewStateByContext["wiki"] for persistence
  // Phase 1 (UI 일관성 audit): wikiFilters 로컬 state + wikiViewState 로컬 useState 제거
  const wikiViewState = usePlotStore((s) => s.viewStateByContext["wiki"]) ?? buildViewStateForContext("wiki")
  const updateWikiViewState = useCallback(
    (patch: Partial<ViewState>) => setViewState("wiki" as ViewContextKey, patch),
    [setViewState]
  )

  // Saved view restoration — when a wiki-scoped saved view becomes active,
  // hydrate its viewState into viewStateByContext["wiki"]
  const activeViewId = useActiveViewId()
  const savedViews = usePlotStore((s) => s.savedViews)
  useEffect(() => {
    if (!activeViewId) return
    const view = savedViews.find((v) => v.id === activeViewId)
    if (view && view.space === "wiki") {
      setViewState("wiki" as ViewContextKey, view.viewState as Parameters<typeof setViewState>[1])
    }
  }, [activeViewId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save view button (snapshot UX) for Wiki list mode
  const { saveViewMode: wikiSaveViewMode, onSaveView: onSaveWikiView } = useSaveViewProps("wiki", "wiki")
  const wikiFilters = wikiViewState.filters
  const handleWikiFilterToggle = useCallback((rule: FilterRule) => {
    const exists = wikiFilters.some(
      (f) => f.field === rule.field && f.value === rule.value
    )
    const next = exists
      ? wikiFilters.filter((f) => !(f.field === rule.field && f.value === rule.value))
      : [...wikiFilters, rule]
    updateWikiViewState({ filters: next })
  }, [wikiFilters, updateWikiViewState])

  // Article reader state (Note-based legacy)
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [isEditingArticle, setIsEditingArticle] = useState(false)

  // WikiArticle viewer state (new Assembly Model)
  const [selectedWikiArticleId, setSelectedWikiArticleId] = useState<string | null>(null)
  const [isEditingWikiArticle, setIsEditingWikiArticle] = useState(false)

  // Phase 4: in-book navigation. Pane-aware — same article can be in two
  // books across two panes. Auto-clears when this article is no longer
  // in the recorded book (mid-session removal etc.).
  const wikiBookNav = useBookContextNav("wiki", selectedWikiArticleId)

  // List peek navigation — frozen snapshot from the wiki list/board/grid the
  // article was opened from. Lower priority than bookContext.
  const wikiListNav = useListContextNav("wiki", selectedWikiArticleId)

  // Phase 4: ⌘[ / ⌘] — in-book navigation (only active when this wiki
  // article is anchored to a book context). Skips chapter-headings.
  useEffect(() => {
    if (!wikiBookNav.active) return
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const target = e.target as HTMLElement | null
      if (target && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest('[contenteditable="true"]')
      )) return
      if (e.key === "[") {
        e.preventDefault()
        wikiBookNav.goPrev()
      } else if (e.key === "]") {
        e.preventDefault()
        wikiBookNav.goNext()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [wikiBookNav.active, wikiBookNav.goPrev, wikiBookNav.goNext])

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

  // List-mode multi-select → side panel mirror.
  // When exactly one row is checkbox-selected in the list, point the side panel's
  // Detail tab at that article. 0 selected = no change (preserve last context).
  // 2+ selected = ambiguous, keep last context rather than flicker.
  useEffect(() => {
    if (pane === 'secondary') return
    if (wikiViewMode !== 'list') return
    if (selectedArticleIds.size !== 1) return
    const onlyId = [...selectedArticleIds][0]
    if (!wikiArticles.some((a) => a.id === onlyId)) return
    usePlotStore.getState().setSidePanelContext({ type: "wiki", id: onlyId })
    usePlotStore.getState().setSidePanelOpen(true)
  }, [pane, wikiViewMode, selectedArticleIds, wikiArticles])

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
      incrementWikiArticleReads(id)
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
        incrementWikiArticleReads(matchingArticle.id)
        setSelectedWikiArticleId(matchingArticle.id)
        return
      }
    }
    setSelectedArticleId(id)
  }, [notes, wikiArticles, clearArticleSelection, incrementWikiArticleReads])

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

  // 2026-05-18: Wiki article 생성 시 WikiTemplatePicker 다이얼로그를 띄움.
  // 사용자 "Empty" 선택 시 빈 article — 기존 behavior 정합. Picker는
  // createWikiArticleFromTemplate 호출 → article 생성 후 onApplied callback에서
  // edit mode 진입.
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const handleCreateWiki = useCallback(() => {
    setTemplatePickerOpen(true)
  }, [])

  const handleTemplateApplied = useCallback((articleId: string) => {
    setSelectedWikiArticleId(articleId)
    setIsEditingWikiArticle(true)
  }, [])

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

  // Wiki data comes from wikiArticles (separate entity since v47).
  // Exclude trashed articles (v90 dedupe migration soft-trashes duplicates).
  const wikiNotes = useMemo(
    () => wikiArticles.filter((a) => !(a as { trashed?: boolean }).trashed),
    [wikiArticles],
  )

  // Set of article IDs that have at least one child article (parentArticleId === id).
  // Used by wiki-list-pipeline for "_leaf" hierarchy filter.
  const hasChildrenSet = useMemo(() => {
    const set = new Set<string>()
    for (const a of wikiArticles) {
      if (a.parentArticleId) set.add(a.parentArticleId)
    }
    return set
  }, [wikiArticles])

  // Filter wiki notes — applies sidebar category filter + viewState.filters.
  // v151: the legacy `showStubs` toggle was removed — status is now a real
  // 4-stage field exposed via the Status filter category (FilterPanel).
  const filteredWikiNotes = useMemo(() => {
    let result = wikiNotes
    // A+ folder filter (sidebar wiki folder → /wiki scoped to folder members).
    if (activeFolderId) {
      result = result.filter(n => n.folderIds.includes(activeFolderId))
    }
    // Sidebar category filter (separate from filterPanel category filter)
    if (categoryFilterTagId) {
      result = result.filter(n => (n.categoryIds ?? []).includes(categoryFilterTagId))
    }
    // FilterPanel rules from viewStateByContext["wiki"].filters (Phase 1)
    if (wikiFilters.length > 0) {
      // Pass `allArticles` so the connectedTo filter can resolve target IDs
      // back to titles (wiki linksOut contains titles, not IDs).
      result = applyWikiFilters(result, wikiFilters, {
        backlinksMap: backlinkCounts,
        hasChildrenSet,
        allArticles: wikiArticles,
      })
    }
    return result
  }, [wikiNotes, activeFolderId, categoryFilterTagId, wikiFilters, backlinkCounts, hasChildrenSet, wikiArticles])

  // Sort filtered articles using wikiViewState.sortFields (Phase 1: dynamic, no hardcoded override)
  const sortedFilteredWikiNotes = useMemo(
    () => applyWikiSort(filteredWikiNotes, wikiViewState.sortFields, backlinkCounts),
    [filteredWikiNotes, wikiViewState.sortFields, backlinkCounts]
  )

  // Grouping for wiki list view (family / tier / parent / linkCount / label / role / none)
  const filterAwareRole = wikiViewState.toggles?.filterAwareRole === true
  // categoryId → name lookup so "label" grouping headers show readable names instead of raw ids
  const categoryNamesMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of wikiCategories) m.set(c.id, c.name)
    return m
  }, [wikiCategories])
  const wikiGroups = useMemo(
    (): WikiGroup[] => applyWikiGrouping(sortedFilteredWikiNotes, wikiViewState.groupBy, {
      backlinksMap: backlinkCounts,
      allWikiArticles: wikiArticles,
      filterAwareRole,
      categoryNames: categoryNamesMap,
    }),
    [sortedFilteredWikiNotes, wikiViewState.groupBy, backlinkCounts, wikiArticles, filterAwareRole, categoryNamesMap]
  )

  // Hydrate WIKI_VIEW_CONFIG.filterCategories with runtime WikiCategory entities.
  // Mirror notes-table pattern (folder/label/tags receive dynamic values).
  // Defensive: dedup wikiCategories by id (legacy data may have duplicate seeds).
  const wikiFilterCategories = useMemo(() => {
    const uniqueCats = Array.from(
      new Map(wikiCategories.map((c) => [c.id, c])).values()
    )
    return WIKI_VIEW_CONFIG.filterCategories.map((cat) => {
      if (cat.key === "category") {
        return {
          ...cat,
          values: [
            { key: "_none", label: "Uncategorized" },
            ...uniqueCats.map((c) => ({
              key: c.id,
              label: c.name,
              count: wikiNotes.filter((n) => (n.categoryIds ?? []).includes(c.id)).length,
            })),
          ],
        }
      }
      return cat
    })
  }, [wikiCategories, wikiNotes])

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
    toast.success(t("wiki.toast.note_added"))
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
    toast.success(t("wiki.toast.article_created").replace("{title}", title))
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
    toast.success(t("wiki.toast.article_created").replace("{title}", title))
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

  // v151: 4-stage status breakdown (manual, unified with Notes). Computed from
  // wikiNotes (trashed-filtered) so trashed articles don't inflate counts.
  const statusCounts = useMemo(() => {
    const counts = { backlog: 0, todo: 0, in_progress: 0, done: 0 }
    for (const a of wikiNotes) counts[a.status]++
    return counts
  }, [wikiNotes])


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

  // Bug fix (2026-04-14): 사이드바에서 Merge/Split 클릭 시 wikiViewMode 변경되어도
  // selectedWikiArticleId가 남아있으면 article view가 계속 렌더됨. wikiViewMode가
  // "merge"/"split"일 때는 해당 전용 페이지(WikiMergePage/WikiSplitPage)가
  // 렌더되도록 article view 조건에서 제외.
  // Plan A++ Phase 1 (2026-05-19) — "category" 분기는 LibraryCategoriesView로
  // 이전 (route = "/library/categories"). wiki-view는 더 이상 category UI를
  // 호스팅하지 않음.
  const isDedicatedModePage =
    wikiViewMode === "merge" || wikiViewMode === "split"

  if (selectedWikiArticleId && selectedWikiArticle && !isDedicatedModePage) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <ViewHeader
          icon={<StatusShapeIcon status={selectedWikiArticle.status} size={20} />}
          title={selectedWikiArticle.title || "Untitled"}
          titleNode={
            <nav className="flex items-center gap-1 min-w-0">
              <button
                onClick={() => setSelectedWikiArticleId(null)}
                className="shrink-0 text-note text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                Wiki
              </button>
              <IconChevronRight size={16} className="shrink-0 text-muted-foreground/70" />
              <StatusShapeIcon status={selectedWikiArticle.status} size={16} />
              <span className="min-w-0 truncate text-note font-medium text-foreground">
                {selectedWikiArticle.title || "Untitled"}
              </span>
            </nav>
          }
          actions={
            <div className="flex items-center gap-2">
              {wikiBookNav.active && (
                <div className="hidden md:flex">
                  <BookContextNav
                    bookId={wikiBookNav.active.bookId}
                    itemIndex={wikiBookNav.active.itemIndex}
                    total={wikiBookNav.active.total}
                    onPrev={wikiBookNav.goPrev}
                    onNext={wikiBookNav.goNext}
                    onJumpTo={wikiBookNav.jumpTo}
                    items={wikiBookNav.items}
                    currentChapter={wikiBookNav.currentChapter}
                  />
                </div>
              )}
              {!wikiBookNav.active && wikiListNav.active && (
                <div className="hidden md:flex">
                  <ListContextNav
                    label={wikiListNav.active.label}
                    index={wikiListNav.active.index}
                    total={wikiListNav.active.total}
                    items={wikiListNav.items}
                    groups={wikiListNav.groups}
                    onJumpTo={wikiListNav.jumpTo}
                    onPrev={wikiListNav.goPrev}
                    onNext={wikiListNav.goNext}
                    onBack={() => { setSelectedWikiArticleId(null); wikiListNav.goBack() }}
                  />
                </div>
              )}
              {/* Font size dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/75 dark:text-muted-foreground/60 hover:bg-hover-bg hover:text-foreground dark:hover:text-muted-foreground transition-all duration-100"
                    title="Font size"
                  >
                    <TextAa size={18} strokeWidth={2} />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0" sideOffset={4}>
                  <WikiReaderSettings
                    fontSize={selectedWikiArticle.fontSize}
                    fontScales={selectedWikiArticle.fontScales}
                    contentAlign={selectedWikiArticle.contentAlign}
                    onFontSizeChange={(v) => updateWikiArticle(selectedWikiArticleId, { fontSize: v })}
                    onFontScalesChange={(v) => updateWikiArticle(selectedWikiArticleId, { fontScales: v })}
                    onContentAlignChange={(v) => updateWikiArticle(selectedWikiArticleId, { contentAlign: v })}
                    onResetLayout={() => {
                      try {
                        const key = `react-resizable-panels:wiki-article-${selectedWikiArticleId}-layout`
                        localStorage.removeItem(key)
                      } catch {}
                      window.dispatchEvent(new CustomEvent("plot:reset-wiki-layout", {
                        detail: { articleId: selectedWikiArticleId },
                      }))
                    }}
                  />
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
                  className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/75 dark:text-muted-foreground/70 hover:bg-hover-bg hover:text-foreground dark:hover:text-muted-foreground transition-all duration-100"
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

              {/* Layout toggle */}
              <WikiLayoutToggle articleId={selectedWikiArticleId} layout={selectedWikiArticle.layout} />

              {isEditingWikiArticle ? (
                <button
                  onClick={() => setIsEditingWikiArticle(false)}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-note font-medium text-white transition-colors duration-150 hover:bg-emerald-700"
                >
                  <PhCheck size={14} strokeWidth={2.5} />
                  Done
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingWikiArticle(true)}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-note font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
                >
                  <PencilLine size={14} strokeWidth={2} />
                  Edit
                </button>
              )}

              {/*
                Split / Sidebar toggle 직접 mount 제거 — ViewHeader default
                toolbar (line 363-369: SidebarSimple + SplitViewButton)와 정확히
                중복되어 wiki article 내부에서 4 토글 cluster가 두 번 표시되는
                버그 fix. List view엔 actions에 추가 안 해서 정상 1세트였음.
                필요한 경우 ViewHeader에 showDetailPanel / detailPanelOpen
                같은 props로 default toolbar에 동작 위임.
              */}
            </div>
          }
          showDetailPanel
          detailPanelOpen={sidePanelOpen}
          onDetailPanelToggle={() => usePlotStore.getState().toggleSidePanel()}
        >
          <div className="flex items-center gap-2 border-b border-border px-5 py-1.5">
            <button
              onClick={() => { setSelectedWikiArticleId(null); setIsEditingWikiArticle(false) }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-note text-muted-foreground transition-colors duration-150 hover:bg-hover-bg hover:text-foreground"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Back
            </button>
            <WikiPickerChevron
              currentArticleId={selectedWikiArticleId}
              onSelect={(id) => { setSelectedWikiArticleId(id); setIsEditingWikiArticle(false) }}
            />
          </div>
        </ViewHeader>

        {selectedWikiArticle.layout === "encyclopedia" ? (
          <WikiArticleEncyclopedia
            article={selectedWikiArticle}
            isEditing={isEditingWikiArticle}
            onBack={() => { setSelectedWikiArticleId(null); setIsEditingWikiArticle(false) }}
            collapseAllCmd={collapseAllCmd}
            onCollapseAllDone={() => setCollapseAllCmd(null)}
            onAllCollapsedChange={setAllSectionsCollapsed}
            fontSize={selectedWikiArticle.fontSize}
          />
        ) : (
          <WikiArticleView
            articleId={selectedWikiArticleId}
            editable={isEditingWikiArticle}
            collapseAllCmd={collapseAllCmd}
            onCollapseAllDone={() => setCollapseAllCmd(null)}
            onAllCollapsedChange={setAllSectionsCollapsed}
            fontSize={selectedWikiArticle.fontSize}
            onDelete={() => {
              trashWikiArticle(selectedWikiArticleId)
              setSelectedWikiArticleId(null)
              setIsEditingWikiArticle(false)
              toast.success(t("wiki.toast.trashed"))
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
          icon={<BookOpen size={20} strokeWidth={2} />}
          title={selectedNote.title || "Untitled"}
          actions={
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground transition-colors duration-150 hover:bg-hover-bg hover:text-foreground"
                    aria-label="More actions"
                  >
                    <DotsThree size={16} strokeWidth={2.5} />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1">
                  <button
                    onClick={() => { toggleTrash(selectedArticleId); setSelectedArticleId(null) }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-note text-destructive transition-colors duration-150 hover:bg-destructive/10"
                  >
                    <Warning size={14} strokeWidth={2} />
                    Move to Trash
                  </button>
                </PopoverContent>
              </Popover>
              {isEditingArticle ? (
                <button
                  onClick={handleDoneEditing}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-note font-medium text-white transition-colors duration-150 hover:bg-emerald-700"
                >
                  <PhCheck size={14} strokeWidth={2.5} />
                  Done
                </button>
              ) : (
                <button
                  onClick={handleEditArticle}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-note font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
                >
                  <PencilLine size={14} strokeWidth={2} />
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
              <ArrowLeft size={14} strokeWidth={2} />
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
        icon={<BookOpen size={20} strokeWidth={2} />}
        title={t("wiki.title")}
        count={stats.total}
        saveViewMode={wikiViewMode === "dashboard" ? "hidden" : wikiSaveViewMode}
        onSaveView={onSaveWikiView}
        showFilter={wikiViewMode !== "dashboard"}
        hasActiveFilters={wikiFilters.length > 0}
        filterContent={(
          <FilterPanel
            categories={wikiFilterCategories}
            activeFilters={wikiFilters}
            onToggle={handleWikiFilterToggle}
            quickFilters={WIKI_VIEW_CONFIG.quickFilters as any}
            onQuickFilter={(rules) => updateWikiViewState({ filters: rules })}
          />
        )}
        quickFilters={wikiViewMode !== "dashboard" ? (WIKI_VIEW_CONFIG.quickFilters as any) : undefined}
        activeFilters={wikiFilters as any}
        onFiltersChange={(filters) => updateWikiViewState({ filters: filters as any })}
        viewContext="wiki"
        filterCategories={wikiFilterCategories}
        showDisplay={wikiViewMode !== "dashboard"}
        displayContent={(
          <DisplayPanel
            config={WIKI_VIEW_CONFIG.displayConfig}
            viewState={wikiViewState}
            onViewStateChange={updateWikiViewState}
            showViewMode
            toggleStates={wikiViewState.toggles ?? {}}
            onToggleChange={(key, value) =>
              updateWikiViewState({ toggles: { ...(wikiViewState.toggles ?? {}), [key]: value } })
            }
          />
        )}
        showDetailPanel={wikiViewMode !== "dashboard"}
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
        actions={(
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
                    <ArrowLineUp size={14} strokeWidth={2} />
                    Import Note
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  {importStep === "select-note" ? (
                    <>
                      <div className="border-b border-border px-3 py-2">
                        <p className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground">Step 1 — Select a note</p>
                        <div className="relative">
                          <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} strokeWidth={2} />
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
                              <FileText className="shrink-0 text-muted-foreground" size={14} strokeWidth={2} />
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
                            <CaretLeft size={14} strokeWidth={2.5} />
                          </button>
                          <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Step 2 — Select target</p>
                        </div>
                        <div className="relative">
                          <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} strokeWidth={2} />
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
                          <PhPlus className="shrink-0" size={14} strokeWidth={2.5} />
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
                                <BookOpen size={14} strokeWidth={2} className="shrink-0 text-muted-foreground" />
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
                                <Warning size={14} strokeWidth={2} className="shrink-0 text-muted-foreground" />
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
        )}
        onCreateNew={handleCreateWiki}
      />

      {wikiViewMode === "merge" ? (
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
            wikiArticles={wikiNotes}
            notes={notes}
            stats={stats}
            statusCounts={statusCounts}
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
            onViewStatus={(status) => { setWikiViewMode("list"); setDashFilter(status) }}
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
          {wikiViewState.viewMode === "timeline" ? (
            <WikiTimelineView
              articles={sortedFilteredWikiNotes}
              viewState={wikiViewState}
              wikiGroups={wikiGroups}
              selectedIds={selectedArticleIds}
              activeArticleId={selectedWikiArticleId}
              onOpenArticle={openArticle}
              onSelect={(id, opts) => handleArticleSelect(id, opts)}
              onUpdateViewState={updateWikiViewState}
            />
          ) : wikiViewState.viewMode === "grid" ? (
            /* User signal 2026-05-24: "북스의 그리드 디스플레이처럼".
               Grid mode previously fell through to WikiList — this branch
               replaces it with the Books-parity card grid. */
            <WikiGridView
              articles={sortedFilteredWikiNotes}
              onOpen={openArticle}
              activeArticleId={selectedWikiArticleId}
            />
          ) : wikiViewState.viewMode === "board" ? (
            <WikiBoard
              groups={wikiGroups}
              groupBy={wikiViewState.groupBy}
              viewState={wikiViewState}
              visibleColumns={wikiViewState.visibleColumns}
              wikiCategories={wikiCategories}
              backlinkCounts={backlinkCounts}
              selectedIds={selectedArticleIds}
              activeArticleId={selectedWikiArticleId}
              onOpenArticle={openArticle}
              onSelect={(id, opts) => handleArticleSelect(id, {
                // Board mode parity with Notes (영구 룰 21): single click on a
                // board card always accumulates toggle (modifier-free), so
                // multi-select doesn't require Cmd/Ctrl. List mode still
                // honors modifier semantics (single click = replace).
                ...opts,
                multi: true,
              })}
              onUpdateViewState={updateWikiViewState}
              onClearSelection={() => setSelectedArticleIds(new Set())}
              onSelectAll={() => setSelectedArticleIds(new Set(sortedFilteredWikiNotes.map(n => n.id)))}
              onMerge={(sourceId) => setWikiMergeSourceId(sourceId)}
              onMultiMerge={(mergeIds) => {
                setPendingMergeIds(mergeIds)
                setWikiViewMode("merge")
                clearArticleSelection()
              }}
              onSplit={(id) => {
                setSelectedWikiArticleId(id)
                setIsEditingWikiArticle(true)
              }}
              onDeleteArticle={(id) => {
                trashWikiArticle(id)
                toast.success(t("wiki.toast.trashed"))
              }}
              onShowConnectedArticle={(id, direction) => {
                const existingFilters = wikiViewState.filters ?? []
                const otherRules = existingFilters.filter((r) => r.field !== "connectedTo")
                updateWikiViewState({
                  filters: [
                    ...otherRules,
                    { field: "connectedTo", operator: "eq", value: `${id}:${direction}` },
                  ],
                })
              }}
            />
          ) : (
            <WikiList
              filteredWikiNotes={filteredWikiNotes}
              sortedFilteredWikiNotes={sortedFilteredWikiNotes}
              backlinkCounts={backlinkCounts}
              dashFilter={dashFilter}
              setDashFilter={setDashFilter}
              categoryFilterLabel={categoryFilterTagId ? wikiCategories.find(c => c.id === categoryFilterTagId)?.name ?? null : null}
              onClearCategoryFilter={() => setWikiCategoryFilter(null)}
              folderFilterLabel={activeFolderId ? folders.find(f => f.id === activeFolderId)?.name ?? null : null}
              onClearFolderFilter={() => setActiveFolderId(null)}
              onOpenArticle={openArticle}
              onMergeArticle={(sourceId) => setWikiMergeSourceId(sourceId)}
              onSplitArticle={(id) => {
                setSelectedWikiArticleId(id)
                setIsEditingWikiArticle(true)
              }}
              onDeleteArticle={(id) => {
                trashWikiArticle(id)
                toast.success(t("wiki.toast.trashed"))
              }}
              onShowConnectedArticle={(id, direction) => {
                // Same in-place backlink-filter pattern as Notes view.
                // Replace any prior connectedTo rule (single connection
                // filter at a time keeps results predictable).
                const existingFilters = wikiViewState.filters ?? []
                const otherRules = existingFilters.filter((r) => r.field !== "connectedTo")
                updateWikiViewState({
                  filters: [
                    ...otherRules,
                    { field: "connectedTo", operator: "eq", value: `${id}:${direction}` },
                  ],
                })
                const article = wikiArticles.find((a) => a.id === id)
                const dirLabel =
                  direction === "in" ? t("notes.connection.backlinks") :
                  direction === "out" ? t("notes.connection.links_out") :
                  t("notes.connection.both_directions")
                toast(
                  t("notes.toast.filtering_connected")
                    .replace("{title}", article?.title ?? t("common.untitled"))
                    .replace("{dir}", dirLabel),
                )
              }}
              redLinks={redLinks}
              onCreateFromRedLink={handleCreateFromRedLink}
              selectedIds={selectedArticleIds}
              onSelect={(id, opts) => handleArticleSelect(id, opts)}
              onSelectAll={handleArticleSelectAll}
              statusCounts={statusCounts}
              wikiArticles={wikiArticles}
              visibleColumns={wikiViewState.visibleColumns}
              wikiCategories={wikiCategories}
              wikiGroups={wikiGroups}
              groupBy={wikiViewState.groupBy}
            />
          )}
          {/* Notes parity (영구 룰 21): board view 는 우측 WikiBoardWorkbench가
              하단 floating bar를 대체. list view 에서만 floating bar 표시 — 둘
              동시 표시 시 같은 batch action UI가 중복 노출됨. */}
          {selectedArticleIds.size > 0 && wikiViewState.viewMode !== "board" && (
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

      {/* Wiki Template Picker (생성 진입점) */}
      <WikiTemplatePicker
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onApplied={handleTemplateApplied}
      />
    </div>
  )
}

function WikiPickerChevron({ currentArticleId, onSelect }: { currentArticleId: string; onSelect: (articleId: string) => void }) {
  const t = useT()
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
        <button className="shrink-0 rounded p-0.5 text-muted-foreground/70 hover:text-muted-foreground hover:bg-hover-bg transition-colors">
          <IconChevronRight size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0" sideOffset={4}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search wiki articles..."
          className="w-full px-3.5 py-2.5 text-note bg-transparent border-b border-border text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <div className="max-h-[360px] overflow-y-auto py-1">
          {filtered.map((a) => {
            const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.backlog
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
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                  <StatusShapeIcon status={a.status} size={12} />
                  {t(cfg.labelKey)}
                </span>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="px-3.5 py-6 text-note text-muted-foreground/70 text-center">
              No articles found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// 2026-05-24: buildWikiGalleryGroups + articleToGalleryItem removed —
// gallery mode deprecated app-wide. Grid view replaces it via the existing
// grid renderer in wiki-list.
