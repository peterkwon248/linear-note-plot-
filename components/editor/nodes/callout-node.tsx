"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Info } from "@phosphor-icons/react/dist/ssr/Info"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { XCircle } from "@phosphor-icons/react/dist/ssr/XCircle"
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle"
import { Lightbulb } from "@phosphor-icons/react/dist/ssr/Lightbulb"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"

const CALLOUT_TYPES = {
  info: { label: "Info", icon: Info, border: "border-l-blue-500", bg: "bg-blue-500/5", text: "text-blue-400" },
  warning: { label: "Warning", icon: Warning, border: "border-l-amber-500", bg: "bg-amber-500/5", text: "text-amber-400" },
  danger: { label: "Danger", icon: XCircle, border: "border-l-red-500", bg: "bg-red-500/5", text: "text-red-400" },
  success: { label: "Success", icon: CheckCircle, border: "border-l-green-500", bg: "bg-green-500/5", text: "text-green-400" },
  tip: { label: "Tip", icon: Lightbulb, border: "border-l-purple-500", bg: "bg-purple-500/5", text: "text-purple-400" },
} as const

type CalloutType = keyof typeof CALLOUT_TYPES

function CalloutNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const calloutType = (node.attrs.calloutType as CalloutType) || "info"
  const config = CALLOUT_TYPES[calloutType]
  const Icon = config.icon

  // Cycle through types on icon click
  const cycleType = () => {
    const types: CalloutType[] = ["info", "warning", "danger", "success", "tip"]
    const currentIndex = types.indexOf(calloutType)
    const nextType = types[(currentIndex + 1) % types.length]
    updateAttributes({ calloutType: nextType })
  }

  // Remove callout wrapper, keeping inner content
  const removeCallout = () => {
    let calloutPos: number | null = null
    editor.state.doc.descendants((n, pos) => {
      if (n === node) { calloutPos = pos; return false }
    })
    if (calloutPos === null) return

    const calloutNode = editor.state.doc.nodeAt(calloutPos)
    if (!calloutNode) return

    // Replace the callout with its inner content
    const { tr } = editor.state
    tr.replaceWith(calloutPos, calloutPos + calloutNode.nodeSize, calloutNode.content)
    editor.view.dispatch(tr)
  }

  return (
    <NodeViewWrapper>
      <div
        className={`${config.bg} ${config.border} border-l-4 rounded-r-lg my-2 relative group`}
      >
        {/* Header bar with icon (click to cycle type) + remove button */}
        <div className="flex items-center justify-between px-3 pt-2 pb-0" contentEditable={false}>
          <button
            type="button"
            onClick={cycleType}
            className={`flex items-center gap-1.5 ${config.text} hover:opacity-80 transition-opacity cursor-pointer`}
            title={`${config.label} — click to change type`}
          >
            <Icon size={16} weight="bold" />
            <span className="text-xs font-semibold uppercase tracking-wider">{config.label}</span>
          </button>
          {editor.isEditable && (
            <button
              type="button"
              onClick={removeCallout}
              className="rounded p-0.5 text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors opacity-0 group-hover:opacity-100"
              title="Remove callout"
            >
              <PhX size={12} weight="bold" />
            </button>
          )}
        </div>

        {/* Editable content area */}
        <NodeViewContent className="px-3 pb-3 pt-1 prose-sm" />
      </div>
    </NodeViewWrapper>
  )
}

export const CalloutBlockNode = Node.create({
  name: "calloutBlock",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      calloutType: {
        default: "info",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-callout-type") || "info",
        renderHTML: (attributes: Record<string, string>) => ({ "data-callout-type": attributes.calloutType }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "callout-block" }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView)
  },
})
