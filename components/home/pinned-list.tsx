"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { useRouter } from "next/navigation"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import { HomeSection } from "./home-section"
import { HomeRow } from "./home-row"
import type { GlobalBookmark, WikiArticle } from "@/lib/types"

/**
 * Pinned widget on Home.
 *
 * Two sources of "pinned" data, unified into one list:
 *   1. Note.pinned === true (whole-note pin)
 *   2. globalBookmarks where targetKind === "note" or "wiki" and anchorType === "block" or "heading"
 *      (in-document bookmark — represents user's high-importance reference)
 *
 * Display priority:
 *   - Note pins first, ordered by updatedAt desc
 *   - Then bookmarks, ordered by createdAt desc
 *   - Capped at 8 rows for density
 *
 * Empty state: hidden (no section header at all) — keeps Home tight.
 */
export function PinnedList({ limit = 8 }: { limit?: number }) {
  const router = useRouter()
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const globalBookmarks = usePlotStore((s) => s.globalBookmarks) as Record<string, GlobalBookmark>
  const openNote = usePlotStore((s) => s.openNote)

  const items = useMemo(() => {
    const result: Array<{
      key: string
      kind: "note" | "wiki" | "bookmark"
      title: string
      label?: string
      onClick: () => void
    }> = []

    // 1. Pinned notes (note.pinned === true)
    const pinnedNotes = notes
      .filter((n) => n.pinned && !n.trashed)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    for (const n of pinnedNotes) {
      result.push({
        key: `note:${n.id}`,
        kind: "note",
        title: n.title || "Untitled",
        onClick: () => {
          setActiveRoute("/notes")
          openNote(n.id)
        },
      })
    }

    // 2. Global bookmarks
    const bookmarks = Object.values(globalBookmarks).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
    for (const bm of bookmarks) {
      const isWiki = bm.targetKind === "wiki"
      if (isWiki) {
        const article = wikiArticles.find((w: WikiArticle) => w.id === bm.noteId)
        if (!article) continue
        result.push({
          key: `bm:${bm.id}`,
          kind: "wiki",
          title: bm.label || article.title,
          label: article.title !== bm.label ? article.title : undefined,
          onClick: () => {
            setActiveRoute("/wiki")
            router.push(`/wiki/${article.id}#${bm.anchorId}`)
          },
        })
      } else {
        const note = notes.find((n) => n.id === bm.noteId && !n.trashed)
        if (!note) continue
        // Skip if note is already in pinned list (avoid duplicate)
        if (note.pinned) continue
        result.push({
          key: `bm:${bm.id}`,
          kind: "bookmark",
          title: bm.label || note.title || "Bookmark",
          label: note.title && note.title !== bm.label ? note.title : undefined,
          onClick: () => {
            setActiveRoute("/notes")
            openNote(note.id)
          },
        })
      }
    }

    return result.slice(0, limit)
  }, [notes, wikiArticles, globalBookmarks, limit, openNote, router])

  if (items.length === 0) return null

  return (
    <HomeSection label="Pinned" count={items.length}>
      {items.map((it) => (
        <HomeRow
          key={it.key}
          icon={iconFor(it.kind)}
          title={
            it.label ? (
              <span>
                {it.title}
                <span className="ml-2 text-muted-foreground/70">{it.label}</span>
              </span>
            ) : (
              it.title
            )
          }
          onClick={it.onClick}
        />
      ))}
    </HomeSection>
  )
}

function iconFor(kind: "note" | "wiki" | "bookmark") {
  switch (kind) {
    case "note":
      return <FileText size={13} weight="regular" />
    case "wiki":
      return <BookOpen size={13} weight="regular" />
    case "bookmark":
      return <BookmarkSimple size={13} weight="fill" />
  }
}
