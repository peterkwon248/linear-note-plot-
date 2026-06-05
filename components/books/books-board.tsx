"use client"

/**
 * Books board — column-grouped layout for the "board" viewMode in /books.
 *
 * Mirrors NotesBoard's dnd-kit pattern (Option A per
 * .omc/plans/books-view-engine-integration.md):
 *  - Column drag/reorder via `useSortable({ id: "col-${key}" })` +
 *    horizontalListSortingStrategy. Persists to viewState.groupOrder.
 *  - Card drag/drop with semantics that depend on groupBy:
 *      pinned → toggle book.pinned on drop (immediate)
 *      kind   → smart↔manual conversion via confirm() dialog
 *               (smart→manual removes smartSources; manual→smart routes
 *               the user to the book detail page for source configuration)
 *      none   → no card drag (single column)
 *
 * Card surface reuses BookListRow chip set (kind/itemCount/source mini-bar/
 * pin/updated) but is rendered vertically to fit the column layout. Cover
 * emoji + title up top, chips below.
 *
 * Edit-or-trash safety: card drag never deletes a book. The riskiest path
 * (smart→manual) just clears smartSources, leaving Book.items intact.
 */

import { useCallback, useMemo, useState } from "react"
import { useT } from "@/lib/i18n"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Book, NoteStatus } from "@/lib/types"
import type { BookGroup, BookKind } from "@/lib/view-engine/use-books-view"
import { getBookKind } from "@/lib/view-engine/use-books-view"
import type { GroupBy, ViewState } from "@/lib/view-engine/types"
import {
  BookItemCountChip,
  BookKindChip,
  BookKindIcon,
  BookSourceKindChip,
  PinnedChip,
  PriorityChip,
  PropertyChipRow,
} from "@/components/property-chips"
import { shortRelative } from "@/lib/format-utils"
import { StatusShapeIcon } from "@/components/status-icon"
import { STATUS_CONFIG, StatusBadge } from "@/components/note-fields"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Pin as PushPin, Zap as Lightning, Pencil as PencilSimple, Sparkles as Sparkle, Pin as PushPinSimple } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { BookContextMenuItems } from "@/components/books/book-context-menu-items"

interface BooksBoardProps {
  groups: BookGroup[]
  groupBy: GroupBy
  viewState: ViewState
  updateViewState: (patch: Partial<ViewState>) => void
  onOpen: (id: string) => void
  onTogglePin: (id: string, pinned: boolean | undefined) => void
  onConvertToManual: (id: string, title: string) => void
  onSetStatus: (id: string, status: NoteStatus) => void
  // Right-click context menu — same actions as the grid card / list row.
  onRename: (id: string, currentTitle: string) => void
  onDelete: (id: string, title: string) => void
  onRestore: (id: string, title: string) => void
  onPermanentDelete: (id: string, title: string) => void
}

export function BooksBoard({
  groups,
  groupBy,
  viewState,
  updateViewState,
  onOpen,
  onTogglePin,
  onConvertToManual,
  onSetStatus,
  onRename,
  onDelete,
  onRestore,
  onPermanentDelete,
}: BooksBoardProps) {
  const t = useT()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  // Resolve persisted column order — falls back to natural group order.
  const resolvedGroups = useMemo(() => {
    const saved = viewState.groupOrder?.[groupBy]
    if (!saved || saved.length === 0) return groups
    const map = new Map(groups.map((g) => [g.key, g]))
    const ordered: BookGroup[] = []
    const seen = new Set<string>()
    for (const k of saved) {
      const g = map.get(k)
      if (g) {
        ordered.push(g)
        seen.add(k)
      }
    }
    for (const g of groups) {
      if (!seen.has(g.key)) ordered.push(g)
    }
    return ordered
  }, [groups, groupBy, viewState.groupOrder])

  const activeBook = useMemo<Book | null>(() => {
    if (!activeDragId || activeDragId.startsWith("col-")) return null
    for (const g of resolvedGroups) {
      const b = g.books.find((book) => book.id === activeDragId)
      if (b) return b
    }
    return null
  }, [activeDragId, resolvedGroups])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) { setActiveDragId(null); return }
      const activeId = String(active.id)
      const overId = String(over.id)

      // ── Column reorder ──
      if (activeId.startsWith("col-") && overId.startsWith("col-")) {
        const aKey = activeId.replace("col-", "")
        const oKey = overId.replace("col-", "")
        if (aKey !== oKey) {
          const currentOrder = resolvedGroups.map((g) => g.key)
          const oldIndex = currentOrder.indexOf(aKey)
          const newIndex = currentOrder.indexOf(oKey)
          if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(currentOrder, oldIndex, newIndex)
            updateViewState({
              groupOrder: {
                ...(viewState.groupOrder ?? {}),
                [groupBy]: newOrder,
              },
            })
          }
        }
        setActiveDragId(null)
        return
      }

      // ── Card drop ──
      // activeId = book id, overId = column key (current group).
      // Same dnd-kit collision risk as notes-board (PR #311 fix):
      // column DOM ref combines useSortable("col-${key}") + useDroppable(key),
      // so over.id may come back as either form non-deterministically. Strip
      // the "col-" prefix to always reach the bare group key downstream.
      const bookId = activeId
      const targetKey = overId.startsWith("col-") ? overId.slice(4) : overId

      // Find the source group of this book
      const sourceGroup = resolvedGroups.find((g) =>
        g.books.some((b) => b.id === bookId),
      )
      if (!sourceGroup || sourceGroup.key === targetKey) {
        setActiveDragId(null)
        return
      }
      const book = sourceGroup.books.find((b) => b.id === bookId)
      if (!book) { setActiveDragId(null); return }

      if (groupBy === "pinned") {
        // pinned → others, or others → pinned: immediate toggle.
        const nextPinned = targetKey === "pinned"
        onTogglePin(book.id, !nextPinned)
        toast.success(nextPinned ? t("books.toast.pinned") : t("books.toast.unpinned"))
      } else if (groupBy === "kind") {
        const targetKind = targetKey as BookKind
        const currentKind = getBookKind(book)
        if (targetKind === "manual" && (currentKind === "smart" || currentKind === "hybrid")) {
          const count = book.smartSources?.length ?? 0
          // Confirmation required: smartSources removal is destructive.
          if (typeof window !== "undefined" && window.confirm(
            t("book.board.confirm_convert").replace("{title}", book.title).replace("{count}", String(count)),
          )) {
            onConvertToManual(book.id, book.title)
            toast.success(t("book.board.toast_converted").replace("{title}", book.title))
          }
        } else if (targetKind === "smart" || targetKind === "hybrid") {
          toast.info(t("book.board.toast_configure_sources"), {
            description: t("book.board.toast_configure_sources_desc"),
          })
        }
        // smart → hybrid / manual → smart etc. fall through (no-op + hint).
      } else if (groupBy === "status") {
        // §11 — status column drag sets book.status (Notes board parity).
        // smart books carry status too (harmless; kind is derived, not status).
        const nextStatus = targetKey as NoteStatus
        onSetStatus(book.id, nextStatus)
        toast.success(t("book.board.toast_status_moved").replace("{status}", STATUS_CONFIG[nextStatus]?.label ?? nextStatus))
      }
      // groupBy === "none" → no card drop targets (single column).

      setActiveDragId(null)
    },
    [resolvedGroups, groupBy, viewState.groupOrder, updateViewState, onTogglePin, onConvertToManual, onSetStatus],
  )

  const isDragDisabled = false

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-3 overflow-x-auto p-6">
        <SortableContext
          items={resolvedGroups.map((g) => `col-${g.key}`)}
          strategy={horizontalListSortingStrategy}
        >
          {resolvedGroups.map((group) => (
            <BookBoardColumn
              key={group.key}
              group={group}
              groupBy={groupBy}
              visibleColumns={viewState.visibleColumns}
              isDragDisabled={isDragDisabled}
              onOpen={onOpen}
              onRename={onRename}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
              onRestore={onRestore}
              onPermanentDelete={onPermanentDelete}
              activeDragId={activeDragId}
            />
          ))}
        </SortableContext>
      </div>
      <DragOverlay>
        {activeBook ? (
          <div className="opacity-90">
            <BookBoardCardInner
              book={activeBook}
              groupBy={groupBy}
              visibleColumns={viewState.visibleColumns}
              onOpen={() => {}}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

/* ── BookBoardColumn ───────────────────────────────────── */

interface BookBoardColumnProps {
  group: BookGroup
  groupBy: GroupBy
  visibleColumns: string[]
  isDragDisabled: boolean
  onOpen: (id: string) => void
  onRename: (id: string, currentTitle: string) => void
  onTogglePin: (id: string, pinned: boolean | undefined) => void
  onDelete: (id: string, title: string) => void
  onRestore: (id: string, title: string) => void
  onPermanentDelete: (id: string, title: string) => void
  activeDragId: string | null
}

function BookBoardColumn({
  group,
  groupBy,
  visibleColumns,
  isDragDisabled,
  onOpen,
  onRename,
  onTogglePin,
  onDelete,
  onRestore,
  onPermanentDelete,
  activeDragId,
}: BookBoardColumnProps) {
  const { setNodeRef: setSortableRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: `col-${group.key}`,
    disabled: isDragDisabled,
  })

  // Cards drop on the column body — match NotesBoard column-as-droppable
  // pattern. Cards drag with their book id; column itself uses "col-" prefix.
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: group.key,
    disabled: isDragDisabled,
  })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const headerIcon = useMemo(() => {
    if (groupBy === "kind") {
      if (group.key === "smart") return <Lightning size={14} strokeWidth={2} className="text-muted-foreground" />
      if (group.key === "manual") return <PencilSimple size={14} strokeWidth={2} className="text-muted-foreground" />
      if (group.key === "hybrid") return <Sparkle size={14} strokeWidth={2} className="text-muted-foreground" />
    }
    if (groupBy === "pinned") {
      if (group.key === "pinned") return <PushPin size={14} fill="currentColor" strokeWidth={2} className="text-amber-500" />
      return <PushPinSimple size={14} strokeWidth={2} className="text-muted-foreground" />
    }
    if (groupBy === "status") {
      return <StatusShapeIcon status={group.key as NoteStatus} size={14} />
    }
    return null
  }, [groupBy, group.key])

  const cardIsActive = activeDragId !== null && !activeDragId.startsWith("col-")

  return (
    <div
      ref={(node) => { setSortableRef(node); setDropRef(node); }}
      style={sortableStyle}
      className={cn(
        "flex w-[260px] shrink-0 flex-col rounded-lg border border-border-subtle transition-colors",
        isOver && cardIsActive ? "bg-accent/8 ring-1 ring-accent/30" : "bg-secondary/40",
      )}
    >
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        {headerIcon ? <span className="flex shrink-0 items-center">{headerIcon}</span> : null}
        <span className="text-note font-semibold text-foreground">{group.label}</span>
        <span className="text-2xs text-muted-foreground">{group.books.length}</span>
      </div>
      <div className="flex flex-col gap-1.5 px-1.5 pb-2">
        {group.books.map((book) => (
          <BookBoardCard
            key={book.id}
            book={book}
            groupBy={groupBy}
            visibleColumns={visibleColumns}
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

/* ── BookBoardCard ─────────────────────────────────────── */

function BookBoardCard({
  book,
  groupBy,
  visibleColumns,
  onOpen,
  onRename,
  onTogglePin,
  onDelete,
  onRestore,
  onPermanentDelete,
}: {
  book: Book
  groupBy: GroupBy
  visibleColumns: string[]
  onOpen: (id: string) => void
  onRename: (id: string, currentTitle: string) => void
  onTogglePin: (id: string, pinned: boolean | undefined) => void
  onDelete: (id: string, title: string) => void
  onRestore: (id: string, title: string) => void
  onPermanentDelete: (id: string, title: string) => void
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: book.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div>
            <BookBoardCardInner
              book={book}
              groupBy={groupBy}
              visibleColumns={visibleColumns}
              onOpen={onOpen}
              isDragging={false}
            />
          </div>
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
    </div>
  )
}

function BookBoardCardInner({
  book,
  groupBy,
  visibleColumns,
  onOpen,
  isDragging,
}: {
  book: Book
  groupBy: GroupBy
  visibleColumns?: string[]
  onOpen: (id: string) => void
  isDragging: boolean
}) {
  const t = useT()
  const kind = getBookKind(book)
  const sourceKinds = Array.from(new Set((book.smartSources ?? []).map((s) => s.kind)))

  // Honor Display Properties on the board card. Undefined = show all
  // (mirrors notes-board BoardCardInner). The 6 displayable book props are
  // status, priority, kind, itemCount, sources, pinned (books.schema).
  const isVisible = (k: string) => !visibleColumns || visibleColumns.includes(k)

  // Build the property chip row. Order mirrors the old hard-coded set:
  // status → priority → kind → itemCount → sources → pinned. PropertyChipRow
  // caps at 3 visible + a hover popover for the overflow.
  const chips: React.ReactNode[] = [
    // §11 — status/priority badges (manual·hybrid; smart = N/A).
    isVisible("status") && kind !== "smart" && (
      <StatusBadge key="status" status={book.status ?? "backlog"} />
    ),
    isVisible("priority") && kind !== "smart" && book.priority && book.priority !== "none" && (
      <PriorityChip key="priority" priority={book.priority} />
    ),
    // kind chip is redundant when grouped by kind (column header shows it) —
    // mirrors notes-board suppressing status when groupBy === "status".
    isVisible("kind") && groupBy !== "kind" && <BookKindChip key="kind" kind={kind} />,
    isVisible("itemCount") && <BookItemCountChip key="itemCount" count={book.items?.length ?? 0} />,
    isVisible("sources") && sourceKinds.length > 0 && (
      <BookSourceKindChip key="sources" kinds={sourceKinds} />
    ),
    isVisible("pinned") && book.pinned && <PinnedChip key="pinned" />,
  ]

  return (
    <button
      type="button"
      data-board-card
      onClick={() => onOpen(book.id)}
      className={cn(
        "group flex w-full flex-col gap-1.5 rounded-md border border-border/60 bg-card p-2.5 text-left transition-all",
        isDragging ? "shadow-md ring-1 ring-accent/30" : "hover:bg-hover-bg hover:border-border hover:shadow-sm",
      )}
    >
      <div className="flex items-start gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground/70">
          <BookKindIcon kind={kind} size={14} />
        </span>
        <span className="min-w-0 flex-1 text-note font-medium text-foreground line-clamp-2 leading-snug">
          {book.title || t("books.untitled")}
        </span>
        {book.pinned && (
          <PushPin size={11} fill="currentColor" strokeWidth={2} className="shrink-0 text-amber-500" />
        )}
      </div>

      <PropertyChipRow chips={chips} maxVisible={3} />

      <span className="text-2xs text-muted-foreground/70 tabular-nums">
        {shortRelative(book.updatedAt)}
      </span>
    </button>
  )
}
