"use client"

/**
 * InBooksSection — shows which books contain the current entity.
 *
 * Rendered inside both the Note detail panel (SidePanelContext) and the
 * WikiArticleDetailPanel. Clicking a row navigates to that book and sets
 * bookContext so the editor shows the N/M ↑↓ navigator (Phase 4).
 *
 * Trashed books are always hidden. When the entity belongs to zero
 * non-trashed books the component renders nothing.
 */

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Books as BooksIcon } from "@phosphor-icons/react/dist/ssr/Books"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { booksContainingEntityResolved } from "@/lib/books/utils"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"

interface InBooksSectionProps {
  kind: "note" | "wiki"
  refId: string
}

export function InBooksSection({ kind, refId }: InBooksSectionProps) {
  const router = useRouter()
  const books = usePlotStore((s) => s.books)
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const setBookContext = usePlotStore((s) => s.setBookContext)
  const openNote = usePlotStore((s) => s.openNote)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  const memberships = useMemo(
    () => booksContainingEntityResolved(books, { notes, folders }, kind, refId),
    [books, notes, folders, kind, refId],
  )

  if (memberships.length === 0) return null

  const handleNavigate = (bookId: string, index: number, total: number) => {
    // Anchor the primary pane to the book so the editor shows N/M ↑↓
    setBookContext("primary", { bookId, itemIndex: index, total })

    if (kind === "note") {
      openNote(refId, { pane: "primary" })
    } else {
      setSelectedNoteId(null)
      setActiveRoute("/wiki")
      navigateToWikiArticle(refId)
      router.push(`/wiki/${refId}`)
    }
  }

  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-muted-foreground">
          <BooksIcon size={16} weight="regular" />
        </span>
        <span className="text-2xs font-medium text-muted-foreground">In Books</span>
      </div>
      <div className="space-y-px">
        {memberships.map(({ book, index, total }) => (
          <button
            key={book.id}
            type="button"
            onClick={() => handleNavigate(book.id, index, total)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-100 hover:bg-hover-bg"
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center text-base leading-none">
              <BooksIcon size={14} weight="regular" className="text-muted-foreground" />
            </span>
            <span className="flex-1 truncate text-note font-medium text-foreground">
              {book.title || "Untitled book"}
            </span>
            <span className="shrink-0 tabular-nums text-2xs text-muted-foreground/70">
              {index + 1}/{total}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
