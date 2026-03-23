/**
 * Global undo/redo stack for app-level actions (trash, promote, status change, etc.)
 * Ctrl+Z triggers undo, Ctrl+Y / Ctrl+Shift+Z triggers redo.
 * Max 30 entries, auto-expires after 60s.
 */

interface UndoEntry {
  label: string
  undo: () => void
  redo: (() => void) | null
  timestamp: number
}

const MAX_ENTRIES = 30
const EXPIRE_MS = 60_000 // 60 seconds

let undoStack: UndoEntry[] = []
let redoStack: UndoEntry[] = []
let listeners: Array<() => void> = []

function notify() {
  listeners.forEach((fn) => fn())
}

function prune(stack: UndoEntry[]): UndoEntry[] {
  const now = Date.now()
  return stack.filter((e) => now - e.timestamp < EXPIRE_MS)
}

/** Push an undoable action onto the stack. Clears redo stack. */
export function pushUndo(label: string, undo: () => void, redo?: () => void) {
  undoStack.push({ label, undo, redo: redo ?? null, timestamp: Date.now() })
  if (undoStack.length > MAX_ENTRIES) undoStack.shift()
  redoStack = [] // New action clears redo
  notify()
}

/** Pop and execute the most recent undo (returns label or null if empty) */
export function popUndo(): string | null {
  undoStack = prune(undoStack)
  const entry = undoStack.pop()
  if (!entry) return null

  entry.undo()
  // Push to redo stack (refresh timestamp so it doesn't expire immediately)
  if (entry.redo) {
    redoStack.push({ ...entry, timestamp: Date.now() })
  }
  notify()
  return entry.label
}

/** Pop and execute the most recent redo (returns label or null if empty) */
export function popRedo(): string | null {
  redoStack = prune(redoStack)
  const entry = redoStack.pop()
  if (!entry || !entry.redo) return null

  entry.redo()
  // Push back to undo stack (refresh timestamp)
  undoStack.push({ ...entry, timestamp: Date.now() })
  if (undoStack.length > MAX_ENTRIES) undoStack.shift()
  notify()
  return entry.label
}

/** Check if there are any undoable actions */
export function hasUndo(): boolean {
  undoStack = prune(undoStack)
  return undoStack.length > 0
}

/** Check if there are any redoable actions */
export function hasRedo(): boolean {
  redoStack = prune(redoStack)
  return redoStack.length > 0
}

/** Subscribe to stack changes */
export function subscribeUndo(fn: () => void): () => void {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}

/** Clear all undo/redo entries */
export function clearUndo() {
  undoStack = []
  redoStack = []
  notify()
}
