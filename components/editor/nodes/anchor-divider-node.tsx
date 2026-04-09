"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { useState, useRef, useEffect } from "react"
import { BookmarkSimple, X as PhX } from "@/lib/editor/editor-icons"
import { usePlotStore } from "@/lib/store"
import type { GlobalBookmark } from "@/lib/types"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

function AnchorDividerView({ node, updateAttributes, deleteNode }: NodeViewProps) {
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
      pinBookmark(noteId, anchorId, (node.attrs.label as string) || "Section", "divider")
    }
  }

  return (
    <NodeViewWrapper data-anchor-id={node.attrs.id}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div contentEditable={false} className="anchor-divider">
            <div className="anchor-divider-line" />
            <div className="anchor-divider-center">
              <BookmarkSimple size={14} className="anchor-divider-icon" />
              {editing ? (
                <input
                  ref={inputRef}
                  className="anchor-divider-label-input"
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
                  className="anchor-divider-label"
                  onClick={() => setEditing(true)}
                >
                  {node.attrs.label as string}
                </span>
              )}
            </div>
            <div className="anchor-divider-line" />
            <button
              type="button"
              className="anchor-divider-delete"
              onClick={() => deleteNode()}
              title="Remove bookmark divider"
            >
              <PhX size={12} />
            </button>
          </div>
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

export const AnchorDividerNode = Node.create({
  name: "anchorDivider",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      label: { default: "Section" },
      id: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="anchor-divider"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "anchor-divider" }),
      HTMLAttributes.label || "Section",
    ]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "anchorDivider") {
          e.commands.deleteSelection()
          return true
        }
        const { $from } = e.state.selection
        const before = $from.nodeBefore
        if (before?.type.name === "anchorDivider") {
          e.commands.deleteRange({ from: $from.pos - before.nodeSize, to: $from.pos })
          return true
        }
        return false
      },
      Delete: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "anchorDivider") {
          e.commands.deleteSelection()
          return true
        }
        return false
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(AnchorDividerView)
  },
})
