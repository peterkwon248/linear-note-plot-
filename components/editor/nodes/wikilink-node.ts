import { Node, mergeAttributes } from "@tiptap/core"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"

/**
 * WikilinkNode — Inline atom node for [[wikilinks]].
 *
 * Replaces the old text-based WikilinkDecoration approach.
 * As an atom node, the cursor cannot enter inside — it behaves like a single character.
 *
 * Attributes:
 *   title       — Display title (e.g. "Fleeting Note")
 *   linkType    — "note" | "wiki" (determines visual style)
 *   targetId    — Resolved target note/wiki ID (nullable)
 *   anchorId    — Target anchor's ID for deep-linking (nullable)
 *   anchorLabel — Display label for the anchor (e.g. "API Design") (nullable)
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
      anchorId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-anchor-id") || null,
        renderHTML: (attrs: Record<string, any>) =>
          attrs.anchorId ? { "data-anchor-id": attrs.anchorId } : {},
      },
      anchorLabel: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-anchor-label") || null,
        renderHTML: (attrs: Record<string, any>) =>
          attrs.anchorLabel ? { "data-anchor-label": attrs.anchorLabel } : {},
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
    const anchorLabel = node.attrs.anchorLabel || null

    if (anchorLabel) {
      // Render with two child spans: title + muted anchor fragment
      return [
        "span",
        mergeAttributes(HTMLAttributes, {
          "data-type": "wikilink",
          class: `wikilink-node wikilink-${linkType}`,
        }),
        ["span", { class: "wikilink-title" }, title],
        ["span", { class: "wikilink-anchor-fragment" }, `#${anchorLabel}`],
      ]
    }

    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "wikilink",
        class: `wikilink-node wikilink-${linkType}`,
      }),
      title,
    ]
  },

  // Plain text export: [[title]] or [[wiki:title]], with optional #anchorLabel
  renderText({ node }: { node: ProseMirrorNode }) {
    const prefix = node.attrs.linkType === "wiki" ? "wiki:" : ""
    const anchorLabel = node.attrs.anchorLabel
    const titlePart = anchorLabel
      ? `${node.attrs.title}#${anchorLabel}`
      : node.attrs.title
    return `[[${prefix}${titlePart}]]`
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
