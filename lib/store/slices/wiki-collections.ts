import type { WikiCollectionItem } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createWikiCollectionsSlice(set: Set, _get: Get) {
  return {
    addToCollection: (wikiNoteId: string, item: Omit<WikiCollectionItem, 'id' | 'addedAt'>) => {
      const newItem: WikiCollectionItem = {
        ...item,
        id: genId(),
        addedAt: now(),
      }
      set((state: any) => {
        const existing = state.wikiCollections[wikiNoteId] ?? []
        return {
          wikiCollections: {
            ...state.wikiCollections,
            [wikiNoteId]: [...existing, newItem],
          },
        }
      })
    },
    removeFromCollection: (wikiNoteId: string, itemId: string) => {
      set((state: any) => {
        const existing = state.wikiCollections[wikiNoteId] ?? []
        return {
          wikiCollections: {
            ...state.wikiCollections,
            [wikiNoteId]: existing.filter((i: WikiCollectionItem) => i.id !== itemId),
          },
        }
      })
    },
    reorderCollection: (wikiNoteId: string, itemIds: string[]) => {
      set((state: any) => {
        const existing = state.wikiCollections[wikiNoteId] ?? []
        const ordered = itemIds
          .map(id => existing.find((i: WikiCollectionItem) => i.id === id))
          .filter(Boolean) as WikiCollectionItem[]
        return {
          wikiCollections: {
            ...state.wikiCollections,
            [wikiNoteId]: ordered,
          },
        }
      })
    },
    clearCollection: (wikiNoteId: string) => {
      set((state: any) => {
        const updated = { ...state.wikiCollections }
        delete updated[wikiNoteId]
        return { wikiCollections: updated }
      })
    },
  }
}
