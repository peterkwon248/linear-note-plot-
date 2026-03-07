import type { Note } from "../types"
import type { FilterRule } from "./types"

/**
 * Stage 2: Apply user-defined filter rules (AND logic).
 * Each FilterRule is applied in order; a note must pass ALL rules.
 */
export function applyFilters(notes: Note[], filters: FilterRule[]): Note[] {
  if (filters.length === 0) return notes

  return notes.filter((note) => filters.every((rule) => matchesRule(note, rule)))
}

function matchesRule(note: Note, rule: FilterRule): boolean {
  const { field, operator, value } = rule

  switch (field) {
    case "status":
      return compareString(note.status, operator, value)

    case "priority":
      return compareString(note.priority, operator, value)

    case "links": {
      // linksOut count (outbound wiki-links from the note)
      const count = note.linksOut?.length ?? 0
      return compareNumber(count, operator, value)
    }

    case "reads":
      return compareNumber(note.reads ?? 0, operator, value)

    default:
      return true
  }
}

function compareString(actual: string, operator: string, expected: string): boolean {
  switch (operator) {
    case "eq":  return actual === expected
    case "neq": return actual !== expected
    default:    return true
  }
}

function compareNumber(actual: number, operator: string, expected: string): boolean {
  const num = Number(expected)
  if (isNaN(num)) return true

  switch (operator) {
    case "eq":  return actual === num
    case "neq": return actual !== num
    case "gt":  return actual > num
    case "lt":  return actual < num
    default:    return true
  }
}
