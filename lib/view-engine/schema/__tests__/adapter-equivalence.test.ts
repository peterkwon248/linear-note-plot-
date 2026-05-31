import { describe, it, expect } from "vitest"
import { NOTES_VIEW_CONFIG, BOOKS_VIEW_CONFIG, WIKI_VIEW_CONFIG } from "../../view-configs"
import type { ViewConfig } from "../../view-configs"
import { NOTES_SCHEMA } from "../entities/notes.schema"
import { BOOKS_SCHEMA } from "../entities/books.schema"
import { WIKI_SCHEMA } from "../entities/wiki.schema"
import { toViewConfig, toFilterCategories } from "../adapter"
import type { PropertyCategory } from "../property-def"

/**
 * A3.2 / M1 — adapter equivalence safety net (plan §3, D4).
 *
 * Originally proved `toViewConfig(NOTES_SCHEMA)` ≈ the live hand-written
 * `NOTES_VIEW_CONFIG`. Post-M2/M3/M4 the `*_VIEW_CONFIG` exports are THEMSELVES
 * `toViewConfig(*_SCHEMA)`, so the structural `toEqual` checks below are now a
 * self-consistency guard (they re-run the adapter and confirm the export is a
 * pure projection — catching accidental post-hoc mutation of the exported
 * object). The load-bearing ORDER assertions (`filterCategories`/`orderingOptions`/
 * `groupingOptions`/`properties` key+value lists) double as a regression lock on
 * the per-surface ordering the schema hints encode.
 *
 * A3.3-E1 adds a dedicated "filter category 6-cluster order" block: it asserts
 * `toFilterCategories(SCHEMA)` emits categories grouped by `PropertyCategory`
 * (workflow → classification → relations → metrics → time → content) with each
 * category contiguous — the data-layer contract the upcoming filter dividers
 * (E2) consume.
 *
 * `icon` is a React element (ReactNode) — it can't survive `toEqual` (element
 * identity / Symbol internals differ). So we compare two ways:
 *   1. STRUCTURE: strip every `icon` key recursively, then deep-equal.
 *   2. ICON PRESENCE: walk both trees in parallel and assert that wherever the
 *      reference config has an icon, the generated config also has one (and
 *      vice-versa) — guaranteeing no icon was dropped or spuriously added.
 *
 * Dynamic categories (folder/label/tags) carry `values: []` in the static
 * reference config (they're hydrated at runtime in notes-table). The adapter is
 * called WITHOUT hydrators here, so it also yields `values: []` — matching.
 */

const ICON_KEY = "icon"

/** Recursively clone a value with every `icon` property removed. */
function stripIcons(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripIcons)
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === ICON_KEY) continue
      out[k] = stripIcons(v)
    }
    return out
  }
  return value
}

/** Whether a node "has an icon" = own `icon` key present and not nullish. */
function hasIcon(node: Record<string, unknown>): boolean {
  return ICON_KEY in node && node[ICON_KEY] != null
}

/**
 * Walk reference + generated in parallel, asserting icon presence parity at
 * every object node. Returns the number of icon-bearing nodes checked so the
 * caller can assert the walk actually covered icons (guards against a no-op).
 */
function assertIconParity(ref: unknown, gen: unknown, path = "root"): number {
  let count = 0
  if (Array.isArray(ref) && Array.isArray(gen)) {
    expect(gen.length, `array length mismatch at ${path}`).toBe(ref.length)
    for (let i = 0; i < ref.length; i++) {
      count += assertIconParity(ref[i], gen[i], `${path}[${i}]`)
    }
    return count
  }
  if (ref !== null && typeof ref === "object" && gen !== null && typeof gen === "object") {
    const refObj = ref as Record<string, unknown>
    const genObj = gen as Record<string, unknown>
    const refHas = hasIcon(refObj)
    const genHas = hasIcon(genObj)
    expect(genHas, `icon presence mismatch at ${path} (ref=${refHas} gen=${genHas})`).toBe(refHas)
    if (refHas) count += 1
    // Recurse into non-icon keys present in the reference.
    for (const key of Object.keys(refObj)) {
      if (key === ICON_KEY) continue
      count += assertIconParity(refObj[key], genObj[key], `${path}.${key}`)
    }
  }
  return count
}

describe("A3.2 schema adapter — Notes equivalence", () => {
  const generated: ViewConfig = toViewConfig(NOTES_SCHEMA)

  it("structurally equals NOTES_VIEW_CONFIG (icons excluded)", () => {
    expect(stripIcons(generated)).toEqual(stripIcons(NOTES_VIEW_CONFIG))
  })

  it("matches the top-level view flags", () => {
    expect(generated.showFilter).toBe(NOTES_VIEW_CONFIG.showFilter)
    expect(generated.showDisplay).toBe(NOTES_VIEW_CONFIG.showDisplay)
    expect(generated.showDetailPanel).toBe(NOTES_VIEW_CONFIG.showDetailPanel)
  })

  it("preserves filterCategories order and keys", () => {
    expect(generated.filterCategories.map((c) => c.key)).toEqual(
      NOTES_VIEW_CONFIG.filterCategories.map((c) => c.key),
    )
  })

  it("preserves orderingOptions order and values", () => {
    expect(generated.displayConfig.orderingOptions.map((o) => o.value)).toEqual(
      NOTES_VIEW_CONFIG.displayConfig.orderingOptions.map((o) => o.value),
    )
  })

  it("preserves groupingOptions order and values", () => {
    expect(generated.displayConfig.groupingOptions.map((g) => g.value)).toEqual(
      NOTES_VIEW_CONFIG.displayConfig.groupingOptions.map((g) => g.value),
    )
  })

  it("preserves display properties order and keys", () => {
    expect(generated.displayConfig.properties.map((p) => p.key)).toEqual(
      NOTES_VIEW_CONFIG.displayConfig.properties.map((p) => p.key),
    )
  })

  it("keeps icon presence parity across the whole tree (D4)", () => {
    const checked = assertIconParity(NOTES_VIEW_CONFIG, generated)
    // Sanity: the Notes config has many icons (categories, status/source values,
    // display props, toggle) — make sure the walk actually exercised them.
    expect(checked).toBeGreaterThan(20)
  })
})

describe("A3.2 schema adapter — Books equivalence (M4)", () => {
  const generated: ViewConfig = toViewConfig(BOOKS_SCHEMA)

  it("structurally equals BOOKS_VIEW_CONFIG (icons excluded)", () => {
    expect(stripIcons(generated)).toEqual(stripIcons(BOOKS_VIEW_CONFIG))
  })

  it("matches the top-level view flags (incl. showDetailPanel:false)", () => {
    expect(generated.showFilter).toBe(BOOKS_VIEW_CONFIG.showFilter)
    expect(generated.showDisplay).toBe(BOOKS_VIEW_CONFIG.showDisplay)
    expect(generated.showDetailPanel).toBe(BOOKS_VIEW_CONFIG.showDetailPanel)
    expect(generated.showDetailPanel).toBe(false)
  })

  it("preserves filterCategories order and keys", () => {
    expect(generated.filterCategories.map((c) => c.key)).toEqual(
      BOOKS_VIEW_CONFIG.filterCategories.map((c) => c.key),
    )
  })

  it("preserves orderingOptions order and values", () => {
    expect(generated.displayConfig.orderingOptions.map((o) => o.value)).toEqual(
      BOOKS_VIEW_CONFIG.displayConfig.orderingOptions.map((o) => o.value),
    )
  })

  it("preserves groupingOptions order and values", () => {
    expect(generated.displayConfig.groupingOptions.map((g) => g.value)).toEqual(
      BOOKS_VIEW_CONFIG.displayConfig.groupingOptions.map((g) => g.value),
    )
  })

  it("preserves display properties order and keys", () => {
    expect(generated.displayConfig.properties.map((p) => p.key)).toEqual(
      BOOKS_VIEW_CONFIG.displayConfig.properties.map((p) => p.key),
    )
  })

  it("keeps icon presence parity across the whole tree (D4)", () => {
    const checked = assertIconParity(BOOKS_VIEW_CONFIG, generated)
    // Books has icons on every filter category, the kind/sourceType values, and
    // the display props — ensure the walk actually exercised them.
    expect(checked).toBeGreaterThan(10)
  })
})

describe("A3.2 schema adapter — Wiki equivalence (M3)", () => {
  const generated: ViewConfig = toViewConfig(WIKI_SCHEMA)

  it("structurally equals WIKI_VIEW_CONFIG (icons excluded)", () => {
    expect(stripIcons(generated)).toEqual(stripIcons(WIKI_VIEW_CONFIG))
  })

  it("matches the top-level view flags", () => {
    expect(generated.showFilter).toBe(WIKI_VIEW_CONFIG.showFilter)
    expect(generated.showDisplay).toBe(WIKI_VIEW_CONFIG.showDisplay)
    expect(generated.showDetailPanel).toBe(WIKI_VIEW_CONFIG.showDetailPanel)
  })

  it("preserves filterCategories order and keys", () => {
    expect(generated.filterCategories.map((c) => c.key)).toEqual(
      WIKI_VIEW_CONFIG.filterCategories.map((c) => c.key),
    )
  })

  it("preserves orderingOptions order and values (diverges from filter order via sortOrder)", () => {
    expect(generated.displayConfig.orderingOptions.map((o) => o.value)).toEqual(
      WIKI_VIEW_CONFIG.displayConfig.orderingOptions.map((o) => o.value),
    )
  })

  it("preserves groupingOptions order and values (property groupings + extras interleave)", () => {
    expect(generated.displayConfig.groupingOptions.map((g) => g.value)).toEqual(
      WIKI_VIEW_CONFIG.displayConfig.groupingOptions.map((g) => g.value),
    )
  })

  it("preserves display properties order and keys (diverges from filter order via displayOrder)", () => {
    expect(generated.displayConfig.properties.map((p) => p.key)).toEqual(
      WIKI_VIEW_CONFIG.displayConfig.properties.map((p) => p.key),
    )
  })

  it("keeps icon presence parity across the whole tree (D4)", () => {
    const checked = assertIconParity(WIKI_VIEW_CONFIG, generated)
    // Wiki has icons on every filter category, the 4 status values, and the
    // display props — ensure the walk actually exercised them.
    expect(checked).toBeGreaterThan(15)
  })
})

describe("A3.3-E1 — filter categories carry the 6-cluster `category`", () => {
  // Canonical cluster order (PropertyCategory union order). Every emitted
  // category must equal one of these, and same-category entries must be
  // contiguous in this order (no cluster appears twice non-adjacently).
  const CLUSTER_ORDER: PropertyCategory[] = [
    "workflow",
    "classification",
    "relations",
    "metrics",
    "time",
    "content",
  ]

  /** Assert the category sequence is a non-decreasing walk over CLUSTER_ORDER —
   *  i.e. clusters appear in canonical order and each cluster's entries are
   *  contiguous (the divider-grouping contract for E2). */
  function expectClustered(categories: (PropertyCategory | undefined)[]) {
    // No category may be undefined for a schema-generated filter list.
    for (const c of categories) expect(c).toBeDefined()
    const rank = (c: PropertyCategory | undefined) => CLUSTER_ORDER.indexOf(c as PropertyCategory)
    for (let i = 1; i < categories.length; i++) {
      expect(
        rank(categories[i]),
        `category cluster regressed at index ${i}: ${String(categories[i - 1])} → ${String(categories[i])}`,
      ).toBeGreaterThanOrEqual(rank(categories[i - 1]))
    }
    // Contiguity: the set of distinct clusters, in first-appearance order, must
    // be strictly increasing in rank (a cluster never recurs after a later one).
    const seen: PropertyCategory[] = []
    for (const c of categories) {
      if (c !== undefined && (seen.length === 0 || seen[seen.length - 1] !== c)) {
        expect(seen).not.toContain(c) // would mean a cluster split into two runs
        seen.push(c)
      }
    }
  }

  it("Notes: workflow → classification → relations → time → content", () => {
    const cats = toFilterCategories(NOTES_SCHEMA).map((c) => c.category)
    expect(cats).toEqual([
      "workflow", "workflow",                                  // status, pinned
      "classification", "classification", "classification", "classification", // folder, label, tags, source
      "relations", "relations",                                // links, wikiRegistered
      "time",                                                  // updatedAt (Dates)
      "content",                                               // content
    ])
    expectClustered(cats)
    // Key order pairs 1:1 with the category order above.
    expect(toFilterCategories(NOTES_SCHEMA).map((c) => c.key)).toEqual([
      "status", "pinned", "folder", "label", "tags", "source",
      "links", "wikiRegistered", "updatedAt", "content",
    ])
  })

  it("Wiki: workflow → classification → relations → time → content (wikiTier in relations)", () => {
    const cats = toFilterCategories(WIKI_SCHEMA).map((c) => c.category)
    expect(cats).toEqual([
      "workflow", "workflow",           // status, priority (§11)
      "classification",                 // category
      "relations", "relations",         // links, wikiTier
      "time", "time",                   // updatedAt, createdAt
      "content",                        // title (Aliases)
    ])
    expectClustered(cats)
    expect(toFilterCategories(WIKI_SCHEMA).map((c) => c.key)).toEqual([
      "status", "priority", "category", "links", "wikiTier", "updatedAt", "createdAt", "title",
    ])
  })

  it("Books: workflow → classification → time (status·priority·pinned in workflow; §11)", () => {
    const cats = toFilterCategories(BOOKS_SCHEMA).map((c) => c.category)
    expect(cats).toEqual([
      "workflow", "workflow", "workflow",   // status, priority, pinned
      "classification", "classification",   // kind, sourceType
      "time",                                // updatedAt
    ])
    expectClustered(cats)
    expect(toFilterCategories(BOOKS_SCHEMA).map((c) => c.key)).toEqual([
      "status", "priority", "pinned", "kind", "sourceType", "updatedAt",
    ])
  })
})
