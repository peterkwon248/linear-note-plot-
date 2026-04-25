"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import type { Editor } from "@tiptap/react"
import { useBlockPositions, getBlockDomRect } from "./dnd/use-block-positions"
import { BlockCommentMarker } from "@/components/comments/block-comment-marker"

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
        blocks.map((block) => (
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
      style={{
        position: "absolute",
        top: pos.top,
        right: pos.right,
        zIndex: 11,
        pointerEvents: "auto",
      }}
    >
      <BlockCommentMarker anchor={{ kind: "note-block", noteId, nodeId: blockId }} />
    </div>
  )
}
