import { useMemo } from "react"
import { useEditorState } from "@tiptap/react"
import type { Editor } from "@tiptap/core"

export interface BlockPosition {
  id: string
  nodeType: string
  docPos: number
  nodeSize: number
}

/**
 * Extract top-level block positions from ProseMirror document.
 * Updates automatically when the document changes.
 */
export function useBlockPositions(editor: Editor | null): BlockPosition[] {
  const blocks = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return []

      const result: BlockPosition[] = []
      e.state.doc.forEach((node, offset, index) => {
        const id = (node.attrs as Record<string, unknown>).id as string | undefined
        result.push({
          id: id || `block-${index}`,
          nodeType: node.type.name,
          docPos: offset,
          nodeSize: node.nodeSize,
        })
      })
      return result
    },
  })

  return blocks ?? []
}

/**
 * Get DOM rect for a block at a given document position.
 * Call this on demand (not in render) since it reads from DOM.
 */
export function getBlockDomRect(
  editor: Editor,
  docPos: number
): DOMRect | null {
  try {
    const dom = editor.view.nodeDOM(docPos)
    if (dom instanceof HTMLElement) {
      return dom.getBoundingClientRect()
    }
  } catch {
    // Position might be invalid after a transaction
  }
  return null
}
