"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { useState, useRef, useEffect, useMemo } from "react"
import { usePlotStore } from "@/lib/store"

/** Extract plain text from footnote content (handles both plain string and JSON). */
function getFootnotePlainText(content: string): string {
  if (!content) return ""
  const trimmed = content.trim()
  if (trimmed.startsWith("{")) {
    try {
      const json = JSON.parse(trimmed)
      if (json?.type === "doc" && Array.isArray(json.content)) {
        return json.content
          .map((block: any) =>
            (block.content ?? [])
              .map((n: any) => n.text ?? "")
              .join("")
          )
          .join("\n")
      }
    } catch {}
  }
  return trimmed
}

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

  // Auto-calculate footnote number based on document order
  const footnoteNumber = useMemo(() => {
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
    return count
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

  // On first insert (empty content) → scroll to footer for editing
  useEffect(() => {
    if (!node.attrs.content) {
      scrollToFooterAndEdit()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Scroll to this footnote in the footer and activate editing there. */
  const scrollToFooterAndEdit = () => {
    // Dispatch event → FootnotesFooter auto-expands + scrolls
    window.dispatchEvent(new CustomEvent("plot:scroll-to-footnote", {
      detail: { id: node.attrs.id, edit: true },
    }))
    // After footer expands + renders, find the row and click its content to start editing
    setTimeout(() => {
      const el = document.querySelector(`[data-footnote-list-id="${node.attrs.id}"]`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        // Click the content span or empty button to trigger editing
        const clickTarget = el.querySelector('.footnotes-footer-content, .footnotes-footer-empty') as HTMLElement
        clickTarget?.click()
      }
    }, 150) // Wait for footer expansion animation
  }

  const plainText = getFootnotePlainText(node.attrs.content as string)

  return (
    <NodeViewWrapper as="span" className="footnote-ref">
      <span contentEditable={false} className="footnote-ref-inner">
        {/* No inline editing — always show badge. Click → scroll to footer. */}
        <>
          <span
            className="footnote-badge"
            onClick={scrollToFooterAndEdit}
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
                {plainText && (
                  <span className="footnote-popover-content">{plainText}</span>
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
                <button
                  className="footnote-popover-edit-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPopover(false)
                    scrollToFooterAndEdit()
                  }}
                >
                  Edit ✏️
                </button>
              </span>
            )}
          </>
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
