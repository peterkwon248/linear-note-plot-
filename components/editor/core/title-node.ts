import { Node, mergeAttributes } from "@tiptap/core"

export const TitleNode = Node.create({
  name: "title",

  // Must be at the top of the document
  group: "title",
  content: "inline*",

  // Cannot be deleted - always exactly one
  defining: true,

  parseHTML() {
    return [{ tag: "h1[data-type='title']" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "h1",
      mergeAttributes(HTMLAttributes, {
        "data-type": "title",
        class: "text-title font-semibold text-foreground outline-none",
      }),
      0,
    ]
  },

  addKeyboardShortcuts() {
    return {
      // Enter in title → move cursor to first body paragraph
      Enter: ({ editor }) => {
        if (editor.state.selection.$from.parent.type.name === "title") {
          // Find the first node after title and set cursor there
          const titleEnd = editor.state.doc.firstChild?.nodeSize ?? 0
          const afterTitle = titleEnd
          // If there's content after title, move to it. Otherwise create a paragraph.
          if (editor.state.doc.childCount > 1) {
            editor.commands.setTextSelection(afterTitle + 1)
          } else {
            editor
              .chain()
              .insertContentAt(afterTitle, { type: "paragraph" })
              .setTextSelection(afterTitle + 1)
              .run()
          }
          return true
        }
        return false
      },
      // Backspace in title at pos 0 → prevent deletion
      // Backspace in first body node at pos 0 when empty → move cursor to title end
      Backspace: ({ editor }) => {
        const { selection } = editor.state
        const { $from } = selection

        // In title at position 0 → block (can't delete title)
        if ($from.parent.type.name === "title" && $from.parentOffset === 0) {
          return true
        }

        // In first body node (right after title), at position 0, and node is empty
        // → move cursor to end of title
        if (
          $from.parent.type.name !== "title" &&
          $from.parentOffset === 0
        ) {
          const titleNode = editor.state.doc.firstChild
          if (!titleNode || titleNode.type.name !== "title") return false

          // Check if we're in the first body node (index 1 in doc)
          const resolvedPos = editor.state.doc.resolve($from.before($from.depth))
          const indexInDoc = resolvedPos.index(0)

          if (indexInDoc === 1 && $from.parent.textContent === "") {
            // Delete the empty paragraph and move cursor to end of title
            const titleEnd = titleNode.nodeSize - 1 // position at end of title content
            editor
              .chain()
              .deleteNode($from.parent.type)
              .setTextSelection(titleEnd)
              .run()
            return true
          }

          // First body node, position 0, but has content → merge into title
          if (indexInDoc === 1) {
            const titleEnd = titleNode.nodeSize - 1
            editor.commands.setTextSelection(titleEnd)
            return true
          }
        }

        return false
      },
    }
  },
})
