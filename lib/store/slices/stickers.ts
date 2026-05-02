import type { Note, WikiArticle, Sticker } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

/** Default color palette — cycles for distinguishable hulls in the graph. */
const STICKER_DEFAULT_PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e",
]

export function createStickersSlice(set: Set, get: Get) {
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
        createdAt: now(),
      }
      set((state: any) => ({
        stickers: [...(state.stickers ?? []), sticker],
      }))
      return id
    },

    updateSticker: (id: string, updates: Partial<Pick<Sticker, "name" | "color">>) => {
      set((state: any) => ({
        stickers: (state.stickers ?? []).map((s: Sticker) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      }))
    },

    /** Soft delete — keeps the sticker in store with trashed flag. */
    deleteSticker: (id: string) => {
      set((state: any) => ({
        stickers: (state.stickers ?? []).map((s: Sticker) =>
          s.id === id ? { ...s, trashed: true, trashedAt: now() } : s
        ),
      }))
    },

    restoreSticker: (id: string) => {
      set((state: any) => ({
        stickers: (state.stickers ?? []).map((s: Sticker) =>
          s.id === id ? { ...s, trashed: false, trashedAt: null } : s
        ),
      }))
    },

    /** Hard delete + cascade removal from all notes/wiki stickerIds. */
    permanentlyDeleteSticker: (id: string) => {
      set((state: any) => ({
        stickers: (state.stickers ?? []).filter((s: Sticker) => s.id !== id),
        notes: state.notes.map((n: Note) =>
          n.stickerIds?.includes(id)
            ? { ...n, stickerIds: n.stickerIds.filter((sid: string) => sid !== id) }
            : n
        ),
        wikiArticles: state.wikiArticles.map((w: WikiArticle) =>
          w.stickerIds?.includes(id)
            ? { ...w, stickerIds: w.stickerIds.filter((sid: string) => sid !== id) }
            : w
        ),
      }))
    },

    /** Add a sticker to a single note. */
    addNoteSticker: (noteId: string, stickerId: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) => {
          if (n.id !== noteId) return n
          const current = n.stickerIds ?? []
          if (current.includes(stickerId)) return n
          return { ...n, stickerIds: [...current, stickerId] }
        }),
      }))
    },

    /** Remove a sticker from a single note. */
    removeNoteSticker: (noteId: string, stickerId: string) => {
      set((state: any) => ({
        notes: state.notes.map((n: Note) =>
          n.id === noteId && n.stickerIds
            ? { ...n, stickerIds: n.stickerIds.filter((sid: string) => sid !== stickerId) }
            : n
        ),
      }))
    },

    /** Add a sticker to a single wiki article. */
    addWikiSticker: (wikiId: string, stickerId: string) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((w: WikiArticle) => {
          if (w.id !== wikiId) return w
          const current = w.stickerIds ?? []
          if (current.includes(stickerId)) return w
          return { ...w, stickerIds: [...current, stickerId] }
        }),
      }))
    },

    /** Remove a sticker from a single wiki article. */
    removeWikiSticker: (wikiId: string, stickerId: string) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((w: WikiArticle) =>
          w.id === wikiId && w.stickerIds
            ? { ...w, stickerIds: w.stickerIds.filter((sid: string) => sid !== stickerId) }
            : w
        ),
      }))
    },

    /**
     * Bulk add sticker to a mixed entity selection (notes + wikis).
     * Used by the graph's marquee selection → "Add sticker..." flow.
     * Entity ids are namespaced: bare id = note, "wiki:{id}" = wiki article.
     */
    bulkAddSticker: (entityIds: string[], stickerId: string) => {
      const noteIds = new Set<string>()
      const wikiIds = new Set<string>()
      for (const eid of entityIds) {
        if (eid.startsWith("wiki:")) wikiIds.add(eid.slice(5))
        else noteIds.add(eid)
      }
      set((state: any) => ({
        notes: state.notes.map((n: Note) => {
          if (!noteIds.has(n.id)) return n
          const current = n.stickerIds ?? []
          if (current.includes(stickerId)) return n
          return { ...n, stickerIds: [...current, stickerId] }
        }),
        wikiArticles: state.wikiArticles.map((w: WikiArticle) => {
          if (!wikiIds.has(w.id)) return w
          const current = w.stickerIds ?? []
          if (current.includes(stickerId)) return w
          return { ...w, stickerIds: [...current, stickerId] }
        }),
      }))
    },
  }
}
