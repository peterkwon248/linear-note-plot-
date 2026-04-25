"use client"

import { useMemo } from "react"
import { useSidePanelEntity } from "./use-side-panel-entity"
import { usePlotStore } from "@/lib/store"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import { MapPin } from "@phosphor-icons/react/dist/ssr/MapPin"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr/TextAlignLeft"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { X } from "@phosphor-icons/react/dist/ssr/X"
import { extractAnchorsFromContentJson } from "@/lib/anchor-utils"
import type { GlobalBookmark } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Unified Bookmarks panel — shows ALL pinned bookmarks (note + wiki) in one list,
 * plus context-specific local sections.
 */
export function SidePanelBookmarks() {
  const entity = useSidePanelEntity()

  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const globalBookmarks = usePlotStore((s) => s.globalBookmarks)
  const pinBookmark = usePlotStore((s) => s.pinBookmark)
  const unpinBookmark = usePlotStore((s) => s.unpinBookmark)

  const notesById = useMemo(
    () => Object.fromEntries(notes.map((n) => [n.id, n])),
    [notes],
  )
  const articlesById = useMemo(
    () => Object.fromEntries(wikiArticles.map((a) => [a.id, a])),
    [wikiArticles],
  )

  // Sorted pinned bookmarks (newest first), unified across note + wiki
  const pinnedList = useMemo(() => {
    return Object.values(globalBookmarks as Record<string, GlobalBookmark>).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [globalBookmarks])

  const navigateToBookmark = (bm: GlobalBookmark) => {
    const kind = bm.targetKind ?? "note"
    if (kind === "wiki") {
      // Open wiki article + scroll
      const article = articlesById[bm.noteId]
      if (article) {
        usePlotStore.getState().setSidePanelContext({ type: "wiki", id: bm.noteId })
        // Trigger wiki navigation if available
        if (typeof window !== "undefined") {
          window.location.hash = `#wiki-block-${bm.anchorId}`
        }
      }
    } else {
      const openNote = (usePlotStore.getState() as any).openNote
      if (openNote) openNote(bm.noteId)
    }
    setTimeout(() => {
      const safe = (window as any).CSS?.escape ? CSS.escape(bm.anchorId) : bm.anchorId
      const el =
        document.querySelector(`[data-anchor-id="${safe}"]`) ||
        document.querySelector(`[id="${safe}"]`) ||
        document.querySelector(`[id="wiki-block-${safe}"]`) ||
        document.querySelector(`[data-id="${safe}"]`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 300)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── PINNED (unified, cross-entity) ─────────────── */}
      <div className="p-3 border-b border-border">
        <SectionHeader icon={PushPin} label="PINNED" count={pinnedList.length} />
        {pinnedList.length === 0 ? (
          <p className="text-2xs text-muted-foreground/50 italic px-1">
            No pinned bookmarks yet
          </p>
        ) : (
          <ul className="space-y-0.5">
            {pinnedList.map((bm) => {
              const kind = bm.targetKind ?? "note"
              const target = kind === "wiki" ? articlesById[bm.noteId] : notesById[bm.noteId]
              const isDeleted = !target || (target as any).trashed
              const targetTitle = target ? (kind === "wiki" ? (target as any).title : (target as any).title) : null
              return (
                <li
                  key={bm.id}
                  className="group flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-hover-bg transition-colors cursor-pointer"
                  onClick={() => !isDeleted && navigateToBookmark(bm)}
                >
                  {kind === "wiki" ? (
                    <BookOpen
                      size={12}
                      weight="fill"
                      className={cn(
                        "mt-0.5 flex-shrink-0",
                        isDeleted ? "text-muted-foreground/30" : "text-amber-400",
                      )}
                    />
                  ) : (
                    <MapPin
                      size={12}
                      weight="fill"
                      className={cn(
                        "mt-0.5 flex-shrink-0",
                        isDeleted ? "text-muted-foreground/30" : "text-accent",
                      )}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "text-note block truncate",
                        isDeleted ? "text-muted-foreground/40" : "text-foreground/80",
                      )}
                    >
                      {bm.label}
                      {isDeleted && (
                        <span className="ml-1 text-2xs text-muted-foreground/40">(deleted)</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-2xs text-muted-foreground/50">
                      <span
                        className={cn(
                          "uppercase tracking-wider font-semibold text-[9px]",
                          kind === "wiki" ? "text-amber-400/70" : "text-accent/70",
                        )}
                      >
                        {kind}
                      </span>
                      {!isDeleted && targetTitle && (
                        <>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="truncate">{targetTitle || "Untitled"}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-hover-bg transition-all flex-shrink-0"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      unpinBookmark(bm.id)
                    }}
                    title="Unpin"
                  >
                    <X size={11} weight="regular" className="text-muted-foreground/60" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ── Context-specific local sections ────────────── */}
      {entity.type === "note" && entity.note && (
        <NoteLocalAnchors
          note={entity.note}
          pinnedList={pinnedList}
          onPin={(anchorId, label, anchorType) =>
            pinBookmark(entity.note!.id, anchorId, label, anchorType, "note")
          }
          onUnpin={unpinBookmark}
        />
      )}

      {entity.type === "wiki" && entity.wikiArticle && (
        <WikiSectionsList article={entity.wikiArticle} />
      )}
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ElementType
  label: string
  count: number
}) {
  return (
    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
      <Icon size={13} weight="regular" />
      <span className="text-2xs font-semibold uppercase tracking-wider">{label}</span>
      <span className="text-2xs text-muted-foreground/50">{count}</span>
    </div>
  )
}

/* ── Note local anchors ───────────────────────── */

function NoteLocalAnchors({
  note,
  pinnedList,
  onPin,
  onUnpin,
}: {
  note: any
  pinnedList: GlobalBookmark[]
  onPin: (anchorId: string, label: string, anchorType: GlobalBookmark["anchorType"]) => void
  onUnpin: (bookmarkId: string) => void
}) {
  const localAnchors = useMemo(() => {
    if (!note?.contentJson) return []
    return extractAnchorsFromContentJson(note.contentJson)
  }, [note?.contentJson])

  const pinnedSet = useMemo(() => {
    const set = new Set<string>()
    for (const bm of pinnedList) {
      set.add(`${bm.noteId}:${bm.anchorId}`)
    }
    return set
  }, [pinnedList])

  const scrollToAnchor = (anchorId: string) => {
    const safe = (window as any).CSS?.escape ? CSS.escape(anchorId) : anchorId
    const el =
      document.querySelector(`[data-anchor-id="${safe}"]`) ||
      document.querySelector(`[id="${safe}"]`) ||
      document.querySelector(`[data-id="${safe}"]`)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  if (localAnchors.length === 0) {
    return null
  }

  return (
    <div className="p-3">
      <SectionHeader icon={BookmarkSimple} label="ANCHORS IN NOTE" count={localAnchors.length} />
      <ul className="space-y-0.5">
        {localAnchors.map((anchor) => {
          const key = `${note.id}:${anchor.id}`
          const isPinned = pinnedSet.has(key)
          return (
            <li
              key={anchor.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-hover-bg transition-colors cursor-pointer"
              onClick={() => scrollToAnchor(anchor.id)}
            >
              {anchor.type === "heading" ? (
                <TextAlignLeft size={11} weight="regular" className="text-muted-foreground/50 shrink-0" />
              ) : (
                <MapPin size={11} weight="regular" className="text-muted-foreground/50 shrink-0" />
              )}
              <span className="flex-1 truncate text-note text-foreground/80">{anchor.label}</span>
              <button
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-hover-bg transition-all"
                onClick={(ev) => {
                  ev.stopPropagation()
                  if (isPinned) {
                    const existing = pinnedList.find((b) => b.noteId === note.id && b.anchorId === anchor.id)
                    if (existing) onUnpin(existing.id)
                  } else {
                    onPin(anchor.id, anchor.label, anchor.type)
                  }
                }}
                title={isPinned ? "Unpin" : "Pin bookmark"}
              >
                <PushPin
                  size={12}
                  weight={isPinned ? "fill" : "regular"}
                  className={isPinned ? "text-accent" : "text-muted-foreground/60"}
                />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ── Wiki sections (auto outline) ────────────── */

function WikiSectionsList({ article }: { article: any }) {
  const sections = useMemo(() => {
    if (!article?.blocks) return []
    return article.blocks
      .filter((b: any) => b.type === "section")
      .map((b: any, idx: number) => ({
        id: b.id,
        title: b.title ?? "Untitled section",
        level: b.level ?? 2,
        index: idx + 1,
      }))
  }, [article])

  if (sections.length === 0) return null

  return (
    <div className="p-3">
      <SectionHeader icon={TextAlignLeft} label="SECTIONS" count={sections.length} />
      <ul className="space-y-0.5">
        {sections.map((s: any) => (
          <li
            key={s.id}
            onClick={() => {
              const el = document.getElementById(`wiki-block-${s.id}`)
              el?.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-hover-bg transition-colors cursor-pointer"
            style={{ paddingLeft: `${8 + (s.level - 2) * 12}px` }}
          >
            <span className="shrink-0 text-2xs font-mono text-muted-foreground/50 w-5 text-right">
              {s.index}.
            </span>
            <span className="text-note text-foreground/80 flex-1 truncate">{s.title}</span>
            <span className="text-2xs text-muted-foreground/40">H{s.level}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
