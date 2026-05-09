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

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { ViewHeader } from "@/components/view-header"
import { BookDetailPage } from "@/components/views/book-detail-page"
import { setActiveRoute, useActiveRoute, getBookIdFromRoute } from "@/lib/table-route"
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
  const activeRoute = useActiveRoute()
  const detailId = getBookIdFromRoute(activeRoute)

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

  const [showTrashed, setShowTrashed] = useState(false)

  const liveBooks = useMemo(
    () =>
      books
        .filter((b) => !b.trashed)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [books],
  )

  const trashedBooks = useMemo(
    () =>
      books
        .filter((b) => b.trashed)
        .sort((a, b) => (b.trashedAt ?? b.updatedAt).localeCompare(a.trashedAt ?? a.updatedAt)),
    [books],
  )

  const visibleBooks = useMemo(
    () => (showTrashed ? [...liveBooks, ...trashedBooks] : liveBooks),
    [showTrashed, liveBooks, trashedBooks],
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
        count={liveBooks.length > 0 ? liveBooks.length : undefined}
        onCreateNew={() => {
          setCreateTitle("")
          setCreateOpen(true)
        }}
        actions={
          trashedBooks.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowTrashed((v) => !v)}
              className={cn(
                "flex h-7 items-center gap-1 rounded-md px-2 text-2xs font-medium transition-colors",
                showTrashed
                  ? "bg-hover-bg text-foreground"
                  : "text-muted-foreground hover:bg-hover-bg hover:text-foreground",
              )}
              title={showTrashed ? "Hide trashed books" : "Show trashed books"}
            >
              <TrashSimple size={13} weight="regular" />
              <span className="tabular-nums">{trashedBooks.length}</span>
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto">
        {liveBooks.length === 0 ? (
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
              onClick={() => {
                setCreateTitle("")
                setCreateOpen(true)
              }}
              className="mt-2 rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Create book
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 p-6">
            {visibleBooks.map((book) => (
              <ContextMenu key={book.id}>
                <ContextMenuTrigger asChild>
                  <button
                    type="button"
                    onClick={() => !book.trashed && openBook(book.id)}
                    className={cn(
                      "group relative flex flex-col items-start gap-2 rounded-lg border border-border/60 bg-card p-4 text-left transition-all",
                      book.trashed
                        ? "opacity-50 hover:bg-hover-bg cursor-default"
                        : "hover:bg-hover-bg hover:border-border hover:shadow-sm",
                    )}
                  >
                    {/* Pin indicator */}
                    {book.pinned && (
                      <PushPin
                        size={11}
                        weight="fill"
                        className="absolute right-2 top-2 text-amber-500"
                      />
                    )}

                    {/* Cover icon */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary/40 text-muted-foreground/70">
                      {book.coverEmoji ? (
                        <span className="text-2xl leading-none">{book.coverEmoji}</span>
                      ) : (
                        <Books size={22} weight="regular" />
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-note font-medium text-foreground line-clamp-2 leading-snug">
                      {book.title || "Untitled book"}
                    </h3>

                    {/* Description (optional) */}
                    {book.description && (
                      <p className="text-2xs text-muted-foreground line-clamp-2 leading-snug">
                        {book.description}
                      </p>
                    )}

                    <div className="flex-1" />

                    {/* Footer */}
                    <div className="mt-1 flex items-center gap-2 text-2xs text-muted-foreground/70">
                      <span className="tabular-nums">
                        {book.items.length} item{book.items.length === 1 ? "" : "s"}
                      </span>
                      <span>·</span>
                      <span>{shortRelative(book.updatedAt)}</span>
                    </div>
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-44">
                  {book.trashed ? (
                    <>
                      <ContextMenuItem
                        onClick={() => handleRestore(book.id, book.title)}
                        className="text-note"
                      >
                        <ArrowCounterClockwise size={14} weight="regular" className="mr-2 text-muted-foreground" />
                        Restore
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => handlePermanentDelete(book.id, book.title)}
                        className="text-note text-destructive focus:text-destructive"
                      >
                        <Trash size={14} weight="regular" className="mr-2" />
                        Delete forever
                      </ContextMenuItem>
                    </>
                  ) : (
                    <>
                      <ContextMenuItem onClick={() => startRename(book.id, book.title)} className="text-note">
                        <PencilSimple size={14} weight="regular" className="mr-2 text-muted-foreground" />
                        Rename
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => handleTogglePin(book.id, book.pinned)}
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
                        onClick={() => handleDelete(book.id, book.title)}
                        className="text-note text-destructive focus:text-destructive"
                      >
                        <Trash size={14} weight="regular" className="mr-2" />
                        Move to trash
                      </ContextMenuItem>
                    </>
                  )}
                </ContextMenuContent>
              </ContextMenu>
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
