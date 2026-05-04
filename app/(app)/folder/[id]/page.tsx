"use client"

/**
 * Folder detail page — type-strict container view (v107 / PR folder-b).
 *
 * Folders are now type-strict (PR folder-a): a folder accepts notes XOR
 * wiki articles, never both. The PR #236 unified-folder model is
 * permanently retired — see `.omc/plans/folder-nm-migration.md`.
 *
 * This page branches on `folder.kind`:
 *   - `kind === "note"` → only the Notes section renders (+ "New note"
 *     in the Add popover; "Open in Notes view" link).
 *   - `kind === "wiki"` → only the Wiki section renders (+ "New wiki
 *     article" in the Add popover; no Notes view link).
 *
 * Header subtitle is a single metric matching the kind ("3 notes" or
 * "5 wikis"). The PR #236 dual subtitle ("3 notes · 5 wikis") would now
 * always show one half as zero, which would just be visual noise.
 *
 * Layout (note kind):
 *   ┌────────────────────────────────────────┐
 *   │ ● [Folder name]   3 notes   [+ Add] [Open in Notes view] │
 *   ├────────────────────────────────────────┤
 *   │ Notes (3)                              │
 *   │   ◯ Note 1                             │
 *   └────────────────────────────────────────┘
 *
 * Layout (wiki kind):
 *   ┌────────────────────────────────────────┐
 *   │ ● [Folder name]   5 wikis     [+ Add]  │
 *   ├────────────────────────────────────────┤
 *   │ Wiki Articles (5)                      │
 *   │   ⬡ Article 1                          │
 *   └────────────────────────────────────────┘
 */

import { use, useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { setActiveFolderId, setActiveRoute } from "@/lib/table-route"
import { TABLE_VIEW_ROUTES } from "@/lib/table-route"
import { FolderOpen } from "@phosphor-icons/react/dist/ssr/FolderOpen"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { getEntityColor } from "@/lib/colors" // v109: opt-in color fallback

export default function FolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  // The (app)/layout.tsx switches between view components based on
  // `activeRoute`. We need a value that's neither in TABLE_VIEW_ROUTES nor
  // VIEW_ROUTES so layout falls through to render `children` (this page).
  // Setting it to the actual /folder/<id> path is unique enough.
  useEffect(() => {
    setActiveRoute(`/folder/${id}`)
    setActiveFolderId(id)
  }, [id])

  const folders = usePlotStore((s) => s.folders)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const createNote = usePlotStore((s) => s.createNote)
  const createWikiArticle = usePlotStore((s) => s.createWikiArticle)
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

  if (!folder) {
    return (
      <main className="flex h-full items-center justify-center text-muted-foreground">
        Folder not found.
      </main>
    )
  }

  const isNoteFolder = folder.kind === "note"
  const subtitleCount = isNoteFolder ? folderNotes.length : folderWikis.length
  const subtitleLabel = isNoteFolder
    ? subtitleCount === 1 ? "note" : "notes"
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
                  invariant that PR (a) put in place. */}
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
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const wikiId = createWikiArticle({ title: "Untitled", folderIds: [id] })
                    if (wikiId) router.push(`/wiki/${wikiId}`)
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
          {!isNoteFolder && (
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
                    if (wikiId) router.push(`/wiki/${wikiId}`)
                  }}
                />
              ) : (
                <ul className="flex flex-col gap-px rounded-md border border-border-subtle overflow-hidden">
                  {folderWikis.map((w) => (
                    <li key={w.id}>
                      <button
                        type="button"
                        onClick={() => router.push(`/wiki/${w.id}`)}
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
