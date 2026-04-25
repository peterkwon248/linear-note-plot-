"use client"

import { useMemo } from "react"
import { useSidePanelEntity } from "./use-side-panel-entity"
import { usePlotStore } from "@/lib/store"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import { MapPin } from "@phosphor-icons/react/dist/ssr/MapPin"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr/TextAlignLeft"
import { X } from "@phosphor-icons/react/dist/ssr/X"
import { extractAnchorsFromContentJson } from "@/lib/anchor-utils"
import type { GlobalBookmark } from "@/lib/types"

export function SidePanelBookmarks() {
  const entity = useSidePanelEntity()

  if (entity.type === "wiki") {
    return <WikiBookmarks />
  }

  return <NoteBookmarks />
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

function NoteBookmarks() {
  const entity = useSidePanelEntity()
  const note = entity.type === "note" ? entity.note : null

  const notesArr = usePlotStore((s) => s.notes)
  const notesById = useMemo(
    () => Object.fromEntries(notesArr.map((n) => [n.id, n])),
    [notesArr]
  )
  const globalBookmarks = usePlotStore((s) => s.globalBookmarks)
  const pinBookmark = usePlotStore((s) => s.pinBookmark)
  const unpinBookmark = usePlotStore((s) => s.unpinBookmark)

  // Sorted pinned bookmarks, newest first
  const pinnedList = useMemo(() => {
    return Object.values(globalBookmarks as Record<string, GlobalBookmark>).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [globalBookmarks])

  // Local anchors from current note
  const localAnchors = useMemo(() => {
    if (!note?.contentJson) return []
    return extractAnchorsFromContentJson(note.contentJson)
  }, [note?.contentJson])

  // Build a set of "noteId:anchorId" for quick pinned lookup
  const pinnedSet = useMemo(() => {
    const set = new Set<string>()
    for (const bm of pinnedList) {
      set.add(`${bm.noteId}:${bm.anchorId}`)
    }
    return set
  }, [pinnedList])

  const scrollToAnchor = (anchorId: string) => {
    const safe = (window as any).CSS?.escape ? CSS.escape(anchorId) : anchorId
    // Try anchor mark/divider first, then heading id, then block UniqueID (for "block" anchorType)
    const el =
      document.querySelector(`[data-anchor-id="${safe}"]`) ||
      document.querySelector(`[id="${safe}"]`) ||
      document.querySelector(`[data-id="${safe}"]`)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const handlePinClick = (anchorId: string, label: string, anchorType: GlobalBookmark["anchorType"]) => {
    if (!note) return
    const key = `${note.id}:${anchorId}`
    if (pinnedSet.has(key)) {
      // Unpin — find the bookmark id
      const existing = pinnedList.find((b) => b.noteId === note.id && b.anchorId === anchorId)
      if (existing) unpinBookmark(existing.id)
    } else {
      pinBookmark(note.id, anchorId, label, anchorType)
    }
  }

  if (!note) {
    return (
      <div className="p-4 text-muted-foreground text-note">No note selected</div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── PINNED BOOKMARKS (global) ────────────────────── */}
      <div className="p-3 border-b border-border">
        <SectionHeader icon={PushPin} label="PINNED" count={pinnedList.length} />

        {pinnedList.length === 0 ? (
          <p className="text-2xs text-muted-foreground/50 italic px-1">
            No pinned bookmarks yet
          </p>
        ) : (
          <ul className="space-y-0.5">
            {pinnedList.map((bm) => {
              const bmNote = notesById[bm.noteId]
              const isDeleted = !bmNote || (bmNote as any).trashed
              return (
                <li
                  key={bm.id}
                  className="group flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-hover-bg transition-colors cursor-pointer"
                  onClick={() => {
                    if (isDeleted) return
                    usePlotStore.getState().openNote(bm.noteId)
                    setTimeout(() => scrollToAnchor(bm.anchorId), 300)
                  }}
                >
                  <MapPin
                    size={12}
                    weight="fill"
                    className={`mt-0.5 flex-shrink-0 ${isDeleted ? "text-muted-foreground/30" : "text-accent"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-note block truncate ${
                        isDeleted ? "text-muted-foreground/40" : "text-foreground/80"
                      }`}
                    >
                      {bm.label}
                      {isDeleted && (
                        <span className="ml-1 text-2xs text-muted-foreground/40">(deleted)</span>
                      )}
                    </span>
                    {!isDeleted && bmNote && (
                      <span className="text-2xs text-muted-foreground/50 block truncate">
                        {bmNote.title || "Untitled"}
                      </span>
                    )}
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

      {/* ── THIS NOTE (local) ───────────────────────────── */}
      <div className="p-3">
        <SectionHeader icon={BookmarkSimple} label="THIS NOTE" count={localAnchors.length} />

        {localAnchors.length === 0 ? (
          <p className="text-2xs text-muted-foreground/50 italic px-1">
            No bookmarks. Use{" "}
            <kbd className="text-2xs bg-secondary px-1 rounded">/bookmark</kbd> to add one.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {localAnchors.map((anchor) => {
              const isPinned = pinnedSet.has(`${note.id}:${anchor.id}`)
              return (
                <li
                  key={anchor.id}
                  className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-hover-bg transition-colors cursor-pointer"
                  onClick={() => scrollToAnchor(anchor.id)}
                >
                  <MapPin
                    size={12}
                    weight="fill"
                    className="text-muted-foreground/50 flex-shrink-0"
                  />
                  <span className="text-note text-foreground/80 flex-1 truncate">{anchor.label}</span>
                  <span className="text-2xs text-muted-foreground/40">
                    {anchor.type === "divider" ? "divider" : anchor.type === "heading" ? "heading" : "inline"}
                  </span>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-hover-bg transition-all flex-shrink-0"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      handlePinClick(anchor.id, anchor.label, anchor.type)
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
        )}
      </div>
    </div>
  )
}

function WikiBookmarks() {
  const entity = useSidePanelEntity()
  const article = entity.type === "wiki" ? entity.wikiArticle : null

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

  if (!article) {
    return (
      <div className="p-4 text-muted-foreground text-note">No wiki article selected</div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        <TextAlignLeft size={14} weight="regular" />
        <span className="text-2xs font-semibold uppercase tracking-wider">Sections</span>
        <span className="text-2xs text-muted-foreground/50">{sections.length}</span>
      </div>

      {sections.length === 0 ? (
        <p className="text-2xs text-muted-foreground/50 italic px-1">
          No sections in this article.
        </p>
      ) : (
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
              <span className="text-2xs text-muted-foreground/40">
                H{s.level}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
