"use client"

import { useState, useMemo } from "react"
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
  ClipboardCheck,
  Network,
  Bell,
  Trash2,
  SquarePen,
  LayoutGrid,
} from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { getInboxNotes, getReviewQueue } from "@/lib/queries/notes"
import { computeAlerts } from "@/lib/alerts"

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
  return (
    <Link
      href={href}
      className={`nav-item group flex w-full items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors ${
        active
          ? "bg-sidebar-hover text-sidebar-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground"
      }`}
    >
      <span className={`flex shrink-0 items-center justify-center w-4 h-4 ${active ? "" : "text-sidebar-muted"}`}>
        {icon}
      </span>
      <span className="truncate text-left">{label}</span>
      {count !== undefined && (
        <span className="text-[11px] text-sidebar-muted tabular-nums">
          {count}
        </span>
      )}
      {badge && badge.count > 0 && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
          style={{
            backgroundColor: `color-mix(in srgb, ${badge.color} 15%, transparent)`,
            color: badge.color,
          }}
        >
          {badge.count}
        </span>
      )}
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
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        <span>{title}</span>
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>
      {open && <div className="mt-0.5 space-y-px">{children}</div>}
    </div>
  )
}

/* ── Sidebar ─────────────────────────────────────────── */

export function LinearSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setSearchOpen, createNote, openNote, notes, tags, knowledgeMaps, srsStateByNoteId, dismissedAlertIds } =
    usePlotStore()

  const backlinks = useBacklinksIndex()

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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  const handleCreateNote = () => {
    const id = createNote()
    openNote(id)
  }

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-sidebar-bg border-r border-sidebar-border select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground shrink-0">
          U
        </div>
        <span className="flex-1 text-[13px] font-semibold text-sidebar-foreground truncate">
          User
        </span>
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center justify-center h-6 w-6 rounded hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleCreateNote}
          className="flex items-center justify-center h-6 w-6 rounded hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors"
          aria-label="New note"
        >
          <SquarePen className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {/* ── Action items (no section header) ── */}
        <div className="space-y-px">
          <NavLink
            href="/inbox"
            icon={<Inbox className="h-4 w-4" />}
            label="Inbox"
            shortcut="G I"
            count={inboxCount}
            active={isActive("/inbox")}
          />
          <NavLink
            href="/review"
            icon={<ClipboardCheck className="h-4 w-4" />}
            label="Review"
            badge={reviewCount > 0 ? { count: reviewCount, color: "var(--destructive)" } : undefined}
            active={isActive("/review")}
          />
          <NavLink
            href="/alerts"
            icon={<Bell className="h-4 w-4" />}
            label="Alerts"
            badge={alertCount > 0 ? { count: alertCount, color: "var(--chart-3)" } : undefined}
            active={isActive("/alerts")}
          />
        </div>

        {/* ── Notes ── */}
        <Section title="Notes">
          <NavLink
            href="/notes"
            icon={<FileText className="h-4 w-4" />}
            label="All Notes"
            count={allNotesCount}
            shortcut="G N"
            active={isActive("/notes")}
          />
          <NavLink
            href="/pinned"
            icon={<Pin className="h-4 w-4" />}
            label="Pinned"
            count={pinnedCount > 0 ? pinnedCount : undefined}
            active={isActive("/pinned")}
          />
          <NavLink
            href="/tags"
            icon={<Hash className="h-4 w-4" />}
            label="Tags"
            count={tagCount > 0 ? tagCount : undefined}
            active={isActive("/tags")}
          />
        </Section>

        {/* ── Workspace ── */}
        <Section title="Workspace">
          <NavLink
            href="/projects"
            icon={<FolderOpen className="h-4 w-4" />}
            label="Projects"
            shortcut="G P"
            active={isActive("/projects")}
          />
          <NavLink
            href="/views"
            icon={<LayoutGrid className="h-4 w-4" />}
            label="Views"
            shortcut="G V"
            active={isActive("/views")}
          />
          <NavLink
            href="/maps"
            icon={<Network className="h-4 w-4" />}
            label="Maps"
            count={knowledgeMaps.length > 0 ? knowledgeMaps.length : undefined}
            active={isActive("/maps")}
          />
        </Section>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-2 space-y-px">
        <NavLink
          href="/trash"
          icon={<Trash2 className="h-4 w-4" />}
          label="Trash"
          count={trashCount > 0 ? trashCount : undefined}
          active={isActive("/trash")}
        />
        <NavLink
          href="/settings"
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
          active={isActive("/settings")}
        />
      </div>
    </aside>
  )
}
