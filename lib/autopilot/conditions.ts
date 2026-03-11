import type { Note, AutopilotCondition, AutopilotConditionOperator } from "@/lib/types"
import type { AutopilotContext } from "./types"

const DAY_MS = 24 * 60 * 60 * 1000

/** Extract the numeric/string value of a condition field from the note context */
function getFieldValue(ctx: AutopilotContext, field: string): string | number | boolean {
  const { note, now } = ctx

  switch (field) {
    case "status":
      return note.status
    case "priority":
      return note.priority
    case "triage_status":
      return note.triageStatus
    case "content_length":
      return note.preview.length  // approximate, preview is ~120 chars max
    case "word_count":
      return note.preview.split(/\s+/).filter(Boolean).length
    case "reads":
      return note.reads
    case "age_days":
      return Math.floor((now - new Date(note.createdAt).getTime()) / DAY_MS)
    case "has_links":
      return note.linksOut.length > 0
    case "has_tags":
      return note.tags.length > 0
    case "has_label":
      return note.labelId !== null
    case "has_folder":
      return note.folderId !== null
    case "link_count":
      return note.linksOut.length + ctx.backlinksCount
    case "tag_count":
      return note.tags.length
    case "title_length":
      return note.title.length
    case "snooze_count":
      return note.snoozeCount ?? 0
    default:
      return ""
  }
}

/** Compare using the given operator */
function compare(
  actual: string | number | boolean,
  operator: AutopilotConditionOperator,
  expected: string | number | boolean
): boolean {
  // For boolean fields
  if (typeof actual === "boolean") {
    const expectedBool = expected === true || expected === "true" || expected === 1
    switch (operator) {
      case "eq": return actual === expectedBool
      case "neq": return actual !== expectedBool
      default: return false
    }
  }

  // For numeric comparisons
  if (typeof actual === "number") {
    const num = typeof expected === "number" ? expected : Number(expected)
    if (isNaN(num)) return false
    switch (operator) {
      case "eq": return actual === num
      case "neq": return actual !== num
      case "gt": return actual > num
      case "gte": return actual >= num
      case "lt": return actual < num
      case "lte": return actual <= num
      default: return false
    }
  }

  // For string comparisons
  const str = String(actual)
  const exp = String(expected)
  switch (operator) {
    case "eq": return str === exp
    case "neq": return str !== exp
    case "contains": return str.includes(exp)
    case "not_contains": return !str.includes(exp)
    case "gt": return str > exp
    case "gte": return str >= exp
    case "lt": return str < exp
    case "lte": return str <= exp
    default: return false
  }
}

/** Evaluate a single condition against a note context */
export function matchesCondition(ctx: AutopilotContext, condition: AutopilotCondition): boolean {
  const actual = getFieldValue(ctx, condition.field)
  return compare(actual, condition.operator, condition.value)
}

/** Evaluate ALL conditions (AND logic) */
export function matchesAllConditions(ctx: AutopilotContext, conditions: AutopilotCondition[]): boolean {
  if (conditions.length === 0) return false  // empty conditions = no match (safety)
  return conditions.every((c) => matchesCondition(ctx, c))
}
