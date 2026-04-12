"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { useState, useRef, useEffect, useMemo } from "react"
import { usePlotStore } from "@/lib/store"

function FootnoteRefView({ node, editor, updateAttributes }: NodeViewProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(node.attrs.content as string)
  const [showPopover, setShowPopover] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
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

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

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

  // Open editing on first insert (empty content)
  useEffect(() => {
    if (!node.attrs.content) {
      setEditing(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = () => {
    const trimmed = draft.trim()
    const attrs: Record<string, any> = { content: trimmed }

    // Auto-create Reference if none linked yet and content is not empty
    if (trimmed && !node.attrs.referenceId) {
      const store = usePlotStore.getState()
      const refId = store.createReference({
        title: trimmed.length > 60 ? trimmed.slice(0, 60) + "…" : trimmed,
        content: trimmed,
      })
      attrs.referenceId = refId
    }
    // Sync content back to linked Reference
    if (trimmed && node.attrs.referenceId) {
      const store = usePlotStore.getState()
      const ref = store.references[node.attrs.referenceId as string]
      if (ref) {
        store.updateReference(node.attrs.referenceId as string, { content: trimmed })
      }
    }

    updateAttributes(attrs)
    setEditing(false)
  }

  const scrollToFootnotes = () => {
    // Dispatch event to auto-expand collapsed FootnotesFooter
    window.dispatchEvent(new CustomEvent("plot:scroll-to-footnote", { detail: { id: node.attrs.id } }))
    // Fallback: try direct scroll (works when already expanded)
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-footnote-list-id="${node.attrs.id}"]`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }

  return (
    <NodeViewWrapper as="span" className="footnote-ref">
      <span contentEditable={false} className="footnote-ref-inner">
        {editing ? (
          <span className="footnote-edit-popover">
            <span className="footnote-edit-badge">[{footnoteNumber}]</span>
            <textarea
              ref={inputRef}
              className="footnote-edit-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  save()
                }
                if (e.key === "Escape") {
                  setDraft(node.attrs.content as string || "")
                  setEditing(false)
                }
              }}
              placeholder="Enter footnote content..."
              rows={2}
            />
          </span>
        ) : (
          <>
            <span
              className="footnote-badge"
              onClick={scrollToFootnotes}
              onDoubleClick={(e) => {
                e.stopPropagation()
                setDraft(node.attrs.content as string || "")
                setEditing(true)
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              [{footnoteNumber}]
            </span>
            {showPopover && !editing && (node.attrs.content || referenceUrl) && (
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
          </>
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
      referenceId: { default: null },   // Reference.id (optional — for linked references)
      content: { default: "" },          // 각주 텍스트 (인라인 저장)
      comment: { default: null },        // 위치별 부가 코멘트
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
