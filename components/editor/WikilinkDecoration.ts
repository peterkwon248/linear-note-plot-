import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import type { EditorState } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import type { EditorView } from "@tiptap/pm/view"
import { usePlotStore } from "@/lib/store"

const wikilinkDecoKey = new PluginKey("wikilinkDecoration")

// ── Popover singleton ────────────────────────────────────────────────

let popoverEl: HTMLDivElement | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null
let showTimer: ReturnType<typeof setTimeout> | null = null

function getPopover(): HTMLDivElement {
  if (!popoverEl) {
    popoverEl = document.createElement("div")
    popoverEl.className = "wikilink-popover"
    popoverEl.style.cssText = [
      "position: fixed",
      "z-index: 9999",
      "display: none",
      "pointer-events: auto",
    ].join(";")

    // Keep popover visible when mouse is over it
    popoverEl.addEventListener("mouseenter", () => {
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
    })
    popoverEl.addEventListener("mouseleave", () => {
      scheduleHide()
    })

    document.body.appendChild(popoverEl)
  }
  return popoverEl
}

function scheduleHide() {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    if (popoverEl) popoverEl.style.display = "none"
    hideTimer = null
  }, 200)
}

function cancelHide() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function cancelShow() {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
}

function extractPlainText(note: { content?: string; contentJson?: Record<string, unknown> | null }): string {
  // Try contentJson first — extract text nodes recursively
  if (note.contentJson) {
    const texts: string[] = []
    function walk(node: unknown) {
      if (!node || typeof node !== "object") return
      const n = node as Record<string, unknown>
      if (n.type === "text" && typeof n.text === "string") {
        texts.push(n.text)
      }
      if (Array.isArray(n.content)) {
        for (const child of n.content) walk(child)
      }
    }
    walk(note.contentJson)
    return texts.join(" ").trim()
  }
  return (note.content ?? "").trim()
}

function showPopover(target: HTMLElement, title: string, isDangling: boolean) {
  const store = usePlotStore.getState()
  const popover = getPopover()

  cancelHide()

  // Find note (title or alias)
  const note = isDangling
    ? null
    : store.notes.find(
        (n) =>
          !n.archived &&
          !n.trashed &&
          (n.title.toLowerCase() === title.toLowerCase() ||
            n.aliases?.some((a) => a.toLowerCase() === title.toLowerCase()))
      )

  // Build preview text
  const previewText = note ? extractPlainText(note) : ""
  const previewLines = previewText
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ")
  const preview =
    previewLines.length > 100 ? previewLines.slice(0, 100) + "…" : previewLines

  // Render popover content
  popover.innerHTML = `
    <div class="wikilink-popover-inner">
      <div class="wikilink-popover-title ${isDangling ? "wikilink-popover-title-dangling" : ""}">
        ${escapeHtml(title)}
      </div>
      ${preview ? `<div class="wikilink-popover-preview">${escapeHtml(preview)}</div>` : ""}
      <div class="wikilink-popover-actions">
        ${
          isDangling
            ? `<button class="wikilink-popover-btn wikilink-popover-btn-create" data-wikilink-action="create" data-wikilink-title="${escapeAttr(title)}">Create Wiki</button>`
            : `<button class="wikilink-popover-btn" data-wikilink-action="peek" data-wikilink-noteid="${note ? escapeAttr(note.id) : ""}">Peek</button>
               <button class="wikilink-popover-btn" data-wikilink-action="open" data-wikilink-noteid="${note ? escapeAttr(note.id) : ""}">Open</button>`
        }
      </div>
    </div>
  `

  // Position below the wikilink element
  const rect = target.getBoundingClientRect()
  popover.style.display = "block"
  // Temporarily show off-screen to measure
  popover.style.visibility = "hidden"
  popover.style.left = "0"
  popover.style.top = "0"

  const popRect = popover.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = rect.left
  let top = rect.bottom + 6

  // Clamp horizontally
  if (left + popRect.width > vw - 8) {
    left = vw - popRect.width - 8
  }
  if (left < 8) left = 8

  // Flip above if not enough room below
  if (top + popRect.height > vh - 8) {
    top = rect.top - popRect.height - 6
  }

  popover.style.left = left + "px"
  popover.style.top = top + "px"
  popover.style.visibility = "visible"
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

// Global click handler for popover buttons (attached once)
let popoverClickBound = false
function ensurePopoverClickHandler() {
  if (popoverClickBound) return
  popoverClickBound = true
  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-wikilink-action]") as HTMLElement | null
    if (!btn) return
    const action = btn.getAttribute("data-wikilink-action")
    const store = usePlotStore.getState()

    if (action === "peek") {
      const noteId = btn.getAttribute("data-wikilink-noteid")
      if (noteId) store.setSidePeekNoteId(noteId)
    } else if (action === "open") {
      const noteId = btn.getAttribute("data-wikilink-noteid")
      if (noteId) store.openNoteInTab(noteId)
    } else if (action === "create") {
      const title = btn.getAttribute("data-wikilink-title") ?? ""
      if (title) {
        const newId = store.createWikiStub(title)
        if (newId) store.openNoteInTab(newId)
      }
    }

    if (popoverEl) popoverEl.style.display = "none"
  })
}

// ── Extension ────────────────────────────────────────────────────────

export const WikilinkDecorationExtension = Extension.create({
  name: "wikilinkDecoration",

  addProseMirrorPlugins() {
    ensurePopoverClickHandler()

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

            // In edit mode, let cursor placement happen — popover handles navigation
            if (view.editable) return false

            // Read mode: navigate directly
            const store = usePlotStore.getState()

            const note = store.notes.find(
              (n) =>
                n.title.toLowerCase() === title.toLowerCase() &&
                !n.archived &&
                !n.trashed
            )
            if (note) {
              store.openNoteInTab(note.id)
              return true
            }

            const aliasNote = store.notes.find(
              (n) =>
                !n.archived &&
                !n.trashed &&
                n.aliases?.some((a) => a.toLowerCase() === title.toLowerCase())
            )
            if (aliasNote) {
              store.openNoteInTab(aliasNote.id)
              return true
            }

            // Dangling link in read mode: create stub and navigate
            const newId = store.createWikiStub(title)
            if (newId) store.openNoteInTab(newId)
            return true
          },

          handleDOMEvents: {
            click(_view: EditorView, event: MouseEvent) {
              const target = event.target as HTMLElement
              if (!target.classList?.contains("wikilink-nav-icon")) return false

              const title = target.getAttribute("data-wikilink-nav")
              if (!title) return false

              const store = usePlotStore.getState()
              const note = store.notes.find(
                (n) =>
                  !n.archived &&
                  !n.trashed &&
                  (n.title.toLowerCase() === title.toLowerCase() ||
                    n.aliases?.some((a) => a.toLowerCase() === title.toLowerCase()))
              )

              if (note) {
                store.setSidePeekNoteId(note.id)
              }

              event.preventDefault()
              event.stopPropagation()
              return true
            },

            mouseover(view: EditorView, event: MouseEvent) {
              // Only show popover in edit mode
              if (!view.editable) return false

              const target = (event.target as HTMLElement).closest(".wikilink") as HTMLElement | null
              if (!target) return false

              const title = target.getAttribute("data-wikilink")
              if (!title) return false

              const isDangling = target.classList.contains("wikilink-dangling")

              cancelShow()
              cancelHide()

              showTimer = setTimeout(() => {
                showPopover(target, title, isDangling)
                showTimer = null
              }, 150)

              return false
            },

            mouseout(view: EditorView, event: MouseEvent) {
              if (!view.editable) return false

              const target = event.target as HTMLElement
              if (!target.classList?.contains("wikilink")) return false

              // Don't hide if mouse moved to popover
              const related = event.relatedTarget as HTMLElement | null
              if (related && popoverEl && popoverEl.contains(related)) {
                cancelShow()
                return false
              }

              cancelShow()
              scheduleHide()
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

      if (exists) {
        const icon = document.createElement("span")
        icon.className = "wikilink-nav-icon"
        icon.setAttribute("data-wikilink-nav", innerTitle)
        icon.textContent = "↗"
        icon.title = "Open"

        decorations.push(
          Decoration.widget(to, icon, { side: 1 })
        )
      }
    }
  })

  return DecorationSet.create(state.doc, decorations)
}
