"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { ArrowsIn } from "@phosphor-icons/react/dist/ssr/ArrowsIn"
import { useBlockResize } from "@/components/editor/hooks/use-block-resize"
import { BlockResizeHandles } from "@/components/editor/hooks/block-resize-handles"

function ContentBlockView({ node, updateAttributes, editor }: NodeViewProps) {
  const width = node.attrs.width as number | null
  const height = node.attrs.height as number | null
  const { containerRef, isResizing, onResizeStart } = useBlockResize(width, height, updateAttributes)
  // Remove block wrapper, keeping inner content
  const unwrap = () => {
    let blockPos: number | null = null
    editor.state.doc.descendants((n, pos) => {
      if (n === node) { blockPos = pos; return false }
    })
    if (blockPos === null) return
    const blockNode = editor.state.doc.nodeAt(blockPos)
    if (!blockNode) return
    const { tr } = editor.state
    tr.replaceWith(blockPos, blockPos + blockNode.nodeSize, blockNode.content)
    editor.view.dispatch(tr)
  }

  return (
    <NodeViewWrapper>
      <div
        ref={containerRef}
        className={`not-draggable flex my-1 group relative rounded-md hover:bg-hover-bg transition-colors block-resize-wrapper ${isResizing ? "is-resizing" : ""}`}
        style={{
          ...(width ? { width: `${width}px` } : {}),
          ...(height ? { height: `${height}px`, overflowY: "auto" as const } : {}),
        }}
      >
        {editor?.isEditable && <BlockResizeHandles onResizeStart={onResizeStart} />}
        {/* Drag handle on the left */}
        <div
          contentEditable={false}
          className="flex items-start pt-1 pr-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          data-drag-handle
        >
          <div className="flex items-center justify-center w-5 h-5 rounded cursor-grab text-muted-foreground/40 hover:text-muted-foreground hover:bg-hover-bg active:cursor-grabbing">
            <DotsSixVertical size={14} weight="bold" />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 border-l-2 border-transparent group-hover:border-accent/30 pl-2 transition-colors">
          <NodeViewContent className="prose-sm" />
        </div>

        {/* Unwrap button */}
        <div
          contentEditable={false}
          className="flex items-start pt-1 pl-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {(width || height) && (
            <button
              type="button"
              onClick={() => updateAttributes({ width: null, height: null })}
              className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Reset size"
            >
              <ArrowsIn size={10} weight="bold" />
            </button>
          )}
          <button
            type="button"
            onClick={unwrap}
            className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors"
            title="Unblock"
          >
            <PhX size={10} weight="bold" />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const ContentBlockNode = Node.create({
  name: "contentBlock",
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
    return [{ tag: 'div[data-type="content-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "content-block" }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ContentBlockView)
  },
})
