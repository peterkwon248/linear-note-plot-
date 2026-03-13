export const DRAG_TYPE_NOTE = "application/x-plot-note"
export const DRAG_TYPE_TAB = "application/x-plot-tab"

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
  return hasNoteDragData(e) || hasTabDragData(e)
}
