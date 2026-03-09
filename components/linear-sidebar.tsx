"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Search,
  Inbox,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Trash2,
  SquarePen,
  Plus,
  Folder,
} from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { getInboxNotes } from "@/lib/queries/notes"
import { ALL_SIDEBAR_ROUTES, setActiveRoute, useActiveRoute } from "@/lib/table-route"

/* ── Status Icons (rounded squares - Plot's identity) ─────── */

function StatusIconInbox({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      strokeWidth={1.4}
      className={className}
    >
      <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" />
    </svg>
  )
}

function StatusIconCapture({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={className}>
      <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth={1.4} />
      <rect x="2" y="7" width="10" height="5" rx="1" fill="currentColor" />
    </svg>
  )
}

function StatusIconPermanent({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={className}>
      <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor" />
      <path d="M5 7L6.5 8.5L9 5.5" stroke="white" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getStatusIcon(status: string, className?: string) {
  switch (status) {
    case "capture":
      return <StatusIconCapture className={className} />
    case "permanent":
    case "reference":
      return <StatusIconPermanent className={className} />
    default:
      return <StatusIconInbox className={className} />
  }
}

/* ── Nav primitives ──────────────────────────────────── */

function NavLink({
  href,
  icon,
  label,
  count,
  active,
}: {
  href: string
  icon: React.ReactNode
  label: string
  count?: number
  active?: boolean
}) {
  const router = useRouter()
  const isSidebarRoute = ALL_SIDEBAR_ROUTES.includes(href)

  const className = `nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-normal transition-colors ${
    active
      ? "bg-zinc-800 text-zinc-100"
      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
  }`

  const content = (
    <>
      <span className={`flex shrink-0 items-center justify-center w-4 h-4 ${active ? "text-zinc-300" : "text-zinc-600 group-hover:text-zinc-400"}`}>
        {icon}
      </span>
      <span className="flex-1 truncate text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[12px] text-zinc-600 tabular-nums">
          {count}
        </span>
      )}
    </>
  )

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

function FooterLink({
  href,
  icon,
  label,
  count,
  active,
}: {
  href: string
  icon: React.ReactNode
  label: string
  count?: number
  active?: boolean
}) {
  const router = useRouter()
  const isSidebarRoute = ALL_SIDEBAR_ROUTES.includes(href)

  const className = `nav-item group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-normal transition-colors ${
    active
      ? "bg-zinc-800 text-zinc-400"
      : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50"
  }`

  const content = (
    <>
      <span className="flex shrink-0 items-center justify-center w-4 h-4 text-zinc-600 group-hover:text-zinc-500">
        {icon}
      </span>
      <span className="flex-1 truncate text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[12px] text-zinc-700 tabular-nums">
          {count}
        </span>
      )}
    </>
  )

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

/* ── Collapsible Section ─────────────────────────────── */

function Section({
  title,
  children,
  defaultOpen = true,
  onAdd,
  className = "",
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  onAdd?: () => void
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={className}>
      <div className="flex items-center justify-between px-2.5 py-1">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <span>{title}</span>
          {open ? (
            <ChevronDown className="h-3 w-3" strokeWidth={1.4} />
          ) : (
            <ChevronRight className="h-3 w-3" strokeWidth={1.4} />
          )}
        </button>
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center justify-center h-4 w-4 rounded text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-colors"
            aria-label={`Add ${title.toLowerCase()}`}
          >
            <Plus className="h-3 w-3" strokeWidth={1.4} />
          </button>
        )}
      </div>
      {open && <div className="mt-0.5 space-y-px">{children}</div>}
    </div>
  )
}

/* ── Folder Tree Item ────────────────────────────────── */

function FolderItem({
  folder,
  active,
  level = 0,
  children,
}: {
  folder: { id: string; name: string; color: string }
  active: boolean
  level?: number
  children?: React.ReactNode
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)
  const hasChildren = Boolean(children)

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            setExpanded(!expanded)
          } else {
            router.push(`/folder/${folder.id}`)
          }
        }}
        className={`nav-item group flex w-full items-center gap-2 rounded-md px-2.5 py-1 text-[12px] font-normal transition-colors ${
          active
            ? "bg-zinc-800 text-zinc-300"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
        }`}
        style={{ paddingLeft: `${10 + level * 16}px` }}
      >
        {hasChildren && (
          <span className="flex shrink-0 items-center justify-center w-3 h-3 text-zinc-600">
            {expanded ? (
              <ChevronDown className="h-3 w-3" strokeWidth={1.4} />
            ) : (
              <ChevronRight className="h-3 w-3" strokeWidth={1.4} />
            )}
          </span>
        )}
        <span
          className="shrink-0 w-[6px] h-[6px] rounded-full"
          style={{ backgroundColor: folder.color }}
        />
        <span className="truncate">{folder.name}</span>
      </button>
      {hasChildren && expanded && (
        <div className="space-y-px">{children}</div>
      )}
    </div>
  )
}

/* ── Recent Note Item ────────────────────────────────── */

function RecentNoteItem({
  note,
  onClick,
}: {
  note: { id: string; title: string; status: string }
  onClick: () => void
}) {
  const statusColor = note.status === "permanent" || note.status === "reference"
    ? "text-green-400"
    : note.status === "capture"
    ? "text-orange-400"
    : "text-zinc-500"

  return (
    <button
      onClick={onClick}
      className="nav-item group flex w-full items-center gap-2 rounded-md px-2.5 py-1 text-[12px] font-normal text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/50 transition-colors"
    >
      <span className={`flex shrink-0 items-center justify-center w-3 h-3 ${statusColor}`}>
        {getStatusIcon(note.status, "w-3 h-3")}
      </span>
      <span className="truncate">{note.title || "Untitled"}</span>
    </button>
  )
}

/* ── Empty States ────────────────────────────────────── */

function EmptyFolders({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="px-2.5 py-3 text-center">
      <p className="text-[12px] text-zinc-600">No folders yet.</p>
      <button
        onClick={onAdd}
        className="mt-1 inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-400 transition-colors"
      >
        <Plus className="h-3 w-3" strokeWidth={1.4} />
        <span>Create one</span>
      </button>
    </div>
  )
}

function EmptyRecent() {
  return (
    <div className="px-2.5 py-3">
      <p className="text-[12px] text-zinc-600">No recent notes.</p>
    </div>
  )
}

/* ── Main Sidebar ────────────────────────────────────── */

export function LinearSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const setSearchOpen = usePlotStore((s) => s.setSearchOpen)
  const createNote = usePlotStore((s) => s.createNote)
  const openNote = usePlotStore((s) => s.openNote)
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const createFolder = usePlotStore((s) => s.createFolder)
  const navigationHistory = usePlotStore((s) => s.navigationHistory)
  const navigationIndex = usePlotStore((s) => s.navigationIndex)

  const backlinks = useBacklinksIndex()

  // Prefetch sidebar routes
  useEffect(() => {
    const routes = ["/inbox", "/notes", "/trash", "/settings"]
    routes.forEach((r) => router.prefetch(r))
  }, [router])

  // Counts
  const inboxCount = useMemo(() => getInboxNotes(notes, backlinks).length, [notes, backlinks])
  const allNotesCount = useMemo(() => notes.filter((n) => !n.archived && !n.trashed).length, [notes])
  const trashCount = useMemo(() => notes.filter((n) => n.trashed).length, [notes])

  // Recent notes (last 5 unique)
  const recentNotes = useMemo(() => {
    const seen = new Set<string>()
    const result: { id: string; title: string; status: string }[] = []
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
  const isActive = (href: string) => {
    if (ALL_SIDEBAR_ROUTES.includes(href)) return activeRoute === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  const handleCreateNote = () => {
    const id = createNote()
    openNote(id)
  }

  const handleCreateFolder = () => {
    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#06b6d4"]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    createFolder(`New Folder`, randomColor)
  }

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-zinc-900/60 border-r border-zinc-800 select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3">
        {/* Logo */}
        <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-500/20 text-[11px] font-semibold text-indigo-400">
          P
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-center h-6 w-6 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
            aria-label="Search"
          >
            <Search className="h-[15px] w-[15px]" strokeWidth={1.4} />
          </button>
          <button
            onClick={handleCreateNote}
            className="flex items-center justify-center h-6 w-6 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
            aria-label="New note"
          >
            <SquarePen className="h-[15px] w-[15px]" strokeWidth={1.4} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2">
        {/* System Navigation (no section header) */}
        <div className="space-y-px">
          <NavLink
            href="/inbox"
            icon={<Inbox className="h-4 w-4" strokeWidth={1.4} />}
            label="Inbox"
            count={inboxCount}
            active={isActive("/inbox")}
          />
          <NavLink
            href="/notes"
            icon={<FileText className="h-4 w-4" strokeWidth={1.4} />}
            label="Notes"
            count={allNotesCount}
            active={isActive("/notes")}
          />
        </div>

        {/* Folders Section */}
        <Section
          title="folders"
          className="mt-8"
          onAdd={handleCreateFolder}
        >
          {folders.length === 0 ? (
            <EmptyFolders onAdd={handleCreateFolder} />
          ) : (
            <div className="space-y-px">
              {folders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  active={pathname === `/folder/${folder.id}`}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Recent Section */}
        <Section title="recent" className="mt-6">
          {recentNotes.length === 0 ? (
            <EmptyRecent />
          ) : (
            <div className="space-y-px">
              {recentNotes.map((note) => (
                <RecentNoteItem
                  key={note.id}
                  note={note}
                  onClick={() => openNote(note.id)}
                />
              ))}
            </div>
          )}
        </Section>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="border-t border-zinc-800 px-2 py-2 space-y-px">
        <FooterLink
          href="/trash"
          icon={<Trash2 className="h-4 w-4" strokeWidth={1.4} />}
          label="Trash"
          count={trashCount}
          active={isActive("/trash")}
        />
        <FooterLink
          href="/settings"
          icon={<Settings className="h-4 w-4" strokeWidth={1.4} />}
          label="Settings"
          active={isActive("/settings")}
        />
      </div>
    </aside>
  )
}
