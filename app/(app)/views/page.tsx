"use client"

import Link from "next/link"
import { usePlotStore } from "@/lib/store"
import {
  Plus,
  SlidersHorizontal,
  Inbox,
  FileText,
  FolderOpen,
  Pin,
  Archive,
  LayoutGrid,
  Eye,
} from "lucide-react"
import { format } from "date-fns"

/* ── Built-in views ────────────────────────────────────── */

function useBuiltInViews() {
  const notes = usePlotStore((s) => s.notes)

  return [
    {
      label: "Inbox",
      href: "/inbox",
      icon: <Inbox className="h-4 w-4" />,
      count: notes.filter((n) => n.isInbox && !n.archived).length,
      created: "System",
      updated: "System",
      owner: "You",
    },
    {
      label: "All Notes",
      href: "/notes",
      icon: <FileText className="h-4 w-4" />,
      count: notes.filter((n) => !n.archived).length,
      created: "System",
      updated: "System",
      owner: "You",
    },
    {
      label: "Projects",
      href: "/projects",
      icon: <FolderOpen className="h-4 w-4" />,
      count: notes.filter((n) => n.status === "project" && !n.archived).length,
      created: "System",
      updated: "System",
      owner: "You",
    },
    {
      label: "Pinned",
      href: "/notes",
      icon: <Pin className="h-4 w-4" />,
      count: notes.filter((n) => n.pinned && !n.archived).length,
      created: "System",
      updated: "System",
      owner: "You",
    },
    {
      label: "Archive",
      href: "/archive",
      icon: <Archive className="h-4 w-4" />,
      count: notes.filter((n) => n.archived).length,
      created: "System",
      updated: "System",
      owner: "You",
    },
  ]
}

/* ── ViewsPage ─────────────────────────────────────────── */

export default function ViewsPage() {
  const views = useBuiltInViews()

  const today = format(new Date(), "MMM d")

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* Title */}
      <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-1">
        <h1 className="text-base font-semibold text-foreground">Views</h1>
        <button className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80">
          <Plus className="h-3 w-3" />
          New view
        </button>
      </header>

      {/* Tabs + toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pt-1 pb-0">
        <div className="flex items-center gap-0">
          <button className="relative px-3 py-2 text-[13px] font-medium text-foreground">
            Notes
            <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-accent" />
          </button>
          <button className="px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground">
            Projects
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <SlidersHorizontal className="h-3 w-3" />
            Display
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex shrink-0 items-center border-b border-border px-5 py-2">
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-medium text-muted-foreground">Name</span>
        </div>
        <div className="w-[80px] shrink-0 text-right">
          <span className="text-[11px] font-medium text-muted-foreground">Created</span>
        </div>
        <div className="w-[80px] shrink-0 text-right">
          <span className="text-[11px] font-medium text-muted-foreground">Updated</span>
        </div>
        <div className="w-[80px] shrink-0 text-right">
          <span className="text-[11px] font-medium text-muted-foreground">Owner</span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {views.map((view) => (
          <Link
            key={view.label}
            href={view.href}
            className="group flex items-center border-b border-border px-5 py-2.5 transition-colors hover:bg-secondary/30"
          >
            {/* Name */}
            <div className="flex flex-1 items-center gap-2.5 min-w-0 pr-3">
              <span className="text-muted-foreground">{view.icon}</span>
              <span className="truncate text-[13px] text-foreground">{view.label}</span>
            </div>

            {/* Created */}
            <div className="w-[80px] shrink-0 text-right">
              <span className="text-[12px] tabular-nums text-muted-foreground">{today}</span>
            </div>

            {/* Updated */}
            <div className="w-[80px] shrink-0 text-right">
              <span className="text-[12px] tabular-nums text-muted-foreground">{today}</span>
            </div>

            {/* Owner */}
            <div className="w-[80px] shrink-0 flex items-center justify-end gap-1.5">
              <div className="h-4 w-4 rounded-full bg-accent" />
              <span className="text-[12px] text-muted-foreground">You</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
