"use client"

// Phase 2B-2a — BookInlineEditor: lightweight inline TipTap editor for Book text blocks.
//
// Reuses Plot's existing wiki-tier extension set (slash commands, wikilinks, mentions,
// footnotes, hashtags) so the editing UX in Book matches the existing wiki editor —
// no new parser, no new commands, same muscle memory.
//
// No toolbar, no resize handles (lighter than WikiTextEditor). Save is debounced
// (300ms) via the `onChange` prop — parent decides where to persist.

import { useEditor, EditorContent } from "@tiptap/react"
import { useRef } from "react"
import { createEditorExtensions } from "@/components/editor/core/shared-editor-config"

interface BookInlineEditorProps {
  /** Initial TipTap JSON content. Leave undefined for empty. */
  initialContent?: Record<string, unknown>
  /** Fallback plaintext (used only if initialContent is empty/undefined). */
  initialText?: string
  /** Fired on every update — parent handles debounce/save. */
  onChange: (json: Record<string, unknown>, plainText: string) => void
  /** Editor placeholder. */
  placeholder?: string
  /** Outer style / className overrides so shells can match their typography. */
  className?: string
  style?: React.CSSProperties
}

export function BookInlineEditor({
  initialContent,
  initialText,
  onChange,
  placeholder = "Write something…",
  className,
  style,
}: BookInlineEditorProps) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasInitialJson = initialContent && Object.keys(initialContent).length > 0
  const content = hasInitialJson
    ? initialContent
    : initialText
      ? {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: initialText ? [{ type: "text", text: initialText }] : [],
            },
          ],
        }
      : undefined

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createEditorExtensions("wiki", { placeholder }),
    content,
    editable: true,
    onUpdate: ({ editor: e }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        onChange(e.getJSON() as Record<string, unknown>, e.getText())
      }, 300)
    },
  })

  if (!editor) return null

  return (
    <EditorContent
      editor={editor}
      className={className}
      style={{
        outline: "none",
        ...style,
      }}
    />
  )
}
