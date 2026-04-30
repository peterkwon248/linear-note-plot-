"use client"

import { useMemo, useState } from "react"
import { useSidePanelEntity } from "./use-side-panel-entity"
import { usePlotStore } from "@/lib/store"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import { MapPin } from "@phosphor-icons/react/dist/ssr/MapPin"
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr/TextAlignLeft"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { X } from "@phosphor-icons/react/dist/ssr/X"
import { extractAnchorsFromContentJson } from "@/lib/anchor-utils"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import type { GlobalBookmark } from "@/lib/types"
import { cn } from "@/lib/utils"

type BookmarkFilter = "all" | "note" | "wiki"

/**
 * Unified Bookmarks panel — shows ALL pinned bookmarks (note + wiki) in one list,
 * plus context-specific local sections.
 */
export function SidePanelBookmarks() {
  const entity = useSidePanelEntity()

  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const globalBookmarks = usePlotStore((s) => s.globalBookmarks)
  const pinBookmark = usePlotStore((s) => s.pinBookmark)
  const unpinBookmark = usePlotStore((s) => s.unpinBookmark)

  const [filter, setFilter] = useState<BookmarkFilter>("all")
  const [query, setQuery] = useState("")

  const notesById = useMemo(
    () => Object.fromEntries(notes.map((n) => [n.id, n])),
    [notes],
  )
  const articlesById = useMemo(
    () => Object.fromEntries(wikiArticles.map((a) => [a.id, a])),
    [wikiArticles],
  )

  // Sorted pinned bookmarks (newest first), unified across note + wiki
  const allBookmarks = useMemo(() => {
    return Object.values(globalBookmarks as Record<string, GlobalBookmark>).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [globalBookmarks])

  const totalCounts = useMemo(() => {
    let note = 0, wiki = 0
    for (const b of allBookmarks) {
      const k = b.targetKind ?? "note"
      if (k === "wiki") wiki++; else note++
    }
    return { all: allBookmarks.length, note, wiki }
  }, [allBookmarks])

  // Apply filter + search
  const pinnedList = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allBookmarks.filter((b) => {
      const kind = b.targetKind ?? "note"
      if (filter !== "all" && kind !== filter) return false
      if (q) {
        const target = kind === "wiki" ? articlesById[b.noteId] : notesById[b.noteId]
        const targetTitle = (target as any)?.title?.toLowerCase() || ""
        if (!b.label.toLowerCase().includes(q) && !targetTitle.includes(q)) return false
      }
      return true
    })
  }, [allBookmarks, filter, query, articlesById, notesById])

  const navigateToBookmark = (bm: GlobalBookmark) => {
    const kind = bm.targetKind ?? "note"
    if (kind === "wiki") {
      // Switch to wiki route + select the article
      import("@/lib/table-route").then((m) => m.setActiveRoute("/wiki"))
      navigateToWikiArticle(bm.noteId)
    } else {
      const openNote = (usePlotStore.getState() as any).openNote
      if (openNote) openNote(bm.noteId)
    }
    // Wait for navigation/render then scroll
    const tryScroll = (attempts: number) => {
      const safe = (window as any).CSS?.escape ? CSS.escape(bm.anchorId) : bm.anchorId
      const el =
        document.querySelector(`[id="wiki-block-${safe}"]`) ||
        document.querySelector(`[data-anchor-id="${safe}"]`) ||
        document.querySelector(`[id="${safe}"]`) ||
        document.querySelector(`[data-id="${safe}"]`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        ;(el as HTMLElement).classList.add("ring-2", "ring-accent/50", "rounded")
        setTimeout(() => (el as HTMLElement).classList.remove("ring-2", "ring-accent/50", "rounded"), 1500)
      } else if (attempts > 0) {
        setTimeout(() => tryScroll(attempts - 1), 200)
      }
    }
    setTimeout(() => tryScroll(8), 300)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── Unified bookmarks list (cross-entity) ── */}
      <div className="p-3 border-b border-border">
        {/* Filter chips */}
        {totalCounts.all > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")} count={totalCounts.all}>
              All
            </FilterChip>
            <FilterChip active={filter === "note"} onClick={() => setFilter("note")} count={totalCounts.note}>
              Notes
            </FilterChip>
            <FilterChip active={filter === "wiki"} onClick={() => setFilter("wiki")} count={totalCounts.wiki}>
              Wiki
            </FilterChip>
          </div>
        )}

        {/* Search input */}
        {totalCounts.all > 0 && (
          <div className="relative mb-2">
            <MagnifyingGlass
              size={14}
              weight="bold"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full text-sm bg-secondary/30 border border-border-subtle rounded-md pl-9 pr-8 py-2 outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/50 placeholder:text-muted-foreground/70 text-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-hover-bg text-muted-foreground hover:text-foreground"
                title="Clear"
              >
                <X size={10} />
              </button>
            )}
          </div>
        )}

        {totalCounts.all === 0 ? (
          <p className="text-2xs text-muted-foreground/70 italic px-1">
            No bookmarks yet
          </p>
        ) : pinnedList.length === 0 ? (
          <p className="text-2xs text-muted-foreground/70 italic px-1">
            {query ? `No bookmarks match "${query}"` : "No bookmarks in this filter"}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {pinnedList.map((bm) => {
              const kind = bm.targetKind ?? "note"
              const target = kind === "wiki" ? articlesById[bm.noteId] : notesById[bm.noteId]
              const isDeleted = !target || (target as any).trashed
              const targetTitle = target ? (kind === "wiki" ? (target as any).title : (target as any).title) : null
              return (
                <li
                  key={bm.id}
                  className="group flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-hover-bg transition-colors cursor-pointer"
                  onClick={() => !isDeleted && navigateToBookmark(bm)}
                >
                  {kind === "wiki" ? (
                    <BookOpen
                      size={13}
                      weight="fill"
                      className={cn(
                        "mt-0.5 flex-shrink-0",
                        isDeleted ? "text-muted-foreground/60" : "text-amber-500",
                      )}
                    />
                  ) : (
                    <MapPin
                      size={13}
                      weight="fill"
                      className={cn(
                        "mt-0.5 flex-shrink-0",
                        isDeleted ? "text-muted-foreground/60" : "text-accent",
                      )}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "text-note block truncate font-medium",
                        isDeleted ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {bm.label}
                      {isDeleted && (
                        <span className="ml-1 text-2xs text-muted-foreground/70">(deleted)</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-2xs text-muted-foreground">
                      <span
                        className={cn(
                          "uppercase tracking-wider font-semibold text-[9px]",
                          kind === "wiki" ? "text-amber-400/70" : "text-accent/70",
                        )}
                      >
                        {kind}
                      </span>
                      {!isDeleted && targetTitle && (
                        <>
                          <span className="text-muted-foreground/60">·</span>
                          <span className="truncate">{targetTitle || "Untitled"}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-hover-bg transition-all flex-shrink-0"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      unpinBookmark(bm.id)
                    }}
                    title="Unpin"
                  >
                    <X size={11} weight="regular" className="text-muted-foreground/60" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Note-specific local anchors (anchorMark/anchorDivider/heading inside body) */}
      {entity.type === "note" && entity.note && (
        <NoteLocalAnchors
          note={entity.note}
          pinnedList={pinnedList}
          onPin={(anchorId, label, anchorType) =>
            pinBookmark(entity.note!.id, anchorId, label, anchorType, "note")
          }
          onUnpin={unpinBookmark}
        />
      )}
      {/* Wiki SECTIONS removed — Outline is shown in Detail tab */}
    </div>
  )
}

function FilterChip({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean
  count: number
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-semibold transition-colors",
        active
          ? "bg-accent/20 text-accent"
          : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary",
      )}
    >
      {children}
      <span className="ml-1.5 opacity-70 tabular-nums">{count}</span>
    </button>
  )
}

function SectionHeader({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ElementType
  label: string
  count: number
}) {
  return (
    <div className="flex items-center gap-2 mb-2 text-accent/80">
      <Icon size={13} weight="bold" />
      <span className="text-2xs font-semibold uppercase tracking-wider">{label}</span>
      <span className="text-2xs text-accent tabular-nums">{count}</span>
    </div>
  )
}

/* ── Note local anchors ───────────────────────── */

function NoteLocalAnchors({
  note,
  pinnedList,
  onPin,
  onUnpin,
}: {
  note: any
  pinnedList: GlobalBookmark[]
  onPin: (anchorId: string, label: string, anchorType: GlobalBookmark["anchorType"]) => void
  onUnpin: (bookmarkId: string) => void
}) {
  const localAnchors = useMemo(() => {
    if (!note?.contentJson) return []
    return extractAnchorsFromContentJson(note.contentJson)
  }, [note?.contentJson])

  const pinnedSet = useMemo(() => {
    const set = new Set<string>()
    for (const bm of pinnedList) {
      set.add(`${bm.noteId}:${bm.anchorId}`)
    }
    return set
  }, [pinnedList])

  const scrollToAnchor = (anchorId: string) => {
    const safe = (window as any).CSS?.escape ? CSS.escape(anchorId) : anchorId
    const el =
      document.querySelector(`[data-anchor-id="${safe}"]`) ||
      document.querySelector(`[id="${safe}"]`) ||
      document.querySelector(`[data-id="${safe}"]`)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  if (localAnchors.length === 0) {
    return null
  }

  return (
    <div className="p-3">
      <SectionHeader icon={BookmarkSimple} label="ANCHORS IN NOTE" count={localAnchors.length} />
      <ul className="space-y-0.5">
        {localAnchors.map((anchor) => {
          const key = `${note.id}:${anchor.id}`
          const isPinned = pinnedSet.has(key)
          return (
            <li
              key={anchor.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-hover-bg transition-colors cursor-pointer"
              onClick={() => scrollToAnchor(anchor.id)}
            >
              {anchor.type === "heading" ? (
                <TextAlignLeft size={12} weight="bold" className="text-muted-foreground shrink-0" />
              ) : (
                <MapPin size={12} weight="bold" className="text-muted-foreground shrink-0" />
              )}
              <span className="flex-1 truncate text-note text-foreground">{anchor.label}</span>
              <button
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-hover-bg transition-all"
                onClick={(ev) => {
                  ev.stopPropagation()
                  if (isPinned) {
                    const existing = pinnedList.find((b) => b.noteId === note.id && b.anchorId === anchor.id)
                    if (existing) onUnpin(existing.id)
                  } else {
                    onPin(anchor.id, anchor.label, anchor.type)
                  }
                }}
                title={isPinned ? "Remove bookmark" : "Add bookmark"}
              >
                <BookmarkSimple
                  size={12}
                  weight={isPinned ? "fill" : "regular"}
                  className={isPinned ? "text-accent" : "text-muted-foreground/60"}
                />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

