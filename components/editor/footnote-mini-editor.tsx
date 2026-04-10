"use client"

/**
 * FootnoteMiniEditor — lightweight inline TipTap editor for footnote content.
 * Supports: bold, italic, underline, strikethrough, link, wikilink text.
 * No slash commands, no block-level elements, no drag-and-drop.
 *
 * Used in FootnotesFooter (each row) and footnote-node popover (edit mode).
 */

import { useEffect, useRef, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"

interface FootnoteMiniEditorProps {
  /** Initial content — TipTap JSON object OR plain text string. */
  initialContent: unknown
  /** Called on blur or Ctrl+Enter with updated content. */
  onSave: (json: Record<string, unknown>, plainText: string) => void
  /** Called on Escape — cancel editing. */
  onCancel?: () => void
  /** Placeholder when empty. */
  placeholder?: string
  /** Auto-focus on mount. */
  autoFocus?: boolean
}

/**
 * Parse a stored content value into TipTap-compatible JSON.
 * Handles:
 * - TipTap JSON (object with `type: "doc"`) — pass through
 * - JSON string (stringified TipTap JSON) — parse
 * - Plain text string — wrap in paragraph
 * - null/undefined/empty — empty doc
 */
function parseContent(raw: unknown): Record<string, unknown> {
  if (!raw) {
    return { type: "doc", content: [{ type: "paragraph" }] }
  }
  // Already a TipTap JSON object
  if (typeof raw === "object" && (raw as any)?.type === "doc") {
    return raw as Record<string, unknown>
  }
  // JSON string
  if (typeof raw === "string") {
    const trimmed = raw.trim()
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed?.type === "doc") return parsed
      } catch {}
    }
    // Plain text fallback — wrap in doc > paragraph > text
    if (trimmed) {
      return {
        type: "doc",
        content: [{
          type: "paragraph",
          content: [{ type: "text", text: trimmed }],
        }],
      }
    }
    return { type: "doc", content: [{ type: "paragraph" }] }
  }
  return { type: "doc", content: [{ type: "paragraph" }] }
}

export function FootnoteMiniEditor({
  initialContent,
  onSave,
  onCancel,
  placeholder = "Enter footnote content...",
  autoFocus = true,
}: FootnoteMiniEditorProps) {
  const savedRef = useRef(false)

  const editor = useEditor({
    immediatelyRender: false, // Required for Next.js SSR compatibility
    extensions: [
      StarterKit.configure({
        // Disable block-level features — footnotes are inline content only
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "footnote-mini-link" },
      }),
    ],
    content: parseContent(initialContent),
    editable: true,
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        class: "footnote-mini-editor-content",
        "data-placeholder": placeholder,
      },
      handleKeyDown: (_view, event) => {
        // Ctrl+Enter or Cmd+Enter → save
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          handleSave()
          return true
        }
        // Escape → cancel
        if (event.key === "Escape") {
          event.preventDefault()
          onCancel?.()
          return true
        }
        // Stop propagation to prevent outer TipTap from capturing
        event.stopPropagation()
        return false
      },
    },
  })

  const handleSave = useCallback(() => {
    if (!editor || savedRef.current) return
    savedRef.current = true
    const json = editor.getJSON() as Record<string, unknown>
    const plainText = editor.getText()
    onSave(json, plainText)
  }, [editor, onSave])

  // Save on blur
  useEffect(() => {
    if (!editor) return
    const handler = () => {
      // Small delay to allow cancel button clicks to fire first
      setTimeout(() => {
        if (!savedRef.current) handleSave()
      }, 100)
    }
    editor.on("blur", handler)
    return () => { editor.off("blur", handler) }
  }, [editor, handleSave])

  // Reset savedRef when editor content changes (re-enable save)
  useEffect(() => {
    savedRef.current = false
  }, [initialContent])

  if (!editor) return null

  return (
    <div
      className="footnote-mini-editor"
      // Stop click/focus events from reaching the outer TipTap editor
      onMouseDownCapture={(e) => e.stopPropagation()}
      onFocusCapture={(e) => e.stopPropagation()}
    >
      <EditorContent editor={editor} />
    </div>
  )
}

/** Serialize footnote TipTap JSON to a storable string. */
export function serializeFootnoteContent(json: Record<string, unknown>): string {
  return JSON.stringify(json)
}

/** Re-export parseContent for use by consumers that need to read stored footnote content. */
export { parseContent as parseFootnoteContent }
