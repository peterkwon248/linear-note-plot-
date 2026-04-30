"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Columns as PhColumns, Plus as PhPlus, Minus as PhMinus, X as PhX, ArrowsIn } from "@/lib/editor/editor-icons"
import { useBlockResize } from "@/components/editor/hooks/use-block-resize"
import { BlockResizeHandles } from "@/components/editor/hooks/block-resize-handles"

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
      /** Column width in pixels. null = equal (1fr) */
      colWidth: { default: null, parseHTML: (el) => el.getAttribute("data-col-width") ? parseFloat(el.getAttribute("data-col-width")!) : null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="column-cell"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const width = node.attrs.colWidth as number | null
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "column-cell",
        "data-col-width": width ?? undefined,
        class: "column-cell",
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

      const startX = e.clientX

      // Find left cell and measure its pixel width
      const handleWrapper = (e.target as HTMLElement).closest(".column-resize-handle-wrapper")
      const parentDiv = handleWrapper?.parentElement
      const cells = parentDiv?.querySelectorAll(".column-cell")
      if (!cells || cells.length < 2) return

      const leftCellEl = cells[index] as HTMLElement
      const rightCellEl = cells[index + 1] as HTMLElement
      const startLeftW = leftCellEl.offsetWidth
      const startRightW = rightCellEl.offsetWidth
      const totalW = startLeftW + startRightW
      const minW = 60

      // Capture position ONCE on mousedown (node reference is still valid here)
      const columnsPos = findPos()
      if (columnsPos === null) return

      // Get the handle element to move it visually
      const handleEl = (e.target as HTMLElement).closest(".column-resize-handle-wrapper") as HTMLElement | null
      const handleStartLeft = parseFloat(handleEl?.style.left || "0") || left

      const move = (ev: MouseEvent) => {
        if (!ev.buttons) { finish(ev); return }
        const dx = ev.clientX - startX
        // Just move the handle visually — NO transactions during drag
        if (handleEl) {
          const clampedDx = Math.max(minW - startLeftW, Math.min(totalW - minW - startLeftW, dx))
          handleEl.style.left = `${handleStartLeft + clampedDx}px`
        }
      }

      const finish = (ev: MouseEvent) => {
        dragging.current = false
        document.removeEventListener("mousemove", move)
        document.removeEventListener("mouseup", finish)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""

        const dx = ev.clientX - startX
        if (Math.abs(dx) < 2) return // allow clicks

        // Calculate final pixel widths
        const newLeftW = Math.max(minW, Math.min(totalW - minW, startLeftW + dx))
        const newRightW = totalW - newLeftW

        // Single commit with pixel values (→ fr units in CSS grid)
        const node = editor.state.doc.nodeAt(columnsPos)
        if (!node || node.type.name !== "columnsBlock") return

        const { tr } = editor.state
        let cellOffset = 0
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i)
          const cellPos = columnsPos + 1 + cellOffset
          if (i === index) {
            tr.setNodeMarkup(cellPos, undefined, { ...child.attrs, colWidth: Math.round(newLeftW) })
          } else if (i === index + 1) {
            tr.setNodeMarkup(cellPos, undefined, { ...child.attrs, colWidth: Math.round(newRightW) })
          }
          cellOffset += child.nodeSize
        }
        editor.view.dispatch(tr)
        onResized?.()
      }

      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      document.addEventListener("mousemove", move)
      document.addEventListener("mouseup", finish)
    },
    [editor, findPos, index, onResized],
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
    window.addEventListener("resize", measure)
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

function ColumnsNodeView({ node, editor, updateAttributes }: NodeViewProps) {
  const columnCount = node.childCount
  const width = node.attrs.width as number | null
  const height = node.attrs.height as number | null
  const { containerRef: resizeRef, isResizing, onResizeStart } = useBlockResize(width, height, updateAttributes)

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

  // Build grid-template-columns from colWidth attrs (pixel values)
  const gridTemplate = (() => {
    const widths: string[] = []
    let hasCustom = false
    node.forEach((child) => {
      const w = child.attrs.colWidth as number | null
      if (w !== null && w > 1) {
        // Pixel value — convert to fr proportionally for responsive layout
        hasCustom = true
        widths.push(`${w}fr`)
      } else if (w !== null && w > 0 && w <= 1) {
        // Legacy fraction value — convert to percentage
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
      <div
        ref={resizeRef}
        className={`not-draggable my-2 relative group/columns block-resize-wrapper ${isResizing ? "is-resizing" : ""}`}
        style={{
          ...(width ? { width: `${width}px` } : {}),
          ...(height ? { height: `${height}px`, overflowY: "auto" as const } : {}),
        }}
      >
        {editor?.isEditable && <BlockResizeHandles onResizeStart={onResizeStart} />}
        {/* Header — visible on hover */}
        <div
          className="flex items-center justify-between px-1 py-1 opacity-0 group-hover/columns:opacity-100 transition-opacity"
          contentEditable={false}
        >
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <PhColumns size={12} />
            <span className="text-2xs font-medium uppercase tracking-wider">
              {columnCount} Columns
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={removeColumn}
              disabled={columnCount <= 1}
              className="rounded p-0.5 text-muted-foreground/70 hover:text-foreground hover:bg-hover-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Remove column"
            >
              <PhMinus size={12} />
            </button>
            <button
              type="button"
              onClick={addColumn}
              disabled={columnCount >= 4}
              className="rounded p-0.5 text-muted-foreground/70 hover:text-foreground hover:bg-hover-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Add column"
            >
              <PhPlus size={12} />
            </button>
            {(width || height) && (
              <button
                type="button"
                onClick={() => updateAttributes({ width: null, height: null })}
                className="rounded p-0.5 text-muted-foreground/70 hover:text-foreground hover:bg-hover-bg transition-colors"
                title="Reset size"
              >
                <ArrowsIn size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={removeColumns}
              className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Remove columns layout"
            >
              <PhX size={12} />
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
    return [{ tag: 'div[data-type="columns-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "columns-block" }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnsNodeView)
  },
})
