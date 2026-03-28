/**
 * Block Drag Plugin
 *
 * Custom ProseMirror plugin that enables drag-and-drop for ALL block nodes
 * via `[data-drag-handle]` elements.
 *
 * Two mechanisms:
 * 1. NodeView-based handles — custom nodes (tocBlock, calloutBlock, etc.)
 *    already render their own `[data-drag-handle]` inside a NodeView wrapper.
 * 2. Decoration-based handles — for regular blocks (paragraph, heading,
 *    bulletList, etc.) a widget decoration injects a drag handle at the
 *    start of each top-level block.
 *
 * Both share the same mousedown → drag → drop pipeline.
 */

import { Extension } from "@tiptap/core"
import { Plugin, PluginKey, NodeSelection, TextSelection } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import type { EditorView } from "@tiptap/pm/view"
import type { Node as PmNode } from "@tiptap/pm/model"

const blockDragKey = new PluginKey("blockDrag")
const blockHandleDecoKey = new PluginKey("blockHandleDecorations")

interface DragState {
  dragging: { pos: number; node: PmNode | null } | null
}

/** Module-level backup — survives plugin state resets from intermediate transactions */
let activeDrag: { pos: number; node: PmNode } | null = null

/** Nodes that already have their own drag handles via NodeView */
const SKIP_TYPES = new Set([
  "tocBlock",
  "calloutBlock",
  "sectionBlock",
  "contentBlock",
  "summaryBlock",
  "columnsBlock",
  "noteEmbed",
  "infoboxBlock",
  "title", // title node should never be draggable
])

/**
 * Walk up from the resolved position to find the nearest block-level node
 * that belongs to a NodeView (i.e., a node that has `group: "block"` or
 * is marked `draggable`).
 */
function findBlockNode(
  view: EditorView,
  wrapperEl: HTMLElement,
): { pos: number; node: NonNullable<ReturnType<EditorView["state"]["doc"]["nodeAt"]>> } | null {
  let pos: number
  try {
    pos = view.posAtDOM(wrapperEl, 0)
  } catch {
    return null
  }

  const $pos = view.state.doc.resolve(pos)

  // Walk from deepest depth upward to find the block node that owns this wrapper
  for (let d = $pos.depth; d >= 1; d--) {
    const node = $pos.node(d)
    const nodeSpec = node.type.spec

    // Match wrapper/block nodes that have NodeViews (draggable or group "block" with content)
    if (
      nodeSpec.draggable ||
      (nodeSpec.group?.includes("block") && nodeSpec.content && nodeSpec.content !== "inline*")
    ) {
      return { pos: $pos.before(d), node }
    }
  }

  return null
}

/**
 * Given a drop coordinate, find the block-level insertion position
 * (i.e., between sibling blocks, not inside a text node).
 */
function resolveDropPosition(view: EditorView, coords: { left: number; top: number }): number | null {
  const { doc } = view.state

  // Simple approach: walk top-level doc children, use DOM rects to find drop gap.
  // This avoids posAtCoords→coordsAtPos round-trip issues at node boundaries.
  let offset = 0

  for (let i = 0; i < doc.childCount; i++) {
    const child = doc.child(i)
    const childStart = offset

    // Skip title — never drop before it
    if (child.type.name === "title") {
      offset += child.nodeSize
      continue
    }

    // Try to get DOM rect for this block
    let midY: number | null = null
    try {
      const dom = view.nodeDOM(childStart)
      if (dom && dom instanceof HTMLElement) {
        const rect = dom.getBoundingClientRect()
        midY = (rect.top + rect.bottom) / 2
      }
    } catch { /* ignore */ }

    // Fallback: try coordsAtPos (one position inside the node to avoid boundary issues)
    if (midY === null) {
      try {
        const startCoords = view.coordsAtPos(childStart + 1)
        const endCoords = view.coordsAtPos(childStart + child.nodeSize - 1)
        midY = (startCoords.top + endCoords.bottom) / 2
      } catch { /* ignore */ }
    }

    if (midY !== null && coords.top < midY) {
      return childStart
    }

    offset += child.nodeSize
  }

  // Past all children → insert at the end
  return offset
}

/**
 * Shared drag setup — used by both NodeView-based and decoration-based handles.
 * Makes the HANDLE itself draggable (not the wrapper) to avoid ProseMirror
 * intercepting drag events on contentEditable elements.
 * The ghost image is cloned from the wrapper for visual feedback.
 */
function setupDrag(
  view: EditorView,
  handleEl: HTMLElement,
  wrapperEl: HTMLElement,
  blockPos: number,
  blockNode: PmNode,
) {
  // Make the handle itself draggable — not the wrapper.
  // ProseMirror intercepts drag on contentEditable block elements,
  // but handles are contentEditable=false so the browser respects draggable.
  handleEl.draggable = true
  activeDrag = { pos: blockPos, node: blockNode }

  // Store drag info in plugin state
  const tr = view.state.tr.setMeta(blockDragKey, {
    dragging: { pos: blockPos, node: blockNode },
  } satisfies DragState)
  view.dispatch(tr)

  // Show drag-mode visual indicators
  const editorContainer = view.dom.parentElement
  if (editorContainer) editorContainer.classList.add("drag-mode")

  // dragstart handler — fires on the handle when native drag begins
  const handleDragStart = (e: DragEvent) => {
    if (!e.dataTransfer) return

    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("application/x-block-drag", "true")

    // Create a semi-transparent ghost from the WRAPPER (the actual block)
    const ghost = wrapperEl.cloneNode(true) as HTMLElement
    ghost.style.position = "absolute"
    ghost.style.top = "-9999px"
    ghost.style.left = "-9999px"
    ghost.style.opacity = "0.65"
    ghost.style.width = `${wrapperEl.offsetWidth}px`
    ghost.style.pointerEvents = "none"
    ghost.style.zIndex = "-1"
    document.body.appendChild(ghost)

    e.dataTransfer.setDragImage(ghost, 20, 12)

    // Remove ghost after the browser has captured it
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost)
      })
    })

    // Select the node visually during drag
    try {
      const sel = NodeSelection.create(view.state.doc, blockPos)
      view.dispatch(view.state.tr.setSelection(sel))
    } catch {
      // Some nodes may not support NodeSelection — fine
    }
  }

  handleEl.addEventListener("dragstart", handleDragStart, { once: true })

  // dragend handler — clean up regardless of drop success
  const handleDragEnd = () => {
    activeDrag = null
    handleEl.draggable = false
    // Remove drag-mode visual indicators
    const ec = view.dom.parentElement
    if (ec) ec.classList.remove("drag-mode")
    // Clear plugin state
    try {
      const endTr = view.state.tr.setMeta(blockDragKey, {
        dragging: null,
      } satisfies DragState)
      view.dispatch(endTr)
    } catch {
      // Editor may have been destroyed
    }
  }

  handleEl.addEventListener("dragend", handleDragEnd, { once: true })
}

/** Wrapper block types that support double-Enter escape */
const WRAPPER_TYPES = new Set([
  "contentBlock",
  "sectionBlock",
  "calloutBlock",
  "summaryBlock",
])

export const BlockDragPlugin = Extension.create({
  name: "blockDrag",

  addKeyboardShortcuts() {
    return {
      // Double-Enter escape: empty paragraph at end of wrapper block → exit block
      Enter: ({ editor }) => {
        const { $from, empty } = editor.state.selection
        if (!empty) return false

        // Must be in an empty paragraph
        if ($from.parent.type.name !== "paragraph" || $from.parent.textContent !== "") return false

        // Must be inside a wrapper block
        const wrapperDepth = $from.depth - 1
        if (wrapperDepth < 1) return false
        const wrapper = $from.node(wrapperDepth)
        if (!WRAPPER_TYPES.has(wrapper.type.name)) return false

        // Must be the LAST child of the wrapper
        const indexInWrapper = $from.index(wrapperDepth)
        if (indexInWrapper < wrapper.childCount - 1) return false

        const wrapperPos = $from.before(wrapperDepth)
        const { tr } = editor.state

        if (wrapper.childCount === 1) {
          // Only child is this empty paragraph → unwrap (replace block with paragraph)
          tr.replaceWith(
            wrapperPos,
            wrapperPos + wrapper.nodeSize,
            editor.state.schema.nodes.paragraph.create(),
          )
          tr.setSelection(TextSelection.create(tr.doc, wrapperPos + 1))
        } else {
          // Delete the empty last paragraph and insert after wrapper
          const emptyParaPos = $from.before($from.depth)
          const afterWrapper = wrapperPos + wrapper.nodeSize

          tr.delete(emptyParaPos, $from.after($from.depth))
          const mappedAfter = tr.mapping.map(afterWrapper)
          tr.insert(mappedAfter, editor.state.schema.nodes.paragraph.create())
          tr.setSelection(TextSelection.create(tr.doc, mappedAfter + 1))
        }

        editor.view.dispatch(tr)
        return true
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      // Plugin 1: Core drag-and-drop state + event handling
      new Plugin({
        key: blockDragKey,

        state: {
          init(): DragState {
            return { dragging: null }
          },
          apply(tr, value): DragState {
            const meta = tr.getMeta(blockDragKey)
            if (meta !== undefined) return meta
            return value
          },
        },

        props: {
          handleDOMEvents: {
            mousedown(view: EditorView, event: MouseEvent) {
              const target = event.target as HTMLElement
              if (!target?.closest) return false

              const handle = target.closest("[data-drag-handle]") as HTMLElement | null
              if (!handle) return false

              // ── Case 1: Decoration-based handle (regular blocks) ──
              if (handle.hasAttribute("data-block-handle")) {
                const parentBlock = handle.parentElement
                if (!parentBlock || parentBlock === view.dom) return false

                let pos: number
                try {
                  pos = view.posAtDOM(parentBlock, 0)
                } catch {
                  return false
                }

                // Resolve to the top-level block start
                const $pos = view.state.doc.resolve(pos)
                const depth = Math.min($pos.depth, 1)
                const blockPos = $pos.before(depth || 1)
                const blockNode = view.state.doc.nodeAt(blockPos)

                if (!blockNode) return false

                setupDrag(view, handle, parentBlock, blockPos, blockNode)
                return false
              }

              // ── Case 2: NodeView-based handle (custom nodes) ──
              const wrapper =
                handle.closest("[data-node-view-wrapper]") ??
                handle.closest(".node-view-wrapper") ??
                handle.closest("[class*='node-']")

              if (!wrapper) return false

              const wrapperEl = wrapper as HTMLElement

              // Resolve the ProseMirror block node
              const found = findBlockNode(view, wrapperEl)
              if (!found) return false

              setupDrag(view, handle, wrapperEl, found.pos, found.node)

              // Don't prevent default — let native drag initiate
              return false
            },

            dragover(view: EditorView, event: DragEvent) {
              const state = blockDragKey.getState(view.state) as DragState | undefined
              if (!state?.dragging) return false

              // Allow the drop
              event.preventDefault()
              if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "move"
              }

              // Return false so TipTap's Dropcursor extension can show the indicator
              return false
            },

            drop(view: EditorView, event: DragEvent) {
              // Check plugin state first, fall back to module-level backup
              const state = blockDragKey.getState(view.state) as DragState | undefined
              const dragInfo = state?.dragging ?? activeDrag
              if (!dragInfo) return false

              event.preventDefault()
              event.stopPropagation()

              const { pos: sourcePos, node: sourceNode } = dragInfo
              if (!sourceNode) {
                activeDrag = null
                return true
              }

              // Resolve drop position
              const dropPos = resolveDropPosition(view, {
                left: event.clientX,
                top: event.clientY,
              })

              if (dropPos === null) {
                activeDrag = null
                return true
              }

              // Verify the source node still exists at the expected position
              const currentNode = view.state.doc.nodeAt(sourcePos)
              if (!currentNode || currentNode.type.name !== sourceNode.type.name) {
                activeDrag = null
                return true
              }

              const sourceEnd = sourcePos + currentNode.nodeSize

              // Don't drop onto self (source range contains the drop position)
              if (dropPos >= sourcePos && dropPos <= sourceEnd) {
                activeDrag = null
                return true
              }

              // Build the move transaction
              const { tr } = view.state

              if (dropPos < sourcePos) {
                // Dropping BEFORE the source: insert first, then delete (positions shift right)
                tr.insert(dropPos, currentNode.copy(currentNode.content))
                // After insertion, source position shifted by the size of inserted node
                const shiftedSourcePos = sourcePos + currentNode.nodeSize
                tr.delete(shiftedSourcePos, shiftedSourcePos + currentNode.nodeSize)
              } else {
                // Dropping AFTER the source: delete first, then insert (positions shift left)
                tr.delete(sourcePos, sourceEnd)
                // After deletion, drop position shifts left by the deleted node size
                const mappedDropPos = tr.mapping.map(dropPos)
                tr.insert(mappedDropPos, currentNode.copy(currentNode.content))
              }

              // Clear drag state
              tr.setMeta(blockDragKey, { dragging: null } satisfies DragState)
              activeDrag = null

              // Remove drag-mode visual indicators
              const dropEc = view.dom.parentElement
              if (dropEc) dropEc.classList.remove("drag-mode")

              view.dispatch(tr)
              return true
            },

            dragend(view: EditorView, _event: DragEvent) {
              activeDrag = null
              const state = blockDragKey.getState(view.state) as DragState | undefined
              if (!state?.dragging) return false

              // Remove drag-mode visual indicators
              const endEc = view.dom.parentElement
              if (endEc) endEc.classList.remove("drag-mode")

              // Clear drag state on dragend (safety net)
              const tr = view.state.tr.setMeta(blockDragKey, {
                dragging: null,
              } satisfies DragState)
              view.dispatch(tr)
              return false
            },
          },
        },
      }),

      // Plugin 2: Widget decorations — inject drag handles for regular blocks
      new Plugin({
        key: blockHandleDecoKey,
        props: {
          decorations(state) {
            const { doc } = state
            const decorations: Decoration[] = []

            doc.forEach((node, offset) => {
              if (SKIP_TYPES.has(node.type.name)) return

              const handle = document.createElement("span")
              handle.setAttribute("data-drag-handle", "")
              handle.setAttribute("data-block-handle", "")
              handle.className = "block-drag-handle"
              handle.textContent = "\u2807" // ⠇ braille pattern (vertical dots)
              handle.contentEditable = "false"

              decorations.push(
                Decoration.widget(offset, handle, {
                  side: -1,
                  key: `block-handle-${offset}`,
                }),
              )
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})
