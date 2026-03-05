"use client"

import { useEffect } from "react"
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
import "./EditorStyles.css"

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
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full w-full" />
      </div>
      <EditorToolbar editor={editor} />
      {editable && <FixedToolbar editor={editor} />}
    </div>
  )
}
