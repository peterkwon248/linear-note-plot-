"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { useState, useRef, useEffect } from "react"
import { BookmarkSimple } from "@/lib/editor/editor-icons"

function AnchorMarkView({ node, updateAttributes }: NodeViewProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(node.attrs.label as string)
  const inputRef = useRef<HTMLInputElement>(null)

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

  return (
    <NodeViewWrapper as="span" className="anchor-mark">
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
