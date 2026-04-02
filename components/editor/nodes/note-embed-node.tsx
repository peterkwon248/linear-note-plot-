"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer, EditorContent, useEditor } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Note as PhNote } from "@phosphor-icons/react/dist/ssr/Note"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { ArrowsClockwise } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { ArrowsIn } from "@phosphor-icons/react/dist/ssr/ArrowsIn"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { getBody, saveBody } from "@/lib/note-body-store"
import { createEditorExtensions } from "@/components/editor/core/shared-editor-config"
import { useBlockResize } from "@/components/editor/hooks/use-block-resize"
import { BlockResizeHandles } from "@/components/editor/hooks/block-resize-handles"

// ── NoteEmbed View ───────────────────────────────────────────────────

function NoteEmbedView({ node, deleteNode, editor: parentEditor, updateAttributes }: NodeViewProps) {
  const noteId = node.attrs.noteId as string
  const embedWidth = node.attrs.width as number | null
  const embedHeight = node.attrs.height as number | null
  const note = usePlotStore((s) => s.notes.find((n) => n.id === noteId))
  const updateNote = usePlotStore((s) => s.updateNote)
  const parentEditable = parentEditor?.isEditable ?? true
  const { containerRef: resizeRef, isResizing, onResizeStart } = useBlockResize(embedWidth, embedHeight, updateAttributes)

  const [synced, setSynced] = useState(node.attrs.synced as boolean)
  const [initialContent, setInitialContent] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [bodyPreview, setBodyPreview] = useState("")
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load note body from IDB
  useEffect(() => {
    if (!noteId) return
    let cancelled = false
    getBody(noteId).then((body) => {
      if (cancelled) return
      if (body?.contentJson && Object.keys(body.contentJson).length > 0) {
        setInitialContent(body.contentJson)
      } else if (note) {
        const nodes: Record<string, unknown>[] = []
        if (note.content) {
          nodes.push({ type: "paragraph", content: [{ type: "text", text: note.content }] })
        } else {
          nodes.push({ type: "paragraph" })
        }
        setInitialContent({ type: "doc", content: nodes })
      } else {
        setInitialContent({ type: "doc", content: [{ type: "paragraph" }] })
      }
      // Also set preview text
      if (body?.content) {
        setBodyPreview(
          body.content.replace(/^#{1,6}\s+/gm, "").replace(/\n+/g, " ").trim().slice(0, 200)
        )
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [noteId, note])

  // Debounced save handler (only used in synced mode)
  const handleChange = useCallback(
    (json: Record<string, unknown>, plainText: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        saveBody({ id: noteId, content: plainText, contentJson: json })
        updateNote(noteId, {
          content: plainText,
          contentJson: json,
          updatedAt: Date.now(),
        })
      }, 300)
    },
    [noteId, updateNote]
  )

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const toggleSync = () => {
    const next = !synced
    setSynced(next)
    updateAttributes({ synced: next })
  }

  // Not found
  if (!note) {
    return (
      <NodeViewWrapper>
        <div
          contentEditable={false}
          className="not-draggable border-l-4 border-destructive/40 rounded-lg p-3 my-2 select-none bg-secondary/20"
        >
          <div className="flex items-center gap-2 text-muted-foreground/50">
            <PhNote size={14} weight="bold" />
            <span className="text-2xs italic">Note not found</span>
            <button
              type="button"
              onClick={() => deleteNode()}
              className="ml-auto rounded p-0.5 text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Remove embed"
            >
              <PhX size={12} weight="bold" />
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  // ── Synced Mode: inline editor ──
  if (synced) {
    return (
      <NodeViewWrapper>
        <div
          contentEditable={false}
          ref={resizeRef}
          className={`not-draggable synced-block border-l-4 border-accent/60 rounded-r-lg my-2 select-none group block-resize-wrapper ${isResizing ? "is-resizing" : ""}`}
          style={{
            ...(embedWidth ? { width: `${embedWidth}px` } : {}),
            ...(embedHeight ? { height: `${embedHeight}px`, overflowY: "auto" as const } : {}),
          }}
        >
        {parentEditable && <BlockResizeHandles onResizeStart={onResizeStart} />}
          <div className="flex items-center gap-2 px-3 pt-2 pb-1">
            <PhNote size={14} weight="bold" className="text-accent shrink-0" />
            <span className="text-2xs font-medium text-muted-foreground truncate flex-1">
              {note.title || "Untitled"}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleSync() }}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                title="Disable sync"
              >
                <ArrowsClockwise size={11} weight="bold" className="inline mr-0.5" />
                Synced
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveRoute("/notes")
                  usePlotStore.getState().openNote(noteId)
                }}
                className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg transition-colors"
                title="Open note"
              >
                <ArrowSquareOut size={12} weight="bold" />
              </button>
              {(embedWidth || embedHeight) && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); updateAttributes({ width: null, height: null }) }}
                  className="rounded p-0.5 text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors"
                  title="Reset size"
                >
                  <ArrowsIn size={12} weight="bold" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); deleteNode() }}
                className="rounded p-0.5 text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors"
                title="Remove embed"
              >
                <PhX size={12} weight="bold" />
              </button>
            </div>
          </div>
          <div className="px-3 pb-2">
            {loading ? (
              <p className="text-2xs text-muted-foreground/40 italic py-2">Loading...</p>
            ) : initialContent ? (
              <SyncedBlockEditor
                key={noteId}
                content={initialContent}
                editable={parentEditable}
                onChange={handleChange}
              />
            ) : (
              <p className="text-2xs text-muted-foreground/40 italic py-2">Empty note</p>
            )}
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  // ── Preview Mode: card ──
  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        ref={resizeRef}
        className={`not-draggable border border-border-subtle rounded-lg p-3 my-2 select-none hover:border-border transition-colors cursor-pointer group block-resize-wrapper ${isResizing ? "is-resizing" : ""}`}
        style={{
          ...(embedWidth ? { width: `${embedWidth}px` } : {}),
          ...(embedHeight ? { height: `${embedHeight}px`, overflowY: "auto" as const } : {}),
        }}
        onClick={(e) => {
          if (noteId) usePlotStore.getState().openSidePeek(noteId)
        }}
      >
        {parentEditable && <BlockResizeHandles onResizeStart={onResizeStart} />}
        <div className="flex items-center gap-2 mb-1">
          <PhNote size={14} weight="bold" className="text-accent shrink-0" />
          <span className="text-note font-medium text-foreground truncate flex-1">
            {note.title || "Untitled"}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleSync() }}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 hover:text-accent hover:bg-accent/10 transition-colors"
              title="Enable sync editing"
            >
              <ArrowsClockwise size={11} weight="bold" className="inline mr-0.5" />
              Sync
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setActiveRoute("/notes")
                usePlotStore.getState().openNote(noteId)
              }}
              className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Open note"
            >
              <ArrowSquareOut size={12} weight="bold" />
            </button>
            {(embedWidth || embedHeight) && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); updateAttributes({ width: null, height: null }) }}
                className="rounded p-0.5 text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors"
                title="Reset size"
              >
                <ArrowsIn size={12} weight="bold" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); deleteNode() }}
              className="rounded p-0.5 text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Remove embed"
            >
              <PhX size={12} weight="bold" />
            </button>
          </div>
        </div>
        {bodyPreview ? (
          <p className="text-2xs text-muted-foreground line-clamp-2 leading-relaxed">
            {bodyPreview}
          </p>
        ) : (
          <p className="text-2xs text-muted-foreground/40 italic">Empty note</p>
        )}
      </div>
    </NodeViewWrapper>
  )
}

// ── Inline TipTap Editor (base tier — no NoteEmbed to prevent recursion) ──

function SyncedBlockEditor({
  content,
  editable,
  onChange,
}: {
  content: Record<string, unknown>
  editable: boolean
  onChange: (json: Record<string, unknown>, plainText: string) => void
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: createEditorExtensions("base", {
      placeholder: "Start writing...",
    }),
    content: content && Object.keys(content).length > 0 ? content : undefined,
    editable,
    onUpdate: ({ editor: e }) => {
      onChange(
        e.getJSON() as Record<string, unknown>,
        e.getText()
      )
    },
  })

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  if (!editor) return null

  return (
    <div className="synced-block-editor" contentEditable={false}>
      <div contentEditable={editable} suppressContentEditableWarning>
        <EditorContent editor={editor} className="w-full" />
      </div>
    </div>
  )
}

// ── Node Definition ──────────────────────────────────────────────────

export const NoteEmbedNode = Node.create({
  name: "noteEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-note-id"),
        renderHTML: (attributes: Record<string, string>) => ({
          "data-note-id": attributes.noteId,
        }),
      },
      synced: {
        default: false,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-synced") === "true",
        renderHTML: (attributes: Record<string, any>) => ({
          "data-synced": attributes.synced ? "true" : "false",
        }),
      },
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const w = element.getAttribute("data-width")
          return w ? parseInt(w, 10) : null
        },
        renderHTML: (attributes: Record<string, any>) => attributes.width ? { "data-width": attributes.width } : {},
      },
      height: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const h = el.getAttribute("data-height")
          return h ? parseInt(h, 10) : null
        },
        renderHTML: (attrs: Record<string, any>) => attrs.height ? { "data-height": attrs.height } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="note-embed"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "note-embed" })]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "noteEmbed") {
          e.commands.deleteSelection()
          return true
        }
        const { $from } = e.state.selection
        const before = $from.nodeBefore
        if (before?.type.name === "noteEmbed") {
          e.commands.deleteRange({
            from: $from.pos - before.nodeSize,
            to: $from.pos,
          })
          return true
        }
        return false
      },
      Delete: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "noteEmbed") {
          e.commands.deleteSelection()
          return true
        }
        return false
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteEmbedView)
  },
})
