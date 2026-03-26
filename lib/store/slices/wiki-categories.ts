import type { WikiCategory, WikiArticle } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

export function createWikiCategoriesSlice(set: Set, get: Get) {
  return {
    createWikiCategory: (name: string, parentIds?: string[]): string | null => {
      const id = genId()
      const ts = now()
      const category: WikiCategory = {
        id,
        name,
        parentIds: parentIds ?? [],
        createdAt: ts,
        updatedAt: ts,
      }
      set((state: any) => ({
        wikiCategories: [...state.wikiCategories, category],
      }))
      return id
    },

    updateWikiCategory: (id: string, updates: Partial<Pick<WikiCategory, 'name' | 'parentIds' | 'description'>>) => {
      set((state: any) => ({
        wikiCategories: state.wikiCategories.map((c: WikiCategory) =>
          c.id === id ? { ...c, ...updates, updatedAt: now() } : c
        ),
      }))
    },

    deleteWikiCategory: (id: string) => {
      set((state: any) => ({
        // Remove the category itself
        wikiCategories: state.wikiCategories
          // Remove as parent from other categories
          .map((c: WikiCategory) =>
            c.parentIds.includes(id)
              ? { ...c, parentIds: c.parentIds.filter((pid: string) => pid !== id) }
              : c
          )
          .filter((c: WikiCategory) => c.id !== id),
        // Remove from all articles' categoryIds
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.categoryIds?.includes(id)
            ? { ...a, categoryIds: a.categoryIds.filter((cid: string) => cid !== id) }
            : a
        ),
      }))
    },

    setArticleCategories: (articleId: string, categoryIds: string[]) => {
      set((state: any) => ({
        wikiArticles: state.wikiArticles.map((a: WikiArticle) =>
          a.id === articleId ? { ...a, categoryIds, updatedAt: now() } : a
        ),
      }))
    },
  }
}
