"use client"

/**
 * Book grid card — the original `/books` grid mode card extracted from
 * books-view.tsx so list/grid modes can coexist (books-view-engine-2).
 *
 * Surface is intentionally unchanged from the PR-1 grid behavior — cover +
 * title + description + item count + relative time + pin indicator +
 * context menu. PR 2 just splits this out for reuse.
 */

import type { Book } from "@/lib/types"
import { getBookKind } from "@/lib/view-engine/use-books-view"
import {
  BookKindIcon,
  BookItemCountChip,
  BookKindChip,
  BookSourceKindChip,
  PinnedChip,
  PriorityChip,
  PropertyChipRow,
} from "@/components/property-chips"
import { StatusBadge } from "@/components/note-fields"
import { shortRelative } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import { Pin as PushPin, Check as PhCheck } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { BookContextMenuItems } from "@/components/books/book-context-menu-items"

interface BookGridCardProps {
  book: Book
  /** Display Properties — which meta chips to surface on the card. Mirrors the
   *  list view's column visibility so the Display popover affects both
   *  surfaces. Undefined = show all. */
  visibleColumns?: string[]
  /** Selected book ids (board/table-parity multi-select). */
  selectedIds?: Set<string>
  /** Toggle a card's selection (hover checkbox). additive = ctrl/meta/shift. */
  onSelect?: (id: string, additive: boolean) => void
  onOpen: (id: string) => void
  onRename: (id: string, currentTitle: string) => void
  onTogglePin: (id: string, pinned: boolean | undefined) => void
  onDelete: (id: string, title: string) => void
  onRestore: (id: string, title: string) => void
  onPermanentDelete: (id: string, title: string) => void
}

export function BookGridCard({
  book,
  visibleColumns,
  selectedIds,
  onSelect,
  onOpen,
  onRename,
  onTogglePin,
  onDelete,
  onRestore,
  onPermanentDelete,
}: BookGridCardProps) {
  const kind = getBookKind(book)
  const sourceKinds = Array.from(new Set((book.smartSources ?? []).map((s) => s.kind)))
  const isSelected = selectedIds?.has(book.id) ?? false

  // Honor Display Properties on the grid card. Undefined = show all (mirrors
  // notes-board BoardCardInner). The 6 displayable book props are status,
  // priority, kind, itemCount, sources, pinned (books.schema).
  const isVisible = (k: string) => !visibleColumns || visibleColumns.includes(k)

  // Footer chip row (status → priority → kind → itemCount → sources → pinned).
  // PropertyChipRow caps at 3 visible + a hover popover for the overflow.
  const chips: React.ReactNode[] = [
    isVisible("status") && kind !== "smart" && (
      <StatusBadge key="status" status={book.status ?? "backlog"} />
    ),
    isVisible("priority") && kind !== "smart" && book.priority && book.priority !== "none" && (
      <PriorityChip key="priority" priority={book.priority} />
    ),
    isVisible("kind") && <BookKindChip key="kind" kind={kind} />,
    isVisible("itemCount") && <BookItemCountChip key="itemCount" count={book.items?.length ?? 0} />,
    isVisible("sources") && sourceKinds.length > 0 && (
      <BookSourceKindChip key="sources" kinds={sourceKinds} />
    ),
    isVisible("pinned") && book.pinned && <PinnedChip key="pinned" />,
  ]

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          onClick={() => !book.trashed && onOpen(book.id)}
          className={cn(
            "group relative flex flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-all",
            book.trashed
              ? "border-border/60 opacity-50 hover:bg-hover-bg cursor-default"
              : "border-border/60 hover:bg-hover-bg hover:border-border hover:shadow-sm",
            isSelected && "border-accent/60 bg-accent/[0.04] ring-1 ring-accent/20",
          )}
        >
          {/* Selection checkbox — hover or selected (board/table parity).
              stopPropagation so toggling selection never opens the book. */}
          {onSelect && !book.trashed && (
            <div
              className={cn(
                "absolute right-2 top-2 z-10 flex h-4 w-4 items-center justify-center rounded border transition-all cursor-pointer",
                isSelected
                  ? "border-accent bg-accent opacity-100"
                  : "border-border bg-card opacity-0 group-hover:opacity-100 hover:border-foreground/50",
              )}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(book.id, e.metaKey || e.ctrlKey || e.shiftKey)
              }}
            >
              {isSelected && <PhCheck className="text-accent-foreground" size={10} strokeWidth={2.5} />}
            </div>
          )}

          {/* Pin indicator — yields its slot to the checkbox on hover/select. */}
          {book.pinned && (
            <PushPin
              size={11}
              fill="currentColor" strokeWidth={2}
              className={cn(
                "absolute top-2 text-amber-500 transition-all",
                onSelect && !book.trashed
                  ? isSelected ? "right-8" : "right-2 group-hover:right-8"
                  : "right-2",
              )}
            />
          )}

          {/* Cover icon — BookKindIcon (kind-shape carries meaning).
              emoji 영구 폐기 (2026-05-12 결정): Plot phosphor 시스템 정합.
              LOCKED #103 (2026-05-24): no tinted box wrapper, color tone only. */}
          <BookKindIcon kind={kind} size={22} />

          {/* Title */}
          <h3 className="text-note font-medium text-foreground line-clamp-2 leading-snug">
            {book.title || "Untitled book"}
          </h3>

          {/* Description (optional) */}
          {book.description && (
            <p className="text-2xs text-muted-foreground line-clamp-2 leading-snug">
              {book.description}
            </p>
          )}

          <div className="flex-1" />

          {/* Display-property chip row (driven by visibleColumns). */}
          <PropertyChipRow chips={chips} maxVisible={3} />

          {/* Footer — relative updated time (item count now a display chip). */}
          <div className="mt-1 flex items-center gap-2 text-2xs text-muted-foreground/70">
            <span>{shortRelative(book.updatedAt)}</span>
          </div>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <BookContextMenuItems
          book={book}
          onRename={onRename}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}
