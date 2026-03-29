"use client"

import { useCallback } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Table as PhTable } from "@phosphor-icons/react/dist/ssr/Table"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Trash as PhTrash } from "@phosphor-icons/react/dist/ssr/Trash"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"

interface InfoboxRow {
  label: string
  value: string
}

function InfoboxNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const title = (node.attrs.title as string) || "Info"
  const rows = (node.attrs.rows as InfoboxRow[]) || []

  const updateTitle = useCallback((newTitle: string) => {
    updateAttributes({ title: newTitle })
  }, [updateAttributes])

  const updateRow = useCallback((index: number, field: "label" | "value", text: string) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: text }
    updateAttributes({ rows: newRows })
  }, [rows, updateAttributes])

  const addRow = useCallback(() => {
    updateAttributes({ rows: [...rows, { label: "", value: "" }] })
  }, [rows, updateAttributes])

  const removeRow = useCallback((index: number) => {
    const newRows = rows.filter((_, i) => i !== index)
    updateAttributes({ rows: newRows })
  }, [rows, updateAttributes])

  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        className="not-draggable border border-border/50 rounded-lg my-2 overflow-hidden select-none group"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b border-border/30">
          <div className="flex items-center gap-1.5">
            <PhTable size={14} weight="bold" className="text-muted-foreground shrink-0" />
            <input
              type="text"
              value={title}
              onChange={(e) => updateTitle(e.target.value)}
              className="text-xs font-semibold uppercase tracking-wider bg-transparent border-none outline-none text-muted-foreground w-full"
              placeholder="Infobox Title"
            />
          </div>
          <button
            type="button"
            onClick={() => deleteNode()}
            className="rounded p-0.5 text-muted-foreground/30 hover:text-foreground hover:bg-hover-bg transition-colors opacity-0 group-hover:opacity-100"
            title="Remove infobox"
          >
            <PhX size={12} weight="bold" />
          </button>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/20">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center group/row">
              <input
                type="text"
                value={row.label}
                onChange={(e) => updateRow(index, "label", e.target.value)}
                className="w-[120px] shrink-0 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-secondary/20 border-r border-border/20 outline-none placeholder:text-muted-foreground/30"
                placeholder="Label"
              />
              <input
                type="text"
                value={row.value}
                onChange={(e) => updateRow(index, "value", e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs text-foreground bg-transparent outline-none placeholder:text-muted-foreground/30"
                placeholder="Value"
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="px-2 text-muted-foreground/20 hover:text-red-400 transition-colors opacity-0 group-hover/row:opacity-100"
                title="Remove row"
              >
                <PhTrash size={11} />
              </button>
            </div>
          ))}
        </div>

        {/* Add row button */}
        <button
          type="button"
          onClick={addRow}
          className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary/20 transition-colors border-t border-border/20"
        >
          <PhPlus size={11} />
          <span>Add row</span>
        </button>
      </div>
    </NodeViewWrapper>
  )
}

export const InfoboxBlockNode = Node.create({
  name: "infoboxBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: "Info",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-title") || "Info",
        renderHTML: (attributes: Record<string, string>) => ({ "data-title": attributes.title }),
      },
      rows: {
        default: [{ label: "", value: "" }],
        parseHTML: (element: HTMLElement) => {
          try { return JSON.parse(element.getAttribute("data-rows") || "[]") }
          catch { return [{ label: "", value: "" }] }
        },
        renderHTML: (attributes: Record<string, unknown>) => ({ "data-rows": JSON.stringify(attributes.rows) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="infobox-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "infobox-block" })]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "infoboxBlock") {
          e.commands.deleteSelection()
          return true
        }
        const { $from } = e.state.selection
        const before = $from.nodeBefore
        if (before?.type.name === "infoboxBlock") {
          e.commands.deleteRange({ from: $from.pos - before.nodeSize, to: $from.pos })
          return true
        }
        return false
      },
      Delete: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "infoboxBlock") {
          e.commands.deleteSelection()
          return true
        }
        return false
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(InfoboxNodeView)
  },
})
