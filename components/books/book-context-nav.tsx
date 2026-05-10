"use client"

/**
 * BookContextNav — Linear-style page navigator (Phase 4 + Step 2.11).
 *
 * Rendered inside the editor header when the current entity (note or wiki)
 * was opened from a book context. Includes:
 *  - Book title button (Books icon + truncated title) → opens TOC dropdown
 *    listing every page (manual + auto). Click a page to jump to it.
 *  - "N / M" counter (excludes chapter-headings)
 *  - ← / → buttons for prev/next page (replaces the old ↑↓ which clashed
 *    visually with the panel-collapse chevrons in editor toolbars)
 *
 * Pane-aware: this component is unaware of pane identity. The parent
 * (note-editor / wiki article header) reads its bookContext from the
 * current pane and supplies prev/next/jump handlers that route to the
 * correct pane via PaneContext.
 *
 * Phase A Step 2.9: counter includes auto items pulled from smartSources.
 * Phase A Step 2.11: TOC dropdown + horizontal arrows.
 *
 * Spec: `.omc/plans/book-entity-prd.md` §8 + `smart-book-prd.md` §5.
 */

import { useRouter } from "next/navigation"
import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import { Check } from "@phosphor-icons/react/dist/ssr/Check"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ResolvedContentBookItem } from "@/lib/books/utils"

interface BookContextNavProps {
  bookId: string
  /** 0-based item index within the content-only items list. */
  itemIndex: number
  /** Total content items in the book (excludes headings). */
  total: number
  onPrev: () => void
  onNext: () => void
  /** Step 2.11: jump to a specific page (TOC dropdown). */
  onJumpTo?: (index: number) => void
  /** Step 2.11: page list rendered in the TOC dropdown. */
  items?: ResolvedContentBookItem[]
  /** Optional: render the breadcrumb (book title /) inline before the counter. */
  showBreadcrumb?: boolean
}

export function BookContextNav({
  bookId,
  itemIndex,
  total,
  onPrev,
  onNext,
  onJumpTo,
  items,
  showBreadcrumb = true,
}: BookContextNavProps) {
  const router = useRouter()
  const book = usePlotStore((s) => s.books.find((b) => b.id === bookId))
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  // Empty book or item not in book — render nothing (caller should clear
  // bookContext, but render-time guard keeps us safe).
  if (!book || total === 0 || itemIndex < 0) return null

  const canPrev = itemIndex > 0
  const canNext = itemIndex < total - 1

  const handleBackToBook = () => {
    const route = `/books/${bookId}`
    setActiveRoute(route)
    router.push(route)
  }

  const resolveTitle = (item: ResolvedContentBookItem): string => {
    if (item.kind === "note") {
      return notes.find((n) => n.id === item.refId)?.title || "Untitled"
    }
    return wikiArticles.find((w) => w.id === item.refId)?.title || "Untitled"
  }

  // TOC dropdown is only available when the parent supplied items + jumpTo.
  // Otherwise the breadcrumb behaves like the old "Back to book" link.
  const tocAvailable = !!items && items.length > 0 && !!onJumpTo

  return (
    <div className="flex items-center gap-1.5">
      {showBreadcrumb && (
        tocAvailable ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group flex items-center gap-1 rounded-md px-1 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
                title="Open table of contents"
                aria-label="Table of contents"
              >
                <Books size={12} weight="regular" className="text-muted-foreground/70 group-hover:text-foreground" />
                <span className="max-w-[140px] truncate font-medium">
                  {book.title || "Untitled book"}
                </span>
                <CaretDown size={10} weight="bold" className="text-muted-foreground/50 group-hover:text-foreground/70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 max-h-[60vh] overflow-y-auto">
              <DropdownMenuLabel className="text-2xs text-muted-foreground">
                {book.title || "Untitled book"}
                <span className="ml-1 text-muted-foreground/60">· {total} {total === 1 ? "page" : "pages"}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {items!.map((item, idx) => {
                const isActive = idx === itemIndex
                const isAuto = item.source === "auto"
                const title = resolveTitle(item)
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => onJumpTo!(idx)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 text-note cursor-pointer",
                      isActive && "bg-accent/10 text-accent",
                    )}
                  >
                    <span className="flex h-4 w-5 shrink-0 items-center justify-center text-2xs tabular-nums text-muted-foreground/60">
                      {isActive ? <Check size={11} weight="bold" className="text-accent" /> : idx + 1}
                    </span>
                    <span className={cn("flex-1 truncate", isAuto && "text-foreground/70")}>
                      {title}
                    </span>
                    {isAuto && (
                      <Sparkle
                        size={10}
                        weight="regular"
                        className="text-muted-foreground/40"
                      />
                    )}
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleBackToBook}
                className="flex items-center gap-2 px-2 py-1.5 text-2xs text-muted-foreground cursor-pointer"
              >
                <CaretLeft size={11} weight="regular" />
                Back to book overview
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            onClick={handleBackToBook}
            className="group flex items-center gap-1 rounded-md px-1 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            title={`Back to ${book.title || "book"}`}
          >
            <Books size={12} weight="regular" className="text-muted-foreground/70 group-hover:text-foreground" />
            <span className="max-w-[140px] truncate font-medium">
              {book.title || "Untitled book"}
            </span>
          </button>
        )
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
          <CaretLeft size={12} weight="bold" />
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
          <CaretRight size={12} weight="bold" />
        </button>
      </div>
    </div>
  )
}
