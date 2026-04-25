"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { useEffect, useRef } from "react"
import { generateHTML } from "@tiptap/html"
import { createEditorExtensions, createRenderExtensions } from "@/components/editor/core/shared-editor-config"
import { cn } from "@/lib/utils"

/* Memoized render-only extensions (used for read mode `generateHTML`). */
let _renderExts: ReturnType<typeof createRenderExtensions> | null = null
function getRenderExtensions() {
  if (!_renderExts) _renderExts = createRenderExtensions()
  return _renderExts
}

/**
 * Try to parse `body` as TipTap JSON; fall back to a single paragraph if it's plain text.
 */
function bodyToContent(body: string): any {
  if (!body) return { type: "doc", content: [{ type: "paragraph" }] }
  // Attempt JSON parse (legacy comments may store rich JSON)
  try {
    const parsed = JSON.parse(body)
    if (parsed && parsed.type === "doc") return parsed
  } catch {
    /* not JSON — treat as plain text */
  }
  // Plain text → single paragraph, preserve newlines as hard breaks
  const lines = body.split("\n")
  const content: any[] = []
  lines.forEach((line, i) => {
    if (i > 0) content.push({ type: "hardBreak" })
    if (line) content.push({ type: "text", text: line })
  })
  return { type: "doc", content: [{ type: "paragraph", content }] }
}

/**
 * Read-only display of a comment body. Uses generateHTML if body is JSON, plain text otherwise.
 */
export function CommentBodyDisplay({
  body,
  className,
  onClick,
}: {
  body: string
  className?: string
  onClick?: () => void
}) {
  // Heuristic: only attempt rich render if it looks like JSON
  const looksLikeJson = body.trimStart().startsWith("{")
  let html: string | null = null
  if (looksLikeJson) {
    try {
      const json = JSON.parse(body)
      if (json?.type === "doc") {
        html = generateHTML(json, getRenderExtensions())
      }
    } catch {
      /* fall through */
    }
  }

  if (html) {
    return (
      <div
        onClick={onClick}
        className={cn("comment-body prose prose-sm dark:prose-invert max-w-none", className)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }
  // Plain text
  return (
    <div onClick={onClick} className={cn("whitespace-pre-wrap break-words", className)}>
      {body}
    </div>
  )
}

/**
 * Editable comment editor — lightweight TipTap "comment" tier.
 * Markdown shortcuts (**bold**, *italic*, `code`, - list, etc) + [[wikilinks]] + #tags.
 * No visible toolbar — comments stay lightweight by design.
 */
export function CommentEditor({
  initialBody,
  placeholder,
  autoFocus,
  onSubmit,
  onCancel,
  onChange,
  className,
}: {
  initialBody: string
  placeholder?: string
  autoFocus?: boolean
  /** Called on Ctrl/Cmd+Enter — receives serialized JSON body. */
  onSubmit?: (jsonBody: string) => void
  /** Called on Escape. */
  onCancel?: () => void
  /** Called on every change with serialized JSON body. */
  onChange?: (jsonBody: string) => void
  className?: string
}) {
  const onSubmitRef = useRef(onSubmit)
  const onCancelRef = useRef(onCancel)
  const onChangeRef = useRef(onChange)
  onSubmitRef.current = onSubmit
  onCancelRef.current = onCancel
  onChangeRef.current = onChange

  const editor = useEditor({
    extensions: createEditorExtensions("comment", { placeholder }),
    content: bodyToContent(initialBody),
    autofocus: autoFocus,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "comment-editor prose prose-sm dark:prose-invert max-w-none focus:outline-none",
          "min-h-[60px] leading-relaxed text-[14px] px-3 py-2",
          className,
        ),
      },
      handleKeyDown(_view, event) {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          if (onSubmitRef.current && editor) {
            const json = editor.getJSON()
            onSubmitRef.current(JSON.stringify(json))
          }
          return true
        }
        if (event.key === "Escape") {
          event.preventDefault()
          onCancelRef.current?.()
          return true
        }
        return false
      },
    },
    onUpdate({ editor: e }) {
      if (onChangeRef.current) {
        onChangeRef.current(JSON.stringify(e.getJSON()))
      }
    },
  })

  // Update content if initialBody changes externally
  useEffect(() => {
    if (!editor) return
    const current = JSON.stringify(editor.getJSON())
    const incoming = JSON.stringify(bodyToContent(initialBody))
    if (current !== incoming) {
      editor.commands.setContent(bodyToContent(initialBody), { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBody])

  return (
    <div className="flex flex-col w-full max-w-full rounded border border-border-subtle bg-card/30 overflow-hidden">
      <div className="max-h-[160px] overflow-y-auto w-full">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
