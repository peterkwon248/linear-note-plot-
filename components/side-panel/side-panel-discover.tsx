"use client"

import { useMemo, useState, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { discoverRelated, type DiscoverResult } from "@/lib/search/discover-engine"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { cn } from "@/lib/utils"

// ── Collapsible Section ──────────────────────────────────

function DiscoverSection({
  title,
  icon,
  count,
  defaultOpen = true,
  children,
}: {
  title: string
  icon: React.ReactNode
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border-subtle last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-hover-bg"
      >
        <span className="text-muted-foreground">
          {open ? <CaretDown size={12} weight="bold" /> : <CaretRight size={12} weight="bold" />}
        </span>
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-note font-medium text-foreground">{title}</span>
        <span className="ml-auto text-2xs text-muted-foreground tabular-nums">{count}</span>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  )
}

// ── Note Row ─────────────────────────────────────────────

function DiscoverNoteRow({
  noteId,
  score,
  reasons,
}: {
  noteId: string
  score: number
  reasons: string[]
}) {
  const note = usePlotStore((s) => s.notes.find((n) => n.id === noteId))
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  if (!note) return null

  return (
    <button
      onClick={() => setSelectedNoteId(noteId)}
      className="group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-hover-bg"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-note text-foreground">{note.title || "Untitled"}</div>
        <div className="mt-0.5 truncate text-2xs text-muted-foreground">
          {reasons.join(" · ")}
        </div>
      </div>
      <span className="shrink-0 text-2xs text-muted-foreground/60 tabular-nums pt-0.5">
        {score.toFixed(1)}
      </span>
    </button>
  )
}

// ── Wiki Row ─────────────────────────────────────────────

function DiscoverWikiRow({
  noteId,
  score,
  reasons,
}: {
  noteId: string
  score: number
  reasons: string[]
}) {
  const article = usePlotStore((s) => s.wikiArticles.find((a) => a.id === noteId))
  const note = usePlotStore((s) => s.notes.find((n) => n.id === noteId))
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  const title = article?.title ?? note?.title
  if (!title) return null

  return (
    <button
      onClick={() => setSelectedNoteId(noteId)}
      className="group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-hover-bg"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-note text-foreground">{title}</div>
        <div className="mt-0.5 truncate text-2xs text-muted-foreground">
          {reasons.join(" · ")}
        </div>
      </div>
      <span className="shrink-0 text-2xs text-muted-foreground/60 tabular-nums pt-0.5">
        {score.toFixed(1)}
      </span>
    </button>
  )
}

// ── Tag Chip ─────────────────────────────────────────────

function SuggestedTagChip({
  tagId,
  tagName,
  noteId,
}: {
  tagId: string
  tagName: string
  noteId: string
}) {
  const addTagToNote = usePlotStore((s) => s.addTagToNote)
  const [added, setAdded] = useState(false)

  const handleAdd = useCallback(() => {
    addTagToNote(noteId, tagId)
    setAdded(true)
  }, [addTagToNote, noteId, tagId])

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-note text-muted-foreground">#{tagName}</span>
      {!added ? (
        <button
          onClick={handleAdd}
          className="rounded-sm p-0.5 text-accent transition-colors hover:bg-hover-bg"
          aria-label={`Add tag ${tagName}`}
        >
          <PhPlus size={12} weight="bold" />
        </button>
      ) : (
        <span className="text-2xs text-muted-foreground">added</span>
      )}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────

export function SidePanelDiscover() {
  const _selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const previewNoteId = usePlotStore((s) => s.previewNoteId)
  const selectedNoteId = _selectedNoteId || previewNoteId
  const notes = usePlotStore((s) => s.notes)
  const tags = usePlotStore((s) => s.tags)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  // Get the selected note
  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId),
    [notes, selectedNoteId]
  )

  // Build backlinks map: noteId -> [noteIds that link to it]
  // We derive this from notes' linksOut for simplicity
  const backlinksMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    // Build title -> id lookup
    const titleToId = new Map<string, string>()
    for (const n of notes) {
      if (n.title.trim()) titleToId.set(n.title.toLowerCase(), n.id)
    }
    // For each note, resolve linksOut to IDs and record backlinks
    for (const n of notes) {
      for (const linkTitle of n.linksOut) {
        const targetId = titleToId.get(linkTitle)
        if (targetId && targetId !== n.id) {
          if (!map[targetId]) map[targetId] = []
          map[targetId].push(n.id)
        }
      }
    }
    return map
  }, [notes])

  // Build wiki article ID set for isWiki detection on articles
  const wikiArticleIds = useMemo(
    () => new Set(wikiArticles.map((a) => a.id)),
    [wikiArticles]
  )

  // Prepare allNotes input for the engine
  const allNotesInput = useMemo(
    () =>
      notes
        .filter((n) => !n.trashed)
        .map((n) => ({
          id: n.id,
          title: n.title,
          tags: n.tags,
          linksOut: n.linksOut,
          folderId: n.folderId,
          isWiki: n.isWiki || wikiArticleIds.has(n.id),
          preview: n.preview,
        })),
    [notes, wikiArticleIds]
  )

  // Run discover engine
  const result: DiscoverResult | null = useMemo(() => {
    if (!selectedNote) return null

    return discoverRelated({
      noteId: selectedNote.id,
      noteTitle: selectedNote.title,
      noteBody: selectedNote.preview ?? "",
      noteTags: selectedNote.tags,
      noteLinksOut: selectedNote.linksOut,
      noteFolderId: selectedNote.folderId,
      allNotes: allNotesInput,
      backlinksMap,
      allTags: tags.map((t) => ({ id: t.id, name: t.name })),
    })
  }, [selectedNote, allNotesInput, backlinksMap, tags])

  // ── Empty states ───────────────────────────────────────

  if (!selectedNoteId || !selectedNote) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <MagnifyingGlass size={32} weight="regular" className="text-muted-foreground/40" />
        <p className="text-note text-muted-foreground">
          Select a note to discover related content
        </p>
      </div>
    )
  }

  if (!result || (result.relatedNotes.length === 0 && result.relatedWiki.length === 0 && result.suggestedTags.length === 0)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <MagnifyingGlass size={32} weight="regular" className="text-muted-foreground/40" />
        <p className="text-note text-muted-foreground">
          No related content found
        </p>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Related Notes */}
      {result.relatedNotes.length > 0 && (
        <DiscoverSection
          title="Related Notes"
          icon={<NotePencil size={14} weight="regular" />}
          count={result.relatedNotes.length}
        >
          <div className="flex flex-col gap-0.5">
            {result.relatedNotes.map((item) => (
              <DiscoverNoteRow
                key={item.noteId}
                noteId={item.noteId}
                score={item.score}
                reasons={item.reasons}
              />
            ))}
          </div>
        </DiscoverSection>
      )}

      {/* Related Wiki */}
      {result.relatedWiki.length > 0 && (
        <DiscoverSection
          title="Related Wiki"
          icon={<BookOpen size={14} weight="regular" />}
          count={result.relatedWiki.length}
        >
          <div className="flex flex-col gap-0.5">
            {result.relatedWiki.map((item) => (
              <DiscoverWikiRow
                key={item.noteId}
                noteId={item.noteId}
                score={item.score}
                reasons={item.reasons}
              />
            ))}
          </div>
        </DiscoverSection>
      )}

      {/* Suggested Tags */}
      {result.suggestedTags.length > 0 && (
        <DiscoverSection
          title="Suggested Tags"
          icon={<PhTag size={14} weight="regular" />}
          count={result.suggestedTags.length}
        >
          <div className="flex flex-col gap-2 px-2">
            {result.suggestedTags.map((tag) => (
              <SuggestedTagChip
                key={tag.tagId}
                tagId={tag.tagId}
                tagName={tag.tagName}
                noteId={selectedNoteId}
              />
            ))}
          </div>
        </DiscoverSection>
      )}
    </div>
  )
}
