"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import type { Editor } from "@tiptap/react"
import { useBlockPositions, getBlockDomRect } from "./dnd/use-block-positions"
import { BlockCommentMarker } from "@/components/comments/block-comment-marker"
import { usePlotStore } from "@/lib/store"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import { cn } from "@/lib/utils"

/**
 * Overlay layer that renders comment markers for note blocks.
 * Each top-level ProseMirror block with a UniqueID gets a marker positioned at its top-right corner.
 *
 * Symmetric with wiki blocks — same BlockCommentMarker component, same anchor pattern.
 */
export function NoteCommentMarkerLayer({
  editor,
  noteId,
  containerRef,
}: {
  editor: Editor | null
  noteId: string
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const blocks = useBlockPositions(editor)
  return (
    <>
      {editor &&
        blocks
          // Banners host their own integrated cluster (PaintBucket + Comment +
          // Bookmark + X) inside the node view, so the global overlay must skip
          // them — otherwise the user sees a duplicate cluster.
          .filter((block) => block.nodeType !== "bannerBlock")
          .map((block) => (
            <NoteMarkerSlot
              key={block.id}
              blockId={block.id}
              docPos={block.docPos}
              nodeSize={block.nodeSize}
              editor={editor}
              noteId={noteId}
              containerRef={containerRef}
            />
          ))}
    </>
  )
}

function NoteMarkerSlot({
  blockId,
  docPos,
  nodeSize,
  editor,
  noteId,
  containerRef,
}: {
  blockId: string
  docPos: number
  nodeSize: number
  editor: Editor
  noteId: string
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)

  const updatePos = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const rect = getBlockDomRect(editor, docPos)
    if (!rect) return
    const cRect = container.getBoundingClientRect()
    setPos({
      top: rect.top - cRect.top + 4,
      // distance from container's right edge to block's right edge
      right: cRect.right - rect.right + 4,
    })
  }, [editor, docPos, containerRef])

  useEffect(() => {
    const t = setTimeout(updatePos, 50)
    return () => clearTimeout(t)
  }, [updatePos, nodeSize])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const scrollParent = container.closest(
      ".overflow-auto, .overflow-y-auto, [style*='overflow']",
    ) as HTMLElement | null
    const handler = () => updatePos()
    scrollParent?.addEventListener("scroll", handler, { passive: true })
    window.addEventListener("resize", handler, { passive: true })
    return () => {
      scrollParent?.removeEventListener("scroll", handler)
      window.removeEventListener("resize", handler)
    }
  }, [updatePos, containerRef])

  if (!pos) return null

  return (
    <div
      className="group/note-block-actions"
      style={{
        position: "absolute",
        top: pos.top,
        right: pos.right,
        zIndex: 11,
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <BlockCommentMarker anchor={{ kind: "note-block", noteId, nodeId: blockId }} />
      <NoteBlockBookmarkButton noteId={noteId} blockId={blockId} />
    </div>
  )
}

function NoteBlockBookmarkButton({ noteId, blockId }: { noteId: string; blockId: string }) {
  const globalBookmarks = usePlotStore((s) => s.globalBookmarks)
  const pinBookmark = usePlotStore((s) => s.pinBookmark)
  const unpinBookmark = usePlotStore((s) => s.unpinBookmark)
  const notes = usePlotStore((s) => s.notes)

  const existing = useMemo(
    () => Object.values(globalBookmarks).find((b) => b.noteId === noteId && b.anchorId === blockId),
    [globalBookmarks, noteId, blockId],
  )
  const bookmarked = !!existing

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (bookmarked && existing) {
      unpinBookmark(existing.id)
    } else {
      // Build a label from the note title or block content
      const note = notes.find((n) => n.id === noteId)
      const label = note?.title?.slice(0, 60) || "Block"
      pinBookmark(noteId, blockId, label, "block", "note")
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={bookmarked ? "Remove bookmark" : "Add bookmark"}
      className={cn(
        "p-1 rounded-md transition-all duration-100",
        bookmarked
          ? "text-accent opacity-100"
          : "opacity-20 hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-hover-bg",
      )}
    >
      <BookmarkSimple size={13} weight={bookmarked ? "fill" : "regular"} />
    </button>
  )
}
