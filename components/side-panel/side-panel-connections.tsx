"use client"

import { useMemo, useState, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import { detectUnlinkedMentions } from "@/lib/unlinked-mentions"
import { discoverRelated, type DiscoverResult } from "@/lib/search/discover-engine"
import { ArrowDownLeft } from "@phosphor-icons/react/dist/ssr/ArrowDownLeft"
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { cn } from "@/lib/utils"

// ── Collapsible Section ──────────────────────────────────

function ConnectionSection({
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

// ── Suggested Tag Chip ───────────────────────────────────

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
      <PhTag size={12} weight="regular" className="shrink-0 text-muted-foreground/60" />
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

// ── Sub-section label ────────────────────────────────────

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 px-2">
      {children}
    </span>
  )
}

// ── Main Component ───────────────────────────────────────

export function SidePanelConnections() {
  // Store selectors
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const previewNoteId = usePlotStore((s) => s.previewNoteId)
  const noteId = selectedNoteId || previewNoteId
  const notes = usePlotStore((s) => s.notes)
  const tags = usePlotStore((s) => s.tags)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCollections = usePlotStore((s) => s.wikiCollections)
  const openSidePeek = usePlotStore((s) => s.openSidePeek)
  const addWikiLink = usePlotStore((s) => s.addWikiLink)
  const addTagToNote = usePlotStore((s) => s.addTagToNote)

  const note = notes.find((n) => n.id === noteId) ?? null

  // ── Inbound data ─────────────────────────────────────

  const backlinkNotes = useBacklinksFor(noteId)

  const unlinkedMentions = useMemo(
    () => (noteId ? detectUnlinkedMentions(noteId, notes) : []),
    [noteId, notes]
  )

  // Wiki articles that reference this note (via blocks OR collections)
  const wikiArticlesUsingNote = useMemo(() => {
    if (!noteId) return []
    const resultMap = new Map<string, string>()

    // 1. Check wikiArticles blocks for note-ref
    for (const article of wikiArticles) {
      if (article.blocks?.some((b: { type: string; noteId?: string }) => b.type === "note-ref" && b.noteId === noteId)) {
        resultMap.set(article.id, article.title)
      }
    }

    // 2. Check wikiCollections for collected notes
    for (const [wikiId, items] of Object.entries(wikiCollections ?? {})) {
      if (items.some((item) => item.type === "note" && item.sourceNoteId === noteId)) {
        if (!resultMap.has(wikiId)) {
          const article = wikiArticles.find((a) => a.id === wikiId)
          const articleNote = notes.find((n) => n.id === wikiId)
          resultMap.set(wikiId, article?.title ?? articleNote?.title ?? "Untitled")
        }
      }
    }

    return Array.from(resultMap, ([id, title]) => ({ id, title })).filter((a) => a.title)
  }, [noteId, wikiCollections, wikiArticles, notes])

  // ── Outbound data ────────────────────────────────────

  // Notes this note already links to via [[wikilinks]]
  const linkedNotes = useMemo(() => {
    if (!note) return []
    const titleToNote = new Map(
      notes.map((n) => [n.title.toLowerCase(), n])
    )
    return (note.linksOut ?? [])
      .map((title) => titleToNote.get(title.toLowerCase()))
      .filter(
        (n): n is NonNullable<typeof n> => !!n && n.id !== noteId
      )
  }, [note, notes, noteId])

  // ── Discover engine (for suggestions) ────────────────

  const wikiArticleIds = useMemo(
    () => new Set(wikiArticles.map((a) => a.id)),
    [wikiArticles]
  )

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

  const backlinksMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    const titleToId = new Map<string, string>()
    for (const n of notes) {
      if (n.title.trim()) titleToId.set(n.title.toLowerCase(), n.id)
    }
    for (const n of notes) {
      for (const linkTitle of n.linksOut) {
        const targetId = titleToId.get(linkTitle.toLowerCase())
        if (targetId && targetId !== n.id) {
          if (!map[targetId]) map[targetId] = []
          map[targetId].push(n.id)
        }
      }
    }
    return map
  }, [notes])

  const discoverResult: DiscoverResult | null = useMemo(() => {
    if (!note) return null
    return discoverRelated({
      noteId: note.id,
      noteTitle: note.title,
      noteBody: note.preview ?? "",
      noteTags: note.tags,
      noteLinksOut: note.linksOut,
      noteFolderId: note.folderId,
      allNotes: allNotesInput,
      backlinksMap,
      allTags: tags.map((t) => ({ id: t.id, name: t.name })),
    })
  }, [note, allNotesInput, backlinksMap, tags])

  // ── Empty state ──────────────────────────────────────

  if (!note) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Select a note to see connections
        </p>
      </div>
    )
  }

  // ── Derived counts ───────────────────────────────────

  const inboundCount =
    backlinkNotes.length +
    wikiArticlesUsingNote.length +
    unlinkedMentions.length

  const suggestedNotes = discoverResult?.relatedNotes ?? []
  const suggestedWiki = discoverResult?.relatedWiki ?? []
  const suggestedTags = discoverResult?.suggestedTags ?? []

  // Set of inbound note IDs for mutual link detection
  const inboundIds = useMemo(() => new Set(backlinkNotes.map((n) => n.id)), [backlinkNotes])

  const outboundCount =
    linkedNotes.length +
    suggestedNotes.length +
    suggestedWiki.length +
    suggestedTags.length

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ← Inbound */}
      <ConnectionSection
        title="Inbound"
        icon={<ArrowDownLeft size={14} weight="regular" />}
        count={inboundCount}
        defaultOpen
      >
        {inboundCount === 0 ? (
          <p className="text-sm text-muted-foreground px-2">
            No inbound references yet
          </p>
        ) : (
          <div className="space-y-3">
            {/* Backlinks */}
            {backlinkNotes.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Backlinks</SubLabel>
                {backlinkNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openSidePeek(n.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-0.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <FileText
                      className="shrink-0 text-muted-foreground/60"
                      size={14}
                      weight="regular"
                    />
                    <span className="truncate">{n.title || "Untitled"}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Wiki Articles using this note */}
            {wikiArticlesUsingNote.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Wiki Articles</SubLabel>
                {wikiArticlesUsingNote.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openSidePeek(a.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-0.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <BookOpen
                      className="shrink-0 text-muted-foreground/60"
                      size={14}
                      weight="regular"
                    />
                    <span className="truncate">{a.title}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Unlinked Mentions */}
            {unlinkedMentions.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Unlinked Mentions</SubLabel>
                {unlinkedMentions.map((m) => (
                  <div
                    key={m.noteId + m.title}
                    className="flex items-center gap-2 group px-2 py-0.5 rounded hover:bg-secondary/50 transition-colors"
                  >
                    <Warning
                      className="shrink-0 text-muted-foreground/60"
                      size={14}
                      weight="regular"
                    />
                    <span className="truncate flex-1 text-sm text-muted-foreground">
                      {m.title}
                    </span>
                    <span className="text-2xs text-muted-foreground/40">
                      {m.count}×
                    </span>
                    <button
                      onClick={() => addWikiLink(note.id, m.title)}
                      className="shrink-0 text-2xs text-accent opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                    >
                      Link
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ConnectionSection>

      {/* → Outbound */}
      <ConnectionSection
        title="Outbound"
        icon={<ArrowUpRight size={14} weight="regular" />}
        count={outboundCount}
        defaultOpen
      >
        {outboundCount === 0 ? (
          <p className="text-sm text-muted-foreground px-2">
            No outbound links or suggestions
          </p>
        ) : (
          <div className="space-y-3">
            {/* Already Linked */}
            {linkedNotes.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Linked</SubLabel>
                {linkedNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openSidePeek(n.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-0.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <PhLink
                      className="shrink-0 text-muted-foreground/60"
                      size={14}
                      weight="regular"
                    />
                    <span className="truncate">{n.title || "Untitled"}</span>
                    {inboundIds.has(n.id) && (
                      <span className="shrink-0 text-2xs text-accent/60 font-medium" title="Mutual link">↔</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Suggested Notes */}
            {suggestedNotes.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Suggested Notes</SubLabel>
                {suggestedNotes.map((item) => {
                  const sNote = notes.find((n) => n.id === item.noteId)
                  if (!sNote) return null
                  return (
                    <div
                      key={item.noteId}
                      className="flex items-center gap-2 group px-2 py-0.5 rounded hover:bg-secondary/50 transition-colors"
                    >
                      <FileText
                        className="shrink-0 text-muted-foreground/60"
                        size={14}
                        weight="regular"
                      />
                      <button
                        onClick={() => openSidePeek(item.noteId)}
                        className="truncate flex-1 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {sNote.title || "Untitled"}
                      </button>
                      {inboundIds.has(item.noteId) && (
                        <span className="shrink-0 text-2xs text-accent/60 font-medium" title="Mutual link">↔</span>
                      )}
                      <span className="text-2xs text-muted-foreground/40 shrink-0 tabular-nums">
                        {item.score.toFixed(1)}
                      </span>
                      <button
                        onClick={() => addWikiLink(note.id, sNote.title)}
                        className="shrink-0 text-2xs text-accent opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                      >
                        + Link
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Suggested Wiki */}
            {suggestedWiki.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Suggested Wiki</SubLabel>
                {suggestedWiki.map((item) => {
                  const article = wikiArticles.find((a) => a.id === item.noteId)
                  const wNote = notes.find((n) => n.id === item.noteId)
                  const title = article?.title ?? wNote?.title
                  if (!title) return null
                  return (
                    <div
                      key={item.noteId}
                      className="flex items-center gap-2 group px-2 py-0.5 rounded hover:bg-secondary/50 transition-colors"
                    >
                      <BookOpen
                        className="shrink-0 text-muted-foreground/60"
                        size={14}
                        weight="regular"
                      />
                      <button
                        onClick={() => openSidePeek(item.noteId)}
                        className="truncate flex-1 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {title}
                      </button>
                      {inboundIds.has(item.noteId) && (
                        <span className="shrink-0 text-2xs text-accent/60 font-medium" title="Mutual link">↔</span>
                      )}
                      <span className="text-2xs text-muted-foreground/40 shrink-0 tabular-nums">
                        {item.score.toFixed(1)}
                      </span>
                      <button
                        onClick={() => addWikiLink(note.id, title)}
                        className="shrink-0 text-2xs text-accent opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                      >
                        + Link
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Suggested Tags</SubLabel>
                <div className="flex flex-col gap-1.5 px-2">
                  {suggestedTags.map((tag) => (
                    <SuggestedTagChip
                      key={tag.tagId}
                      tagId={tag.tagId}
                      tagName={tag.tagName}
                      noteId={noteId!}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ConnectionSection>
    </div>
  )
}
