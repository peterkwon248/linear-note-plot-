"use client"

import { useEffect, useRef } from "react"
import { useEditor, EditorContent, useEditorState } from "@tiptap/react"
import "katex/dist/katex.min.css"
import { EditorToolbar } from "./EditorToolbar"
import { TableBubbleMenu } from "./TableBubbleMenu"
import { BlockDragOverlay } from "./dnd/block-drag-overlay"
import { FloatingToc } from "./floating-toc"
import { useSettingsStore } from "@/lib/settings-store"
import { usePlotStore } from "@/lib/store"
import { createEditorExtensions } from "./core/shared-editor-config"
import "./EditorStyles.css"

interface TipTapEditorProps {
  content: Record<string, unknown>
  onChange?: (json: Record<string, unknown>, plainText: string) => void
  editable?: boolean
  placeholder?: string
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void
}

export function TipTapEditor({
  content,
  onChange,
  editable = true,
  placeholder = "Start writing...",
  onEditorReady,
}: TipTapEditorProps) {
  const spellcheck = useSettingsStore((s) => s.spellcheck)
  const wordWrap = useSettingsStore((s) => s.wordWrap)
  const tabSize = useSettingsStore((s) => s.tabSize)
  const codeFontFamily = useSettingsStore((s) => s.codeFontFamily)
  const currentLineHighlight = useSettingsStore((s) => s.currentLineHighlight)

  // Focus Mode detection for Typewriter Mode
  const sidebarCollapsed = usePlotStore((s) => s.sidebarCollapsed)
  const detailsOpen = usePlotStore((s) => s.sidePanelOpen)
  const focusMode = sidebarCollapsed && !detailsOpen

  const editorWrapRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const focusModeRef = useRef(false)
  focusModeRef.current = focusMode
  const currentLineHighlightRef = useRef(false)
  currentLineHighlightRef.current = currentLineHighlight

  // Find the nearest scrollable ancestor for typewriter mode
  useEffect(() => {
    if (!editorWrapRef.current) return
    let el: HTMLElement | null = editorWrapRef.current.parentElement
    while (el) {
      const style = getComputedStyle(el)
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        scrollContainerRef.current = el as HTMLDivElement
        return
      }
      el = el.parentElement
    }
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createEditorExtensions("note", {
      placeholder,
      scrollContainerRef,
      focusModeRef,
      currentLineHighlightRef,
    }),
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
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] text-ui leading-[1.75] text-foreground",
      },
      handleDOMEvents: {
        dragover: (_view, event) => {
          const types = event.dataTransfer?.types ?? []
          if (
            types.includes("application/x-plot-view") ||
            types.includes("application/x-plot-note") ||
            types.includes("application/x-plot-tab") ||
            types.includes("application/x-plot-leaf")
          ) {
            return true // skip ProseMirror, let WorkspaceDropZone handle
          }
          return false
        },
        drop: (_view, event) => {
          const types = event.dataTransfer?.types ?? []
          if (
            types.includes("application/x-plot-view") ||
            types.includes("application/x-plot-note") ||
            types.includes("application/x-plot-tab") ||
            types.includes("application/x-plot-leaf")
          ) {
            return true
          }
          return false
        },
      },
    },
  })

  // Expose editor instance to parent
  useEffect(() => {
    if (editor) onEditorReady?.(editor)
  }, [editor]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync spellcheck dynamically
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            spellcheck: spellcheck ? "true" : "false",
            class:
              "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] text-ui leading-[1.75] text-foreground",
          },
          handleDOMEvents: {
            dragover: (_view, event) => {
              const types = event.dataTransfer?.types ?? []
              if (
                types.includes("application/x-plot-view") ||
                types.includes("application/x-plot-note") ||
                types.includes("application/x-plot-tab") ||
                types.includes("application/x-plot-leaf")
              ) {
                return true
              }
              return false
            },
            drop: (_view, event) => {
              const types = event.dataTransfer?.types ?? []
              if (
                types.includes("application/x-plot-view") ||
                types.includes("application/x-plot-note") ||
                types.includes("application/x-plot-tab") ||
                types.includes("application/x-plot-leaf")
              ) {
                return true
              }
              return false
            },
          },
        },
      })
    }
  }, [editor, spellcheck])

  // Sync editable prop
  if (editor && editor.isEditable !== editable) {
    editor.setEditable(editable)
  }

  const counts = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return { chars: 0, words: 0 }
      return {
        chars: e.storage.characterCount.characters(),
        words: e.storage.characterCount.words(),
      }
    },
  })

  return (
    <div
      className="flex flex-col min-w-0 flex-1"
      data-word-wrap={wordWrap ? "on" : "off"}
      data-tab-size={tabSize}
      data-code-font={codeFontFamily}
    >
      <div ref={editorWrapRef} className="flex-1 relative">
        <BlockDragOverlay editor={editor}>
          <EditorContent editor={editor} className="w-full" />
        </BlockDragOverlay>
        {editor && <TableBubbleMenu editor={editor} />}
        {editor && <FloatingToc editor={editor} />}
      </div>
      {editor && (
        <div
          className="text-2xs"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            padding: "4px 16px",
            color: "var(--muted-foreground)",
            opacity: 0.6,
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          <span>{counts?.words ?? 0} words</span>
          <span>{counts?.chars ?? 0} chars</span>
        </div>
      )}
      {editable && <EditorToolbar editor={editor} />}
    </div>
  )
}
