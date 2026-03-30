"use client"

import { useState } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Article } from "@phosphor-icons/react/dist/ssr/Article"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"

function SummaryNodeView({ node, editor }: NodeViewProps) {
  const [collapsed, setCollapsed] = useState(false)

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
      <div className="not-draggable border border-border-subtle border-dashed rounded-lg my-2 relative group">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2" contentEditable={false}>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={collapsed ? "Expand summary" : "Collapse summary"}
          >
            {collapsed ? <CaretRight size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
            <Article size={14} weight="bold" />
            <span className="text-2xs font-semibold uppercase tracking-wider">Summary</span>
          </button>
          <button
            type="button"
            onClick={removeSummary}
            className="rounded p-0.5 text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors opacity-0 group-hover:opacity-100"
            title="Remove summary block"
          >
            <PhX size={12} weight="bold" />
          </button>
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
