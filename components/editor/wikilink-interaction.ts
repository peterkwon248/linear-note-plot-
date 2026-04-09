/**
 * WikilinkInteractionExtension — DOM event handlers for wikilink atom nodes.
 *
 * Handles: click (pin preview), hover (show preview), Ctrl+click (navigate),
 * right-click (context menu). Replaces the old WikilinkDecoration handlers.
 */

import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import { usePlotStore } from "@/lib/store"
import { resolveNoteByTitle, handleWikilinkClick } from "@/lib/note-reference-actions"
import {
  showNotePreview,
  showNotePreviewByTitle,
  hideNotePreview,
  togglePreviewPin,
  isPreviewPinned,
  isPreviewShowing,
} from "@/components/editor/note-hover-preview"

export const WikilinkInteractionExtension = Extension.create({
  name: "wikilinkInteraction",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("wikilinkInteraction"),
        props: {
          handleClick(view: EditorView, _pos: number, event: MouseEvent) {
            const target = (event.target as HTMLElement)?.closest(".wikilink-node") as HTMLElement | null
            if (!target) return false
            if (target.closest("[data-hover-preview]")) return false

            const title = target.getAttribute("data-title")
            if (!title) return false
            const linkType = target.getAttribute("data-link-type") || "note"
            const anchorId = target.getAttribute("data-anchor-id") || null

            // Ctrl/Cmd + Click → navigate
            if (event.ctrlKey || event.metaKey) {
              handleWikilinkClick(title, event, anchorId)
              return true
            }

            // Edit mode — regular click
            if (view.editable) {
              // Resolve the target
              let resolved: { id: string; type: "note" | "wiki" } | null = null
              if (linkType === "wiki") {
                const store = usePlotStore.getState()
                const wiki = store.wikiArticles.find(
                  (a) => a.title.toLowerCase() === title.toLowerCase() ||
                    a.aliases.some((al) => al.toLowerCase() === title.toLowerCase())
                )
                if (wiki) resolved = { id: wiki.id, type: "wiki" }
              }
              if (!resolved) resolved = resolveNoteByTitle(title)
              if (!resolved) {
                // Dangling: open context menu
                window.dispatchEvent(new CustomEvent("plot:wikilink-context-menu", {
                  detail: { title, x: event.clientX, y: event.clientY }
                }))
                return true
              }

              // Toggle preview pin
              if (isPreviewPinned()) {
                togglePreviewPin()
                return true
              }
              if (isPreviewShowing()) {
                togglePreviewPin()
                return true
              }
              // Force show + pin
              if (isPreviewPinned()) togglePreviewPin()
              showNotePreview(target, resolved.id, resolved.type)
              setTimeout(() => togglePreviewPin(), 500)
              return true
            }

            handleWikilinkClick(title, event, anchorId)
            return true
          },

          handleDOMEvents: {
            mouseover(_view: EditorView, event: MouseEvent) {
              const target = (event.target as HTMLElement)?.closest(".wikilink-node") as HTMLElement | null
              if (!target) return false
              if (target.closest("[data-hover-preview]")) return false

              const title = target.getAttribute("data-title")
              if (!title) return false
              const linkType = target.getAttribute("data-link-type") || "note"

              if (linkType === "wiki") {
                const store = usePlotStore.getState()
                const wiki = store.wikiArticles.find(
                  (a) => a.title.toLowerCase() === title.toLowerCase() ||
                    a.aliases.some((al) => al.toLowerCase() === title.toLowerCase())
                )
                if (wiki) {
                  showNotePreview(target, wiki.id, "wiki")
                  return false
                }
              }
              showNotePreviewByTitle(target, title)
              return false
            },

            mouseout(_view: EditorView, event: MouseEvent) {
              const target = (event.target as HTMLElement)?.closest(".wikilink-node") as HTMLElement | null
              if (!target) return false
              if (target.closest("[data-hover-preview]")) return false
              hideNotePreview()
              return false
            },

            contextmenu(_view: EditorView, event: MouseEvent) {
              const target = (event.target as HTMLElement)?.closest(".wikilink-node") as HTMLElement | null
              if (!target) return false
              const title = target.getAttribute("data-title")
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
