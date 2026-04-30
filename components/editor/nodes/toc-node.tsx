"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Layout, X as PhX, Plus, Trash, DotsSixVertical, DotsThree, MapPin, TextH, Paragraph, PencilSimple, Link as PhLink, ArrowsIn, Warning } from "@/lib/editor/editor-icons"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { useBlockResize } from "@/components/editor/hooks/use-block-resize"
import { BlockResizeHandles } from "@/components/editor/hooks/block-resize-handles"
import { useCommentStatusByBlockId, STATUS_COLORS } from "@/components/comments/use-block-comment-status"
import { ChatCircle } from "@phosphor-icons/react/dist/ssr/ChatCircle"

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

/** Comment count badge for TOC entry — shows status dot + count if any comments. */
function TocCommentBadge({ blockId }: { blockId: string }) {
  const { topStatus, openCount } = useCommentStatusByBlockId(blockId)
  if (!topStatus || openCount === 0) return null
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1 py-px text-[9px] font-semibold bg-muted-foreground/10 text-muted-foreground/80"
      title={`${openCount} open comment${openCount === 1 ? "" : "s"}`}
    >
      <span className={`w-1 h-1 rounded-full ${STATUS_COLORS[topStatus].dot}`} />
      <ChatCircle size={9} weight="fill" className="text-muted-foreground/70" />
      <span className="tabular-nums">{openCount}</span>
    </span>
  )
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
  onCreate,
  createLabel = "Create",
}: {
  editor: NodeViewProps["editor"]
  onSelect: (target: BlockTarget) => void
  onClose: () => void
  /** If provided, show "Create <filter>" option when no results match. */
  onCreate?: (label: string) => void
  /** Prefix for the create button, e.g. "Create section" / "Create subsection". */
  createLabel?: string
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
      <div className="flex items-center gap-1 p-2 border-b border-border">
        <input
          ref={inputRef}
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose()
            if (e.key === "Enter") {
              if (filtered.length > 0) {
                onSelect(filtered[0])
              } else if (onCreate && filter.trim()) {
                onCreate(filter.trim())
              }
            }
          }}
          placeholder="Search blocks…  (Esc to close)"
          className="flex-1 bg-transparent border-0 outline-none text-note text-foreground placeholder:text-muted-foreground/70"
        />
        <button
          type="button"
          onClick={onClose}
          title="Close"
          className="p-1 rounded text-muted-foreground/70 hover:text-foreground hover:bg-hover-bg transition-colors"
        >
          <PhX size={12} />
        </button>
      </div>

      {/* Results */}
      <div className="max-h-56 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          onCreate && filter.trim() ? (
            <button
              type="button"
              onClick={() => onCreate(filter.trim())}
              className="w-full text-left text-note px-3 py-2 rounded hover:bg-hover-bg text-accent hover:text-accent flex items-center gap-2 transition-colors"
            >
              <Plus size={12} className="flex-shrink-0" />
              <span className="truncate">{createLabel}: <span className="font-medium">{filter.trim()}</span></span>
              <span className="ml-auto text-2xs text-muted-foreground/70">Enter</span>
            </button>
          ) : (
            <p className="text-2xs text-muted-foreground/70 px-3 py-2">No blocks found.</p>
          )
        ) : (
          <>
            {/* Headings first */}
            {headings.length > 0 && (
              <>
                <p className="text-2xs text-muted-foreground/70 px-3 py-1 font-medium uppercase tracking-wider">Headings</p>
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
                  <p className="text-2xs text-muted-foreground/70 px-3 py-1 mt-1 font-medium uppercase tracking-wider">Paragraphs & Lists</p>
                )}
                {others.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelect(b)}
                    className="w-full text-left text-note px-3 py-1.5 rounded hover:bg-hover-bg text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                  >
                    {b.type === "bookmark" ? (
                      <MapPin size={12} className="opacity-40 flex-shrink-0" />
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
          className="w-full text-left text-2xs px-3 py-1.5 rounded hover:bg-hover-bg text-muted-foreground/70 hover:text-muted-foreground flex items-center gap-2 transition-colors"
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
  const [subPickerIdx, setSubPickerIdx] = useState<number | null>(null)
  const [linkingIdx, setLinkingIdx] = useState<number | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set())
  const [idTextMap, setIdTextMap] = useState<Map<string, string>>(new Map())

  /* Track which block ids currently exist in the doc + their text (orphan + mismatch detection) */
  useEffect(() => {
    if (!editor) return
    const compute = () => {
      const ids = new Set<string>()
      const texts = new Map<string, string>()
      editor.state.doc.descendants((node) => {
        const id = node.attrs?.id as string | undefined
        if (id) {
          ids.add(id)
          const t = node.textContent.trim()
          if (t) texts.set(id, t)
        }
      })
      setExistingIds(ids)
      setIdTextMap(texts)
    }
    compute()
    editor.on("update", compute)
    return () => { editor.off("update", compute) }
  }, [editor])

  /* Paint gutter numbers onto linked blocks (data-toc-num attribute → CSS ::before).
     Edit mode: ProseMirror rebuilds node DOM on every transaction, wiping our attribute.
     Strategy: re-paint on transaction + MutationObserver + light interval safety net. */
  useEffect(() => {
    if (!editor) return
    const root = editor.view.dom as HTMLElement
    const desired = new Map<string, { num: string; depth: number; childDepth?: number; firstChildId?: string }>()
    const counters: number[] = []
    let lastIndent = -1
    const normDepths: number[] = entries.map((e) => Math.max(0, Math.min(3, e.indent)))
    entries.forEach((e, i) => {
      const depth = normDepths[i]
      if (depth > lastIndent) {
        while (counters.length <= depth) counters.push(0)
      } else if (depth < lastIndent) {
        counters.length = depth + 1
      }
      counters[depth] = (counters[depth] || 0) + 1
      const num = counters.slice(0, depth + 1).join(".")
      lastIndent = depth
      if (e.targetId) desired.set(e.targetId, { num, depth })
    })
    // For each parent, find its FIRST direct child (line stops right before it)
    entries.forEach((e, i) => {
      const d = normDepths[i]
      if (!e.targetId) return
      for (let j = i + 1; j < entries.length; j++) {
        if (normDepths[j] <= d) break
        if (normDepths[j] === d + 1 && entries[j].targetId) {
          const cur = desired.get(e.targetId)
          if (cur) {
            cur.childDepth = normDepths[j]
            cur.firstChildId = entries[j].targetId
          }
          break
        }
      }
    })

    const findEl = (id: string): HTMLElement | null => {
      const safe = (window as any).CSS?.escape ? CSS.escape(id) : id
      return root.querySelector<HTMLElement>(`[data-id="${safe}"]`) || root.querySelector<HTMLElement>(`[id="${safe}"]`)
    }
    const paint = () => {
      root.querySelectorAll<HTMLElement>("[data-toc-num]").forEach((el) => {
        const id = el.getAttribute("data-id") || el.getAttribute("id") || ""
        const want = desired.get(id)
        if (!want || want.num !== el.getAttribute("data-toc-num")) {
          el.removeAttribute("data-toc-num")
          el.removeAttribute("data-toc-depth")
          el.removeAttribute("data-toc-child-depth")
          el.style.removeProperty("--toc-group-height")
        }
      })
      desired.forEach(({ num, depth, childDepth, firstChildId }, id) => {
        const el = findEl(id)
        if (!el) return
        if (el.getAttribute("data-toc-num") !== num) el.setAttribute("data-toc-num", num)
        if (el.getAttribute("data-toc-depth") !== String(depth)) el.setAttribute("data-toc-depth", String(depth))
        if (childDepth !== undefined) {
          if (el.getAttribute("data-toc-child-depth") !== String(childDepth)) el.setAttribute("data-toc-child-depth", String(childDepth))
          // Measure line height = parent.top → firstChild.top (stops right before the first subsection)
          if (firstChildId) {
            const firstEl = findEl(firstChildId)
            if (firstEl) {
              const parentRect = el.getBoundingClientRect()
              const firstRect = firstEl.getBoundingClientRect()
              const h = Math.max(0, firstRect.top - parentRect.top)
              el.style.setProperty("--toc-group-height", `${h}px`)
            }
          }
        } else {
          if (el.hasAttribute("data-toc-child-depth")) el.removeAttribute("data-toc-child-depth")
          el.style.removeProperty("--toc-group-height")
        }
      })
    }

    paint()
    // Initial-mount retries: ProseMirror may not have painted paragraphs yet
    const t1 = window.setTimeout(paint, 50)
    const t2 = window.setTimeout(paint, 200)
    const t3 = window.setTimeout(paint, 600)

    const onTx = () => requestAnimationFrame(paint)
    editor.on("transaction", onTx)

    const mo = new MutationObserver(() => requestAnimationFrame(paint))
    mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-id", "id"] })

    // Also re-measure on window resize (affects getBoundingClientRect)
    const onResize = () => requestAnimationFrame(paint)
    window.addEventListener("resize", onResize)

    // Safety net: catch any missed DOM swaps (e.g., NodeView re-renders)
    const interval = window.setInterval(paint, 1000)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      editor.off("transaction", onTx)
      mo.disconnect()
      window.removeEventListener("resize", onResize)
      window.clearInterval(interval)
    }
  }, [editor, entries])

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
      // Block selected — always top-level from bottom "Section" button
      persist([...entries, { label: target.text, targetId: target.id, indent: 0 }])
    } else {
      // Blank item — add empty and start editing
      persist([...entries, { label: "", targetId: "", indent: 0 }])
      setEditingIdx(entries.length)
    }
    setShowPicker(false)
  }

  /** Subsection picker callback — insert right after parent entry with indent+1 */
  const handleSubPickerSelect = (parentIdx: number, target: BlockTarget) => {
    const parent = entries[parentIdx]
    if (!parent) { setSubPickerIdx(null); return }
    const newIndent = Math.min(3, parent.indent + 1)
    const newEntry: TocEntry = target.id
      ? { label: target.text, targetId: target.id, indent: newIndent }
      : { label: "", targetId: "", indent: newIndent }
    const next = [...entries]
    next.splice(parentIdx + 1, 0, newEntry)
    persist(next)
    if (!target.id) setEditingIdx(parentIdx + 1)
    setSubPickerIdx(null)
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

  /**
   * Create a brand-new heading + TOC entry in one shot (from picker's "Create" option).
   * Mirrors materializeHeading but inserts entry at a specific index with given indent.
   */
  const createEntryWithHeading = (label: string, indent: number, insertIdx: number) => {
    if (!editor) return
    const level = Math.min(6, 2 + indent)

    // Find insertion position in doc: after previous entry's target block, or end of doc
    let insertPos = editor.state.doc.content.size
    for (let i = insertIdx - 1; i >= 0; i--) {
      const prev = entries[i]
      if (!prev.targetId) continue
      let foundEnd: number | null = null
      editor.state.doc.descendants((node, pos) => {
        if (foundEnd !== null) return false
        if (node.attrs?.id === prev.targetId) {
          foundEnd = pos + node.nodeSize
          return false
        }
      })
      if (foundEnd !== null) { insertPos = foundEnd; break }
    }

    editor.chain()
      .insertContentAt(insertPos, {
        type: "heading",
        attrs: { level },
        content: [{ type: "text", text: label.trim() }],
      })
      .run()

    const insertedNode = editor.state.doc.nodeAt(insertPos)
    const actualId = (insertedNode?.attrs as { id?: string } | undefined)?.id ?? ""

    const newEntry: TocEntry = { label: label.trim(), targetId: actualId, indent }
    const next = [...entries]
    next.splice(insertIdx, 0, newEntry)
    persist(next)
  }

  /**
   * Materialize a heading in the doc for a blank entry.
   * Weak coupling: created once at first commit; later edits/deletes don't sync.
   */
  const materializeHeading = (idx: number) => {
    const entry = entries[idx]
    if (!entry || !entry.label.trim() || entry.targetId) return
    if (!editor) return

    const level = Math.min(6, 2 + entry.indent)

    // Find insertion position: after previous entry's target block, or end of doc
    let insertPos = editor.state.doc.content.size
    for (let i = idx - 1; i >= 0; i--) {
      const prev = entries[i]
      if (!prev.targetId) continue
      let foundEnd: number | null = null
      editor.state.doc.descendants((node, pos) => {
        if (foundEnd !== null) return false
        if (node.attrs?.id === prev.targetId) {
          foundEnd = pos + node.nodeSize
          return false
        }
      })
      if (foundEnd !== null) { insertPos = foundEnd; break }
    }

    // Insert WITHOUT id — UniqueID extension will assign one
    editor.chain()
      .insertContentAt(insertPos, {
        type: "heading",
        attrs: { level },
        content: [{ type: "text", text: entry.label.trim() }],
      })
      .run()

    // Read the actual id assigned by UniqueID at the insertion point
    const insertedNode = editor.state.doc.nodeAt(insertPos)
    const actualId = (insertedNode?.attrs as { id?: string } | undefined)?.id
    if (actualId) {
      persist(entries.map((e, i) => i === idx ? { ...e, targetId: actualId } : e))
    }
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

  // Auto-numbering based on indent: 1, 1.1, 1.1.1, 2, 2.1 ...
  const numbers: string[] = (() => {
    const counters: number[] = []
    const out: string[] = []
    let lastIndent = -1
    entries.forEach((e) => {
      const depth = Math.max(0, Math.min(3, e.indent))
      if (depth > lastIndent) {
        while (counters.length <= depth) counters.push(0)
      } else if (depth < lastIndent) {
        counters.length = depth + 1
      }
      counters[depth] = (counters[depth] || 0) + 1
      out.push(counters.slice(0, depth + 1).join("."))
      lastIndent = depth
    })
    return out
  })()

  return (
    <NodeViewWrapper>
      <div
        ref={containerRef}
        contentEditable={false}
        className={`not-draggable bg-secondary/20 border border-border-subtle rounded-lg px-3 py-2 my-2 select-none block-resize-wrapper ${isResizing ? "is-resizing" : ""}`}
        style={{
          ...(width ? { width: `${width}px` } : {}),
          ...(height ? { height: `${height}px`, overflowY: "auto" as const } : {}),
        }}
      >
        {editor?.isEditable && <BlockResizeHandles onResizeStart={onResizeStart} />}
        {/* Header */}
        <div className="relative flex items-center gap-1.5 mb-1.5 text-muted-foreground/60">
          <Layout size={11} className="opacity-60" />
          <span className="text-2xs tracking-wide flex-1">
            Contents
          </span>
          {(width || height) && (
            <button
              type="button"
              onClick={() => updateAttributes({ width: null, height: null })}
              className="rounded p-0.5 text-muted-foreground/70 hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Reset size"
            >
              <ArrowsIn size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={() => deleteNode()}
            className="rounded p-0.5 text-muted-foreground/70 hover:text-foreground hover:bg-hover-bg transition-colors"
            title="Remove TOC block"
          >
            <PhX size={12} />
          </button>

          {/* Block Picker dropdown */}
          {showPicker && (
            <BlockPicker
              editor={editor}
              onSelect={handlePickerSelect}
              onClose={() => setShowPicker(false)}
              onCreate={(label) => {
                createEntryWithHeading(label, 0, entries.length)
                setShowPicker(false)
              }}
              createLabel="Create section"
            />
          )}
        </div>

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="relative flex flex-col items-center gap-2 py-3">
            <p className="text-2xs text-muted-foreground/70 italic">
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

                {/* Auto-number */}
                <span className="text-2xs text-accent/70 tabular-nums flex-shrink-0 min-w-[1.5em] text-right font-medium">
                  {numbers[idx]}
                </span>

                {/* Label — click to scroll, double-click to edit */}
                {editingIdx === idx ? (
                  <input
                    type="text"
                    autoFocus
                    value={entry.label}
                    onChange={(e) => updateLabel(idx, e.target.value)}
                    onBlur={() => { materializeHeading(idx); setEditingIdx(null) }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") {
                        if (e.key === "Enter") materializeHeading(idx)
                        setEditingIdx(null)
                      }
                      if (e.key === "Tab") {
                        e.preventDefault()
                        changeIndent(idx, e.shiftKey ? -1 : 1)
                      }
                    }}
                    data-toc-input
                    className="flex-1 bg-transparent border border-accent/30 rounded outline-none text-note leading-relaxed px-1 py-0.5 text-foreground"
                  />
                ) : (() => {
                  const isOrphan = !!entry.targetId && !existingIds.has(entry.targetId)
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (entry.targetId && !isOrphan) scrollToId(editor, entry.targetId)
                      }}
                      onDoubleClick={() => setEditingIdx(idx)}
                      className={[
                        "flex-1 text-left text-note leading-relaxed px-1 py-0.5 rounded transition-colors break-words",
                        isOrphan
                          ? "text-muted-foreground/60 line-through decoration-muted-foreground/40 cursor-help"
                          : entry.targetId
                          ? "text-foreground hover:text-accent cursor-pointer"
                          : "text-muted-foreground",
                      ].join(" ")}
                      title={
                        isOrphan
                          ? "Orphan — linked block was deleted. Double-click to edit, or remove entry."
                          : entry.targetId
                          ? "Click to jump, double-click to edit"
                          : "Double-click to edit"
                      }
                    >
                      {entry.label || <span className="opacity-40 italic">Untitled</span>}
                    </button>
                  )
                })()}

                {/* Comment count badge */}
                {entry.targetId && <TocCommentBadge blockId={entry.targetId} />}

                {/* Add subsection — always faintly visible */}
                {entry.indent < 3 && (
                  <button
                    type="button"
                    onClick={() => setSubPickerIdx(subPickerIdx === idx ? null : idx)}
                    className="flex-shrink-0 rounded p-1 opacity-40 hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-all"
                    title="Add subsection"
                  >
                    <Plus size={13} />
                  </button>
                )}

                {/* Overflow menu — relink / delete */}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className={[
                        "flex-shrink-0 rounded p-1 transition-all hover:bg-hover-bg",
                        entry.targetId
                          ? "text-accent/60 hover:text-accent opacity-60 hover:opacity-100"
                          : "opacity-40 hover:opacity-100 text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                      title="More"
                    >
                      <DotsThree size={14} />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={4}
                      className="min-w-[160px] rounded-lg bg-surface-overlay border border-border shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1 z-[9999]"
                    >
                      <DropdownMenu.Item
                        onSelect={() => setEditingIdx(idx)}
                        className="flex items-center gap-2 py-1.5 px-2.5 rounded-md text-note text-muted-foreground outline-none cursor-pointer hover:bg-hover-bg hover:text-foreground data-[highlighted]:bg-hover-bg data-[highlighted]:text-foreground"
                      >
                        <PencilSimple size={14} />
                        Rename
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onSelect={() => setTimeout(() => setLinkingIdx(idx), 0)}
                        className="flex items-center gap-2 py-1.5 px-2.5 rounded-md text-note text-muted-foreground outline-none cursor-pointer hover:bg-hover-bg hover:text-foreground data-[highlighted]:bg-hover-bg data-[highlighted]:text-foreground"
                      >
                        {entry.targetId ? <MapPin size={14} /> : <PhLink size={14} />}
                        {entry.targetId ? "Change link" : "Link to block"}
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="my-1 h-px bg-border" />
                      <DropdownMenu.Item
                        onSelect={() => removeEntry(idx)}
                        className="flex items-center gap-2 py-1.5 px-2.5 rounded-md text-note text-muted-foreground outline-none cursor-pointer hover:bg-hover-bg hover:text-destructive data-[highlighted]:bg-hover-bg data-[highlighted]:text-destructive"
                      >
                        <Trash size={14} />
                        Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>

                {/* Per-entry block picker (linking) */}
                {linkingIdx === idx && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50">
                    <BlockPicker
                      editor={editor}
                      onSelect={(target) => handleLinkSelect(idx, target)}
                      onClose={() => setLinkingIdx(null)}
                    />
                  </div>
                )}

                {/* Subsection picker under this entry */}
                {subPickerIdx === idx && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50">
                    <BlockPicker
                      editor={editor}
                      onSelect={(target) => handleSubPickerSelect(idx, target)}
                      onClose={() => setSubPickerIdx(null)}
                      onCreate={(label) => {
                        const parent = entries[idx]
                        const newIndent = Math.min(3, (parent?.indent ?? 0) + 1)
                        createEntryWithHeading(label, newIndent, idx + 1)
                        setSubPickerIdx(null)
                      }}
                      createLabel="Create subsection"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Quick add at bottom — top-level section */}
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1 mt-2 text-2xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            title="Add top-level section"
          >
            <Plus size={10} /> Section
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
