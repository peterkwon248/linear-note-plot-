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
import { resolveBookItems, type ResolvedBookItem } from "@/lib/books/resolver"
import { ViewHeader } from "@/components/view-header"
import { BookItemRow } from "@/components/books/book-item-row"
import { AddItemDialog } from "@/components/books/add-item-dialog"
import { SourcesSection } from "@/components/books/sources-section"
import { NoteEditor } from "@/components/note-editor"
import { WikiArticleView } from "@/components/wiki-editor/wiki-article-view"
import { BookContextNav } from "@/components/books/book-context-nav"
import { useBookContextNav } from "@/hooks/use-book-context-nav"
import { PanelsMenu } from "@/components/panels-menu"
import { WikiLayoutToggle } from "@/components/wiki-editor/wiki-layout-toggle"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TextAa } from "@phosphor-icons/react/dist/ssr/TextAa"
import { cn } from "@/lib/utils"
import { setActiveRoute } from "@/lib/table-route"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { shortRelative } from "@/lib/format-utils"
import { usePane } from "@/components/workspace/pane-context"
import { resolvedContentItems } from "@/lib/books/utils"
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
import { BookKindIcon } from "@/components/property-chips"
import { getBookKind } from "@/lib/view-engine/use-books-view"
import { IconChevronRight } from "@/components/plot-icons"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft"
import { Play } from "@phosphor-icons/react/dist/ssr/Play"
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

  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const secondaryNoteId = usePlotStore((s) => s.secondaryNoteId)
  // Reading mode entity id is pane-scoped — primary uses selectedNoteId,
  // secondary uses secondaryNoteId.
  const readingEntityId = pane === "primary" ? selectedNoteId : secondaryNoteId

  const book = books.find((b) => b.id === bookId)

  const resolvedItems = useMemo<ResolvedBookItem[]>(() => {
    if (!book) return []
    return resolveBookItems(book, { notes, folders, wikiArticles, wikiCategories })
  }, [book, notes, folders, wikiArticles, wikiCategories])

  const [addOpen, setAddOpen] = useState(false)
  const [addInitialTab, setAddInitialTab] = useState<"notes" | "wiki">("notes")

  // Books reading view (primary pane) = full-width single-column layout.
  // Force-close the side panel on entry so the reading viewport is wide.
  // The wiki article already has its own infobox/categories chrome inside
  // the body — the store-level SmartSidePanel would just narrow things
  // further. Sync sidePanelContext anyway, so if the user re-opens the
  // panel via ⌘B it reflects the currently visible note/wiki.
  // Secondary pane has its own panel chrome — we don't touch global
  // sidePanel state from here.
  useEffect(() => {
    if (readingEntityId && pane === "primary") {
      const isWiki = wikiArticles.some((w) => w.id === readingEntityId)
      usePlotStore.setState({ sidePanelOpen: false })
      usePlotStore.getState().setSidePanelContext({
        type: isWiki ? "wiki" : "note",
        id: readingEntityId,
      })
    }
  }, [readingEntityId, pane, wikiArticles])

  // Cleanup on unmount — when the user leaves /books/{id} (sidebar nav,
  // back, etc.), clear the book reading state so other views (NotesView
  // editor) don't keep showing the book's BookContextNav for whatever
  // entity happens to be selected. Pane-scoped — primary clears
  // selectedNoteId; secondary's secondaryNoteId is managed by the
  // parent SecondaryPanelContent (closeSecondary on panel close, etc.).
  useEffect(() => {
    return () => {
      const s = usePlotStore.getState()
      s.setBookContext(pane, null)
      if (pane === "primary") {
        s.setSelectedNoteId(null)
      }
    }
  }, [pane])

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

      // PRD §5.7: auto items are NOT draggable. If somehow user dragged
      // an auto item (defensive — Step 2.5 disables drag handle visually),
      // ignore. Auto items reorder is invalid in Phase A (LOCKED #5c forces
      // them to fixed lexicographic position after manual).
      const activeItem = resolvedItems.find((i) => i.id === active.id)
      if (activeItem?.source === "auto") return

      const fromIndex = resolvedItems.findIndex((i) => i.id === active.id)
      const toIndex = resolvedItems.findIndex((i) => i.id === over.id)
      if (fromIndex === -1 || toIndex === -1) return

      // Compute neighbors AFTER the move (excluding the moved item itself).
      const without = resolvedItems.filter((_, idx) => idx !== fromIndex)
      // toIndex is in the original resolvedItems coordinate system. After
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
    [bookId, resolvedItems, reorderBookItems],
  )

  /* ── Up / Down via slice (computes neighbors at swapped position) ── */
  const moveBy = useCallback(
    (itemId: string, delta: -1 | 1) => {
      const idx = resolvedItems.findIndex((i) => i.id === itemId)
      if (idx === -1) return
      const item = resolvedItems[idx]
      // PRD §5.7: auto items not reorderable
      if (item.source === "auto") return
      const targetIdx = idx + delta
      if (targetIdx < 0 || targetIdx >= resolvedItems.length) return
      // Build a virtual re-ordered list, then snapshot the moved item's
      // new neighbors so the slice can compute a fractional-indexing key
      // between them. Single source of truth for both ↑ and ↓.
      const movedItem = resolvedItems[idx]
      const without = resolvedItems.filter((i) => i.id !== itemId)
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
    [bookId, resolvedItems, reorderBookItems],
  )

  /* ── Open referenced entity ────────────────────────── */
  const handleOpen = useCallback(
    (item: ResolvedBookItem) => {
      if (!book) return
      if (item.kind === "chapter-heading") return  // headings are not navigable

      // Phase 4: anchor the destination editor to this book.
      // Counter is computed against resolved content items (manual + auto);
      // chapter-headings are NOT counted in M (Phase A Step 2.9).
      const contentItems = resolvedContentItems(book, { notes, folders })
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
        // BookDetailPage mounts NoteEditor (read mode) when selectedNoteId
        // references a note, so we stay on /books/{id} route. The book's
        // BookContextNav (1/N + ←→ + breadcrumb) renders inside the editor.
        openNote(item.refId, { pane })
      } else if (item.kind === "wiki") {
        if (pane === "secondary") {
          // Secondary pane treats wiki/note ids interchangeably — the
          // panel resolves which view to render via wikiArticles.find().
          usePlotStore.getState().openInSecondary(item.refId)
        } else {
          // Books route reading flow: BookDetailPage mounts
          // WikiArticleView when selectedNoteId references a wiki entity
          // (Step 2.11b). Stays on /books/{id}.
          setSelectedNoteId(item.refId)
        }
      }
    },
    [book, notes, folders, openNote, pane, router, setBookContext, setSelectedNoteId],
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

  // Step 2.10b/2.11: Reading mode — when an entity (note or wiki) is
  // opened from this book context, mount the corresponding view in place
  // of the BookDetailPage UI. URL stays on /books/{id} for primary; the
  // secondary pane is store-driven (no URL). Pane-aware — primary uses
  // selectedNoteId, secondary uses secondaryNoteId.
  if (readingEntityId) {
    const isWikiEntity = wikiArticles.some((w) => w.id === readingEntityId)
    if (isWikiEntity) {
      return (
        <BookWikiReader
          articleId={readingEntityId}
          bookId={book.id}
          bookTitle={book.title || "Untitled book"}
        />
      )
    }
    return <NoteEditor noteId={readingEntityId} pane={pane} defaultReadMode />
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

  // emoji 영구 폐기 (2026-05-12): heading icon = BookKindIcon (kind 표현)
  const headingIcon = <BookKindIcon kind={getBookKind(book)} size={20} />
  void Books // legacy import — kept for unrelated callers in this file

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={headingIcon}
        title={book.title || "Untitled book"}
        count={resolvedItems.length > 0 ? resolvedItems.length : undefined}
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
            <button
              type="button"
              onClick={() => {
                const contentItems = resolvedItems.filter(
                  (i) => i.kind !== "chapter-heading",
                )
                if (contentItems.length === 0) return
                // Reuse handleOpen — sets bookContext + opens first page
                handleOpen(contentItems[0])
              }}
              disabled={
                !resolvedItems.some((i) => i.kind !== "chapter-heading")
              }
              className="flex h-7 items-center gap-1.5 rounded-md bg-accent px-2.5 text-2xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Open the first page and start reading"
              aria-label="Read from start"
            >
              <Play size={11} weight="fill" />
              Read
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
        <div className="px-10 pt-8 pb-24">
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

          {/* Smart sources (Phase 5) */}
          <SourcesSection bookId={book.id} />

          {/* Items list */}
          {resolvedItems.length === 0 ? (
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
                items={resolvedItems.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-px">
                  {resolvedItems.map((item, idx) => (
                    <BookItemRow
                      key={item.id}
                      bookId={book.id}
                      item={item}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < resolvedItems.length - 1}
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

/* ── Wiki reader inside book context (Step 2.11) ───────────────────── */

/**
 * BookWikiReader — wraps WikiArticleView with a thin header that hosts
 * BookContextNav (book title dropdown + counter + ← →). Mirrors the
 * NoteEditor header role when a wiki article is opened from a book
 * reading flow. Stays on /books/{id} URL — clicking "Back to book
 * overview" inside the dropdown clears selectedNoteId and returns to
 * the BookDetailPage UI.
 */
function BookWikiReader({
  articleId,
  bookId,
  bookTitle,
}: {
  articleId: string
  bookId: string
  bookTitle: string
}) {
  const router = useRouter()
  const wikiBookNav = useBookContextNav("wiki", articleId)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const updateWikiArticle = usePlotStore((s) => s.updateWikiArticle)
  const article = wikiArticles.find((a) => a.id === articleId)

  const handleNavigateToBooks = () => {
    setActiveRoute("/books")
    router.push("/books")
  }

  // Step 2.21: full wiki chrome (Aa / collapse / layout / Edit) so the
  // book reading experience matches the standalone wiki view header.
  const [isEditing, setIsEditing] = useState(false)
  const [collapseAllCmd, setCollapseAllCmd] = useState<"collapse" | "expand" | null>(null)
  const [allSectionsCollapsed, setAllSectionsCollapsed] = useState(false)
  const hasSections = article?.blocks.some((b) => b.type === "section") ?? false

  // Reset editing state when the article changes (page navigation).
  useEffect(() => {
    setIsEditing(false)
  }, [articleId])

  // Read-mode book navigation: ⌘[ / ⌘] (modifier) and plain ←/→ (read mode
  // only, when not editing). Skips chapter-headings.
  useEffect(() => {
    if (!wikiBookNav.active) return
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const target = e.target as HTMLElement | null
      const inEditableField = !!(target && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest?.('[contenteditable="true"]')
      ))
      if (mod && (e.key === "[" || e.key === "]")) {
        if (inEditableField) return
        e.preventDefault()
        if (e.key === "[") wikiBookNav.goPrev()
        else wikiBookNav.goNext()
        return
      }
      if (!isEditing && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        if (inEditableField) return
        if (document.querySelector('[data-radix-popper-content-wrapper]')) return
        e.preventDefault()
        if (e.key === "ArrowLeft") wikiBookNav.goPrev()
        else wikiBookNav.goNext()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [wikiBookNav.active, wikiBookNav.goPrev, wikiBookNav.goNext, isEditing])

  return (
    <div data-editor-scope="wiki" className="flex h-full w-full flex-1 flex-col">
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border px-4">
        <PanelsMenu />
        <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
          <nav className="flex items-center gap-1 min-w-0">
            <button
              onClick={handleNavigateToBooks}
              className="shrink-0 text-lg text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Books
            </button>
            <IconChevronRight size={16} className="shrink-0 text-muted-foreground/70" />
            <span className="min-w-0 truncate text-lg font-medium text-foreground">
              {article?.title || "Untitled"}
            </span>
            {wikiBookNav.active && (
              <div className="hidden md:flex shrink-0 ml-2">
                <BookContextNav
                  bookId={wikiBookNav.active.bookId}
                  itemIndex={wikiBookNav.active.itemIndex}
                  total={wikiBookNav.active.total}
                  onPrev={wikiBookNav.goPrev}
                  onNext={wikiBookNav.goNext}
                  onJumpTo={wikiBookNav.jumpTo}
                  items={wikiBookNav.items}
                />
              </div>
            )}
          </nav>
          <div className="flex items-center gap-1">
            {/* Aa font size popover */}
            {article && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-hover-bg hover:text-muted-foreground transition-all"
                    title="Font size"
                  >
                    <TextAa size={18} weight="regular" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-2.5" sideOffset={4}>
                  <div className="flex items-center gap-1.5">
                    {([
                      { label: "S", value: 0.85 },
                      { label: "M", value: 1 },
                      { label: "L", value: 1.15 },
                      { label: "XL", value: 1.3 },
                    ] as const).map((opt) => {
                      const active = (article.fontSize ?? 1) === opt.value
                      return (
                        <button
                          key={opt.label}
                          onClick={() =>
                            updateWikiArticle(articleId, {
                              fontSize: opt.value === 1 ? undefined : opt.value,
                            })
                          }
                          className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            active
                              ? "bg-accent/20 text-accent"
                              : "text-foreground/60 hover:bg-hover-bg",
                          )}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {/* Collapse/Expand all */}
            {hasSections && (
              <button
                onClick={() => setCollapseAllCmd(allSectionsCollapsed ? "expand" : "collapse")}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-hover-bg hover:text-muted-foreground transition-all"
                title={allSectionsCollapsed ? "Expand all" : "Collapse all"}
              >
                <svg width={17} height={17} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {allSectionsCollapsed ? <path d="M4 6l4 4 4-4" /> : <path d="M12 10l-4-4-4 4" />}
                </svg>
              </button>
            )}
            {/* Layout toggle (Default / Encyclopedia) */}
            {article && (
              <WikiLayoutToggle articleId={articleId} layout={article.layout} showIcon={false} />
            )}
            {/* Edit/Done toggle */}
            {isEditing ? (
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-note font-medium text-white transition-colors duration-150 hover:bg-emerald-700"
              >
                Done
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-note font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedNoteId(null)}
              className="rounded-md px-2 py-1 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
              title="Back to book overview"
              aria-label="Back to book overview"
            >
              Close
            </button>
          </div>
        </div>
      </header>
      <WikiArticleView
        articleId={articleId}
        editable={isEditing}
        collapseAllCmd={collapseAllCmd}
        onCollapseAllDone={() => setCollapseAllCmd(null)}
        onAllCollapsedChange={setAllSectionsCollapsed}
        fontSize={article?.fontSize}
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
