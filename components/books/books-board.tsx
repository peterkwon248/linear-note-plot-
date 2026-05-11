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
import type { Book } from "@/lib/types"
import type { BookGroup, BookKind } from "@/lib/view-engine/use-books-view"
import { getBookKind } from "@/lib/view-engine/use-books-view"
import type { GroupBy, ViewState } from "@/lib/view-engine/types"
import {
  BookItemCountChip,
  BookKindChip,
  BookKindIcon,
  BookSourceKindChip,
} from "@/components/property-chips"
import { shortRelative } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Books as PhBooks } from "@phosphor-icons/react/dist/ssr/Books"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import { PushPinSimple } from "@phosphor-icons/react/dist/ssr/PushPinSimple"

interface BooksBoardProps {
  groups: BookGroup[]
  groupBy: GroupBy
  viewState: ViewState
  updateViewState: (patch: Partial<ViewState>) => void
  onOpen: (id: string) => void
  onTogglePin: (id: string, pinned: boolean | undefined) => void
  onConvertToManual: (id: string, title: string) => void
}

export function BooksBoard({
  groups,
  groupBy,
  viewState,
  updateViewState,
  onOpen,
  onTogglePin,
  onConvertToManual,
}: BooksBoardProps) {
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
      // activeId = book id, overId = column key (current group)
      const bookId = activeId
      const targetKey = overId

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
        toast.success(nextPinned ? "Pinned book" : "Unpinned book")
      } else if (groupBy === "kind") {
        const targetKind = targetKey as BookKind
        const currentKind = getBookKind(book)
        if (targetKind === "manual" && (currentKind === "smart" || currentKind === "hybrid")) {
          const count = book.smartSources?.length ?? 0
          // Confirmation required: smartSources removal is destructive.
          if (typeof window !== "undefined" && window.confirm(
            `Convert "${book.title}" to a manual book? This will remove ${count} smart source${count === 1 ? "" : "s"}. Items already in the book are preserved.`,
          )) {
            onConvertToManual(book.id, book.title)
            toast.success(`Converted "${book.title}" to Manual`)
          }
        } else if (targetKind === "smart" || targetKind === "hybrid") {
          toast.info("Configure smart sources on the book detail page", {
            description: "Drag works for Smart → Manual conversion only.",
          })
        }
        // smart → hybrid / manual → smart etc. fall through (no-op + hint).
      }
      // groupBy === "none" → no card drop targets (single column).

      setActiveDragId(null)
    },
    [resolvedGroups, groupBy, viewState.groupOrder, updateViewState, onTogglePin, onConvertToManual],
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
              isDragDisabled={isDragDisabled}
              onOpen={onOpen}
              activeDragId={activeDragId}
            />
          ))}
        </SortableContext>
      </div>
      <DragOverlay>
        {activeBook ? (
          <div className="opacity-90">
            <BookBoardCardInner book={activeBook} onOpen={() => {}} isDragging />
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
  isDragDisabled: boolean
  onOpen: (id: string) => void
  activeDragId: string | null
}

function BookBoardColumn({ group, groupBy, isDragDisabled, onOpen, activeDragId }: BookBoardColumnProps) {
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
      if (group.key === "smart") return <Lightning size={14} weight="regular" className="text-muted-foreground" />
      if (group.key === "manual") return <PencilSimple size={14} weight="regular" className="text-muted-foreground" />
      if (group.key === "hybrid") return <Sparkle size={14} weight="regular" className="text-muted-foreground" />
    }
    if (groupBy === "pinned") {
      if (group.key === "pinned") return <PushPin size={14} weight="fill" className="text-amber-500" />
      return <PushPinSimple size={14} weight="regular" className="text-muted-foreground" />
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
          <BookBoardCard key={book.id} book={book} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

/* ── BookBoardCard ─────────────────────────────────────── */

function BookBoardCard({ book, onOpen }: { book: Book; onOpen: (id: string) => void }) {
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
      <BookBoardCardInner book={book} onOpen={onOpen} isDragging={false} />
    </div>
  )
}

function BookBoardCardInner({
  book,
  onOpen,
  isDragging,
}: {
  book: Book
  onOpen: (id: string) => void
  isDragging: boolean
}) {
  const kind = getBookKind(book)
  const sourceKinds = Array.from(new Set((book.smartSources ?? []).map((s) => s.kind)))

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
          {book.title || "Untitled book"}
        </span>
        {book.pinned && (
          <PushPin size={11} weight="fill" className="shrink-0 text-amber-500" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <BookKindChip kind={kind} />
        <BookItemCountChip count={book.items?.length ?? 0} />
        <BookSourceKindChip kinds={sourceKinds} />
      </div>

      <span className="text-2xs text-muted-foreground/70 tabular-nums">
        {shortRelative(book.updatedAt)}
      </span>
    </button>
  )
}
