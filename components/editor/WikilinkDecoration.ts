import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import type { EditorState } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import type { EditorView } from "@tiptap/pm/view"
import { usePlotStore } from "@/lib/store"
import { handleWikilinkClick } from "@/lib/note-reference-actions"
import { showNotePreview, showNotePreviewByTitle, hideNotePreview, togglePreviewPin, isPreviewShowing, isPreviewPinned } from "@/components/editor/note-hover-preview"
import { resolveNoteByTitle } from "@/lib/note-reference-actions"
import { isWikiStub } from "@/lib/wiki-utils"

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
            // Skip click handling inside hover preview (use action bar buttons instead)
            if (target.closest?.("[data-hover-preview]")) return false

            const title = target.getAttribute("data-wikilink")
            if (!title) return false

            // In edit mode without modifier key
            if (view.editable && !event.ctrlKey && !event.metaKey) {
              // Dangling links: open create dropdown on plain click
              if (target.classList.contains("wikilink-dangling")) {
                window.dispatchEvent(new CustomEvent("plot:wikilink-context-menu", {
                  detail: { title, x: event.clientX, y: event.clientY }
                }))
                return true
              }
              // Existing links: toggle pin or show+pin
              const resolved = resolveNoteByTitle(title)
              if (!resolved) return false
              if (isPreviewPinned()) {
                // Already pinned → unpin
                togglePreviewPin()
                return true
              }
              if (isPreviewShowing()) {
                // Preview visible → pin it
                togglePreviewPin()
                return true
              }
              // Preview not visible → show immediately + pin after delay
              showNotePreview(target, resolved.id, resolved.type)
              setTimeout(() => togglePreviewPin(), 500)
              return true
            }

            handleWikilinkClick(title, event)
            return true
          },

          handleDOMEvents: {
            mouseover(_view: EditorView, event: MouseEvent) {
              const target = event.target as HTMLElement
              if (!target.classList?.contains("wikilink")) return false
              // Skip hover preview trigger inside hover preview card (prevents recursive preview)
              if (target.closest?.("[data-hover-preview]")) return false

              const title = target.getAttribute("data-wikilink")
              if (!title) return false

              showNotePreviewByTitle(target, title)
              return false // don't prevent default
            },

            mouseout(_view: EditorView, event: MouseEvent) {
              const target = event.target as HTMLElement
              if (!target.classList?.contains("wikilink")) return false
              // Skip inside hover preview card
              if (target.closest?.("[data-hover-preview]")) return false

              hideNotePreview()
              return false
            },

            contextmenu(_view: any, event: MouseEvent) {
              const target = event.target as HTMLElement
              if (!target.classList?.contains("wikilink") && !target.closest?.(".wikilink")) return false
              const wikilinkEl = target.classList.contains("wikilink") ? target : target.closest(".wikilink") as HTMLElement
              const title = wikilinkEl?.getAttribute("data-wikilink")
              if (!title) return false
              event.preventDefault()
              event.stopPropagation()
              window.dispatchEvent(new CustomEvent("plot:wikilink-context-menu", {
                detail: { title, x: event.clientX, y: event.clientY }
              }))
              return true
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
  const store = usePlotStore.getState()
  const notes = store.notes
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

  // Also check WikiArticles
  const wikiArticles = store.wikiArticles ?? []
  const wikiTitleMap = new Map<string, typeof wikiArticles[0]>()
  for (const w of wikiArticles) {
    wikiTitleMap.set(w.title.toLowerCase(), w)
    if (w.aliases) w.aliases.forEach((a: string) => wikiTitleMap.set(a.toLowerCase(), w))
  }

  state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return

    // Reset regex lastIndex for each text node
    WIKILINK_REGEX.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = WIKILINK_REGEX.exec(node.text)) !== null) {
      const from = pos + match.index
      const to = from + match[0].length
      const innerRaw = match[1]

      // Parse "wiki:" prefix for explicit wiki links
      const isExplicitWiki = innerRaw.startsWith("wiki:")
      const innerTitle = isExplicitWiki ? innerRaw.slice(5) : innerRaw
      const lowerTitle = innerTitle.toLowerCase()
      const noteExists = titleSet.has(lowerTitle)
      const wikiArticle = wikiTitleMap.get(lowerTitle)

      const bracketClass = "wikilink-bracket"
      let linkClass: string
      if (isExplicitWiki) {
        // Explicit wiki link via [[wiki:Title]]
        if (wikiArticle) {
          linkClass = isWikiStub(wikiArticle) ? "wikilink wikilink-stub" : "wikilink wikilink-wiki"
        } else {
          linkClass = "wikilink wikilink-dangling"
        }
      } else if (wikiArticle && !noteExists) {
        // Implicit wiki-only link
        linkClass = isWikiStub(wikiArticle) ? "wikilink wikilink-stub" : "wikilink wikilink-wiki"
      } else if (noteExists) {
        linkClass = "wikilink wikilink-exists"
      } else {
        linkClass = "wikilink wikilink-dangling"
      }

      // [[ bracket — visually hidden (includes "wiki:" prefix if present)
      const bracketEnd = from + 2 + (isExplicitWiki ? 5 : 0)
      decorations.push(
        Decoration.inline(from, bracketEnd, {
          class: bracketClass,
        })
      )

      // title text — styled as link
      decorations.push(
        Decoration.inline(bracketEnd, to - 2, {
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
