"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  IconInbox,
  IconNotes,
  IconWiki,
  IconCalendar,
  IconOntology,
  IconFolder,
  IconTag,
  IconLabel,
  IconTemplate,
  IconInsight,
  IconCapture,
  IconPermanent,
  IconPin,
  IconTrash,
  IconClock,
  IconPanelLeftClose,
  IconPlus,
  IconDoc,
  IconGear,
} from "@/components/plot-icons"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { usePlotStore } from "@/lib/store"
import { PRESET_COLORS } from "@/lib/colors"
import { setWikiViewMode } from "@/lib/wiki-view-mode"
import { setWikiCategoryFilter } from "@/lib/wiki-category-filter"
import { ALL_SIDEBAR_ROUTES, setActiveRoute, getActiveRoute, setActiveFolderId, setActiveTagId, setActiveLabelId, useActiveRoute, useActiveFolderId, useActiveTagId, useActiveLabelId, useActiveSpace, setActiveViewId, useActiveViewId } from "@/lib/table-route"
import type { Note, NoteStatus, ActivitySpace } from "@/lib/types"
type PanelContent = Record<string, unknown>
import { setViewDragData, setNoteDragData } from "@/lib/drag-helpers"
import { StatusIcon } from "@/components/status-icon"
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
}: {
  href: string
  icon: React.ReactNode
  label: string
  count?: number
  badge?: { count: number; color: string }
  active?: boolean
  dragContent?: PanelContent
}) {
  const router = useRouter()
  const setNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const isSidebarRoute = ALL_SIDEBAR_ROUTES.includes(href)

  const className = `nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors ${
    active
      ? "bg-sidebar-active text-sidebar-active-text"
      : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-hover-text"
  }`

  const content = (
    <>
      <span className={`flex shrink-0 items-center justify-center w-5 h-5 ${active ? "text-sidebar-active-text" : "text-sidebar-muted group-hover:text-sidebar-foreground"}`}>
        {icon}
      </span>
      <span className="truncate text-left flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-sidebar-count tabular-nums">
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
          setNoteId(null)
          if (href === "/notes" || href === "/inbox") {
            setActiveFolderId(null)
            setActiveTagId(null)
            setActiveLabelId(null)
          }
          const currentRoute = getActiveRoute()
          setActiveRoute(href)
          if (currentRoute !== href) router.push(href)
        }}
        className={className}
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
      {...dragProps}
    >
      {content}
    </Link>
  )
}

function Section({
  title,
  children,
  trailing,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  trailing?: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mt-8">
      <div className="flex w-full items-center gap-1.5 px-2.5 py-1">
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-1 items-center gap-1.5 text-xs font-medium text-sidebar-muted hover:text-sidebar-foreground transition-colors"
        >
          <span>{title}</span>
          {open ? (
            <CaretDown size={14} weight="regular" />
          ) : (
            <CaretRight size={14} weight="regular" />
          )}
        </button>
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

  const tags = usePlotStore((s) => s.tags)

  const activeSpace = useActiveSpace()

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
    const routes = ["/inbox", "/notes", "/pinned", "/trash", "/settings"]
    routes.forEach((r) => router.prefetch(r))
  }, [router])

  // Folder creation state
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const newFolderInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (newFolderOpen) {
      setTimeout(() => newFolderInputRef.current?.focus(), 0)
    }
  }, [newFolderOpen])

  useEffect(() => {
    if (newViewOpen) {
      setTimeout(() => newViewInputRef.current?.focus(), 0)
    }
  }, [newViewOpen])

  useEffect(() => {
    if (renamingItem) setTimeout(() => renameInputRef.current?.focus(), 0)
  }, [renamingItem])

  const inboxCount = useMemo(() => notes.filter((n) => n.status === "inbox" && !n.trashed && n.triageStatus !== "trashed").length, [notes])
  const allNotesCount = useMemo(() => notes.filter((n) => !n.trashed).length, [notes])
  const captureCount = useMemo(() => notes.filter((n) => n.status === "capture" && !n.trashed).length, [notes])
  const permanentCount = useMemo(() => notes.filter((n) => n.status === "permanent" && !n.trashed).length, [notes])
  const trashCount = useMemo(() => notes.filter((n) => n.trashed).length, [notes])
  const wikiCount = useMemo(() => notes.filter((n) => n.isWiki && !n.trashed).length, [notes])

  // Sorted folders: pinned first (by pinnedOrder), then unpinned by lastAccessedAt desc (null last)
  const sortedFolders = useMemo(() => {
    const pinned = folders
      .filter((f) => f.pinned)
      .sort((a, b) => a.pinnedOrder - b.pinnedOrder)
    const unpinned = folders
      .filter((f) => !f.pinned)
      .sort((a, b) => {
        if (a.lastAccessedAt === null && b.lastAccessedAt === null) return 0
        if (a.lastAccessedAt === null) return 1
        if (b.lastAccessedAt === null) return -1
        return b.lastAccessedAt.localeCompare(a.lastAccessedAt)
      })
    return [...pinned, ...unpinned]
  }, [folders])

  // Auto-collapse: visible = pinned OR accessed within 30 days OR (never accessed AND created within 30 days)
  const { visibleFolders, hiddenFolders } = useMemo(() => {
    const now = Date.now()
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    const visible: typeof folders = []
    const hidden: typeof folders = []
    for (const f of sortedFolders) {
      if (f.pinned) {
        visible.push(f)
      } else if (f.lastAccessedAt !== null) {
        const age = now - new Date(f.lastAccessedAt).getTime()
        if (age <= thirtyDays) {
          visible.push(f)
        } else {
          hidden.push(f)
        }
      } else {
        // never accessed — check createdAt
        const age = now - new Date(f.createdAt).getTime()
        if (age <= thirtyDays) {
          visible.push(f)
        } else {
          hidden.push(f)
        }
      }
    }
    return { visibleFolders: visible, hiddenFolders: hidden }
  }, [sortedFolders])

  const displayedFolders = showAllFolders
    ? sortedFolders
    : visibleFolders

  // Pinned notes for sidebar shortcut section
  const pinnedNotes = useMemo(() =>
    notes.filter((n) => n.pinned && !n.trashed),
    [notes]
  )

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
    if (name) {
      createFolder(name, PRESET_COLORS[5])
    }
    setNewFolderOpen(false)
    setNewFolderName("")
  }

  const handleNewFolderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNewFolderSubmit()
    } else if (e.key === "Escape") {
      setNewFolderOpen(false)
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
      createSavedView(name, undefined, activeSpace as any)
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
              className="w-full rounded-md border border-sidebar-border bg-sidebar-bg px-2.5 py-1 text-sm text-sidebar-foreground placeholder:text-sidebar-muted focus:outline-none focus:ring-1 focus:ring-accent"
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
                  className={`nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors ${
                    isViewActive
                      ? "bg-sidebar-active text-sidebar-active-text"
                      : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-hover-text"
                  }`}
                >
                  <span className={`flex shrink-0 items-center justify-center w-5 h-5 ${isViewActive ? "text-sidebar-active-text" : "text-sidebar-muted group-hover:text-sidebar-foreground"}`}>
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
                      className="flex-1 rounded border border-sidebar-border bg-sidebar-bg px-1.5 py-0.5 text-sm text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate text-left flex-1">{view.name}</span>
                  )}
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={() => {
                  setRenamingItem({ id: view.id })
                  setRenameValue(view.name)
                }}>
                  Rename
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => handleDeleteView(view.id)}
                  className="text-red-400 focus:text-red-400"
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

  const notesInFolder = (folderId: string) =>
    notes.filter((n) => n.folderId === folderId && !n.trashed).length

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-sidebar-bg border-r border-sidebar-border select-none overflow-hidden">
      {/* Header: Recently Viewed + Workspace Mode + Close */}
      <div className="flex items-center gap-1 px-3.5 pt-2.5 pb-1.5">
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
            <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-lg border border-border bg-popover shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-2 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">Recently Viewed</span>
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
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-secondary/50"
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
        <div className="flex-1" />
        <button
          onClick={() => setSidebarCollapsed(true)}
          className="flex items-center justify-center h-7 w-7 rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover transition-colors"
          title="Close sidebar"
        >
          <IconPanelLeftClose size={16} />
        </button>
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
                href="/capture"
                icon={<IconCapture size={20} />}
                label="Capture"
                count={captureCount > 0 ? captureCount : undefined}
                active={pathname === "/capture"}
              />
              <NavLink
                href="/permanent"
                icon={<IconPermanent size={20} />}
                label="Permanent"
                count={permanentCount > 0 ? permanentCount : undefined}
                active={pathname === "/permanent"}
              />
              <NavLink
                href="/pinned"
                icon={<IconPin size={20} />}
                label="Pinned"
                count={pinnedNotes.length > 0 ? pinnedNotes.length : undefined}
                active={isActive("/pinned")}
              />
            </div>

            {/* Folders section */}
            <Section
              title="Folders"
              trailing={
                <button
                  onClick={() => setNewFolderOpen(true)}
                  className="flex items-center justify-center h-5 w-5 rounded hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors"
                  aria-label="New folder"
                >
                  <IconPlus size={14} />
                </button>
              }
            >
              {newFolderOpen && (
                <div className="px-2 py-1">
                  <input
                    ref={newFolderInputRef}
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={handleNewFolderKeyDown}
                    onBlur={handleNewFolderSubmit}
                    placeholder="Folder name"
                    className="w-full rounded-md border border-sidebar-border bg-sidebar-bg px-2.5 py-1 text-sm text-sidebar-foreground placeholder:text-sidebar-muted focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              )}
              {displayedFolders.map((folder) => {
                const count = notesInFolder(folder.id)
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
                        className={`nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors ${
                          active
                            ? "bg-sidebar-active text-sidebar-active-text"
                            : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-hover-text"
                        }`}
                      >
                        <span className={`flex shrink-0 items-center justify-center w-5 h-5 ${active ? "text-sidebar-active-text" : "text-sidebar-muted group-hover:text-sidebar-foreground"}`}>
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
                            className="flex-1 rounded border border-sidebar-border bg-sidebar-bg px-1.5 py-0.5 text-sm text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="truncate text-left flex-1">{folder.name}</span>
                        )}
                        {!isRenaming && count > 0 && (
                          <span className="text-xs text-sidebar-count tabular-nums">{count}</span>
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
                            value={folder.color}
                            onChange={(color) => updateFolder(folder.id, { color })}
                          />
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="text-red-400 focus:text-red-400"
                      >
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )
              })}
              {hiddenFolders.length > 0 && !showAllFolders && (
                <button
                  onClick={() => setShowAllFolders(true)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-note text-sidebar-muted hover:text-sidebar-foreground transition-colors"
                >
                  {hiddenFolders.length} more
                </button>
              )}
              {showAllFolders && hiddenFolders.length > 0 && (
                <button
                  onClick={() => setShowAllFolders(false)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-note text-sidebar-muted hover:text-sidebar-foreground transition-colors"
                >
                  Show less
                </button>
              )}
            </Section>

            {/* Views section */}
            {renderViewsSection("notes", "/notes")}

            {/* More section: Tags, Labels, Templates, Insights */}
            <Section title="More">
              <NavLink
                href="/tags"
                icon={<IconTag size={20} />}
                label="Tags"
                active={isActive("/tags")}
                dragContent={{ type: "tags" }}
              />
              <NavLink
                href="/labels"
                icon={<IconLabel size={20} />}
                label="Labels"
                active={isActive("/labels")}
                dragContent={{ type: "labels" }}
              />
              <NavLink
                href="/templates"
                icon={<IconTemplate size={20} />}
                label="Templates"
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
                    className="nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-hover-text"
                  >
                    <span className="flex shrink-0 items-center justify-center w-5 h-5 text-sidebar-muted">
                      <StatusIcon status={item.status} />
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
                    className="nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-hover-text"
                  >
                    <span className="flex shrink-0 items-center justify-center w-5 h-5 text-sidebar-muted">
                      <StatusIcon status={item.status} />
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
                icon={<IconWiki size={20} />}
                label="Overview"
                count={wikiCount > 0 ? wikiCount : undefined}
                active={isActive("/wiki")}
              />
            </div>

            {/* Wiki categories (tags used by wiki notes) */}
            {(() => {
              const wikiNotes = notes.filter((n) => n.isWiki && !n.trashed)
              const allTags = tags.filter((t) => !t.trashed)
              const cats = allTags
                .map((tag) => ({
                  ...tag,
                  count: wikiNotes.filter((n) => n.tags.includes(tag.id)).length,
                }))
                .filter((c) => c.count > 0)
                .sort((a, b) => b.count - a.count)
              const uncategorized = wikiNotes.filter((n) => n.tags.length === 0).length

              return (cats.length > 0 || uncategorized > 0) ? (
                <Section title="Categories">
                  {cats.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveRoute("/wiki")
                        setSelectedNoteId(null)
                        setWikiViewMode("list")
                        setWikiCategoryFilter(cat.id)
                        router.push("/wiki")
                      }}
                      className="nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-hover-text"
                    >
                      <span className="flex shrink-0 items-center justify-center w-5 h-5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color || "var(--sidebar-count)" }}
                        />
                      </span>
                      <span className="truncate text-left flex-1">{cat.name}</span>
                      <span className="text-xs text-sidebar-count tabular-nums">
                        {cat.count}
                      </span>
                    </button>
                  ))}
                  {uncategorized > 0 && (
                    <button
                      onClick={() => {
                        setActiveRoute("/wiki")
                        setSelectedNoteId(null)
                        router.push("/wiki")
                      }}
                      className="nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-hover-text"
                    >
                      <span className="flex shrink-0 items-center justify-center w-5 h-5">
                        <span className="h-2 w-2 rounded-full bg-foreground/20" />
                      </span>
                      <span className="truncate text-left flex-1 text-sidebar-muted">Uncategorized</span>
                      <span className="text-xs text-sidebar-count tabular-nums">
                        {uncategorized}
                      </span>
                    </button>
                  )}
                </Section>
              ) : null
            })()}

            {/* Wiki Views */}
            {renderViewsSection("wiki", "/wiki")}

            {/* Pinned wiki articles */}
            {(() => {
              const pinnedWiki = notes.filter((n) => n.isWiki && !n.trashed && n.pinned)
              return pinnedWiki.length > 0 ? (
                <Section title="Pinned">
                  {pinnedWiki.map((note) => (
                    <button
                      key={note.id}
                      onClick={(e) => openNote(note.id, { forceNewTab: e.ctrlKey || e.metaKey })}
                      className="nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-hover-text"
                    >
                      <span className="flex shrink-0 items-center justify-center w-5 h-5 text-sidebar-muted">
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
                return note?.isWiki
              })
              return recentWiki.length > 0 ? (
                <Section title="Recent">
                  {recentWiki.map((item) => (
                    <button
                      key={item.id}
                      onClick={(e) => openNote(item.id, { forceNewTab: e.ctrlKey || e.metaKey })}
                      className="nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-hover-text"
                    >
                      <span className="flex shrink-0 items-center justify-center w-5 h-5 text-sidebar-muted">
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
            </div>

            {/* Today's Summary */}
            <Section title="Today">
              {(() => {
                const todayStr = new Date().toISOString().slice(0, 10)
                const created = notes.filter(n => !n.trashed && n.createdAt.startsWith(todayStr)).length
                const updated = notes.filter(n => !n.trashed && n.updatedAt.startsWith(todayStr) && !n.createdAt.startsWith(todayStr)).length

                return (
                  <div className="flex flex-col gap-1.5 px-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sidebar-muted">Created</span>
                      <span className="text-sidebar-foreground tabular-nums">{created}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
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
                        className="nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-hover-text"
                      >
                        <span className="flex shrink-0 items-center justify-center w-5 h-5 text-sidebar-muted">
                          <IconDoc size={14} />
                        </span>
                        <span className="truncate text-left flex-1">{note.title || "Untitled"}</span>
                        <span className="text-2xs text-muted-foreground/40 tabular-nums">{relDate}</span>
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
            <div className="space-y-px">
              <NavLink
                href="/ontology"
                icon={<IconOntology size={20} />}
                label="Graph"
                count={allNotesCount > 0 ? allNotesCount : undefined}
                active={isActive("/ontology")}
                dragContent={{ type: "ontology" }}
              />
            </div>

            {/* Node Types legend */}
            <Section title="Node Types">
              <div className="flex flex-col gap-1 px-2.5">
                {[
                  { label: "Inbox", bg: "bg-chart-2" },
                  { label: "Capture", bg: "bg-chart-3" },
                  { label: "Permanent", bg: "bg-chart-5" },
                  { label: "Wiki", bg: "bg-wiki-complete" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full ${item.bg}`} />
                    <span className="text-sidebar-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Ontology Views */}
            {renderViewsSection("ontology", "/ontology")}

            {/* Graph Health */}
            <Section title="Health">
              {(() => {
                const nonTrashedNotes = notes.filter((n) => !n.trashed)
                const totalNodes = nonTrashedNotes.length

                // Orphan nodes: notes with no linksOut and no backlinks (isolated)
                const orphanCount = nonTrashedNotes.filter((n) => {
                  const hasOutLinks = n.linksOut && n.linksOut.length > 0
                  const hasInLinks = nonTrashedNotes.some((other) =>
                    other.id !== n.id && other.linksOut?.some((link) => {
                      const normalized = link.toLowerCase()
                      return n.title.toLowerCase() === normalized ||
                             n.aliases.some((a) => a.toLowerCase() === normalized)
                    })
                  )
                  return !hasOutLinks && !hasInLinks
                }).length

                // Hub nodes: notes with 5+ connections (linksOut + backlinks)
                const hubCount = nonTrashedNotes.filter((n) => {
                  const outCount = n.linksOut?.length ?? 0
                  const inCount = nonTrashedNotes.filter((other) =>
                    other.id !== n.id && other.linksOut?.some((link) => {
                      const normalized = link.toLowerCase()
                      return n.title.toLowerCase() === normalized ||
                             n.aliases.some((a) => a.toLowerCase() === normalized)
                    })
                  ).length
                  return (outCount + inCount) >= 5
                }).length

                // Total edges (links between notes)
                const totalEdges = nonTrashedNotes.reduce((sum, n) => sum + (n.linksOut?.length ?? 0), 0)

                // Density: edges / max possible edges
                const maxEdges = totalNodes * (totalNodes - 1)
                const density = maxEdges > 0 ? Math.round((totalEdges / maxEdges) * 100) : 0

                // Wiki coverage: wiki notes / total notes
                const wikiCount = nonTrashedNotes.filter((n) => n.isWiki).length
                const wikiPercent = totalNodes > 0 ? Math.round((wikiCount / totalNodes) * 100) : 0

                return (
                  <div className="flex flex-col gap-2 px-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sidebar-muted">Nodes</span>
                      <span className="text-sidebar-foreground tabular-nums">{totalNodes}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sidebar-muted">Edges</span>
                      <span className="text-sidebar-foreground tabular-nums">{totalEdges}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sidebar-muted">Orphans</span>
                      <span className={`tabular-nums ${orphanCount > 0 ? "text-chart-3" : "text-sidebar-foreground"}`}>{orphanCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sidebar-muted">Hubs (5+)</span>
                      <span className="text-sidebar-foreground tabular-nums">{hubCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sidebar-muted">Density</span>
                      <span className="text-sidebar-foreground tabular-nums">{density}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sidebar-muted">Wiki Coverage</span>
                      <span className="text-sidebar-foreground tabular-nums">{wikiPercent}%</span>
                    </div>
                  </div>
                )
              })()}
            </Section>

            {/* More */}
            <Section title="More">
              <NavLink
                href="/graph-insights"
                icon={<IconInsight size={20} />}
                label="Insights"
                active={isActive("/graph-insights")}
              />
            </Section>
          </>
        )}

        {/* ── Inbox Context ─────────────────────────── */}
        {activeSpace === "inbox" && (
          <>
            {/* Triage stats card */}
            <div className="mx-1 mb-2 rounded-lg bg-sidebar-hover p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-sidebar-muted">Inbox</span>
                <span className="text-lg font-semibold tabular-nums text-sidebar-foreground">
                  {inboxCount}
                </span>
              </div>
              <div className="h-0.5 rounded-full bg-sidebar-border">
                <div
                  className="h-full rounded-full bg-chart-5 transition-all duration-200"
                  style={{ width: `${inboxCount > 0 ? Math.max(5, Math.min(100, ((allNotesCount - inboxCount) / Math.max(allNotesCount, 1)) * 100)) : 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-px">
              <NavLink
                href="/inbox"
                icon={<IconInbox size={20} />}
                label="Untriaged"
                count={inboxCount > 0 ? inboxCount : undefined}
                active={isActive("/inbox")}
              />
            </div>
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
