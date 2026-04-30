"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Info, Warning, XCircle, CheckCircle, Lightbulb, X as PhX, ArrowsIn } from "@/lib/editor/editor-icons"
import { useBlockResize } from "@/components/editor/hooks/use-block-resize"
import { BlockResizeHandles } from "@/components/editor/hooks/block-resize-handles"

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
  const width = node.attrs.width as number | null
  const height = node.attrs.height as number | null
  const { containerRef, isResizing, onResizeStart } = useBlockResize(width, height, updateAttributes)

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
        ref={containerRef}
        className={`not-draggable ${config.bg} ${config.border} border-l-4 rounded-r-lg my-2 relative group block-resize-wrapper ${isResizing ? "is-resizing" : ""}`}
        style={{
          ...(width ? { width: `${width}px` } : {}),
          ...(height ? { height: `${height}px`, overflowY: "auto" as const } : {}),
        }}
      >
        {editor?.isEditable && <BlockResizeHandles onResizeStart={onResizeStart} />}
        {/* Header bar with icon (click to cycle type) + remove button */}
        <div className="flex items-center justify-between px-3 pt-2 pb-0" contentEditable={false}>
          <button
            type="button"
            onClick={cycleType}
            className={`flex items-center gap-1.5 ${config.text} hover:opacity-80 transition-opacity cursor-pointer`}
            title={`${config.label} — click to change type`}
          >
            <Icon size={16} />
            <span className="text-2xs font-semibold uppercase tracking-wider">{config.label}</span>
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
              onClick={removeCallout}
              className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors opacity-0 group-hover:opacity-100"
              title="Remove callout"
            >
              <PhX size={12} />
            </button>
          </div>
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
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      calloutType: {
        default: "info",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-callout-type") || "info",
        renderHTML: (attributes: Record<string, string>) => ({ "data-callout-type": attributes.calloutType }),
      },
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
    return [{ tag: 'div[data-type="callout-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "callout-block" }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView)
  },
})
