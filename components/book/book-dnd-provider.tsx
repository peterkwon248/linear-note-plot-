"use client"

// Phase 3A-1 — BookDndProvider: shared drag-reorder wrapper for any shell's block list.
// Wraps children in a DndContext + SortableContext. Drag end calls moveWikiBlock to
// reorder the block within the article's flat blocks[] array.
//
// Sensors use activationConstraint.distance = 5 so small pointer clicks (opening the
// ⠿ block menu) don't accidentally start a drag.

import { useMemo } from "react"
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { usePlotStore } from "@/lib/store"

interface BookDndProviderProps {
  /** Article / book id — used to look up current blocks order for the reorder action. */
  articleId: string | undefined
  /** Ordered list of block ids currently rendered. Used as SortableContext items. */
  items: string[]
  /** When false, children render without DndContext (no drag). */
  enabled: boolean
  children: React.ReactNode
}

export function BookDndProvider({ articleId, items, enabled, children }: BookDndProviderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const itemsKey = useMemo(() => items.join("|"), [items])
  void itemsKey

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!articleId) return
    if (!over || active.id === over.id) return
    const fromIndex = items.indexOf(String(active.id))
    const toIndex = items.indexOf(String(over.id))
    if (fromIndex === -1 || toIndex === -1) return
    usePlotStore.getState().moveWikiBlock(articleId, String(active.id), toIndex)
  }

  if (!enabled) return <>{children}</>

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}
