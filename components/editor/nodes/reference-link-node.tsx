"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { useState, useRef, useEffect, useMemo } from "react"
import { usePlotStore } from "@/lib/store"

function ReferenceLinkView({ node, editor }: NodeViewProps) {
  const [showPopover, setShowPopover] = useState(false)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const referenceId = node.attrs.referenceId as string
  const reference = usePlotStore((s) => s.references[referenceId])

  // Extract URL from fields
  const url = useMemo(() => {
    if (!reference) return null
    const urlField = reference.fields.find(
      (f) => f.key.toLowerCase() === "url"
    )
    return urlField?.value || null
  }, [reference])

  const title = reference?.title || node.attrs.title || "Untitled"

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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.ctrlKey || e.metaKey) {
      // Ctrl+click → open reference panel
      const openPanel = usePlotStore.getState().openReferencePanel
      if (openPanel) openPanel(referenceId)
      return
    }

    // Normal click → open URL in new tab, or open panel if no URL
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer")
    } else {
      const openPanel = usePlotStore.getState().openReferencePanel
      if (openPanel) openPanel(referenceId)
    }
  }

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        className="inline-flex items-center gap-0.5 rounded-sm px-1 py-0.5 text-note font-medium cursor-pointer transition-colors bg-emerald-500/8 text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300 relative"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={url ? `Open ${url}` : "No URL set"}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 256 256"
          fill="currentColor"
          className="shrink-0 opacity-60"
        >
          <path d="M137.54,186.36a8,8,0,0,1,0,11.31l-9.94,10A56,56,0,0,1,48.38,128.4L72.5,104.28A56,56,0,0,1,149.31,102a8,8,0,1,1-10.64,12,40,40,0,0,0-54.85,1.63L59.7,139.72a40,40,0,0,0,56.58,56.58l9.94-9.94A8,8,0,0,1,137.54,186.36Zm70.08-138a56.08,56.08,0,0,0-79.22,0l-9.94,9.95a8,8,0,0,0,11.32,11.31l9.94-9.94a40,40,0,0,1,56.58,56.56L172.18,140.4A40,40,0,0,1,117.32,142,8,8,0,1,0,106.7,154a56,56,0,0,0,76.78-2.27l24.12-24.12A56.08,56.08,0,0,0,207.62,48.38Z" />
        </svg>
        {title}

        {/* Hover popover */}
        {showPopover && reference && (
          <span
            className="absolute left-0 bottom-full mb-1.5 z-50 w-64 rounded-lg border border-border bg-background p-3 shadow-lg text-left"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <span className="block text-note font-semibold text-foreground truncate">
              {title}
            </span>
            {reference.content && (
              <span className="block mt-1 text-2xs text-muted-foreground line-clamp-2">
                {reference.content}
              </span>
            )}
            {url && (
              <span className="block mt-1.5 text-2xs text-emerald-400/70 truncate">
                🔗 {url}
              </span>
            )}
            <span className="block mt-1.5 text-[10px] text-muted-foreground/40">
              Click to open · Ctrl+click for details
            </span>
          </span>
        )}
      </span>
    </NodeViewWrapper>
  )
}

export const ReferenceLinkNode = Node.create({
  name: "referenceLink",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      referenceId: { default: "" },
      title: { default: "" }, // fallback if reference deleted
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="reference-link"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "reference-link" }),
      `🔗 ${HTMLAttributes.title || "Reference"}`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReferenceLinkView, { as: "span" })
  },
})
