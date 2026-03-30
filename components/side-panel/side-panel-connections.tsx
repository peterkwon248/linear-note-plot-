"use client"

import { useMemo, useState, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import { detectUnlinkedMentions } from "@/lib/unlinked-mentions"
import { discoverRelated, type DiscoverResult } from "@/lib/search/discover-engine"
import { LinkSimple } from "@phosphor-icons/react/dist/ssr/LinkSimple"
import { Compass } from "@phosphor-icons/react/dist/ssr/Compass"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { IconWiki } from "@/components/plot-icons"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
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

// ── Direction Arrow ──────────────────────────────────────

function DirArrow({ dir }: { dir: "in" | "out" }) {
  return (
    <span className={cn(
      "shrink-0 text-2xs font-mono leading-none",
      dir === "in" ? "text-blue-400/60" : "text-emerald-400/60"
    )}>
      {dir === "in" ? "←" : "→"}
    </span>
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

  const note = notes.find((n) => n.id === noteId) ?? null

  // ── Wiki article IDs set ───────────────────────────────

  const wikiArticleIds = useMemo(
    () => new Set(wikiArticles.map((a) => a.id)),
    [wikiArticles]
  )

  // ── CONNECTED: Inbound ─────────────────────────────────

  const backlinkNotes = useBacklinksFor(noteId)

  const unlinkedMentions = useMemo(
    () => (noteId ? detectUnlinkedMentions(noteId, notes) : []),
    [noteId, notes]
  )

  // Wiki articles that reference this note
  const inboundWiki = useMemo(() => {
    if (!noteId) return []
    const resultMap = new Map<string, string>()

    for (const article of wikiArticles) {
      if (article.blocks?.some((b: { type: string; noteId?: string }) => b.type === "note-ref" && b.noteId === noteId)) {
        resultMap.set(article.id, article.title)
      }
    }

    for (const [wikiId, items] of Object.entries(wikiCollections ?? {})) {
      if (items.some((item) => item.type === "note" && item.sourceNoteId === noteId)) {
        if (!resultMap.has(wikiId)) {
          const article = wikiArticles.find((a) => a.id === wikiId)
          const articleNote = notes.find((n) => n.id === wikiId)
          resultMap.set(wikiId, article?.title ?? articleNote?.title ?? "Untitled")
        }
      }
    }

    resultMap.delete(noteId!) // Exclude self
    return Array.from(resultMap, ([id, title]) => ({ id, title })).filter((a) => a.title)
  }, [noteId, wikiCollections, wikiArticles, notes])

  // ── CONNECTED: Outbound ────────────────────────────────

  // Notes & wiki this note links to via [[wikilinks]] + note-ref blocks + collections
  const outboundLinked = useMemo(() => {
    if (!note) return [] as { id: string; title: string; isWiki: boolean }[]
    const seen = new Set<string>()
    const result: { id: string; title: string; isWiki: boolean }[] = []

    const titleToNote = new Map(notes.map((n) => [n.title.toLowerCase(), n]))

    // 1. [[wikilinks]]
    for (const title of note.linksOut ?? []) {
      const linked = titleToNote.get(title.toLowerCase())
      if (linked && linked.id !== noteId && !seen.has(linked.id)) {
        seen.add(linked.id)
        result.push({ id: linked.id, title: linked.title, isWiki: wikiArticleIds.has(linked.id) })
      }
    }

    // 2. Wiki note-ref blocks
    const article = wikiArticles.find((a) => a.id === noteId)
    if (article?.blocks) {
      for (const block of article.blocks) {
        if (block.type === "note-ref" && block.noteId && !seen.has(block.noteId)) {
          const refNote = notes.find((n) => n.id === block.noteId)
          if (refNote) {
            seen.add(refNote.id)
            result.push({ id: refNote.id, title: refNote.title, isWiki: wikiArticleIds.has(refNote.id) })
          }
        }
      }
    }

    // 3. Wiki collections
    const collections = wikiCollections?.[noteId!]
    if (collections) {
      for (const item of collections) {
        if (item.type === "note" && item.sourceNoteId && !seen.has(item.sourceNoteId)) {
          const colNote = notes.find((n) => n.id === item.sourceNoteId)
          if (colNote) {
            seen.add(colNote.id)
            result.push({ id: colNote.id, title: colNote.title, isWiki: wikiArticleIds.has(colNote.id) })
          }
        }
      }
    }

    return result
  }, [note, notes, noteId, wikiArticles, wikiCollections, wikiArticleIds])

  // Split outbound into notes vs wiki
  const outboundNotes = useMemo(() => outboundLinked.filter((i) => !i.isWiki), [outboundLinked])
  const outboundWiki = useMemo(() => outboundLinked.filter((i) => i.isWiki), [outboundLinked])

  // All linked IDs (for filtering discover results)
  const linkedIds = useMemo(
    () => new Set(outboundLinked.map((i) => i.id)),
    [outboundLinked]
  )

  // ── DISCOVER engine ────────────────────────────────────

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
        <p className="text-note text-muted-foreground">
          Select a note to see connections
        </p>
      </div>
    )
  }

  // ── Derived data ───────────────────────────────────────

  const suggestedNotes = (discoverResult?.relatedNotes ?? []).filter((i) => !linkedIds.has(i.noteId))
  const suggestedWiki = (discoverResult?.relatedWiki ?? []).filter((i) => !linkedIds.has(i.noteId))
  const suggestedTags = discoverResult?.suggestedTags ?? []

  const inboundIds = new Set(backlinkNotes.map((n) => n.id))

  const connectedCount =
    backlinkNotes.length +
    inboundWiki.length +
    outboundNotes.length +
    outboundWiki.length +
    unlinkedMentions.length

  const discoverCount =
    suggestedNotes.length +
    suggestedWiki.length +
    suggestedTags.length

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Connected */}
      <ConnectionSection
        title="Connected"
        icon={<LinkSimple size={14} weight="regular" />}
        count={connectedCount}
        defaultOpen
      >
        {connectedCount === 0 ? (
          <p className="text-note text-muted-foreground px-2">
            No connections yet
          </p>
        ) : (
          <div className="space-y-3">
            {/* ← Notes (backlinks) */}
            {backlinkNotes.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>← Notes</SubLabel>
                {backlinkNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openSidePeek(n.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-0.5 rounded text-note text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
                  >
                    <DirArrow dir="in" />
                    <FileText className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
                    <span className="truncate">{n.title || "Untitled"}</span>
                    {linkedIds.has(n.id) && (
                      <span className="shrink-0 text-2xs text-accent/60 font-medium" title="Mutual link">↔</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ← Wiki */}
            {inboundWiki.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>← Wiki</SubLabel>
                {inboundWiki.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openSidePeek(a.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-0.5 rounded text-note text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
                  >
                    <DirArrow dir="in" />
                    <IconWiki size={14} className="shrink-0 text-muted-foreground/60" />
                    <span className="truncate">{a.title}</span>
                    {linkedIds.has(a.id) && (
                      <span className="shrink-0 text-2xs text-accent/60 font-medium" title="Mutual link">↔</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* → Notes */}
            {outboundNotes.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>→ Notes</SubLabel>
                {outboundNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openSidePeek(n.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-0.5 rounded text-note text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
                  >
                    <DirArrow dir="out" />
                    <FileText className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
                    <span className="truncate">{n.title || "Untitled"}</span>
                    {inboundIds.has(n.id) && (
                      <span className="shrink-0 text-2xs text-accent/60 font-medium" title="Mutual link">↔</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* → Wiki */}
            {outboundWiki.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>→ Wiki</SubLabel>
                {outboundWiki.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => openSidePeek(w.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-0.5 rounded text-note text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
                  >
                    <DirArrow dir="out" />
                    <IconWiki size={14} className="shrink-0 text-muted-foreground/60" />
                    <span className="truncate">{w.title || "Untitled"}</span>
                    {inboundIds.has(w.id) && (
                      <span className="shrink-0 text-2xs text-accent/60 font-medium" title="Mutual link">↔</span>
                    )}
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
                    className="flex items-center gap-2 group px-2 py-0.5 rounded hover:bg-hover-bg transition-colors"
                  >
                    <Warning className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
                    <span className="truncate flex-1 text-note text-muted-foreground">
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

      {/* Discover */}
      <ConnectionSection
        title="Discover"
        icon={<Compass size={14} weight="regular" />}
        count={discoverCount}
        defaultOpen
      >
        {discoverCount === 0 ? (
          <p className="text-note text-muted-foreground px-2">
            No suggestions yet
          </p>
        ) : (
          <div className="space-y-3">
            {/* Notes */}
            {suggestedNotes.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Notes</SubLabel>
                {suggestedNotes.map((item) => {
                  const sNote = notes.find((n) => n.id === item.noteId)
                  if (!sNote) return null
                  return (
                    <div
                      key={item.noteId}
                      className="flex items-center gap-2 group px-2 py-0.5 rounded hover:bg-hover-bg transition-colors"
                    >
                      <FileText className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
                      <button
                        onClick={() => openSidePeek(item.noteId)}
                        className="truncate flex-1 text-left text-note text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {sNote.title || "Untitled"}
                      </button>
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

            {/* Wiki */}
            {suggestedWiki.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Wiki</SubLabel>
                {suggestedWiki.map((item) => {
                  const article = wikiArticles.find((a) => a.id === item.noteId)
                  const wNote = notes.find((n) => n.id === item.noteId)
                  const title = article?.title ?? wNote?.title
                  if (!title) return null
                  return (
                    <div
                      key={item.noteId}
                      className="flex items-center gap-2 group px-2 py-0.5 rounded hover:bg-hover-bg transition-colors"
                    >
                      <IconWiki size={14} className="shrink-0 text-muted-foreground/60" />
                      <button
                        onClick={() => openSidePeek(item.noteId)}
                        className="truncate flex-1 text-left text-note text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {title}
                      </button>
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

            {/* Tags */}
            {suggestedTags.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Tags</SubLabel>
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
