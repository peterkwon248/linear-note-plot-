import type { Note } from "../types"
import type { SortField, SortDirection, SortRule } from "./types"
import { STATUS_ORDER, PRIORITY_ORDER } from "./types"

/**
 * Compare two notes against one sort rule. Stable for ties (returns 0).
 */
function compareSingle(
  a: Note,
  b: Note,
  field: SortField,
  direction: SortDirection,
  backlinksMap?: Map<string, number>,
): number {
  const dir = direction === "asc" ? 1 : -1

  switch (field) {
    case "title":
      return dir * a.title.localeCompare(b.title)

    case "status":
      return dir * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

    case "priority":
      return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

    case "folder": {
      const aFolder = a.folderId ?? ""
      const bFolder = b.folderId ?? ""
      return dir * aFolder.localeCompare(bFolder)
    }

    case "label": {
      const aLabel = (a as any).labelId ?? ""
      const bLabel = (b as any).labelId ?? ""
      return dir * aLabel.localeCompare(bLabel)
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
}

/**
 * Sort notes using a chain of sort rules.
 * Returns a new sorted array (does not mutate input).
 * Stable sort guaranteed by Array.prototype.sort in modern engines.
 *
 * Overloads:
 *   - applySort(notes, sorts: SortRule[], backlinksMap?)
 *   - applySort(notes, field: SortField, direction: SortDirection, backlinksMap?)  // legacy
 */
export function applySort(
  notes: Note[],
  sorts: SortRule[],
  backlinksMap?: Map<string, number>,
): Note[]
export function applySort(
  notes: Note[],
  field: SortField,
  direction: SortDirection,
  backlinksMap?: Map<string, number>,
): Note[]
export function applySort(
  notes: Note[],
  sortsOrField: SortRule[] | SortField,
  directionOrBacklinks?: SortDirection | Map<string, number>,
  maybeBacklinks?: Map<string, number>,
): Note[] {
  if (notes.length <= 1) return notes

  // Normalize args into a SortRule[] chain + backlinksMap
  let chain: SortRule[]
  let backlinksMap: Map<string, number> | undefined

  if (Array.isArray(sortsOrField)) {
    chain = sortsOrField.length > 0 ? sortsOrField : [{ field: "updatedAt", direction: "desc" }]
    backlinksMap = directionOrBacklinks as Map<string, number> | undefined
  } else {
    chain = [{ field: sortsOrField, direction: directionOrBacklinks as SortDirection }]
    backlinksMap = maybeBacklinks
  }

  const sorted = [...notes]

  sorted.sort((a, b) => {
    for (const rule of chain) {
      const result = compareSingle(a, b, rule.field, rule.direction, backlinksMap)
      if (result !== 0) return result
    }
    return 0
  })

  return sorted
}
