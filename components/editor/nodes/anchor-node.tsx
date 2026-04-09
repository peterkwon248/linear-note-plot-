"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { useState, useRef, useEffect } from "react"
import { BookmarkSimple } from "@/lib/editor/editor-icons"
import { usePlotStore } from "@/lib/store"
import type { GlobalBookmark } from "@/lib/types"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

function AnchorMarkView({ node, updateAttributes }: NodeViewProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(node.attrs.label as string)
  const inputRef = useRef<HTMLInputElement>(null)

  const globalBookmarks = usePlotStore((s) => s.globalBookmarks)
  const pinBookmark = usePlotStore((s) => s.pinBookmark)
  const unpinBookmark = usePlotStore((s) => s.unpinBookmark)

  const noteId = usePlotStore.getState().selectedNoteId
  const anchorId = node.attrs.id as string

  const pinnedEntry = noteId
    ? Object.values(globalBookmarks as Record<string, GlobalBookmark>).find(
        (bm) => bm.noteId === noteId && bm.anchorId === anchorId
      )
    : null
  const isPinned = !!pinnedEntry

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const save = () => {
    const trimmed = draft.trim()
    if (trimmed) {
      updateAttributes({ label: trimmed })
    } else {
      setDraft(node.attrs.label as string)
    }
    setEditing(false)
  }

  const handlePinToggle = () => {
    if (!noteId) return
    if (isPinned && pinnedEntry) {
      unpinBookmark(pinnedEntry.id)
    } else {
      pinBookmark(noteId, anchorId, (node.attrs.label as string) || "Bookmark", "inline")
    }
  }

  return (
    <NodeViewWrapper as="span" className="anchor-mark" data-anchor-id={node.attrs.id}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <span contentEditable={false} className="anchor-mark-inner">
            <BookmarkSimple size={14} className="anchor-icon" />
            {editing ? (
              <input
                ref={inputRef}
                className="anchor-label-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    save()
                  }
                  if (e.key === "Escape") {
                    setDraft(node.attrs.label as string)
                    setEditing(false)
                  }
                }}
                style={{ width: `${Math.max(draft.length, 3)}ch` }}
              />
            ) : (
              <span
                className="anchor-label"
                onClick={() => setEditing(true)}
              >
                {node.attrs.label as string}
              </span>
            )}
          </span>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handlePinToggle}>
            {isPinned ? "Unpin from Bookmarks" : "Pin to Bookmarks"}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </NodeViewWrapper>
  )
}

export const AnchorMarkNode = Node.create({
  name: "anchorMark",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      label: { default: "Bookmark" },
      id: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="anchor-mark"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "anchor-mark" }),
      HTMLAttributes.label || "Bookmark",
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AnchorMarkView)
  },
})
