"use client"

import { useState, useEffect } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Note as PhNote } from "@phosphor-icons/react/dist/ssr/Note"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { usePlotStore } from "@/lib/store"

function NoteEmbedView({ node, deleteNode }: NodeViewProps) {
  const noteId = node.attrs.noteId as string

  // Read note data from store
  const note = usePlotStore((s) => s.notes.find((n) => n.id === noteId))
  const openNote = usePlotStore((s) => s.openNote)

  // Get body preview text (first ~200 chars)
  const [bodyPreview, setBodyPreview] = useState("")

  useEffect(() => {
    if (!noteId) return
    // Try to get body from IDB (plot-note-bodies)
    const openReq = indexedDB.open("plot-note-bodies", 1)
    openReq.onsuccess = () => {
      const db = openReq.result
      try {
        const tx = db.transaction("bodies", "readonly")
        const store = tx.objectStore("bodies")
        const getReq = store.get(noteId)
        getReq.onsuccess = () => {
          const body = getReq.result
          if (body && typeof body === "object" && body.content) {
            // Extract plain text from TipTap JSON
            const extractText = (nodes: any[]): string => {
              return nodes
                .map((n: any) => {
                  if (n.type === "text") return n.text || ""
                  if (n.type === "heading") return "" // Skip heading (title)
                  if (n.content) return extractText(n.content)
                  return ""
                })
                .join(" ")
                .trim()
            }
            const text = extractText(body.content || [])
            setBodyPreview(text.slice(0, 200))
          }
        }
      } catch {
        // DB might not have the store yet
      }
    }
  }, [noteId])

  const handleOpen = () => {
    if (noteId) openNote(noteId)
  }

  if (!note) {
    return (
      <NodeViewWrapper>
        <div
          contentEditable={false}
          className="not-draggable border border-border-subtle rounded-lg p-3 my-2 select-none bg-secondary/20"
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

  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        className="not-draggable border border-border-subtle rounded-lg p-3 my-2 select-none hover:border-border transition-colors cursor-pointer group"
        onClick={handleOpen}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <PhNote size={14} weight="bold" className="text-accent shrink-0" />
          <span className="text-note font-medium text-foreground truncate flex-1">
            {note.title || "Untitled"}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleOpen()
              }}
              className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Open note"
            >
              <ArrowSquareOut size={12} weight="bold" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                deleteNode()
              }}
              className="rounded p-0.5 text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Remove embed"
            >
              <PhX size={12} weight="bold" />
            </button>
          </div>
        </div>
        {/* Body preview */}
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
