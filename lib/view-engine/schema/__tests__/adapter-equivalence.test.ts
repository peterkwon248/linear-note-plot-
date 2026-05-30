import { describe, it, expect } from "vitest"
import { NOTES_VIEW_CONFIG } from "../../view-configs"
import type { ViewConfig } from "../../view-configs"
import { NOTES_SCHEMA } from "../entities/notes.schema"
import { toViewConfig } from "../adapter"

/**
 * A3.2 / M1 — adapter equivalence safety net (plan §3, D4).
 *
 * Proves `toViewConfig(NOTES_SCHEMA)` is structurally equivalent to the live,
 * hand-written `NOTES_VIEW_CONFIG`. Once green, M2 can swap the export
 * (`NOTES_VIEW_CONFIG = toViewConfig(NOTES_SCHEMA, hydrators)`) with confidence.
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
