"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { ListBullets } from "@phosphor-icons/react/dist/ssr/ListBullets"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"
import { MapPin } from "@phosphor-icons/react/dist/ssr/MapPin"
import { TextH } from "@phosphor-icons/react/dist/ssr/TextH"
import { Paragraph } from "@phosphor-icons/react/dist/ssr/Paragraph"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { ArrowsIn } from "@phosphor-icons/react/dist/ssr/ArrowsIn"
import { useBlockResize } from "@/components/editor/hooks/use-block-resize"
import { BlockResizeHandles } from "@/components/editor/hooks/block-resize-handles"

/* ── Types ─────────────────────────────────────────────────── */

interface TocEntry {
  label: string
  targetId: string
  indent: number
}

interface BlockTarget {
  id: string
  text: string
  level: number
  pos: number
  type: "heading" | "bookmark" | "paragraph" | "list" | "other"
}

/* ── Helpers ───────────────────────────────────────────────── */

/** Collect ALL text blocks from the document (headings, paragraphs, lists, bookmarks) */
function collectAllBlocks(editor: NodeViewProps["editor"]): BlockTarget[] {
  const blocks: BlockTarget[] = []
  let skippedTitle = false
  editor.state.doc.descendants((node, pos) => {
    // Skip TOC block itself
    if (node.type.name === "tocBlock") return false

    if (node.type.name === "heading") {
      if (!skippedTitle) { skippedTitle = true; return }
      const text = node.textContent.trim()
      if (!text) return
      blocks.push({
        id: node.attrs.id || `heading-${pos}`,
        text,
        level: node.attrs.level as number,
        pos: pos + 1,
        type: "heading",
      })
    } else if (node.type.name === "paragraph" && node.content.size > 0) {
      const text = node.textContent.trim()
      if (!text) return
      blocks.push({
        id: node.attrs.id || `p-${pos}`,
        text: text.length > 60 ? text.slice(0, 60) + "…" : text,
        level: 0,
        pos: pos + 1,
        type: "paragraph",
      })
    } else if (node.type.name === "anchorMark" || node.type.name === "anchorDivider") {
      blocks.push({
        id: node.attrs.id || `anchor-${pos}`,
        text: node.attrs.label || "Bookmark",
        level: 99,
        pos: pos + 1,
        type: "bookmark",
      })
    } else if ((node.type.name === "bulletList" || node.type.name === "orderedList") && node.content.size > 0) {
      const firstItem = node.firstChild?.textContent?.trim()
      if (firstItem) {
        blocks.push({
          id: node.attrs.id || `list-${pos}`,
          text: firstItem.length > 60 ? firstItem.slice(0, 60) + "…" : firstItem,
          level: 0,
          pos: pos + 1,
          type: "list",
        })
      }
      return false // don't descend into list items
    }
  })
  return blocks
}

/** Find a node by its `id` attr in the document and scroll to it */
function scrollToId(editor: NodeViewProps["editor"], targetId: string) {
  if (!targetId) return
  // Walk the document to find the node with matching id
  let foundPos: number | null = null
  editor.state.doc.descendants((node, pos) => {
    if (foundPos !== null) return false // already found
    if (node.attrs?.id === targetId) {
      foundPos = pos
      return false
    }
  })
  if (foundPos === null) return

  // Set cursor inside the node (+1) and focus editor
  editor.chain().focus().setTextSelection(foundPos + 1).run()
  // Scroll to it
  try {
    const domNode = editor.view.nodeDOM(foundPos) as HTMLElement | null
    if (domNode) {
      domNode.scrollIntoView({ behavior: "smooth", block: "start" })
      return
    }
  } catch { /* fallback below */ }
  try {
    const domInfo = editor.view.domAtPos(foundPos + 1)
    ;(domInfo.node as HTMLElement)?.scrollIntoView?.({ behavior: "smooth", block: "start" })
  } catch { /* ignore */ }
}

/* ── Block Picker (the + button dropdown) ──────────────────── */

function BlockPicker({
  editor,
  onSelect,
  onClose,
}: {
  editor: NodeViewProps["editor"]
  onSelect: (target: BlockTarget) => void
  onClose: () => void
}) {
  const [filter, setFilter] = useState("")
  const [blocks, setBlocks] = useState<BlockTarget[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setBlocks(collectAllBlocks(editor))
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [editor])

  const filtered = filter
    ? blocks.filter((b) => b.text.toLowerCase().includes(filter.toLowerCase()))
    : blocks

  const headings = filtered.filter((b) => b.type === "heading")
  const others = filtered.filter((b) => b.type !== "heading")

  return (
    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-surface-overlay border border-border rounded-lg shadow-lg overflow-hidden">
      {/* Search */}
      <div className="p-2 border-b border-border">
        <input
          ref={inputRef}
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose()
            if (e.key === "Enter" && filtered.length > 0) {
              onSelect(filtered[0])
            }
          }}
          placeholder="Search blocks..."
          className="w-full bg-transparent border-0 outline-none text-note text-foreground placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Results */}
      <div className="max-h-56 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          <p className="text-2xs text-muted-foreground/50 px-3 py-2">No blocks found.</p>
        ) : (
          <>
            {/* Headings first */}
            {headings.length > 0 && (
              <>
                <p className="text-2xs text-muted-foreground/40 px-3 py-1 font-medium uppercase tracking-wider">Headings</p>
                {headings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelect(b)}
                    className="w-full text-left text-note px-3 py-1.5 rounded hover:bg-hover-bg text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                  >
                    <TextH size={12} className="opacity-40 flex-shrink-0" />
                    <span className="text-2xs opacity-40 flex-shrink-0">H{b.level}</span>
                    <span className="truncate">{b.text}</span>
                  </button>
                ))}
              </>
            )}

            {/* Other blocks */}
            {others.length > 0 && (
              <>
                {headings.length > 0 && (
                  <p className="text-2xs text-muted-foreground/40 px-3 py-1 mt-1 font-medium uppercase tracking-wider">Paragraphs & Lists</p>
                )}
                {others.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelect(b)}
                    className="w-full text-left text-note px-3 py-1.5 rounded hover:bg-hover-bg text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                  >
                    {b.type === "bookmark" ? (
                      <MapPin size={12} weight="fill" className="opacity-40 flex-shrink-0" />
                    ) : (
                      <Paragraph size={12} className="opacity-40 flex-shrink-0" />
                    )}
                    <span className="truncate">{b.text}</span>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Manual entry option at bottom */}
      <div className="border-t border-border p-1">
        <button
          type="button"
          onClick={() => onSelect({ id: "", text: "", level: 0, pos: 0, type: "other" })}
          className="w-full text-left text-2xs px-3 py-1.5 rounded hover:bg-hover-bg text-muted-foreground/50 hover:text-muted-foreground flex items-center gap-2 transition-colors"
        >
          <PencilSimple size={12} className="opacity-50" />
          Add blank item (type manually)
        </button>
      </div>
    </div>
  )
}

/* ── NodeView Component ────────────────────────────────────── */

function TocNodeView({ editor, node, updateAttributes, deleteNode }: NodeViewProps) {
  const width = node.attrs.width as number | null
  const height = node.attrs.height as number | null
  const { containerRef, isResizing, onResizeStart } = useBlockResize(width, height, updateAttributes)
  const [entries, setEntries] = useState<TocEntry[]>(() => {
    const saved = node.attrs.entries as TocEntry[] | undefined
    return saved && saved.length > 0 ? saved : []
  })
  const [showPicker, setShowPicker] = useState(false)
  const [linkingIdx, setLinkingIdx] = useState<number | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const persist = useCallback(
    (next: TocEntry[]) => {
      setEntries(next)
      updateAttributes({ entries: next })
    },
    [updateAttributes],
  )

  /* ── Picker callback: 1-click add ────────── */

  const handlePickerSelect = (target: BlockTarget) => {
    if (target.id) {
      // Block selected — create entry with label + link in one shot
      persist([...entries, { label: target.text, targetId: target.id, indent: target.type === "heading" ? Math.max(0, target.level - 2) : 0 }])
    } else {
      // Blank item — add empty and start editing
      persist([...entries, { label: "", targetId: "", indent: 0 }])
      setEditingIdx(entries.length)
    }
    setShowPicker(false)
  }

  /** Link an existing entry to a block (per-entry picker) */
  const handleLinkSelect = (idx: number, target: BlockTarget) => {
    if (target.id) {
      persist(entries.map((e, i) => i === idx ? { ...e, targetId: target.id } : e))
    } else {
      // "Remove link" — unlink
      persist(entries.map((e, i) => i === idx ? { ...e, targetId: "" } : e))
    }
    setLinkingIdx(null)
  }

  /* ── Entry actions ───────────────────────── */

  const removeEntry = (idx: number) => {
    persist(entries.filter((_, i) => i !== idx))
  }

  const updateLabel = (idx: number, label: string) => {
    persist(entries.map((e, i) => (i === idx ? { ...e, label } : e)))
  }

  const changeIndent = (idx: number, delta: number) => {
    persist(entries.map((e, i) =>
      i === idx ? { ...e, indent: Math.max(0, Math.min(3, e.indent + delta)) } : e,
    ))
  }

  /* ── Drag reorder ────────────────────────── */

  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx) }
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return }
    const next = [...entries]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(idx, 0, moved)
    persist(next)
    setDragIdx(null)
    setDragOverIdx(null)
  }
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null) }

  /* ── Render ──────────────────────────────── */

  const indentCls: Record<number, string> = { 0: "pl-0", 1: "pl-5", 2: "pl-10", 3: "pl-16" }

  return (
    <NodeViewWrapper>
      <div
        ref={containerRef}
        contentEditable={false}
        className={`not-draggable bg-secondary/30 border border-border-subtle rounded-lg p-4 my-2 select-none block-resize-wrapper ${isResizing ? "is-resizing" : ""}`}
        style={{
          ...(width ? { width: `${width}px` } : {}),
          ...(height ? { height: `${height}px`, overflowY: "auto" as const } : {}),
        }}
      >
        {editor?.isEditable && <BlockResizeHandles onResizeStart={onResizeStart} />}
        {/* Header */}
        <div className="relative flex items-center gap-2 mb-3 text-muted-foreground">
          <ListBullets size={14} weight="bold" />
          <span className="text-2xs font-semibold uppercase tracking-wider flex-1">
            Table of Contents
          </span>
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg transition-colors"
            title="Add item from document"
          >
            <Plus size={12} weight="bold" />
          </button>
          {(width || height) && (
            <button
              type="button"
              onClick={() => updateAttributes({ width: null, height: null })}
              className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Reset size"
            >
              <ArrowsIn size={12} weight="bold" />
            </button>
          )}
          <button
            type="button"
            onClick={() => deleteNode()}
            className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg transition-colors"
            title="Remove TOC block"
          >
            <PhX size={12} weight="bold" />
          </button>

          {/* Block Picker dropdown */}
          {showPicker && (
            <BlockPicker
              editor={editor}
              onSelect={handlePickerSelect}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="relative flex flex-col items-center gap-2 py-3">
            <p className="text-2xs text-muted-foreground/50 italic">
              Click + to add items from your document.
            </p>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-1 text-2xs text-accent hover:text-accent/80 transition-colors"
            >
              <Plus size={10} /> Pick from document
            </button>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {entries.map((entry, idx) => (
              <li
                key={idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={[
                  "group relative flex items-center gap-1 rounded transition-colors",
                  indentCls[entry.indent] ?? "pl-0",
                  dragOverIdx === idx ? "bg-accent/10" : "",
                  dragIdx === idx ? "opacity-40" : "",
                ].join(" ")}
              >
                {/* Drag handle */}
                <span className="cursor-grab opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0">
                  <DotsSixVertical size={12} />
                </span>

                {/* Label — click to scroll, double-click to edit */}
                {editingIdx === idx ? (
                  <input
                    type="text"
                    autoFocus
                    value={entry.label}
                    onChange={(e) => updateLabel(idx, e.target.value)}
                    onBlur={() => setEditingIdx(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") setEditingIdx(null)
                      if (e.key === "Tab") {
                        e.preventDefault()
                        changeIndent(idx, e.shiftKey ? -1 : 1)
                      }
                    }}
                    data-toc-input
                    className="flex-1 bg-transparent border border-accent/30 rounded outline-none text-note leading-relaxed px-1 py-0.5 text-foreground"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (entry.targetId) scrollToId(editor, entry.targetId)
                    }}
                    onDoubleClick={() => setEditingIdx(idx)}
                    className={[
                      "flex-1 text-left text-note leading-relaxed px-1 py-0.5 rounded transition-colors truncate",
                      entry.targetId
                        ? "text-foreground hover:text-accent cursor-pointer"
                        : "text-muted-foreground",
                    ].join(" ")}
                    title={entry.targetId ? "Click to jump, double-click to edit" : "Double-click to edit"}
                  >
                    {entry.label || <span className="opacity-40 italic">Untitled</span>}
                  </button>
                )}

                {/* Link button — click to link/relink to a block */}
                <button
                  type="button"
                  onClick={() => setLinkingIdx(linkingIdx === idx ? null : idx)}
                  className={[
                    "flex-shrink-0 rounded p-0.5 transition-colors",
                    entry.targetId
                      ? "text-accent/50 hover:text-accent"
                      : "opacity-0 group-hover:opacity-50 hover:!opacity-100 text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                  title={entry.targetId ? "Change link" : "Link to block"}
                >
                  {entry.targetId ? <MapPin size={10} weight="fill" /> : <PhLink size={10} />}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removeEntry(idx)}
                  className="flex-shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-40 hover:!opacity-100 text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove"
                >
                  <Trash size={10} />
                </button>

                {/* Per-entry block picker */}
                {linkingIdx === idx && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50">
                    <BlockPicker
                      editor={editor}
                      onSelect={(target) => handleLinkSelect(idx, target)}
                      onClose={() => setLinkingIdx(null)}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Quick add at bottom */}
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1 mt-2 text-2xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <Plus size={10} /> Add item
          </button>
        )}
      </div>
    </NodeViewWrapper>
  )
}

/* ── TipTap Node Definition ────────────────────────────────── */

export const TocBlockNode = Node.create({
  name: "tocBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      entries: {
        default: [],
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute("data-entries") || "[]")
          } catch {
            return []
          }
        },
        renderHTML: (attrs) => ({ "data-entries": JSON.stringify(attrs.entries) }),
      },
      width: {
        default: null,
        parseHTML: (el) => {
          const w = el.getAttribute("data-width")
          return w ? parseInt(w, 10) : null
        },
        renderHTML: (attrs) => attrs.width ? { "data-width": attrs.width } : {},
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
    return [{ tag: 'div[data-type="toc-block"]' }] },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "toc-block" })]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "tocBlock") { e.commands.deleteSelection(); return true }
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
        if (sel.node?.type.name === "tocBlock") { e.commands.deleteSelection(); return true }
        return false
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(TocNodeView)
  },
})
