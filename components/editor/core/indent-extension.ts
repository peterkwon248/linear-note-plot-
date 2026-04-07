import { Extension } from "@tiptap/core"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      increaseIndent: () => ReturnType
      decreaseIndent: () => ReturnType
    }
  }
}

export const IndentExtension = Extension.create({
  name: "indent",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => parseInt(element.getAttribute("data-indent") || "0", 10),
            renderHTML: (attributes) => {
              if (!attributes.indent) return {}
              return {
                "data-indent": attributes.indent,
                style: `margin-left: ${attributes.indent * 24}px`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      increaseIndent: () => ({ tr, state, dispatch }) => {
        const { from, to } = state.selection
        let changed = false
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (node.type.name === "paragraph" || node.type.name === "heading") {
            const current = node.attrs.indent || 0
            if (current < 8) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: current + 1 })
              changed = true
            }
          }
        })
        if (changed && dispatch) dispatch(tr)
        return changed
      },
      decreaseIndent: () => ({ tr, state, dispatch }) => {
        const { from, to } = state.selection
        let changed = false
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (node.type.name === "paragraph" || node.type.name === "heading") {
            const current = node.attrs.indent || 0
            if (current > 0) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: current - 1 })
              changed = true
            }
          }
        })
        if (changed && dispatch) dispatch(tr)
        return changed
      },
    }
  },
})
