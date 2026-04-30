/**
 * note-hierarchy.ts
 *
 * Parent-child note hierarchy helpers.
 * Mirrors lib/wiki-hierarchy.ts — same patterns, Note types.
 * parentNoteId is a single-parent tree relationship.
 * Thread chain notes (createChainNote) use the same parentNoteId field.
 */

import type { Note } from "./types"

interface StoreSnapshot {
  notes: Note[]
}

const MAX_DEPTH = 20

/**
 * Return the ancestor chain from direct parent up to root.
 * Stops if a cycle is detected (visited set) or depth exceeds MAX_DEPTH.
 * Does NOT include the note itself.
 */
export function getNoteAncestors(noteId: string, store: StoreSnapshot): Note[] {
  const ancestors: Note[] = []
  const visited = new Set<string>([noteId])
  let current = store.notes.find((n) => n.id === noteId)
  let depth = 0

  while (current?.parentNoteId && depth < MAX_DEPTH) {
    const parentId = current.parentNoteId
    if (visited.has(parentId)) break // cycle guard
    visited.add(parentId)
    const parent = store.notes.find((n) => n.id === parentId)
    if (!parent) break
    ancestors.push(parent)
    current = parent
    depth++
  }

  return ancestors
}

/**
 * Return direct children of noteId (notes whose parentNoteId === noteId).
 */
export function getNoteChildren(noteId: string, store: StoreSnapshot): Note[] {
  return store.notes.filter((n) => n.parentNoteId === noteId)
}

/**
 * Return all descendant IDs (BFS) of noteId, including noteId itself.
 * Uses a visited Set to handle corrupt data cycles.
 */
export function getNoteDescendants(noteId: string, store: StoreSnapshot): Set<string> {
  const visited = new Set<string>([noteId])
  const queue: string[] = [noteId]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const n of store.notes) {
      if (n.parentNoteId === current && !visited.has(n.id)) {
        visited.add(n.id)
        queue.push(n.id)
      }
    }
  }

  return visited
}

/**
 * Returns true if setting noteId's parent to candidateParentId would create a cycle.
 * Cycle condition: candidateParentId is a descendant of noteId (or equals noteId).
 */
export function wouldCreateNoteCycle(
  noteId: string,
  candidateParentId: string,
  store: StoreSnapshot,
): boolean {
  if (noteId === candidateParentId) return true
  const descendants = getNoteDescendants(noteId, store)
  return descendants.has(candidateParentId)
}

/* ── Role classification ──────────────────────────────── */

export type NoteRole = "root" | "parent" | "child" | "solo"

/**
 * Classify a note's hierarchical role among all notes.
 *
 * Root   = no parent, has children  (시작점)
 * Parent = has parent, has children (중간 노드, branch)
 * Child  = has parent, no children  (말단)
 * Solo   = no parent, no children   (고립)
 *
 * Roles are mutually exclusive.
 * trashed children are excluded from the hasChildren check.
 */
export function classifyNoteRole(noteId: string, store: { notes: Note[] }): NoteRole {
  const note = store.notes.find((n) => n.id === noteId)
  if (!note) return "solo"
  const hasParent = !!note.parentNoteId
  const hasChildren = store.notes.some((n) => n.parentNoteId === noteId && !n.trashed)
  if (hasParent && hasChildren) return "parent"
  if (hasParent) return "child"
  if (hasChildren) return "root"
  return "solo"
}
