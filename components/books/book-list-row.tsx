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
import { useT } from "@/lib/i18n"
import { getBookKind } from "@/lib/view-engine/use-books-view"
import {
  BookItemCountChip,
  BookKindChip,
  BookSourceKindChip,
} from "@/components/property-chips"
import { shortRelative } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import { Library as PhBooks, Pin as PushPin } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Pencil as PencilSimple, PinOff as PushPinSlash, Trash2 as Trash, RotateCcw as ArrowCounterClockwise } from "lucide-react"

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
  const t = useT()
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
          {/* Cover — emoji 영구 폐기 (2026-05-12), BookKindIcon 사용 분기는
              BookTable로 이관됨 (PR #293). 이 파일은 사용 안 되지만 빌드
              cleanliness 위해 BookKindIcon 분기 정리. */}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground/70">
            <PhBooks size={14} strokeWidth={2} />
          </span>

          {/* Title (flex-1 truncate) */}
          <span className="min-w-0 flex-1 truncate text-note text-foreground">
            {book.title || t("book.untitled")}
          </span>

          {/* Chips */}
          <span className="flex shrink-0 items-center gap-1.5">
            <BookKindChip kind={kind} />
            <BookItemCountChip count={book.items?.length ?? 0} />
            <BookSourceKindChip kinds={sourceKinds} />
            {book.pinned && (
              <PushPin
                size={11}
                fill="currentColor" strokeWidth={2}
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
              <ArrowCounterClockwise size={14} strokeWidth={2} className="mr-2 text-muted-foreground" />
              {t("common.restore")}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onPermanentDelete(book.id, book.title)}
              className="text-note text-destructive focus:text-destructive"
            >
              <Trash size={14} strokeWidth={2} className="mr-2" />
              {t("common.delete_forever")}
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuItem onClick={() => onRename(book.id, book.title)} className="text-note">
              <PencilSimple size={14} strokeWidth={2} className="mr-2 text-muted-foreground" />
              {t("common.rename")}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onTogglePin(book.id, book.pinned)}
              className="text-note"
            >
              {book.pinned ? (
                <>
                  <PushPinSlash size={14} strokeWidth={2} className="mr-2 text-muted-foreground" />
                  {t("common.unpin")}
                </>
              ) : (
                <>
                  <PushPin size={14} strokeWidth={2} className="mr-2 text-muted-foreground" />
                  {t("common.pin_sidebar")}
                </>
              )}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDelete(book.id, book.title)}
              className="text-note text-destructive focus:text-destructive"
            >
              <Trash size={14} strokeWidth={2} className="mr-2" />
              {t("common.move_to_trash")}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
