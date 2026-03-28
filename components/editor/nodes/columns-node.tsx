"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Columns as PhColumns } from "@phosphor-icons/react/dist/ssr/Columns"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Minus as PhMinus } from "@phosphor-icons/react/dist/ssr/Minus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"

/* -- Column Cell Node ----------------------------------------- */
// Individual column -- content is independently editable

function ColumnCellView({}: NodeViewProps) {
  return (
    <NodeViewWrapper className="flex-1 min-w-0 px-2 first:pl-0 last:pr-0">
      <NodeViewContent className="prose-sm min-h-[2em]" />
    </NodeViewWrapper>
  )
}

export const ColumnCellNode = Node.create({
  name: "columnCell",
  content: "block+",
  isolating: true,
  selectable: false,
  draggable: false,

  parseHTML() {
    return [{ tag: 'div[data-type="column-cell"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "column-cell" }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnCellView)
  },
})

/* -- Columns Block Node --------------------------------------- */

function ColumnsNodeView({ node, editor }: NodeViewProps) {
  const columnCount = node.childCount

  // Find position of this node in the document
  const findPos = (): number | null => {
    let found: number | null = null
    editor.state.doc.descendants((n, pos) => {
      if (n === node) { found = pos; return false }
    })
    return found
  }

  const addColumn = () => {
    if (columnCount >= 4) return
    const pos = findPos()
    if (pos === null) return
    const columnsNode = editor.state.doc.nodeAt(pos)
    if (!columnsNode) return
    // Insert a new columnCell at the end of the columns block
    const insertPos = pos + columnsNode.nodeSize - 1 // before closing tag
    const cellType = editor.schema.nodes.columnCell
    const newCell = cellType.createAndFill()
    if (!newCell) return
    const { tr } = editor.state
    tr.insert(insertPos, newCell)
    editor.view.dispatch(tr)
  }

  const removeColumn = () => {
    if (columnCount <= 1) return
    const pos = findPos()
    if (pos === null) return
    const columnsNode = editor.state.doc.nodeAt(pos)
    if (!columnsNode) return
    // Remove the last columnCell
    const lastChild = columnsNode.lastChild
    if (!lastChild) return
    const lastChildPos = pos + columnsNode.nodeSize - lastChild.nodeSize - 1
    const { tr } = editor.state
    tr.delete(lastChildPos, lastChildPos + lastChild.nodeSize)
    editor.view.dispatch(tr)
  }

  // Remove entire columns block, keeping content from all columns
  const removeColumns = () => {
    const pos = findPos()
    if (pos === null) return
    const columnsNode = editor.state.doc.nodeAt(pos)
    if (!columnsNode) return
    // Gather all block content from all columns
    const fragments: import("@tiptap/pm/model").Node[] = []
    columnsNode.forEach((child) => {
      child.forEach((block) => {
        fragments.push(block)
      })
    })
    const { tr } = editor.state
    if (fragments.length > 0) {
      tr.replaceWith(pos, pos + columnsNode.nodeSize, fragments)
    } else {
      tr.delete(pos, pos + columnsNode.nodeSize)
    }
    editor.view.dispatch(tr)
  }

  return (
    <NodeViewWrapper>
      <div className="border border-border/30 border-dashed rounded-lg my-2 relative group">
        {/* Header controls */}
        <div className="flex items-center justify-between px-3 py-1.5" contentEditable={false}>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <PhColumns size={14} weight="bold" />
            <span className="text-xs font-semibold uppercase tracking-wider">{columnCount} Columns</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={removeColumn}
              disabled={columnCount <= 1}
              className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Remove column"
            >
              <PhMinus size={12} weight="bold" />
            </button>
            <button
              type="button"
              onClick={addColumn}
              disabled={columnCount >= 4}
              className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Add column"
            >
              <PhPlus size={12} weight="bold" />
            </button>
            <button
              type="button"
              onClick={removeColumns}
              className="rounded p-0.5 text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Remove columns layout"
            >
              <PhX size={12} weight="bold" />
            </button>
          </div>
        </div>

        {/* Column cells container - flex row */}
        <div className="flex gap-0 divide-x divide-border/30 px-1 pb-2">
          <NodeViewContent />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const ColumnsBlockNode = Node.create({
  name: "columnsBlock",
  group: "block",
  content: "columnCell+",
  defining: true,
  selectable: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="columns-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "columns-block" }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnsNodeView)
  },
})
