"use client"

import { useState, useEffect } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { ListBullets } from "@phosphor-icons/react/dist/ssr/ListBullets"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { MapPin } from "@phosphor-icons/react/dist/ssr/MapPin"

interface TocItem {
  id: string
  level: number
  textContent: string
  pos: number
  isActive: boolean
  isScrolledOver: boolean
  type: "heading" | "bookmark"
}

function TocNodeView({ editor, getPos, deleteNode }: NodeViewProps) {
  const [items, setItems] = useState<TocItem[]>([])

  useEffect(() => {
    const update = () => {
      const headings: TocItem[] = []
      let skippedTitle = false
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          // Skip the very first heading — it's the note title
          if (!skippedTitle) {
            skippedTitle = true
            return
          }
          const level = node.attrs.level as number
          const text = node.textContent
          const id = node.attrs.id || `heading-${pos}`
          headings.push({
            id,
            level,
            textContent: text,
            pos: pos + 1, // +1 to place cursor inside heading
            isActive: false,
            isScrolledOver: false,
            type: "heading",
          })
        } else if (node.type.name === "anchorMark" || node.type.name === "anchorDivider") {
          headings.push({
            id: node.attrs.id || `anchor-${pos}`,
            level: 99,
            textContent: node.attrs.label || "Bookmark",
            pos: pos + 1,
            isActive: false,
            isScrolledOver: false,
            type: "bookmark",
          })
        }
      })
      setItems(headings)
    }

    update()
    editor.on("update", update)
    // Also listen for selectionUpdate to track active heading
    editor.on("selectionUpdate", update)
    return () => {
      editor.off("update", update)
      editor.off("selectionUpdate", update)
    }
  }, [editor])

  const handleClick = (item: TocItem) => {
    const pos = item.pos
    editor.commands.setTextSelection(pos)
    // Find the heading DOM element and scroll to it
    try {
      const resolvedPos = editor.state.doc.resolve(pos)
      const headingNode = resolvedPos.parent
      const domNode = editor.view.nodeDOM(pos - 1) as HTMLElement | null
      if (domNode) {
        domNode.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    } catch {
      // Fallback: try domAtPos
      try {
        const domInfo = editor.view.domAtPos(pos)
        const element = (domInfo.node as HTMLElement)?.closest?.("h1, h2, h3, h4, h5, h6") || domInfo.node as HTMLElement
        element?.scrollIntoView?.({ behavior: "smooth", block: "start" })
      } catch { /* ignore */ }
    }
  }

  const indentClass: Record<number, string> = {
    1: "",
    2: "ml-4",
    3: "ml-8",
    4: "ml-12",
    5: "ml-16",
    6: "ml-20",
  }

  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        className="not-draggable bg-secondary/30 border border-border-subtle rounded-lg p-4 my-2 select-none"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <ListBullets size={14} weight="bold" />
          <span className="text-2xs font-semibold uppercase tracking-wider flex-1">
            Table of Contents
          </span>
          <button
            type="button"
            onClick={() => deleteNode()}
            className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg transition-colors"
            title="Remove TOC block"
          >
            <PhX size={12} weight="bold" />
          </button>
        </div>

        {/* TOC items */}
        {items.length === 0 ? (
          <p className="text-2xs text-muted-foreground/50 italic">
            No headings found. Add headings to populate the outline.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li
                key={item.id}
                className={item.type === "bookmark" ? "" : (indentClass[item.level] ?? "")}
              >
                <button
                  type="button"
                  onClick={() => handleClick(item)}
                  className={[
                    "w-full text-left text-note leading-relaxed rounded px-1 py-0.5 transition-colors duration-100 cursor-pointer flex items-center gap-1.5",
                    item.isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-hover-bg",
                  ].join(" ")}
                >
                  {item.type === "bookmark" && (
                    <MapPin size={10} weight="fill" className="flex-shrink-0 opacity-50" />
                  )}
                  {item.textContent || <span className="opacity-40 italic">Untitled</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const TocBlockNode = Node.create({
  name: "tocBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="toc-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "toc-block" })]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "tocBlock") {
          e.commands.deleteSelection()
          return true
        }
        // Check if cursor is right after a tocBlock
        const { $from } = e.state.selection
        const before = $from.nodeBefore
        if (before?.type.name === "tocBlock") {
          e.commands.deleteRange({ from: $from.pos - before.nodeSize, to: $from.pos })
          return true
        }
        return false
      },
      Delete: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "tocBlock") {
          e.commands.deleteSelection()
          return true
        }
        return false
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(TocNodeView)
  },
})
