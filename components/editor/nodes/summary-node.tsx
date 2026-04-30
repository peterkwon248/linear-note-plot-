"use client"

import { useState, useEffect } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Article, CaretDown, CaretRight, X as PhX, ArrowsIn } from "@/lib/editor/editor-icons"
import { useBlockResize } from "@/components/editor/hooks/use-block-resize"
import { BlockResizeHandles } from "@/components/editor/hooks/block-resize-handles"

function SummaryNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const [collapsed, setCollapsed] = useState(false)
  const width = node.attrs.width as number | null
  const height = node.attrs.height as number | null
  const { containerRef, isResizing, onResizeStart } = useBlockResize(width, height, updateAttributes)

  // Listen for collapse-all / expand-all broadcast (scoped to this editor container)
  useEffect(() => {
    const scope = containerRef.current?.closest('[data-editor-scope]')
    if (!scope) return
    const handler = (e: Event) => {
      const { collapsed: c } = (e as CustomEvent).detail
      setCollapsed(c)
    }
    scope.addEventListener("plot:set-all-collapsed", handler as EventListener)
    return () => scope.removeEventListener("plot:set-all-collapsed", handler as EventListener)
  }, [])

  // Remove summary wrapper, keeping inner content (same pattern as Callout)
  const removeSummary = () => {
    let summaryPos: number | null = null
    editor.state.doc.descendants((n, pos) => {
      if (n === node) { summaryPos = pos; return false }
    })
    if (summaryPos === null) return
    const summaryNode = editor.state.doc.nodeAt(summaryPos)
    if (!summaryNode) return
    const { tr } = editor.state
    tr.replaceWith(summaryPos, summaryPos + summaryNode.nodeSize, summaryNode.content)
    editor.view.dispatch(tr)
  }

  return (
    <NodeViewWrapper>
      <div
        ref={containerRef}
        className={`not-draggable border border-border-subtle border-dashed rounded-lg my-2 relative group block-resize-wrapper ${isResizing ? "is-resizing" : ""}`}
        style={{
          ...(width ? { width: `${width}px` } : {}),
          ...(height ? { height: `${height}px`, overflowY: "auto" as const } : {}),
        }}
      >
        {editor?.isEditable && <BlockResizeHandles onResizeStart={onResizeStart} />}
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2" contentEditable={false}>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={collapsed ? "Expand summary" : "Collapse summary"}
          >
            {collapsed ? <CaretRight size={14} /> : <CaretDown size={14} />}
            <Article size={14} />
            <span className="text-2xs font-semibold uppercase tracking-wider">Summary</span>
          </button>
          <div className="flex items-center gap-0.5">
            {(width || height) && (
              <button
                type="button"
                onClick={() => updateAttributes({ width: null, height: null })}
                className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors opacity-0 group-hover:opacity-100"
                title="Reset size"
              >
                <ArrowsIn size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={removeSummary}
              className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors opacity-0 group-hover:opacity-100"
              title="Remove summary block"
            >
              <PhX size={12} />
            </button>
          </div>
        </div>

        {/* Editable content area - hide when collapsed */}
        <NodeViewContent
          className={`px-3 pb-3 prose-sm ${collapsed ? "hidden" : ""}`}
        />
      </div>
    </NodeViewWrapper>
  )
}

export const SummaryBlockNode = Node.create({
  name: "summaryBlock",
  group: "block",
  content: "block+",
  defining: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const w = el.getAttribute("data-width")
          return w ? parseInt(w, 10) : null
        },
        renderHTML: (attrs: Record<string, any>) => attrs.width ? { "data-width": attrs.width } : {},
      },
      height: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const h = el.getAttribute("data-height")
          return h ? parseInt(h, 10) : null
        },
        renderHTML: (attrs: Record<string, any>) => attrs.height ? { "data-height": attrs.height } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="summary-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "summary-block" }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SummaryNodeView)
  },
})
