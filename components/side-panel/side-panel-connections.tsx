"use client"

import { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { formatDistanceToNow } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { resolveBookItems } from "@/lib/books/resolver"
import { isWikiStub } from "@/lib/wiki-utils"
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

// ── Status mini-stat breakdown ───────────────────────────
// PRD entity-side-panel-uniformity PR 3: surface kind & status breakdown
// inline beneath SubLabel headers, mirroring the Book Connections pattern.
// Inline dot-count format keeps the visual weight low (one row, no grid).

import type { NoteStatus } from "@/lib/types"
import type { WikiArticle as WikiArticleType } from "@/lib/types"

function NoteStatusBreakdown({
  notes,
}: {
  notes: { status?: NoteStatus | null }[]
}) {
  const counts = useMemo(() => {
    let stone = 0,
      brick = 0,
      keystone = 0
    for (const n of notes) {
      const s = (n.status ?? "stone") as NoteStatus
      if (s === "stone") stone++
      else if (s === "brick") brick++
      else if (s === "keystone") keystone++
    }
    return { stone, brick, keystone }
  }, [notes])
  const total = counts.stone + counts.brick + counts.keystone
  if (total === 0) return null
  return (
    <div className="flex items-center gap-2.5 px-2 pb-1 text-2xs text-muted-foreground/70">
      {counts.stone > 0 && <DotCount color="var(--status-stone)" label="Stone" count={counts.stone} />}
      {counts.brick > 0 && <DotCount color="var(--status-brick)" label="Brick" count={counts.brick} />}
      {counts.keystone > 0 && <DotCount color="var(--status-keystone)" label="Block" count={counts.keystone} />}
    </div>
  )
}

function WikiStatusBreakdown({ articles }: { articles: WikiArticleType[] }) {
  const counts = useMemo(() => {
    let stub = 0,
      article = 0
    for (const a of articles) {
      if (isWikiStub(a)) stub++
      else article++
    }
    return { stub, article }
  }, [articles])
  const total = counts.stub + counts.article
  if (total === 0) return null
  return (
    <div className="flex items-center gap-2.5 px-2 pb-1 text-2xs text-muted-foreground/70">
      {counts.stub > 0 && <DotCount color="var(--muted-foreground)" label="Stub" count={counts.stub} />}
      {counts.article > 0 && <DotCount color="var(--chart-1)" label="Article" count={counts.article} />}
    </div>
  )
}

function DotCount({
  color,
  label,
  count,
}: {
  color: string
  label: string
  count: number
}) {
  return (
    <span className="inline-flex items-center gap-1" title={`${label} ${count}`}>
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="tabular-nums">{count}</span>
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
                <WikiStatusBreakdown articles={referencedBy} />
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
                <NoteStatusBreakdown notes={linkingNotes} />
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
  // Check sidePanelContext for wiki / template / book / library entity branch
  const sidePanelContext = usePlotStore((s) => s.sidePanelContext)

  if (sidePanelContext?.type === "wiki") {
    return <WikiArticleConnections />
  }

  if (sidePanelContext?.type === "template") {
    return <TemplateConnections />
  }

  if (sidePanelContext?.type === "book") {
    return <BookConnections />
  }

  // Library entities (Tag / Sticker / File / Reference) — entity-specific
  // cross-entity charts. BookConnections "Items by kind & status" 패턴
  // 정합 — Notes/Wikis status breakdown + cross-entity counts.
  if (sidePanelContext?.type === "tag") {
    return <TagConnections />
  }
  if (sidePanelContext?.type === "sticker") {
    return <StickerConnections />
  }
  if (sidePanelContext?.type === "file") {
    return <FileConnections />
  }
  if (sidePanelContext?.type === "reference") {
    return <ReferenceConnections />
  }
  if (sidePanelContext?.type === "label") {
    return <LabelConnections />
  }

  return <NoteConnections />
}

// ── Label Connections ─────────────────────────────────────
// "Labeled notes by status" — TagConnections 패턴 정합. Label은 1:N
// (Note.labelId는 단일 id) — Tag와 다른 점은 한 노트에 하나 라벨만.

function LabelConnections() {
  const entity = useSidePanelEntity()
  const label = entity.type === "label" ? entity.label : null
  const notes = usePlotStore((s) => s.notes)
  const openInSecondary = usePlotStore((s) => s.openInSecondary)

  const labeled = useMemo(() => {
    if (!label) return { byStatus: { stone: 0, brick: 0, keystone: 0 } as Record<string, number>, all: [] as typeof notes }
    const matching = notes.filter((n) => !n.trashed && n.labelId === label.id)
    const byStatus = { stone: 0, brick: 0, keystone: 0 } as Record<string, number>
    for (const n of matching) {
      const s = (n.status ?? "stone") as string
      byStatus[s] = (byStatus[s] ?? 0) + 1
    }
    return { byStatus, all: matching }
  }, [label, notes])

  if (!label) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">Select a label to see connections</p>
      </div>
    )
  }

  const total = labeled.all.length

  return (
    <div className="flex-1 overflow-y-auto">
      <ConnectionSection
        title="Labeled notes"
        icon={<LinkSimple size={14} weight="regular" />}
        count={total}
        defaultOpen
      >
        {total === 0 ? (
          <p className="text-note text-muted-foreground px-2">
            No notes carry this label yet
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-0.5">
              <KindHeader label="By status" count={total} />
              <StatusRow label="Stone" count={labeled.byStatus.stone} colorVar="var(--status-stone)" />
              <StatusRow label="Brick" count={labeled.byStatus.brick} colorVar="var(--status-brick)" />
              <StatusRow label="Block" count={labeled.byStatus.keystone} colorVar="var(--status-keystone)" />
            </div>
            <div className="space-y-0.5">
              <SubLabel>Recent</SubLabel>
              {labeled.all.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  onClick={() => openInSecondary(n.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
                >
                  <FileText size={12} className="shrink-0 text-muted-foreground" weight="regular" />
                  <span className="truncate flex-1">{n.title || "Untitled"}</span>
                </button>
              ))}
              {labeled.all.length > 8 && (
                <p className="px-2 py-1 text-2xs text-muted-foreground/70 italic">
                  +{labeled.all.length - 8} more (see Detail tab for full list)
                </p>
              )}
            </div>
          </div>
        )}
      </ConnectionSection>
    </div>
  )
}

// ── Tag Connections ─────────────────────────────────────
// "Tagged items by kind & status" — BookConnections 패턴 정합. 이 tag를
// 가진 notes의 status breakdown + 통계.

function TagConnections() {
  const entity = useSidePanelEntity()
  const tag = entity.type === "tag" ? entity.tag : null
  const notes = usePlotStore((s) => s.notes)
  const openInSecondary = usePlotStore((s) => s.openInSecondary)

  const tagged = useMemo(() => {
    if (!tag) return { byStatus: { stone: 0, brick: 0, keystone: 0 } as Record<string, number>, all: [] as typeof notes }
    const matching = notes.filter((n) => !n.trashed && n.tags.includes(tag.id))
    const byStatus = { stone: 0, brick: 0, keystone: 0 } as Record<string, number>
    for (const n of matching) {
      const s = (n.status ?? "stone") as string
      byStatus[s] = (byStatus[s] ?? 0) + 1
    }
    return { byStatus, all: matching }
  }, [tag, notes])

  if (!tag) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">Select a tag to see connections</p>
      </div>
    )
  }

  const total = tagged.all.length

  return (
    <div className="flex-1 overflow-y-auto">
      <ConnectionSection
        title="Tagged notes"
        icon={<LinkSimple size={14} weight="regular" />}
        count={total}
        defaultOpen
      >
        {total === 0 ? (
          <p className="text-note text-muted-foreground px-2">
            No notes carry this tag yet
          </p>
        ) : (
          <div className="space-y-3">
            {/* Status breakdown */}
            <div className="space-y-0.5">
              <KindHeader label="By status" count={total} />
              <StatusRow label="Stone" count={tagged.byStatus.stone} colorVar="var(--status-stone)" />
              <StatusRow label="Brick" count={tagged.byStatus.brick} colorVar="var(--status-brick)" />
              <StatusRow label="Block" count={tagged.byStatus.keystone} colorVar="var(--status-keystone)" />
            </div>
            {/* Recent notes list */}
            <div className="space-y-0.5">
              <SubLabel>Recent</SubLabel>
              {tagged.all.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  onClick={() => openInSecondary(n.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
                >
                  <FileText size={12} className="shrink-0 text-muted-foreground" weight="regular" />
                  <span className="truncate flex-1">{n.title || "Untitled"}</span>
                </button>
              ))}
              {tagged.all.length > 8 && (
                <p className="px-2 py-1 text-2xs text-muted-foreground/70 italic">
                  +{tagged.all.length - 8} more (see Detail tab for full list)
                </p>
              )}
            </div>
          </div>
        )}
      </ConnectionSection>
    </div>
  )
}

// ── Sticker Connections ─────────────────────────────────────
// "Members by kind & status" — cross-entity (note/wiki) breakdown. members
// 7 kinds 중 note/wiki만 status 분류 가능. 나머지 kinds는 count만.

function StickerConnections() {
  const entity = useSidePanelEntity()
  const sticker = entity.type === "sticker" ? entity.sticker : null
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const openInSecondary = usePlotStore((s) => s.openInSecondary)

  const breakdown = useMemo(() => {
    const result = {
      noteStatus: { stone: 0, brick: 0, keystone: 0 } as Record<string, number>,
      wikiStatus: { stub: 0, article: 0 },
      otherCounts: { tag: 0, label: 0, category: 0, file: 0, reference: 0 } as Record<string, number>,
      noteRefs: [] as { id: string; title: string }[],
    }
    if (!sticker) return result
    for (const m of sticker.members ?? []) {
      if (m.kind === "note") {
        const n = notes.find((x) => x.id === m.id)
        if (!n || n.trashed) continue
        result.noteStatus[(n.status ?? "stone")] = (result.noteStatus[(n.status ?? "stone")] ?? 0) + 1
        result.noteRefs.push({ id: n.id, title: n.title || "Untitled" })
      } else if (m.kind === "wiki") {
        const a = wikiArticles.find((x) => x.id === m.id)
        if (!a || a.trashed) continue
        if (isWikiStub(a)) result.wikiStatus.stub++
        else result.wikiStatus.article++
      } else if (m.kind in result.otherCounts) {
        result.otherCounts[m.kind] = (result.otherCounts[m.kind] ?? 0) + 1
      }
    }
    return result
  }, [sticker, notes, wikiArticles])

  if (!sticker) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">Select a sticker to see connections</p>
      </div>
    )
  }

  const totalNotes = breakdown.noteStatus.stone + breakdown.noteStatus.brick + breakdown.noteStatus.keystone
  const totalWikis = breakdown.wikiStatus.stub + breakdown.wikiStatus.article
  const totalOther = Object.values(breakdown.otherCounts).reduce((a, b) => a + b, 0)
  const total = totalNotes + totalWikis + totalOther

  return (
    <div className="flex-1 overflow-y-auto">
      <ConnectionSection
        title="Members by kind & status"
        icon={<LinkSimple size={14} weight="regular" />}
        count={total}
        defaultOpen
      >
        {total === 0 ? (
          <p className="text-note text-muted-foreground px-2">No members yet</p>
        ) : (
          <div className="space-y-3">
            {totalNotes > 0 && (
              <div className="space-y-0.5">
                <KindHeader label="Notes" count={totalNotes} />
                <StatusRow label="Stone" count={breakdown.noteStatus.stone} colorVar="var(--status-stone)" />
                <StatusRow label="Brick" count={breakdown.noteStatus.brick} colorVar="var(--status-brick)" />
                <StatusRow label="Block" count={breakdown.noteStatus.keystone} colorVar="var(--status-keystone)" />
              </div>
            )}
            {totalWikis > 0 && (
              <div className="space-y-0.5">
                <KindHeader label="Wikis" count={totalWikis} />
                <StatusRow label="Stub" count={breakdown.wikiStatus.stub} colorVar="var(--muted-foreground)" />
                <StatusRow label="Article" count={breakdown.wikiStatus.article} colorVar="var(--chart-1)" />
              </div>
            )}
            {(["tag", "label", "category", "file", "reference"] as const).map((k) => {
              const c = breakdown.otherCounts[k]
              if (!c) return null
              return (
                <div key={k} className="space-y-0.5">
                  <KindHeader label={`${k.charAt(0).toUpperCase()}${k.slice(1)}s`} count={c} />
                </div>
              )
            })}
            {breakdown.noteRefs.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Recent notes</SubLabel>
                {breakdown.noteRefs.slice(0, 6).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openInSecondary(n.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
                  >
                    <FileText size={12} className="shrink-0 text-muted-foreground" weight="regular" />
                    <span className="truncate flex-1">{n.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </ConnectionSection>
    </div>
  )
}

// ── File Connections ─────────────────────────────────────
// Source note (1:1) + Used-in wiki articles (cross-reference via wiki
// blocks[type="image", attachmentId]). File Detail에 같은 정보가 있지만
// Connections는 cross-entity graph 시각 — 명시적 source/used-in 분리.

function FileConnections() {
  const entity = useSidePanelEntity()
  const attachment = entity.type === "file" ? entity.attachment : null
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const openInSecondary = usePlotStore((s) => s.openInSecondary)

  const sourceNote = useMemo(
    () => (attachment ? notes.find((n) => n.id === attachment.noteId) ?? null : null),
    [attachment, notes],
  )

  const usedInWikis = useMemo(() => {
    if (!attachment) return [] as typeof wikiArticles
    return wikiArticles.filter((a) =>
      (a.blocks ?? []).some(
        (b: { type: string; attachmentId?: string }) =>
          b.type === "image" && b.attachmentId === attachment.id,
      ),
    )
  }, [attachment, wikiArticles])

  if (!attachment) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">Select a file to see connections</p>
      </div>
    )
  }

  const total = (sourceNote ? 1 : 0) + usedInWikis.length

  return (
    <div className="flex-1 overflow-y-auto">
      <ConnectionSection
        title="Cross-entity"
        icon={<LinkSimple size={14} weight="regular" />}
        count={total}
        defaultOpen
      >
        {total === 0 ? (
          <p className="text-note text-muted-foreground px-2">
            File is not referenced anywhere
          </p>
        ) : (
          <div className="space-y-3">
            {sourceNote && (
              <div className="space-y-0.5">
                <SubLabel>Source note</SubLabel>
                <button
                  onClick={() => openInSecondary(sourceNote.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
                >
                  <FileText size={12} className="shrink-0 text-muted-foreground" weight="regular" />
                  <span className="truncate flex-1">{sourceNote.title || "Untitled"}</span>
                </button>
              </div>
            )}
            {usedInWikis.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Used in wikis</SubLabel>
                {usedInWikis.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openInSecondary(a.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
                  >
                    <IconWiki size={12} className="shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1">{a.title || "Untitled"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </ConnectionSection>
    </div>
  )
}

// ── Reference Connections ─────────────────────────────────────
// Citing notes / wikis — Note.referenceIds + WikiArticle.referenceIds
// reverse lookup. Reference Detail은 이미 자체 정보 표시; Connections는
// 이 reference를 인용하는 entities 명시.

function ReferenceConnections() {
  const sidePanelContext = usePlotStore((s) => s.sidePanelContext)
  const referenceId = sidePanelContext?.type === "reference" ? sidePanelContext.id : null
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const references = usePlotStore((s) => s.references)
  const openInSecondary = usePlotStore((s) => s.openInSecondary)

  const reference = referenceId ? (references as Record<string, { id: string; title: string }>)[referenceId] : null

  const citingNotes = useMemo(() => {
    if (!referenceId) return [] as typeof notes
    return notes.filter(
      (n) => !n.trashed && (n.referenceIds ?? []).includes(referenceId),
    )
  }, [referenceId, notes])

  const citingWikis = useMemo(() => {
    if (!referenceId) return [] as typeof wikiArticles
    return wikiArticles.filter(
      (a) => !a.trashed && (a.referenceIds ?? []).includes(referenceId),
    )
  }, [referenceId, wikiArticles])

  if (!reference) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">Select a reference to see connections</p>
      </div>
    )
  }

  const total = citingNotes.length + citingWikis.length

  return (
    <div className="flex-1 overflow-y-auto">
      <ConnectionSection
        title="Cited by"
        icon={<LinkSimple size={14} weight="regular" />}
        count={total}
        defaultOpen
      >
        {total === 0 ? (
          <p className="text-note text-muted-foreground px-2">
            No notes or wikis cite this reference yet
          </p>
        ) : (
          <div className="space-y-3">
            {citingNotes.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Notes</SubLabel>
                {citingNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openInSecondary(n.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
                  >
                    <FileText size={12} className="shrink-0 text-muted-foreground" weight="regular" />
                    <span className="truncate flex-1">{n.title || "Untitled"}</span>
                  </button>
                ))}
              </div>
            )}
            {citingWikis.length > 0 && (
              <div className="space-y-0.5">
                <SubLabel>Wikis</SubLabel>
                {citingWikis.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openInSecondary(a.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
                  >
                    <IconWiki size={12} className="shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1">{a.title || "Untitled"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </ConnectionSection>
    </div>
  )
}

// ── Book Connections ─────────────────────────────────────
// "Items by kind & status" — the primary connection surface for a book.
// Notes are grouped by NoteStatus (Stone/Brick/Block); wiki articles by
// Stub vs Article (computed via `isWikiStub`); chapters split out as
// their own count. Smart sources (Smart/Hybrid kind) show beneath as a
// derived list — the resolver already feeds the count, this just maps
// it back to the source-kind labels for context.

function BookConnections() {
  const entity = useSidePanelEntity()
  const book = entity.type === "book" ? entity.book : null
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const stickers = usePlotStore((s) => s.stickers)
  const openInSecondary = usePlotStore((s) => s.openInSecondary)

  const resolved = useMemo(() => {
    if (!book) return [] as ResolvedBookItemLite[]
    return resolveBookItems(book, {
      notes,
      folders,
      wikiArticles,
      wikiCategories,
      tags,
      labels,
      stickers,
    })
  }, [book, notes, folders, wikiArticles, wikiCategories, tags, labels, stickers])

  // Group by kind → status. For notes, status is from Note.status; for
  // wikis we derive Stub vs Article via `isWikiStub`. Resolver items
  // already filter trashed entities, so the counts are accurate.
  const breakdown = useMemo(() => {
    const noteStatus = { stone: 0, brick: 0, keystone: 0 } as Record<string, number>
    const wikiStatus = { stub: 0, article: 0 }
    let chaptersCount = 0
    const noteIds: string[] = []
    const wikiIds: string[] = []
    for (const r of resolved) {
      if (r.kind === "note") {
        const n = notes.find((x) => x.id === r.refId)
        if (!n) continue
        noteIds.push(n.id)
        const s = n.status ?? "stone"
        noteStatus[s] = (noteStatus[s] ?? 0) + 1
      } else if (r.kind === "wiki") {
        const a = wikiArticles.find((x) => x.id === r.refId)
        if (!a) continue
        wikiIds.push(a.id)
        if (isWikiStub(a)) wikiStatus.stub++
        else wikiStatus.article++
      } else if (r.kind === "chapter-heading") {
        chaptersCount++
      }
    }
    return { noteStatus, wikiStatus, chaptersCount, noteIds, wikiIds }
  }, [resolved, notes, wikiArticles])

  const smartSources = useMemo(() => {
    if (!book?.smartSources) return []
    return book.smartSources.map((s) => {
      let label = ""
      switch (s.kind) {
        case "folder":
          label = folders.find((x) => x.id === s.refId)?.name ?? "(removed folder)"
          break
        case "category":
          label = wikiCategories.find((x) => x.id === s.refId)?.name ?? "(removed category)"
          break
        case "tag":
          label = tags.find((x) => x.id === s.refId)?.name ?? "(removed tag)"
          break
        case "label":
          label = labels.find((x) => x.id === s.refId)?.name ?? "(removed label)"
          break
        case "sticker":
          label = stickers.find((x) => x.id === s.refId)?.name ?? "(removed sticker)"
          break
      }
      return { kind: s.kind, refId: s.refId, label }
    })
  }, [book?.smartSources, folders, wikiCategories, tags, labels, stickers])

  if (!book) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">
          Select a book to see connections
        </p>
      </div>
    )
  }

  const totalNotes = breakdown.noteStatus.stone + breakdown.noteStatus.brick + breakdown.noteStatus.keystone
  const totalWikis = breakdown.wikiStatus.stub + breakdown.wikiStatus.article
  const itemsCount = totalNotes + totalWikis + breakdown.chaptersCount

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Items by kind & status */}
      <ConnectionSection
        title="Items"
        icon={<LinkSimple size={14} weight="regular" />}
        count={itemsCount}
        defaultOpen
      >
        {itemsCount === 0 ? (
          <p className="text-note text-muted-foreground px-2">
            No items in this book yet
          </p>
        ) : (
          <div className="space-y-3">
            {/* Notes by status */}
            {totalNotes > 0 && (
              <div className="space-y-0.5">
                <KindHeader label="Notes" count={totalNotes} />
                <StatusRow label="Stone" count={breakdown.noteStatus.stone} colorVar="var(--status-stone)" />
                <StatusRow label="Brick" count={breakdown.noteStatus.brick} colorVar="var(--status-brick)" />
                <StatusRow label="Block" count={breakdown.noteStatus.keystone} colorVar="var(--status-keystone)" />
              </div>
            )}
            {/* Wikis by stub/article */}
            {totalWikis > 0 && (
              <div className="space-y-0.5">
                <KindHeader label="Wikis" count={totalWikis} />
                <StatusRow label="Stub" count={breakdown.wikiStatus.stub} colorVar="var(--muted-foreground)" />
                <StatusRow label="Article" count={breakdown.wikiStatus.article} colorVar="var(--chart-1)" />
              </div>
            )}
            {/* Chapters */}
            {breakdown.chaptersCount > 0 && (
              <div className="space-y-0.5">
                <KindHeader label="Chapters" count={breakdown.chaptersCount} />
              </div>
            )}
          </div>
        )}
      </ConnectionSection>

      {/* Smart Sources (Smart/Hybrid only) */}
      {smartSources.length > 0 && (
        <ConnectionSection
          title="Smart sources"
          icon={<Compass size={14} weight="regular" />}
          count={smartSources.length}
          defaultOpen={false}
        >
          <div className="space-y-0.5">
            {smartSources.map((s, i) => (
              <div
                key={`${s.kind}-${s.refId}-${i}`}
                className="flex items-center gap-2 px-2 py-0.5 text-note text-muted-foreground"
              >
                <span className="uppercase tracking-wider text-[9px] text-muted-foreground/60 w-14 shrink-0">
                  {s.kind}
                </span>
                <span className="truncate flex-1 text-foreground/80">{s.label}</span>
              </div>
            ))}
          </div>
        </ConnectionSection>
      )}
    </div>
  )
}

// Lite type alias to keep BookConnections decoupled from resolver's full
// ResolvedBookItem (we only need kind/refId/source here).
type ResolvedBookItemLite = { kind: string; refId?: string; source?: string }

function KindHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-1 px-2 mb-0.5">
      <SubLabel>{label}</SubLabel>
      <span className="text-2xs text-muted-foreground/70 tabular-nums">{count}</span>
    </div>
  )
}

function StatusRow({
  label,
  count,
  colorVar,
}: {
  label: string
  count: number
  colorVar: string
}) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-2 px-3 py-0.5 text-note">
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: colorVar }}
      />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto text-2xs text-muted-foreground/70 tabular-nums">
        {count}
      </span>
    </div>
  )
}

// ── Template Connections ─────────────────────────────────
// Templates have no wikilinks / backlinks / hierarchy, so the only
// meaningful connection surface is "Used by N notes" — notes that were
// created from this template. Derived from the entityEvents log (PR 5 —
// `created` event for entity.kind="note" with `meta.templateId`).

function TemplateConnections() {
  const entity = useSidePanelEntity()
  const template = entity.type === "template" ? entity.template : null
  const notes = usePlotStore((s) => s.notes)
  const entityEvents = usePlotStore((s) => s.entityEvents)
  const openInSecondary = usePlotStore((s) => s.openInSecondary)

  const usedByNotes = useMemo(() => {
    if (!template) return []
    const notesById = new Map(notes.map((n) => [n.id, n]))
    const seen = new Set<string>()
    const list: { id: string; title: string; at: string; status: NoteStatus | null }[] = []
    for (const e of entityEvents) {
      if (e.type !== "created") continue
      if (e.entity.kind !== "note") continue
      if ((e.meta as { templateId?: string } | undefined)?.templateId !== template.id) continue
      if (seen.has(e.entity.id)) continue
      const note = notesById.get(e.entity.id)
      if (!note || note.trashed) continue
      seen.add(e.entity.id)
      list.push({
        id: e.entity.id,
        title: note.title || "Untitled",
        at: e.at,
        status: note.status ?? null,
      })
    }
    list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    return list
  }, [template, notes, entityEvents])

  if (!template) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-note text-muted-foreground">
          Select a template to see connections
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ConnectionSection
        title="Used by"
        icon={<FileText size={14} weight="regular" />}
        count={usedByNotes.length}
        defaultOpen
      >
        {usedByNotes.length === 0 ? (
          <p className="text-note text-muted-foreground px-2">
            No notes use this template yet
          </p>
        ) : (
          <div className="space-y-0.5">
            <NoteStatusBreakdown notes={usedByNotes} />
            {usedByNotes.map((n) => (
              <button
                key={n.id}
                onClick={() => openInSecondary(n.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-left text-note text-foreground hover:bg-hover-bg transition-colors"
              >
                <FileText size={12} className="shrink-0 text-muted-foreground" weight="regular" />
                <span className="truncate flex-1">{n.title}</span>
                <span className="text-2xs text-muted-foreground/70 shrink-0">
                  {formatDistanceToNow(new Date(n.at), { addSuffix: true })}
                </span>
              </button>
            ))}
          </div>
        )}
      </ConnectionSection>
    </div>
  )
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
          folderIds: n.folderIds,
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
      noteFolderIds: note.folderIds,
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
                <NoteStatusBreakdown notes={backlinkNotes} />
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
                <NoteStatusBreakdown
                  notes={outboundNotes.map((n) => ({
                    status: notes.find((nn) => nn.id === n.id)?.status ?? null,
                  }))}
                />
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
                    <span className="text-2xs text-muted-foreground/70">
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
                      <span className="text-2xs text-muted-foreground/70 shrink-0 tabular-nums">
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
                      <span className="text-2xs text-muted-foreground/70 shrink-0 tabular-nums">
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
