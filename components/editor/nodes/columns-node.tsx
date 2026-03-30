"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Columns as PhColumns } from "@phosphor-icons/react/dist/ssr/Columns"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Minus as PhMinus } from "@phosphor-icons/react/dist/ssr/Minus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"

/* ----------------------------------------------------------------
 * Column Cell Node
 * ----------------------------------------------------------------
 * Pure renderHTML — NO ReactNodeViewRenderer.
 * Styled via global CSS in EditorStyles.css.
 * -------------------------------------------------------------- */

export const ColumnCellNode = Node.create({
  name: "columnCell",
  content: "block+",
  isolating: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      /** Column width as fraction, e.g. 0.5 = 50%. null = equal (1fr) */
      colWidth: { default: null, parseHTML: (el) => el.getAttribute("data-col-width") ? parseFloat(el.getAttribute("data-col-width")!) : null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="column-cell"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const width = node.attrs.colWidth as number | null
    const style = width ? `width: ${(width * 100).toFixed(1)}%` : undefined
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "column-cell",
        "data-col-width": width ?? undefined,
        class: "column-cell",
        style,
      }),
      0,
    ]
  },
})

/* ----------------------------------------------------------------
 * Resize Handle Component
 * ----------------------------------------------------------------
 * Rendered between columns. Dragging adjusts colWidth attrs on
 * the two adjacent columnCell nodes.
 * -------------------------------------------------------------- */

function ResizeHandle({
  index,
  left,
  editor,
  findPos,
  node,
  onResized,
}: {
  index: number
  left: number
  editor: NodeViewProps["editor"]
  findPos: () => number | null
  node: NodeViewProps["node"]
  onResized?: () => void
}) {
  const dragging = useRef(false)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragging.current = true

      const pos = findPos()
      if (pos === null) return
      const columnsNode = editor.state.doc.nodeAt(pos)
      if (!columnsNode) return

      // Get the columns-grid container for total width
      const gridEl = (e.target as HTMLElement).closest(".not-draggable")?.querySelector(".columns-grid")
      if (!gridEl) return
      // The actual grid is the [data-node-view-wrapper] inside (display:contents makes columns-grid zero-width)
      const nvw = gridEl.querySelector("[data-node-view-wrapper]") as HTMLElement | null
      const containerWidth = nvw?.getBoundingClientRect().width ?? gridEl.getBoundingClientRect().width
      if (containerWidth <= 0) return

      const startX = e.clientX
      const colCount = columnsNode.childCount

      // Current widths as fractions (default to equal)
      const widths: number[] = []
      columnsNode.forEach((child) => {
        widths.push((child.attrs.colWidth as number) ?? 1 / colCount)
      })

      const leftIdx = index
      const rightIdx = index + 1
      const startLeft = widths[leftIdx]
      const startRight = widths[rightIdx]

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return
        const dx = ev.clientX - startX
        const delta = dx / containerWidth

        const minWidth = 0.15 // 15% minimum
        let newLeft = startLeft + delta
        let newRight = startRight - delta
        if (newLeft < minWidth) { newLeft = minWidth; newRight = startLeft + startRight - minWidth }
        if (newRight < minWidth) { newRight = minWidth; newLeft = startLeft + startRight - minWidth }

        widths[leftIdx] = newLeft
        widths[rightIdx] = newRight

        // Live preview: update CSS grid-template-columns
        if (nvw) {
          nvw.style.gridTemplateColumns = widths.map((w) => `${(w * 100).toFixed(1)}%`).join(" ")
        }
      }

      const onMouseUp = () => {
        dragging.current = false
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""

        // Commit widths to node attrs
        const currentPos = findPos()
        if (currentPos === null) return
        const { tr } = editor.state
        let offset = 1 // skip opening of columnsBlock
        const currentColumnsNode = editor.state.doc.nodeAt(currentPos)
        if (!currentColumnsNode) return

        currentColumnsNode.forEach((child, childOffset, childIndex) => {
          tr.setNodeMarkup(currentPos + 1 + childOffset, undefined, {
            ...child.attrs,
            colWidth: widths[childIndex],
          })
        })

        editor.view.dispatch(tr)

        // Clear inline style (CSS will use data-col-width via grid)
        if (nvw) nvw.style.gridTemplateColumns = ""
        onResized?.()
      }

      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [editor, findPos, index, node, onResized],
  )

  return (
    <div
      className="column-resize-handle-wrapper"
      contentEditable={false}
      onMouseDown={onMouseDown}
      style={{ left: `${left}px` }}
    >
      <div className="column-resize-handle-line" />
    </div>
  )
}

/* ----------------------------------------------------------------
 * Grid + Resize Handles — measures column-cell positions for handles
 * -------------------------------------------------------------- */

function ColumnsGridWithHandles({
  gridTemplate,
  columnCount,
  editor,
  findPos,
  node,
}: {
  gridTemplate: string | undefined
  columnCount: number
  editor: NodeViewProps["editor"]
  findPos: () => number | null
  node: NodeViewProps["node"]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [handlePositions, setHandlePositions] = useState<number[]>([])

  // Measure column-cell boundaries to position resize handles
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return
      const cells = containerRef.current.querySelectorAll(".column-cell")
      if (cells.length < 2) { setHandlePositions([]); return }

      const containerRect = containerRef.current.getBoundingClientRect()
      const positions: number[] = []
      for (let i = 0; i < cells.length - 1; i++) {
        const cellRect = cells[i].getBoundingClientRect()
        positions.push(cellRect.right - containerRect.left)
      }
      setHandlePositions(positions)
    }

    measure()
    // Re-measure on window resize
    window.addEventListener("resize", measure)
    // Use MutationObserver for content changes
    const observer = new MutationObserver(measure)
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true, attributes: true })
    }
    return () => {
      window.removeEventListener("resize", measure)
      observer.disconnect()
    }
  }, [columnCount, gridTemplate])

  return (
    <div className="relative" ref={containerRef}>
      <NodeViewContent
        className="columns-grid"
        style={gridTemplate ? { "--columns-template": gridTemplate } as React.CSSProperties : undefined}
      />
      {/* Resize handles at column boundaries */}
      {handlePositions.map((left, i) => (
        <ResizeHandle
          key={`rh-${i}`}
          index={i}
          left={left}
          editor={editor}
          findPos={findPos}
          node={node}
          onResized={() => {
            // Force re-measure after resize
            setTimeout(() => {
              if (!containerRef.current) return
              const cells = containerRef.current.querySelectorAll(".column-cell")
              const containerRect = containerRef.current.getBoundingClientRect()
              const positions: number[] = []
              for (let j = 0; j < cells.length - 1; j++) {
                const cellRect = cells[j].getBoundingClientRect()
                positions.push(cellRect.right - containerRect.left)
              }
              setHandlePositions(positions)
            }, 50)
          }}
        />
      ))}
    </div>
  )
}

/* ----------------------------------------------------------------
 * Columns Block Node View
 * -------------------------------------------------------------- */

function ColumnsNodeView({ node, editor }: NodeViewProps) {
  const columnCount = node.childCount

  const findPos = useCallback((): number | null => {
    let found: number | null = null
    editor.state.doc.descendants((n, pos) => {
      if (n === node) { found = pos; return false }
    })
    return found
  }, [editor, node])

  const addColumn = () => {
    if (columnCount >= 4) return
    const pos = findPos()
    if (pos === null) return
    const columnsNode = editor.state.doc.nodeAt(pos)
    if (!columnsNode) return
    const insertPos = pos + columnsNode.nodeSize - 1
    const cellType = editor.schema.nodes.columnCell
    const newCell = cellType.createAndFill()
    if (!newCell) return

    // Reset all widths to equal when adding
    const newCount = columnCount + 1
    const { tr } = editor.state
    tr.insert(insertPos, newCell)
    // After insert, reset all colWidths to null (equal)
    const updatedNode = tr.doc.nodeAt(pos)
    if (updatedNode) {
      updatedNode.forEach((child, offset) => {
        tr.setNodeMarkup(pos + 1 + offset, undefined, { ...child.attrs, colWidth: null })
      })
    }
    editor.view.dispatch(tr)
  }

  const removeColumn = () => {
    if (columnCount <= 1) return
    const pos = findPos()
    if (pos === null) return
    const columnsNode = editor.state.doc.nodeAt(pos)
    if (!columnsNode) return
    const lastChild = columnsNode.lastChild
    if (!lastChild) return
    const lastChildPos = pos + columnsNode.nodeSize - lastChild.nodeSize - 1
    const { tr } = editor.state
    tr.delete(lastChildPos, lastChildPos + lastChild.nodeSize)
    // Reset remaining to equal
    const updatedNode = tr.doc.nodeAt(pos)
    if (updatedNode) {
      updatedNode.forEach((child, offset) => {
        tr.setNodeMarkup(pos + 1 + offset, undefined, { ...child.attrs, colWidth: null })
      })
    }
    editor.view.dispatch(tr)
  }

  const removeColumns = () => {
    const pos = findPos()
    if (pos === null) return
    const columnsNode = editor.state.doc.nodeAt(pos)
    if (!columnsNode) return
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

  // Build grid-template-columns from colWidth attrs
  const gridTemplate = (() => {
    const widths: string[] = []
    let hasCustom = false
    node.forEach((child) => {
      const w = child.attrs.colWidth as number | null
      if (w !== null) {
        hasCustom = true
        widths.push(`${(w * 100).toFixed(1)}%`)
      } else {
        widths.push("1fr")
      }
    })
    return hasCustom ? widths.join(" ") : undefined
  })()

  return (
    <NodeViewWrapper>
      <div className="not-draggable my-2 relative group/columns">
        {/* Header — visible on hover */}
        <div
          className="flex items-center justify-between px-1 py-1 opacity-0 group-hover/columns:opacity-100 transition-opacity"
          contentEditable={false}
        >
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <PhColumns size={13} weight="bold" />
            <span className="text-[11px] font-medium uppercase tracking-wider">
              {columnCount} Columns
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={removeColumn}
              disabled={columnCount <= 1}
              className="rounded p-0.5 text-muted-foreground/40 hover:text-foreground hover:bg-hover-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Remove column"
            >
              <PhMinus size={12} weight="bold" />
            </button>
            <button
              type="button"
              onClick={addColumn}
              disabled={columnCount >= 4}
              className="rounded p-0.5 text-muted-foreground/40 hover:text-foreground hover:bg-hover-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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

        {/* Grid + resize handles wrapper */}
        <ColumnsGridWithHandles
          gridTemplate={gridTemplate}
          columnCount={columnCount}
          editor={editor}
          findPos={findPos}
          node={node}
        />
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
