/**
 * Global undo stack for app-level actions (trash, promote, status change, etc.)
 * Ctrl+Z triggers the most recent undo.
 * Max 30 entries, auto-expires after 60s.
 */

interface UndoEntry {
  label: string
  undo: () => void
  timestamp: number
}

const MAX_ENTRIES = 30
const EXPIRE_MS = 60_000 // 60 seconds

let stack: UndoEntry[] = []
let listeners: Array<() => void> = []

function notify() {
  listeners.forEach((fn) => fn())
}

/** Push an undoable action onto the stack */
export function pushUndo(label: string, undo: () => void) {
  stack.push({ label, undo, timestamp: Date.now() })
  if (stack.length > MAX_ENTRIES) stack.shift()
  notify()
}

/** Pop and execute the most recent undo (returns label or null if empty) */
export function popUndo(): string | null {
  // Prune expired entries
  const now = Date.now()
  stack = stack.filter((e) => now - e.timestamp < EXPIRE_MS)

  const entry = stack.pop()
  if (!entry) return null

  entry.undo()
  notify()
  return entry.label
}

/** Check if there are any undoable actions */
export function hasUndo(): boolean {
  const now = Date.now()
  stack = stack.filter((e) => now - e.timestamp < EXPIRE_MS)
  return stack.length > 0
}

/** Subscribe to stack changes */
export function subscribeUndo(fn: () => void): () => void {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}

/** Clear all undo entries */
export function clearUndo() {
  stack = []
  notify()
}
