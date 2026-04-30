"use client"

import { useState, useCallback } from "react"
import { createPortal } from "react-dom"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useSettingsStore } from "@/lib/settings-store"
import {
  TOOLBAR_ITEM_LABELS,
  normalizeLayout,
  DEFAULT_TOOLBAR_LAYOUT,
  type ToolbarItemConfig,
  type ToolbarItemId,
} from "@/lib/editor/toolbar-config"
import { DotsSixVertical, Eye, EyeSlash, ArrowCounterClockwise, X as PhX } from "@/lib/editor/editor-icons"

// Sortable item component
function SortableItem({
  item,
  onToggle,
}: {
  item: ToolbarItemConfig
  onToggle: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card transition-colors ${
        isDragging ? "shadow-lg z-10" : ""
      } ${!item.visible ? "opacity-50" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
      >
        <DotsSixVertical size={16} />
      </button>
      <span className="flex-1 text-note text-foreground select-none">
        {TOOLBAR_ITEM_LABELS[item.id as ToolbarItemId] ?? item.id}
      </span>
      <button
        onClick={() => onToggle(item.id)}
        className={`p-1 rounded-md transition-colors ${
          item.visible
            ? "text-foreground hover:bg-hover-bg"
            : "text-muted-foreground/70 hover:bg-hover-bg hover:text-muted-foreground"
        }`}
      >
        {item.visible ? (
          <Eye size={16} />
        ) : (
          <EyeSlash size={16} />
        )}
      </button>
    </div>
  )
}

interface ArrangeModeProps {
  open: boolean
  onClose: () => void
}

export function ArrangeMode({ open, onClose }: ArrangeModeProps) {
  const toolbarLayout = useSettingsStore((s) => s.toolbarLayout)
  const setToolbarLayout = useSettingsStore((s) => s.setToolbarLayout)
  const resetToolbarLayout = useSettingsStore((s) => s.resetToolbarLayout)

  const [items, setItems] = useState(() => normalizeLayout(toolbarLayout).items)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id)
      const newIndex = prev.findIndex((i) => i.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const handleToggle = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, visible: !i.visible } : i))
    )
  }, [])

  const handleDone = () => {
    setToolbarLayout({ items, version: toolbarLayout.version })
    onClose()
  }

  const handleReset = () => {
    setItems(DEFAULT_TOOLBAR_LAYOUT.items)
    resetToolbarLayout()
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleDone} />

      {/* Modal */}
      <div className="relative w-[380px] max-h-[80vh] bg-surface-overlay border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-note font-semibold text-foreground">
            Arrange Toolbar
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            >
              <ArrowCounterClockwise size={14} />
              Reset
            </button>
            <button
              onClick={handleDone}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            >
              <PhX size={16} />
            </button>
          </div>
        </div>

        {/* Sortable list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onToggle={handleToggle}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={handleDone}
            className="rounded-md bg-accent px-4 py-1.5 text-note font-medium text-accent-foreground transition-colors hover:bg-accent/80"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
