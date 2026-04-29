/**
 * wiki-list-pipeline.ts
 *
 * Wiki-specific filter + sort helper for WikiArticle[] (NOT Note[]).
 * Notes pipeline (filter.ts/sort.ts) is Note-typed; wiki has its own data model.
 *
 * Phase 1 (UI 일관성 audit): wiki list mode uses viewStateByContext["wiki"] for
 * sortFields/filters/toggles persistence, but WikiArticle ≠ Note, so we need
 * a wiki-specific pipeline that mirrors the same patterns at the data layer.
 *
 * 의도된 차이 (vs Notes):
 *   - priority sort 제외: wiki에 priority 개념 없음
 *   - status filter 제외: stub/article은 런타임 파생 (isWikiStub) → showStubs 토글
 *   - tier/parent grouping은 위계 (parentArticleId) 기반
 *   - links sort/filter: backlink count 기반 (Notes는 outbound counts)
 */

import type { WikiArticle } from "../types"
import type { FilterRule, SortRule } from "./types"
import { isToday, isThisWeek, isThisMonth, isYesterday } from "date-fns"

/* ── Helpers ─────────────────────────────────────────────── */

function parseRelativeMs(value: string): number | null {
  const match = value.match(/^(\d+)(h|d)$/)
  if (!match) return null
  const num = parseInt(match[1], 10)
  const unit = match[2]
  if (unit === "h") return num * 60 * 60 * 1000
  if (unit === "d") return num * 24 * 60 * 60 * 1000
  return null
}

/**
 * Match a date against a named sentinel value (today, this-week, etc.).
 * Returns null if `value` is not a recognized sentinel.
 * Mirrors filter.ts:matchDateSentinel for parity with Notes.
 */
function matchDateSentinel(date: Date, value: string, operator: string): boolean | null {
  const ms = date.getTime()
  let result: boolean | null = null

  switch (value) {
    case "today":       result = isToday(date); break
    case "yesterday":   result = isYesterday(date); break
    case "this-week":   result = isThisWeek(date, { weekStartsOn: 1 }); break
    case "this-month":  result = isThisMonth(date); break
    case "last-7-days": result = ms >= Date.now() - 7 * 24 * 60 * 60 * 1000; break
    case "last-30-days": result = ms >= Date.now() - 30 * 24 * 60 * 60 * 1000; break
    case "stale":       result = Date.now() - ms >= 30 * 24 * 60 * 60 * 1000; break
    default:
      return null
  }

  return operator === "neq" ? !result : result
}

/* ── Filter ──────────────────────────────────────────────── */

export interface WikiFilterExtras {
  /** Map of articleId → backlink count (incoming references). */
  backlinksMap?: Map<string, number>
  /** Set of article IDs that have at least one child (parentArticleId === id). Computed once. */
  hasChildrenSet?: Set<string>
}

function matchWikiRule(article: WikiArticle, rule: FilterRule, extras?: WikiFilterExtras): boolean {
  const { field, operator, value } = rule

  switch (field) {
    case "category": {
      // Filter by WikiCategory id. _none = no categories assigned.
      const cats = article.categoryIds ?? []
      if (value === "_none") {
        return operator === "eq" ? cats.length === 0 : cats.length > 0
      }
      const hasCat = cats.includes(value)
      return operator === "eq" ? hasCat : !hasCat
    }

    case "links": {
      const inCount = extras?.backlinksMap?.get(article.id) ?? 0
      const outCount = article.linksOut?.length ?? 0

      if (value === "_orphan") {
        const result = inCount === 0 && outCount === 0
        return operator === "eq" ? result : !result
      }
      if (value === "_any") {
        const result = inCount > 0
        return operator === "eq" ? result : !result
      }
      if (value === "_none") {
        const result = inCount === 0
        return operator === "eq" ? result : !result
      }
      // "5+", "10+" → backlink threshold
      if (value.endsWith("+")) {
        const threshold = Number(value.slice(0, -1))
        if (!isNaN(threshold)) {
          return inCount >= threshold
        }
      }
      // Fallback numeric: compare backlink count
      const num = Number(value)
      if (isNaN(num)) return true
      switch (operator) {
        case "eq": return inCount === num
        case "neq": return inCount !== num
        case "gt": return inCount > num
        case "lt": return inCount < num
        default: return true
      }
    }

    case "updatedAt":
    case "createdAt": {
      const raw = field === "updatedAt" ? article.updatedAt : article.createdAt
      const date = new Date(raw)
      const time = date.getTime()
      const sentinel = matchDateSentinel(date, value, operator)
      if (sentinel !== null) return sentinel
      // ISO date prefix
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const targetEnd = new Date(value + "T23:59:59.999Z").getTime()
        const targetStart = new Date(value + "T00:00:00.000Z").getTime()
        switch (operator) {
          case "eq": return time >= targetStart && time <= targetEnd
          case "lt": return time < targetStart
          case "gt": return time > targetEnd
          default: return true
        }
      }
      // Relative time threshold
      const ms = parseRelativeMs(value)
      if (ms === null) return true
      const cutoff = Date.now() - ms
      switch (operator) {
        case "gt": return time > cutoff
        case "lt": return time < cutoff
        default: return true
      }
    }

    case "title": {
      // Aliases pseudo-filter: WIKI_VIEW_CONFIG uses field="title" with value="_aliased"/"_unaliased"
      const aliasCount = article.aliases?.length ?? 0
      if (value === "_aliased") {
        return operator === "eq" ? aliasCount > 0 : aliasCount === 0
      }
      if (value === "_unaliased") {
        return operator === "eq" ? aliasCount === 0 : aliasCount > 0
      }
      return true
    }

    case "wikiTier": {
      // Hierarchy filter (Phase 1): _root / _child / _leaf
      const hasParent = !!article.parentArticleId
      const hasChildren = extras?.hasChildrenSet?.has(article.id) ?? false
      if (value === "_root") {
        return operator === "eq" ? !hasParent : hasParent
      }
      if (value === "_child") {
        return operator === "eq" ? hasParent : !hasParent
      }
      if (value === "_leaf") {
        return operator === "eq" ? !hasChildren : hasChildren
      }
      return true
    }

    case "tags": {
      // Note: 별도 키 — 현재 WIKI_VIEW_CONFIG는 "category"를 사용하므로 통상 진입 안 함.
      const ts = article.tags ?? []
      if (value === "_any") return operator === "eq" ? ts.length > 0 : ts.length === 0
      if (value === "_none") return operator === "eq" ? ts.length === 0 : ts.length > 0
      const has = ts.includes(value)
      return operator === "eq" ? has : !has
    }

    default:
      // Unknown filter for wiki context — pass through (fail-open)
      return true
  }
}

/**
 * Apply user-defined filter rules to a WikiArticle list.
 * Logic:
 *   - Same field → OR
 *   - Different fields → AND
 * Mirrors applyFilters (Notes) semantics.
 */
export function applyWikiFilters(
  articles: WikiArticle[],
  filters: FilterRule[],
  extras?: WikiFilterExtras,
): WikiArticle[] {
  if (filters.length === 0) return articles

  const byField = new Map<string, FilterRule[]>()
  for (const rule of filters) {
    const bucket = byField.get(rule.field) ?? []
    bucket.push(rule)
    byField.set(rule.field, bucket)
  }
  const fieldGroups = Array.from(byField.values())

  return articles.filter((a) =>
    fieldGroups.every((rules) => rules.some((r) => matchWikiRule(a, r, extras))),
  )
}

/* ── Sort ────────────────────────────────────────────────── */

function compareSingleWiki(
  a: WikiArticle,
  b: WikiArticle,
  field: SortRule["field"],
  direction: SortRule["direction"],
  backlinksMap?: Map<string, number>,
): number {
  const dir = direction === "asc" ? 1 : -1

  switch (field) {
    case "title":
      return dir * (a.title || "").localeCompare(b.title || "")

    case "links": {
      // Wiki-specific: sort by backlink count (inbound), Notes는 outbound
      const al = backlinksMap?.get(a.id) ?? 0
      const bl = backlinksMap?.get(b.id) ?? 0
      return dir * (al - bl)
    }

    case "createdAt":
      return dir * (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0)

    case "updatedAt":
      return dir * (a.updatedAt < b.updatedAt ? -1 : a.updatedAt > b.updatedAt ? 1 : 0)

    // Wiki-specific sort fields (used by wiki-category mode but harmless here)
    case "tier": {
      // Tier = depth from root via parentArticleId. 0 if no parent.
      // Computed lazily — tier sort is rarely the primary chain in list mode.
      return 0  // No depth lookup here; group.ts handles tier grouping
    }
    case "parent": {
      const ap = a.parentArticleId ?? ""
      const bp = b.parentArticleId ?? ""
      return dir * ap.localeCompare(bp)
    }

    // Notes-specific fields (priority/status/folder/label/reads) — fail-safe 0
    default:
      return 0
  }
}

/**
 * Sort WikiArticle[] by a chain of sort rules. Stable sort.
 * Mirrors applySort (Notes) signature.
 */
export function applyWikiSort(
  articles: WikiArticle[],
  sorts: SortRule[],
  backlinksMap?: Map<string, number>,
): WikiArticle[] {
  if (articles.length <= 1) return articles
  const chain = sorts.length > 0 ? sorts : [{ field: "updatedAt" as const, direction: "desc" as const }]
  const sorted = [...articles]
  sorted.sort((a, b) => {
    for (const rule of chain) {
      const result = compareSingleWiki(a, b, rule.field, rule.direction, backlinksMap)
      if (result !== 0) return result
    }
    return 0
  })
  return sorted
}
