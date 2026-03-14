"use client"

import { useState, useMemo, useRef, useCallback, useEffect, memo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Search, X, Plus, ArrowUpDown, SlidersHorizontal, Trash2, Pin, Archive } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/components/note-fields"
import { setNoteDragData } from "@/lib/drag-helpers"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import type { ViewContextKey } from "@/lib/view-engine/types"
import type { Note } from "@/lib/types"

/* ── Tabs ──────────────────────────────────────────────── */

const TABS: { id: ViewContextKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "inbox", label: "Inbox" },
  { id: "capture", label: "Cap" },
  { id: "permanent", label: "Perm" },
]

/* ── CompactNoteList ─────────────────────────────────── */

interface CompactNoteListProps {
  context?: ViewContextKey
  title?: string
  showTabs?: boolean
  hideCreateButton?: boolean
  createNoteOverrides?: Partial<Note>
  folderId?: string
  tagId?: string
  labelId?: string
  initialTab?: ViewContextKey
  onTabChange?: (tab: ViewContextKey) => void
  onNoteClick?: (noteId: string) => void
  activeNoteId?: string | null
}

export function CompactNoteList({
  context,
  title,
  showTabs = true,
  hideCreateButton = false,
  createNoteOverrides,
  folderId,
  tagId,
  labelId,
  initialTab,
  onTabChange,
  onNoteClick,
  activeNoteId,
}: CompactNoteListProps) {
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const createNote = usePlotStore((s) => s.createNote)
  const openNote = usePlotStore((s) => s.openNote)
  const searchQuery = usePlotStore((s) => s.searchQuery)
  const setSearchQuery = usePlotStore((s) => s.setSearchQuery)
  const togglePin = usePlotStore((s) => s.togglePin)
  const toggleArchive = usePlotStore((s) => s.toggleArchive)
  const deleteNote = usePlotStore((s) => s.deleteNote)

  // Resolve dynamic title from context
  const resolvedTitle = useMemo(() => {
    if (title) return title
    if (folderId) {
      const folder = folders.find((f) => f.id === folderId)
      return folder?.name ?? "Folder"
    }
    if (tagId) {
      const tag = tags.find((t) => t.id === tagId)
      return tag?.name ?? "Tag"
    }
    if (labelId) {
      const label = labels.find((l) => l.id === labelId)
      return label?.name ?? "Label"
    }
    if (context === "pinned") return "Pinned"
    if (context === "trash") return "Trash"
    return "Notes"
  }, [title, folderId, tagId, labelId, context, folders, tags, labels])

  const [activeTab, setActiveTab] = useState<ViewContextKey>(initialTab ?? "all")
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    setActiveTab(initialTab ?? "all")
  }, [initialTab])

  const effectiveTab = context ?? activeTab
  const backlinksMap = useBacklinksIndex()

  const tabCounts = useMemo((): Record<string, number> => {
    let active = notes.filter((n) => !n.archived && !n.trashed)

    // Apply folder/tag/label context filtering before counting
    if (folderId) {
      active = active.filter((n) => n.folderId === folderId)
    }
    if (tagId) {
      active = active.filter((n) => n.tags?.includes(tagId))
    }
    if (labelId) {
      active = active.filter((n) => n.labelId === labelId)
    }

    return {
      all: active.length,
      inbox: active.filter((n) => n.status === "inbox" && n.triageStatus !== "trashed").length,
      capture: active.filter((n) => n.status === "capture").length,
      permanent: active.filter((n) => n.status === "permanent").length,
    }
  }, [notes, folderId, tagId, labelId])

  const { flatNotes } = useNotesView(effectiveTab, { backlinksMap, folderId, tagId, labelId })

  const scrollRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: flatNotes.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 52,
    overscan: 8,
  })

  const handleRowClick = useCallback((noteId: string) => {
    if (onNoteClick) {
      onNoteClick(noteId)
    } else {
      openNote(noteId)
    }
  }, [onNoteClick, openNote])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 min-w-0">
          {folderId && (() => {
            const folder = folders.find((f) => f.id === folderId)
            return folder ? (
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
            ) : null
          })()}
          {tagId && (() => {
            const tag = tags.find((t) => t.id === tagId)
            return tag ? (
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
            ) : null
          })()}
          <h2 className="text-[13px] font-semibold text-foreground truncate">
            {resolvedTitle}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className={cn(
              "rounded p-1 transition-colors",
              searchOpen ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          {!hideCreateButton && (
            <button
              onClick={() => {
                const id = createNote(createNoteOverrides ?? {})
                handleRowClick(id)
              }}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Search bar (collapsible) ────────────────── */}
      {searchOpen && (
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-1.5">
          <Search className="h-3 w-3 text-muted-foreground shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      )}

      {/* ── Mini tabs ───────────────────────────────── */}
      {showTabs && (
        <div className="flex items-center border-b border-border px-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); onTabChange?.(tab.id) }}
              className={cn(
                "relative flex-1 py-1.5 text-center text-[11px] font-medium transition-colors",
                effectiveTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span className="ml-0.5 text-[10px] tabular-nums opacity-60">
                {tabCounts[tab.id] ?? 0}
              </span>
              {effectiveTab === tab.id && (
                <span className="absolute inset-x-2 bottom-0 h-[1.5px] rounded-full bg-accent" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Note list (virtualized) ─────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        <div
          style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const note = flatNotes[virtualRow.index]
            if (!note) return null
            return (
              <div
                key={note.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <CompactRow
                  note={note}
                  isActive={note.id === activeNoteId}
                  onClick={() => handleRowClick(note.id)}
                  onDelete={() => deleteNote(note.id)}
                  onTogglePin={() => togglePin(note.id)}
                  onToggleArchive={() => toggleArchive(note.id)}
                />
              </div>
            )
          })}
        </div>

        {flatNotes.length === 0 && (
          <div className="flex items-center justify-center py-8 text-[12px] text-muted-foreground/50">
            No notes
          </div>
        )}
      </div>
    </div>
  )
}

/* ── CompactRow ────────────────────────────────────────── */

const CompactRow = memo(function CompactRow({
  note,
  isActive,
  onClick,
  onDelete,
  onTogglePin,
  onToggleArchive,
}: {
  note: Note
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
  onTogglePin?: () => void
  onToggleArchive?: () => void
}) {
  const statusCfg = STATUS_CONFIG[note.status] ?? STATUS_CONFIG.capture
  const priorityCfg = note.priority !== "none" ? PRIORITY_CONFIG[note.priority] : null

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          draggable
          onDragStart={(e) => setNoteDragData(e, note.id)}
          onClick={onClick}
          className={cn(
            "flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors border-b border-border/50",
            isActive
              ? "bg-accent/10 border-l-2 border-l-accent"
              : "hover:bg-secondary/30 border-l-2 border-l-transparent"
          )}
        >
          {/* Status dot */}
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: statusCfg.color }}
            title={statusCfg.label}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={cn(
                "truncate text-[13px] font-medium",
                isActive ? "text-foreground" : "text-foreground/90"
              )}>
                {note.title || "Untitled"}
              </span>
              {note.pinned && (
                <span className="text-[#f2994a] text-[10px]">*</span>
              )}
            </div>
            {note.preview && (
              <p className="truncate text-[11px] text-muted-foreground/70 mt-0.5 leading-tight">
                {note.preview}
              </p>
            )}
          </div>

          {/* Priority icon */}
          {priorityCfg && (
            <span
              className="mt-1 shrink-0"
              style={{ color: priorityCfg.color }}
              title={priorityCfg.label}
            >
              {priorityCfg.icon}
            </span>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {onTogglePin && (
          <ContextMenuItem onClick={onTogglePin}>
            <Pin className="mr-2 h-4 w-4" />
            {note.pinned ? "Unpin" : "Pin"}
          </ContextMenuItem>
        )}
        {onToggleArchive && (
          <ContextMenuItem onClick={onToggleArchive}>
            <Archive className="mr-2 h-4 w-4" />
            {note.archived ? "Unarchive" : "Archive"}
          </ContextMenuItem>
        )}
        {(onTogglePin || onToggleArchive) && onDelete && (
          <ContextMenuSeparator />
        )}
        {onDelete && (
          <ContextMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
})
