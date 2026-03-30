import { useCallback } from "react"
import type { Editor } from "@tiptap/core"
import type { BlockPosition } from "./use-block-positions"

/**
 * Returns a function that reorders a block from one index to another
 * via a single ProseMirror transaction (Undo-friendly).
 */
export function useBlockReorder(editor: Editor | null) {
  return useCallback(
    (fromIndex: number, toIndex: number, blocks: BlockPosition[]) => {
      if (!editor || fromIndex === toIndex) return
      if (fromIndex < 0 || toIndex < 0) return
      if (fromIndex >= blocks.length || toIndex >= blocks.length) return

      const fromBlock = blocks[fromIndex]
      const node = editor.state.doc.nodeAt(fromBlock.docPos)
      if (!node) return

      const { tr } = editor.state

      // Strategy: delete first, then insert at mapped position
      // This works correctly for both up and down moves via tr.mapping
      const fromStart = fromBlock.docPos
      const fromEnd = fromStart + fromBlock.nodeSize

      // Calculate insertion point BEFORE deletion
      let insertPos: number
      if (toIndex < fromIndex) {
        // Moving up: insert before the target block
        insertPos = blocks[toIndex].docPos
      } else {
        // Moving down: insert after the target block
        const targetBlock = blocks[toIndex]
        insertPos = targetBlock.docPos + targetBlock.nodeSize
      }

      // Step 1: Delete the block from its original position
      tr.delete(fromStart, fromEnd)

      // Step 2: Map the insertion point (accounts for the deletion)
      const mappedInsertPos = tr.mapping.map(insertPos)

      // Step 3: Insert the node at the new position
      tr.insert(mappedInsertPos, node)

      // Dispatch as a single transaction (single Undo step)
      editor.view.dispatch(tr)
    },
    [editor]
  )
}

/**
 * Returns a function that handles side-drop: wrapping two blocks
 * into a columnsBlock with two columnCells, or adding a new column
 * to an existing columnsBlock. Single ProseMirror transaction.
 */
export function useSideDrop(editor: Editor | null) {
  return useCallback(
    (
      draggedBlockIndex: number,
      targetBlockIndex: number,
      side: "left" | "right",
      blocks: BlockPosition[]
    ) => {
      if (!editor) return
      if (draggedBlockIndex === targetBlockIndex) return
      if (draggedBlockIndex < 0 || targetBlockIndex < 0) return
      if (draggedBlockIndex >= blocks.length || targetBlockIndex >= blocks.length) return

      const draggedBlock = blocks[draggedBlockIndex]
      const targetBlock = blocks[targetBlockIndex]

      const draggedNode = editor.state.doc.nodeAt(draggedBlock.docPos)
      const targetNode = editor.state.doc.nodeAt(targetBlock.docPos)
      if (!draggedNode || !targetNode) return

      const columnsBlockType = editor.schema.nodes.columnsBlock
      const columnCellType = editor.schema.nodes.columnCell
      if (!columnsBlockType || !columnCellType) return

      const { tr } = editor.state

      // Check if target is already a columnsBlock — add a new column to it
      if (targetNode.type.name === "columnsBlock") {
        // Wrap dragged node in a columnCell
        const newCell = columnCellType.create(null, [draggedNode])

        // Delete dragged block first
        tr.delete(draggedBlock.docPos, draggedBlock.docPos + draggedBlock.nodeSize)

        // Map target position after deletion
        const mappedTargetPos = tr.mapping.map(targetBlock.docPos)
        const mappedTargetNode = tr.doc.nodeAt(mappedTargetPos)
        if (!mappedTargetNode) return

        if (side === "left") {
          // Insert as first column cell (inside the columnsBlock, at +1)
          tr.insert(mappedTargetPos + 1, newCell)
        } else {
          // Insert as last column cell (before closing of columnsBlock)
          tr.insert(mappedTargetPos + mappedTargetNode.nodeSize - 1, newCell)
        }

        editor.view.dispatch(tr)
        return
      }

      // Target is a regular block: wrap both in a new columnsBlock
      const draggedCell = columnCellType.create(null, [draggedNode])
      const targetCell = columnCellType.create(null, [targetNode])

      const cells =
        side === "left"
          ? [draggedCell, targetCell]
          : [targetCell, draggedCell]

      const columnsNode = columnsBlockType.create(null, cells)

      // Determine operation order based on positions to keep indices valid.
      // Always delete the block that comes later in the doc first.
      if (draggedBlock.docPos > targetBlock.docPos) {
        // Dragged is after target: delete dragged first, then replace target
        tr.delete(draggedBlock.docPos, draggedBlock.docPos + draggedBlock.nodeSize)
        const mappedTargetStart = tr.mapping.map(targetBlock.docPos)
        const mappedTargetEnd = tr.mapping.map(targetBlock.docPos + targetBlock.nodeSize)
        tr.replaceWith(mappedTargetStart, mappedTargetEnd, columnsNode)
      } else {
        // Dragged is before target: replace target first, then delete dragged
        tr.replaceWith(
          targetBlock.docPos,
          targetBlock.docPos + targetBlock.nodeSize,
          columnsNode
        )
        const mappedDragStart = tr.mapping.map(draggedBlock.docPos)
        const mappedDragEnd = tr.mapping.map(
          draggedBlock.docPos + draggedBlock.nodeSize
        )
        tr.delete(mappedDragStart, mappedDragEnd)
      }

      editor.view.dispatch(tr)
    },
    [editor]
  )
}
