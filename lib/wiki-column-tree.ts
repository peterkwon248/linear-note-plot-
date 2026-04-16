/**
 * Phase 3 (Multi-pane Document Model) — layout tree helpers.
 *
 * `WikiArticle.layout` is a recursive ColumnStructure where leaf nodes
 * (`ColumnBlocksLeaf`) directly own their blocks (Phase 3 canonical).
 * This module centralizes tree traversal + immutable updates.
 *
 * Naming convention:
 *  - "leaf" = a `ColumnBlocksLeaf` node
 *  - "pane" = the space a leaf renders into (same thing, UX-level noun)
 *  - "path" = number[] addressing a column at any depth (`ColumnPath`)
 *
 * 진실의 원천: docs/BRAINSTORM-2026-04-15-multi-pane-document-model.md
 */

import type {
  ColumnStructure,
  ColumnDefinition,
  ColumnBlocksLeaf,
  ColumnPath,
  WikiBlock,
} from "./types"

/* ── Readers (pure) ─────────────────────────────────────────────── */

/**
 * Return the ColumnBlocksLeaf at `path`, or `null` if the path doesn't
 * resolve to a leaf (e.g. it points to a nested ColumnStructure, or the
 * index is out of range).
 */
export function findLeafAtPath(
  layout: ColumnStructure,
  path: ColumnPath,
): ColumnBlocksLeaf | null {
  if (path.length === 0) return null // root is ColumnStructure, not a leaf
  let cursor: ColumnStructure = layout
  for (let i = 0; i < path.length; i++) {
    const col = cursor.columns[path[i]]
    if (!col) return null
    if (i === path.length - 1) {
      return col.content.type === "blocks" ? col.content : null
    }
    if (col.content.type !== "columns") return null
    cursor = col.content
  }
  return null
}

/**
 * Return the ColumnDefinition at `path`, or `null`. Used for editing
 * column identity (name / themeColor / ratio).
 */
export function findColumnDefAtPath(
  layout: ColumnStructure,
  path: ColumnPath,
): ColumnDefinition | null {
  if (path.length === 0) return null
  let cursor: ColumnStructure = layout
  for (let i = 0; i < path.length; i++) {
    const col = cursor.columns[path[i]]
    if (!col) return null
    if (i === path.length - 1) return col
    if (col.content.type !== "columns") return null
    cursor = col.content
  }
  return null
}

/**
 * Walk every leaf in the tree, invoking `cb(leaf, path)` in depth-first order.
 */
export function forEachLeaf(
  layout: ColumnStructure,
  cb: (leaf: ColumnBlocksLeaf, path: ColumnPath) => void,
): void {
  const recurse = (node: ColumnStructure, base: ColumnPath) => {
    node.columns.forEach((col, i) => {
      const p = [...base, i]
      if (col.content.type === "columns") recurse(col.content, p)
      else cb(col.content, p)
    })
  }
  recurse(layout, [])
}

/**
 * Collect every pane's path + leaf (depth-first). Useful when the caller
 * needs both path and leaf (otherwise prefer `forEachLeaf`).
 */
export function listAllLeaves(
  layout: ColumnStructure,
): Array<{ path: ColumnPath; leaf: ColumnBlocksLeaf }> {
  const out: Array<{ path: ColumnPath; leaf: ColumnBlocksLeaf }> = []
  forEachLeaf(layout, (leaf, path) => out.push({ path, leaf }))
  return out
}

/**
 * Collect every block from every leaf in depth-first order. Phase 3
 * replaces `WikiArticle.blocks` with this derived flat view for legacy
 * readers. Prefers `leaf.blocks` (canonical) and falls back to `blockIds`
 * when legacy articles haven't been migrated yet.
 *
 * `blockPool` is an optional resolver for the legacy path — during
 * migration the old `WikiArticle.blocks[]` pool is passed in so ids
 * can be resolved to actual `WikiBlock` objects.
 */
export function collectBlocksFromLayout(
  layout: ColumnStructure,
  blockPool?: ReadonlyMap<string, WikiBlock>,
): WikiBlock[] {
  const out: WikiBlock[] = []
  forEachLeaf(layout, (leaf) => {
    if (leaf.blocks && leaf.blocks.length > 0) {
      for (const b of leaf.blocks) out.push(b)
      return
    }
    if (leaf.blockIds && blockPool) {
      for (const id of leaf.blockIds) {
        const block = blockPool.get(id)
        if (block) out.push(block)
      }
    }
  })
  return out
}

/**
 * Find which pane contains `blockId`, returning path + index within the
 * leaf's blocks array. Returns null if not found.
 */
export function findBlockLocation(
  layout: ColumnStructure,
  blockId: string,
): { path: ColumnPath; index: number } | null {
  let result: { path: ColumnPath; index: number } | null = null
  forEachLeaf(layout, (leaf, path) => {
    if (result) return
    if (!leaf.blocks) return
    const idx = leaf.blocks.findIndex((b) => b.id === blockId)
    if (idx !== -1) result = { path, index: idx }
  })
  return result
}

/** Return the depth-first first-leaf path. Used as a fallback for orphan blocks. */
export function firstLeafPath(layout: ColumnStructure): ColumnPath {
  let out: ColumnPath = []
  const recurse = (node: ColumnStructure, base: ColumnPath): boolean => {
    for (let i = 0; i < node.columns.length; i++) {
      const p = [...base, i]
      const col = node.columns[i]
      if (col.content.type === "columns") {
        if (recurse(col.content, p)) return true
      } else {
        out = p
        return true
      }
    }
    return false
  }
  recurse(layout, [])
  return out
}

/** Count blocks across every leaf (canonical `blocks` preferred). */
export function countAllBlocks(layout: ColumnStructure): number {
  let n = 0
  forEachLeaf(layout, (leaf) => {
    n += leaf.blocks?.length ?? leaf.blockIds?.length ?? 0
  })
  return n
}

/* ── Persist helpers ─────────────────────────────────────────────── */

/**
 * Strip `leaf.blocks` from every leaf, keeping only `blockIds`. Used by
 * `partialize` so Zustand persist doesn't store full block data
 * (blocks are loaded from IDB `plot-wiki-block-meta` at rehydrate time
 * and re-populated via `populateLeafBlocksFromPool`).
 */
export function stripLeafBlocksForPersist(layout: ColumnStructure): ColumnStructure {
  return {
    ...layout,
    columns: layout.columns.map((col) => {
      if (col.content.type === "columns") {
        return { ...col, content: stripLeafBlocksForPersist(col.content) }
      }
      // Keep blockIds (lightweight), clear blocks (heavy)
      const { blocks: _stripped, ...rest } = col.content
      return { ...col, content: { ...rest, type: "blocks" as const } }
    }),
  }
}

/* ── Bulk sync (rehydrate / migration) ──────────────────────────── */

/**
 * Populate every leaf's `blocks` (and keep `blockIds` in sync) from a flat
 * blocks pool + columnAssignments map. This is the runtime equivalent of
 * migration v80 — called at rehydrate time when IDB blocks are loaded into
 * `article.blocks` but `layout.leaf.blocks` is still empty.
 *
 * Blocks whose assignment path doesn't resolve to a known leaf fall back
 * to the first leaf (depth-first). Order within each leaf matches the
 * source `blocks` array order.
 */
export function populateLeafBlocksFromPool(
  layout: ColumnStructure,
  blocks: WikiBlock[],
  assignments: Record<string, ColumnPath>,
): ColumnStructure {
  // 1. Collect leaf paths
  const leafPaths: ColumnPath[] = []
  forEachLeaf(layout, (_leaf, path) => leafPaths.push(path))
  if (leafPaths.length === 0) return layout
  const firstKey = leafPaths[0].join(".")

  // 2. Bucket blocks by assignment (preserves source order)
  const buckets = new Map<string, WikiBlock[]>()
  leafPaths.forEach((p) => buckets.set(p.join("."), []))
  for (const block of blocks) {
    const assigned = assignments[block.id]
    const key =
      Array.isArray(assigned) && assigned.length > 0
        ? assigned.join(".")
        : firstKey
    const bucket = buckets.get(key) ?? buckets.get(firstKey)
    if (bucket) bucket.push(block)
  }

  // 3. Walk layout and write blocks into each leaf
  const rebuild = (node: ColumnStructure, basePath: ColumnPath): ColumnStructure => ({
    ...node,
    columns: node.columns.map((col, i) => {
      const p = [...basePath, i]
      if (col.content.type === "columns") {
        return { ...col, content: rebuild(col.content, p) }
      }
      const resolved = buckets.get(p.join(".")) ?? []
      return {
        ...col,
        content: {
          ...col.content,
          blocks: resolved,
          blockIds: resolved.map((b) => b.id),
        },
      }
    }),
  })
  return rebuild(layout, [])
}

/* ── Immutable updates ──────────────────────────────────────────── */

/**
 * Return a new layout with the leaf at `path` replaced. If the path
 * doesn't resolve to a leaf, returns `null`.
 */
export function updateLeafAtPath(
  layout: ColumnStructure,
  path: ColumnPath,
  updater: (leaf: ColumnBlocksLeaf) => ColumnBlocksLeaf,
): ColumnStructure | null {
  if (path.length === 0) return null
  const [head, ...rest] = path
  const col = layout.columns[head]
  if (!col) return null

  if (rest.length === 0) {
    if (col.content.type !== "blocks") return null
    const newLeaf = updater(col.content)
    const columns = layout.columns.map((c, i) =>
      i === head ? { ...c, content: newLeaf } : c,
    )
    return { ...layout, columns }
  }

  if (col.content.type !== "columns") return null
  const updatedInner = updateLeafAtPath(col.content, rest, updater)
  if (!updatedInner) return null
  const columns = layout.columns.map((c, i) =>
    i === head ? { ...c, content: updatedInner } : c,
  )
  return { ...layout, columns }
}

/**
 * Return a new layout with the ColumnDefinition at `path` patched. Used for
 * name / themeColor / ratio edits.
 */
export function updateColumnDefAtPath(
  layout: ColumnStructure,
  path: ColumnPath,
  patch: Partial<Omit<ColumnDefinition, "content">>,
): ColumnStructure | null {
  if (path.length === 0) return null
  const [head, ...rest] = path
  const col = layout.columns[head]
  if (!col) return null

  if (rest.length === 0) {
    const updated = { ...col, ...patch }
    const columns = layout.columns.map((c, i) => (i === head ? updated : c))
    return { ...layout, columns }
  }

  if (col.content.type !== "columns") return null
  const updatedInner = updateColumnDefAtPath(col.content, rest, patch)
  if (!updatedInner) return null
  const columns = layout.columns.map((c, i) =>
    i === head ? { ...c, content: updatedInner } : c,
  )
  return { ...layout, columns }
}

/**
 * Replace (or append) a block inside the leaf at `path`. Returns `null`
 * if the path is invalid.
 */
export function insertBlockAtPath(
  layout: ColumnStructure,
  path: ColumnPath,
  block: WikiBlock,
  position: "prepend" | "append" | number = "append",
): ColumnStructure | null {
  return updateLeafAtPath(layout, path, (leaf) => {
    const blocks = [...(leaf.blocks ?? [])]
    if (position === "prepend") blocks.unshift(block)
    else if (position === "append") blocks.push(block)
    else blocks.splice(position, 0, block)
    return { ...leaf, blocks }
  })
}

/**
 * Remove the block with `blockId` from the leaf at `path`. Returns `null`
 * if the path is invalid or the block wasn't in that leaf.
 */
export function removeBlockFromPath(
  layout: ColumnStructure,
  path: ColumnPath,
  blockId: string,
): ColumnStructure | null {
  return updateLeafAtPath(layout, path, (leaf) => {
    const blocks = (leaf.blocks ?? []).filter((b) => b.id !== blockId)
    return { ...leaf, blocks }
  })
}

/**
 * Patch a block within the leaf at `path`. If the block isn't there the
 * returned layout equals the input (no-op). Use `findBlockLocation` first
 * when you only know `blockId`.
 */
export function patchBlockAtPath(
  layout: ColumnStructure,
  path: ColumnPath,
  blockId: string,
  patch: Partial<Omit<WikiBlock, "id">>,
): ColumnStructure | null {
  return updateLeafAtPath(layout, path, (leaf) => {
    const blocks = (leaf.blocks ?? []).map((b) =>
      b.id === blockId ? { ...b, ...patch } : b,
    )
    return { ...leaf, blocks }
  })
}

/**
 * Move a block from `fromPath` to `toPath` (append to target leaf).
 * Returns `null` if either path is invalid.
 */
export function moveBlockBetweenPanes(
  layout: ColumnStructure,
  fromPath: ColumnPath,
  toPath: ColumnPath,
  blockId: string,
): ColumnStructure | null {
  const source = findLeafAtPath(layout, fromPath)
  if (!source || !source.blocks) return null
  const block = source.blocks.find((b) => b.id === blockId)
  if (!block) return null

  const step1 = removeBlockFromPath(layout, fromPath, blockId)
  if (!step1) return null
  return insertBlockAtPath(step1, toPath, block, "append")
}
