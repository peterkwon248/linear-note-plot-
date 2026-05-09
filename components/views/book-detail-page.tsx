"use client"

/**
 * BookDetailPage — single Book detail view (Phase 3).
 *
 * Renders one book: title (inline-editable), description (inline-editable),
 * ordered items list with drag + ↑↓ reorder, and "+ Add note / wiki / heading"
 * footer actions.
 *
 * Drag-and-drop is implemented with dnd-kit (DndContext + SortableContext),
 * matching the wiki article-view pattern (`components/wiki-editor/wiki-article-view.tsx`).
 * On drag end we compute the moved item's new neighbors and dispatch
 * `reorderBookItems(bookId, itemId, prevId, nextId)` — the slice generates a
 * fresh fractional-indexing key between them. Up/Down chevrons in BookItemRow
 * call the same slice action with the swapped neighbors.
 *
 * Stale entity refs are handled inside BookItemRow (lazy detection at render).
 */

import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import type { BookItem } from "@/lib/types"
import { ViewHeader } from "@/components/view-header"
import { BookItemRow } from "@/components/books/book-item-row"
import { AddItemDialog } from "@/components/books/add-item-dialog"
import { setActiveRoute } from "@/lib/table-route"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { shortRelative } from "@/lib/format-utils"
import { usePane } from "@/components/workspace/pane-context"
import { bookContentItems } from "@/lib/books/utils"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { TextH } from "@phosphor-icons/react/dist/ssr/TextH"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { PushPinSlash } from "@phosphor-icons/react/dist/ssr/PushPinSlash"

interface BookDetailPageProps {
  bookId: string
}

export function BookDetailPage({ bookId }: BookDetailPageProps) {
  const router = useRouter()
  const pane = usePane()
  const books = usePlotStore((s) => s.books)
  const updateBook = usePlotStore((s) => s.updateBook)
  const deleteBook = usePlotStore((s) => s.deleteBook)
  const addChapterHeading = usePlotStore((s) => s.addChapterHeading)
  const reorderBookItems = usePlotStore((s) => s.reorderBookItems)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const openNote = usePlotStore((s) => s.openNote)
  const setBookContext = usePlotStore((s) => s.setBookContext)

  const book = books.find((b) => b.id === bookId)

  const sortedItems = useMemo<BookItem[]>(() => {
    if (!book) return []
    return [...book.items].sort((a, b) =>
      a.order < b.order ? -1 : a.order > b.order ? 1 : 0,
    )
  }, [book])

  const [addOpen, setAddOpen] = useState(false)
  const [addInitialTab, setAddInitialTab] = useState<"notes" | "wiki">("notes")

  // Title inline edit
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(book?.title ?? "")
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Description inline edit
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState(book?.description ?? "")
  const descInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitleDraft(book?.title ?? "")
    setDescDraft(book?.description ?? "")
  }, [book?.id, book?.title, book?.description])

  useEffect(() => {
    if (editingTitle) setTimeout(() => titleInputRef.current?.select(), 0)
  }, [editingTitle])

  useEffect(() => {
    if (editingDesc) setTimeout(() => descInputRef.current?.focus(), 0)
  }, [editingDesc])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  /* ── Drag end → reorder via slice ──────────────────── */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const fromIndex = sortedItems.findIndex((i) => i.id === active.id)
      const toIndex = sortedItems.findIndex((i) => i.id === over.id)
      if (fromIndex === -1 || toIndex === -1) return

      // Compute neighbors AFTER the move (excluding the moved item itself).
      const without = sortedItems.filter((_, idx) => idx !== fromIndex)
      // toIndex is in the original sortedItems coordinate system. After
      // removing the moved item, the insertion index needs adjustment when
      // the destination was after the source.
      const adjustedTo = fromIndex < toIndex ? toIndex - 1 : toIndex
      const prev = adjustedTo > 0 ? without[adjustedTo - 1] : null
      const next = adjustedTo < without.length ? without[adjustedTo] : null

      reorderBookItems(
        bookId,
        String(active.id),
        prev ? prev.id : null,
        next ? next.id : null,
      )
    },
    [bookId, sortedItems, reorderBookItems],
  )

  /* ── Up / Down via slice (computes neighbors at swapped position) ── */
  const moveBy = useCallback(
    (itemId: string, delta: -1 | 1) => {
      const idx = sortedItems.findIndex((i) => i.id === itemId)
      if (idx === -1) return
      const targetIdx = idx + delta
      if (targetIdx < 0 || targetIdx >= sortedItems.length) return
      // Build a virtual re-ordered list, then snapshot the moved item's
      // new neighbors so the slice can compute a fractional-indexing key
      // between them. Single source of truth for both ↑ and ↓.
      const movedItem = sortedItems[idx]
      const without = sortedItems.filter((i) => i.id !== itemId)
      // For both delta=-1 and delta=+1 the new index in `without` happens
      // to equal `targetIdx` (downward move falls into the slot vacated by
      // shifting the array left).
      const reordered = [...without]
      reordered.splice(targetIdx, 0, movedItem)
      const newPos = reordered.findIndex((i) => i.id === itemId)
      const prev = newPos > 0 ? reordered[newPos - 1] : null
      const next = newPos < reordered.length - 1 ? reordered[newPos + 1] : null
      reorderBookItems(bookId, itemId, prev ? prev.id : null, next ? next.id : null)
    },
    [bookId, sortedItems, reorderBookItems],
  )

  /* ── Open referenced entity ────────────────────────── */
  const handleOpen = useCallback(
    (item: BookItem) => {
      if (!book) return
      if (item.kind === "chapter-heading") return  // headings are not navigable

      // Phase 4: anchor the destination editor to this book.
      // Counter is computed against content items only (notes + wikis);
      // headings are NOT counted in M.
      const contentItems = bookContentItems(book)
      const itemIndex = contentItems.findIndex(
        (i) => i.kind === item.kind && i.refId === item.refId,
      )
      if (itemIndex >= 0) {
        setBookContext(pane, {
          bookId: book.id,
          itemIndex,
          total: contentItems.length,
        })
      }

      if (item.kind === "note") {
        openNote(item.refId, { pane })
      } else if (item.kind === "wiki") {
        if (pane === "secondary") {
          // Secondary pane treats wiki/note ids interchangeably — the
          // panel resolves which view to render via wikiArticles.find().
          usePlotStore.getState().openInSecondary(item.refId)
        } else {
          setSelectedNoteId(null)
          setActiveRoute("/wiki")
          navigateToWikiArticle(item.refId)
          router.push(`/wiki/${item.refId}`)
        }
      }
    },
    [book, openNote, pane, router, setBookContext, setSelectedNoteId],
  )

  if (!book) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <ViewHeader
          icon={<Books size={20} weight="regular" />}
          title="Book not found"
        />
        <div className="flex flex-col items-center gap-3 px-6 pt-20">
          <Books size={32} weight="regular" className="text-muted-foreground/25" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">This book no longer exists</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              It may have been deleted. Return to the books grid.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveRoute("/books")
              router.push("/books")
            }}
            className="mt-2 rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Back to Books
          </button>
        </div>
      </div>
    )
  }

  const commitTitle = () => {
    const next = titleDraft.trim()
    if (next && next !== book.title) updateBook(book.id, { title: next })
    else setTitleDraft(book.title)
    setEditingTitle(false)
  }

  const commitDesc = () => {
    const next = descDraft.trim()
    if (next !== (book.description ?? "")) updateBook(book.id, { description: next || undefined })
    setEditingDesc(false)
  }

  const handleTogglePin = () => {
    updateBook(book.id, { pinned: !book.pinned })
    toast.success(book.pinned ? "Unpinned book" : "Pinned book")
  }

  const handleDelete = () => {
    deleteBook(book.id)
    toast.success(`Moved "${book.title}" to trash`)
    setActiveRoute("/books")
    router.push("/books")
  }

  const headingIcon = book.coverEmoji ? (
    <span className="text-lg leading-none">{book.coverEmoji}</span>
  ) : (
    <Books size={20} weight="regular" />
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={headingIcon}
        title={book.title || "Untitled book"}
        count={book.items.length > 0 ? book.items.length : undefined}
        extraToolbarButtons={
          <>
            <button
              type="button"
              onClick={() => {
                setActiveRoute("/books")
                router.push("/books")
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/65 transition-colors hover:bg-hover-bg hover:text-foreground"
              title="Back to all books"
              aria-label="Back to all books"
            >
              <ArrowLeft size={16} weight="regular" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/65 transition-colors hover:bg-hover-bg hover:text-foreground"
                  title="Book actions"
                  aria-label="Book actions"
                >
                  <DotsThree size={16} weight="bold" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={handleTogglePin} className="text-note">
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
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-note text-destructive focus:text-destructive"
                >
                  <Trash size={14} weight="regular" className="mr-2" />
                  Move to trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
        onCreateNew={() => {
          setAddInitialTab("notes")
          setAddOpen(true)
        }}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 pt-8 pb-24">
          {/* Inline title edit */}
          <div className="mb-2">
            {editingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    commitTitle()
                  } else if (e.key === "Escape") {
                    e.preventDefault()
                    setTitleDraft(book.title)
                    setEditingTitle(false)
                  }
                }}
                placeholder="Book title"
                className="w-full text-2xl font-semibold text-foreground bg-transparent border-b border-accent/40 px-0 py-1 focus:outline-none focus:border-accent"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                className="block text-left text-2xl font-semibold text-foreground hover:text-accent transition-colors w-full truncate"
                title="Click to rename"
              >
                {book.title || (
                  <span className="text-muted-foreground/60 italic font-normal">
                    Untitled book
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Inline description edit */}
          <div className="mb-6">
            {editingDesc ? (
              <input
                ref={descInputRef}
                type="text"
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={commitDesc}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    commitDesc()
                  } else if (e.key === "Escape") {
                    e.preventDefault()
                    setDescDraft(book.description ?? "")
                    setEditingDesc(false)
                  }
                }}
                placeholder="Add a description..."
                className="w-full text-note text-foreground bg-transparent border-b border-accent/40 px-0 py-0.5 focus:outline-none focus:border-accent"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingDesc(true)}
                className="block text-left text-note text-muted-foreground hover:text-foreground transition-colors w-full truncate"
                title="Click to edit description"
              >
                {book.description || (
                  <span className="text-muted-foreground/50 italic">
                    Add a description...
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Items list */}
          {sortedItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 border border-dashed border-border/60 rounded-lg">
              <Books size={28} weight="regular" className="text-muted-foreground/25" />
              <div className="text-center">
                <p className="text-note font-medium text-foreground">
                  This book is empty
                </p>
                <p className="mt-0.5 text-2xs text-muted-foreground">
                  Add notes, wiki articles, or chapter headings to get started.
                </p>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedItems.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-px">
                  {sortedItems.map((item, idx) => (
                    <BookItemRow
                      key={item.id}
                      bookId={book.id}
                      item={item}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < sortedItems.length - 1}
                      onMoveUp={() => moveBy(item.id, -1)}
                      onMoveDown={() => moveBy(item.id, 1)}
                      onOpen={() => handleOpen(item)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Footer add actions */}
          <FooterAddActions
            onAddNote={() => {
              setAddInitialTab("notes")
              setAddOpen(true)
            }}
            onAddWiki={() => {
              setAddInitialTab("wiki")
              setAddOpen(true)
            }}
            onAddHeading={() => {
              addChapterHeading(book.id, "")
              toast.success("Added chapter heading")
            }}
          />

          {/* Footer meta */}
          <div className="mt-8 flex items-center gap-3 text-2xs text-muted-foreground/70">
            <span>Updated {shortRelative(book.updatedAt)}</span>
            <span>·</span>
            <span>Created {shortRelative(book.createdAt)}</span>
          </div>
        </div>
      </div>

      <AddItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        bookId={book.id}
        initialTab={addInitialTab}
      />
    </div>
  )
}

/* ── Footer "+ Add" action group ───────────────────────────── */

function FooterAddActions({
  onAddNote,
  onAddWiki,
  onAddHeading,
}: {
  onAddNote: () => void
  onAddWiki: () => void
  onAddHeading: () => void
}) {
  return (
    <div className="mt-3 flex items-center gap-1">
      <FooterButton onClick={onAddNote} icon={<FileText size={13} weight="regular" />}>
        Add note
      </FooterButton>
      <FooterButton onClick={onAddWiki} icon={<BookOpen size={13} weight="regular" />}>
        Add wiki
      </FooterButton>
      <FooterButton onClick={onAddHeading} icon={<TextH size={13} weight="regular" />}>
        Add heading
      </FooterButton>
    </div>
  )
}

function FooterButton({
  onClick,
  icon,
  children,
}: {
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
    >
      <PhPlus size={11} weight="bold" />
      {icon}
      {children}
    </button>
  )
}
