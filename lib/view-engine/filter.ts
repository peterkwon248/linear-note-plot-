import type { Note } from "../types"
import type { FilterRule } from "./types"

/**
 * Stage 2: Apply user-defined filter rules.
 *
 * Logic:
 *   - Same field → OR  (e.g. status:inbox + status:capture → inbox OR capture)
 *   - Different fields → AND  (e.g. status:inbox + priority:high → inbox AND high)
 *
 * This matches the standard filter behaviour of Linear, Notion, etc.
 */
export function applyFilters(notes: Note[], filters: FilterRule[]): Note[] {
  if (filters.length === 0) return notes

  // Group rules by field name
  const byField = new Map<string, FilterRule[]>()
  for (const rule of filters) {
    let bucket = byField.get(rule.field)
    if (!bucket) {
      bucket = []
      byField.set(rule.field, bucket)
    }
    bucket.push(rule)
  }

  const fieldGroups = Array.from(byField.values())

  return notes.filter((note) =>
    // AND across different fields
    fieldGroups.every((fieldRules) =>
      // OR within the same field
      fieldRules.some((rule) => matchesRule(note, rule)),
    ),
  )
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

    case "folder": {
      const fid = note.folderId ?? ""
      // Special value "_none" means "no folder assigned"
      if (value === "_none") {
        return operator === "eq" ? fid === "" : fid !== ""
      }
      return compareString(fid, operator, value)
    }

    case "label": {
      const lid = (note as any).labelId ?? ""
      if (value === "_none") {
        return operator === "eq" ? lid === "" : lid !== ""
      }
      if (value === "_any") {
        return operator === "eq" ? lid !== "" : lid === ""
      }
      return compareString(lid, operator, value)
    }

    case "updatedAt": {
      const noteTime = new Date(note.updatedAt).getTime()
      // Support ISO date prefix (e.g., "2026-04-04" for "today")
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const targetEnd = new Date(value + "T23:59:59.999Z").getTime()
        const targetStart = new Date(value + "T00:00:00.000Z").getTime()
        switch (operator) {
          case "eq": return noteTime >= targetStart && noteTime <= targetEnd
          case "lt": return noteTime < targetStart
          case "gt": return noteTime > targetEnd
          default: return true
        }
      }
      // Fallback: relative time threshold like "24h", "7d", "30d"
      const ms = parseRelativeTime(value)
      if (ms === null) return true
      const cutoff = Date.now() - ms
      switch (operator) {
        case "gt": return noteTime > cutoff
        case "lt": return noteTime < cutoff
        default: return true
      }
    }

    case "createdAt": {
      const noteTime = new Date(note.createdAt).getTime()
      // Support ISO date prefix (e.g., "2026-04-04")
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const targetEnd = new Date(value + "T23:59:59.999Z").getTime()
        const targetStart = new Date(value + "T00:00:00.000Z").getTime()
        switch (operator) {
          case "eq": return noteTime >= targetStart && noteTime <= targetEnd
          case "lt": return noteTime < targetStart
          case "gt": return noteTime > targetEnd
          default: return true
        }
      }
      const ms = parseRelativeTime(value)
      if (ms === null) return true
      const cutoff = Date.now() - ms
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

    case "source": {
      const noteSource = note.source ?? ""
      // "_none" means no source (null or "")
      if (value === "_none") {
        return operator === "eq" ? noteSource === "" : noteSource !== ""
      }
      return compareString(noteSource, operator, value)
    }

    case "wordCount": {
      const words = note.content?.trim().split(/\s+/).filter(Boolean).length ?? 0
      return compareNumber(words, operator, value)
    }

    case "title": {
      const hasTitle = (note.title?.trim().length ?? 0) > 0
      // "empty" = no title / untitled
      if (value === "empty") {
        return operator === "eq" ? !hasTitle : hasTitle
      }
      return true
    }

    case "noteType": {
      return compareString(note.noteType, operator, value)
    }

    case "reviewAt": {
      if (!note.reviewAt) return operator === "eq" ? false : true
      const noteTime = new Date(note.reviewAt).getTime()
      // Support ISO date prefix (e.g., "2026-04-04")
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const targetEnd = new Date(value + "T23:59:59.999Z").getTime()
        const targetStart = new Date(value + "T00:00:00.000Z").getTime()
        switch (operator) {
          case "eq": return noteTime >= targetStart && noteTime <= targetEnd
          case "lt": return noteTime < targetStart
          case "gt": return noteTime > targetEnd
          default: return true
        }
      }
      // Fallback: relative time
      const ms = parseRelativeTime(value)
      if (ms === null) return true
      const cutoff = Date.now() - ms
      switch (operator) {
        case "gt": return noteTime > cutoff
        case "lt": return noteTime < cutoff
        default: return true
      }
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
