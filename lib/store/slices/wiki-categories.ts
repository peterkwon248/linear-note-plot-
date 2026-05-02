import type { WikiCategory, WikiArticle } from "../../types"
import { genId, now } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

/** Default color palette for new categories — cycles through to keep
 *  graph hulls visually distinguishable when grouping by category. */
const CATEGORY_DEFAULT_PALETTE = [
  "#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#fb7185",
  "#f472b6", "#22d3ee", "#fb923c", "#84cc16", "#c084fc",
]

export function createWikiCategoriesSlice(set: Set, get: Get) {
  return {
    createWikiCategory: (name: string, parentIds?: string[]): string | null => {
      const id = genId()
      const ts = now()
      const existingCount = get().wikiCategories?.length ?? 0
      const category: WikiCategory = {
        id,
        name,
        parentIds: parentIds ?? [],
        color: CATEGORY_DEFAULT_PALETTE[existingCount % CATEGORY_DEFAULT_PALETTE.length],
        createdAt: ts,
        updatedAt: ts,
      }
      set((state: any) => ({
        wikiCategories: [...state.wikiCategories, category],
      }))
      return id
    },

    updateWikiCategory: (id: string, updates: Partial<Pick<WikiCategory, 'name' | 'parentIds' | 'description' | 'color'>>) => {
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
