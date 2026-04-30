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
import { isWikiStub } from "../wiki-utils"
import type { FilterRule, GroupBy, SortRule } from "./types"
import { isToday, isThisWeek, isThisMonth, isYesterday } from "date-fns"
import { classifyWikiArticleRole, type WikiArticleRole } from "../wiki-hierarchy"

/* ── Wiki Group type ─────────────────────────────────────── */

export interface WikiGroup {
  key: string
  label: string
  articles: WikiArticle[]
  /** Per-article depth (0 = root). Only populated when groupBy="family". */
  depthMap?: Record<string, number>
}

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
      // Hierarchy filter (4 categories — mirrors classifyWikiArticleRole):
      //   _root   = no parent, has children
      //   _parent = has parent, has children
      //   _child  = has parent, no children
      //   _solo   = no parent, no children
      const hasParent = !!article.parentArticleId
      const hasChildren = extras?.hasChildrenSet?.has(article.id) ?? false
      let role: "_root" | "_parent" | "_child" | "_solo"
      if (hasParent && hasChildren) role = "_parent"
      else if (hasParent) role = "_child"
      else if (hasChildren) role = "_root"
      else role = "_solo"
      if (value === "_root" || value === "_parent" || value === "_child" || value === "_solo") {
        const match = role === value
        return operator === "eq" ? match : !match
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

    case "status": {
      // Wiki status: Article (false = not stub) sorts before Stub (true). article first.
      const aStub = isWikiStub(a) ? 1 : 0
      const bStub = isWikiStub(b) ? 1 : 0
      return dir * (aStub - bStub)
    }

    case "reads": {
      const ar = a.reads ?? 0
      const br = b.reads ?? 0
      return dir * (ar - br)
    }

    // Notes-specific fields (priority/folder/label) — fail-safe 0
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

/* ── Wiki Grouping ───────────────────────────────────────── */

const WIKI_MAX_DEPTH = 20

/**
 * Build a depth map for wiki articles via parentArticleId chain.
 * Root articles (no parentArticleId or pointing outside set) get depth 0.
 * Cycle-safe via visited Set + WIKI_MAX_DEPTH cap.
 */
function buildWikiDepthMap(articles: WikiArticle[]): Map<string, number> {
  const articleMap = new Map<string, WikiArticle>(articles.map((a) => [a.id, a]))
  const depthCache = new Map<string, number>()

  function getDepth(articleId: string, visited: Set<string>): number {
    if (depthCache.has(articleId)) return depthCache.get(articleId)!
    if (visited.has(articleId)) return 0  // cycle guard
    const article = articleMap.get(articleId)
    if (!article || !article.parentArticleId || !articleMap.has(article.parentArticleId)) {
      depthCache.set(articleId, 0)
      return 0
    }
    const nextVisited = new Set(visited)
    nextVisited.add(articleId)
    const parentDepth = getDepth(article.parentArticleId, nextVisited)
    const depth = Math.min(parentDepth + 1, WIKI_MAX_DEPTH)
    depthCache.set(articleId, depth)
    return depth
  }

  for (const article of articles) {
    getDepth(article.id, new Set())
  }

  return depthCache
}

/**
 * Find the root ancestor ID for a wiki article.
 * Traverses parentArticleId chain upward until no parent found in set.
 * Cycle-safe via visited Set + WIKI_MAX_DEPTH cap.
 */
function getWikiRootId(articleId: string, articleMap: Map<string, WikiArticle>): string {
  const visited = new Set<string>()
  let current = articleId
  let steps = 0

  while (steps < WIKI_MAX_DEPTH) {
    if (visited.has(current)) break  // cycle guard
    visited.add(current)
    const article = articleMap.get(current)
    if (!article || !article.parentArticleId || !articleMap.has(article.parentArticleId)) break
    current = article.parentArticleId
    steps++
  }

  return current
}

export interface WikiGroupingExtras {
  /** Required for "linkCount" grouping */
  backlinksMap?: Map<string, number>
  /** Full store article list for role classification (filterAwareRole OFF) */
  allWikiArticles?: WikiArticle[]
  /** When true, classify role based on filtered view slice; when false/undefined, use full store */
  filterAwareRole?: boolean
  /** categoryId → name lookup for "label" grouping headers (otherwise raw id leaks to UI) */
  categoryNames?: Map<string, string>
}

/**
 * Group wiki articles by the specified dimension.
 * Currently supports: "none" | "family" | "tier" | "parent" | "linkCount" | "label" | "role".
 * For grouping not handled here, returns a single flat group.
 *
 * @param articles - sorted+filtered article list
 * @param groupBy - grouping dimension from ViewState
 * @param extrasOrBacklinksMap - WikiGroupingExtras or legacy Map<string, number> for backward compat
 */
export function applyWikiGrouping(
  articles: WikiArticle[],
  groupBy: GroupBy,
  extrasOrBacklinksMap?: WikiGroupingExtras | Map<string, number>,
): WikiGroup[] {
  // Backward compat: accept bare Map<string, number> as before
  const extras: WikiGroupingExtras =
    extrasOrBacklinksMap instanceof Map
      ? { backlinksMap: extrasOrBacklinksMap }
      : (extrasOrBacklinksMap ?? {})
  const backlinksMap = extras.backlinksMap
  switch (groupBy) {
    case "none":
      return [{ key: "_all", label: "", articles }]

    case "family": {
      const articleMap = new Map<string, WikiArticle>(articles.map((a) => [a.id, a]))
      const depthMap = buildWikiDepthMap(articles)

      // Group by root ancestor
      const families = new Map<string, WikiArticle[]>()
      for (const article of articles) {
        const rootId = getWikiRootId(article.id, articleMap)
        const bucket = families.get(rootId)
        if (bucket) bucket.push(article)
        else families.set(rootId, [article])
      }

      const groups: WikiGroup[] = []
      for (const [rootId, members] of families) {
        const root = articleMap.get(rootId)
        const rootLabel = root?.title || "Untitled"

        // Sort members by depth, then title
        const sorted = [...members].sort((a, b) => {
          const da = depthMap.get(a.id) ?? 0
          const db = depthMap.get(b.id) ?? 0
          if (da !== db) return da - db
          return (a.title || "").localeCompare(b.title || "")
        })

        const groupDepthMap: Record<string, number> = {}
        for (const article of sorted) {
          groupDepthMap[article.id] = depthMap.get(article.id) ?? 0
        }

        groups.push({
          key: `family-${rootId}`,
          label: rootLabel,
          articles: sorted,
          depthMap: groupDepthMap,
        })
      }

      // Sort groups by root label
      groups.sort((a, b) => a.label.localeCompare(b.label))
      return groups
    }

    case "tier": {
      // Group by depth from root (0 = root, 1 = child, ...)
      const depthMap = buildWikiDepthMap(articles)
      const buckets = new Map<number, WikiArticle[]>()

      for (const article of articles) {
        const d = depthMap.get(article.id) ?? 0
        const bucket = buckets.get(d)
        if (bucket) bucket.push(article)
        else buckets.set(d, [article])
      }

      return [...buckets.entries()]
        .sort(([a], [b]) => a - b)
        .map(([depth, arts]) => ({
          key: `tier-${depth}`,
          label: depth === 0 ? "Root" : `Tier ${depth + 1}`,
          articles: arts,
        }))
    }

    case "parent": {
      // Group by parentArticleId (direct parent)
      const articleMap = new Map<string, WikiArticle>(articles.map((a) => [a.id, a]))
      const parentGroups = new Map<string, WikiArticle[]>()
      const noParent: WikiArticle[] = []

      for (const article of articles) {
        const parentId = article.parentArticleId
        if (!parentId) {
          noParent.push(article)
          continue
        }
        const bucket = parentGroups.get(parentId)
        if (bucket) bucket.push(article)
        else parentGroups.set(parentId, [article])
      }

      const groups: WikiGroup[] = []
      const sortedParentIds = [...parentGroups.keys()].sort((a, b) => {
        const titleA = articleMap.get(a)?.title ?? a
        const titleB = articleMap.get(b)?.title ?? b
        return titleA.localeCompare(titleB)
      })

      for (const parentId of sortedParentIds) {
        const parent = articleMap.get(parentId)
        groups.push({
          key: `parent-${parentId}`,
          label: parent?.title ?? "Unknown",
          articles: parentGroups.get(parentId)!,
        })
      }

      if (noParent.length > 0) {
        groups.push({ key: "_no_parent", label: "No Parent", articles: noParent })
      }

      return groups
    }

    case "linkCount": {
      type LBucket = "none" | "few" | "well" | "hub"
      const bucketLabels: Record<LBucket, string> = {
        none: "No Links",
        few: "1-2 Links",
        well: "3-5 Links",
        hub: "6+ Links",
      }
      const bucketOrder: LBucket[] = ["none", "few", "well", "hub"]
      const buckets: Record<LBucket, WikiArticle[]> = { none: [], few: [], well: [], hub: [] }

      for (const article of articles) {
        const inCount = backlinksMap?.get(article.id) ?? 0
        const outCount = article.linksOut?.length ?? 0
        const total = inCount + outCount
        let bucket: LBucket
        if (total === 0) bucket = "none"
        else if (total <= 2) bucket = "few"
        else if (total <= 5) bucket = "well"
        else bucket = "hub"
        buckets[bucket].push(article)
      }

      return bucketOrder.map((key) => ({
        key: `linkCount-${key}`,
        label: bucketLabels[key],
        articles: buckets[key],
      }))
    }

    case "label": {
      // label = WikiCategory for wiki articles (categoryIds[])
      const categoryGroups = new Map<string, WikiArticle[]>()
      const noCategory: WikiArticle[] = []

      for (const article of articles) {
        const cats = article.categoryIds ?? []
        if (cats.length === 0) {
          noCategory.push(article)
          continue
        }
        // Place article in the first category bucket
        const catId = cats[0]
        const bucket = categoryGroups.get(catId)
        if (bucket) bucket.push(article)
        else categoryGroups.set(catId, [article])
      }

      const groups: WikiGroup[] = []
      for (const [catId, arts] of categoryGroups) {
        const name = extras.categoryNames?.get(catId) ?? catId
        groups.push({ key: `label-${catId}`, label: name, articles: arts })
      }
      if (noCategory.length > 0) {
        groups.push({ key: "_no_label", label: "Uncategorized", articles: noCategory })
      }

      return groups
    }

    case "role": {
      const WIKI_ROLE_KEYS: WikiArticleRole[] = ["root", "parent", "child", "solo"]
      const WIKI_ROLE_LABELS: Record<WikiArticleRole, string> = {
        root: "Root",
        parent: "Parent",
        child: "Child",
        solo: "Solo",
      }
      const buckets: Record<WikiArticleRole, WikiArticle[]> = {
        root: [],
        parent: [],
        child: [],
        solo: [],
      }
      // filterAwareRole ON → classify within current view slice
      // filterAwareRole OFF (default) → classify within full store (allWikiArticles ?? articles)
      const lookupSource = extras.filterAwareRole ? articles : (extras.allWikiArticles ?? articles)
      const store = { wikiArticles: lookupSource }
      for (const article of articles) {
        buckets[classifyWikiArticleRole(article.id, store)].push(article)
      }
      return WIKI_ROLE_KEYS.map((key) => ({
        key: `role-${key}`,
        label: WIKI_ROLE_LABELS[key],
        articles: buckets[key],
      }))
    }

    default:
      return [{ key: "_all", label: "", articles }]
  }
}
