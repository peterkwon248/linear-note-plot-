import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

const currentLineHighlightKey = new PluginKey("currentLineHighlight")

export const CurrentLineHighlightExtension = Extension.create<{
  enabledRef: { current: boolean }
}>({
  name: "currentLineHighlight",

  addOptions() {
    return {
      enabledRef: { current: true },
    }
  },

  addProseMirrorPlugins() {
    const { enabledRef } = this.options

    return [
      new Plugin({
        key: currentLineHighlightKey,
        state: {
          init(_, state) {
            return computeDecorations(state, enabledRef)
          },
          apply(tr, oldDecoSet, _oldState, newState) {
            if (!tr.selectionSet && !tr.docChanged) return oldDecoSet
            return computeDecorations(newState, enabledRef)
          },
        },
        props: {
          decorations(state) {
            return currentLineHighlightKey.getState(state)
          },
        },
      }),
    ]
  },
})

function computeDecorations(
  state: import("@tiptap/pm/state").EditorState,
  enabledRef: { current: boolean }
): DecorationSet {
  if (!enabledRef.current) return DecorationSet.empty

  const { selection } = state
  if (!selection.empty) return DecorationSet.empty

  const $pos = state.doc.resolve(selection.from)

  // Walk up to find the nearest textblock (paragraph, heading, etc.)
  // Skip code blocks — they already have their own background color
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth)
    if (node.type.name === "codeBlock") return DecorationSet.empty
    if (node.isTextblock) {
      const start = $pos.before(depth)
      const end = $pos.after(depth)
      const decoration = Decoration.node(start, end, {
        class: "current-line-highlight",
      })
      return DecorationSet.create(state.doc, [decoration])
    }
  }

  return DecorationSet.empty
}
