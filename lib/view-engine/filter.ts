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

function parseRelativeTime(value: string): number | null {
  const match = value.match(/^(\d+)(h|d)$/)
  if (!match) return null
  const num = parseInt(match[1], 10)
  const unit = match[2]
  if (unit === "h") return num * 60 * 60 * 1000
  if (unit === "d") return num * 24 * 60 * 60 * 1000
  return null
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

    case "project": {
      const pid = note.projectId ?? ""
      // Special value "_none" means "no project assigned"
      if (value === "_none") {
        return operator === "eq" ? pid === "" : pid !== ""
      }
      return compareString(pid, operator, value)
    }

    case "updatedAt": {
      // value is a relative time threshold like "24h", "7d", "30d"
      const ms = parseRelativeTime(value)
      if (ms === null) return true
      const cutoff = Date.now() - ms
      const noteTime = new Date(note.updatedAt).getTime()
      // "gt" means "more recent than cutoff" (within the time window)
      // "lt" means "older than cutoff" (outside the time window)
      switch (operator) {
        case "gt": return noteTime > cutoff
        case "lt": return noteTime < cutoff
        default: return true
      }
    }

    case "createdAt": {
      const ms = parseRelativeTime(value)
      if (ms === null) return true
      const cutoff = Date.now() - ms
      const noteTime = new Date(note.createdAt).getTime()
      switch (operator) {
        case "gt": return noteTime > cutoff
        case "lt": return noteTime < cutoff
        default: return true
      }
    }

    case "content": {
      // "eq" with value "empty" means note has no content
      // "neq" with value "empty" means note has content
      const hasContent = (note.content?.trim().length ?? 0) > 0
      if (value === "empty") {
        return operator === "eq" ? !hasContent : hasContent
      }
      return true
    }

    case "tags": {
      const hasTags = (note.tags?.length ?? 0) > 0
      // value "_any" = has at least one tag, "_none" = no tags
      if (value === "_any") {
        return operator === "eq" ? hasTags : !hasTags
      }
      if (value === "_none") {
        return operator === "eq" ? !hasTags : hasTags
      }
      // Specific tag ID
      const hasTag = note.tags?.includes(value) ?? false
      return operator === "eq" ? hasTag : !hasTag
    }

    case "pinned": {
      // value "true" or "false"
      const isPinned = note.pinned === true
      const target = value === "true"
      return operator === "eq" ? isPinned === target : isPinned !== target
    }

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
