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
import { shortRelative } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import { Books as PhBooks } from "@phosphor-icons/react/dist/ssr/Books"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { PushPinSlash } from "@phosphor-icons/react/dist/ssr/PushPinSlash"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

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

          {/* Cover icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary/40 text-muted-foreground/70">
            {book.coverEmoji ? (
              <span className="text-2xl leading-none">{book.coverEmoji}</span>
            ) : (
              <PhBooks size={22} weight="regular" />
            )}
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
