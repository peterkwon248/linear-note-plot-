"use client"

import { usePlotStore } from "@/lib/store"
import { FileText, Eye, Plus, Inbox, Pin, Archive, FolderOpen, Hash } from "lucide-react"
import Link from "next/link"

export default function ViewsPage() {
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const tags = usePlotStore((s) => s.tags)

  const savedViews = [
    {
      label: "Inbox",
      href: "/inbox",
      icon: <Inbox className="h-4 w-4" />,
      count: notes.filter((n) => n.isInbox && !n.archived).length,
    },
    {
      label: "All Notes",
      href: "/notes",
      icon: <FileText className="h-4 w-4" />,
      count: notes.filter((n) => !n.archived).length,
    },
    {
      label: "Projects",
      href: "/projects",
      icon: <FolderOpen className="h-4 w-4" />,
      count: notes.filter((n) => n.status === "project" && !n.archived).length,
    },
    {
      label: "Pinned",
      href: "/notes?pinned=true",
      icon: <Pin className="h-4 w-4" />,
      count: notes.filter((n) => n.pinned && !n.archived).length,
    },
    {
      label: "Archive",
      href: "/archive",
      icon: <Archive className="h-4 w-4" />,
      count: notes.filter((n) => n.archived).length,
    },
  ]

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-[14px] font-semibold text-foreground">Views</h1>
        </div>
        <button className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80">
          <Plus className="h-3 w-3" />
          <span>New view</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {savedViews.map((view) => (
            <Link
              key={view.href}
              href={view.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
            >
              <span className="text-muted-foreground">{view.icon}</span>
              <span className="flex-1 text-[13px] font-medium">{view.label}</span>
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                {view.count}
              </span>
            </Link>
          ))}
        </div>

        {folders.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Folders
            </h2>
            <div className="space-y-1">
              {folders.map((folder) => (
                <Link
                  key={folder.id}
                  href={`/folder/${folder.id}`}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                >
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded text-[10px] font-semibold text-foreground"
                    style={{ backgroundColor: folder.color }}
                  >
                    {folder.name.charAt(0)}
                  </span>
                  <span className="flex-1 text-[13px] font-medium">{folder.name}</span>
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                    {notes.filter((n) => n.folderId === folder.id && !n.archived).length}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Tags
            </h2>
            <div className="space-y-1">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tag/${tag.id}`}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                >
                  <Hash className="h-4 w-4" style={{ color: tag.color }} />
                  <span className="flex-1 text-[13px] font-medium">{tag.name}</span>
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                    {notes.filter((n) => n.tags.includes(tag.id) && !n.archived).length}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
