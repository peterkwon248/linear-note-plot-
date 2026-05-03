/**
 * Sticker membership helpers — pure functions usable from React or
 * non-React (graph builders, view-engine, server-side).
 *
 * Sticker v2 stores membership on `Sticker.members[]` (옵션 D2 — single
 * forward reference). To answer "which stickers does entity X belong to?"
 * efficiently we build a reverse index keyed by `${kind}:${id}` and look
 * up O(1).
 */

import type { EntityKind, EntityRef, Sticker } from "./types"

/** Stable string key for an EntityRef. Used as Map key in the index. */
export function refKey(kind: EntityKind, id: string): string {
  return `${kind}:${id}`
}

/** Convenience: refKey(ref.kind, ref.id). */
export function entityRefKey(ref: EntityRef): string {
  return refKey(ref.kind, ref.id)
}

/**
 * Build a reverse index: refKey → Sticker[]. Trashed stickers excluded
 * by default so callers don't need to filter at every lookup site.
 */
export function buildStickerMemberIndex(
  stickers: Sticker[],
  opts: { includeTrashed?: boolean } = {},
): Map<string, Sticker[]> {
  const includeTrashed = opts.includeTrashed ?? false
  const index = new Map<string, Sticker[]>()
  for (const sticker of stickers) {
    if (!includeTrashed && sticker.trashed) continue
    const members = sticker.members ?? []
    for (const ref of members) {
      const key = refKey(ref.kind, ref.id)
      const arr = index.get(key)
      if (arr) arr.push(sticker)
      else index.set(key, [sticker])
    }
  }
  return index
}

/** Lookup all stickers attached to a single entity. Stable empty array. */
const EMPTY_STICKER_ARRAY: Sticker[] = []
export function getStickersFor(
  index: Map<string, Sticker[]>,
  kind: EntityKind,
  id: string,
): Sticker[] {
  return index.get(refKey(kind, id)) ?? EMPTY_STICKER_ARRAY
}

/** Lookup just the sticker IDs (common need for hull/group-by lookup). */
export function getStickerIdsFor(
  index: Map<string, Sticker[]>,
  kind: EntityKind,
  id: string,
): string[] {
  const stickers = index.get(refKey(kind, id))
  if (!stickers || stickers.length === 0) return []
  return stickers.map((s) => s.id)
}
