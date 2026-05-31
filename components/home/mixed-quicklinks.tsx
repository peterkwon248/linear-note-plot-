"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { FileText, BookOpen, Folder as PhFolder, Filter as Funnel, Bookmark as BookmarkSimple } from "lucide-react"
import { SPACE_ICONS } from "@/lib/entity-icons"
import type { Book, Folder, GlobalBookmark, Note, SavedView, WikiArticle } from "@/lib/types"

/**
 * Home > Mixed Quicklinks (Plane-style, Plot data).
 *
 * Unified pinning hub — pinned items from any source render as one card grid:
 *   - pinned Notes
 *   - pinned Wiki articles
 *   - pinned Folders
 *   - pinned Saved Views
 *   - global Bookmarks (block-level — note section anchors / wiki block pins)
 *
 * Sort: pinnedOrder (asc, where present) → updatedAt/createdAt (desc).
 * Bookmarks render after pins but carry a dedicated `bookmarkLimit` so a long
 * pin list never truncates them away (capped-bug fix).
 *
 * Card visual = same vocabulary as RecentCards for tonal consistency.
 */
export function MixedQuicklinks({ limit = 8, bookmarkLimit = 8 }: { limit?: number; bookmarkLimit?: number }) {
  const router = useRouter()
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const folders = usePlotStore((s) => s.folders)
  const savedViews = usePlotStore((s) => s.savedViews)
  const books = usePlotStore((s) => s.books)
  const globalBookmarks = usePlotStore((s) => s.globalBookmarks) as Record<string, GlobalBookmark>
  const openNote = usePlotStore((s) => s.openNote)

  const items = useMemo(() => {
    type Item = {
      key: string
      kind: "note" | "wiki" | "folder" | "view" | "bookmark" | "book"
      title: string
      meta: string
      sortKey: string  // for stable ordering
      onClick: () => void
    }
    const result: Item[] = []

    /* ── Notes ── */
    for (const n of notes as Note[]) {
      if (!n.pinned || n.trashed) continue
      result.push({
        key: `note:${n.id}`,
        kind: "note",
        title: n.title || "Untitled",
        meta: `Note · ${shortRelative(n.updatedAt)}`,
        sortKey: `1-${n.updatedAt}`,
        onClick: () => {
          setActiveRoute("/notes")
          openNote(n.id)
        },
      })
    }

    /* ── Wiki articles (whole-article pin via WikiArticle.pinned) ── */
    for (const w of wikiArticles as WikiArticle[]) {
      if (!w.pinned || (w as { trashed?: boolean }).trashed) continue
      result.push({
        key: `wiki:${w.id}`,
        kind: "wiki",
        title: w.title,
        meta: `Wiki · ${shortRelative(w.updatedAt)}`,
        sortKey: `2-${w.updatedAt}`,
        onClick: () => {
          setActiveRoute("/wiki")
          navigateToWikiArticle(w.id)
        },
      })
    }

    /* ── Books (cross-entity ordered sequence — Phase 4 follow-up) ── */
    for (const b of books as Book[]) {
      if (!b.pinned || b.trashed) continue
      result.push({
        key: `book:${b.id}`,
        kind: "book",
        title: b.title || "Untitled book",
        meta: `Book · ${b.items.length} item${b.items.length === 1 ? "" : "s"}`,
        sortKey: `2.5-${b.updatedAt}`,
        onClick: () => {
          setActiveRoute(`/books/${b.id}`)
          router.push(`/books/${b.id}`)
        },
      })
    }

    /* ── Folders ── */
    for (const f of folders as Folder[]) {
      if (!f.pinned) continue
      // v107 N:M: a note belongs to a folder iff its folderIds includes
      // that folder. PR (b) refines counting to per-kind (notes vs wikis).
      const noteCount = notes.filter((n: Note) => !n.trashed && n.folderIds.includes(f.id)).length
      result.push({
        key: `folder:${f.id}`,
        kind: "folder",
        title: f.name || "Untitled folder",
        meta: `Folder · ${noteCount} note${noteCount === 1 ? "" : "s"}`,
        sortKey: `3-${String(f.pinnedOrder ?? 999).padStart(4, "0")}-${f.createdAt}`,
        onClick: () => {
          router.push(`/folder/${f.id}`)
        },
      })
    }

    /* ── Saved views ── */
    for (const v of savedViews as SavedView[]) {
      if (!v.pinned) continue
      result.push({
        key: `view:${v.id}`,
        kind: "view",
        title: v.name,
        meta: `View · ${v.space === "all" ? "Mixed" : v.space[0].toUpperCase() + v.space.slice(1)}`,
        sortKey: `4-${String(v.pinnedOrder ?? 999).padStart(4, "0")}-${v.updatedAt}`,
        onClick: () => {
          // Saved views map to their space's main route. The view selector inside
          // that route should pick this view up by id (TODO: pass id via store/url).
          if (v.space === "wiki") {
            setActiveRoute("/wiki")
          } else {
            setActiveRoute("/notes")
          }
        },
      })
    }

    /* ── Global bookmarks (block-level) ── */
    const bookmarks = Object.values(globalBookmarks)
    for (const bm of bookmarks) {
      const isWiki = bm.targetKind === "wiki"
      if (isWiki) {
        const article = wikiArticles.find((w: WikiArticle) => w.id === bm.noteId)
        if (!article) continue
        result.push({
          key: `bm:${bm.id}`,
          kind: "bookmark",
          title: bm.label || article.title,
          meta: `Bookmark · ${article.title}`,
          sortKey: `5-${bm.createdAt}`,
          onClick: () => {
            setActiveRoute("/wiki")
            navigateToWikiArticle(article.id)
          },
        })
      } else {
        const note = notes.find((n: Note) => n.id === bm.noteId && !n.trashed)
        if (!note) continue
        if (note.pinned) continue // dedupe — note already shown
        result.push({
          key: `bm:${bm.id}`,
          kind: "bookmark",
          title: bm.label || note.title || "Bookmark",
          meta: `Bookmark · ${note.title || "Untitled"}`,
          sortKey: `5-${bm.createdAt}`,
          onClick: () => {
            setActiveRoute("/notes")
            openNote(note.id)
          },
        })
      }
    }

    // Partition pins (whole-entity) from bookmarks (block-level), then cap each
    // independently. Bookmarks get a DEDICATED limit so a long pin list never
    // starves them — previously a single `slice(0, limit)` over the merged list
    // dropped all bookmarks (sortKey group "5") once 8+ pins existed (capped bug).
    const pinItems = result
      .filter((it) => it.kind !== "bookmark")
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    const bookmarkItems = result
      .filter((it) => it.kind === "bookmark")
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    return [...pinItems.slice(0, limit), ...bookmarkItems.slice(0, bookmarkLimit)]
  }, [notes, wikiArticles, folders, savedViews, books, globalBookmarks, openNote, router, limit, bookmarkLimit])

  if (items.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[800px]:grid-cols-3 min-[1100px]:grid-cols-4">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          onClick={it.onClick}
          className="group flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3.5 text-left transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03] hover:shadow-sm"
        >
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${colorForKind(it.kind)}`}>
            {iconFor(it.kind)}
          </span>
          <h3 className="line-clamp-1 text-note font-medium text-foreground group-hover:text-accent transition-colors">
            {it.title}
          </h3>
          <p className="line-clamp-1 text-2xs text-muted-foreground">{it.meta}</p>
        </button>
      ))}
    </div>
  )
}

/* ── Helpers ──────────────────────────────────────────── */

function iconFor(kind: "note" | "wiki" | "folder" | "view" | "bookmark" | "book") {
  switch (kind) {
    case "note":
      return <FileText size={14} strokeWidth={2} />
    case "wiki":
      return <BookOpen size={14} strokeWidth={2} />
    case "folder":
      return <PhFolder size={14} strokeWidth={2} />
    case "view":
      return <Funnel size={14} strokeWidth={2} />
    case "bookmark":
      return <BookmarkSimple size={14} fill="currentColor" strokeWidth={2} />
    case "book":
      return <SPACE_ICONS.books size={14} strokeWidth={2} />
  }
}

function colorForKind(kind: "note" | "wiki" | "folder" | "view" | "bookmark" | "book") {
  switch (kind) {
    case "note":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    case "wiki":
      return "bg-violet-500/10 text-violet-600 dark:text-violet-400"
    case "folder":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    case "view":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    case "bookmark":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400"
    case "book":
      // Books burgundy (#be123c, rose-700) — matches SPACE_COLORS.books
      return "bg-rose-700/10 text-rose-700 dark:text-rose-400"
  }
}

function shortRelative(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
