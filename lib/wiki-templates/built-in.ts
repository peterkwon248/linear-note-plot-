/**
 * Built-in wiki templates (Phase 1).
 *
 * 8 shipped presets. IDs are stable across sessions so `WikiArticle.templateId`
 * can reference them reliably. Built-ins live in code (not persisted) —
 * the `wikiTemplates` store slice only holds user-defined templates.
 *
 * 진실의 원천: docs/BRAINSTORM-2026-04-14-column-template-system.md
 */

import type {
  ColumnStructure,
  WikiTemplate,
  WikiTemplateSection,
  WikiThemeColor,
  WikiInfoboxEntry,
} from "../types"

/** Stable IDs (prefix `builtin-` signals built-in status; isBuiltIn: true enforces it). */
export const BUILT_IN_TEMPLATE_IDS = {
  blank: "builtin-blank",
  encyclopedia: "builtin-encyclopedia",
  person: "builtin-person",
  place: "builtin-place",
  concept: "builtin-concept",
  work: "builtin-work",
  organization: "builtin-organization",
  event: "builtin-event",
} as const

export type BuiltInTemplateKey = keyof typeof BUILT_IN_TEMPLATE_IDS

/* ── Layout helpers ─────────────────────────────────────────────── */

/** 1-column layout. Single content area. */
const ONE_COLUMN: ColumnStructure = {
  type: "columns",
  columns: [
    { ratio: 1, content: { type: "blocks", blockIds: [] } },
  ],
}

/** 2-column layout — main content (3fr) + infobox column (1fr, min 240px). */
const TWO_COLUMN_MAIN_INFOBOX: ColumnStructure = {
  type: "columns",
  columns: [
    { ratio: 3, content: { type: "blocks", blockIds: [] } },                            // [0] main
    { ratio: 1, minWidth: 240, priority: 1, content: { type: "blocks", blockIds: [] } },// [1] infobox
  ],
}

/* ── Theme color helpers ────────────────────────────────────────── */

/** rgba with light/dark variants. Light = 0.12 alpha, dark = 0.2 alpha. */
const theme = (lightHex: string, darkHex: string): WikiThemeColor => ({
  light: hexToRgba(lightHex, 0.12),
  dark: hexToRgba(darkHex, 0.22),
})

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/* ── Section helpers ────────────────────────────────────────────── */

const section = (
  title: string,
  columnPath: number[] = [0],
  opts?: Partial<Omit<WikiTemplateSection, "title" | "level" | "columnPath">>,
): WikiTemplateSection => ({
  title,
  level: 2,
  columnPath,
  ...opts,
})

/** Empty infobox field placeholders (key empty → user fills in after template selection). */
const field = (key: string): WikiInfoboxEntry => ({ key, value: "", type: "field" })

/* ── Template builders ──────────────────────────────────────────── */

const TIMESTAMP = "2026-04-15T00:00:00.000Z" // static — built-ins have no meaningful created/updated

function makeTemplate(partial: Omit<WikiTemplate, "createdAt" | "updatedAt" | "isBuiltIn">): WikiTemplate {
  return {
    ...partial,
    isBuiltIn: true,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  }
}

/* ── The 8 built-in templates ───────────────────────────────────── */

const BLANK = makeTemplate({
  id: BUILT_IN_TEMPLATE_IDS.blank,
  name: "Blank",
  description: "Empty canvas with a single column. Start from scratch.",
  icon: "📄",
  layout: ONE_COLUMN,
  sections: [],
  infobox: {
    fields: [],
    columnPath: [0],
  },
})

const ENCYCLOPEDIA = makeTemplate({
  id: BUILT_IN_TEMPLATE_IDS.encyclopedia,
  name: "Encyclopedia",
  description: "Classic 2-column layout with sidebar infobox. Overview / Details / See Also.",
  icon: "📖",
  layout: TWO_COLUMN_MAIN_INFOBOX,
  sections: [
    section("Overview"),
    section("Details"),
    section("See Also"),
  ],
  infobox: {
    fields: [field("Info")],
    columnPath: [1], // sidebar column
  },
})

const PERSON = makeTemplate({
  id: BUILT_IN_TEMPLATE_IDS.person,
  name: "Person",
  description: "Biography template — Biography / Works / Legacy + personal infobox.",
  icon: "👤",
  layout: TWO_COLUMN_MAIN_INFOBOX,
  themeColor: theme("#f59e0b", "#fb923c"), // amber / orange
  sections: [
    section("Biography"),
    section("Works"),
    section("Legacy"),
  ],
  infobox: {
    fields: [
      field("Name"),
      field("Born"),
      field("Died"),
      field("Nationality"),
    ],
    columnPath: [1],
  },
})

const PLACE = makeTemplate({
  id: BUILT_IN_TEMPLATE_IDS.place,
  name: "Place",
  description: "Geographic entity — Overview / History / Geography + location infobox.",
  icon: "🗺️",
  layout: TWO_COLUMN_MAIN_INFOBOX,
  themeColor: theme("#14b8a6", "#38bdf8"), // teal / blue
  sections: [
    section("Overview"),
    section("History"),
    section("Geography"),
  ],
  infobox: {
    fields: [
      field("Country"),
      field("Capital"),
      field("Population"),
    ],
    columnPath: [1],
  },
})

const CONCEPT = makeTemplate({
  id: BUILT_IN_TEMPLATE_IDS.concept,
  name: "Concept",
  description: "Abstract concept — Definition / Origin / Examples in a single flowing column.",
  icon: "💡",
  layout: ONE_COLUMN,
  themeColor: theme("#a855f7", "#a78bfa"), // purple / violet
  sections: [
    section("Definition"),
    section("Origin"),
    section("Examples"),
  ],
  infobox: {
    fields: [
      field("Field"),
      field("Related"),
    ],
    columnPath: [0], // inline (single column)
  },
})

const WORK = makeTemplate({
  id: BUILT_IN_TEMPLATE_IDS.work,
  name: "Work",
  description: "Creative work — Overview / Plot / Characters + authorship infobox.",
  icon: "🎨",
  layout: TWO_COLUMN_MAIN_INFOBOX,
  themeColor: theme("#f43f5e", "#f472b6"), // rose / pink
  sections: [
    section("Overview"),
    section("Plot"),
    section("Characters"),
  ],
  infobox: {
    fields: [
      field("Author"),
      field("Published"),
      field("Genre"),
    ],
    columnPath: [1],
  },
})

const ORGANIZATION = makeTemplate({
  id: BUILT_IN_TEMPLATE_IDS.organization,
  name: "Organization",
  description: "Organization — Overview / History / Structure + institutional infobox.",
  icon: "🏢",
  layout: TWO_COLUMN_MAIN_INFOBOX,
  themeColor: theme("#64748b", "#94a3b8"), // gray / slate
  sections: [
    section("Overview"),
    section("History"),
    section("Structure"),
  ],
  infobox: {
    fields: [
      field("Founded"),
      field("HQ"),
      field("Members"),
    ],
    columnPath: [1],
  },
})

const EVENT = makeTemplate({
  id: BUILT_IN_TEMPLATE_IDS.event,
  name: "Event",
  description: "Event/incident — Background / Course / Aftermath in a single column.",
  icon: "📅",
  layout: ONE_COLUMN,
  themeColor: theme("#ef4444", "#fb923c"), // red / orange
  sections: [
    section("Background"),
    section("Course"),
    section("Aftermath"),
  ],
  infobox: {
    fields: [
      field("Date"),
      field("Location"),
      field("Participants"),
    ],
    columnPath: [0],
  },
})

/* ── Public API ─────────────────────────────────────────────────── */

/** All 8 built-in templates in display order (Blank first, Encyclopedia second, then typed). */
export const BUILT_IN_TEMPLATES: readonly WikiTemplate[] = [
  BLANK,
  ENCYCLOPEDIA,
  PERSON,
  PLACE,
  CONCEPT,
  WORK,
  ORGANIZATION,
  EVENT,
] as const

/** Lookup a built-in template by id. Returns `undefined` if not found. */
export function getBuiltInTemplate(id: string): WikiTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id)
}

/** True if the id matches any built-in template. */
export function isBuiltInTemplateId(id: string): boolean {
  return BUILT_IN_TEMPLATES.some((t) => t.id === id)
}
