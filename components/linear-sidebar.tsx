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
} from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { getInboxNotes } from "@/lib/queries/notes"
import { ALL_SIDEBAR_ROUTES, setActiveRoute, setActiveFolderId, useActiveRoute, useActiveFolderId } from "@/lib/table-route"
import type { Note, NoteStatus } from "@/lib/types"
import { StatusIcon } from "@/components/status-icon"

/* ── Nav primitives ──────────────────────────────────── */

function NavLink({
  href,
  icon,
  label,
  count,
  badge,
  active,
}: {
  href: string
  icon: React.ReactNode
  label: string
  count?: number
  badge?: { count: number; color: string }
  active?: boolean
}) {
  const router = useRouter()
  const isSidebarRoute = ALL_SIDEBAR_ROUTES.includes(href)

  const className = `nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[15px] transition-colors ${
    active
      ? "bg-sidebar-hover text-sidebar-foreground"
      : "text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground"
  }`

  const content = (
    <>
      <span className={`flex shrink-0 items-center justify-center w-5 h-5 ${active ? "opacity-100" : "text-sidebar-muted opacity-60"}`}>
        {icon}
      </span>
      <span className="truncate text-left flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-[12px] text-sidebar-muted tabular-nums">
          {count}
        </span>
      )}
      {badge && badge.count > 0 && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums"
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

  if (isSidebarRoute) {
    return (
      <button
        onClick={() => {
          if (href === "/notes") setActiveFolderId(null)
          setActiveRoute(href)
          router.push(href)
        }}
        className={className}
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
          className="flex flex-1 items-center gap-1.5 text-[12px] font-medium text-sidebar-muted hover:text-sidebar-foreground transition-colors"
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
  const setSearchOpen = usePlotStore((s) => s.setSearchOpen)
  const createNote = usePlotStore((s) => s.createNote)
  const openNote = usePlotStore((s) => s.openNote)
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const createFolder = usePlotStore((s) => s.createFolder)
  const accessFolder = usePlotStore((s) => s.accessFolder)

  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const navigationHistory = usePlotStore((s) => s.navigationHistory)
  const navigationIndex = usePlotStore((s) => s.navigationIndex)
  const goBack = usePlotStore((s) => s.goBack)
  const goForward = usePlotStore((s) => s.goForward)

  const backlinks = useBacklinksIndex()

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

  useEffect(() => {
    if (newFolderOpen) {
      setTimeout(() => newFolderInputRef.current?.focus(), 0)
    }
  }, [newFolderOpen])

  const inboxCount = useMemo(() => getInboxNotes(notes, backlinks).length, [notes, backlinks])
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
  const isActive = (href: string) => {
    if (ALL_SIDEBAR_ROUTES.includes(href)) {
      // /notes is active only when no folder filter is applied
      if (href === "/notes") return activeRoute === "/notes" && activeFolderId === null
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

  const notesInFolder = (folderId: string) =>
    notes.filter((n) => n.folderId === folderId && !n.archived && !n.trashed).length

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-sidebar-bg border-r border-sidebar-border select-none overflow-hidden">
      {/* Header row 1: Navigation */}
      <div className="flex items-center gap-1 px-3.5 pt-3 pb-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[12px] font-semibold text-accent-foreground shrink-0">
          U
        </div>
        <button
          onClick={() => goBack()}
          disabled={navigationIndex <= 0 && !selectedNoteId}
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-sidebar-hover text-sidebar-foreground hover:text-sidebar-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Go back"
        >
          <ChevronLeft className="h-4.5 w-4.5" strokeWidth={1.6} />
        </button>
        <button
          onClick={() => goForward()}
          disabled={navigationIndex >= navigationHistory.length - 1}
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-sidebar-hover text-sidebar-foreground hover:text-sidebar-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Go forward"
        >
          <ChevronRight className="h-4.5 w-4.5" strokeWidth={1.6} />
        </button>
        <div className="relative" ref={recentlyViewedRef}>
          <button
            onClick={() => setRecentlyViewedOpen(!recentlyViewedOpen)}
            className={`flex items-center justify-center h-7 w-7 rounded hover:bg-sidebar-hover transition-colors ${
              recentlyViewedOpen ? "text-sidebar-foreground bg-sidebar-hover" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
            }`}
            aria-label="Recently viewed"
          >
            <Clock className="h-4 w-4" strokeWidth={1.6} />
          </button>
          {recentlyViewedOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-lg border border-border bg-popover shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-2 border-b border-border">
                <span className="text-[12px] font-medium text-muted-foreground">Recently Viewed</span>
              </div>
              {recentlyViewed.length === 0 ? (
                <div className="px-3 py-4 text-center text-[13px] text-muted-foreground">
                  No recently viewed notes
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto py-1">
                  {recentlyViewed.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        openNote(item.id)
                        setRecentlyViewedOpen(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-secondary/50"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.4} />
                      <span className="truncate text-[13px] text-foreground">{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Header row 2: Actions */}
      <div className="flex items-center gap-1 px-3.5 pb-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 h-7 px-2.5 rounded-md hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors text-[13px]"
          aria-label="Search"
        >
          <Search className="h-4 w-4" strokeWidth={1.4} />
          <span>Search</span>
        </button>
        <div className="flex-1" />
        <button
          onClick={handleCreateNote}
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors"
          aria-label="New note"
        >
          <SquarePen className="h-4.5 w-4.5" strokeWidth={1.4} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3.5">
        {/* Top-level nav items (no section header) */}
        <div className="space-y-px">
          <NavLink
            href="/inbox"
            icon={<Inbox className="h-5 w-5" strokeWidth={1.4} />}
            label="Inbox"
            count={inboxCount > 0 ? inboxCount : undefined}
            active={isActive("/inbox")}
          />
          <NavLink
            href="/notes"
            icon={<FileText className="h-5 w-5" strokeWidth={1.4} />}
            label="Notes"
            count={allNotesCount > 0 ? allNotesCount : undefined}
            active={isActive("/notes")}
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
              <Plus className="h-3.5 w-3.5" />
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
                className="w-full rounded-md border border-sidebar-border bg-sidebar-bg px-2.5 py-1 text-[14px] text-sidebar-foreground placeholder:text-sidebar-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          )}
          {displayedFolders.map((folder) => {
            const count = notesInFolder(folder.id)
            const active = isFolderActive(folder.id)
            return (
              <button
                key={folder.id}
                onClick={() => {
                  accessFolder(folder.id)
                  setActiveFolderId(folder.id)
                  setActiveRoute("/notes")
                  router.push("/notes")
                }}
                className={`nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[15px] transition-colors ${
                  active
                    ? "bg-sidebar-hover text-sidebar-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground"
                }`}
              >
                <span className={`flex shrink-0 items-center justify-center w-5 h-5 ${active ? "" : "text-sidebar-muted"}`}>
                  <FolderOpen className="h-5 w-5" />
                </span>
                <span className="truncate text-left flex-1">{folder.name}</span>
                {count > 0 && (
                  <span className="text-[12px] text-sidebar-muted tabular-nums">{count}</span>
                )}
              </button>
            )
          })}
          {hiddenFolders.length > 0 && !showAllFolders && (
            <button
              onClick={() => setShowAllFolders(true)}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-sidebar-muted hover:text-sidebar-foreground transition-colors"
            >
              {hiddenFolders.length} more
            </button>
          )}
          {showAllFolders && hiddenFolders.length > 0 && (
            <button
              onClick={() => setShowAllFolders(false)}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-sidebar-muted hover:text-sidebar-foreground transition-colors"
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
                className="nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[15px] transition-colors text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground"
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
                onClick={() => openNote(item.id)}
                className="nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[15px] transition-colors text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground"
              >
                <span className="flex shrink-0 items-center justify-center w-5 h-5 text-sidebar-muted">
                  <StatusIcon status={item.status} />
                </span>
                <span className="truncate text-left flex-1">{item.title}</span>
              </button>
            ))}
          </Section>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2.5 py-2 space-y-px">
        <NavLink
          href="/trash"
          icon={<Trash2 className="h-5 w-5" strokeWidth={1.4} />}
          label="Trash"
          count={trashCount > 0 ? trashCount : undefined}
          active={isActive("/trash")}
        />
        <NavLink
          href="/settings"
          icon={<Settings className="h-5 w-5" strokeWidth={1.4} />}
          label="Settings"
          active={isActive("/settings")}
        />
      </div>
    </aside>
  )
}
