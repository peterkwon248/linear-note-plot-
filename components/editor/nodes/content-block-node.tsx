"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp"
import { ArrowDown } from "@phosphor-icons/react/dist/ssr/ArrowDown"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"

function ContentBlockView({ node, editor }: NodeViewProps) {
  const findPos = (): number | null => {
    let found: number | null = null
    editor.state.doc.descendants((n, pos) => {
      if (n === node) { found = pos; return false }
    })
    return found
  }

  const unwrap = () => {
    const blockPos = findPos()
    if (blockPos === null) return
    const blockNode = editor.state.doc.nodeAt(blockPos)
    if (!blockNode) return
    const { tr } = editor.state
    tr.replaceWith(blockPos, blockPos + blockNode.nodeSize, blockNode.content)
    editor.view.dispatch(tr)
  }

  const moveUp = () => {
    const pos = findPos()
    if (pos === null || pos === 0) return
    const $pos = editor.state.doc.resolve(pos)
    const index = $pos.index($pos.depth)
    if (index === 0) return
    const prevNode = $pos.parent.child(index - 1)
    if (prevNode.type.name === "title") return
    const blockNode = editor.state.doc.nodeAt(pos)
    if (!blockNode) return
    const { tr } = editor.state
    tr.delete(pos, pos + blockNode.nodeSize)
    tr.insert(pos - prevNode.nodeSize, blockNode)
    editor.view.dispatch(tr)
  }

  const moveDown = () => {
    const pos = findPos()
    if (pos === null) return
    const $pos = editor.state.doc.resolve(pos)
    const index = $pos.index($pos.depth)
    if (index >= $pos.parent.childCount - 1) return
    const blockNode = editor.state.doc.nodeAt(pos)
    if (!blockNode) return
    const nextNode = $pos.parent.child(index + 1)
    // Delete first, then insert after nextNode (which shifted left)
    const { tr } = editor.state
    tr.delete(pos, pos + blockNode.nodeSize)
    // After delete, nextNode is now at pos, insert after it
    tr.insert(pos + nextNode.nodeSize, blockNode)
    editor.view.dispatch(tr)
  }

  return (
    <NodeViewWrapper>
      <div className="flex my-1 group relative rounded-md hover:bg-secondary/20 transition-colors">
        {/* Left controls: grip + move arrows */}
        {editor.isEditable && (
          <div
            contentEditable={false}
            className="flex flex-col items-center pt-1 pr-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity gap-0.5"
          >
            <div className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground/30" data-drag-handle>
              <DotsSixVertical size={14} weight="bold" />
            </div>
            <button type="button" onClick={moveUp} className="flex items-center justify-center w-5 h-4 rounded text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors" title="Move up">
              <ArrowUp size={10} weight="bold" />
            </button>
            <button type="button" onClick={moveDown} className="flex items-center justify-center w-5 h-4 rounded text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors" title="Move down">
              <ArrowDown size={10} weight="bold" />
            </button>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 min-w-0 border-l-2 border-transparent group-hover:border-accent/30 pl-2 transition-colors">
          <NodeViewContent className="prose-sm" />
        </div>

        {/* Unwrap button */}
        {editor.isEditable && (
          <div
            contentEditable={false}
            className="flex items-start pt-1 pl-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              type="button"
              onClick={unwrap}
              className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Unblock"
            >
              <PhX size={10} weight="bold" />
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const ContentBlockNode = Node.create({
  name: "contentBlock",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,
  selectable: true,
  draggable: true,

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
