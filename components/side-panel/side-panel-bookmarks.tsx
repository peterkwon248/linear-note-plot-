"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import { MapPin } from "@phosphor-icons/react/dist/ssr/MapPin"

export function SidePanelBookmarks() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const notes = usePlotStore((s) => s.notes)
  const note = notes.find((n) => n.id === selectedNoteId) ?? null

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
      <div className="p-4 text-muted-foreground text-sm">No note selected</div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        <BookmarkSimple size={14} weight="bold" />
        <span className="text-xs font-semibold uppercase tracking-wider">Bookmarks</span>
        <span className="text-xs text-muted-foreground/50">{bookmarks.length}</span>
      </div>

      {bookmarks.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 italic px-1">
          No bookmarks. Use{" "}
          <kbd className="text-xs bg-secondary px-1 rounded">/bookmark</kbd> to add one.
        </p>
      ) : (
        <ul className="space-y-0.5">
          {bookmarks.map((b) => (
            <li
              key={b.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-hover-bg transition-colors cursor-pointer"
            >
              <MapPin size={12} weight="fill" className="text-muted-foreground/50 flex-shrink-0" />
              <span className="text-sm text-foreground/80 flex-1 truncate">{b.label}</span>
              <span className="text-xs text-muted-foreground/40">
                {b.type === "divider" ? "divider" : "inline"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
