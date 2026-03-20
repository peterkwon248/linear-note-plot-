import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { WikiQuoteNode } from "./WikiQuoteNode"

export const WikiQuoteExtension = Node.create({
  name: "wikiQuote",
  group: "block",
  atom: true, // not editable inline — treated as single unit

  addAttributes() {
    return {
      sourceNoteId: { default: null },
      sourceTitle: { default: "" },
      quotedText: { default: "" },
      quotedAt: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="wikiQuote"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "wikiQuote" }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(WikiQuoteNode)
  },
})
