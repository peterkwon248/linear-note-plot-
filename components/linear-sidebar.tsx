"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Search,
  Inbox,
  FileText,
  Settings,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Clock,
  Trash2,
  SquarePen,
  Plus,
  CheckSquare2,
  History,
  Tag,
  Bookmark,
  Network,
  LayoutTemplate,
} from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { ALL_SIDEBAR_ROUTES, setActiveRoute, setActiveFolderId, setActiveTagId, setActiveLabelId, useActiveRoute, useActiveFolderId, useActiveTagId, useActiveLabelId } from "@/lib/table-route"
import type { Note, NoteStatus } from "@/lib/types"
import type { PanelContent } from "@/lib/workspace/types"
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

  const className = `nav-item group flex w-full items-center gap-2.5 rounded px-2 py-1 text-[13px] font-normal ${
    active
      ? "bg-sidebar-hover text-sidebar-foreground font-medium"
      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
  }`

  const content = (
    <>
      <span className={`flex shrink-0 items-center justify-center w-4 h-4 ${active ? "text-sidebar-foreground" : "text-sidebar-muted"}`}>
        {icon}
      </span>
      <span className="truncate text-left flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-[11px] text-sidebar-muted/70 tabular-nums font-normal">
          {count}
        </span>
      )}
      {badge && badge.count > 0 && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
          style={{
            backgroundColor: `color-mix(in srgb, ${badge.color} 12%, transparent)`,
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
    <div className="mt-5">
      <div className="flex w-full items-center gap-1 px-2 py-0.5 mb-1">
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-1 items-center gap-1 text-[11px] font-medium text-sidebar-muted/60 hover:text-sidebar-muted"
        >
          <span>{title}</span>
          {open ? (
            <ChevronDown className="h-3 w-3 opacity-50" />
          ) : (
            <ChevronRight className="h-3 w-3 opacity-50" />
          )}
        </button>
        {trailing}
      </div>
      {open && <div className="space-y-px">{children}</div>}
    </div>
  )
}

/* ── Sidebar ─────────────────────────────────────────── */

export function LinearSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const setSearchOpen = usePlotStore((s) => s.setSearchOpen)
  const createNote = usePlotStore((s) => s.createNote)
  const openNote = usePlotStore((s) => s.openNote)
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const createFolder = usePlotStore((s) => s.createFolder)
  const accessFolder = usePlotStore((s) => s.accessFolder)
  const updateFolder = usePlotStore((s) => s.updateFolder)
  const deleteFolder = usePlotStore((s) => s.deleteFolder)

  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const navigationHistory = usePlotStore((s) => s.navigationHistory)
  const navigationIndex = usePlotStore((s) => s.navigationIndex)
  const goBack = usePlotStore((s) => s.goBack)
  const goForward = usePlotStore((s) => s.goForward)

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
    const routes = ["/inbox", "/notes", "/pinned", "/trash", "/settings", "/activity"]
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
  const trashCount = useMemo(() => notes.filter((n) => n.trashed).length, [notes])

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

  const handleCreateNote = () => {
    const id = createNote()
    openNote(id)
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
    <aside className="flex h-full w-full shrink-0 flex-col bg-sidebar-bg border-r border-border/30 select-none overflow-hidden">
      {/* Header row 1: Navigation */}
      <div className="flex items-center gap-1 px-2.5 pt-2.5 pb-1">
        <div className="flex h-[18px] w-[18px] items-center justify-center rounded bg-accent/90 text-[9px] font-semibold text-accent-foreground shrink-0">
          U
        </div>
        <div className="flex items-center ml-1">
          <button
            onClick={() => goBack()}
            disabled={navigationIndex <= 0 && !selectedNoteId}
            className="flex items-center justify-center h-6 w-6 rounded text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Go back"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => goForward()}
            disabled={navigationIndex >= navigationHistory.length - 1}
            className="flex items-center justify-center h-6 w-6 rounded text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Go forward"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="relative ml-auto" ref={recentlyViewedRef}>
          <button
            onClick={() => setRecentlyViewedOpen(!recentlyViewedOpen)}
            className={`flex items-center justify-center h-6 w-6 rounded hover:bg-sidebar-hover ${
              recentlyViewedOpen ? "text-sidebar-foreground bg-sidebar-hover" : "text-sidebar-muted hover:text-sidebar-foreground"
            }`}
            aria-label="Recently viewed"
          >
            <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          {recentlyViewedOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm shadow-xl animate-in fade-in slide-in-from-top-1 duration-100">
              <div className="px-3 py-2 border-b border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground">Recently Viewed</span>
              </div>
              {recentlyViewed.length === 0 ? (
                <div className="px-3 py-4 text-center text-[12px] text-muted-foreground/70">
                  No recently viewed notes
                </div>
              ) : (
                <div className="max-h-[240px] overflow-y-auto py-1">
                  {recentlyViewed.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        openNote(item.id)
                        setRecentlyViewedOpen(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-secondary/40 rounded-sm mx-1 w-[calc(100%-8px)]"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" strokeWidth={1.5} />
                      <span className="truncate text-[12px] text-foreground/90">{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Header row 2: Actions */}
      <div className="flex items-center gap-1 px-2.5 pb-3">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 h-7 flex-1 px-2.5 rounded bg-sidebar-hover/50 hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground text-[12px]"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Search...</span>
          <kbd className="ml-auto text-[10px] text-sidebar-muted/50 font-mono">K</kbd>
        </button>
        <button
          onClick={handleCreateNote}
          className="flex items-center justify-center h-7 w-7 rounded bg-sidebar-hover/50 hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground"
          aria-label="New note"
        >
          <SquarePen className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {/* Top-level nav items (no section header) */}
        <div className="space-y-px">
          <NavLink
            href="/inbox"
            icon={<Inbox className="h-4 w-4" strokeWidth={1.5} />}
            label="Inbox"
            count={inboxCount > 0 ? inboxCount : undefined}
            active={isActive("/inbox")}
          />
          <NavLink
            href="/notes"
            icon={<FileText className="h-4 w-4" strokeWidth={1.5} />}
            label="Notes"
            count={allNotesCount > 0 ? allNotesCount : undefined}
            active={isActive("/notes")}
          />
          <NavLink
            href="/activity"
            icon={<History className="h-4 w-4" strokeWidth={1.5} />}
            label="Activity"
            active={isActive("/activity")}
            dragContent={{ type: "activity" }}
          />
          <NavLink
            href="/tags"
            icon={<Tag className="h-4 w-4" strokeWidth={1.5} />}
            label="Tags"
            active={isActive("/tags")}
            dragContent={{ type: "tags" }}
          />
          <NavLink
            href="/labels"
            icon={<Bookmark className="h-4 w-4" strokeWidth={1.5} />}
            label="Labels"
            active={isActive("/labels")}
            dragContent={{ type: "labels" }}
          />
          <NavLink
            href="/templates"
            icon={<LayoutTemplate className="h-4 w-4" strokeWidth={1.5} />}
            label="Templates"
            active={isActive("/templates")}
            dragContent={{ type: "templates" }}
          />
          <NavLink
            href="/ontology"
            icon={<Network className="h-4 w-4" strokeWidth={1.5} />}
            label="Ontology"
            active={isActive("/ontology")}
            dragContent={{ type: "ontology" }}
          />
        </div>

        {/* Folders section */}
        <Section
          title="Folders"
          trailing={
            <button
              onClick={() => setNewFolderOpen(true)}
              className="flex items-center justify-center h-4 w-4 rounded hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors"
              aria-label="New folder"
            >
              <Plus className="h-3 w-3" />
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
                className="w-full rounded-md border border-sidebar-border bg-sidebar-bg px-2 py-0.5 text-[12px] text-sidebar-foreground placeholder:text-sidebar-muted focus:outline-none focus:ring-1 focus:ring-accent"
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
                    className={`nav-item group flex w-full items-center gap-2 rounded-md px-2 py-1 text-[13px] transition-colors ${
                      active
                        ? "bg-sidebar-hover text-sidebar-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground"
                    }`}
                  >
                    <span className={`flex shrink-0 items-center justify-center w-4 h-4 ${active ? "" : "text-sidebar-muted"}`}>
                      <FolderOpen className="h-4 w-4" />
                    </span>
                    {isRenaming ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={handleRenameSubmit}
                        className="flex-1 rounded border border-sidebar-border bg-sidebar-bg px-1.5 py-0.5 text-[12px] text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate text-left flex-1">{folder.name}</span>
                    )}
                    {!isRenaming && count > 0 && (
                      <span className="text-[11px] text-sidebar-muted tabular-nums">{count}</span>
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
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-[12px] text-sidebar-muted hover:text-sidebar-foreground transition-colors"
            >
              {hiddenFolders.length} more
            </button>
          )}
          {showAllFolders && hiddenFolders.length > 0 && (
            <button
              onClick={() => setShowAllFolders(false)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-[12px] text-sidebar-muted hover:text-sidebar-foreground transition-colors"
            >
              Show less
            </button>
          )}
        </Section>

        {/* Pinned section */}
        {pinnedNotes.length > 0 && (
          <Section title="Pinned">
            {pinnedNotes.map((item) => (
              <button
                key={item.id}
                onClick={() => openNote(item.id)}
                className="nav-item group flex w-full items-center gap-2.5 rounded px-2 py-1 text-[13px] text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
              >
                <StatusIcon status={item.status} />
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
                onClick={() => openNote(item.id)}
                className="nav-item group flex w-full items-center gap-2.5 rounded px-2 py-1 text-[13px] text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
              >
                <StatusIcon status={item.status} />
                <span className="truncate text-left flex-1">{item.title}</span>
              </button>
            ))}
          </Section>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/30 px-2 py-2 space-y-px">
        <NavLink
          href="/trash"
          icon={<Trash2 className="h-4 w-4" strokeWidth={1.5} />}
          label="Trash"
          count={trashCount > 0 ? trashCount : undefined}
          active={isActive("/trash")}
        />
        <NavLink
          href="/settings"
          icon={<Settings className="h-4 w-4" strokeWidth={1.5} />}
          label="Settings"
          active={isActive("/settings")}
        />
      </div>
    </aside>
  )
}
