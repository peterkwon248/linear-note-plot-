import type { EntityRef, Sticker } from "../../types"
import { genId, now, type AppendEventFn } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

/** Default color palette — cycles for distinguishable hulls in the graph. */
const STICKER_DEFAULT_PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e",
]

/** True when two refs point at the same entity. */
function refEquals(a: EntityRef, b: EntityRef): boolean {
  return a.kind === b.kind && a.id === b.id
}

/**
 * Sticker slice — cross-everything membership (옵션 D2).
 *
 * Membership lives on `Sticker.members: EntityRef[]` (single forward
 * reference). Reverse lookup ("which stickers does this entity belong
 * to?") is provided by the `useStickerMembers` hook in
 * `lib/hooks/use-sticker-members.ts`.
 */
export function createStickersSlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  return {
    /** Create a new sticker. Color cycles through the palette if omitted. */
    createSticker: (name: string, color?: string): string => {
      const id = genId()
      const existingCount = (get().stickers ?? []).length
      const finalColor =
        color ?? STICKER_DEFAULT_PALETTE[existingCount % STICKER_DEFAULT_PALETTE.length]
      const sticker: Sticker = {
        id,
        name,
        color: finalColor,
        members: [],
        createdAt: now(),
      }
      set((state: any) => ({
        stickers: [...(state.stickers ?? []), sticker],
      }))
      // PR 5c: entity event log
      appendEvent({ kind: "sticker", id }, "created", { name })
      return id
    },

    updateSticker: (id: string, updates: Partial<Pick<Sticker, "name" | "color">>) => {
      set((state: any) => ({
        stickers: (state.stickers ?? []).map((s: Sticker) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      }))
      // PR 5c: entity event log — distinguish color/rename.
      if (updates.color !== undefined) {
        appendEvent({ kind: "sticker", id }, "color_changed", { color: updates.color })
      } else if (updates.name !== undefined) {
        appendEvent({ kind: "sticker", id }, "renamed", { name: updates.name })
      } else {
        appendEvent({ kind: "sticker", id }, "updated")
      }
    },

    /** Soft delete — keeps the sticker (and its members) with trashed flag. */
    deleteSticker: (id: string) => {
      set((state: any) => ({
        stickers: (state.stickers ?? []).map((s: Sticker) =>
          s.id === id ? { ...s, trashed: true, trashedAt: now() } : s
        ),
      }))
      appendEvent({ kind: "sticker", id }, "trashed")
    },

    restoreSticker: (id: string) => {
      set((state: any) => ({
        stickers: (state.stickers ?? []).map((s: Sticker) =>
          s.id === id ? { ...s, trashed: false, trashedAt: null } : s
        ),
      }))
      appendEvent({ kind: "sticker", id }, "untrashed")
    },

    /**
     * Hard delete — drops the sticker entirely. Membership rows live on
     * the sticker itself (옵션 D2), so removing it implicitly drops every
     * reverse pointer. No cascade across notes/wikis required.
     */
    permanentlyDeleteSticker: (id: string) => {
      set((state: any) => ({
        stickers: (state.stickers ?? []).filter((s: Sticker) => s.id !== id),
        // PR 5c: hard delete cascade — drop this sticker's events.
        entityEvents: state.entityEvents.filter(
          (e: any) => !(e.entity?.kind === "sticker" && e.entity?.id === id),
        ),
      }))
    },

    /** Attach a single entity to a sticker (idempotent). */
    addStickerMember: (stickerId: string, ref: EntityRef) => {
      set((state: any) => ({
        stickers: (state.stickers ?? []).map((s: Sticker) => {
          if (s.id !== stickerId) return s
          const members = s.members ?? []
          if (members.some((m) => refEquals(m, ref))) return s
          return { ...s, members: [...members, ref] }
        }),
      }))
      // PR 5c: sticker-side cross-entity membership event.
      appendEvent({ kind: "sticker", id: stickerId }, "member_added", { ref })
    },

    /** Detach a single entity from a sticker. No-op if not a member. */
    removeStickerMember: (stickerId: string, ref: EntityRef) => {
      set((state: any) => ({
        stickers: (state.stickers ?? []).map((s: Sticker) => {
          if (s.id !== stickerId) return s
          const members = s.members ?? []
          const next = members.filter((m) => !refEquals(m, ref))
          if (next.length === members.length) return s
          return { ...s, members: next }
        }),
      }))
      appendEvent({ kind: "sticker", id: stickerId }, "member_removed", { ref })
    },

    /**
     * Bulk add sticker to a mixed entity selection.
     * Used by the graph's marquee selection → "Add sticker..." flow.
     *
     * Entity IDs follow the graph-canvas namespacing:
     *   - bare ID            = note
     *   - `"wiki:{id}"`      = wiki article (graph canvas, today)
     *   - `"tag:{id}"`       = tag node (graph canvas tag-node right-click, today)
     *   - `"label:{id}"`     = reserved for the Phase 3 Universal Picker
     *   - `"category:{id}"`  = reserved for the Phase 3 Universal Picker
     *   - `"file:{id}"`      = reserved for the Phase 3 Universal Picker
     *   - `"reference:{id}"` = reserved for the Phase 3 Universal Picker
     */
    bulkAddSticker: (entityIds: string[], stickerId: string) => {
      const newRefs: EntityRef[] = []
      for (const eid of entityIds) {
        if (eid.startsWith("wiki:")) newRefs.push({ kind: "wiki", id: eid.slice(5) })
        else if (eid.startsWith("tag:")) newRefs.push({ kind: "tag", id: eid.slice(4) })
        else if (eid.startsWith("label:")) newRefs.push({ kind: "label", id: eid.slice(6) })
        else if (eid.startsWith("category:")) newRefs.push({ kind: "category", id: eid.slice(9) })
        else if (eid.startsWith("file:")) newRefs.push({ kind: "file", id: eid.slice(5) })
        else if (eid.startsWith("reference:")) newRefs.push({ kind: "reference", id: eid.slice(10) })
        else newRefs.push({ kind: "note", id: eid })
      }
      if (newRefs.length === 0) return
      set((state: any) => ({
        stickers: (state.stickers ?? []).map((s: Sticker) => {
          if (s.id !== stickerId) return s
          const members = s.members ?? []
          const additions = newRefs.filter((r) => !members.some((m) => refEquals(m, r)))
          if (additions.length === 0) return s
          return { ...s, members: [...members, ...additions] }
        }),
      }))
    },
  }
}
