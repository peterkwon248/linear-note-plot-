import type { GlobalBookmark } from "../../types"
import { genId } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createGlobalBookmarksSlice(set: Set) {
  return {
    pinBookmark: (noteId: string, anchorId: string, label: string, anchorType: GlobalBookmark['anchorType']): string => {
      const id = genId()
      const bookmark: GlobalBookmark = {
        id,
        noteId,
        anchorId,
        label,
        anchorType,
        createdAt: new Date().toISOString(),
      }
      set((state: any) => ({
        globalBookmarks: { ...state.globalBookmarks, [id]: bookmark },
      }))
      return id
    },

    unpinBookmark: (bookmarkId: string) => {
      set((state: any) => {
        const { [bookmarkId]: _, ...rest } = state.globalBookmarks
        return { globalBookmarks: rest }
      })
    },

    updateBookmarkLabel: (bookmarkId: string, label: string) => {
      set((state: any) => {
        const existing = state.globalBookmarks[bookmarkId]
        if (!existing) return {}
        return {
          globalBookmarks: {
            ...state.globalBookmarks,
            [bookmarkId]: { ...existing, label },
          },
        }
      })
    },
  }
}
