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
import { BookKindIcon } from "@/components/property-chips"
import { shortRelative } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { BookContextMenuItems } from "@/components/books/book-context-menu-items"

interface BookGridCardProps {
  book: Book
  onOpen: (id: string) => void
  onRename: (id: string, currentTitle: string) => void
  onTogglePin: (id: string, pinned: boolean | undefined) => void
  onDelete: (id: string, title: string) => void
  onRestore: (id: string, title: string) => void
  onPermanentDelete: (id: string, title: string) => void
}

export function BookGridCard({
  book,
  onOpen,
  onRename,
  onTogglePin,
  onDelete,
  onRestore,
  onPermanentDelete,
}: BookGridCardProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          onClick={() => !book.trashed && onOpen(book.id)}
          className={cn(
            "group relative flex flex-col items-start gap-2 rounded-lg border border-border/60 bg-card p-4 text-left transition-all",
            book.trashed
              ? "opacity-50 hover:bg-hover-bg cursor-default"
              : "hover:bg-hover-bg hover:border-border hover:shadow-sm",
          )}
        >
          {/* Pin indicator */}
          {book.pinned && (
            <PushPin
              size={11}
              weight="fill"
              className="absolute right-2 top-2 text-amber-500"
            />
          )}

          {/* Cover icon — BookKindIcon (kind-shape carries meaning).
              emoji 영구 폐기 (2026-05-12 결정): Plot phosphor 시스템 정합. */}
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary/40 text-muted-foreground/70">
            <BookKindIcon kind={getBookKind(book)} size={22} />
          </div>

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

          {/* Footer */}
          <div className="mt-1 flex items-center gap-2 text-2xs text-muted-foreground/70">
            <span className="tabular-nums">
              {book.items.length} item{book.items.length === 1 ? "" : "s"}
            </span>
            <span>·</span>
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
