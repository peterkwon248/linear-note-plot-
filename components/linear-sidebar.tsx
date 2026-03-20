"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, ChevronRight } from "lucide-react"
import {
  IconInbox,
  IconNotes,
  IconWiki,
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
import { usePlotStore } from "@/lib/store"
import { ALL_SIDEBAR_ROUTES, setActiveRoute, setActiveFolderId, setActiveTagId, setActiveLabelId, useActiveRoute, useActiveFolderId, useActiveTagId, useActiveLabelId, useActiveSpace } from "@/lib/table-route"
import type { Note, NoteStatus, ActivitySpace } from "@/lib/types"
import type { PanelContent } from "@/lib/workspace/types"
import { setViewDragData, setNoteDragData } from "@/lib/drag-helpers"
import { LayoutModeSwitcher } from "@/components/editor/layout-mode-switcher"
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
      ? "bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.93)]"
      : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-[rgba(255,255,255,0.85)]"
  }`

  const content = (
    <>
      <span className={`flex shrink-0 items-center justify-center w-5 h-5 ${active ? "text-[rgba(255,255,255,0.93)]" : "text-sidebar-muted group-hover:text-[rgba(255,255,255,0.65)]"}`}>
        {icon}
      </span>
      <span className="truncate text-left flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-[rgba(255,255,255,0.35)] tabular-nums">
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
          if (href === "/notes" || href === "/inbox") {
            setActiveFolderId(null)
            setActiveTagId(null)
            setActiveLabelId(null)
          }
          setActiveRoute(href)
          setNoteId(null)
          router.push(href)
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
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
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

  const setSidebarCollapsed = usePlotStore((s) => s.setSidebarCollapsed)

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
    if (renamingItem) setTimeout(() => renameInputRef.current?.focus(), 0)
  }, [renamingItem])

  const inboxCount = useMemo(() => notes.filter((n) => n.status === "inbox" && !n.archived && !n.trashed && n.triageStatus !== "trashed").length, [notes])
  const allNotesCount = useMemo(() => notes.filter((n) => !n.archived && !n.trashed).length, [notes])
  const captureCount = useMemo(() => notes.filter((n) => n.status === "capture" && !n.archived && !n.trashed).length, [notes])
  const permanentCount = useMemo(() => notes.filter((n) => n.status === "permanent" && !n.archived && !n.trashed).length, [notes])
  const trashCount = useMemo(() => notes.filter((n) => n.trashed).length, [notes])
  const wikiCount = useMemo(() => notes.filter((n) => n.isWiki && !n.trashed).length, [notes])
  const wikiStubCount = useMemo(() => notes.filter((n) => n.isWiki && n.wikiStatus === "stub" && !n.trashed).length, [notes])

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
    notes.filter((n) => n.pinned && !n.trashed && !n.archived),
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
      createFolder(name, "#5e6ad2")
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
    if (name) updateFolder(renamingItem.id, { name })
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

  const notesInFolder = (folderId: string) =>
    notes.filter((n) => n.folderId === folderId && !n.archived && !n.trashed).length

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
        <LayoutModeSwitcher />
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
                            ? "bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.93)]"
                            : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-[rgba(255,255,255,0.85)]"
                        }`}
                      >
                        <span className={`flex shrink-0 items-center justify-center w-5 h-5 ${active ? "text-[rgba(255,255,255,0.93)]" : "text-sidebar-muted group-hover:text-[rgba(255,255,255,0.65)]"}`}>
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
                          <span className="text-xs text-[rgba(255,255,255,0.35)] tabular-nums">{count}</span>
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
                    className="nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-[rgba(255,255,255,0.85)]"
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
                    className="nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-[rgba(255,255,255,0.85)]"
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
                label="All Articles"
                count={wikiCount > 0 ? wikiCount : undefined}
                active={isActive("/wiki")}
              />
              <NavLink
                href="/wiki"
                icon={<span className="h-2 w-2 rounded-full bg-[#f5a623]" />}
                label="Stubs"
                count={wikiStubCount > 0 ? wikiStubCount : undefined}
                active={false}
              />
            </div>

            {/* Recent wiki articles */}
            {recentNotes.length > 0 && (
              <Section title="Recent">
                {recentNotes
                  .filter((item) => {
                    const note = notes.find((n) => n.id === item.id)
                    return note?.isWiki
                  })
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={(e) => openNote(item.id, { forceNewTab: e.ctrlKey || e.metaKey })}
                      className="nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-[rgba(255,255,255,0.85)]"
                    >
                      <span className="flex shrink-0 items-center justify-center w-5 h-5 text-sidebar-muted">
                        <IconDoc size={14} />
                      </span>
                      <span className="truncate text-left flex-1">{item.title}</span>
                    </button>
                  ))}
              </Section>
            )}
          </>
        )}

        {/* ── Ontology (Graph) Context ──────────────── */}
        {activeSpace === "ontology" && (
          <>
            <div className="space-y-px">
              <NavLink
                href="/ontology"
                icon={<IconOntology size={20} />}
                label="All Nodes"
                count={allNotesCount > 0 ? allNotesCount : undefined}
                active={isActive("/ontology")}
                dragContent={{ type: "ontology" }}
              />
            </div>

            {/* Node Types legend */}
            <Section title="Node Types">
              <div className="flex flex-col gap-1 px-2.5">
                {[
                  { label: "Note", color: "text-sidebar-muted", desc: "일반 노트" },
                  { label: "Wiki", color: "text-accent", desc: "위키 문서" },
                  { label: "Stub", color: "text-sidebar-muted/50", desc: "미완성 위키" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full ${item.color === "text-accent" ? "bg-accent" : "bg-sidebar-muted"}`} />
                    <span className="flex-1 text-sidebar-foreground">{item.label}</span>
                    <span className="text-sidebar-muted">{item.desc}</span>
                  </div>
                ))}
              </div>
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
                  className="h-full rounded-full bg-[#45d483] transition-all duration-300"
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
              <NavLink
                href="/notes"
                icon={<IconNotes size={20} />}
                label="All Notes"
                count={allNotesCount > 0 ? allNotesCount : undefined}
                active={isActive("/notes")}
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
