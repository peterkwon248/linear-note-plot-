"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { useState, useRef, useEffect, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { openFootnoteModal } from "@/components/editor/footnote-edit-modal"

function FootnoteRefView({ node, editor, updateAttributes }: NodeViewProps) {
  const [showPopover, setShowPopover] = useState(false)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Get URL from linked Reference
  const referenceUrl = useMemo(() => {
    const refId = node.attrs.referenceId as string
    if (!refId) return null
    const ref = usePlotStore.getState().references[refId]
    if (!ref) return null
    const urlField = ref.fields.find((f) => f.key.toLowerCase() === "url")
    return urlField?.value || null
  }, [node.attrs.referenceId])

  // Auto-calculate footnote number based on document order + optional offset
  const footnoteNumber = useMemo(() => {
    const offset = ((editor.storage as any).footnoteRef?.footnoteStartOffset as number) ?? 0
    let count = 0
    let found = false
    editor.state.doc.descendants((n) => {
      if (found) return false
      if (n.type.name === "footnoteRef") {
        count++
        if (n.attrs.id === node.attrs.id) {
          found = true
        }
      }
    })
    return count + offset
  }, [editor.state.doc, node.attrs.id])

  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  const handleMouseEnter = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    showTimerRef.current = setTimeout(() => setShowPopover(true), 300)
  }

  const handleMouseLeave = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
    hideTimerRef.current = setTimeout(() => setShowPopover(false), 200)
  }

  // Auto-open modal on first insert (empty content)
  useEffect(() => {
    if (!node.attrs.content && !node.attrs.contentJson) {
      openFootnoteModal({
        footnoteId: node.attrs.id as string,
        content: "",
        contentJson: null,
        referenceId: node.attrs.referenceId as string | null,
        onSave: (attrs) => updateAttributes(attrs),
        onCancel: () => {
          // Delete the empty footnote node on cancel
          const pos = editor.state.doc.resolve(editor.state.selection.from)
          editor.state.doc.descendants((n, p) => {
            if (n.type.name === "footnoteRef" && n.attrs.id === node.attrs.id) {
              editor.chain().focus().deleteRange({ from: p, to: p + n.nodeSize }).run()
              return false
            }
          })
        },
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClick = () => {
    if (!editor.isEditable) return
    openFootnoteModal({
      footnoteId: node.attrs.id as string,
      content: node.attrs.content as string || "",
      contentJson: (node.attrs.contentJson as Record<string, unknown>) ?? null,
      referenceId: node.attrs.referenceId as string | null,
      onSave: (attrs) => updateAttributes(attrs),
    })
  }

  return (
    <NodeViewWrapper as="span" className="footnote-ref">
      <span contentEditable={false} className="footnote-ref-inner">
        <span
          className="footnote-badge"
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          [{footnoteNumber}]
        </span>
        {showPopover && (node.attrs.content || referenceUrl) && (
          <span
            className="footnote-popover"
            onMouseEnter={() => {
              if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current)
                hideTimerRef.current = null
              }
            }}
            onMouseLeave={() => {
              hideTimerRef.current = setTimeout(() => setShowPopover(false), 200)
            }}
          >
            <span className="footnote-popover-number">[{footnoteNumber}]</span>
            {node.attrs.content && (
              <span className="footnote-popover-content">{node.attrs.content as string}</span>
            )}
            {referenceUrl && (
              <a
                href={referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footnote-popover-url"
                onClick={(e) => e.stopPropagation()}
              >
                🔗 {referenceUrl.replace(/^https?:\/\//, "").split("/")[0]}
              </a>
            )}
          </span>
        )}
      </span>
    </NodeViewWrapper>
  )
}

export const FootnoteRefExtension = Node.create({
  name: "footnoteRef",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addStorage() {
    return { footnoteStartOffset: 0 }
  },

  addAttributes() {
    return {
      id: { default: null },
      referenceId: { default: null },
      content: { default: "" },
      contentJson: { default: null },
      comment: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'sup[data-type="footnote-ref"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "sup",
      mergeAttributes(HTMLAttributes, { "data-type": "footnote-ref" }),
      `[*]`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FootnoteRefView)
  },
})
