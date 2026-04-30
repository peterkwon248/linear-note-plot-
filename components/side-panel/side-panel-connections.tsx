"use client"

import { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import { getBody, getAllBodies } from "@/lib/note-body-store"
import { extractMentionTargets } from "@/lib/body-helpers"
import { ensureMentionIndexBuilt, getMentionSources } from "@/lib/mention-index-store"
import { useSidePanelEntity } from "./use-side-panel-entity"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import { useBacklinksWithContext } from "@/hooks/use-backlinks-with-context"
import { BacklinkCard } from "./backlink-card"
import { detectUnlinkedMentions } from "@/lib/unlinked-mentions"
import { discoverRelated, type DiscoverResult } from "@/lib/search/discover-engine"
import { LinkSimple } from "@phosphor-icons/react/dist/ssr/LinkSimple"
import { Compass } from "@phosphor-icons/react/dist/ssr/Compass"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { IconWiki } from "@/components/plot-icons"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { GitBranch } from "@phosphor-icons/react/dist/ssr/GitBranch"
import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp"
import { ArrowDown } from "@phosphor-icons/react/dist/ssr/ArrowDown"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { cn } from "@/lib/utils"
import { NotePickerDialog } from "@/components/note-picker-dialog"
import { WikiPickerDialog } from "@/components/wiki-picker-dialog"
import { getNoteDescendants } from "@/lib/note-hierarchy"
import { getDescendants, getChildren } from "@/lib/wiki-hierarchy"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"

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
    <span className="text-2xs font-semibold uppercase tracking-wider text-accent/80 px-2">
      {children}
    </span>
  )
}

// ── Wiki Article Connections ─────────────────────────────

function WikiArticleConnections() {
  const ctx = usePlotStore((s) => s.sidePanelContext)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const openInSecondary = usePlotStore((s) => s.openInSecondary)
  const setWikiArticleParent = usePlotStore((s) => s.setWikiArticleParent)

  const [parentPickerOpen, setParentPickerOpen] = useState(false)
  const [addChildOpen, setAddChildOpen] = useState(false)

  const articleId = ctx?.type === "wiki" ? ctx.id : null
  const article = useMemo(
    () => wikiArticles.find((a) => a.id === articleId) ?? null,
    [wikiArticles, articleId]
  )

  const parentArticle = useMemo(() => {
    if (!article?.parentArticleId) return null
    return wikiArticles.find((a) => a.id === article.parentArticleId) ?? null
  }, [article?.parentArticleId, wikiArticles])

  const childArticles = useMemo(() => {
    if (!article) return []
    return getChildren(article.id, { wikiArticles })
  }, [article, wikiArticles])

  const parentPickerExcludeIds = useMemo(() => {
    if (!article) return []
    return [...getDescendants(article.id, { wikiArticles })]
  }, [article, wikiArticles])

  const childPickerExcludeIds = useMemo(() => {
    if (!article) return []
    return [...getDescendants(article.id, { wikiArticles })]
  }, [article, wikiArticles])

  const handleAddChildren = (selectedIds: string[]) => {
    if (!article) return
    for (const childId of selectedIds) {
      setWikiArticleParent(childId, article.id)
    }
  }

  // Rich block-level contexts (note sources only — wiki sources scan plaintext only)
  const wikiBacklinkTarget = useMemo(
    () => (articleId ? ({ kind: "wiki", id: articleId } as const) : null),
    [articleId]
  )
  const wikiRichBacklinks = useBacklinksWithContext(wikiBacklinkTarget)
  const wikiRichByKey = useMemo(() => {
    const m = new Map<string, (typeof wikiRichBacklinks)[number]>()
    for (const r of wikiRichBacklinks) m.set(`${r.sourceKind}:${r.sourceId}`, r)
    return m
  }, [wikiRichBacklinks])

  // Notes referenced by this article (note-ref blocks)
  const referencedNotes = useMemo(() => {
    if (!article?.blocks) return []
    const noteIds = article.blocks
      .filter((b) => b.type === "note-ref" && b.noteId)
      .map((b) => b.noteId!)
    const unique = [...new Set(noteIds)]
    return unique
      .map((id) => notes.find((n) => n.id === id))
      .filter((n): n is NonNullable<typeof n> => !!n && !n.trashed)
  }, [article, notes])

  // Other wiki articles that reference this article (have note-ref blocks pointing here)
  const referencedBy = useMemo(() => {
    if (!articleId) return []
    return wikiArticles.filter(
      (a) =>
        a.id !== articleId &&
        a.blocks?.some((b) => b.type === "note-ref" && b.noteId === articleId)
    )
  }, [articleId, wikiArticles])

  // Notes that wikilink to this article (matches title or aliases)
  const linkingNotes = useMemo(() => {
    if (!article) return []
    const targetTitles = [article.title.toLowerCase(), ...((article.aliases as string[] | undefined) ?? []).map((a) => a.toLowerCase())]
    return notes.filter(
      (n) => !n.trashed && n.linksOut?.some((l: string) => targetTitles.includes(l)),
    )
  }, [article, notes])

  if (!article) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">
          Select a wiki article to see connections
        </p>
      </div>
    )
  }

  const hierarchyCount = (parentArticle ? 1 : 0) + childArticles.length
  const totalCount = referencedNotes.length + referencedBy.length + linkingNotes.length

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hierarchy — parent + children */}
      <ConnectionSection
        title="Hierarchy"
        icon={<GitBranch size={14} weight="regular" />}
        count={hierarchyCount}
        defaultOpen
      >
        {/* Parent */}
        <div className="space-y-0.5 mb-2">
          <div className="flex items-center gap-1 px-2 mb-1">
            <ArrowUp size={10} className="text-accent/70" />
            <SubLabel>Parent</SubLabel>
          </div>
          {parentArticle ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5">
              <button
                onClick={() => navigateToWikiArticle(parentArticle.id)}
                className="flex-1 min-w-0 text-left text-note text-foreground hover:text-foreground truncate transition-colors duration-100"
              >
                {parentArticle.title}
              </button>
              <button
                onClick={() => setWikiArticleParent(article.id, null)}
                title="Remove parent"
                className="shrink-0 text-muted-foreground hover:text-red-400 transition-colors duration-100 p-0.5 rounded"
              >
                <PhX size={12} weight="bold" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setParentPickerOpen(true)}
              className="flex items-center gap-1.5 text-note text-muted-foreground hover:text-foreground transition-colors duration-100 px-2 py-0.5"
            >
              <PhPlus size={12} weight="bold" />
              Set parent
            </button>
          )}
        </div>

        {/* Children */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 px-2 mb-1">
            <ArrowDown size={10} className="text-accent/70" />
            <SubLabel>Children</SubLabel>
          </div>
          {childArticles.map((child) => (
            <button
              key={child.id}
              onClick={() => navigateToWikiArticle(child.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-left text-note text-foreground hover:bg-hover-bg hover:text-foreground transition-colors duration-100"
            >
              <IconWiki size={12} className="shrink-0 text-muted-foreground" />
              <span className="truncate">{child.title}</span>
            </button>
          ))}
          <button
            onClick={() => setAddChildOpen(true)}
            className="flex items-center gap-1.5 text-note text-muted-foreground hover:text-foreground transition-colors duration-100 px-2 py-0.5"
          >
            <PhPlus size={12} weight="bold" />
            Add child
          </button>
        </div>
      </ConnectionSection>

      {/* Connected */}
      <ConnectionSection
        title="Connected"
        icon={<LinkSimple size={14} weight="regular" />}
        count={totalCount}
        defaultOpen
      >
        {totalCount === 0 ? (
          <p className="text-note text-muted-foreground px-2">
            No connections yet
          </p>
        ) : (
          <div className="space-y-3">
            {referencedNotes.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Referenced Notes</SubLabel>
                {referencedNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openInSecondary(n.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-0.5 rounded text-note text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
                  >
                    <DirArrow dir="out" />
                    <FileText className="shrink-0 text-muted-foreground/60" size={14} weight="regular" />
                    <span className="truncate">{n.title || "Untitled"}</span>
                  </button>
                ))}
              </div>
            )}

            {referencedBy.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Referenced By (Wiki)</SubLabel>
                {referencedBy.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openInSecondary(a.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-0.5 rounded text-note text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
                  >
                    <DirArrow dir="in" />
                    <IconWiki size={14} className="shrink-0 text-muted-foreground/60" />
                    <span className="truncate">{a.title}</span>
                  </button>
                ))}
              </div>
            )}

            {linkingNotes.length > 0 && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 px-2">
                  <DirArrow dir="in" />
                  <SubLabel>Linked from Notes</SubLabel>
                </div>
                <div className="space-y-px">
                  {linkingNotes.map((n) => {
                    const rich = wikiRichByKey.get(`note:${n.id}`)
                    return (
                      <BacklinkCard
                        key={n.id}
                        source={
                          rich ?? {
                            sourceId: n.id,
                            sourceKind: "note",
                            sourceTitle: n.title || "Untitled",
                            contexts: [],
                            loading: false,
                          }
                        }
                        onClick={() => openInSecondary(n.id)}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </ConnectionSection>

      {/* Pickers */}
      <WikiPickerDialog
        open={parentPickerOpen}
        onOpenChange={setParentPickerOpen}
        title="Select parent article"
        excludeIds={parentPickerExcludeIds}
        onSelect={(selectedId) => {
          setWikiArticleParent(article.id, selectedId)
          setParentPickerOpen(false)
        }}
      />
      {addChildOpen && (
        <WikiPickerDialog
          open={addChildOpen}
          onOpenChange={setAddChildOpen}
          title="Add children"
          excludeIds={childPickerExcludeIds}
          multiSelect={true}
          onSelectMulti={handleAddChildren}
        />
      )}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────

export function SidePanelConnections() {
  // Check sidePanelContext for wiki branch
  const sidePanelContext = usePlotStore((s) => s.sidePanelContext)

  if (sidePanelContext?.type === "wiki") {
    return <WikiArticleConnections />
  }

  return <NoteConnections />
}

function NoteConnections() {
  // Resolve target note via pane-aware entity hook (follows active pane in split view)
  const entity = useSidePanelEntity()
  const noteId = entity.type === "note" ? entity.noteId : null
  const notes = usePlotStore((s) => s.notes)
  const tags = usePlotStore((s) => s.tags)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCollections = usePlotStore((s) => s.wikiCollections)
  const openInSecondary = usePlotStore((s) => s.openInSecondary)
  const openNote = usePlotStore((s) => s.openNote)
  const addWikiLink = usePlotStore((s) => s.addWikiLink)
  const setNoteParent = usePlotStore((s) => s.setNoteParent)

  const [parentPickerOpen, setParentPickerOpen] = useState(false)
  const [addChildOpen, setAddChildOpen] = useState(false)

  const note = notes.find((n) => n.id === noteId) ?? null

  // ── Hierarchy ────────────────────────────────────────────
  const parentNote = useMemo(
    () => (note?.parentNoteId ? notes.find((n) => n.id === note.parentNoteId) ?? null : null),
    [note?.parentNoteId, notes]
  )

  const childNotes = useMemo(
    () => notes.filter((n) => !n.trashed && n.parentNoteId === noteId),
    [notes, noteId]
  )

  const parentPickerExcludeIds = useMemo(() => {
    if (!noteId) return []
    return Array.from(getNoteDescendants(noteId, { notes }))
  }, [noteId, notes])

  const childPickerExcludeIds = parentPickerExcludeIds

  const handleAddChildren = (selectedIds: string[]) => {
    if (!noteId) return
    for (const childId of selectedIds) {
      setNoteParent(childId, noteId)
    }
  }

  // ── Wiki article IDs set ───────────────────────────────

  const wikiArticleIds = useMemo(
    () => new Set(wikiArticles.map((a) => a.id)),
    [wikiArticles]
  )

  // ── CONNECTED: Inbound ─────────────────────────────────

  const backlinkNotes = useBacklinksFor(noteId)

  // Rich block-level contexts for backlinks (note + wiki sources)
  const backlinkTarget = useMemo(
    () => (noteId ? ({ kind: "note", id: noteId } as const) : null),
    [noteId]
  )
  const richBacklinks = useBacklinksWithContext(backlinkTarget)
  const richBacklinksByKey = useMemo(() => {
    const m = new Map<string, (typeof richBacklinks)[number]>()
    for (const r of richBacklinks) m.set(`${r.sourceKind}:${r.sourceId}`, r)
    return m
  }, [richBacklinks])

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

  // ── CONNECTED: Outbound mention targets (async IDB) ──────────

  const [outboundMentionIds, setOutboundMentionIds] = useState<{
    noteIds: Set<string>
    wikiIds: Set<string>
  }>({ noteIds: new Set(), wikiIds: new Set() })

  // Inbound mention source ids (other notes that @-mention the current note).
  // O(1) lookup via the mention index — used by Discover to give a "mention"
  // bonus to notes that mention this one without a wikilink.
  const [inboundMentionSourceIds, setInboundMentionSourceIds] = useState<Set<string>>(
    () => new Set(),
  )

  const noteIdRef = useRef<string | null>(noteId)

  useEffect(() => {
    noteIdRef.current = noteId
    if (!noteId) {
      setOutboundMentionIds({ noteIds: new Set(), wikiIds: new Set() })
      setInboundMentionSourceIds(new Set())
      return
    }
    let cancelled = false
    getBody(noteId).then((body) => {
      if (cancelled || noteIdRef.current !== noteId) return
      if (!body?.contentJson) {
        setOutboundMentionIds({ noteIds: new Set(), wikiIds: new Set() })
        return
      }
      const { noteIds, wikiIds } = extractMentionTargets(body.contentJson)
      setOutboundMentionIds({ noteIds, wikiIds })
    })

    // Inbound mentions — uses the IDB mention index for O(1) lookup.
    void (async () => {
      await ensureMentionIndexBuilt(async () => {
        const bodies = await getAllBodies()
        return bodies.map((b) => ({ id: b.id, contentJson: b.contentJson }))
      }).catch(() => {})
      if (cancelled || noteIdRef.current !== noteId) return
      const sources = await getMentionSources(noteId)
      if (cancelled || noteIdRef.current !== noteId) return
      setInboundMentionSourceIds(new Set(sources))
    })()
    return () => { cancelled = true }
  }, [noteId])

  // ── CONNECTED: Outbound ────────────────────────────────

  // Notes & wiki this note links to via [[wikilinks]] + note-ref blocks + collections + @mentions
  const outboundLinked = useMemo(() => {
    if (!note) return [] as { id: string; title: string; isWiki: boolean }[]
    const seen = new Set<string>()
    const result: { id: string; title: string; isWiki: boolean }[] = []

    const titleToNote = new Map(notes.map((n) => [n.title.toLowerCase(), n]))
    const titleToWikiArticle = new Map(wikiArticles.map((a) => [a.title.toLowerCase(), a]))

    // 1. [[wikilinks]] — match against notes first, then wiki articles
    for (const title of note.linksOut ?? []) {
      const key = title.toLowerCase()

      // (a) note match
      const linkedNote = titleToNote.get(key)
      if (linkedNote && linkedNote.id !== noteId && !seen.has(linkedNote.id)) {
        seen.add(linkedNote.id)
        result.push({ id: linkedNote.id, title: linkedNote.title, isWiki: wikiArticleIds.has(linkedNote.id) })
      }

      // (b) wiki article match (independent — same title can exist in both spaces)
      const linkedWiki = titleToWikiArticle.get(key)
      if (linkedWiki && linkedWiki.id !== noteId && !seen.has(linkedWiki.id)) {
        seen.add(linkedWiki.id)
        result.push({ id: linkedWiki.id, title: linkedWiki.title, isWiki: true })
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

    // 4. @mention targets (note mentionType)
    for (const mentionedNoteId of outboundMentionIds.noteIds) {
      if (mentionedNoteId === noteId) continue
      if (seen.has(mentionedNoteId)) continue
      const mentionedNote = notes.find((n) => n.id === mentionedNoteId)
      if (!mentionedNote || mentionedNote.trashed) continue
      seen.add(mentionedNoteId)
      result.push({ id: mentionedNoteId, title: mentionedNote.title, isWiki: wikiArticleIds.has(mentionedNoteId) })
    }

    // 4b. @mention targets (wiki mentionType)
    for (const mentionedWikiId of outboundMentionIds.wikiIds) {
      if (mentionedWikiId === noteId) continue
      if (seen.has(mentionedWikiId)) continue
      const mentionedArticle = wikiArticles.find((a) => a.id === mentionedWikiId)
      if (!mentionedArticle) continue
      seen.add(mentionedWikiId)
      result.push({ id: mentionedWikiId, title: mentionedArticle.title, isWiki: true })
    }

    return result
  }, [note, notes, noteId, wikiArticles, wikiCollections, wikiArticleIds, outboundMentionIds])

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
          isWiki: n.noteType === "wiki" || wikiArticleIds.has(n.id),
          preview: n.preview,
          // Surface mentionTargets to Discover only for notes that mention
          // the *current* note. The engine uses this to award a "mention"
          // bonus for the inbound direction (other → current). For notes
          // that don't mention current, an empty mentionTargets is harmless.
          mentionTargets: inboundMentionSourceIds.has(n.id)
            ? ({ noteIds: noteId ? [noteId] : [], wikiIds: [] })
            : undefined,
        })),
    [notes, wikiArticleIds, inboundMentionSourceIds, noteId]
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
      noteMentionTargets: outboundMentionIds,
    })
  }, [note, allNotesInput, backlinksMap, tags, outboundMentionIds])

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

  const hierarchyCount = (parentNote ? 1 : 0) + childNotes.length

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hierarchy */}
      <ConnectionSection
        title="Hierarchy"
        icon={<GitBranch size={14} weight="regular" />}
        count={hierarchyCount}
        defaultOpen
      >
        {/* Parent */}
        <div className="space-y-0.5 mb-2">
          <div className="flex items-center gap-1 px-2 mb-1">
            <ArrowUp size={10} className="text-accent/70" />
            <SubLabel>Parent</SubLabel>
          </div>
          {parentNote ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5">
              <button
                onClick={() => openNote(parentNote.id)}
                className="flex-1 min-w-0 text-left text-note text-foreground hover:text-foreground truncate transition-colors duration-100"
              >
                {parentNote.title || "Untitled"}
              </button>
              <button
                onClick={() => setNoteParent(note.id, null)}
                title="Remove parent"
                className="shrink-0 text-muted-foreground hover:text-red-400 transition-colors duration-100 p-0.5 rounded"
              >
                <PhX size={12} weight="bold" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setParentPickerOpen(true)}
              className="flex items-center gap-1.5 text-note text-muted-foreground hover:text-foreground transition-colors duration-100 px-2 py-0.5"
            >
              <PhPlus size={12} weight="bold" />
              Set parent
            </button>
          )}
        </div>

        {/* Children */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 px-2 mb-1">
            <ArrowDown size={10} className="text-accent/70" />
            <SubLabel>Children</SubLabel>
          </div>
          {childNotes.map((child) => (
            <button
              key={child.id}
              onClick={() => openInSecondary(child.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-left text-note text-foreground hover:bg-hover-bg hover:text-foreground transition-colors duration-100"
            >
              <FileText size={12} className="shrink-0 text-muted-foreground" weight="regular" />
              <span className="truncate">{child.title || "Untitled"}</span>
            </button>
          ))}
          <button
            onClick={() => setAddChildOpen(true)}
            className="flex items-center gap-1.5 text-note text-muted-foreground hover:text-foreground transition-colors duration-100 px-2 py-0.5"
          >
            <PhPlus size={12} weight="bold" />
            Add child
          </button>
        </div>
      </ConnectionSection>

      {/* Note parent picker */}
      <NotePickerDialog
        open={parentPickerOpen}
        onOpenChange={setParentPickerOpen}
        title="Select parent note"
        excludeIds={parentPickerExcludeIds}
        onSelect={(selectedId) => {
          setNoteParent(note.id, selectedId)
          setParentPickerOpen(false)
        }}
      />

      {/* Note add-child picker (lazy mount) */}
      {addChildOpen && (
        <NotePickerDialog
          open={addChildOpen}
          onOpenChange={setAddChildOpen}
          title="Add children"
          excludeIds={childPickerExcludeIds}
          multiSelect={true}
          onSelectMulti={handleAddChildren}
        />
      )}

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
            {/* ← Notes (backlinks with block-level context) */}
            {backlinkNotes.length > 0 && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 px-2">
                  <DirArrow dir="in" />
                  <SubLabel>Notes</SubLabel>
                </div>
                <div className="space-y-px">
                  {backlinkNotes.map((n) => {
                    const rich = richBacklinksByKey.get(`note:${n.id}`)
                    return (
                      <BacklinkCard
                        key={n.id}
                        source={
                          rich ?? {
                            sourceId: n.id,
                            sourceKind: "note",
                            sourceTitle: n.title || "Untitled",
                            contexts: [],
                            loading: false,
                          }
                        }
                        mutual={linkedIds.has(n.id)}
                        onClick={() => openInSecondary(n.id)}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* ← Wiki (incoming wikilinks from wiki articles) */}
            {inboundWiki.length > 0 && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 px-2">
                  <DirArrow dir="in" />
                  <SubLabel>Wiki</SubLabel>
                </div>
                <div className="space-y-px">
                  {inboundWiki.map((a) => {
                    const rich = richBacklinksByKey.get(`wiki:${a.id}`)
                    return (
                      <BacklinkCard
                        key={a.id}
                        source={
                          rich ?? {
                            sourceId: a.id,
                            sourceKind: "wiki",
                            sourceTitle: a.title,
                            contexts: [],
                            loading: false,
                          }
                        }
                        mutual={linkedIds.has(a.id)}
                        onClick={() => openInSecondary(a.id)}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* → Notes */}
            {outboundNotes.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>→ Notes</SubLabel>
                {outboundNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openInSecondary(n.id)}
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
                    onClick={() => openInSecondary(w.id)}
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
                        onClick={() => openInSecondary(item.noteId)}
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
                        onClick={() => openInSecondary(item.noteId)}
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
