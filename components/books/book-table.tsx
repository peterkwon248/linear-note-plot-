"use client"

/**
 * Book table — column-rich list mode for /books.
 *
 * Replaces the simpler BookListRow (PR 2, books-view-engine-2) per user
 * feedback 2026-05-12: NotesTable 수준 일관성 기대 (column header + sort
 * toggle + multi-column + multi-select checkbox). Mirrors notes-table.tsx
 * COLUMN_DEFS / TH / checkbox pattern.
 *
 * Columns (toggleable via visibleColumns):
 *   - title:     book cover + title (always visible, flex-1)
 *   - kind:      Smart / Manual / Hybrid (BookKindChip)
 *   - itemCount: Book.items.length
 *   - sources:   smart-source kinds (BookSourceKindChip mini-bar)
 *   - updatedAt: relative time
 *   - createdAt: relative time
 *
 * Leading 32px checkbox column (notes-table parity) — header toggles select-all,
 * per-row toggles individual. Selection state lives locally for now;
 * bulk-action bar is a follow-up.
 * Pin indicator stays inline next to the title (column-free, matches grid).
 * Context menu (Rename / Pin / Trash) preserved.
 */

import { useState } from "react"
import type { Book } from "@/lib/types"
import type { SortField, SortDirection, GroupBy } from "@/lib/view-engine/types"
import { getBookKind, type BookGroup } from "@/lib/view-engine/use-books-view"
import {
  BookItemCountChip,
  BookKindChip,
  BookKindIcon,
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
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Minus as PhMinus } from "@phosphor-icons/react/dist/ssr/Minus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
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
  { id: "title",     label: "Name",     width: "flex-1 min-w-[120px]", sortField: "title" },
  { id: "kind",      label: "Kind",     width: "w-[110px] shrink-0", align: "left" },
  { id: "itemCount", label: "Items",    width: "w-[72px] shrink-0",  align: "right", sortField: "itemCount" },
  { id: "sources",   label: "Sources",  width: "w-[100px] shrink-0", align: "left" },
  { id: "pinned",    label: "Pin",      width: "w-[48px] shrink-0",  align: "center" },
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
  /** Optional grouped view. When `groupBy !== "none"` and `groups.length > 0`,
   * the table renders one section per group with a sticky-style header row.
   * Otherwise falls back to the flat `books` list. */
  groups?: BookGroup[]
  groupBy?: GroupBy
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
  groups,
  groupBy,
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
  // Grouping is active when caller passed non-trivial groups + a groupBy
  // dimension other than "none". When inactive, fall back to flat `books`.
  const isGrouped =
    !!groupBy &&
    groupBy !== "none" &&
    Array.isArray(groups) &&
    groups.length > 0 &&
    !(groups.length === 1 && groups[0].key === "_all")
  // `title` is always visible (it's the entity identity column).
  const cols = BOOK_COLUMNS.filter((c) => c.id === "title" || visibleColumns.includes(c.id))

  // Multi-select state (mirrors notes-table selectedIds pattern). Local to
  // the table for now — surfaced to a bulk-action bar when needed.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const allChecked = selectedIds.size === books.length && books.length > 0
  const someChecked = selectedIds.size > 0 && !allChecked

  const toggleAll = () => {
    if (allChecked) setSelectedIds(new Set())
    else setSelectedIds(new Set(books.map((b) => b.id)))
  }
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onClearSelection = () => setSelectedIds(new Set())

  return (
    <div className="relative flex flex-col">
      {/* Floating action bar — visible when 1+ rows checked.
          Notes/Wiki 정합 (사용자 시그널 2026-05-12). */}
      {selectedIds.size > 0 && (
        <BookFloatingBar
          ids={selectedIds}
          books={books}
          onClear={onClearSelection}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex h-9 items-center gap-3 border-b border-border bg-background pl-3 pr-6">
        {/* Select-all checkbox (notes-table parity) */}
        <div className="flex w-6 shrink-0 items-center justify-center">
          <CheckboxBox
            state={allChecked ? "all" : someChecked ? "partial" : "none"}
            onClick={toggleAll}
          />
        </div>
        {cols.map((c) => (
          <div key={c.id} className={cn("flex items-center overflow-hidden", c.width)}>
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
        {isGrouped ? (
          // Grouped view — one section per BookGroup. Header row mirrors
          // notes-table group header style (sticky-ish band + label + count).
          groups!.map((group) => (
            <div key={group.key}>
              {/* Notes `.a-tg` 패턴 통일 (2026-05-13) — entity별 그룹 헤더
                  모양새 일관성. chevron column 비워두고 icon/label/count/line. */}
              <div className="a-tg">
                <span />
                {(group.key === "smart" || group.key === "manual" || group.key === "hybrid") && (
                  <BookKindIcon kind={group.key} size={12} />
                )}
                {group.key === "pinned" && (
                  <PushPin size={12} weight="fill" className="text-amber-500" />
                )}
                {group.key === "others" && (
                  <PushPinSlash size={12} weight="regular" className="text-muted-foreground/60" />
                )}
                {!["smart", "manual", "hybrid", "pinned", "others"].includes(group.key) && <span />}
                <span className="a-tg__label">{group.label || "Untitled"}</span>
                <span className="a-tg__count tabular-nums">{group.books.length}</span>
                <div className="a-tg__line" />
              </div>
              {group.books.map((book) => (
                <BookRow
                  key={book.id}
                  book={book}
                  cols={cols}
                  checked={selectedIds.has(book.id)}
                  onToggleCheck={() => toggleOne(book.id)}
                  onOpen={onOpen}
                  onRename={onRename}
                  onTogglePin={onTogglePin}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  onPermanentDelete={onPermanentDelete}
                />
              ))}
            </div>
          ))
        ) : (
          books.map((book) => (
            <BookRow
              key={book.id}
              book={book}
              cols={cols}
              checked={selectedIds.has(book.id)}
              onToggleCheck={() => toggleOne(book.id)}
              onOpen={onOpen}
              onRename={onRename}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
              onRestore={onRestore}
              onPermanentDelete={onPermanentDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}

/* ── BookFloatingBar ───────────────────────────────────── */

/**
 * Bulk-action floating bar visible when one or more rows are checked.
 * Notes FloatingActionBar 패턴 정합 (책 도메인은 액션 적음 — Pin/Trash만).
 * Bulk pin: 선택된 모든 책이 이미 pinned면 Unpin, 아니면 Pin (mixed=Pin).
 */
function BookFloatingBar({
  ids,
  books,
  onClear,
  onTogglePin,
  onDelete,
}: {
  ids: Set<string>
  books: Book[]
  onClear: () => void
  onTogglePin: (id: string, pinned: boolean | undefined) => void
  onDelete: (id: string, title: string) => void
}) {
  const selectedBooks = books.filter((b) => ids.has(b.id))
  const count = selectedBooks.length
  if (count === 0) return null
  const allPinned = selectedBooks.every((b) => Boolean(b.pinned))

  const handlePin = () => {
    // allPinned면 모두 unpin / 아니면 모두 pin (mixed→pin, batch UX 표준)
    for (const b of selectedBooks) {
      if (allPinned) {
        if (b.pinned) onTogglePin(b.id, true)
      } else {
        if (!b.pinned) onTogglePin(b.id, false)
      }
    }
    onClear()
  }

  const handleTrash = () => {
    for (const b of selectedBooks) {
      onDelete(b.id, b.title)
    }
    onClear()
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-popover px-2 py-1.5 shadow-lg">
        <button
          type="button"
          onClick={onClear}
          className="flex h-7 items-center gap-1 rounded-md px-2 text-2xs font-medium text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
          title="Clear selection (Esc)"
        >
          <PhX size={12} weight="regular" />
          <span className="tabular-nums">{count} selected</span>
        </button>
        <div className="h-5 w-px bg-border mx-0.5" />
        <button
          type="button"
          onClick={handlePin}
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-2xs font-medium text-foreground hover:bg-hover-bg transition-colors"
        >
          {allPinned
            ? <PushPinSlash size={13} weight="regular" />
            : <PushPin size={13} weight="regular" className="text-amber-500" />}
          {allPinned ? "Unpin" : "Pin"}
        </button>
        <button
          type="button"
          onClick={handleTrash}
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-2xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash size={13} weight="regular" />
          Trash
        </button>
      </div>
    </div>
  )
}

/* ── CheckboxBox ───────────────────────────────────────── */

function CheckboxBox({
  state,
  onClick,
}: {
  state: "all" | "partial" | "none"
  onClick: () => void
}) {
  return (
    <div
      data-checkbox
      role="checkbox"
      aria-checked={state === "all" ? true : state === "partial" ? "mixed" : false}
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          e.stopPropagation()
          onClick()
        }
      }}
      className={cn(
        "h-4 w-4 rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors shadow-sm",
        state === "all"
          ? "bg-accent border-accent"
          : state === "partial"
            ? "bg-accent/50 border-accent"
            : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-500",
      )}
    >
      {state === "all" && <PhCheck className="text-accent-foreground" size={10} weight="bold" />}
      {state === "partial" && <PhMinus className="text-accent-foreground" size={10} weight="regular" />}
    </div>
  )
}

/* ── BookRow ───────────────────────────────────────────── */

function BookRow({
  book,
  cols,
  checked,
  onToggleCheck,
  onOpen,
  onRename,
  onTogglePin,
  onDelete,
  onRestore,
  onPermanentDelete,
}: {
  book: Book
  cols: BookColumnDef[]
  checked: boolean
  onToggleCheck: () => void
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
        <div
          onClick={(e) => {
            // Don't open when click landed on the checkbox.
            if ((e.target as HTMLElement).closest('[data-checkbox]')) return
            if (!book.trashed) onOpen(book.id)
          }}
          className={cn(
            // 2026-05-14: row divider removed for Notes/Wiki list parity —
            // user flagged that books was the only entity with a visible
            // border between rows. Hover bg still provides row separation.
            "group flex h-9 w-full items-center gap-3 pl-3 pr-6 text-left transition-colors",
            book.trashed
              ? "opacity-50 hover:bg-hover-bg cursor-default"
              : "hover:bg-hover-bg cursor-pointer",
          )}
        >
          <div
            className={cn(
              "flex w-6 shrink-0 items-center justify-center",
              // Notes/Wiki parity: hide checkbox until row hover unless the
              // row is checked. Avoids the "always-visible empty squares"
              // mismatch the user flagged vs notes/wiki list rows.
              checked ? "visible" : "invisible group-hover:visible",
            )}
          >
            <CheckboxBox
              state={checked ? "all" : "none"}
              onClick={onToggleCheck}
            />
          </div>
          {cols.map((c) => (
            <div key={c.id} className={cn("flex items-center overflow-hidden", c.width)}>
              {renderCell(c.id, book, kind, sourceKinds)}
            </div>
          ))}
        </div>
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
            <BookKindIcon kind={kind} size={14} />
          </span>
          <span className="min-w-0 truncate text-note text-foreground pl-2">
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
    case "pinned":
      return book.pinned
        ? <PushPin size={11} weight="fill" className="text-amber-500" />
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
