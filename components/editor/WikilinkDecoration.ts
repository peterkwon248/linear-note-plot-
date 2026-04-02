import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import type { EditorState } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import type { EditorView } from "@tiptap/pm/view"
import { usePlotStore } from "@/lib/store"
import { handleWikilinkClick } from "@/lib/note-reference-actions"
import { showNotePreviewByTitle, hideNotePreview } from "@/components/editor/note-hover-preview"

const wikilinkDecoKey = new PluginKey("wikilinkDecoration")

// ── Extension ────────────────────────────────────────────────────────

export const WikilinkDecorationExtension = Extension.create({
  name: "wikilinkDecoration",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: wikilinkDecoKey,
        state: {
          init(_, state) {
            return computeWikilinkDecorations(state)
          },
          apply(tr, oldSet, _oldState, newState) {
            if (!tr.docChanged) return oldSet
            return computeWikilinkDecorations(newState)
          },
        },
        props: {
          decorations(state) {
            return wikilinkDecoKey.getState(state)
          },

          handleClick(view: EditorView, _pos: number, event: MouseEvent) {
            const target = event.target as HTMLElement
            if (!target.classList?.contains("wikilink")) return false

            const title = target.getAttribute("data-wikilink")
            if (!title) return false

            // In edit mode without modifier, let cursor placement happen
            if (view.editable && !event.ctrlKey && !event.metaKey) return false

            handleWikilinkClick(title, event)
            return true
          },

          handleDOMEvents: {
            mouseover(_view: EditorView, event: MouseEvent) {
              const target = event.target as HTMLElement
              if (!target.classList?.contains("wikilink")) return false

              const title = target.getAttribute("data-wikilink")
              if (!title) return false

              showNotePreviewByTitle(target, title)
              return false // don't prevent default
            },

            mouseout(_view: EditorView, event: MouseEvent) {
              const target = event.target as HTMLElement
              if (!target.classList?.contains("wikilink")) return false

              hideNotePreview()
              return false
            },
          },
        },
      }),
    ]
  },
})

// ── Decoration computation ──────────────────────────────────────────

const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g

function computeWikilinkDecorations(state: EditorState): DecorationSet {
  const decorations: Decoration[] = []

  // Build a lookup set of existing note titles + aliases (lowercased)
  const notes = usePlotStore.getState().notes
  const titleSet = new Set<string>()
  for (const note of notes) {
    if (note.trashed) continue
    if (note.title.trim()) titleSet.add(note.title.toLowerCase())
    if (note.aliases) {
      for (const alias of note.aliases) {
        if (alias.trim()) titleSet.add(alias.toLowerCase())
      }
    }
  }

  state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return

    // Reset regex lastIndex for each text node
    WIKILINK_REGEX.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = WIKILINK_REGEX.exec(node.text)) !== null) {
      const from = pos + match.index
      const to = from + match[0].length
      const innerTitle = match[1]
      const exists = titleSet.has(innerTitle.toLowerCase())

      const bracketClass = "wikilink-bracket"
      const linkClass = exists
        ? "wikilink wikilink-exists"
        : "wikilink wikilink-dangling"

      // [[ bracket — visually hidden
      decorations.push(
        Decoration.inline(from, from + 2, {
          class: bracketClass,
        })
      )

      // title text — styled as link
      decorations.push(
        Decoration.inline(from + 2, to - 2, {
          class: linkClass,
          "data-wikilink": innerTitle,
        })
      )

      // ]] bracket — visually hidden
      decorations.push(
        Decoration.inline(to - 2, to, {
          class: bracketClass,
        })
      )
    }
  })

  return DecorationSet.create(state.doc, decorations)
}
