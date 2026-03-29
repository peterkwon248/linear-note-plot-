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
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Editor } from "@tiptap/core"
import { useBlockPositions, getBlockDomRect, type BlockPosition } from "./use-block-positions"
import { useBlockReorder } from "./use-block-reorder"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr/DotsSixVertical"

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
    pointerEvents: "none",
    zIndex: 10,
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  }

  return (
    <div ref={setNodeRef} style={slotStyle} {...attributes}>
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "absolute",
          left: 2,
          top: Math.max(0, (pos.height - 24) / 2),
          width: 24,
          height: 24,
          borderRadius: 4,
          cursor: isDragging ? "grabbing" : "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
          opacity: hovered || isDraggingAny ? 1 : 0,
          transition: "opacity 150ms ease",
          background: hovered ? "hsl(var(--hover-bg))" : "transparent",
        }}
      >
        <DotsSixVertical
          size={14}
          weight="bold"
          style={{
            color: hovered
              ? "hsl(var(--muted-foreground))"
              : "hsl(var(--muted-foreground) / 0.4)",
          }}
        />
      </div>
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

export function BlockDragOverlay({
  editor,
  children,
}: {
  editor: Editor | null
  children: ReactNode
}) {
  const blocks = useBlockPositions(editor)
  const reorder = useBlockReorder(editor)
  const [activeId, setActiveId] = useState<string | null>(null)
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
    // Blur editor focus to prevent keyboard shortcuts during drag
    if (editor) editor.commands.blur()
  }, [editor])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      const { active, over } = event
      if (!over || active.id === over.id) return
      const fromIndex = blocks.findIndex((b) => b.id === active.id)
      const toIndex = blocks.findIndex((b) => b.id === over.id)
      if (fromIndex === -1 || toIndex === -1) return
      reorder(fromIndex, toIndex, blocks)
    },
    [blocks, reorder]
  )

  // Cancel handler — restore state cleanly
  const handleDragCancel = useCallback(() => {
    setActiveId(null)
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
    </div>
  )
}
