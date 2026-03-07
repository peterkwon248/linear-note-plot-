import type { Note } from "../types"
import type { SortField, SortDirection } from "./types"
import { STATUS_ORDER, PRIORITY_ORDER } from "./types"

/**
 * Sort notes by the given field and direction.
 * Returns a new sorted array (does not mutate input).
 * Stable sort guaranteed by Array.prototype.sort in modern engines.
 */
export function applySort(
  notes: Note[],
  field: SortField,
  direction: SortDirection,
  backlinksMap?: Map<string, number>
): Note[] {
  if (notes.length <= 1) return notes

  const dir = direction === "asc" ? 1 : -1
  const sorted = [...notes]

  sorted.sort((a, b) => {
    switch (field) {
      case "title":
        return dir * a.title.localeCompare(b.title)

      case "status":
        return dir * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

      case "priority":
        return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

      case "project": {
        const ap = a.project ?? ""
        const bp = b.project ?? ""
        return dir * ap.localeCompare(bp)
      }

      case "links": {
        const al = backlinksMap?.get(a.id) ?? 0
        const bl = backlinksMap?.get(b.id) ?? 0
        return dir * (al - bl)
      }

      case "reads":
        return dir * ((a.reads ?? 0) - (b.reads ?? 0))

      case "createdAt":
        return dir * (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0)

      case "updatedAt":
        return dir * (a.updatedAt < b.updatedAt ? -1 : a.updatedAt > b.updatedAt ? 1 : 0)

      default:
        return 0
    }
  })

  return sorted
}
