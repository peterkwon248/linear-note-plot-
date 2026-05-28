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
import { usePlotStore } from "@/lib/store"
import {
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { FolderPicker, useFolderPickerData } from "@/components/folder-picker"
import { getEntityColor } from "@/lib/colors"
import {
  Pin as PushPin,
  PinOff as PushPinSlash,
  Trash2 as Trash,
  RotateCcw as ArrowCounterClockwise,
  Pencil as PencilSimple,
  FolderOpen,
  Check as PhCheck,
  Plus as PhPlus,
} from "lucide-react"

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
  // Self-contained folder wiring (v149 Phase 2). Notes thread these through
  // props from the table; books have three surfaces (grid/board/list) so we
  // read the store directly here to keep the helper drop-in. kind="book"
  // filter is enforced by useFolderPickerData + setBookFolders' safety net.
  const { folders: bookFolders, createFolderInline } = useFolderPickerData("book")
  const setBookFolders = usePlotStore((s) => s.setBookFolders)
  // Single-replace helper: empty string = clear membership ("No folder").
  const setFolderSingle = (folderId: string) =>
    setBookFolders(book.id, folderId ? [folderId] : [])

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

      {/* Move to folder (single-replace) — Notes/Wiki 정합 (v149 Phase 2). */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="text-note">
          <FolderOpen className="mr-2 text-muted-foreground" size={16} strokeWidth={2} />
          Move to folder
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          <ContextMenuItem
            onClick={() => setFolderSingle("")}
            className={`text-note ${book.folderIds.length === 0 ? "font-medium" : ""}`}
          >
            <span className="text-muted-foreground">No folder</span>
            {book.folderIds.length === 0 && <PhCheck className="ml-auto text-accent" size={14} strokeWidth={2.5} />}
          </ContextMenuItem>
          {bookFolders.length > 0 && <ContextMenuSeparator />}
          {bookFolders.map((f) => (
            <ContextMenuItem
              key={f.id}
              onClick={() => setFolderSingle(f.id)}
              className={`text-note ${book.folderIds.includes(f.id) ? "font-medium" : ""}`}
            >
              <span className="h-2 w-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: getEntityColor(f.color) }} />
              <span className="truncate">{f.name}</span>
              {book.folderIds.includes(f.id) && <PhCheck className="ml-auto text-accent shrink-0" size={14} strokeWidth={2.5} />}
            </ContextMenuItem>
          ))}
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => createFolderInline((newId) => setFolderSingle(newId))}
            className="text-note text-muted-foreground hover:text-foreground"
          >
            <PhPlus className="mr-2" size={14} strokeWidth={2.5} />
            New folder…
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      {/* Add to folders… (multi-toggle) — Notes/Wiki 정합 (v149 Phase 2). */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="text-note">
          <FolderOpen className="mr-2 text-muted-foreground" size={16} strokeWidth={2} />
          Add to folders…
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-56 p-1">
          <FolderPicker
            kind="book"
            currentFolderIds={book.folderIds}
            selectMode="multi"
            onApply={(ids) => setBookFolders(book.id, ids)}
          />
        </ContextMenuSubContent>
      </ContextMenuSub>

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
