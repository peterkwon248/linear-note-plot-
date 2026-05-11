"use client"

/**
 * Book list row — horizontal compact layout for the list viewMode in /books.
 *
 * Mirrors the Notes/Wiki list-row visual budget (h-9 ~ 36px, .a-row gap),
 * but Books has its own ContextMenu + Pin indicator so we keep the row
 * markup local rather than threading every prop into a shared component.
 *
 * Surfaces: cover emoji (small), title, Pin indicator, BookKindChip,
 * BookItemCountChip, BookSourceKindChip mini-bar, relative updated time.
 * Hover/active styling matches Notes table .a-row pattern.
 */

import type { Book } from "@/lib/types"
import { getBookKind } from "@/lib/view-engine/use-books-view"
import {
  BookItemCountChip,
  BookKindChip,
  BookSourceKindChip,
} from "@/components/property-chips"
import { shortRelative } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import { Books as PhBooks } from "@phosphor-icons/react/dist/ssr/Books"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { PushPinSlash } from "@phosphor-icons/react/dist/ssr/PushPinSlash"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise"

interface BookListRowProps {
  book: Book
  onOpen: (id: string) => void
  onRename: (id: string, currentTitle: string) => void
  onTogglePin: (id: string, pinned: boolean | undefined) => void
  onDelete: (id: string, title: string) => void
  onRestore: (id: string, title: string) => void
  onPermanentDelete: (id: string, title: string) => void
}

export function BookListRow({
  book,
  onOpen,
  onRename,
  onTogglePin,
  onDelete,
  onRestore,
  onPermanentDelete,
}: BookListRowProps) {
  const kind = getBookKind(book)
  const sourceKinds = Array.from(
    new Set(
      (book.smartSources ?? []).map((s) => s.kind),
    ),
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          onClick={() => !book.trashed && onOpen(book.id)}
          className={cn(
            "group flex h-9 w-full items-center gap-3 border-b border-border/30 px-6 text-left transition-colors",
            book.trashed
              ? "opacity-50 hover:bg-hover-bg cursor-default"
              : "hover:bg-hover-bg",
          )}
        >
          {/* Cover */}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground/70">
            {book.coverEmoji ? (
              <span className="text-base leading-none">{book.coverEmoji}</span>
            ) : (
              <PhBooks size={14} weight="regular" />
            )}
          </span>

          {/* Title (flex-1 truncate) */}
          <span className="min-w-0 flex-1 truncate text-note text-foreground">
            {book.title || "Untitled book"}
          </span>

          {/* Chips */}
          <span className="flex shrink-0 items-center gap-1.5">
            <BookKindChip kind={kind} />
            <BookItemCountChip count={book.items?.length ?? 0} />
            <BookSourceKindChip kinds={sourceKinds} />
            {book.pinned && (
              <PushPin
                size={11}
                weight="fill"
                className="text-amber-500"
              />
            )}
            <span className="w-12 text-right text-2xs text-muted-foreground/70 tabular-nums">
              {shortRelative(book.updatedAt)}
            </span>
          </span>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        {book.trashed ? (
          <>
            <ContextMenuItem
              onClick={() => onRestore(book.id, book.title)}
              className="text-note"
            >
              <ArrowCounterClockwise size={14} weight="regular" className="mr-2 text-muted-foreground" />
              Restore
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onPermanentDelete(book.id, book.title)}
              className="text-note text-destructive focus:text-destructive"
            >
              <Trash size={14} weight="regular" className="mr-2" />
              Delete forever
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuItem onClick={() => onRename(book.id, book.title)} className="text-note">
              <PencilSimple size={14} weight="regular" className="mr-2 text-muted-foreground" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onTogglePin(book.id, book.pinned)}
              className="text-note"
            >
              {book.pinned ? (
                <>
                  <PushPinSlash size={14} weight="regular" className="mr-2 text-muted-foreground" />
                  Unpin
                </>
              ) : (
                <>
                  <PushPin size={14} weight="regular" className="mr-2 text-muted-foreground" />
                  Pin to sidebar
                </>
              )}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDelete(book.id, book.title)}
              className="text-note text-destructive focus:text-destructive"
            >
              <Trash size={14} weight="regular" className="mr-2" />
              Move to trash
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
