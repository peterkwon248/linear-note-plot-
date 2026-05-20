"use client"

/**
 * BookBreadcrumb — `Books > [book title]` header navigation.
 *
 * 사용자 시그널 (2026-05-14): 기존 ← back 버튼이 Read 액션 옆에 위치해 어색.
 * Notes/Library 패턴 정합 — `Books > [book title]` + `>` chevron이 책
 * picker popover. Search 있음 (책 많을 수 있음).
 */

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { IconChevronRight } from "@/components/plot-icons"
import { BookKindIcon } from "@/components/property-chips"
import { getBookKind } from "@/lib/view-engine/use-books-view"
import { cn } from "@/lib/utils"
import type { Book } from "@/lib/types"

export function BookBreadcrumb({
  book,
  count,
}: {
  book: Book
  /** Item count to show next to the book title (matches ViewHeader.count). */
  count?: number
}) {
  const router = useRouter()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const allBooks = usePlotStore((s) => s.books)

  // Active books, search-filtered, recency-sorted. Excludes the current
  // book (no point switching to where you already are).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allBooks
      .filter((b) => !b.trashed && b.id !== book.id)
      .filter((b) => (q ? (b.title || "").toLowerCase().includes(q) : true))
      .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())
      .slice(0, 30)
  }, [allBooks, query, book.id])

  useEffect(() => {
    if (pickerOpen) setTimeout(() => inputRef.current?.focus(), 0)
  }, [pickerOpen])

  const navigateToBooks = () => {
    setActiveRoute("/books")
    router.push("/books")
  }

  const navigateToBook = (id: string) => {
    setActiveRoute(`/books/${id}`)
    router.push(`/books/${id}`)
    setPickerOpen(false)
    setQuery("")
  }

  return (
    <nav className="flex items-center gap-1 min-w-0">
      {/* Books root crumb */}
      <button
        onClick={navigateToBooks}
        className="shrink-0 text-note font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        Books
      </button>

      {/* Chevron → book picker popover */}
      <Popover
        open={pickerOpen}
        onOpenChange={(o) => {
          setPickerOpen(o)
          if (!o) setQuery("")
        }}
      >
        <PopoverTrigger asChild>
          <button className="shrink-0 rounded p-0.5 text-muted-foreground/70 hover:text-muted-foreground hover:bg-hover-bg transition-colors">
            <IconChevronRight size={16} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0" sideOffset={4}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books..."
            className="w-full px-3.5 py-2.5 text-note bg-transparent border-b border-border text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <div className="max-h-[360px] overflow-y-auto py-1">
            {filtered.map((b) => (
              <button
                key={b.id}
                onClick={() => navigateToBook(b.id)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-foreground/80 hover:bg-hover-bg transition-colors"
              >
                <BookKindIcon kind={getBookKind(b)} size={14} />
                <span className="truncate text-note font-medium flex-1">
                  {b.title || "Untitled"}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3.5 py-6 text-note text-muted-foreground/70 text-center">
                {query ? "No books match" : "No other books"}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Current book crumb */}
      <span className={cn("flex items-center gap-1.5 min-w-0 text-note font-medium text-foreground")}>
        <span className="truncate">{book.title || "Untitled book"}</span>
        {count !== undefined && (
          <span className="ml-0.5 text-note font-normal text-muted-foreground tabular-nums">
            {count}
          </span>
        )}
      </span>
    </nav>
  )
}
