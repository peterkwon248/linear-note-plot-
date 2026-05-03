"use client"

/**
 * React hooks over Sticker membership (옵션 D2 — Sticker.members[]).
 *
 * Pure helpers live in `lib/stickers.ts`. These hooks just memoize the
 * reverse index against the Zustand `stickers` slice and offer ergonomic
 * per-entity / per-list lookup APIs.
 */

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import {
  buildStickerMemberIndex,
  getStickerIdsFor,
  getStickersFor,
} from "@/lib/stickers"
import type { EntityKind, EntityRef, Sticker } from "@/lib/types"

/**
 * Memoized reverse index: `${kind}:${id}` → Sticker[].
 * Recomputes only when the `stickers` array reference changes.
 */
export function useStickerMemberIndex(): Map<string, Sticker[]> {
  const stickers = usePlotStore((s) => s.stickers ?? [])
  return useMemo(() => buildStickerMemberIndex(stickers), [stickers])
}

/** All stickers attached to a single entity. Stable empty array on miss. */
export function useStickerMembers(ref: EntityRef): Sticker[] {
  const index = useStickerMemberIndex()
  return getStickersFor(index, ref.kind, ref.id)
}

/** Same as `useStickerMembers` but returns just the sticker IDs. */
export function useStickerIds(ref: EntityRef): string[] {
  const index = useStickerMemberIndex()
  // Memoize so consumers can use this in dependency arrays.
  return useMemo(
    () => getStickerIdsFor(index, ref.kind, ref.id),
    [index, ref.kind, ref.id],
  )
}

/**
 * Per-sticker membership counts (notes + wikis + tags + … combined).
 * Useful for the Library/Stickers list view.
 */
export function useStickerCounts(): Record<string, number> {
  const stickers = usePlotStore((s) => s.stickers ?? [])
  return useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of stickers) {
      counts[s.id] = (s.members ?? []).length
    }
    return counts
  }, [stickers])
}

/** All sticker IDs attached to entities of a given kind, grouped by entity ID. */
export function useStickerIdsByKind(kind: EntityKind): Map<string, string[]> {
  const stickers = usePlotStore((s) => s.stickers ?? [])
  return useMemo(() => {
    const map = new Map<string, string[]>()
    for (const s of stickers) {
      if (s.trashed) continue
      for (const ref of s.members ?? []) {
        if (ref.kind !== kind) continue
        const arr = map.get(ref.id)
        if (arr) arr.push(s.id)
        else map.set(ref.id, [s.id])
      }
    }
    return map
  }, [stickers, kind])
}
