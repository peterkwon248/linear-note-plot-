"use client"

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Editor } from "@tiptap/core"
import { useBlockPositions, getBlockDomRect, type BlockPosition } from "./use-block-positions"
import { useBlockReorder, useSideDrop } from "./use-block-reorder"
import { DotsSixVertical, Trash, Copy, ArrowUp, ArrowDown, ArrowsClockwise, Plus, CaretRight, TextH, Paragraph, ListBullets, ListNumbers, CheckSquare, Quotes, Code, Info, CaretDown as PhToggle, Table as PhTable, Minus as PhDivider, Image as PhImage, MathOperations, Database, Columns as PhColumns } from "@/lib/editor/editor-icons"
import { nanoid } from "nanoid"

// ── BlockMenu (dropdown on handle click) ────────────────────

const menuItemCls = "flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[13px] text-[hsl(var(--muted-foreground))] cursor-pointer hover:bg-[hsl(var(--hover-bg))] hover:text-[hsl(var(--foreground))] transition-colors"

function BlockMenu({
  editor,
  block,
  onClose,
}: {
  editor: Editor
  block: BlockPosition
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  // block.docPos comes from doc.forEach offset — this IS the absolute position for top-level nodes
  // doc.forEach offset and doc.descendants pos are identical for top-level children
  const pos = block.docPos
  const size = block.nodeSize

  // Check if the block is an atom node (e.g. noteEmbed, image) — Turn Into doesn't apply
  const nodeAtPos = editor.state.doc.nodeAt(pos)
  const isAtomNode = nodeAtPos?.type.isAtom ?? false

  const execAndClose = (fn: () => void) => {
    // Execute action first, THEN close menu (setTimeout ensures state doesn't unmount mid-action)
    try { fn() } catch (e) { console.error("[BlockMenu]", e) }
    setTimeout(() => onClose(), 0)
  }

  const deleteBlock = () => execAndClose(() => {
    const { tr } = editor.state
    tr.delete(pos, pos + size)
    editor.view.dispatch(tr)
    editor.commands.focus()
  })

  const duplicateBlock = () => execAndClose(() => {
    const node = editor.state.doc.nodeAt(pos)
    if (!node) return
    const { tr } = editor.state
    const copy = node.type.create({ ...node.attrs, id: undefined }, node.content, node.marks)
    tr.insert(pos + size, copy)
    editor.view.dispatch(tr)
    editor.commands.focus()
  })

  const moveUp = () => execAndClose(() => {
    const node = editor.state.doc.nodeAt(pos)
    if (!node || pos === 0) return
    let prevPos = -1
    let prevNode: any = null
    editor.state.doc.forEach((child, offset) => {
      if (offset + child.nodeSize === pos) { prevPos = offset; prevNode = child }
    })
    if (prevPos < 0 || !prevNode) return
    const { tr } = editor.state
    tr.replaceWith(prevPos, pos + node.nodeSize, [node, prevNode])
    editor.view.dispatch(tr)
    editor.commands.focus()
  })

  const moveDown = () => execAndClose(() => {
    const node = editor.state.doc.nodeAt(pos)
    if (!node) return
    const afterPos = pos + node.nodeSize
    const nextNode = editor.state.doc.nodeAt(afterPos)
    if (!nextNode) return
    const { tr } = editor.state
    tr.replaceWith(pos, afterPos + nextNode.nodeSize, [nextNode, node])
    editor.view.dispatch(tr)
    editor.commands.focus()
  })

  /* ── Turn Into items ─────────────────── */
  const turnIntoItems: { label: string; icon: React.ReactNode; action: () => void }[] = [
    { label: "Paragraph", icon: <Paragraph size={14} />, action: () => execAndClose(() => {
      editor.chain().focus().setTextSelection(pos + 1).setParagraph().run()
    })},
    { label: "Heading 1", icon: <TextH size={14} />, action: () => execAndClose(() => {
      editor.chain().focus().setTextSelection(pos + 1).setHeading({ level: 1 }).run()
    })},
    { label: "Heading 2", icon: <TextH size={14} />, action: () => execAndClose(() => {
      editor.chain().focus().setTextSelection(pos + 1).setHeading({ level: 2 }).run()
    })},
    { label: "Heading 3", icon: <TextH size={14} />, action: () => execAndClose(() => {
      editor.chain().focus().setTextSelection(pos + 1).setHeading({ level: 3 }).run()
    })},
    { label: "Bullet List", icon: <ListBullets size={14} />, action: () => execAndClose(() => {
      editor.chain().focus().setTextSelection(pos + 1).toggleBulletList().run()
    })},
    { label: "Numbered List", icon: <ListNumbers size={14} />, action: () => execAndClose(() => {
      editor.chain().focus().setTextSelection(pos + 1).toggleOrderedList().run()
    })},
    { label: "Checklist", icon: <CheckSquare size={14} />, action: () => execAndClose(() => {
      editor.chain().focus().setTextSelection(pos + 1).toggleTaskList().run()
    })},
    { label: "Blockquote", icon: <Quotes size={14} />, action: () => execAndClose(() => {
      editor.chain().focus().setTextSelection(pos + 1).toggleBlockquote().run()
    })},
    { label: "Code Block", icon: <Code size={14} />, action: () => execAndClose(() => {
      editor.chain().focus().setTextSelection(pos + 1).toggleCodeBlock().run()
    })},
  ]

  /* ── Insert Below items ────────────── */
  const insertPos = pos + size // position right after this block
  const insertBelow = (content: any) => execAndClose(() => {
    editor.chain().focus().insertContentAt(insertPos, content).run()
  })

  const insertBelowItems: { label: string; icon: React.ReactNode; action: () => void }[] = [
    { label: "Table", icon: <PhTable size={14} />, action: () => execAndClose(() => {
      editor.chain().focus().setTextSelection(insertPos).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    })},
    { label: "Divider", icon: <PhDivider size={14} />, action: () => insertBelow({ type: "horizontalRule" }) },
    { label: "Callout", icon: <Info size={14} />, action: () => insertBelow({ type: "calloutBlock", attrs: { calloutType: "info" }, content: [{ type: "paragraph" }] }) },
    { label: "Toggle", icon: <PhToggle size={14} />, action: () => execAndClose(() => {
      editor.chain().focus().setTextSelection(insertPos).setDetails().run()
    })},
    { label: "Columns", icon: <PhColumns size={14} />, action: () => insertBelow({ type: "columnsBlock", content: [{ type: "columnCell", content: [{ type: "paragraph" }] }, { type: "columnCell", content: [{ type: "paragraph" }] }] }) },
    { label: "TOC", icon: <ListNumbers size={14} />, action: () => insertBelow({ type: "tocBlock", attrs: { entries: [] } }) },
    { label: "Query", icon: <Database size={14} />, action: () => insertBelow({ type: "queryBlock", attrs: { queryId: nanoid(8) } }) },
    { label: "Code Block", icon: <Code size={14} />, action: () => insertBelow({ type: "codeBlock" }) },
    { label: "Math (Block)", icon: <MathOperations size={14} />, action: () => insertBelow({ type: "blockMath", attrs: { latex: " " } }) },
  ]

  /* ── Submenu state ─────────────────── */
  const [subMenu, setSubMenu] = useState<"turnInto" | "insertBelow" | null>(null)

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        top: 28,
        left: 0,
        zIndex: 9999,
        background: "var(--surface-overlay, hsl(var(--popover)))",
        borderRadius: 8,
        border: "1px solid hsl(var(--border))",
        padding: 4,
        minWidth: 180,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Turn Into — hidden for atom nodes (noteEmbed, image, etc.) */}
      {!isAtomNode && (
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className={menuItemCls}
            onMouseEnter={() => setSubMenu("turnInto")}
            onClick={() => setSubMenu(subMenu === "turnInto" ? null : "turnInto")}
          >
            <ArrowsClockwise size={14} /> <span style={{ flex: 1 }}>Turn Into</span> <CaretRight size={12} />
          </button>
          {subMenu === "turnInto" && (
            <div style={{
              position: "absolute", left: "100%", top: 0, marginLeft: 4, zIndex: 10000,
              background: "var(--surface-overlay, hsl(var(--popover)))", borderRadius: 8,
              border: "1px solid hsl(var(--border))", padding: 4, minWidth: 160,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: 300, overflowY: "auto",
            }}>
              {turnIntoItems.map((item) => (
                <button key={item.label} type="button" className={menuItemCls} onClick={item.action}>
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Insert Below */}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          className={menuItemCls}
          onMouseEnter={() => setSubMenu("insertBelow")}
          onClick={() => setSubMenu(subMenu === "insertBelow" ? null : "insertBelow")}
        >
          <Plus size={14} /> <span style={{ flex: 1 }}>Insert Below</span> <CaretRight size={12} />
        </button>
        {subMenu === "insertBelow" && (
          <div style={{
            position: "absolute", left: "100%", top: 0, marginLeft: 4, zIndex: 10000,
            background: "var(--surface-overlay, hsl(var(--popover)))", borderRadius: 8,
            border: "1px solid hsl(var(--border))", padding: 4, minWidth: 160,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: 300, overflowY: "auto",
          }}>
            {insertBelowItems.map((item) => (
              <button key={item.label} type="button" className={menuItemCls} onClick={item.action}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: "hsl(var(--border))", margin: "4px 0" }} />

      <button type="button" className={menuItemCls} onClick={duplicateBlock}>
        <Copy size={14} /> Duplicate
      </button>
      <button type="button" className={menuItemCls} onClick={moveUp}>
        <ArrowUp size={14} /> Move Up
      </button>
      <button type="button" className={menuItemCls} onClick={moveDown}>
        <ArrowDown size={14} /> Move Down
      </button>
      <div style={{ height: 1, background: "hsl(var(--border))", margin: "4px 0" }} />
      <button type="button" className={menuItemCls} onClick={deleteBlock} style={{ color: "hsl(var(--destructive, 0 84% 60%))" }}>
        <Trash size={14} /> Delete
      </button>
    </div>
  )
}

// ── SortableBlockSlot ───────────────────────────────────────

function SortableBlockSlot({
  block,
  editor,
  containerRef,
  isDraggingAny,
}: {
  block: BlockPosition
  editor: Editor
  containerRef: React.RefObject<HTMLDivElement | null>
  isDraggingAny: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; height: number } | null>(null)

  // Compute position relative to container
  const updatePos = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const blockRect = getBlockDomRect(editor, block.docPos)
    if (!blockRect) return
    const containerRect = container.getBoundingClientRect()
    setPos({
      top: blockRect.top - containerRect.top,
      height: blockRect.height,
    })
  }, [editor, block.docPos, containerRef])

  // Initial + doc change
  useEffect(() => {
    // Small delay to let ProseMirror render first
    const timer = setTimeout(updatePos, 50)
    return () => clearTimeout(timer)
  }, [updatePos, block.nodeSize])

  // Scroll/resize updates
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const scrollParent = container.closest(".overflow-auto, .overflow-y-auto, [style*='overflow']") as HTMLElement | null

    const handler = () => updatePos()
    scrollParent?.addEventListener("scroll", handler, { passive: true })
    window.addEventListener("resize", handler, { passive: true })
    return () => {
      scrollParent?.removeEventListener("scroll", handler)
      window.removeEventListener("resize", handler)
    }
  }, [updatePos, containerRef])

  // Apply opacity to ProseMirror DOM when this block is being dragged
  useEffect(() => {
    if (!isDragging) return
    try {
      const dom = editor.view.nodeDOM(block.docPos) as HTMLElement | null
      if (dom) {
        dom.style.opacity = "0.3"
        dom.style.transition = "opacity 150ms ease"
        return () => {
          dom.style.opacity = ""
          dom.style.transition = ""
        }
      }
    } catch { /* pos might be invalid */ }
  }, [isDragging, editor, block.docPos])

  if (!pos) return null

  const slotStyle: React.CSSProperties = {
    position: "absolute",
    top: pos.top,
    left: -28, // handle in left gutter (outside content area)
    width: 28,
    height: pos.height,
    pointerEvents: menuOpen ? "auto" : "none",
    zIndex: menuOpen ? 9999 : 10,
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  }

  return (
    <div ref={setNodeRef} style={slotStyle} {...attributes}>
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!menuOpen) setHovered(false) }}
        onPointerUp={(e) => {
          // Short click (no drag) → open block menu
          // Using pointerUp to avoid conflict with dnd-kit's pointerDown listeners
          if (!isDragging) {
            e.stopPropagation()
            e.preventDefault()
            setMenuOpen((v) => !v)
          }
        }}
        style={{
          position: "absolute",
          left: 2,
          top: 2,
          width: 24,
          height: 24,
          borderRadius: 4,
          cursor: isDragging ? "grabbing" : "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
          opacity: hovered || isDraggingAny || menuOpen ? 1 : 0,
          transition: "opacity 150ms ease",
          background: hovered || menuOpen ? "hsl(var(--hover-bg))" : "transparent",
        }}
      >
        <DotsSixVertical
          size={14}
                   style={{
            color: hovered || menuOpen
              ? "hsl(var(--muted-foreground))"
              : "hsl(var(--muted-foreground) / 0.4)",
          }}
        />
      </div>
      {/* Block menu dropdown */}
      {menuOpen && (
        <BlockMenu
          editor={editor}
          block={block}
          onClose={() => { setMenuOpen(false); setHovered(false) }}
        />
      )}
    </div>
  )
}

// ── BlockPreview ─────────────────────────────────────────────

function BlockPreview({ block, editor }: { block: BlockPosition; editor: Editor }) {
  const [html, setHtml] = useState("")
  const [width, setWidth] = useState(0)

  useEffect(() => {
    try {
      const dom = editor.view.nodeDOM(block.docPos) as HTMLElement
      if (dom) {
        setHtml(dom.cloneNode(true) as unknown as string)
        setHtml((dom.cloneNode(true) as HTMLElement).outerHTML)
        setWidth(dom.offsetWidth)
      }
    } catch { /* ignore */ }
  }, [editor, block.docPos])

  if (!html) return null

  return (
    <div
      style={{
        width,
        maxHeight: 200,
        overflow: "hidden",
        opacity: 0.85,
        pointerEvents: "none",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
        padding: "4px 8px",
        transform: "scale(1.01)",
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// ── BlockDragOverlay ─────────────────────────────────────────

// ── Side-drop state type ──────────────────────────────────────
interface SideDropState {
  blockId: string
  side: "left" | "right"
}

// ── SideDropIndicator ────────────────────────────────────────
function SideDropIndicator({
  sideDropState,
  blocks,
  editor,
  containerRef,
}: {
  sideDropState: SideDropState
  blocks: BlockPosition[]
  editor: Editor
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const block = blocks.find((b) => b.id === sideDropState.blockId)
  if (!block) return null

  const container = containerRef.current
  if (!container) return null

  const blockRect = getBlockDomRect(editor, block.docPos)
  if (!blockRect) return null

  const containerRect = container.getBoundingClientRect()
  const top = blockRect.top - containerRect.top
  const height = blockRect.height
  const left =
    sideDropState.side === "left"
      ? blockRect.left - containerRect.left
      : blockRect.right - containerRect.left - 2

  return (
    <div
      className="side-drop-indicator"
      style={{
        top,
        left,
        height,
      }}
    />
  )
}

export function BlockDragOverlay({
  editor,
  children,
}: {
  editor: Editor | null
  children: ReactNode
}) {
  const blocks = useBlockPositions(editor)
  const reorder = useBlockReorder(editor)
  const sideDrop = useSideDrop(editor)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sideDropState, setSideDropState] = useState<SideDropState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  )

  const activeBlock = activeId
    ? blocks.find((b) => b.id === activeId) ?? null
    : null

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setSideDropState(null)
    // Blur editor focus to prevent keyboard shortcuts during drag
    if (editor) editor.commands.blur()
  }, [editor])

  // Side-drop: detect left/right 15% zones during drag to create columns
  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (!containerRef.current || !editor) {
        setSideDropState(null)
        return
      }

      const pointer = (event.activatorEvent as PointerEvent)
      if (!pointer) { setSideDropState(null); return }

      // Use current pointer position from the delta
      const pointerX = pointer.clientX + (event.delta?.x ?? 0)
      const pointerY = pointer.clientY + (event.delta?.y ?? 0)

      // Find which block the pointer is over (vertically)
      let targetBlock: BlockPosition | null = null
      for (const block of blocks) {
        if (block.id === activeId) continue // skip self
        const rect = getBlockDomRect(editor, block.docPos)
        if (!rect) continue
        if (pointerY >= rect.top && pointerY <= rect.bottom) {
          targetBlock = block
          break
        }
      }

      if (!targetBlock) {
        setSideDropState(null)
        return
      }

      const rect = getBlockDomRect(editor, targetBlock.docPos)
      if (!rect) { setSideDropState(null); return }

      const targetNode = editor.state.doc.nodeAt(targetBlock.docPos)

      // For columnsBlock: left/right half picks which column cell to insert into
      if (targetNode?.type.name === "columnsBlock") {
        const relXCol = pointerX - rect.left
        const side = relXCol < rect.width / 2 ? "left" : "right"
        setSideDropState({ blockId: targetBlock.id, side })
        return
      }

      // For regular blocks: 15% edge zones trigger column creation
      const threshold = rect.width * 0.15
      const relX = pointerX - rect.left

      if (relX < threshold) {
        setSideDropState({ blockId: targetBlock.id, side: "left" })
      } else if (relX > rect.width - threshold) {
        setSideDropState({ blockId: targetBlock.id, side: "right" })
      } else {
        setSideDropState(null)
      }
    },
    [blocks, editor, activeId]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const currentSideDrop = sideDropState
      setActiveId(null)
      setSideDropState(null)

      const { active, over } = event

      // Side-drop takes priority (uses sideDropState, not dnd-kit's `over`)
      if (currentSideDrop) {
        const fromIndex = blocks.findIndex((b) => b.id === active.id)
        const toIndex = blocks.findIndex((b) => b.id === currentSideDrop.blockId)
        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
          sideDrop(fromIndex, toIndex, currentSideDrop.side, blocks)
        }
        return
      }

      // Regular reorder
      if (!over || active.id === over.id) return
      const fromIndex = blocks.findIndex((b) => b.id === active.id)
      const toIndex = blocks.findIndex((b) => b.id === over.id)
      if (fromIndex === -1 || toIndex === -1) return
      reorder(fromIndex, toIndex, blocks)
    },
    [blocks, reorder, sideDrop, sideDropState]
  )

  // Cancel handler — restore state cleanly
  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setSideDropState(null)
  }, [])

  const blockIds = blocks.map((b) => b.id)

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {children}

      {/* dnd-kit overlay layer */}
      {editor && blocks.length > 1 && (
        <DndContext
          id={`block-drag-${editor.view.dom.id || "main"}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
            {blocks.map((block) => (
              <SortableBlockSlot
                key={block.id}
                block={block}
                editor={editor}
                containerRef={containerRef}
                isDraggingAny={activeId !== null}
              />
            ))}
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeBlock && editor && (
              <BlockPreview block={activeBlock} editor={editor} />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Side-drop vertical indicator */}
      {sideDropState && editor && (
        <SideDropIndicator
          sideDropState={sideDropState}
          blocks={blocks}
          editor={editor}
          containerRef={containerRef}
        />
      )}
    </div>
  )
}
