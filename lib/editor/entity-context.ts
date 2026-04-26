/**
 * Entity context for TipTap editor instances.
 *
 * Stored on `editor.storage.entityContext` so node views (e.g. BannerNodeView)
 * can determine which note/wiki article they belong to when rendering inline
 * actions like comment/bookmark markers.
 *
 * Mirrors the existing pattern used by `editor.storage.footnoteRef.footnoteStartOffset`
 * — minimal surface, no schema changes, no React Context plumbing through portals.
 */

import type { Editor } from "@tiptap/core"

export type EntityKind = "note" | "wiki"

export interface EntityContext {
  kind: EntityKind
  /** noteId (when kind = "note") or articleId (when kind = "wiki"). */
  entityId: string
}

/**
 * Set or update the entity context on a TipTap editor instance.
 * Safe to call repeatedly (e.g. on prop change) — purely a storage mutation.
 */
export function setEntityContext(editor: Editor | null, context: EntityContext): void {
  if (!editor) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage = editor.storage as any
  storage.entityContext = context
}

/**
 * Read the entity context from a TipTap editor instance.
 * Returns null if not set (e.g. read-only previews, hover cards).
 */
export function getEntityContext(editor: Editor | null): EntityContext | null {
  if (!editor) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage = editor.storage as any
  return (storage.entityContext as EntityContext | undefined) ?? null
}
