"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Search,
  Inbox,
  FileText,
  Settings,
  Hash,
  Pin,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ClipboardCheck,
  Network,
  Bell,
  Trash2,
  SquarePen,
  LayoutGrid,
  Clock,
} from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { getInboxNotes, getReviewQueue } from "@/lib/queries/notes"
import { computeAlerts } from "@/lib/alerts"
import { ALL_SIDEBAR_ROUTES, setActiveRoute, useActiveRoute } from "@/lib/table-route"

/* ── Nav primitives ──────────────────────────────────── */

function NavLink({
  href,
  icon,
  label,
  shortcut,
  count,
  badge,
  active,
}: {
  href: string
  icon: React.ReactNode
  label: string
  shortcut?: string
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
      <span className={`flex shrink-0 items-center justify-center w-5 h-5 ${active ? "" : "text-sidebar-muted"}`}>
        {icon}
      </span>
      <span className="truncate text-left">{label}</span>
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

  // Sidebar routes: update state instantly, then push URL async
  if (isSidebarRoute) {
    return (
      <button
        onClick={() => {
          setActiveRoute(href)
          router.push(href)
        }}
        className={className}
      >
        {content}
      </button>
    )
  }

  // Fallback routes (settings): use normal Link
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
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mt-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        <span>{title}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
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
  const tags = usePlotStore((s) => s.tags)
  const knowledgeMaps = usePlotStore((s) => s.knowledgeMaps)
  const srsStateByNoteId = usePlotStore((s) => s.srsStateByNoteId)
  const dismissedAlertIds = usePlotStore((s) => s.dismissedAlertIds)

  const navigationHistory = usePlotStore((s) => s.navigationHistory)
  const navigationIndex = usePlotStore((s) => s.navigationIndex)
  const goBack = usePlotStore((s) => s.goBack)
  const goForward = usePlotStore((s) => s.goForward)

  const backlinks = useBacklinksIndex()

  // Prefetch all sidebar routes on mount so first click doesn't trigger "Compiling..."
  useEffect(() => {
    const routes = ["/inbox", "/review", "/alerts", "/notes", "/pinned", "/tags", "/projects", "/views", "/maps", "/trash", "/settings"]
    routes.forEach((r) => router.prefetch(r))
  }, [router])

  const [recentlyViewedOpen, setRecentlyViewedOpen] = useState(false)
  const recentlyViewedRef = useRef<HTMLDivElement>(null)

  const inboxCount = useMemo(() => getInboxNotes(notes, backlinks).length, [notes, backlinks])
  const reviewCount = useMemo(() => getReviewQueue(notes, backlinks, srsStateByNoteId).length, [notes, backlinks, srsStateByNoteId])
  const alertCount = useMemo(() => {
    const dismissed = new Set(dismissedAlertIds ?? [])
    return computeAlerts(notes, srsStateByNoteId, dismissed).length
  }, [notes, srsStateByNoteId, dismissedAlertIds])
  const allNotesCount = useMemo(() => notes.filter((n) => !n.archived && !n.trashed).length, [notes])
  const pinnedCount = useMemo(() => notes.filter((n) => n.pinned && !n.archived && !n.trashed).length, [notes])
  const tagCount = tags.length
  const trashCount = useMemo(() => notes.filter((n) => n.trashed).length, [notes])

  const recentlyViewed = useMemo(() => {
    const seen = new Set<string>()
    const result: { id: string; title: string }[] = []
    // Walk backwards from current index to get most recent unique notes
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

  const activeRoute = useActiveRoute()
  const isActive = (href: string) => {
    // Sidebar routes: use instant state for zero-delay highlight
    if (ALL_SIDEBAR_ROUTES.includes(href)) return activeRoute === href
    // Fallback routes (settings): use pathname
    return pathname === href || pathname.startsWith(href + "/")
  }

  const handleCreateNote = () => {
    const id = createNote()
    openNote(id)
  }

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-sidebar-bg border-r border-sidebar-border select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3.5 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[12px] font-semibold text-accent-foreground shrink-0">
          U
        </div>
        <button
          onClick={() => goBack()}
          disabled={navigationIndex <= 0}
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => goForward()}
          disabled={navigationIndex >= navigationHistory.length - 1}
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Go forward"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="relative" ref={recentlyViewedRef}>
          <button
            onClick={() => setRecentlyViewedOpen(!recentlyViewedOpen)}
            className={`flex items-center justify-center h-7 w-7 rounded hover:bg-sidebar-hover transition-colors ${
              recentlyViewedOpen ? "text-sidebar-foreground bg-sidebar-hover" : "text-sidebar-muted hover:text-sidebar-foreground"
            }`}
            aria-label="Recently viewed"
            title="Recently viewed"
          >
            <Clock className="h-5 w-5" />
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
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-[13px] text-foreground">{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
        <button
          onClick={handleCreateNote}
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors"
          aria-label="New note"
        >
          <SquarePen className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3.5">
        {/* ── Action items (no section header) ── */}
        <div className="space-y-px">
          <NavLink
            href="/inbox"
            icon={<Inbox className="h-5 w-5" />}
            label="Inbox"
            shortcut="G I"
            count={inboxCount}
            active={isActive("/inbox")}
          />
          <NavLink
            href="/review"
            icon={<ClipboardCheck className="h-5 w-5" />}
            label="Review"
            badge={reviewCount > 0 ? { count: reviewCount, color: "var(--destructive)" } : undefined}
            active={isActive("/review")}
          />
          <NavLink
            href="/alerts"
            icon={<Bell className="h-5 w-5" />}
            label="Alerts"
            badge={alertCount > 0 ? { count: alertCount, color: "var(--chart-3)" } : undefined}
            active={isActive("/alerts")}
          />
        </div>

        {/* ── Notes ── */}
        <Section title="Notes">
          <NavLink
            href="/notes"
            icon={<FileText className="h-5 w-5" />}
            label="All Notes"
            count={allNotesCount}
            shortcut="G N"
            active={isActive("/notes")}
          />
          <NavLink
            href="/pinned"
            icon={<Pin className="h-5 w-5" />}
            label="Pinned"
            count={pinnedCount > 0 ? pinnedCount : undefined}
            active={isActive("/pinned")}
          />
          <NavLink
            href="/tags"
            icon={<Hash className="h-5 w-5" />}
            label="Tags"
            count={tagCount > 0 ? tagCount : undefined}
            active={isActive("/tags")}
          />
        </Section>

        {/* ── Workspace ── */}
        <Section title="Workspace">
          <NavLink
            href="/projects"
            icon={<FolderOpen className="h-5 w-5" />}
            label="Projects"
            shortcut="G P"
            active={isActive("/projects")}
          />
          <NavLink
            href="/views"
            icon={<LayoutGrid className="h-5 w-5" />}
            label="Views"
            shortcut="G V"
            active={isActive("/views")}
          />
          <NavLink
            href="/maps"
            icon={<Network className="h-5 w-5" />}
            label="Maps"
            count={knowledgeMaps.length > 0 ? knowledgeMaps.length : undefined}
            active={isActive("/maps")}
          />
        </Section>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2.5 py-2 space-y-px">
        <NavLink
          href="/trash"
          icon={<Trash2 className="h-5 w-5" />}
          label="Trash"
          count={trashCount > 0 ? trashCount : undefined}
          active={isActive("/trash")}
        />
        <NavLink
          href="/settings"
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          active={isActive("/settings")}
        />
      </div>
    </aside>
  )
}
