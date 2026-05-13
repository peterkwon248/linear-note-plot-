/**
 * EmptyHintPlaceholder — ProseMirror Decoration plugin (2026-05-13).
 *
 * 빈 노트 첫 paragraph 안에 inline clickable hint 표시:
 *   "Insert from a template · or press / for menu"
 *
 * TipTap의 official @tiptap/extension-placeholder는 :before pseudo-element라
 * clickable 불가. UpNote 패턴(placeholder text 자체가 inline link)을 구현하려면
 * ProseMirror Decoration widget으로 실제 DOM element를 paragraph 안에 mount.
 *
 * 클릭 시 `plot:open-templates-picker` custom event dispatch — NoteEditorAdapter의
 * 기존 listener가 받아서 TemplatesPickerDialog open. slash 메뉴 "Insert template…"
 * entry와 동일한 path.
 */

import { Extension } from "@tiptap/core"
import { Plugin } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

export const EmptyHintPlaceholder = Extension.create({
  name: "emptyHintPlaceholder",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: (state) => {
            const { doc } = state
            const decorations: Decoration[] = []
            let attached = false

            doc.descendants((node, pos) => {
              if (attached) return false
              // Only attach to the FIRST empty paragraph encountered. Headings
              // (e.g. the leading "Untitled" title) get their own placeholder
              // from @tiptap/extension-placeholder.
              if (node.type.name === "paragraph" && node.content.size === 0) {
                const widget = document.createElement("span")
                widget.className = "plot-empty-hint"
                widget.contentEditable = "false"
                widget.style.cssText = [
                  "color: var(--muted-foreground)",
                  "opacity: 0.5",
                  "user-select: none",
                  "pointer-events: none",
                  "font-size: 0.85em",
                ].join("; ")

                const btn = document.createElement("button")
                btn.type = "button"
                btn.textContent = "Insert from a template"
                btn.style.cssText = [
                  "color: inherit",
                  "background: none",
                  "border: none",
                  "padding: 0",
                  "margin: 0",
                  "font: inherit",
                  "text-decoration: underline",
                  "text-decoration-style: dotted",
                  "text-underline-offset: 2px",
                  "cursor: pointer",
                  "pointer-events: auto",
                ].join("; ")
                btn.addEventListener("click", (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.dispatchEvent(new CustomEvent("plot:open-templates-picker"))
                })
                btn.addEventListener("mouseenter", () => {
                  btn.style.textDecorationStyle = "solid"
                })
                btn.addEventListener("mouseleave", () => {
                  btn.style.textDecorationStyle = "dotted"
                })

                widget.appendChild(btn)
                widget.appendChild(document.createTextNode(" · or press / for menu"))

                decorations.push(
                  Decoration.widget(pos + 1, widget, {
                    side: -1,
                    ignoreSelection: true,
                    key: "empty-hint",
                  }),
                )
                attached = true
                return false
              }
              return true
            })

            return decorations.length > 0
              ? DecorationSet.create(doc, decorations)
              : DecorationSet.empty
          },
        },
      }),
    ]
  },
})
