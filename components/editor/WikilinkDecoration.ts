import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import type { EditorState } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import type { EditorView } from "@tiptap/pm/view"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"

const wikilinkDecoKey = new PluginKey("wikilinkDecoration")

// ── Dropdown singleton ────────────────────────────────────────────────

let dropdownEl: HTMLDivElement | null = null

function hideDropdown() {
  if (dropdownEl) {
    dropdownEl.style.display = "none"
  }
}

function showNavDropdown(anchor: HTMLElement, noteId: string) {
  if (!dropdownEl) {
    dropdownEl = document.createElement("div")
    dropdownEl.className = "wikilink-dropdown"
    document.body.appendChild(dropdownEl)

    // Close on outside click
    document.addEventListener("mousedown", (e) => {
      if (dropdownEl && !dropdownEl.contains(e.target as Node)) {
        hideDropdown()
      }
    })
  }

  dropdownEl.innerHTML = ""

  const peekBtn = document.createElement("button")
  peekBtn.className = "wikilink-dropdown-btn"
  peekBtn.textContent = "Peek"
  peekBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    usePlotStore.getState().openSidePeek(noteId)
    hideDropdown()
  })

  const openBtn = document.createElement("button")
  openBtn.className = "wikilink-dropdown-btn"
  openBtn.textContent = "Open"
  openBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    setActiveRoute("/notes")
    usePlotStore.getState().openNote(noteId)
    hideDropdown()
  })

  dropdownEl.appendChild(peekBtn)
  dropdownEl.appendChild(openBtn)

  // Position below icon
  const rect = anchor.getBoundingClientRect()
  dropdownEl.style.display = "flex"
  dropdownEl.style.position = "fixed"
  dropdownEl.style.zIndex = "9999"
  dropdownEl.style.left = `${rect.left}px`
  dropdownEl.style.top = `${rect.bottom + 4}px`
}

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

            // In edit mode, let cursor placement happen
            if (view.editable) return false

            // Read mode: navigate directly
            const store = usePlotStore.getState()

            const note = store.notes.find(
              (n) =>
                n.title.toLowerCase() === title.toLowerCase() &&
                !n.trashed
            )
            if (note) {
              setActiveRoute("/notes")
              store.openNoteInTab(note.id)
              return true
            }

            const aliasNote = store.notes.find(
              (n) =>
                !n.trashed &&
                n.aliases?.some((a) => a.toLowerCase() === title.toLowerCase())
            )
            if (aliasNote) {
              setActiveRoute("/notes")
              store.openNoteInTab(aliasNote.id)
              return true
            }

            // Dangling link in read mode: create stub and navigate
            const newId = store.createWikiStub(title, [], "red-link")
            if (newId) store.openNoteInTab(newId)
            return true
          },

          handleDOMEvents: {
            click(_view: EditorView, event: MouseEvent) {
              const navIcon = (event.target as HTMLElement).closest(".wikilink-nav-icon") as HTMLElement | null
              if (navIcon) {
                const title = navIcon.getAttribute("data-wikilink-nav")
                if (!title) return false

                const store = usePlotStore.getState()
                const note = store.notes.find(
                  (n) =>
                    !n.trashed &&
                    (n.title.toLowerCase() === title.toLowerCase() ||
                      n.aliases?.some((a) => a.toLowerCase() === title.toLowerCase()))
                )
                if (!note) return false

                // Show dropdown menu at icon position
                showNavDropdown(navIcon, note.id)
                event.preventDefault()
                event.stopPropagation()
                return true
              }

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

      if (exists) {
        decorations.push(
          Decoration.widget(to, () => {
            const icon = document.createElement("span")
            icon.className = "wikilink-nav-icon"
            icon.setAttribute("data-wikilink-nav", innerTitle)
            icon.innerHTML = "⎘"
            icon.title = "Open link"
            return icon
          }, { side: 1 })
        )
      }
    }
  })

  return DecorationSet.create(state.doc, decorations)
}
