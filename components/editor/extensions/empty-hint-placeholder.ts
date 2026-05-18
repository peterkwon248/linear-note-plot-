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
            // Only show hint when the body has exactly ONE paragraph and it's empty.
            // Heading (Untitled placeholder) is excluded from this count. Any body
            // content (text typed, or a second paragraph from Enter) hides the hint
            // so it doesn't ambush the user mid-edit.
            let paraCount = 0
            let paraHasText = false
            doc.forEach((node) => {
              if (node.type.name === "paragraph") {
                paraCount += 1
                if (node.content.size > 0) paraHasText = true
              }
            })
            if (paraHasText || paraCount !== 1) {
              return DecorationSet.empty
            }
            const decorations: Decoration[] = []
            let attached = false

            doc.descendants((node, pos) => {
              if (attached) return false
              // Attach to the (only) empty paragraph. Heading placeholder is
              // handled separately by @tiptap/extension-placeholder.
              if (node.type.name === "paragraph" && node.content.size === 0) {
                // Widget is absolutely positioned inside the paragraph so the
                // caret rests at the paragraph start (like UpNote / Notion) and
                // the hint reads as a true placeholder, not inline text.
                // Font size + line-height inherit from the paragraph so the hint
                // visually replaces the empty body line.
                const widget = document.createElement("span")
                widget.className = "plot-empty-hint"
                widget.contentEditable = "false"
                widget.style.cssText = [
                  "position: absolute",
                  "left: 0",
                  "top: 0",
                  "color: var(--muted-foreground)",
                  "opacity: 0.55",
                  "user-select: none",
                  "pointer-events: none",
                  "white-space: nowrap",
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
                  "text-underline-offset: 3px",
                  "cursor: pointer",
                  "pointer-events: auto",
                ].join("; ")
                btn.addEventListener("click", (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.dispatchEvent(new CustomEvent("plot:open-templates-picker"))
                })
                btn.addEventListener("mouseenter", () => {
                  btn.style.opacity = "1"
                })
                btn.addEventListener("mouseleave", () => {
                  btn.style.opacity = ""
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
                // Make the paragraph the positioning context for the absolute
                // widget — without this the widget would escape to a distant
                // ancestor (e.g. viewport).
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    style: "position: relative",
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
