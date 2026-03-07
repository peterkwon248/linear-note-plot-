"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search,
  Inbox,
  LayoutGrid,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Hash,
  Users,
  BookOpen,
  Archive,
  Pin,
  FolderOpen,
  Layers,
  Shield,
  ClipboardCheck,
  Network,
  Bell,
} from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { getInboxNotes, getCaptureNotes, getPermanentNotes, getReviewQueue } from "@/lib/queries/notes"
import { computeAlerts } from "@/lib/alerts"
import { CreateItemDialog } from "@/components/create-dialog"

/* ── Nav primitives ──────────────────────────────────── */

function NavLink({
  href,
  icon,
  label,
  shortcut,
  count,
  active,
}: {
  href: string
  icon: React.ReactNode
  label: string
  shortcut?: string
  count?: number
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
      <span className="flex-1 truncate text-left">{label}</span>
      {count !== undefined && (
        <span className="text-[11px] text-sidebar-muted tabular-nums">
          {count}
        </span>
      )}
      {shortcut && (
        <span className="hidden text-[11px] text-sidebar-muted font-mono group-hover:inline">
          {shortcut}
        </span>
      )}
    </Link>
  )
}

function NavButton({
  icon,
  label,
  shortcut,
  count,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  shortcut?: string
  count?: number
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`nav-item group flex w-full items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors ${
        active
          ? "bg-sidebar-hover text-sidebar-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground"
      }`}
    >
      <span className={`flex shrink-0 items-center justify-center w-4 h-4 ${active ? "" : "text-sidebar-muted"}`}>
        {icon}
      </span>
      <span className="flex-1 truncate text-left">{label}</span>
      {count !== undefined && (
        <span className="text-[11px] text-sidebar-muted tabular-nums">
          {count}
        </span>
      )}
      {shortcut && (
        <span className="hidden text-[11px] text-sidebar-muted font-mono group-hover:inline">
          {shortcut}
        </span>
      )}
    </button>
  )
}

function Section({
  title,
  children,
  defaultOpen = true,
  action,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  action?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mt-4">
      <div className="group flex w-full items-center gap-1 px-2 py-1">
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-1 items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground transition-colors"
        >
          {open ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span className="flex-1 text-left">{title}</span>
        </button>
        {action && (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            {action}
          </span>
        )}
      </div>
      {open && <div className="mt-0.5 space-y-px">{children}</div>}
    </div>
  )
}

function TeamLink({
  href,
  color,
  name,
  active,
}: {
  href: string
  color: string
  name: string
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
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-semibold text-sidebar-foreground"
        style={{ backgroundColor: color }}
      >
        {name.charAt(0)}
      </span>
      <span className="flex-1 truncate text-left">{name}</span>
      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-sidebar-muted" />
    </Link>
  )
}

/* ── Sidebar ─────────────────────────────────────────── */

export function LinearSidebar() {
  const pathname = usePathname()
  const { setSearchOpen, setSelectedNoteId, notes, folders, tags, knowledgeMaps, createFolder, createTag, srsStateByNoteId, dismissedAlertIds } =
    usePlotStore()

  const backlinks = useBacklinksIndex()

  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [createTagOpen, setCreateTagOpen] = useState(false)

  const inboxCount = useMemo(() => getInboxNotes(notes, backlinks).length, [notes, backlinks])
  const captureCount = useMemo(() => getCaptureNotes(notes).length, [notes])
  const permanentCount = useMemo(() => getPermanentNotes(notes).length, [notes])
  const reviewCount = useMemo(() => getReviewQueue(notes, backlinks, srsStateByNoteId).length, [notes, backlinks, srsStateByNoteId])
  const alertCount = useMemo(() => {
    const dismissed = new Set(dismissedAlertIds ?? [])
    return computeAlerts(notes, srsStateByNoteId, dismissed).length
  }, [notes, srsStateByNoteId, dismissedAlertIds])
  const pinnedNotes = notes.filter((n) => n.pinned && !n.archived).slice(0, 5)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-sidebar-bg border-r border-sidebar-border select-none overflow-hidden">
      {/* Workspace Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-accent">
          <BookOpen className="h-3 w-3 text-accent-foreground" />
        </div>
        <span className="text-[13px] font-semibold text-sidebar-foreground">
          Plot
        </span>
      </div>

      {/* Search */}
      <div className="px-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-secondary/50 px-2.5 py-1.5 text-[13px] text-sidebar-muted transition-colors hover:border-sidebar-muted/30 hover:text-sidebar-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search</span>
          <kbd className="ml-auto inline-flex items-center gap-0.5 rounded border border-sidebar-border bg-secondary px-1 py-0.5 font-mono text-[10px] text-sidebar-muted">
            {"/"}
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
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
            href="/capture"
            icon={<Layers className="h-4 w-4" />}
            label="Capture"
            shortcut="G C"
            count={captureCount}
            active={isActive("/capture")}
          />
          <NavLink
            href="/permanent"
            icon={<Shield className="h-4 w-4" />}
            label="Permanent"
            shortcut="G M"
            count={permanentCount}
            active={isActive("/permanent")}
          />
          <Link
            href="/review"
            className={`group flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-[13px] transition-colors ${
              isActive("/review")
                ? "bg-sidebar-hover text-sidebar-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground"
            }`}
          >
            <span className={`flex shrink-0 items-center justify-center w-4 h-4 ${isActive("/review") ? "" : "text-sidebar-muted"}`}>
              <ClipboardCheck className="h-4 w-4" />
            </span>
            <span className="flex-1 truncate text-left">Review</span>
            {reviewCount > 0 && (
              <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-destructive">
                {reviewCount}
              </span>
            )}
          </Link>
          <Link
            href="/alerts"
            className={`group flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-[13px] transition-colors ${
              isActive("/alerts")
                ? "bg-sidebar-hover text-sidebar-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground"
            }`}
          >
            <span className={`flex shrink-0 items-center justify-center w-4 h-4 ${isActive("/alerts") ? "" : "text-sidebar-muted"}`}>
              <Bell className="h-4 w-4" />
            </span>
            <span className="flex-1 truncate text-left">Alerts</span>
            {alertCount > 0 && (
              <span className="rounded-full bg-chart-3/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-chart-3">
                {alertCount}
              </span>
            )}
          </Link>
          <NavLink
            href="/maps"
            icon={<Network className="h-4 w-4" />}
            label="Maps"
            count={knowledgeMaps.length > 0 ? knowledgeMaps.length : undefined}
            active={isActive("/maps")}
          />
          <NavLink
            href="/notes"
            icon={<FileText className="h-4 w-4" />}
            label="All Notes"
            shortcut="G N"
            active={isActive("/notes")}
          />
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
            href="/archive"
            icon={<Archive className="h-4 w-4" />}
            label="Archive"
            active={isActive("/archive")}
          />
        </div>

        {folders.length > 0 && (
          <Section
            title="Workspace"
            defaultOpen={false}
            action={
              <button
                onClick={() => setCreateFolderOpen(true)}
                className="rounded p-0.5 hover:bg-sidebar-accent transition-colors"
              >
                <Plus className="h-3 w-3 text-sidebar-muted" />
              </button>
            }
          >
            {folders.map((folder) => (
              <TeamLink
                key={folder.id}
                href={`/folder/${folder.id}`}
                color={folder.color}
                name={folder.name}
                active={isActive(`/folder/${folder.id}`)}
              />
            ))}
          </Section>
        )}

        {pinnedNotes.length > 0 && (
          <Section title="Pinned">
            {pinnedNotes.map((note) => (
              <NavButton
                key={note.id}
                icon={<Pin className="h-4 w-4" />}
                label={note.title || "Untitled"}
                onClick={() => setSelectedNoteId(note.id)}
              />
            ))}
          </Section>
        )}

        <Section
          title="Tags"
          defaultOpen={false}
          action={
            <button
              onClick={() => setCreateTagOpen(true)}
              className="rounded p-0.5 hover:bg-sidebar-accent transition-colors"
            >
              <Plus className="h-3 w-3 text-sidebar-muted" />
            </button>
          }
        >
          {tags.map((tag) => {
            const tagNoteCount = notes.filter(
              (n) => n.tags.includes(tag.id) && !n.archived
            ).length
            return (
              <NavLink
                key={tag.id}
                href={`/tag/${tag.id}`}
                icon={<Hash className="h-4 w-4" style={{ color: tag.color }} />}
                label={tag.name}
                count={tagNoteCount}
                active={isActive(`/tag/${tag.id}`)}
              />
            )
          })}
        </Section>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-2">
        <NavLink
          href="/settings"
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
          active={isActive("/settings")}
        />
        <div className="mt-1 flex items-center gap-2 rounded-md px-2 py-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
            U
          </div>
          <span className="text-[13px] text-sidebar-foreground">User</span>
          <Users className="ml-auto h-3.5 w-3.5 text-sidebar-muted" />
        </div>
      </div>

      {/* Create Dialogs */}
      <CreateItemDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        title="Create Folder"
        onCreate={createFolder}
      />
      <CreateItemDialog
        open={createTagOpen}
        onOpenChange={setCreateTagOpen}
        title="Create Tag"
        onCreate={createTag}
      />
    </aside>
  )
}
