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
