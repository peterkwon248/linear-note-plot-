export const DRAG_TYPE_NOTE = "application/x-plot-note"
export const DRAG_TYPE_TAB = "application/x-plot-tab"
export const DRAG_TYPE_VIEW = "application/x-plot-view"
export const DRAG_TYPE_LEAF = "application/x-plot-leaf"

export function setNoteDragData(e: React.DragEvent, noteId: string) {
  e.dataTransfer.setData(DRAG_TYPE_NOTE, noteId)
  e.dataTransfer.effectAllowed = "move"
}

export function getNoteDragData(e: React.DragEvent): string | null {
  return e.dataTransfer.getData(DRAG_TYPE_NOTE) || null
}

export function setTabDragData(e: React.DragEvent, tabId: string, panelId: string) {
  e.dataTransfer.setData(DRAG_TYPE_TAB, JSON.stringify({ tabId, panelId }))
  e.dataTransfer.effectAllowed = "move"
}

export function getTabDragData(e: React.DragEvent): { tabId: string; panelId: string } | null {
  const data = e.dataTransfer.getData(DRAG_TYPE_TAB)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function hasNoteDragData(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes(DRAG_TYPE_NOTE)
}

export function hasTabDragData(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes(DRAG_TYPE_TAB)
}

export function hasDragData(e: React.DragEvent): boolean {
  return hasNoteDragData(e) || hasTabDragData(e) || hasViewDragData(e) || hasLeafDragData(e)
}

/* ── View drag (PanelContent JSON) ── */

export function setViewDragData(e: React.DragEvent, content: Record<string, unknown>) {
  e.dataTransfer.setData(DRAG_TYPE_VIEW, JSON.stringify(content))
  e.dataTransfer.effectAllowed = "move"
}

export function getViewDragData(e: React.DragEvent): Record<string, unknown> | null {
  const data = e.dataTransfer.getData(DRAG_TYPE_VIEW)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function hasViewDragData(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes(DRAG_TYPE_VIEW)
}

/* ── Leaf drag (leafId string) ── */

export function setLeafDragData(e: React.DragEvent, leafId: string) {
  e.dataTransfer.setData(DRAG_TYPE_LEAF, leafId)
  e.dataTransfer.effectAllowed = "move"
}

export function getLeafDragData(e: React.DragEvent): string | null {
  return e.dataTransfer.getData(DRAG_TYPE_LEAF) || null
}

export function hasLeafDragData(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes(DRAG_TYPE_LEAF)
}
