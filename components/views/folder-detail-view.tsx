"use client"

/**
 * Folder detail view — type-strict container (v107 / PR folder-b).
 *
 * Extracted from the former `app/(app)/folder/[id]/page.tsx` so the dynamic
 * `/folder/[id]` route can fold into the static-export catch-all
 * (`app/(app)/[...slug]/page.tsx`). Logic is unchanged — only the entry
 * signature moved from `params: Promise<{id}>` to a plain `id` prop.
 *
 * Folders are type-strict (PR folder-a): a folder accepts notes XOR wiki
 * articles, never both. The PR #236 unified-folder model is permanently
 * retired — see `.omc/plans/folder-nm-migration.md`.
 *
 * Branches on `folder.kind`:
 *   - "note" → Notes section (+ "New note"; "Open in Notes view")
 *   - "wiki" → Wiki section (+ "New wiki article")
 *   - "book" → Books section (+ "New book")
 */

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { setActiveFolderId, setActiveRoute } from "@/lib/table-route"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { getEntityColor } from "@/lib/colors" // v109: opt-in color fallback
import { BookKindIcon } from "@/components/property-chips"
import { getBookKind } from "@/lib/view-engine/use-books-view"

export function FolderDetailView({ id }: { id: string }) {
  const router = useRouter()

  // The (app)/layout.tsx switches between view components based on
  // `activeRoute`. We need a value that's neither in TABLE_VIEW_ROUTES nor
  // VIEW_ROUTES so layout falls through to render `children` (the catch-all
  // route that renders this view). Setting it to the actual /folder/<id>
  // path is unique enough.
  useEffect(() => {
    // folder.kind → activity space (note|wiki|book). Direct URL / reload 시
    // 사이드바 context가 folder 종류와 정합하도록 spaceHint 전달.
    // (/folder/[id]는 cross-kind라 table-route inferSpace가 구분 못 함)
    const f = usePlotStore.getState().folders.find((x) => x.id === id)
    const space = f?.kind === "book" ? "books" : f?.kind === "wiki" ? "wiki" : "notes"
    setActiveRoute(`/folder/${id}`, space)
    setActiveFolderId(id)
  }, [id])

  const folders = usePlotStore((s) => s.folders)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const books = usePlotStore((s) => s.books)
  const createNote = usePlotStore((s) => s.createNote)
  const createWikiArticle = usePlotStore((s) => s.createWikiArticle)
  const createBook = usePlotStore((s) => s.createBook)
  const setBookFolders = usePlotStore((s) => s.setBookFolders)
  const openNote = usePlotStore((s) => s.openNote)

  const folder = folders.find((f) => f.id === id)
  // PR (b): kind-strict folders. Only one of these arrays is meaningful per
  // page — the other is empty by construction (a `kind="note"` folder
  // cannot hold wiki articles, and vice versa). We compute both anyway so
  // the loading-then-resolve flow is referential-equality stable.
  const folderNotes = useMemo(
    () => notes.filter((n) => !n.trashed && n.folderIds.includes(id)),
    [notes, id],
  )
  const folderWikis = useMemo(
    // WikiArticle has no `trashed` boolean (deleted articles are removed
    // entirely or moved to a separate trash list). Filter purely by folder.
    () => wikiArticles.filter((w) => w.folderIds.includes(id)),
    [wikiArticles, id],
  )
  // Book folder membership (v149 Phase 2). Mirror of folderNotes — exclude
  // trashed books (Book has a `trashed` boolean unlike WikiArticle).
  const folderBooks = useMemo(
    () => books.filter((b) => !b.trashed && b.folderIds.includes(id)),
    [books, id],
  )

  if (!folder) {
    return (
      <main className="flex h-full items-center justify-center text-muted-foreground">
        Folder not found.
      </main>
    )
  }

  const isNoteFolder = folder.kind === "note"
  const isWikiFolder = folder.kind === "wiki"
  const isBookFolder = folder.kind === "book"
  const subtitleCount = isNoteFolder
    ? folderNotes.length
    : isBookFolder
      ? folderBooks.length
      : folderWikis.length
  const subtitleLabel = isNoteFolder
    ? subtitleCount === 1 ? "note" : "notes"
    : isBookFolder
      ? subtitleCount === 1 ? "book" : "books"
      : subtitleCount === 1 ? "wiki" : "wikis"

  return (
    <main className="flex h-full flex-col overflow-hidden bg-background">
      {/* ── Header ── */}
      <header className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${getEntityColor(folder.color)}20` }}
          >
            <FolderOpen size={18} weight="regular" style={{ color: getEntityColor(folder.color) }} />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">{folder.name}</h1>
            <p className="text-2xs text-muted-foreground tabular-nums">
              {subtitleCount} {subtitleLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-note font-medium text-accent-foreground hover:bg-accent/90"
              >
                <Plus size={14} weight="bold" /> Add <CaretDown size={10} weight="bold" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1">
              {/* PR (b): kind-aware Add popover. Only the option matching
                  this folder's kind is offered — adding a wiki to a note
                  folder (or vice versa) would violate the type-strict
                  invariant that PR (a) put in place. v149 adds the book case. */}
              {isNoteFolder ? (
                <button
                  type="button"
                  onClick={() => {
                    const noteId = createNote({ folderIds: [id] })
                    openNote(noteId)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-note text-left hover:bg-accent"
                >
                  <span className="h-2 w-2 rounded-full bg-chart-2" /> New note
                </button>
              ) : isBookFolder ? (
                <button
                  type="button"
                  onClick={() => {
                    // createBook takes title only; assign the folder via the
                    // N:M setter right after (kind="book" enforced there).
                    const bookId = createBook("Untitled book")
                    setBookFolders(bookId, [id])
                    setActiveRoute(`/books/${bookId}`)
                    router.push(`/books/${bookId}`)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-note text-left hover:bg-accent"
                >
                  <span className="h-2 w-2 rounded-full bg-[#5E6AD2]" /> New book
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const wikiId = createWikiArticle({ title: "Untitled", folderIds: [id] })
                    if (wikiId) { setActiveRoute("/wiki"); navigateToWikiArticle(wikiId) }
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-note text-left hover:bg-accent"
                >
                  <span className="h-2 w-2 rounded-full bg-violet-500" /> New wiki article
                </button>
              )}
            </PopoverContent>
          </Popover>

          {/* "Open in Notes view" only meaningful for note folders — the
              /notes table has no equivalent for wiki articles (wiki has
              its own list view at /wiki). */}
          {isNoteFolder && (
            <button
              type="button"
              onClick={() => {
                setActiveFolderId(id)
                setActiveRoute("/notes")
                router.push("/notes")
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-1.5 text-note text-muted-foreground hover:bg-hover-bg hover:text-foreground"
              title="Open in full Notes view (with sort, filter, group by)"
            >
              <ArrowSquareOut size={14} weight="regular" />
              Open in Notes view
            </button>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col gap-8">
          {isWikiFolder && (
            /* Wiki folder — show only wiki articles. */
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Wiki Articles
                </h2>
                <span className="text-2xs text-muted-foreground tabular-nums">
                  {folderWikis.length}
                </span>
              </div>
              {folderWikis.length === 0 ? (
                <EmptyHint
                  label="No wiki articles in this folder yet."
                  actionLabel="Create one"
                  onAction={() => {
                    const wikiId = createWikiArticle({ title: "Untitled", folderIds: [id] })
                    if (wikiId) { setActiveRoute("/wiki"); navigateToWikiArticle(wikiId) }
                  }}
                />
              ) : (
                <ul className="flex flex-col gap-px rounded-md border border-border-subtle overflow-hidden">
                  {folderWikis.map((w) => (
                    <li key={w.id}>
                      <button
                        type="button"
                        onClick={() => { setActiveRoute("/wiki"); navigateToWikiArticle(w.id) }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left bg-card hover:bg-hover-bg"
                      >
                        <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                        <span className="text-note truncate flex-1">{w.title || "Untitled"}</span>
                        <span className="text-2xs text-muted-foreground tabular-nums shrink-0">
                          {(w.blocks?.length ?? 0)} blocks
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {isBookFolder && (
            /* Book folder — show only books (v149 Phase 2). Row mirrors the
               Notes/Wiki row pattern; BookKindIcon replaces the status dot. */
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Books
                </h2>
                <span className="text-2xs text-muted-foreground tabular-nums">
                  {folderBooks.length}
                </span>
              </div>
              {folderBooks.length === 0 ? (
                <EmptyHint
                  label="No books in this folder yet."
                  actionLabel="Create one"
                  onAction={() => {
                    const bookId = createBook("Untitled book")
                    setBookFolders(bookId, [id])
                    setActiveRoute(`/books/${bookId}`)
                    router.push(`/books/${bookId}`)
                  }}
                />
              ) : (
                <ul className="flex flex-col gap-px rounded-md border border-border-subtle overflow-hidden">
                  {folderBooks.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => { setActiveRoute(`/books/${b.id}`); router.push(`/books/${b.id}`) }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left bg-card hover:bg-hover-bg"
                      >
                        <span className="flex shrink-0 items-center justify-center w-4">
                          <BookKindIcon kind={getBookKind(b)} size={14} />
                        </span>
                        <span className="text-note truncate flex-1">{b.title || "Untitled book"}</span>
                        <span className="text-2xs text-muted-foreground tabular-nums shrink-0">
                          {b.items.length} {b.items.length === 1 ? "item" : "items"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {isNoteFolder && (
            /* Note folder — show only notes. */
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </h2>
                <span className="text-2xs text-muted-foreground tabular-nums">
                  {folderNotes.length}
                </span>
              </div>
              {folderNotes.length === 0 ? (
                <EmptyHint
                  label="No notes in this folder yet."
                  actionLabel="Create one"
                  onAction={() => {
                    const noteId = createNote({ folderIds: [id] })
                    openNote(noteId)
                  }}
                />
              ) : (
                <ul className="flex flex-col gap-px rounded-md border border-border-subtle overflow-hidden">
                  {folderNotes.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openNote(n.id)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left bg-card hover:bg-hover-bg"
                      >
                        <span className="h-2 w-2 rounded-full bg-chart-2 shrink-0" />
                        <span className="text-note truncate flex-1">{n.title || "Untitled"}</span>
                        <span className="text-2xs text-muted-foreground shrink-0 capitalize">
                          {n.status}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

function EmptyHint({ label, actionLabel, onAction }: { label: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-6 rounded-md border border-dashed border-border-subtle text-note text-muted-foreground">
      <span>{label}</span>
      <button
        type="button"
        onClick={onAction}
        className="text-foreground/80 hover:text-foreground underline-offset-2 hover:underline"
      >
        {actionLabel}
      </button>
    </div>
  )
}
