/**
 * Custom editor commands for indent/outdent, remove formatting,
 * and list item reordering.
 */
import type { Editor } from "@tiptap/core"

/* ── Indent / Outdent ────────────────────────────────────── */

/**
 * Indent: Sink list item or increase indent level for non-list blocks.
 * - In a list → sinkListItem (increase nesting)
 * - Elsewhere → increaseIndent (margin-left via IndentExtension)
 */
export function indentCommand(editor: Editor): boolean {
  if (editor.isActive("listItem")) {
    return editor.chain().focus().sinkListItem("listItem").run()
  }
  if (editor.isActive("taskItem")) {
    return editor.chain().focus().sinkListItem("taskItem").run()
  }
  // For non-list blocks, increase indent level
  return editor.chain().focus().increaseIndent().run()
}

/**
 * Outdent: Lift list item or decrease indent level for non-list blocks.
 * - In a list → liftListItem (decrease nesting)
 * - Elsewhere → decreaseIndent (margin-left via IndentExtension)
 */
export function outdentCommand(editor: Editor): boolean {
  if (editor.isActive("listItem")) {
    return editor.chain().focus().liftListItem("listItem").run()
  }
  if (editor.isActive("taskItem")) {
    return editor.chain().focus().liftListItem("taskItem").run()
  }
  // For non-list blocks, decrease indent level
  return editor.chain().focus().decreaseIndent().run()
}

/* ── Remove Formatting ───────────────────────────────────── */

/**
 * Remove all marks (bold, italic, etc.) and reset block to paragraph.
 */
export function removeFormattingCommand(editor: Editor): boolean {
  return editor.chain().focus().unsetAllMarks().clearNodes().run()
}

/* ── Move List Item Up / Down ────────────────────────────── */

/**
 * Move the current list item up (swap with previous sibling).
 * Uses ProseMirror transaction to cut and re-insert the node.
 */
export function moveListItemUp(editor: Editor): boolean {
  const { state, dispatch } = editor.view
  const { $from } = state.selection
  // Find the closest list item
  const listItemDepth = findListItemDepth($from)
  if (listItemDepth === null) return false

  const listItemPos = $from.before(listItemDepth)
  const $listItem = state.doc.resolve(listItemPos)
  const index = $listItem.index($listItem.depth - 1)

  // Can't move first item up
  if (index === 0) return false

  const parentPos = $from.before(listItemDepth - 1)
  const parent = state.doc.nodeAt(parentPos)
  if (!parent) return false

  const prevItem = parent.child(index - 1)
  const currentItem = parent.child(index)

  // Calculate positions
  let offset = parentPos + 1
  for (let i = 0; i < index - 1; i++) {
    offset += parent.child(i).nodeSize
  }

  const tr = state.tr
  // Delete current item
  const currentStart = offset + prevItem.nodeSize
  const currentEnd = currentStart + currentItem.nodeSize
  tr.delete(currentStart, currentEnd)
  // Insert before previous item
  tr.insert(offset, currentItem)

  if (dispatch) dispatch(tr.scrollIntoView())
  return true
}

/**
 * Move the current list item down (swap with next sibling).
 */
export function moveListItemDown(editor: Editor): boolean {
  const { state, dispatch } = editor.view
  const { $from } = state.selection
  const listItemDepth = findListItemDepth($from)
  if (listItemDepth === null) return false

  const listItemPos = $from.before(listItemDepth)
  const $listItem = state.doc.resolve(listItemPos)
  const index = $listItem.index($listItem.depth - 1)

  const parentPos = $from.before(listItemDepth - 1)
  const parent = state.doc.nodeAt(parentPos)
  if (!parent) return false

  // Can't move last item down
  if (index >= parent.childCount - 1) return false

  const currentItem = parent.child(index)
  const nextItem = parent.child(index + 1)

  // Calculate positions
  let offset = parentPos + 1
  for (let i = 0; i < index; i++) {
    offset += parent.child(i).nodeSize
  }

  const tr = state.tr
  // Delete current item
  const currentEnd = offset + currentItem.nodeSize
  tr.delete(offset, currentEnd)
  // Insert after next item (which has shifted up)
  tr.insert(offset + nextItem.nodeSize, currentItem)

  if (dispatch) dispatch(tr.scrollIntoView())
  return true
}

/* ── Helpers ──────────────────────────────────────────────── */

/**
 * Walk up the resolved position to find a list item node depth.
 */
function findListItemDepth($pos: any): number | null {
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth)
    if (node.type.name === "listItem" || node.type.name === "taskItem") {
      return depth
    }
  }
  return null
}
