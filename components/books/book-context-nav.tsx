"use client"

/**
 * BookContextNav — Linear-style "N/M ↑↓" navigator (Phase 4).
 *
 * Rendered inside the editor header when the current entity (note or wiki)
 * was opened from a book context. Skips chapter-headings during navigation
 * (counter denominator excludes them too — see `bookContentItems`).
 *
 * Pane-aware: this component is unaware of pane identity. The parent
 * (note-editor / wiki article header) reads its bookContext from the
 * current pane and supplies prev/next handlers that route to the correct
 * pane via PaneContext.
 *
 * Spec: `.omc/plans/book-entity-prd.md` §8.
 */

import { useRouter } from "next/navigation"
import { CaretUp } from "@phosphor-icons/react/dist/ssr/CaretUp"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { cn } from "@/lib/utils"

interface BookContextNavProps {
  bookId: string
  /** 0-based item index within the content-only items list. */
  itemIndex: number
  /** Total content items in the book (excludes headings). */
  total: number
  onPrev: () => void
  onNext: () => void
  /** Optional: render the breadcrumb (book title /) inline before the counter. */
  showBreadcrumb?: boolean
}

export function BookContextNav({
  bookId,
  itemIndex,
  total,
  onPrev,
  onNext,
  showBreadcrumb = true,
}: BookContextNavProps) {
  const router = useRouter()
  const book = usePlotStore((s) => s.books.find((b) => b.id === bookId))

  // Empty book or item not in book — render nothing (caller should clear
  // bookContext, but render-time guard keeps us safe).
  if (!book || total === 0 || itemIndex < 0) return null

  const canPrev = itemIndex > 0
  const canNext = itemIndex < total - 1

  const handleBookClick = () => {
    const route = `/books/${bookId}`
    setActiveRoute(route)
    router.push(route)
  }

  return (
    <div className="flex items-center gap-1.5">
      {showBreadcrumb && (
        <button
          type="button"
          onClick={handleBookClick}
          className="group flex items-center gap-1 rounded-md px-1 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          title={`Back to ${book.title || "book"}`}
        >
          <Books size={12} weight="regular" className="text-muted-foreground/70 group-hover:text-foreground" />
          <span className="max-w-[140px] truncate font-medium">
            {book.title || "Untitled book"}
          </span>
        </button>
      )}
      <span
        className="select-none text-2xs tabular-nums text-muted-foreground/70"
        title={`Item ${itemIndex + 1} of ${total} in this book`}
      >
        {itemIndex + 1} <span className="text-muted-foreground/40">/</span> {total}
      </span>
      <div className="flex items-center gap-px">
        <button
          type="button"
          onClick={canPrev ? onPrev : undefined}
          disabled={!canPrev}
          aria-label="Previous in book"
          title="Previous in book"
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded transition-colors",
            canPrev
              ? "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
              : "cursor-not-allowed text-muted-foreground/30",
          )}
        >
          <CaretUp size={12} weight="bold" />
        </button>
        <button
          type="button"
          onClick={canNext ? onNext : undefined}
          disabled={!canNext}
          aria-label="Next in book"
          title="Next in book"
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded transition-colors",
            canNext
              ? "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
              : "cursor-not-allowed text-muted-foreground/30",
          )}
        >
          <CaretDown size={12} weight="bold" />
        </button>
      </div>
    </div>
  )
}
