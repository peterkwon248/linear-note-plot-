"use client"

import { useState, useEffect } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { ListBullets } from "@phosphor-icons/react/dist/ssr/ListBullets"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"

interface TocItem {
  id: string
  level: number
  textContent: string
  pos: number
  isActive: boolean
  isScrolledOver: boolean
}

function TocNodeView({ editor, getPos, deleteNode }: NodeViewProps) {
  const [items, setItems] = useState<TocItem[]>([])

  useEffect(() => {
    const update = () => {
      const content = editor.storage?.tableOfContents?.content as TocItem[] | undefined
      setItems(content ?? [])
    }

    update()
    editor.on("update", update)
    return () => {
      editor.off("update", update)
    }
  }, [editor])

  const handleClick = (item: TocItem) => {
    const pos = item.pos
    editor.commands.setTextSelection(pos)
    try {
      const domInfo = editor.view.domAtPos(pos)
      const element = domInfo.node as HTMLElement
      element?.scrollIntoView?.({ behavior: "smooth", block: "center" })
    } catch {
      // ignore if DOM pos resolution fails
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
        className="bg-secondary/30 border border-border/50 rounded-lg p-4 my-2 select-none"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <ListBullets size={14} weight="bold" />
          <span className="text-xs font-semibold uppercase tracking-wider flex-1">
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
          <p className="text-xs text-muted-foreground/50 italic">
            No headings found. Add headings to populate the outline.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li
                key={item.id}
                className={indentClass[item.level] ?? ""}
              >
                <button
                  type="button"
                  onClick={() => handleClick(item)}
                  className={[
                    "w-full text-left text-sm leading-relaxed rounded px-1 py-0.5 transition-colors duration-75 cursor-pointer",
                    item.isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-hover-bg",
                  ].join(" ")}
                >
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
