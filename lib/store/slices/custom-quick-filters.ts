/**
 * CustomQuickFilter slice — user-defined chip bar entries that augment the
 * hardcoded `quickFilters` defined in `view-configs.tsx`.
 *
 * Lives next to (not inside) SavedView because the two concepts are
 * deliberately separate:
 *   - SavedView captures the *entire* viewState (filters + display config
 *     + grouping + sort + visible columns) and acts as a navigation
 *     destination.
 *   - CustomQuickFilter captures *filter rules only* and acts as a one-
 *     click modifier on whatever view the user is already looking at.
 *
 * Scoped per ViewContextKey so a Notes chip never leaks into Books.
 * ViewHeader merges the hardcoded defaults with the user-defined chips
 * (default first, user-defined after).
 */
import type { CustomQuickFilter } from "../../types"
import { genId } from "../helpers"

type Set = (fn: ((state: any) => any) | any) => void

export function createCustomQuickFiltersSlice(set: Set) {
  return {
    addCustomQuickFilter: (
      input: Omit<CustomQuickFilter, "id" | "createdAt">,
    ): string => {
      const id = genId()
      const now = new Date().toISOString()
      set((state: any) => ({
        customQuickFilters: [
          ...state.customQuickFilters,
          { id, createdAt: now, ...input },
        ],
      }))
      return id
    },

    updateCustomQuickFilter: (
      id: string,
      patch: Partial<Omit<CustomQuickFilter, "id" | "createdAt">>,
    ) => {
      set((state: any) => ({
        customQuickFilters: state.customQuickFilters.map((qf: CustomQuickFilter) =>
          qf.id === id ? { ...qf, ...patch } : qf,
        ),
      }))
    },

    removeCustomQuickFilter: (id: string) => {
      set((state: any) => ({
        customQuickFilters: state.customQuickFilters.filter(
          (qf: CustomQuickFilter) => qf.id !== id,
        ),
      }))
    },
  }
}
