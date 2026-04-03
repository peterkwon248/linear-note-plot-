"use client"

import { useMemo } from "react"
import { useSidePanelEntity } from "./use-side-panel-entity"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import { MapPin } from "@phosphor-icons/react/dist/ssr/MapPin"
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr/TextAlignLeft"
import { IconWiki } from "@/components/plot-icons"

export function SidePanelBookmarks() {
  const entity = useSidePanelEntity()

  if (entity.type === "wiki") {
    return <WikiBookmarks />
  }

  return <NoteBookmarks />
}

function NoteBookmarks() {
  const entity = useSidePanelEntity()
  const note = entity.type === "note" ? entity.note : null

  const bookmarks = useMemo(() => {
    if (!note?.contentJson) return []
    const items: { id: string; label: string; type: "inline" | "divider" }[] = []
    const doc = note.contentJson as any
    if (!doc.content) return items

    const walk = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.type === "anchorMark") {
          items.push({
            id: node.attrs?.id || crypto.randomUUID(),
            label: node.attrs?.label || "Bookmark",
            type: "inline",
          })
        } else if (node.type === "anchorDivider") {
          items.push({
            id: node.attrs?.id || crypto.randomUUID(),
            label: node.attrs?.label || "Section",
            type: "divider",
          })
        }
        if (node.content) walk(node.content)
      }
    }
    walk(doc.content)
    return items
  }, [note?.contentJson])

  if (!note) {
    return (
      <div className="p-4 text-muted-foreground text-note">No note selected</div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        <BookmarkSimple size={14} weight="bold" />
        <span className="text-2xs font-semibold uppercase tracking-wider">Bookmarks</span>
        <span className="text-2xs text-muted-foreground/50">{bookmarks.length}</span>
      </div>

      {bookmarks.length === 0 ? (
        <p className="text-2xs text-muted-foreground/50 italic px-1">
          No bookmarks. Use{" "}
          <kbd className="text-2xs bg-secondary px-1 rounded">/bookmark</kbd> to add one.
        </p>
      ) : (
        <ul className="space-y-0.5">
          {bookmarks.map((b) => (
            <li
              key={b.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-hover-bg transition-colors cursor-pointer"
            >
              <MapPin size={12} weight="fill" className="text-muted-foreground/50 flex-shrink-0" />
              <span className="text-note text-foreground/80 flex-1 truncate">{b.label}</span>
              <span className="text-2xs text-muted-foreground/40">
                {b.type === "divider" ? "divider" : "inline"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function WikiBookmarks() {
  const entity = useSidePanelEntity()
  const article = entity.type === "wiki" ? entity.wikiArticle : null

  const sections = useMemo(() => {
    if (!article?.blocks) return []
    return article.blocks
      .filter((b) => b.type === "section")
      .map((b, idx) => ({
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
        <TextAlignLeft size={14} weight="bold" />
        <span className="text-2xs font-semibold uppercase tracking-wider">Sections</span>
        <span className="text-2xs text-muted-foreground/50">{sections.length}</span>
      </div>

      {sections.length === 0 ? (
        <p className="text-2xs text-muted-foreground/50 italic px-1">
          No sections in this article.
        </p>
      ) : (
        <ul className="space-y-0.5">
          {sections.map((s) => (
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
