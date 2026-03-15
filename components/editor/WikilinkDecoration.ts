import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import type { EditorState } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import type { EditorView } from "@tiptap/pm/view"
import { usePlotStore } from "@/lib/store"

const wikilinkDecoKey = new PluginKey("wikilinkDecoration")

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
          handleClick(_view: EditorView, _pos: number, event: MouseEvent) {
            const target = event.target as HTMLElement
            if (!target.classList?.contains("wikilink")) return false

            const title = target.getAttribute("data-wikilink")
            if (!title) return false

            const store = usePlotStore.getState()

            // Try title match first
            const note = store.notes.find(
              (n) =>
                n.title.toLowerCase() === title.toLowerCase() &&
                !n.archived &&
                !n.trashed
            )
            if (note) {
              store.setSelectedNoteId(note.id)
              return true
            }

            // Try alias match
            const aliasNote = store.notes.find(
              (n) =>
                !n.archived &&
                !n.trashed &&
                n.aliases?.some(
                  (a) => a.toLowerCase() === title.toLowerCase()
                )
            )
            if (aliasNote) {
              store.setSelectedNoteId(aliasNote.id)
              return true
            }

            // Dangling link — create wiki stub and navigate
            const newId = store.createWikiStub(title)
            if (newId) store.setSelectedNoteId(newId)
            return true
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
    if (note.archived || note.trashed) continue
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

      decorations.push(
        Decoration.inline(from, to, {
          class: exists
            ? "wikilink wikilink-exists"
            : "wikilink wikilink-dangling",
          "data-wikilink": innerTitle,
        })
      )
    }
  })

  return DecorationSet.create(state.doc, decorations)
}
