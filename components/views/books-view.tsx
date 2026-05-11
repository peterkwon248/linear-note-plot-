"use client"

/**
 * BooksView — Books-space root view (Phase 3).
 *
 * Two modes, switched by activeRoute:
 *  - `/books`         → grid of book cards (this component)
 *  - `/books/{id}`    → single-book detail (delegates to BookDetailPage)
 *
 * The Books-space mounts in app/(app)/layout.tsx whenever activeRoute starts
 * with `/books`. Branching here keeps the dynamic route handled by the same
 * always-mounted view — mirrors how /library handles its sub-routes.
 *
 * Grid card UX:
 *  - cover emoji (or default Books icon)
 *  - title + item count
 *  - relative updated time
 *  - click → /books/{id}; right-click → context menu (Pin / Trash)
 */

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { useBooksView } from "@/lib/view-engine/use-books-view"
import { useSaveViewProps } from "@/lib/view-engine/use-save-view-props"
import { BOOKS_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import type { FilterRule, SortField } from "@/lib/view-engine/types"
import { ViewHeader } from "@/components/view-header"
import { DisplayPanel } from "@/components/display-panel"
import { FilterPanel } from "@/components/filter-panel"
import { BookDetailPage } from "@/components/views/book-detail-page"
import { BookTable } from "@/components/books/book-table"
import { BookGridCard } from "@/components/books/book-grid-card"
import { BooksBoard } from "@/components/books/books-board"
import { BooksGalleryAdapter } from "@/components/books/books-gallery-adapter"
import { setActiveRoute, useActiveRoute, useSecondaryRoute, getBookIdFromRoute } from "@/lib/table-route"
import { usePane } from "@/components/workspace/pane-context"
import { shortRelative } from "@/lib/format-utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { PushPinSlash } from "@phosphor-icons/react/dist/ssr/PushPinSlash"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { TrashSimple } from "@phosphor-icons/react/dist/ssr/TrashSimple"
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export function BooksView() {
  const pane = usePane()
  const primaryRoute = useActiveRoute()
  const secondaryRoute = useSecondaryRoute()
  const route = pane === "secondary" ? secondaryRoute : primaryRoute
  const detailId = getBookIdFromRoute(route)

  if (detailId) {
    return <BookDetailPage bookId={detailId} />
  }

  return <BooksGrid />
}

/* ── Grid view ─────────────────────────────────────────────── */

function BooksGrid() {
  const router = useRouter()
  const books = usePlotStore((s) => s.books)
  const createBook = usePlotStore((s) => s.createBook)
  const updateBook = usePlotStore((s) => s.updateBook)
  const deleteBook = usePlotStore((s) => s.deleteBook)
  const restoreBook = usePlotStore((s) => s.restoreBook)
  const permanentlyDeleteBook = usePlotStore((s) => s.permanentlyDeleteBook)

  // books-view-engine-1/2/3: filter/search/sort/group via view-engine pipeline.
  // `flatBooks` already respects showTrashed toggle + pinned-first sort.
  // showTrashed lives in viewState.toggles (persists across reload).
  // `groups` is the grouped view used by board mode (kind/pinned/none).
  const { flatBooks: visibleBooks, groups, viewState, updateViewState } = useBooksView()
  const showTrashed = Boolean(viewState.toggles?.showTrashed)
  const setShowTrashed = (next: boolean) =>
    updateViewState({ toggles: { ...viewState.toggles, showTrashed: next } })

  // books-view-engine-2/3/4: viewMode = grid | list | board | gallery.
  const isListMode = viewState.viewMode === "list"
  const isBoardMode = viewState.viewMode === "board"
  const isGalleryMode = viewState.viewMode === "gallery"

  // books-view-engine-3: card-drag in board mode (groupBy="kind") can request
  // a Smart → Manual conversion. Strips smartSources; Book.items preserved.
  const handleConvertToManual = useCallback((id: string, _title: string) => {
    updateBook(id, { smartSources: [] })
  }, [updateBook])

  // books-view-engine-5 (fix): column header sort toggle (NotesTable pattern).
  // Same field → flip direction. New field → sensible default per field type.
  const sortField = viewState.sortFields[0]?.field ?? "updatedAt"
  const sortDirection = viewState.sortFields[0]?.direction ?? "desc"
  const handleSortToggle = useCallback((field: SortField) => {
    const current = viewState.sortFields[0]
    let nextDir: "asc" | "desc"
    if (current?.field === field) {
      nextDir = current.direction === "asc" ? "desc" : "asc"
    } else {
      // title → asc default (alpha); other fields → desc default (recent first).
      nextDir = field === "title" || field === "name" ? "asc" : "desc"
    }
    updateViewState({ sortFields: [{ field, direction: nextDir }] })
  }, [viewState.sortFields, updateViewState])

  // Save view props (Notes/Wiki 정합 — ViewHeader actions에 Save view 버튼).
  // 2026-05-12: trashedCount chip 제거하고 표준 Save view 버튼으로 통일.
  const { saveViewMode, onSaveView } = useSaveViewProps("books", "books")

  // Filter toggle handler (mirrors stickers-view handleStickersFilterToggle).
  const handleBooksFilterToggle = useCallback((rule: FilterRule) => {
    const exists = viewState.filters.some(
      (f) => f.field === rule.field && f.operator === rule.operator && f.value === rule.value,
    )
    const newFilters = exists
      ? viewState.filters.filter((f) => !(f.field === rule.field && f.operator === rule.operator && f.value === rule.value))
      : [...viewState.filters, rule]
    updateViewState({ filters: newFilters })
  }, [viewState.filters, updateViewState])

  // Live + trashed counts (independent of view-engine filter/search) — drive
  // ViewHeader count + the trash toggle chip visibility.
  const liveCount = useMemo(
    () => books.reduce((n, b) => (b.trashed ? n : n + 1), 0),
    [books],
  )
  const trashedCount = useMemo(
    () => books.reduce((n, b) => (b.trashed ? n + 1 : n), 0),
    [books],
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState("")
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState("")

  const handleCreate = () => {
    const title = createTitle.trim() || "Untitled book"
    const id = createBook(title)
    setCreateTitle("")
    setCreateOpen(false)
    toast.success(`Created "${title}"`)
    setActiveRoute(`/books/${id}`)
    router.push(`/books/${id}`)
  }

  const openBook = (id: string) => {
    setActiveRoute(`/books/${id}`)
    router.push(`/books/${id}`)
  }

  const handleTogglePin = (id: string, pinned: boolean | undefined) => {
    updateBook(id, { pinned: !pinned })
    toast.success(pinned ? "Unpinned book" : "Pinned book")
  }

  const handleDelete = (id: string, title: string) => {
    deleteBook(id)
    toast.success(`Moved "${title}" to trash`)
  }

  const handleRestore = (id: string, title: string) => {
    restoreBook(id)
    toast.success(`Restored "${title}"`)
  }

  const handlePermanentDelete = (id: string, title: string) => {
    permanentlyDeleteBook(id)
    toast.success(`Permanently deleted "${title}"`)
  }

  const handleRenameSubmit = () => {
    if (!renamingId) return
    const next = renameDraft.trim()
    if (next) updateBook(renamingId, { title: next })
    setRenamingId(null)
    setRenameDraft("")
  }

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id)
    setRenameDraft(currentTitle)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<Books size={20} weight="regular" />}
        title="Books"
        count={liveCount > 0 ? liveCount : undefined}
        searchPlaceholder="Search books"
        onCreateNew={() => {
          setCreateTitle("")
          setCreateOpen(true)
        }}
        showDisplay={BOOKS_VIEW_CONFIG.showDisplay}
        displayContent={
          <DisplayPanel
            config={BOOKS_VIEW_CONFIG.displayConfig}
            viewState={viewState}
            onViewStateChange={updateViewState}
            showViewMode={true}
            toggleStates={viewState.toggles}
            onToggleChange={(key, val) =>
              updateViewState({ toggles: { ...viewState.toggles, [key]: val } })
            }
          />
        }
        showFilter={BOOKS_VIEW_CONFIG.showFilter}
        hasActiveFilters={viewState.filters.length > 0}
        filterContent={
          <FilterPanel
            categories={BOOKS_VIEW_CONFIG.filterCategories}
            activeFilters={viewState.filters}
            onToggle={handleBooksFilterToggle}
            quickFilters={BOOKS_VIEW_CONFIG.quickFilters as any}
            onQuickFilter={(rules) => updateViewState({ filters: rules })}
          />
        }
        saveViewMode={saveViewMode}
        onSaveView={onSaveView}
      />

      <div className="flex-1 overflow-y-auto">
        {liveCount === 0 ? (
          <EmptyBooks
            onCreate={() => {
              setCreateTitle("")
              setCreateOpen(true)
            }}
          />
        ) : isListMode ? (
          // books-view-engine-5 (fix): list mode = BookTable (column-rich,
          // NotesTable 패턴). Column header sort toggle + visibleColumns
          // (DisplayPanel 토글로 사용자가 선택). PR 2 BookListRow 폐기.
          <BookTable
            books={visibleBooks}
            visibleColumns={viewState.visibleColumns}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSortToggle}
            onOpen={openBook}
            onRename={startRename}
            onTogglePin={handleTogglePin}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDelete}
          />
        ) : isBoardMode ? (
          // books-view-engine-3: board mode (column-grouped, dnd-kit).
          // Column drag/reorder + card drop (pinned toggle / kind conversion).
          <BooksBoard
            groups={groups}
            groupBy={viewState.groupBy}
            viewState={viewState}
            updateViewState={updateViewState}
            onOpen={openBook}
            onTogglePin={handleTogglePin}
            onConvertToManual={handleConvertToManual}
          />
        ) : isGalleryMode ? (
          // books-view-engine-4: gallery mode via the entity-agnostic
          // GalleryView (2026-05-11 generic). BooksGalleryAdapter maps Book[]
          // and BookGroup[] into GalleryItem/GalleryGroup; clicks open the
          // full editor (Plot standard, NEXT-ACTION 2026-05-11 영구 결정).
          <BooksGalleryAdapter
            books={visibleBooks}
            groups={groups}
            groupBy={viewState.groupBy}
            onOpen={openBook}
          />
        ) : (
          // books-view-engine-1: grid mode (default, preserved from before).
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 p-6">
            {visibleBooks.map((book) => (
              <BookGridCard
                key={book.id}
                book={book}
                onOpen={openBook}
                onRename={startRename}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create book dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>New book</DialogTitle>
            <DialogDescription>
              A book holds an ordered sequence of notes and wiki articles.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <input
              autoFocus
              type="text"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleCreate()
                } else if (e.key === "Escape") {
                  e.preventDefault()
                  setCreateOpen(false)
                }
              }}
              placeholder="Book title"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-note text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-md px-3 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Create
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inline rename dialog */}
      <Dialog open={renamingId !== null} onOpenChange={(o) => !o && setRenamingId(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Rename book</DialogTitle>
            <DialogDescription>Update the book title.</DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <input
              autoFocus
              type="text"
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleRenameSubmit()
                } else if (e.key === "Escape") {
                  e.preventDefault()
                  setRenamingId(null)
                }
              }}
              placeholder="Book title"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-note text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setRenamingId(null)}
              className="rounded-md px-3 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRenameSubmit}
              className="rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── EmptyBooks helper ─────────────────────────────────── */

/**
 * Empty-state CTA shown when liveCount === 0. Extracted from BooksGrid so
 * the main render branches (empty / list / grid) read clearly.
 */
function EmptyBooks({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 pt-20">
      <Books size={32} weight="regular" className="text-muted-foreground/25" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">No books yet</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Create your first book to organize related notes and wiki articles in order.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="mt-2 rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        Create book
      </button>
    </div>
  )
}
