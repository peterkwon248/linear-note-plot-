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
