"use client"

/**
 * Book table — column-rich list mode for /books.
 *
 * Replaces the simpler BookListRow (PR 2, books-view-engine-2) per user
 * feedback 2026-05-12: NotesTable 수준 일관성 기대 (column header + sort
 * toggle + multi-column). Mirrors notes-table.tsx COLUMN_DEFS / TH pattern.
 *
 * Columns (toggleable via visibleColumns):
 *   - title:     book cover + title (always visible, flex-1)
 *   - kind:      Smart / Manual / Hybrid (BookKindChip)
 *   - itemCount: Book.items.length
 *   - sources:   smart-source kinds (BookSourceKindChip mini-bar)
 *   - updatedAt: relative time
 *   - createdAt: relative time
 *
 * Pin indicator stays inline next to the title (column-free, matches grid).
 * Context menu (Rename / Pin / Trash) preserved.
 */

import type { Book } from "@/lib/types"
import type { SortField, SortDirection } from "@/lib/view-engine/types"
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
import { PushPinSlash } from "@phosphor-icons/react/dist/ssr/PushPinSlash"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp"
import { ArrowDown } from "@phosphor-icons/react/dist/ssr/ArrowDown"
import { ArrowsDownUp } from "@phosphor-icons/react/dist/ssr/ArrowsDownUp"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

/* ── Column defs ───────────────────────────────────────── */

interface BookColumnDef {
  id: string
  label: string
  width: string
  align?: "left" | "center" | "right"
  sortField?: SortField
}

const BOOK_COLUMNS: BookColumnDef[] = [
  { id: "title",     label: "Name",     width: "flex-1 min-w-0", sortField: "title" },
  { id: "kind",      label: "Kind",     width: "w-[110px] shrink-0", align: "left" },
  { id: "itemCount", label: "Items",    width: "w-[72px] shrink-0",  align: "right", sortField: "itemCount" },
  { id: "sources",   label: "Sources",  width: "w-[88px] shrink-0",  align: "left" },
  { id: "updatedAt", label: "Updated",  width: "w-[80px] shrink-0",  align: "right", sortField: "updatedAt" },
  { id: "createdAt", label: "Created",  width: "w-[80px] shrink-0",  align: "right", sortField: "createdAt" },
]

/* ── Header cell ───────────────────────────────────────── */

function TH({
  label,
  col,
  sortCol,
  sortDir,
  onSort,
  align,
}: {
  label: string
  col?: SortField
  sortCol: SortField
  sortDir: SortDirection
  onSort: (c: SortField) => void
  align?: "left" | "center" | "right"
}) {
  const alignClass = align === "right" ? "justify-end text-right"
    : align === "center" ? "justify-center text-center"
    : "justify-start text-left"

  if (!col) {
    return (
      <span className={cn("inline-flex items-center text-note font-medium text-foreground/80", alignClass)}>
        {label}
      </span>
    )
  }
  const active = sortCol === col
  return (
    <button
      type="button"
      className={cn(
        "group/th inline-flex items-center gap-1 text-note font-medium text-foreground/80 transition-colors hover:text-foreground",
        alignClass,
      )}
      onClick={() => onSort(col)}
    >
      {label}
      {active ? (
        sortDir === "asc"
          ? <ArrowUp className="text-muted-foreground" size={12} weight="regular" />
          : <ArrowDown className="text-muted-foreground" size={12} weight="regular" />
      ) : (
        <ArrowsDownUp className="opacity-0 group-hover/th:opacity-60" size={12} weight="regular" />
      )}
    </button>
  )
}

/* ── BookTable ─────────────────────────────────────────── */

interface BookTableProps {
  books: Book[]
  visibleColumns: string[]
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
  onOpen: (id: string) => void
  onRename: (id: string, currentTitle: string) => void
  onTogglePin: (id: string, pinned: boolean | undefined) => void
  onDelete: (id: string, title: string) => void
  onRestore: (id: string, title: string) => void
  onPermanentDelete: (id: string, title: string) => void
}

export function BookTable({
  books,
  visibleColumns,
  sortField,
  sortDirection,
  onSort,
  onOpen,
  onRename,
  onTogglePin,
  onDelete,
  onRestore,
  onPermanentDelete,
}: BookTableProps) {
  // `title` is always visible (it's the entity identity column).
  const cols = BOOK_COLUMNS.filter((c) => c.id === "title" || visibleColumns.includes(c.id))

  return (
    <div className="flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex h-9 items-center gap-3 border-b border-border bg-background px-6">
        {cols.map((c) => (
          <div key={c.id} className={cn("flex items-center", c.width)}>
            <TH
              label={c.label}
              col={c.sortField}
              sortCol={sortField}
              sortDir={sortDirection}
              onSort={onSort}
              align={c.align}
            />
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-col">
        {books.map((book) => (
          <BookRow
            key={book.id}
            book={book}
            cols={cols}
            onOpen={onOpen}
            onRename={onRename}
            onTogglePin={onTogglePin}
            onDelete={onDelete}
            onRestore={onRestore}
            onPermanentDelete={onPermanentDelete}
          />
        ))}
      </div>
    </div>
  )
}

/* ── BookRow ───────────────────────────────────────────── */

function BookRow({
  book,
  cols,
  onOpen,
  onRename,
  onTogglePin,
  onDelete,
  onRestore,
  onPermanentDelete,
}: {
  book: Book
  cols: BookColumnDef[]
  onOpen: (id: string) => void
  onRename: (id: string, currentTitle: string) => void
  onTogglePin: (id: string, pinned: boolean | undefined) => void
  onDelete: (id: string, title: string) => void
  onRestore: (id: string, title: string) => void
  onPermanentDelete: (id: string, title: string) => void
}) {
  const kind = getBookKind(book)
  const sourceKinds = Array.from(new Set((book.smartSources ?? []).map((s) => s.kind)))

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
          {cols.map((c) => (
            <div key={c.id} className={cn("flex items-center", c.width)}>
              {renderCell(c.id, book, kind, sourceKinds)}
            </div>
          ))}
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

/* ── Cell renderer ─────────────────────────────────────── */

function renderCell(
  colId: string,
  book: Book,
  kind: "smart" | "manual" | "hybrid",
  sourceKinds: Array<"folder" | "category" | "tag" | "label" | "sticker">,
): React.ReactNode {
  switch (colId) {
    case "title":
      return (
        <>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground/70">
            {book.coverEmoji ? (
              <span className="text-base leading-none">{book.coverEmoji}</span>
            ) : (
              <PhBooks size={14} weight="regular" />
            )}
          </span>
          <span className="min-w-0 flex-1 truncate text-note text-foreground pl-2">
            {book.title || "Untitled book"}
          </span>
          {book.pinned && (
            <PushPin size={11} weight="fill" className="ml-1 shrink-0 text-amber-500" />
          )}
        </>
      )
    case "kind":
      return <BookKindChip kind={kind} />
    case "itemCount":
      return (
        <span className="w-full text-right text-2xs text-muted-foreground tabular-nums">
          {book.items?.length ?? 0}
        </span>
      )
    case "sources":
      return sourceKinds.length > 0
        ? <BookSourceKindChip kinds={sourceKinds} />
        : <span className="text-2xs text-muted-foreground/40">—</span>
    case "updatedAt":
      return (
        <span className="w-full text-right text-2xs text-muted-foreground tabular-nums">
          {shortRelative(book.updatedAt)}
        </span>
      )
    case "createdAt":
      return (
        <span className="w-full text-right text-2xs text-muted-foreground tabular-nums">
          {shortRelative(book.createdAt)}
        </span>
      )
    default:
      return null
  }
}

// Suppress unused-import warning for BookItemCountChip — keep export available
// for board mode + future use; renderer uses raw count instead.
void BookItemCountChip
