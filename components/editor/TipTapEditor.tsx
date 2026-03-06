"use client"

import { useEffect, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Highlight from "@tiptap/extension-highlight"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Color from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import Superscript from "@tiptap/extension-superscript"
import Subscript from "@tiptap/extension-subscript"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { ResizableImage } from "./ResizableImage"
import { EditorToolbar } from "./EditorToolbar"
import { FixedToolbar } from "./FixedToolbar"
import { useSettingsStore } from "@/lib/settings-store"
import { usePlotStore } from "@/lib/store"
import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import "./EditorStyles.css"

// ── Typewriter Extension ─────────────────────────────────────────────
// Scroll-based typewriter mode: keeps the caret vertically centred
// inside the scroll container.  Only active when Focus Mode is on.
// Uses a ProseMirror plugin so it fires synchronously on every
// transaction — no React render-delay.

const typewriterPluginKey = new PluginKey("typewriter")

const TypewriterExtension = Extension.create<{
  scrollContainerRef: { current: HTMLDivElement | null }
  focusModeRef: { current: boolean }
}>({
  name: "typewriter",

  addOptions() {
    return {
      scrollContainerRef: { current: null } as { current: HTMLDivElement | null },
      focusModeRef: { current: false },
    }
  },

  addProseMirrorPlugins() {
    const { scrollContainerRef, focusModeRef } = this.options
    return [
      new Plugin({
        key: typewriterPluginKey,
        view() {
          return {
            update(view, prevState) {
              // 1. Only active in Focus Mode
              if (!focusModeRef.current) return

              // 2. Skip during IME composition
              if (view.composing) return

              // 3. Only when selection is collapsed (cursor, not range)
              const { selection } = view.state
              if (!selection.empty) return

              // 4. Only when editor is focused
              if (!view.hasFocus()) return

              // 5. Skip if selection hasn't changed position
              if (prevState && prevState.selection.eq(view.state.selection)) return

              const container = scrollContainerRef.current
              if (!container) return

              // 6. Get cursor DOM coordinates
              const coords = view.coordsAtPos(selection.from)
              const containerRect = container.getBoundingClientRect()

              // 7. Calculate center of visible area
              const centerY = containerRect.top + containerRect.height / 2

              // 8. Offset from center
              const offsetFromCenter = coords.top - centerY

              // 9. Threshold: skip micro-adjustments (15% of container height)
              const threshold = containerRect.height * 0.15
              if (Math.abs(offsetFromCenter) < threshold) return

              // 10. Smooth scroll adjustment via requestAnimationFrame
              requestAnimationFrame(() => {
                container.scrollTop += offsetFromCenter
              })
            },
          }
        },
      }),
    ]
  },
})

interface TipTapEditorProps {
  content: Record<string, unknown>
  onChange?: (json: Record<string, unknown>, plainText: string) => void
  editable?: boolean
  placeholder?: string
}

export function TipTapEditor({
  content,
  onChange,
  editable = true,
  placeholder = "Start writing...",
}: TipTapEditorProps) {
  const spellcheck = useSettingsStore((s) => s.spellcheck)
  const wordWrap = useSettingsStore((s) => s.wordWrap)
  const tabSize = useSettingsStore((s) => s.tabSize)
  const codeFontFamily = useSettingsStore((s) => s.codeFontFamily)

  // Focus Mode detection for Typewriter Mode
  const sidebarCollapsed = usePlotStore((s) => s.sidebarCollapsed)
  const detailsOpen = usePlotStore((s) => s.detailsOpen)
  const focusMode = sidebarCollapsed && !detailsOpen

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const focusModeRef = useRef(false)
  focusModeRef.current = focusMode

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Color,
      TextStyle,
      Superscript,
      Subscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      ResizableImage.configure({ inline: false, allowBase64: true }),
      TypewriterExtension.configure({
        scrollContainerRef,
        focusModeRef,
      }),
    ],
    content: content && Object.keys(content).length > 0 ? content : undefined,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(
        editor.getJSON() as Record<string, unknown>,
        editor.getText()
      )
    },
    editorProps: {
      attributes: {
        spellcheck: spellcheck ? "true" : "false",
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] text-[15px] leading-[1.75] text-foreground",
      },
    },
  })

  // Sync spellcheck dynamically
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            spellcheck: spellcheck ? "true" : "false",
            class:
              "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] text-[15px] leading-[1.75] text-foreground",
          },
        },
      })
    }
  }, [editor, spellcheck])

  // Sync editable prop
  if (editor && editor.isEditable !== editable) {
    editor.setEditable(editable)
  }

  return (
    <div
      className="flex flex-col h-full"
      data-word-wrap={wordWrap ? "on" : "off"}
      data-tab-size={tabSize}
      data-code-font={codeFontFamily}
    >
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full w-full" />
      </div>
      <EditorToolbar editor={editor} />
      {editable && <FixedToolbar editor={editor} />}
    </div>
  )
}
