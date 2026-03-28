"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp"
import { ArrowDown } from "@phosphor-icons/react/dist/ssr/ArrowDown"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"
import { useState, useRef, useEffect } from "react"

function SectionBlockView({ node, editor, updateAttributes }: NodeViewProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(node.attrs.title as string)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const findPos = (): number | null => {
    let found: number | null = null
    editor.state.doc.descendants((n, pos) => {
      if (n === node) { found = pos; return false }
    })
    return found
  }

  const unwrap = () => {
    const blockPos = findPos()
    if (blockPos === null) return
    const blockNode = editor.state.doc.nodeAt(blockPos)
    if (!blockNode) return
    const { tr } = editor.state
    tr.replaceWith(blockPos, blockPos + blockNode.nodeSize, blockNode.content)
    editor.view.dispatch(tr)
  }

  const moveUp = () => {
    const pos = findPos()
    if (pos === null || pos === 0) return
    const $pos = editor.state.doc.resolve(pos)
    const index = $pos.index($pos.depth)
    if (index === 0) return
    const prevNode = $pos.parent.child(index - 1)
    if (prevNode.type.name === "title") return
    const blockNode = editor.state.doc.nodeAt(pos)
    if (!blockNode) return
    const { tr } = editor.state
    tr.delete(pos, pos + blockNode.nodeSize)
    tr.insert(pos - prevNode.nodeSize, blockNode)
    editor.view.dispatch(tr)
  }

  const moveDown = () => {
    const pos = findPos()
    if (pos === null) return
    const $pos = editor.state.doc.resolve(pos)
    const index = $pos.index($pos.depth)
    if (index >= $pos.parent.childCount - 1) return
    const blockNode = editor.state.doc.nodeAt(pos)
    if (!blockNode) return
    const nextNode = $pos.parent.child(index + 1)
    const { tr } = editor.state
    tr.delete(pos, pos + blockNode.nodeSize)
    tr.insert(pos + nextNode.nodeSize, blockNode)
    editor.view.dispatch(tr)
  }

  const commitTitle = () => {
    const value = draft.trim() || "Untitled Section"
    updateAttributes({ title: value })
    setDraft(value)
    setEditing(false)
  }

  return (
    <NodeViewWrapper>
      <div className="my-3 group relative rounded-md transition-colors">
        {/* Subtle top divider */}
        <div className="border-t border-border/40 mb-1" />

        <div className="flex">
          {/* Left controls: grip + move arrows */}
          {editor.isEditable && (
            <div
              contentEditable={false}
              className="flex flex-col items-center pt-1.5 pr-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity gap-0.5"
            >
              <div className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground/30" data-drag-handle>
                <DotsSixVertical size={14} weight="bold" />
              </div>
              <button type="button" onClick={moveUp} className="flex items-center justify-center w-5 h-4 rounded text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors" title="Move up">
                <ArrowUp size={10} weight="bold" />
              </button>
              <button type="button" onClick={moveDown} className="flex items-center justify-center w-5 h-4 rounded text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors" title="Move down">
                <ArrowDown size={10} weight="bold" />
              </button>
            </div>
          )}

          {/* Main section area */}
          <div className="flex-1 min-w-0 border-l-2 border-accent/20 group-hover:border-accent/50 pl-3 transition-colors">
            {/* Section title */}
            <div contentEditable={false} className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b border-border/30">
              <BookmarkSimple size={14} weight="fill" className="text-accent shrink-0" />
              {editing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); commitTitle() }
                    if (e.key === "Escape") { setDraft(node.attrs.title as string); setEditing(false) }
                  }}
                  onBlur={commitTitle}
                  className="flex-1 text-base font-semibold text-foreground bg-transparent border-b border-border/50 focus:border-primary outline-none py-0.5"
                />
              ) : (
                <button
                  type="button"
                  onClick={editor.isEditable ? () => { setDraft(node.attrs.title as string); setEditing(true) } : undefined}
                  className={`text-base font-semibold text-foreground hover:text-accent transition-colors text-left ${editor.isEditable ? "cursor-text" : "cursor-default"}`}
                >
                  {(node.attrs.title as string) || "Untitled Section"}
                </button>
              )}
            </div>

            {/* Content area */}
            <NodeViewContent className="prose-sm pl-0.5" />
          </div>

          {/* Unwrap button */}
          {editor.isEditable && (
            <div
              contentEditable={false}
              className="flex items-start pt-1.5 pl-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                type="button"
                onClick={unwrap}
                className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors"
                title="Unwrap section"
              >
                <PhX size={10} weight="bold" />
              </button>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const SectionBlockNode = Node.create({
  name: "sectionBlock",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-section-id"),
        renderHTML: (attributes) => ({ "data-section-id": attributes.id }),
      },
      title: {
        default: "Untitled Section",
        parseHTML: (element) => element.getAttribute("data-section-title"),
        renderHTML: (attributes) => ({ "data-section-title": attributes.title }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="section-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "section-block" }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SectionBlockView)
  },
})
