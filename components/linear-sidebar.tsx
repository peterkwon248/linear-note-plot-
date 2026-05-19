"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  IconStone,
  IconInbox,
  IconNotes,
  IconCalendar,
  IconOntology,
  IconFolder,
  IconTag,
  IconLabel,
  IconTemplate,
  IconInsight,
  IconBrick,
  IconBlock,
  IconWikiStub,
  IconWikiArticle,
  IconPin,
  IconTrash,
  IconClock,
  IconPlus,
  IconDoc,
  IconGear,
} from "@/components/plot-icons"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { usePlotStore } from "@/lib/store"
import { PRESET_COLORS, getEntityColor, WIKI_STATUS_HEX } from "@/lib/colors" // v109: opt-in color fallback
import { isWikiStub } from "@/lib/wiki-utils"
import { setWikiViewMode, useWikiViewMode, setCategoryOverview } from "@/lib/wiki-view-mode"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight"
import { Folders } from "@phosphor-icons/react/dist/ssr/Folders"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
import { ChartBar } from "@phosphor-icons/react/dist/ssr/ChartBar"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { ChartPie } from "@phosphor-icons/react/dist/ssr/ChartPie"
import { CheckSquare as CheckSquareIcon } from "@phosphor-icons/react/dist/ssr/CheckSquare"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Quotes } from "@phosphor-icons/react/dist/ssr/Quotes"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Paperclip } from "@phosphor-icons/react/dist/ssr/Paperclip"
import { Sticker as StickerPhosphor } from "@phosphor-icons/react/dist/ssr/Sticker"
import { setWikiCategoryFilter } from "@/lib/wiki-category-filter"
import { getCurrentViewContextKey, getSavedViewSpaceForActivity } from "@/lib/view-engine/saved-view-context"
import type { ViewContextKey } from "@/lib/view-engine/types"
import { ALL_SIDEBAR_ROUTES, setActiveRoute, getActiveRoute, setActiveFolderId, setActiveTagId, setActiveLabelId, useActiveRoute, useActiveFolderId, useActiveTagId, useActiveLabelId, useActiveSpace, setActiveViewId, useActiveViewId, routeGoBack, routeGoForward } from "@/lib/table-route"
import type { Note, NoteStatus, ActivitySpace } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useKnowledgeMetrics } from "@/hooks/use-knowledge-metrics"
import { useInbox } from "@/lib/hooks/use-inbox"
type PanelContent = Record<string, unknown>
import { setViewDragData, setNoteDragData } from "@/lib/drag-helpers"
import { StatusShapeIcon } from "@/components/status-icon"
import { ColorPickerGrid } from "@/components/color-picker-grid"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"

/* ── Nav primitives ──────────────────────────────────── */

function NavLink({
  href,
  icon,
  label,
  count,
  badge,
  active,
  dragContent,
  onClickOverride,
}: {
  href: string
  icon: React.ReactNode
  label: string
  count?: number
  badge?: { count: number; color: string }
  active?: boolean
  dragContent?: PanelContent
  /** When provided, bypass the default route-push behavior. Used by
   *  Ontology mode tabs (Graph/Insights/Dashboard) which all live at
   *  /ontology and switch via custom event instead of URL change. */
  onClickOverride?: () => void
}) {
  const router = useRouter()
  const setNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const isSidebarRoute = ALL_SIDEBAR_ROUTES.includes(href)

  // v3 Phase 3.3: `.a-sb-link` (data-active driven). Plot wrapper span 보존
  // (icon size + alignment 안정) — v3 css `.a-sb-link svg`가 descendant
  // selector라 wrapper 안에서도 작동.
  const className = "a-sb-link"
  const dataActive = active ? "true" : undefined

  const content = (
    <>
      <span className="flex shrink-0 items-center justify-center w-5 h-5">
        {icon}
      </span>
      <span className="truncate text-left flex-1">{label}</span>
      {count !== undefined && (
        <span className="a-sb-link__count tabular-nums">
          {count}
        </span>
      )}
      {badge && badge.count > 0 && (
        <span
          className="rounded-full px-1.5 py-0.5 text-2xs font-medium tabular-nums"
          style={{
            backgroundColor: `color-mix(in srgb, ${badge.color} 15%, transparent)`,
            color: badge.color,
          }}
        >
          {badge.count}
        </span>
      )}
    </>
  )

  const dragProps = dragContent ? {
    draggable: true,
    onDragStart: (e: React.DragEvent) => setViewDragData(e, dragContent as unknown as Record<string, unknown>),
  } : {}

  if (isSidebarRoute) {
    return (
      <button
        onClick={() => {
          if (onClickOverride) {
            onClickOverride()
            return
          }
          setNoteId(null)
          if (href === "/notes" || href === "/stone") {
            setActiveFolderId(null)
            setActiveTagId(null)
            setActiveLabelId(null)
          }
          if (href === "/wiki") {
            setWikiViewMode("dashboard")
          }
          const currentRoute = getActiveRoute()
          setActiveRoute(href)
          if (currentRoute !== href) router.push(href)
        }}
        className={className}
        data-active={dataActive}
        {...dragProps}
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      href={href}
      onClick={() => setActiveRoute(null)}
      className={className}
      data-active={dataActive}
      {...dragProps}
    >
      {content}
    </Link>
  )
}

// NodeTypeToggleSection removed in Phase 7 — node type filtering now lives
// in the Display popover (driven by GRAPH_VIEW_CONFIG.displayConfig.toggles).

function Section({
  title,
  children,
  trailing,
  count,
  defaultOpen = true,
  onHeaderClick,
  active = false,
}: {
  title: string
  children: React.ReactNode
  trailing?: React.ReactNode
  count?: number
  defaultOpen?: boolean
  onHeaderClick?: () => void
  active?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="a-sb-section">
      <div className="a-sb-section__head group">
        <button
          onClick={() => setOpen(!open)}
          className={`flex flex-1 items-center gap-1.5 transition-colors ${
            active ? "text-sidebar-active-text" : "hover:text-sidebar-foreground"
          }`}
        >
          <span>{title}</span>
          {count !== undefined && (
            <span className="a-sb-section__hint">{count}</span>
          )}
          {open ? (
            <CaretDown size={14} weight="regular" />
          ) : (
            <CaretRight size={14} weight="regular" />
          )}
        </button>
        {onHeaderClick && (
          <button
            onClick={onHeaderClick}
            className={`rounded p-0.5 transition-all duration-150 ${
              active
                ? "opacity-100 text-sidebar-active-text"
                : "opacity-0 group-hover:opacity-100 text-sidebar-muted hover:text-sidebar-foreground"
            }`}
            title={`View all ${title.toLowerCase()}`}
          >
            <ArrowRight size={12} />
          </button>
        )}
        {trailing}
      </div>
      {open && <div className="mt-1 space-y-px">{children}</div>}
    </div>
  )
}

/* ── Sidebar ─────────────────────────────────────────── */

export function LinearSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const openNote = usePlotStore((s) => s.openNote)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const folders = usePlotStore((s) => s.folders)
  const createFolder = usePlotStore((s) => s.createFolder)
  const accessFolder = usePlotStore((s) => s.accessFolder)
  const updateFolder = usePlotStore((s) => s.updateFolder)
  const deleteFolder = usePlotStore((s) => s.deleteFolder)

  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const navigationHistory = usePlotStore((s) => s.navigationHistory)
  const navigationIndex = usePlotStore((s) => s.navigationIndex)

  const savedViews = usePlotStore((s) => s.savedViews)
  const createSavedView = usePlotStore((s) => s.createSavedView)
  const updateSavedView = usePlotStore((s) => s.updateSavedView)
  const deleteSavedView = usePlotStore((s) => s.deleteSavedView)
  const activeViewId = useActiveViewId()

  const setSidebarCollapsed = usePlotStore((s) => s.setSidebarCollapsed)
  const setSearchOpen = usePlotStore((s) => s.setSearchOpen)

  const handleGoBack = () => {
    // Close editor first if open, then navigate route history
    const s = usePlotStore.getState()
    if (s.selectedNoteId) {
      s.setSelectedNoteId(null)
    }
    routeGoBack()
  }
  const handleGoForward = () => {
    const s = usePlotStore.getState()
    if (s.selectedNoteId) {
      s.setSelectedNoteId(null)
    }
    routeGoForward()
  }

  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const stickers = usePlotStore((s) => s.stickers)
  const templates = usePlotStore((s) => s.templates)
  const wikiTemplates = usePlotStore((s) => Array.isArray(s.wikiTemplates) ? s.wikiTemplates : [])
  const books = usePlotStore((s) => s.books)

  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const createWikiCategory = usePlotStore((s) => s.createWikiCategory)
  const updateWikiCategory = usePlotStore((s) => s.updateWikiCategory)
  const deleteWikiCategory = usePlotStore((s) => s.deleteWikiCategory)

  const activeSpace = useActiveSpace()
  const wikiViewMode = useWikiViewMode()

  // Shared knowledge metrics — same hook drives the Ontology > Insights tab,
  // so the Health numbers stay 1:1 with the panel.
  const knowledgeMetrics = useKnowledgeMetrics()

  const [recentlyViewedOpen, setRecentlyViewedOpen] = useState(false)
  const recentlyViewedRef = useRef<HTMLDivElement>(null)

  // Close recently viewed on outside click
  useEffect(() => {
    if (!recentlyViewedOpen) return
    const handler = (e: MouseEvent) => {
      if (recentlyViewedRef.current && !recentlyViewedRef.current.contains(e.target as Node)) {
        setRecentlyViewedOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [recentlyViewedOpen])

  // Recently viewed: walk backwards, dedup, take 10
  const recentlyViewed = useMemo(() => {
    const seen = new Set<string>()
    const result: { id: string; title: string }[] = []
    for (let i = navigationIndex; i >= 0 && result.length < 10; i--) {
      const noteId = navigationHistory[i]
      if (!seen.has(noteId)) {
        seen.add(noteId)
        const note = notes.find((n) => n.id === noteId && !n.trashed)
        if (note) result.push({ id: note.id, title: note.title || "Untitled" })
      }
    }
    return result
  }, [navigationHistory, navigationIndex, notes])

  // Prefetch routes on mount
  useEffect(() => {
    const routes = ["/stone", "/notes", "/pinned", "/trash", "/settings"]
    routes.forEach((r) => router.prefetch(r))
  }, [router])

  // Folder creation state. PR (b): captures the kind so submit creates with
  // the right discriminator. `null` = closed, otherwise the section that
  // opened the input ("note" / "wiki").
  const [newFolderKind, setNewFolderKind] = useState<"note" | "wiki" | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const newFolderInputRef = useRef<HTMLInputElement>(null)
  const newFolderOpen = newFolderKind !== null

  // Folder collapse state
  const [showAllFolders, setShowAllFolders] = useState(false)

  // View creation state
  const [newViewOpen, setNewViewOpen] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const newViewInputRef = useRef<HTMLInputElement>(null)

  // Rename state (folders only)
  const [renamingItem, setRenamingItem] = useState<{ id: string } | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Wiki category state
  const [newCategoryInput, setNewCategoryInput] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [categoryMenuId, setCategoryMenuId] = useState<string | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState("")
  const categoryMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Focus the input each time a section's "+" toggles it on. Tracks
    // newFolderKind directly (boolean derivation triggers identically).
    if (newFolderKind !== null) {
      setTimeout(() => newFolderInputRef.current?.focus(), 0)
    }
  }, [newFolderKind])

  useEffect(() => {
    if (newViewOpen) {
      setTimeout(() => newViewInputRef.current?.focus(), 0)
    }
  }, [newViewOpen])

  useEffect(() => {
    if (renamingItem) setTimeout(() => renameInputRef.current?.focus(), 0)
  }, [renamingItem])

  useEffect(() => {
    if (!categoryMenuId) return
    const handler = (e: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setCategoryMenuId(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [categoryMenuId])

  const inboxCount = useMemo(() => notes.filter((n) => n.status === "stone" && !n.trashed && n.triageStatus !== "trashed").length, [notes])
  const inboxItems = useInbox()
  const inboxItemsCount = inboxItems.length
  const allNotesCount = useMemo(() => notes.filter((n) => !n.trashed).length, [notes])
  const captureCount = useMemo(() => notes.filter((n) => n.status === "brick" && !n.trashed).length, [notes])
  const permanentCount = useMemo(() => notes.filter((n) => n.status === "keystone" && !n.trashed).length, [notes])
  const trashCount = useMemo(() => notes.filter((n) => n.trashed).length, [notes])
  const wikiCount = useMemo(() => notes.filter((n) => n.noteType === "wiki" && !n.trashed).length, [notes])
  const todoTaskCount = usePlotStore((s) => s.todoTasks.filter((t) => !t.checked).length)
  const references = usePlotStore((s) => s.references)
  const attachments = usePlotStore((s) => s.attachments)

  // PR (b): kind-strict per-context folder lists. Notes context shows
  // `kind="note"` folders only; Wiki context shows `kind="wiki"` only.
  // Sorting + auto-collapse rules unchanged — applied per-kind.
  const sortFolders = (list: typeof folders) => {
    const pinned = list
      .filter((f) => f.pinned)
      .sort((a, b) => a.pinnedOrder - b.pinnedOrder)
    const unpinned = list
      .filter((f) => !f.pinned)
      .sort((a, b) => {
        if (a.lastAccessedAt === null && b.lastAccessedAt === null) return 0
        if (a.lastAccessedAt === null) return 1
        if (b.lastAccessedAt === null) return -1
        return b.lastAccessedAt.localeCompare(a.lastAccessedAt)
      })
    return [...pinned, ...unpinned]
  }

  const noteFoldersSorted = useMemo(
    () => sortFolders(folders.filter((f) => f.kind === "note")),
    [folders],
  )
  const wikiFoldersSorted = useMemo(
    () => sortFolders(folders.filter((f) => f.kind === "wiki")),
    [folders],
  )

  // Auto-collapse: visible = pinned OR accessed within 30 days OR (never
  // accessed AND created within 30 days). Same predicate as before, now
  // computed per-kind so each section's "+N more" reflects its own pool.
  const collapseSplit = (sorted: typeof folders) => {
    const now = Date.now()
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    const visible: typeof folders = []
    const hidden: typeof folders = []
    for (const f of sorted) {
      if (f.pinned) {
        visible.push(f)
      } else if (f.lastAccessedAt !== null) {
        const age = now - new Date(f.lastAccessedAt).getTime()
        if (age <= thirtyDays) visible.push(f)
        else hidden.push(f)
      } else {
        const age = now - new Date(f.createdAt).getTime()
        if (age <= thirtyDays) visible.push(f)
        else hidden.push(f)
      }
    }
    return { visible, hidden }
  }

  const noteFolderSplit = useMemo(() => collapseSplit(noteFoldersSorted), [noteFoldersSorted])
  const wikiFolderSplit = useMemo(() => collapseSplit(wikiFoldersSorted), [wikiFoldersSorted])

  const displayedNoteFolders = showAllFolders ? noteFoldersSorted : noteFolderSplit.visible
  const displayedWikiFolders = showAllFolders ? wikiFoldersSorted : wikiFolderSplit.visible
  const hiddenNoteFolders = noteFolderSplit.hidden
  const hiddenWikiFolders = wikiFolderSplit.hidden

  // Pinned notes for sidebar shortcut section
  const pinnedNotes = useMemo(() =>
    notes.filter((n) => n.pinned && !n.trashed),
    [notes]
  )

  // Pinned wiki articles for home sidebar (WikiArticle has no trashed field)
  const pinnedWikiArticles = useMemo(() =>
    wikiArticles.filter((w) => w.pinned),
    [wikiArticles],
  )

  // Combined pinned items (note + wiki + book) for the Home block only
  type HomePinnedItem =
    | { kind: "note"; id: string; title: string; status: NoteStatus }
    | { kind: "wiki"; id: string; title: string; isStub: boolean }
    | { kind: "book"; id: string; title: string; itemCount: number }

  const homePinnedItems = useMemo<HomePinnedItem[]>(() => {
    const noteItems: HomePinnedItem[] = pinnedNotes.map((n) => ({
      kind: "note" as const,
      id: n.id,
      title: n.title || "Untitled",
      status: n.status,
    }))
    const wikiItems: HomePinnedItem[] = pinnedWikiArticles.map((w) => ({
      kind: "wiki" as const,
      id: w.id,
      title: w.title || "Untitled",
      isStub: isWikiStub(w),
    }))
    const bookItems: HomePinnedItem[] = books
      .filter((b) => b.pinned && !b.trashed)
      .map((b) => ({
        kind: "book" as const,
        id: b.id,
        title: b.title || "Untitled book",
        itemCount: b.items.length,
      }))
    return [...noteItems, ...wikiItems, ...bookItems]
  }, [pinnedNotes, pinnedWikiArticles, books])

  // ── Home Intelligence Panel removed (PR 7).
  // Heavy insights (orphans, redlinks, suggestions, unlinked mentions, knowledge health)
  // now live in Ontology > Insights via useKnowledgeMetrics().
  // Home space sidebar shows only the Inbox NavLink — workflow stays in HomeView itself.

  // Recent notes: walk backwards from navigationIndex, dedup, exclude trashed, take 5
  const recentNotes = useMemo(() => {
    const seen = new Set<string>()
    const result: { id: string; title: string; status: NoteStatus }[] = []
    for (let i = navigationIndex; i >= 0 && result.length < 5; i--) {
      const noteId = navigationHistory[i]
      if (!seen.has(noteId)) {
        seen.add(noteId)
        const note = notes.find((n) => n.id === noteId && !n.trashed)
        if (note) {
          result.push({ id: note.id, title: note.title || "Untitled", status: note.status })
        }
      }
    }
    return result
  }, [navigationHistory, navigationIndex, notes])

  const activeRoute = useActiveRoute()
  const activeFolderId = useActiveFolderId()
  const activeTagId = useActiveTagId()
  const activeLabelId = useActiveLabelId()
  const isActive = (href: string) => {
    if (ALL_SIDEBAR_ROUTES.includes(href)) {
      // /notes is active only when no folder/tag/label filter is applied
      if (href === "/notes") return activeRoute === "/notes" && activeFolderId === null && activeTagId === null && activeLabelId === null
      return activeRoute === href
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  const isFolderActive = (folderId: string) => {
    return activeRoute === "/notes" && activeFolderId === folderId
  }

  const handleNewFolderSubmit = () => {
    const name = newFolderName.trim()
    if (name && newFolderKind) {
      // PR (b): kind is captured at "+" click time per section.
      // v109: opt-in color — new folders start uncolored.
      createFolder(name, newFolderKind)
    }
    setNewFolderKind(null)
    setNewFolderName("")
  }

  const handleNewFolderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNewFolderSubmit()
    } else if (e.key === "Escape") {
      setNewFolderKind(null)
      setNewFolderName("")
    }
  }

  const handleRenameSubmit = () => {
    if (!renamingItem) return
    const name = renameValue.trim()
    const folderToRename = folders.find(f => f.id === renamingItem.id)
    if (folderToRename) {
      if (name) updateFolder(renamingItem.id, { name })
    } else {
      const viewToRename = savedViews.find(v => v.id === renamingItem.id)
      if (viewToRename && name) {
        updateSavedView(renamingItem.id, { name })
      }
    }
    setRenamingItem(null)
    setRenameValue("")
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleRenameSubmit()
    else if (e.key === "Escape") {
      setRenamingItem(null)
      setRenameValue("")
    }
  }

  const handleDeleteFolder = (id: string) => {
    deleteFolder(id)
  }

  const handleNewViewSubmit = () => {
    const name = newViewName.trim()
    if (name) {
      // Capture current viewState (snapshot UX) instead of creating an empty
      // default view. Resolves to the active context key by space + route, so
      // /stone saves "stone" filters, /wiki saves "wiki" state, etc.
      const contextKey = getCurrentViewContextKey(activeSpace, activeRoute)
      const currentViewState = usePlotStore.getState().viewStateByContext[contextKey]
      const savedSpace = getSavedViewSpaceForActivity(activeSpace)
      createSavedView(
        name,
        currentViewState as any, // ViewState shape is wider than SavedView.viewState; the slice merges defaults
        savedSpace
      )
    }
    setNewViewName("")
    setNewViewOpen(false)
  }

  const handleNewViewKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNewViewSubmit()
    if (e.key === "Escape") {
      setNewViewName("")
      setNewViewOpen(false)
    }
  }

  const handleDeleteView = (id: string) => {
    deleteSavedView(id)
    if (activeViewId === id) {
      setActiveViewId(null)
      setActiveRoute("/notes")
      router.push("/notes")
    }
  }

  // Saved Views snapshot UX:
  //  - Update: overwrite saved viewState with the current (dirty) state
  //  - Reset: discard current edits and re-apply the saved viewState
  const handleUpdateView = (viewId: string) => {
    const view = savedViews.find((v) => v.id === viewId)
    if (!view) return
    const contextKey = getCurrentViewContextKey(activeSpace, activeRoute)
    const currentViewState = usePlotStore.getState().viewStateByContext[contextKey]
    if (!currentViewState) return
    updateSavedView(viewId, { viewState: currentViewState as any })
  }

  const handleResetView = (viewId: string) => {
    const view = savedViews.find((v) => v.id === viewId)
    if (!view) return
    const contextKey = getCurrentViewContextKey(activeSpace, activeRoute)
    const setViewState = usePlotStore.getState().setViewState
    setViewState(contextKey as ViewContextKey, view.viewState as any)
  }

  const renderViewsSection = (spaceFilter: string, routeOnClick: string) => {
    const spaceViews = savedViews.filter(v => v.space === spaceFilter || v.space === "all")
    return (
      <Section
        title="Views"
        trailing={
          <button
            onClick={() => setNewViewOpen(true)}
            className="flex items-center justify-center h-5 w-5 rounded hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors"
            aria-label="New view"
          >
            <IconPlus size={14} />
          </button>
        }
      >
        {newViewOpen && activeSpace === spaceFilter && (
          <div className="px-2 py-1">
            <input
              ref={newViewInputRef}
              type="text"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onKeyDown={handleNewViewKeyDown}
              onBlur={handleNewViewSubmit}
              placeholder="View name"
              className="w-full rounded-md border border-sidebar-border bg-sidebar-bg px-2.5 py-1 text-note text-sidebar-foreground placeholder:text-sidebar-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}
        {spaceViews.map((view) => {
          const isViewActive = activeViewId === view.id
          const isViewRenaming = renamingItem?.id === view.id
          return (
            <ContextMenu key={view.id}>
              <ContextMenuTrigger asChild>
                <button
                  onClick={() => {
                    setActiveViewId(view.id)
                    setActiveRoute(routeOnClick)
                    setSelectedNoteId(null)
                    router.push(routeOnClick)
                  }}
                  className="a-sb-link"
                  data-active={isViewActive ? "true" : undefined}
                >
                  <span className="flex shrink-0 items-center justify-center w-5 h-5">
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </span>
                  {isViewRenaming ? (
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={handleRenameKeyDown}
                      onBlur={handleRenameSubmit}
                      className="flex-1 rounded border border-sidebar-border bg-sidebar-bg px-1.5 py-0.5 text-note text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate text-left flex-1">{view.name}</span>
                  )}
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={() => handleUpdateView(view.id)}>
                  Update view
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleResetView(view.id)}>
                  Reset to saved
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => {
                  setRenamingItem({ id: view.id })
                  setRenameValue(view.name)
                }}>
                  Rename
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => handleDeleteView(view.id)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
      </Section>
    )
  }

  // PR (b): per-kind counts. Folders are now type-strict so a `kind="note"`
  // folder can never contain wiki articles, and vice versa. Each context's
  // count is therefore the only one that matters for the section it lives in.
  const notesInNoteFolder = (folderId: string) =>
    notes.filter((n) => n.folderIds.includes(folderId) && !n.trashed).length
  const wikisInWikiFolder = (folderId: string) =>
    wikiArticles.filter((w) => w.folderIds.includes(folderId)).length

  return (
    <aside className="a-sidebar h-full w-full shrink-0 select-none" data-active-space={activeSpace}>
      {/* Header: RecentlyViewed + Back/Forward + spacer + Search + Close */}
      <div className="flex items-center gap-0.5 px-2.5 pt-2.5 pb-1.5">
        {/* Recently Viewed */}
        <div className="relative" ref={recentlyViewedRef}>
          <button
            onClick={() => setRecentlyViewedOpen(!recentlyViewedOpen)}
            className={`flex items-center justify-center h-7 w-7 rounded-md transition-colors ${
              recentlyViewedOpen ? "text-sidebar-foreground bg-sidebar-hover" : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover"
            }`}
            aria-label="Recently viewed"
          >
            <IconClock size={16} />
          </button>
          {recentlyViewedOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-lg border border-border bg-surface-overlay shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-2 border-b border-border">
                <span className="text-2xs font-medium text-muted-foreground">Recently Viewed</span>
              </div>
              {recentlyViewed.length === 0 ? (
                <div className="px-3 py-4 text-center text-note text-muted-foreground">
                  No recently viewed notes
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto py-1">
                  {recentlyViewed.map((item) => (
                    <button
                      key={item.id}
                      onClick={(e) => {
                        openNote(item.id, { forceNewTab: e.ctrlKey || e.metaKey })
                        setRecentlyViewedOpen(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-sidebar-hover"
                    >
                      <IconDoc size={14} className="shrink-0 text-muted-foreground" />
                      <span className="truncate text-note text-foreground">{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Back/Forward */}
        <button
          onClick={handleGoBack}
          className="flex items-center justify-center h-7 w-7 rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover transition-colors"
          title="Back"
        >
          <CaretLeft size={14} weight="bold" />
        </button>
        <button
          onClick={handleGoForward}
          className="flex items-center justify-center h-7 w-7 rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover transition-colors"
          title="Forward"
        >
          <CaretRight size={14} weight="bold" />
        </button>

        <div className="flex-1" />

        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center justify-center h-7 w-7 rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover transition-colors"
          title="Search (⌘K)"
        >
          <MagnifyingGlass size={14} weight="regular" />
        </button>

        {/* Close sidebar button removed — PanelsMenu (workspace header hamburger) handles toggle */}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2">
        {/* ── Notes Context ─────────────────────────── */}
        {activeSpace === "notes" && (
          <>
            <div className="space-y-px">
              <NavLink
                href="/notes"
                icon={<IconNotes size={20} />}
                label="All Notes"
                count={allNotesCount > 0 ? allNotesCount : undefined}
                active={isActive("/notes")}
              />
              <NavLink
                href="/stone"
                icon={<IconStone size={20} />}
                label="Stone"
                count={inboxCount > 0 ? inboxCount : undefined}
                active={isActive("/stone")}
              />
              <NavLink
                href="/brick"
                icon={<IconBrick size={20} />}
                label="Brick"
                count={captureCount > 0 ? captureCount : undefined}
                active={isActive("/brick")}
              />
              <NavLink
                href="/keystone"
                icon={<IconBlock size={20} />}
                label="Block"
                count={permanentCount > 0 ? permanentCount : undefined}
                active={isActive("/keystone")}
              />
              <NavLink
                href="/pinned"
                icon={<IconPin size={20} />}
                label="Pinned"
                count={pinnedNotes.length > 0 ? pinnedNotes.length : undefined}
                active={isActive("/pinned")}
              />
            </div>

            {/* Views section — placed above Folders per user preference (2026-05-05). */}
            {renderViewsSection("notes", "/notes")}

            {/* Folders section — Notes context (kind="note" only).
                PR (b): per-kind isolation. The Wiki context renders an
                analogous section below; the two no longer share a folder
                pool. */}
            <Section
              title="Folders"
              trailing={
                <button
                  onClick={() => setNewFolderKind("note")}
                  className="flex items-center justify-center h-5 w-5 rounded hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors"
                  aria-label="New note folder"
                >
                  <IconPlus size={14} />
                </button>
              }
            >
              {newFolderKind === "note" && (
                <div className="px-2 py-1">
                  <input
                    ref={newFolderInputRef}
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={handleNewFolderKeyDown}
                    onBlur={handleNewFolderSubmit}
                    placeholder="Folder name"
                    className="w-full rounded-md border border-sidebar-border bg-sidebar-bg px-2.5 py-1 text-note text-sidebar-foreground placeholder:text-sidebar-muted focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              )}
              {displayedNoteFolders.map((folder) => {
                const count = notesInNoteFolder(folder.id)
                const active = isFolderActive(folder.id)
                const isRenaming = renamingItem?.id === folder.id
                return (
                  <ContextMenu key={folder.id}>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => {
                          accessFolder(folder.id)
                          setActiveFolderId(folder.id)
                          setActiveRoute("/notes")
                          setSelectedNoteId(null)
                          router.push("/notes")
                        }}
                        className="a-sb-link"
                        data-active={active ? "true" : undefined}
                      >
                        <span className="flex shrink-0 items-center justify-center w-5 h-5">
                          <IconFolder size={20} />
                        </span>
                        {isRenaming ? (
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            onBlur={handleRenameSubmit}
                            className="flex-1 rounded border border-sidebar-border bg-sidebar-bg px-1.5 py-0.5 text-note text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="truncate text-left flex-1">{folder.name}</span>
                        )}
                        {!isRenaming && count > 0 && (
                          <span className="a-sb-link__count tabular-nums">{count}</span>
                        )}
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onClick={() => {
                        setRenamingItem({ id: folder.id })
                        setRenameValue(folder.name)
                      }}>
                        Rename
                      </ContextMenuItem>
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>Change color</ContextMenuSubTrigger>
                        <ContextMenuSubContent className="p-2">
                          <ColorPickerGrid
                            value={getEntityColor(folder.color)}
                            onChange={(color) => updateFolder(folder.id, { color })}
                          />
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      {/* v109: opt-in color — Reset returns the folder to neutral gray. */}
                      <ContextMenuItem onClick={() => updateFolder(folder.id, { color: null })}>
                        Reset color
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )
              })}
              {hiddenNoteFolders.length > 0 && !showAllFolders && (
                <button
                  onClick={() => setShowAllFolders(true)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-note text-sidebar-muted hover:text-sidebar-foreground transition-colors"
                >
                  {hiddenNoteFolders.length} more
                </button>
              )}
              {showAllFolders && hiddenNoteFolders.length > 0 && (
                <button
                  onClick={() => setShowAllFolders(false)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-note text-sidebar-muted hover:text-sidebar-foreground transition-colors"
                >
                  Show less
                </button>
              )}
            </Section>

            {/* More section: Templates, Insights.
                2026-05-17 — Labels는 Library hub로 이동 (cross-entity 분류
                메커니즘은 Library에 모이는 영구 룰). Templates는 Note-recipe
                이므로 Notes 사이드바에 유지. */}
            <Section title="More">
              {/* Stickers entry intentionally lives only in Library
                  (33 design decisions #8 — Sticker = cross-everything,
                  belongs with cross-cutting library indices). */}
              <NavLink
                href="/templates"
                icon={<IconTemplate size={20} />}
                label="Templates"
                count={templates.length}
                active={isActive("/templates")}
                dragContent={{ type: "templates" }}
              />
              <NavLink
                href="/insights"
                icon={<IconInsight size={20} />}
                label="Insights"
                active={isActive("/insights")}
                dragContent={{ type: "insights" }}
              />
            </Section>

            {/* Pinned section */}
            {pinnedNotes.length > 0 && (
              <Section title="Pinned">
                {pinnedNotes.map((item) => (
                  <button
                    key={item.id}
                    draggable
                    onDragStart={(e) => setNoteDragData(e, item.id)}
                    onClick={(e) => openNote(item.id, { forceNewTab: e.ctrlKey || e.metaKey })}
                    className="a-sb-link"
                  >
                    <span className="flex shrink-0 items-center justify-center w-5 h-5">
                      <StatusShapeIcon status={item.status} size={14} />
                    </span>
                    <span className="truncate text-left flex-1">{item.title || "Untitled"}</span>
                  </button>
                ))}
              </Section>
            )}

            {/* Recent section */}
            {recentNotes.length > 0 && (
              <Section title="Recent">
                {recentNotes.map((item) => (
                  <button
                    key={item.id}
                    draggable
                    onDragStart={(e) => setNoteDragData(e, item.id)}
                    onClick={(e) => openNote(item.id, { forceNewTab: e.ctrlKey || e.metaKey })}
                    className="a-sb-link"
                  >
                    <span className="flex shrink-0 items-center justify-center w-5 h-5">
                      <StatusShapeIcon status={item.status} size={14} />
                    </span>
                    <span className="truncate text-left flex-1">{item.title}</span>
                  </button>
                ))}
              </Section>
            )}
          </>
        )}

        {/* ── Wiki Context ──────────────────────────── */}
        {activeSpace === "wiki" && (
          <>
            <div className="space-y-px">
              <NavLink
                href="/wiki"
                icon={<BookOpen size={20} weight="regular" />}
                label="Overview"
                count={wikiCount > 0 ? wikiCount : undefined}
                active={isActive("/wiki") && wikiViewMode !== "merge" && wikiViewMode !== "split"}
              />
              <button
                onClick={() => {
                  setSelectedNoteId(null)
                  setActiveRoute("/wiki")
                  setWikiViewMode("merge")
                  router.push("/wiki")
                }}
                className="a-sb-link"
                data-active={wikiViewMode === "merge" ? "true" : undefined}
              >
                <span className="flex shrink-0 items-center justify-center w-5 h-5">
                  <GitMerge size={16} weight="regular" />
                </span>
                <span className="truncate text-left flex-1">Merge</span>
              </button>
              <button
                onClick={() => {
                  setSelectedNoteId(null)
                  setActiveRoute("/wiki")
                  setWikiViewMode("split")
                  router.push("/wiki")
                }}
                className="a-sb-link"
                data-active={wikiViewMode === "split" ? "true" : undefined}
              >
                <span className="flex shrink-0 items-center justify-center w-5 h-5">
                  <Scissors size={16} weight="regular" />
                </span>
                <span className="truncate text-left flex-1">Split</span>
              </button>
              {/* 2026-05-18 — Wiki Templates entry (Notes Templates 정합).
                  Wiki article recipe — Concept/Person/Place 등 pre-seeded
                  blocks+infobox. 생성 picker + slash insert 둘 다 지원. */}
              <NavLink
                href="/wiki/templates"
                icon={<IconTemplate size={20} />}
                label="Templates"
                count={wikiTemplates.filter((t) => !t.trashed).length}
                active={isActive("/wiki/templates")}
                dragContent={{ type: "wiki-templates" } as any}
              />
              {/* 2026-05-17 — Categories는 Library hub로 이동 (cross-entity
                  분류 메커니즘 정합). 단 Categories 화면 자체는 여전히
                  Wiki page + categoryView mode (길 A — 본격 분리는 별도 PR).
                  Library 사이드바의 Categories entry가 이 페이지로 navigate. */}
              {/* Stickers entry lives only in Library (33 design
                  decisions #8 — cross-cutting index). */}
            </div>

            {/* Wiki Views */}
            {renderViewsSection("wiki", "/wiki")}

            {/* Folders section — Wiki context (kind="wiki" only). PR (b)
                introduces this analog of the Notes Folders section so wiki
                articles get their own first-class folder organisation, fully
                isolated from note folders by Folder.kind. */}
            <Section
              title="Folders"
              trailing={
                <button
                  onClick={() => setNewFolderKind("wiki")}
                  className="flex items-center justify-center h-5 w-5 rounded hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors"
                  aria-label="New wiki folder"
                >
                  <IconPlus size={14} />
                </button>
              }
            >
              {newFolderKind === "wiki" && (
                <div className="px-2 py-1">
                  <input
                    ref={newFolderInputRef}
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={handleNewFolderKeyDown}
                    onBlur={handleNewFolderSubmit}
                    placeholder="Folder name"
                    className="w-full rounded-md border border-sidebar-border bg-sidebar-bg px-2.5 py-1 text-note text-sidebar-foreground placeholder:text-sidebar-muted focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              )}
              {displayedWikiFolders.map((folder) => {
                const count = wikisInWikiFolder(folder.id)
                const active = isFolderActive(folder.id)
                const isRenaming = renamingItem?.id === folder.id
                return (
                  <ContextMenu key={folder.id}>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => {
                          accessFolder(folder.id)
                          setActiveFolderId(folder.id)
                          // Wiki folder click routes to /folder/[id] which
                          // (Commit C) renders the wiki-only folder page.
                          setActiveRoute(`/folder/${folder.id}`)
                          setSelectedNoteId(null)
                          router.push(`/folder/${folder.id}`)
                        }}
                        className="a-sb-link"
                        data-active={active ? "true" : undefined}
                      >
                        <span className="flex shrink-0 items-center justify-center w-5 h-5">
                          <IconFolder size={20} />
                        </span>
                        {isRenaming ? (
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            onBlur={handleRenameSubmit}
                            className="flex-1 rounded border border-sidebar-border bg-sidebar-bg px-1.5 py-0.5 text-note text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="truncate text-left flex-1">{folder.name}</span>
                        )}
                        {!isRenaming && count > 0 && (
                          <span className="a-sb-link__count tabular-nums">{count}</span>
                        )}
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onClick={() => {
                        setRenamingItem({ id: folder.id })
                        setRenameValue(folder.name)
                      }}>
                        Rename
                      </ContextMenuItem>
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>Change color</ContextMenuSubTrigger>
                        <ContextMenuSubContent className="p-2">
                          <ColorPickerGrid
                            value={getEntityColor(folder.color)}
                            onChange={(color) => updateFolder(folder.id, { color })}
                          />
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      {/* v109: opt-in color — Reset returns the folder to neutral gray. */}
                      <ContextMenuItem onClick={() => updateFolder(folder.id, { color: null })}>
                        Reset color
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )
              })}
              {hiddenWikiFolders.length > 0 && !showAllFolders && (
                <button
                  onClick={() => setShowAllFolders(true)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-note text-sidebar-muted hover:text-sidebar-foreground transition-colors"
                >
                  {hiddenWikiFolders.length} more
                </button>
              )}
              {showAllFolders && hiddenWikiFolders.length > 0 && (
                <button
                  onClick={() => setShowAllFolders(false)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-note text-sidebar-muted hover:text-sidebar-foreground transition-colors"
                >
                  Show less
                </button>
              )}
            </Section>

            {/* Pinned wiki articles */}
            {(() => {
              const pinnedWiki = notes.filter((n) => n.noteType === "wiki" && !n.trashed && n.pinned)
              return pinnedWiki.length > 0 ? (
                <Section title="Pinned">
                  {pinnedWiki.map((note) => (
                    <button
                      key={note.id}
                      onClick={(e) => openNote(note.id, { forceNewTab: e.ctrlKey || e.metaKey })}
                      className="a-sb-link"
                    >
                      <span className="flex shrink-0 items-center justify-center w-5 h-5">
                        <IconDoc size={14} />
                      </span>
                      <span className="truncate text-left flex-1">{note.title || "Untitled"}</span>
                    </button>
                  ))}
                </Section>
              ) : null
            })()}

            {/* Recent wiki articles */}
            {(() => {
              const recentWiki = recentNotes.filter((item) => {
                const note = notes.find((n) => n.id === item.id)
                return note?.noteType === "wiki"
              })
              return recentWiki.length > 0 ? (
                <Section title="Recent">
                  {recentWiki.map((item) => (
                    <button
                      key={item.id}
                      onClick={(e) => openNote(item.id, { forceNewTab: e.ctrlKey || e.metaKey })}
                      className="a-sb-link"
                    >
                      <span className="flex shrink-0 items-center justify-center w-5 h-5">
                        <IconDoc size={14} />
                      </span>
                      <span className="truncate text-left flex-1">{item.title}</span>
                    </button>
                  ))}
                </Section>
              ) : null
            })()}
          </>
        )}

        {/* ── Calendar Context ──────────────────────── */}
        {activeSpace === "calendar" && (
          <>
            <div className="space-y-px">
              <NavLink
                href="/calendar"
                icon={<IconCalendar size={20} />}
                label="Calendar"
                active={isActive("/calendar")}
              />
              <NavLink
                href="/todos"
                icon={<CheckSquareIcon size={20} />}
                label="Todos"
                count={todoTaskCount > 0 ? todoTaskCount : undefined}
                active={isActive("/todos")}
              />
            </div>

            {/* Today's Summary */}
            <Section title="Today">
              {(() => {
                const todayStr = new Date().toISOString().slice(0, 10)
                const created = notes.filter(n => !n.trashed && n.createdAt.startsWith(todayStr)).length
                const updated = notes.filter(n => !n.trashed && n.updatedAt.startsWith(todayStr) && !n.createdAt.startsWith(todayStr)).length

                return (
                  <div className="flex flex-col gap-1.5 px-2.5">
                    <div className="flex items-center justify-between text-2xs">
                      <span className="text-sidebar-muted">Created</span>
                      <span className="text-sidebar-foreground tabular-nums">{created}</span>
                    </div>
                    <div className="flex items-center justify-between text-2xs">
                      <span className="text-sidebar-muted">Updated</span>
                      <span className="text-sidebar-foreground tabular-nums">{updated}</span>
                    </div>
                  </div>
                )
              })()}
            </Section>

            {/* Upcoming Reminders */}
            {(() => {
              const now = new Date()
              const upcoming = notes.filter(n => {
                if (n.trashed || !n.reviewAt) return false
                try { return new Date(n.reviewAt) > now } catch { return false }
              }).sort((a, b) => new Date(a.reviewAt!).getTime() - new Date(b.reviewAt!).getTime()).slice(0, 5)

              return upcoming.length > 0 ? (
                <Section title="Upcoming">
                  {upcoming.map(note => {
                    let relDate = ""
                    try {
                      const d = new Date(note.reviewAt!)
                      const diff = Math.ceil((d.getTime() - now.getTime()) / (1000*60*60*24))
                      relDate = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : `In ${diff}d`
                    } catch {}
                    return (
                      <button
                        key={note.id}
                        onClick={(e) => openNote(note.id, { forceNewTab: e.ctrlKey || e.metaKey })}
                        className="a-sb-link"
                      >
                        <span className="flex shrink-0 items-center justify-center w-5 h-5">
                          <IconDoc size={14} />
                        </span>
                        <span className="truncate text-left flex-1">{note.title || "Untitled"}</span>
                        <span className="text-2xs text-muted-foreground/70 tabular-nums">{relDate}</span>
                      </button>
                    )
                  })}
                </Section>
              ) : null
            })()}

            {/* Calendar Views */}
            {renderViewsSection("calendar", "/calendar")}
          </>
        )}

        {/* ── Ontology (Graph) Context ──────────────── */}
        {activeSpace === "ontology" && (
          <>
            {/* Ontology has 3 modes — Graph (default visual), Insights
                (action prompts), Dashboard (raw stats). All three live at
                /ontology and switch via `plot:set-ontology-tab` event so
                the graph layout/positions are preserved across mode flips.
                Following Wiki/Library pattern: each mode is a top-level
                NavLink, none buried in More. */}
            <div className="space-y-px">
              {(() => {
                const isOnOntology = pathname?.startsWith("/ontology") ?? false
                const currentMode = isOnOntology
                  ? (() => {
                      try {
                        const vs = (usePlotStore.getState() as any).viewStateByContext?.graph
                        return vs?.viewMode === "insights" ? "insights" :
                               vs?.viewMode === "dashboard" ? "dashboard" : "graph"
                      } catch { return "graph" }
                    })()
                  : null
                const switchMode = (tab: "graph" | "insights" | "dashboard") => {
                  if (!isOnOntology) {
                    router.push("/ontology")
                    // Defer the tab event — page mounts then handler will pick it up.
                    setTimeout(() => {
                      window.dispatchEvent(
                        new CustomEvent("plot:set-ontology-tab", { detail: { tab } })
                      )
                    }, 50)
                  } else {
                    window.dispatchEvent(
                      new CustomEvent("plot:set-ontology-tab", { detail: { tab } })
                    )
                  }
                }
                return (
                  <>
                    <NavLink
                      href="/ontology"
                      icon={<Graph size={20} weight="regular" />}
                      label="Graph"
                      count={allNotesCount > 0 ? allNotesCount : undefined}
                      active={isOnOntology && currentMode === "graph"}
                      dragContent={{ type: "ontology" }}
                      onClickOverride={() => switchMode("graph")}
                    />
                    <NavLink
                      href="/ontology"
                      icon={<IconInsight size={20} />}
                      label="Insights"
                      active={isOnOntology && currentMode === "insights"}
                      onClickOverride={() => switchMode("insights")}
                    />
                    <NavLink
                      href="/ontology"
                      icon={<ChartBar size={20} weight="regular" />}
                      label="Dashboard"
                      active={isOnOntology && currentMode === "dashboard"}
                      onClickOverride={() => switchMode("dashboard")}
                    />
                  </>
                )
              })()}
              {/* Stickers entry lives only in Library (33 design
                  decisions #8 — cross-cutting index). */}
            </div>

            {/* Node Types removed in Phase 7 — moved into Display popover */}

            {/* Ontology Views */}
            {renderViewsSection("ontology", "/ontology")}

            {/* Graph Stats — at-a-glance quantities + actionable rates.
                Counts (Notes / Wiki) sit at the top, sized large enough to
                read in one glance. Rates (Orphans / Untagged / Coverage)
                follow as small rows. Hover any row for a contextual tip
                (full Dashboard has the deep breakdown). */}
            <Section title="Stats">
              {(() => {
                const m = knowledgeMetrics
                const orphanCount = Math.round(m.orphanRate * m.totalNotes)
                const hubLeader = m.topHubs[0]
                const wikiPercent =
                  m.totalNotes > 0
                    ? Math.round((m.totalWiki / m.totalNotes) * 100)
                    : 0
                const orphanPct = Math.round(m.orphanRate * 100)
                const tagPct = Math.round(m.tagCoverage * 100)
                const untaggedPct = 100 - tagPct
                const untaggedCount = Math.round((1 - m.tagCoverage) * m.totalNotes)
                const hubName = hubLeader?.title ?? hubLeader?.id ?? "—"
                const hubDisplay = hubName.length > 16 ? hubName.slice(0, 14) + "…" : hubName

                // Status breakdown for tooltips (preview note titles)
                const liveNotes = notes.filter((n: any) => !n.trashed)
                const inboxNotes = liveNotes.filter((n: any) => n.status === "stone")
                const captureNotes = liveNotes.filter((n: any) => n.status === "brick")
                const permanentNotes = liveNotes.filter((n: any) => n.status === "keystone")
                const orphanNotes = liveNotes.filter((n: any) =>
                  !(n.linksOut?.length || 0) && !((n as any).backlinks?.length || 0)
                )
                const untaggedNotes = liveNotes.filter((n: any) => !n.tags || n.tags.length === 0)

                // Helper: list up to N titles for a tooltip
                const previewTitles = (arr: any[], max = 8) => {
                  if (arr.length === 0) return ""
                  const shown = arr.slice(0, max).map((n) => `• ${n.title || "Untitled"}`).join("\n")
                  const more = arr.length > max ? `\n… and ${arr.length - max} more` : ""
                  return "\n\n" + shown + more
                }

                return (
                  <div className="flex flex-col gap-2 px-2.5">
                    {/* ── Counts: large, primary visual weight ── */}
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <div
                        className="rounded-md border border-sidebar-border-subtle bg-sidebar-card/30 px-2 py-1.5 cursor-help"
                        title={`${m.totalNotes} notes total — Inbox ${inboxNotes.length} / Capture ${captureNotes.length} / Permanent ${permanentNotes.length}${previewTitles(liveNotes)}`}
                      >
                        <div className="text-[10px] text-sidebar-muted uppercase tracking-wide">Notes</div>
                        <div className="text-base font-semibold tabular-nums leading-tight">{m.totalNotes}</div>
                      </div>
                      <div
                        className="rounded-md border border-sidebar-border-subtle bg-sidebar-card/30 px-2 py-1.5 cursor-help"
                        title={`${m.totalWiki} wiki articles${previewTitles(wikiArticles?.filter((w: any) => !w.trashed) ?? [])}`}
                      >
                        <div className="text-[10px] text-sidebar-muted uppercase tracking-wide">Wiki</div>
                        <div className="text-base font-semibold tabular-nums leading-tight">{m.totalWiki}</div>
                      </div>
                    </div>

                    {/* ── Rates: action-driving metrics, small rows ── */}
                    <div
                      className="flex items-center justify-between text-2xs cursor-help"
                      title={`Notes with no incoming or outgoing connections.${previewTitles(orphanNotes)}`}
                    >
                      <span className="text-sidebar-muted">Orphans</span>
                      <span
                        className={`tabular-nums ${
                          orphanCount > 0 ? "text-chart-3" : "text-sidebar-foreground"
                        }`}
                      >
                        {orphanCount} · {orphanPct}%
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between text-2xs cursor-help"
                      title={`${untaggedCount} notes without any tag.${previewTitles(untaggedNotes)}`}
                    >
                      <span className="text-sidebar-muted">Untagged</span>
                      <span className={`tabular-nums ${untaggedPct > 0 ? "text-chart-3" : "text-sidebar-foreground"}`}>
                        {untaggedPct}%
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between text-2xs cursor-help"
                      title="% of notes that have been promoted to a wiki article. Higher = more knowledge codified."
                    >
                      <span className="text-sidebar-muted">Wiki coverage</span>
                      <span className="text-sidebar-foreground tabular-nums">{wikiPercent}%</span>
                    </div>
                    <div
                      className="flex items-center justify-between text-2xs cursor-help"
                      title={hubLeader ? `${hubName} — ${hubLeader.backlinks} connections (the hub of your graph).` : "No hub yet — add some links."}
                    >
                      <span className="text-sidebar-muted">Most linked</span>
                      <span className="text-sidebar-foreground truncate ml-2">
                        {hubDisplay}
                      </span>
                    </div>

                    {/* ── Footer: edge count + dashboard pointer ── */}
                    <div
                      className="flex items-center justify-between text-2xs pt-1 border-t border-sidebar-border-subtle cursor-help"
                      title={`${m.totalEdges} total connections across notes and wiki articles. See Dashboard for breakdown by edge kind.`}
                    >
                      <span className="text-sidebar-muted text-[10px] tabular-nums">
                        {m.totalEdges} edges
                      </span>
                      <span className="text-sidebar-muted text-[10px]">
                        →&nbsp;Dashboard
                      </span>
                    </div>
                  </div>
                )
              })()}
            </Section>

            {/* More — Graph/Insights/Dashboard moved to the top-level nav
                (Wiki/Library pattern), so this section now only houses
                future "More" items. Removed for now to avoid an empty box. */}
          </>
        )}

        {/* ── Library ────────────────────────────── */}
        {activeSpace === "library" && (
          <>
            <div className="space-y-px">
              <NavLink
                href="/library"
                icon={<Books size={20} weight="regular" />}
                label="Overview"
                active={isActive("/library")}
              />
              <NavLink
                href="/library/references"
                icon={<Quotes size={20} weight="regular" />}
                label="References"
                count={Object.keys(references).length > 0 ? Object.keys(references).length : undefined}
                active={isActive("/library/references")}
              />
              <NavLink
                href="/library/tags"
                icon={<PhTag size={20} weight="light" />}
                label="Tags"
                count={tags.filter(t => !t.trashed).length > 0 ? tags.filter(t => !t.trashed).length : undefined}
                active={isActive("/library/tags")}
              />
              {/* 2026-05-17 — Labels는 cross-entity 분류 (Note/Wiki/Book 모두
                  적용). Library hub에서 관리. Notes 사이드바의 Labels entry
                  제거됨. */}
              <NavLink
                href="/library/labels"
                icon={<IconLabel size={20} />}
                label="Labels"
                count={labels.filter((l) => !(l as { trashed?: boolean }).trashed).length || undefined}
                active={isActive("/library/labels")}
                dragContent={{ type: "labels" }}
              />
              {/* 2026-05-17 — Categories도 cross-entity. 길 A — entry만 Library에.
                  2026-05-19 — Library sidebar 유지하면서 categories overview
                  표시. activeRoute = "/library/categories" + wikiViewMode =
                  "category"로 layout이 WikiView를 mount하되 sidebar는 Library
                  그대로 (사용자 보고 "Categories 누르면 위키 사이드바로 옮겨감"). */}
              <button
                onClick={() => {
                  setSelectedNoteId(null)
                  setActiveRoute("/library/categories")
                  setCategoryOverview()
                  router.push("/library/categories")
                }}
                className="a-sb-link"
                data-active={activeRoute === "/library/categories" ? "true" : undefined}
              >
                <span className="flex shrink-0 items-center justify-center w-5 h-5">
                  <Folders size={20} weight="regular" />
                </span>
                <span className="truncate text-left flex-1">Categories</span>
                {wikiCategories.length > 0 && (
                  <span className="text-2xs text-muted-foreground tabular-nums">
                    {wikiCategories.length}
                  </span>
                )}
              </button>
              <NavLink
                href="/library/files"
                icon={<Paperclip size={20} weight="light" />}
                label="Files"
                count={attachments.length > 0 ? attachments.length : undefined}
                active={isActive("/library/files")}
              />
              {/* Stickers — cross-entity bundling marker, alongside other
                  cross-cutting library indices (References / Tags / Files). */}
              <NavLink
                href="/stickers"
                icon={<StickerPhosphor size={20} />}
                label="Stickers"
                count={stickers.filter((s) => !s.trashed).length}
                active={isActive("/stickers")}
                dragContent={{ type: "stickers" }}
              />
            </div>
          </>
        )}

        {/* ── Books ──────────────────────────────── */}
        {activeSpace === "books" && (
          <>
            <div className="space-y-px">
              <NavLink
                href="/books"
                icon={<Books size={20} weight="regular" />}
                label="All Books"
                count={books.filter((b) => !b.trashed).length || undefined}
                active={isActive("/books")}
              />
            </div>

            {/* Pinned books — surfaces favorite collections (PRD §10) */}
            {(() => {
              const pinnedBooks = books
                .filter((b) => b.pinned && !b.trashed)
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              if (pinnedBooks.length === 0) return null
              return (
                <Section title="Pinned">
                  {pinnedBooks.map((book) => {
                    const href = `/books/${book.id}`
                    return (
                      <button
                        key={book.id}
                        onClick={() => {
                          setActiveRoute(href)
                          setSelectedNoteId(null)
                          router.push(href)
                        }}
                        className="a-sb-link"
                        data-active={activeRoute === href ? "true" : undefined}
                      >
                        <span className="flex shrink-0 items-center justify-center w-5 h-5">
                          <BookOpen size={14} weight="regular" />
                        </span>
                        <span className="truncate text-left flex-1">{book.title || "Untitled"}</span>
                        <span className="a-sb-link__count tabular-nums">
                          {book.items.length}
                        </span>
                      </button>
                    )
                  })}
                </Section>
              )
            })()}

            {/* Recent books — top 5 by updatedAt (excludes trashed). */}
            {(() => {
              const recentBooks = books
                .filter((b) => !b.trashed && !b.pinned)
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .slice(0, 5)
              if (recentBooks.length === 0) return null
              return (
                <Section title="Recent">
                  {recentBooks.map((book) => {
                    const href = `/books/${book.id}`
                    return (
                      <button
                        key={book.id}
                        onClick={() => {
                          setActiveRoute(href)
                          setSelectedNoteId(null)
                          router.push(href)
                        }}
                        className="a-sb-link"
                        data-active={activeRoute === href ? "true" : undefined}
                      >
                        <span className="flex shrink-0 items-center justify-center w-5 h-5">
                          <BookOpen size={14} weight="regular" />
                        </span>
                        <span className="truncate text-left flex-1">{book.title || "Untitled"}</span>
                        <span className="a-sb-link__count tabular-nums">
                          {book.items.length}
                        </span>
                      </button>
                    )
                  })}
                </Section>
              )
            })()}
          </>
        )}

        {/* ── Home: Inbox + Pinned + Recent. Cross-entity entry points only;
            heavy insights moved to Ontology > Insights (PR 6). Home view itself
            surfaces workflow + nudges. Pinned/Recent reuse Notes-sidebar pattern
            so Home has meaningful nav (was previously sparse — Inbox + Stone only). */}
        {activeSpace === "home" && (
          <>
            <div className="space-y-px">
              <NavLink
                href="/inbox"
                icon={<IconInbox size={20} />}
                label="Inbox"
                count={inboxItemsCount > 0 ? inboxItemsCount : undefined}
                active={isActive("/inbox")}
              />
            </div>

            {/* Pinned section (cross-entity quick access: notes + wiki) */}
            {homePinnedItems.length > 0 && (
              <Section title="Pinned">
                {homePinnedItems.map((item) => (
                  <button
                    key={`${item.kind}:${item.id}`}
                    draggable={item.kind === "note"}
                    onDragStart={item.kind === "note" ? (e) => setNoteDragData(e, item.id) : undefined}
                    onClick={(e) => {
                      if (item.kind === "note") {
                        openNote(item.id, { forceNewTab: e.ctrlKey || e.metaKey })
                      } else if (item.kind === "wiki") {
                        setActiveRoute("/wiki")
                        usePlotStore.getState().setSelectedNoteId(null)
                        router.push(`/wiki/${item.id}`)
                      } else {
                        // book
                        const href = `/books/${item.id}`
                        setActiveRoute(href)
                        setSelectedNoteId(null)
                        router.push(href)
                      }
                    }}
                    className="a-sb-link"
                  >
                    <span className="flex shrink-0 items-center justify-center w-5 h-5">
                      {item.kind === "note" ? (
                        <StatusShapeIcon status={item.status} size={14} />
                      ) : item.kind === "wiki" ? (
                        item.isStub ? (
                          <IconWikiStub size={14} style={{ color: WIKI_STATUS_HEX.stub }} />
                        ) : (
                          <IconWikiArticle size={14} style={{ color: WIKI_STATUS_HEX.article }} />
                        )
                      ) : (
                        <BookOpen size={14} weight="regular" style={{ color: "var(--space-books)" }} />
                      )}
                    </span>
                    <span className="truncate text-left flex-1">{item.title}</span>
                    {item.kind === "book" && (
                      <span className="a-sb-link__count tabular-nums">{item.itemCount}</span>
                    )}
                  </button>
                ))}
              </Section>
            )}

            {/* Recent section */}
            {recentNotes.length > 0 && (
              <Section title="Recent">
                {recentNotes.map((item) => (
                  <button
                    key={item.id}
                    draggable
                    onDragStart={(e) => setNoteDragData(e, item.id)}
                    onClick={(e) => openNote(item.id, { forceNewTab: e.ctrlKey || e.metaKey })}
                    className="a-sb-link"
                  >
                    <span className="flex shrink-0 items-center justify-center w-5 h-5">
                      <StatusShapeIcon status={item.status} size={14} />
                    </span>
                    <span className="truncate text-left flex-1">{item.title || "Untitled"}</span>
                  </button>
                ))}
              </Section>
            )}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2.5 py-2 space-y-px">
        <NavLink
          href="/settings"
          icon={<IconGear size={16} />}
          label="Settings"
          active={isActive("/settings")}
        />
        <NavLink
          href="/trash"
          icon={<IconTrash size={20} />}
          label="Trash"
          count={trashCount > 0 ? trashCount : undefined}
          active={isActive("/trash")}
        />
      </div>
    </aside>
  )
}
