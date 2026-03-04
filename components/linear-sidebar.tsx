"use client"

import { useState } from "react"
import Link from "next/link"
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
} from "lucide-react"
import { usePlotStore } from "@/lib/store"
import type { ActiveView } from "@/lib/types"
import { CreateItemDialog } from "@/components/create-dialog"

interface NavItemProps {
  icon: React.ReactNode
  label: string
  shortcut?: string
  active?: boolean
  count?: number
  onClick?: () => void
}

function NavItem({ icon, label, shortcut, active, count, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-[13px] transition-colors ${
        active
          ? "bg-sidebar-hover text-sidebar-foreground"
          : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
      }`}
    >
      <span className="flex shrink-0 items-center justify-center w-4 h-4">{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      {count !== undefined && (
        <span className="text-[11px] text-sidebar-muted tabular-nums">{count}</span>
      )}
      {shortcut && (
        <span className="hidden text-[11px] text-sidebar-muted font-mono group-hover:inline">
          {shortcut}
        </span>
      )}
    </button>
  )
}

interface SectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  action?: React.ReactNode
}

function Section({ title, children, defaultOpen = true, action }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="group flex w-full items-center gap-1 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <span className="flex-1 text-left">{title}</span>
        {action && (
          <span
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {action}
          </span>
        )}
      </button>
      {open && <div className="mt-0.5 space-y-px">{children}</div>}
    </div>
  )
}

interface TeamItemProps {
  color: string
  name: string
  active?: boolean
  onClick?: () => void
}

function TeamItem({ color, name, active, onClick }: TeamItemProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-[13px] transition-colors ${
        active
          ? "bg-sidebar-hover text-sidebar-foreground"
          : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
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
    </button>
  )
}

export function LinearSidebar() {
  const {
    activeView,
    setActiveView,
    setSearchOpen,
    setSelectedNoteId,
    notes,
    folders,
    tags,
    categories,
    createFolder,
    createTag,
    createCategory,
  } = usePlotStore()

  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [createTagOpen, setCreateTagOpen] = useState(false)
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)

  const isActive = (check: ActiveView) => {
    if (check.type !== activeView.type) return false
    if (check.type === "folder" && activeView.type === "folder")
      return check.folderId === activeView.folderId
    if (check.type === "category" && activeView.type === "category")
      return check.categoryId === activeView.categoryId
    if (check.type === "tag" && activeView.type === "tag")
      return check.tagId === activeView.tagId
    return true
  }

  const inboxCount = notes.filter((n) => n.isInbox && !n.archived).length
  const pinnedNotes = notes.filter((n) => n.pinned && !n.archived).slice(0, 5)

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col bg-sidebar-bg border-r border-sidebar-border select-none">
      {/* Workspace Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-accent">
          <BookOpen className="h-3 w-3 text-accent-foreground" />
        </div>
        <span className="text-[13px] font-semibold text-sidebar-foreground">Plot</span>
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
          <NavItem
            icon={<Inbox className="h-4 w-4" />}
            label="Inbox"
            shortcut="G I"
            count={inboxCount}
            active={isActive({ type: "inbox" })}
            onClick={() => setActiveView({ type: "inbox" })}
          />
          <NavItem
            icon={<FileText className="h-4 w-4" />}
            label="All Notes"
            shortcut="G M"
            active={isActive({ type: "all" })}
            onClick={() => setActiveView({ type: "all" })}
          />
          <NavItem
            icon={<LayoutGrid className="h-4 w-4" />}
            label="Views"
            shortcut="G V"
            active={isActive({ type: "views" })}
            onClick={() => setActiveView({ type: "views" })}
          />
        </div>

        <Section
          title="Workspace"
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
            <TeamItem
              key={folder.id}
              color={folder.color}
              name={folder.name}
              active={isActive({ type: "folder", folderId: folder.id })}
              onClick={() => setActiveView({ type: "folder", folderId: folder.id })}
            />
          ))}
          <NavItem
            icon={<Archive className="h-4 w-4" />}
            label="Archive"
            active={isActive({ type: "archive" })}
            onClick={() => setActiveView({ type: "archive" })}
          />
          <NavItem
            icon={<FileText className="h-4 w-4" />}
            label="Templates"
            active={isActive({ type: "templates" })}
            onClick={() => setActiveView({ type: "templates" })}
          />
          <NavItem
            icon={<BarChart3 className="h-4 w-4" />}
            label="Insights"
            active={isActive({ type: "insights" })}
            onClick={() => setActiveView({ type: "insights" })}
          />
        </Section>

        <Section
          title="Categories"
          action={
            <button
              onClick={() => setCreateCategoryOpen(true)}
              className="rounded p-0.5 hover:bg-sidebar-accent transition-colors"
            >
              <Plus className="h-3 w-3 text-sidebar-muted" />
            </button>
          }
        >
          {categories.map((cat) => (
            <TeamItem
              key={cat.id}
              color={cat.color}
              name={cat.name}
              active={isActive({ type: "category", categoryId: cat.id })}
              onClick={() => setActiveView({ type: "category", categoryId: cat.id })}
            />
          ))}
        </Section>

        {pinnedNotes.length > 0 && (
          <Section title="Pinned">
            {pinnedNotes.map((note) => (
              <NavItem
                key={note.id}
                icon={<Pin className="h-4 w-4" />}
                label={note.title || "Untitled"}
                active={isActive({ type: "pinned" })}
                onClick={() => {
                  setActiveView({ type: "pinned" })
                  setSelectedNoteId(note.id)
                }}
              />
            ))}
          </Section>
        )}

        <Section
          title="Tags"
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
              <NavItem
                key={tag.id}
                icon={<Hash className="h-4 w-4" style={{ color: tag.color }} />}
                label={tag.name}
                count={tagNoteCount}
                active={isActive({ type: "tag", tagId: tag.id })}
                onClick={() => setActiveView({ type: "tag", tagId: tag.id })}
              />
            )
          })}
        </Section>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-2">
        <Link
          href="/settings"
          className="group flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-[13px] text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground"
        >
          <span className="flex shrink-0 items-center justify-center w-4 h-4">
            <Settings className="h-4 w-4" />
          </span>
          <span className="flex-1 truncate text-left">Settings</span>
        </Link>
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
      <CreateItemDialog
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        title="Create Category"
        onCreate={createCategory}
      />
    </aside>
  )
}
