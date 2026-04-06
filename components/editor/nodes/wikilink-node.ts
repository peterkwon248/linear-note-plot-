import { Node, mergeAttributes } from "@tiptap/core"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"

/**
 * WikilinkNode — Inline atom node for [[wikilinks]].
 *
 * Replaces the old text-based WikilinkDecoration approach.
 * As an atom node, the cursor cannot enter inside — it behaves like a single character.
 *
 * Attributes:
 *   title    — Display title (e.g. "Fleeting Note")
 *   linkType — "note" | "wiki" (determines visual style)
 *   targetId — Resolved target note/wiki ID (nullable)
 */
export const WikilinkNode = Node.create({
  name: "wikilink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      title: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-title") || el.textContent || "",
        renderHTML: (attrs: Record<string, any>) => ({ "data-title": attrs.title }),
      },
      linkType: {
        default: "note",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-link-type") || "note",
        renderHTML: (attrs: Record<string, any>) => ({ "data-link-type": attrs.linkType }),
      },
      targetId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-target-id") || null,
        renderHTML: (attrs: Record<string, any>) =>
          attrs.targetId ? { "data-target-id": attrs.targetId } : {},
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'span[data-type="wikilink"]' },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const title = node.attrs.title || ""
    const linkType = node.attrs.linkType || "note"

    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "wikilink",
        class: `wikilink-node wikilink-${linkType}`,
        "data-hover-preview": "true",
      }),
      title,
    ]
  },

  // Plain text export: [[title]] or [[wiki:title]]
  renderText({ node }: { node: ProseMirrorNode }) {
    const prefix = node.attrs.linkType === "wiki" ? "wiki:" : ""
    return `[[${prefix}${node.attrs.title}]]`
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor
        const { $from } = state.selection
        const nodeBefore = $from.nodeBefore
        if (nodeBefore?.type.name === "wikilink") {
          editor.commands.deleteRange({
            from: $from.pos - nodeBefore.nodeSize,
            to: $from.pos,
          })
          return true
        }
        // If the node itself is selected
        const sel = state.selection as any
        if (sel.node?.type.name === "wikilink") {
          editor.commands.deleteSelection()
          return true
        }
        return false
      },
      Delete: ({ editor }) => {
        const { state } = editor
        const sel = state.selection as any
        if (sel.node?.type.name === "wikilink") {
          editor.commands.deleteSelection()
          return true
        }
        return false
      },
    }
  },
})
