/**
 * Wiki Infobox Preset Registry
 *
 * Each preset bundles:
 *   - a human label (shown in the preset dropdown)
 *   - a default header color (auto-applied on preset select)
 *   - a curated set of seed entries (field rows + group-header dividers)
 *
 * "custom" is a blank infobox (user adds fields freely).
 *
 * Colors use rgba alpha=0.65 — deep enough for white text to read clearly.
 */

import type { WikiInfoboxEntry, WikiInfoboxPreset } from "./types"

export interface PresetDefinition {
  preset: WikiInfoboxPreset
  /** Korean label shown in the preset dropdown. */
  label: string
  /** Optional sub-label for additional context (used in some UIs). */
  hint?: string
  /** Default header background color applied when this preset is selected. null = leave existing. */
  defaultHeaderColor: string | null
  /** Seed entries inserted when switching to this preset (replaces current entries). */
  defaultEntries: WikiInfoboxEntry[]
}

/* ── Color tokens — deep, alpha 0.65 for header presence ───────────────────── */
const C = {
  slate:    "rgba(30,41,59,0.65)",
  blue:     "rgba(37,99,235,0.65)",
  teal:     "rgba(13,148,136,0.65)",
  emerald:  "rgba(5,150,105,0.65)",
  amber:    "rgba(217,119,6,0.65)",
  red:      "rgba(220,38,38,0.65)",
  rose:     "rgba(225,29,72,0.65)",
  violet:   "rgba(124,58,237,0.65)",
  indigo:   "rgba(79,70,229,0.65)",
  sky:      "rgba(2,132,199,0.65)",
  stone:    "rgba(68,64,60,0.65)",
  // 2026-05-18 — 6 신규 preset용 color tokens (color 충돌 회피)
  cyan:     "rgba(8,145,178,0.65)",
  lime:     "rgba(101,163,13,0.65)",
  pink:     "rgba(219,39,119,0.65)",
  brown:    "rgba(120,71,38,0.65)",
} as const

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function field(key: string): WikiInfoboxEntry {
  return { type: "field", key, value: "" }
}
function groupHeader(key: string, opts?: { defaultCollapsed?: boolean }): WikiInfoboxEntry {
  return {
    type: "group-header",
    key,
    value: "",
    color: null,
    defaultCollapsed: opts?.defaultCollapsed ?? false,
  }
}

/* ── Registry ─────────────────────────────────────────────────────────────── */
export const INFOBOX_PRESETS: PresetDefinition[] = [
  {
    preset: "custom",
    label: "Blank",
    hint: "Add any fields freely",
    defaultHeaderColor: null,
    defaultEntries: [],
  },
  {
    preset: "person",
    label: "Person",
    defaultHeaderColor: C.slate,
    defaultEntries: [
      field("Full name"),
      field("Born"),
      field("Nationality"),
      field("Occupation"),
      field("Notable work"),
      groupHeader("Additional info", { defaultCollapsed: true }),
      field("Education"),
      field("Active period"),
      field("Website"),
    ],
  },
  {
    preset: "character",
    label: "Character",
    defaultHeaderColor: C.violet,
    defaultEntries: [
      field("Name"),
      field("Species/Type"),
      field("Affiliation"),
      field("Gender"),
      field("First appearance"),
      field("Voice actor"),
      field("Abilities"),
    ],
  },
  {
    preset: "place",
    label: "Place",
    defaultHeaderColor: C.emerald,
    defaultEntries: [
      field("Official name"),
      field("Country"),
      field("Region"),
      field("Area"),
      field("Population"),
      field("Founded/Built"),
      field("Head"),
      field("Coordinates"),
    ],
  },
  {
    preset: "organization",
    label: "Organization",
    defaultHeaderColor: C.indigo,
    defaultEntries: [
      field("Founded"),
      field("Founder"),
      field("Headquarters"),
      field("Director"),
      field("Industry"),
      groupHeader("Additional info", { defaultCollapsed: true }),
      field("Employees"),
      field("Website"),
      field("Legal form"),
    ],
  },
  {
    preset: "work-film",
    label: "Film",
    defaultHeaderColor: C.red,
    defaultEntries: [
      field("Director"),
      field("Cast"),
      field("Genre"),
      field("Release"),
      field("Runtime"),
      groupHeader("Production info", { defaultCollapsed: true }),
      field("Studio"),
      field("Distributor"),
      field("Country"),
    ],
  },
  {
    preset: "work-book",
    label: "Book",
    defaultHeaderColor: C.amber,
    defaultEntries: [
      field("Author"),
      field("Publisher"),
      field("Published"),
      field("Genre"),
      field("Pages"),
      groupHeader("Additional info", { defaultCollapsed: true }),
      field("ISBN"),
      field("Language"),
      field("Series"),
    ],
  },
  {
    preset: "work-music",
    label: "Album",
    defaultHeaderColor: C.rose,
    defaultEntries: [
      field("Artist"),
      field("Label"),
      field("Released"),
      field("Genre"),
      groupHeader("Additional info", { defaultCollapsed: true }),
      field("Tracks"),
      field("Runtime"),
      field("Producer"),
    ],
  },
  {
    preset: "work-game",
    label: "Game",
    defaultHeaderColor: C.sky,
    defaultEntries: [
      field("Developer"),
      field("Publisher"),
      field("Genre"),
      field("Platform"),
      field("Released"),
      groupHeader("Additional info", { defaultCollapsed: true }),
      field("Rating"),
      field("Engine"),
      field("Mode"),
    ],
  },
  {
    preset: "event",
    label: "Event",
    defaultHeaderColor: C.stone,
    defaultEntries: [
      field("Date"),
      field("Location"),
      field("Cause"),
      field("Outcome"),
      groupHeader("Additional info", { defaultCollapsed: true }),
      field("Participants"),
      field("Damage"),
      field("Duration"),
    ],
  },
  {
    preset: "concept",
    label: "Concept",
    defaultHeaderColor: C.teal,
    defaultEntries: [
      field("Field"),
      field("Origin"),
      field("Proposed by"),
      groupHeader("Additional info", { defaultCollapsed: true }),
      field("Related concepts"),
      field("Applications"),
      field("References"),
    ],
  },
  // ── 2026-05-18 — 나무위키 정합 6 신규 preset (사용자 요청) ──
  {
    preset: "school",
    label: "School",
    hint: "학교/대학",
    defaultHeaderColor: C.brown,
    defaultEntries: [
      field("Type"),
      field("Founded"),
      field("Location"),
      field("Principal/President"),
      field("Students"),
      groupHeader("Additional info", { defaultCollapsed: true }),
      field("Mascot"),
      field("Motto"),
      field("Website"),
    ],
  },
  {
    preset: "animal",
    label: "Animal",
    hint: "동물/생물",
    defaultHeaderColor: C.lime,
    defaultEntries: [
      field("Scientific name"),
      field("Family"),
      field("Habitat"),
      field("Diet"),
      field("Lifespan"),
      groupHeader("Additional info", { defaultCollapsed: true }),
      field("Conservation status"),
      field("Distribution"),
      field("Size"),
    ],
  },
  {
    preset: "software",
    label: "Software",
    hint: "소프트웨어/앱",
    defaultHeaderColor: C.cyan,
    defaultEntries: [
      field("Developer"),
      field("License"),
      field("Initial release"),
      field("Stable version"),
      field("Platform"),
      groupHeader("Additional info", { defaultCollapsed: true }),
      field("Written in"),
      field("Repository"),
      field("Website"),
    ],
  },
  {
    preset: "food",
    label: "Food",
    hint: "음식/요리",
    defaultHeaderColor: C.pink,
    defaultEntries: [
      field("Origin"),
      field("Type/Course"),
      field("Main ingredients"),
      field("Cooking style"),
      field("Serving temp"),
      groupHeader("Additional info", { defaultCollapsed: true }),
      field("Calories"),
      field("Allergens"),
      field("Variations"),
    ],
  },
  {
    preset: "vehicle",
    label: "Vehicle",
    hint: "자동차/항공기/선박",
    defaultHeaderColor: C.slate,
    defaultEntries: [
      field("Manufacturer"),
      field("Type"),
      field("Production"),
      field("Engine"),
      field("Top speed"),
      groupHeader("Additional info", { defaultCollapsed: true }),
      field("Weight"),
      field("Dimensions"),
      field("Successor"),
    ],
  },
  {
    preset: "sport-team",
    label: "Sport Team",
    hint: "스포츠팀/구단",
    defaultHeaderColor: C.blue,
    defaultEntries: [
      field("League"),
      field("Founded"),
      field("Home venue"),
      field("Manager"),
      field("Captain"),
      groupHeader("Additional info", { defaultCollapsed: true }),
      field("Owner"),
      field("Honors"),
      field("Sponsor"),
    ],
  },
]

/* ── Lookups ──────────────────────────────────────────────────────────────── */
const BY_KEY = new Map<WikiInfoboxPreset, PresetDefinition>(
  INFOBOX_PRESETS.map((p) => [p.preset, p]),
)

export function getPresetDefinition(preset: WikiInfoboxPreset | undefined | null): PresetDefinition {
  return BY_KEY.get((preset ?? "custom") as WikiInfoboxPreset) ?? BY_KEY.get("custom")!
}

/**
 * Returns a fresh deep-clone of a preset's seed entries.
 * Always returns a new array so callers can safely mutate.
 */
export function clonePresetEntries(preset: WikiInfoboxPreset): WikiInfoboxEntry[] {
  const def = getPresetDefinition(preset)
  return def.defaultEntries.map((e) => ({ ...e }))
}

/**
 * PR-A — Preset switching partial preserve.
 *
 * Returns the new preset's seed entries, but for each field key that matches
 * an existing entry with a non-empty value, the existing value is carried over.
 * Group headers are always taken from the new preset (they define the structure,
 * not user data). Existing keys not present in the new seed are dropped.
 *
 * Used by the "Preserve matching" choice in the preset-switch confirm dialog.
 */
export function mergePresetWithExisting(
  newPreset: WikiInfoboxPreset,
  existingEntries: WikiInfoboxEntry[],
): WikiInfoboxEntry[] {
  const seed = clonePresetEntries(newPreset)
  const valueByKey = new Map<string, string>()
  for (const e of existingEntries) {
    if (e.type === "group-header") continue
    if ((e.value ?? "").trim() === "") continue
    valueByKey.set(e.key, e.value)
  }
  return seed.map((s) =>
    s.type === "group-header" || !valueByKey.has(s.key)
      ? s
      : { ...s, value: valueByKey.get(s.key)! },
  )
}

/**
 * PR-A — Counts how many existing field values would be preserved vs dropped
 * when switching to `newPreset`. Drives the "N of M preserved" copy in the
 * confirm dialog so the user understands the impact before choosing.
 */
export function countPreservableValues(
  newPreset: WikiInfoboxPreset,
  existingEntries: WikiInfoboxEntry[],
): { preserved: number; dropped: number; total: number } {
  const seed = clonePresetEntries(newPreset)
  const seedKeys = new Set(
    seed.filter((e) => e.type !== "group-header").map((e) => e.key),
  )
  let preserved = 0
  let dropped = 0
  for (const e of existingEntries) {
    if (e.type === "group-header") continue
    if ((e.value ?? "").trim() === "") continue
    if (seedKeys.has(e.key)) preserved++
    else dropped++
  }
  return { preserved, dropped, total: preserved + dropped }
}
