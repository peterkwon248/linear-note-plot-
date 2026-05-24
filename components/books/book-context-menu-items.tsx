"use client"

/**
 * BookContextMenuItems — DRY helper for the book right-click menu.
 *
 * Shared by:
 *   - book-grid-card.tsx (grid mode card)
 *   - books-board.tsx (board mode card)
 *
 * Pattern mirrors note-context-menu-items.tsx (영구 룰 21 entity-uniformity —
 * same action set across surfaces; only presentation varies). All side
 * effects (store mutations, toasts) come in via props so callers can swap
 * behavior per-surface.
 */

import type { Book } from "@/lib/types"
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { Pin as PushPin, PinOff as PushPinSlash, Trash2 as Trash, RotateCcw as ArrowCounterClockwise, Pencil as PencilSimple } from "lucide-react"

export interface BookContextMenuItemsProps {
  book: Book
  onRename: (id: string, currentTitle: string) => void
  onTogglePin: (id: string, pinned: boolean | undefined) => void
  onDelete: (id: string, title: string) => void
  onRestore: (id: string, title: string) => void
  onPermanentDelete: (id: string, title: string) => void
}

export function BookContextMenuItems({
  book,
  onRename,
  onTogglePin,
  onDelete,
  onRestore,
  onPermanentDelete,
}: BookContextMenuItemsProps) {
  if (book.trashed) {
    return (
      <>
        <ContextMenuItem
          onClick={() => onRestore(book.id, book.title)}
          className="text-note"
        >
          <ArrowCounterClockwise size={14} strokeWidth={2} className="mr-2 text-muted-foreground" />
          Restore
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onPermanentDelete(book.id, book.title)}
          className="text-note text-destructive focus:text-destructive"
        >
          <Trash size={14} strokeWidth={2} className="mr-2" />
          Delete forever
        </ContextMenuItem>
      </>
    )
  }
  return (
    <>
      <ContextMenuItem onClick={() => onRename(book.id, book.title)} className="text-note">
        <PencilSimple size={14} strokeWidth={2} className="mr-2 text-muted-foreground" />
        Rename
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => onTogglePin(book.id, book.pinned)}
        className="text-note"
      >
        {book.pinned ? (
          <>
            <PushPinSlash size={14} strokeWidth={2} className="mr-2 text-muted-foreground" />
            Unpin
          </>
        ) : (
          <>
            <PushPin size={14} strokeWidth={2} className="mr-2 text-muted-foreground" />
            Pin to sidebar
          </>
        )}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        onClick={() => onDelete(book.id, book.title)}
        className="text-note text-destructive focus:text-destructive"
      >
        <Trash size={14} strokeWidth={2} className="mr-2" />
        Move to trash
      </ContextMenuItem>
    </>
  )
}
