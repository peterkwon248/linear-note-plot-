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
import { resolveBookItems } from "@/lib/books/resolver"
import { Books as BooksIcon } from "@phosphor-icons/react/dist/ssr/Books"
import type { GlobalBookmark, Book } from "@/lib/types"
import { cn } from "@/lib/utils"
import { SPACE_COLORS } from "@/lib/colors"

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
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: isDeleted ? "var(--muted-foreground)" : SPACE_COLORS.wiki }}
                    />
                  ) : (
                    <MapPin
                      size={13}
                      weight="fill"
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: isDeleted ? "var(--muted-foreground)" : SPACE_COLORS.notes }}
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
                        className="uppercase tracking-wider font-semibold text-[9px]"
                        style={{ color: kind === "wiki" ? SPACE_COLORS.wiki : SPACE_COLORS.notes }}
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
      {/* Templates: anchor pinning enabled (PR 4a).
          GlobalBookmark.targetKind extended to include "template" — the data
          model + slice signature accept it; this surface reuses NoteLocalAnchors
          since `extractAnchorsFromContentJson` is contentJson-only (same as
          notes). The `note` prop name is a legacy artifact of the component's
          notes origin — we keep it for minimal-diff. Future PR may rename to
          `LocalAnchors` and accept any { id, contentJson } shape. */}
      {entity.type === "template" && entity.template && (
        <NoteLocalAnchors
          note={entity.template}
          pinnedList={pinnedList}
          onPin={(anchorId, label, anchorType) =>
            pinBookmark(entity.template!.id, anchorId, label, anchorType, "template")
          }
          onUnpin={unpinBookmark}
        />
      )}
      {/* Books — "IN THIS BOOK" context filter.
          The book entity itself has no contentJson, so it can't host
          anchors directly. But the book's *items* (notes / wiki articles)
          do — and the user already pins anchors in those entities via the
          normal flow. This section surfaces just those existing
          bookmarks, scoped to items that belong to *this* book. Manual
          items + smart-resolved items are both included via the resolver.
          No new data model — pure derived view. */}
      {entity.type === "book" && entity.book && (
        <BookContextBookmarks
          book={entity.book}
          pinnedList={pinnedList}
          notesById={notesById}
          articlesById={articlesById}
          onNavigate={navigateToBookmark}
        />
      )}
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

/* ── Book context bookmarks ───────────────────────────────
   "IN THIS BOOK" — pure derived view that filters the global bookmark
   list down to entries whose `noteId` (the target note/wiki id) belongs
   to one of this book's items (manual `book.items` + smart-resolved
   items via `resolveBookItems`). No new data model — bookmarks are still
   pinned through the normal note/wiki flow; we just surface them in the
   book's context so users don't lose their reading anchors when working
   inside a book.

   Design (PRD entity-side-panel-uniformity, 방향 4):
     - Book entity has no contentJson, so it can't host direct anchors.
     - But a book's purpose is to group notes/wikis for sequential
       reading — and any anchor pinned in those items is implicitly
       "this book's anchor" in context. This view makes that contextual
       relationship navigable.
     - Resolver pulls in smart-source items too, so Smart / Hybrid books
       behave the same as Manual.
*/
function BookContextBookmarks({
  book,
  pinnedList,
  notesById,
  articlesById,
  onNavigate,
}: {
  book: Book
  pinnedList: GlobalBookmark[]
  notesById: Record<string, any>
  articlesById: Record<string, any>
  onNavigate: (bm: GlobalBookmark) => void
}) {
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const stickers = usePlotStore((s) => s.stickers)

  const bookItemRefIds = useMemo(() => {
    const ids = new Set<string>()
    for (const item of book.items) {
      if (item.kind === "note" || item.kind === "wiki") {
        ids.add(item.refId)
      }
    }
    // Include smart-resolved items so Smart / Hybrid books behave the same
    const resolved = resolveBookItems(book, {
      notes,
      folders,
      wikiArticles,
      wikiCategories,
      tags,
      labels,
      stickers,
    })
    for (const r of resolved) {
      if (r.kind === "note" || r.kind === "wiki") {
        ids.add(r.refId)
      }
    }
    return ids
  }, [book, notes, folders, wikiArticles, wikiCategories, tags, labels, stickers])

  const inThisBook = useMemo(
    () => pinnedList.filter((bm) => bookItemRefIds.has(bm.noteId)),
    [pinnedList, bookItemRefIds],
  )

  return (
    <div className="p-3 border-t border-border-subtle">
      <SectionHeader icon={BooksIcon} label="IN THIS BOOK" count={inThisBook.length} />
      {bookItemRefIds.size === 0 ? (
        <p className="text-2xs text-muted-foreground/70 italic px-1">
          No items in this book yet
        </p>
      ) : inThisBook.length === 0 ? (
        <p className="text-2xs text-muted-foreground/70 italic px-1">
          No bookmarks in this book&apos;s items yet
        </p>
      ) : (
        <ul className="space-y-0.5">
          {inThisBook.map((bm) => {
            const kind = bm.targetKind ?? "note"
            const target = kind === "wiki" ? articlesById[bm.noteId] : notesById[bm.noteId]
            const isDeleted = !target || (target as any).trashed
            const targetTitle = target?.title || null
            return (
              <li
                key={bm.id}
                className="group flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-hover-bg transition-colors cursor-pointer"
                onClick={() => !isDeleted && onNavigate(bm)}
              >
                {kind === "wiki" ? (
                  <BookOpen
                    size={13}
                    weight="fill"
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: isDeleted ? "var(--muted-foreground)" : SPACE_COLORS.wiki }}
                  />
                ) : (
                  <MapPin
                    size={13}
                    weight="fill"
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: isDeleted ? "var(--muted-foreground)" : SPACE_COLORS.notes }}
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
                      className="uppercase tracking-wider font-semibold text-[9px]"
                      style={{ color: kind === "wiki" ? SPACE_COLORS.wiki : SPACE_COLORS.notes }}
                    >
                      {kind}
                    </span>
                    {!isDeleted && targetTitle && (
                      <>
                        <span className="text-muted-foreground/60">·</span>
                        <span className="truncate">{targetTitle}</span>
                      </>
                    )}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
