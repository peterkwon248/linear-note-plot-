import { describe, it, expect } from "vitest"
import {
  countPreservableValues,
  mergePresetWithExisting,
} from "../wiki-infobox-presets"
import type { WikiInfoboxEntry } from "../types"

const seedExisting: WikiInfoboxEntry[] = [
  { type: "field", key: "Creator", value: "Niklas Luhmann" },
  { type: "field", key: "Origin", value: "Germany" },
  { type: "field", key: "Meaning", value: "Slip-box" },
  { type: "field", key: "Core Principle", value: "Atomic notes" },
]

describe("countPreservableValues", () => {
  it("counts only matching keys with non-empty values", () => {
    // concept preset fields: Field, Origin, Proposed by, Related concepts, Applications, References
    const stats = countPreservableValues("concept", seedExisting)
    expect(stats).toEqual({ preserved: 1, dropped: 3, total: 4 })
  })

  it("returns zero when entries are empty", () => {
    expect(countPreservableValues("person", [])).toEqual({
      preserved: 0,
      dropped: 0,
      total: 0,
    })
  })

  it("ignores group-headers in counts", () => {
    const entries: WikiInfoboxEntry[] = [
      { type: "group-header", key: "Additional info", value: "" },
      { type: "field", key: "Origin", value: "X" },
    ]
    const stats = countPreservableValues("concept", entries)
    expect(stats).toEqual({ preserved: 1, dropped: 0, total: 1 })
  })

  it("ignores empty-value fields", () => {
    const entries: WikiInfoboxEntry[] = [
      { type: "field", key: "Origin", value: "" },
      { type: "field", key: "Creator", value: "   " },
    ]
    const stats = countPreservableValues("concept", entries)
    expect(stats).toEqual({ preserved: 0, dropped: 0, total: 0 })
  })
})

describe("mergePresetWithExisting", () => {
  it("preserves matching keys and seeds the rest empty", () => {
    const merged = mergePresetWithExisting("concept", seedExisting)
    // Origin is the only key present in both → its value carries over.
    const originRow = merged.find(
      (e) => e.type !== "group-header" && e.key === "Origin",
    )
    expect(originRow?.value).toBe("Germany")
    // All other field rows from the concept preset should be empty.
    for (const row of merged) {
      if (row.type === "group-header") continue
      if (row.key === "Origin") continue
      expect(row.value).toBe("")
    }
    // No row from the old preset's unmatched keys should remain.
    expect(merged.find((e) => e.key === "Creator")).toBeUndefined()
    expect(merged.find((e) => e.key === "Meaning")).toBeUndefined()
    expect(merged.find((e) => e.key === "Core Principle")).toBeUndefined()
  })

  it("returns plain preset clone when nothing matches", () => {
    const merged = mergePresetWithExisting("animal", seedExisting)
    // animal preset has no overlap with the seedExisting keys.
    for (const row of merged) {
      if (row.type === "group-header") continue
      expect(row.value).toBe("")
    }
  })

  it("never mutates input arrays", () => {
    const snapshot = JSON.parse(JSON.stringify(seedExisting))
    mergePresetWithExisting("concept", seedExisting)
    expect(seedExisting).toEqual(snapshot)
  })

  it("includes group-headers from the new preset structure", () => {
    // person preset seeds with one group-header "Additional info" (collapsed).
    const merged = mergePresetWithExisting("person", seedExisting)
    const headers = merged.filter((e) => e.type === "group-header")
    expect(headers.length).toBeGreaterThan(0)
  })

  it("handles 'custom' preset (empty seed) gracefully", () => {
    const merged = mergePresetWithExisting("custom", seedExisting)
    expect(merged).toEqual([])
  })
})
