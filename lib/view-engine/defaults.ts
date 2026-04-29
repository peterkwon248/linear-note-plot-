import type { ViewState, ViewContextKey, GroupBy, GroupSortBy, SortField, SortDirection, SortRule } from "./types"
import { VALID_VIEW_CONTEXT_KEYS, VALID_SORT_FIELDS, VALID_GROUP_BY, VALID_VIEW_MODES, VALID_COLUMNS, VALID_GROUP_SORT_BY, MAX_SORT_RULES } from "./types"

/* ── Default ViewState ─────────────────────────────────── */

export const DEFAULT_VIEW_STATE: ViewState = {
  viewMode: "list",
  sortFields: [{ field: "updatedAt", direction: "desc" }],
  sortField: "updatedAt",
  sortDirection: "desc",
  groupBy: "none",
  subGroupBy: "none",
  filters: [],
  visibleColumns: ["title", "status", "folder", "links", "reads", "updatedAt", "createdAt"],
  showEmptyGroups: false,
  toggles: {},
  groupOrder: null,
  subGroupOrder: null,
  subGroupSortBy: "default",
}

/* ── Context-specific overrides ────────────────────────── */

const ctx = (field: SortField, direction: SortDirection = "desc"): Partial<ViewState> => ({
  sortField: field,
  sortDirection: direction,
  sortFields: [{ field, direction }],
})

const CONTEXT_DEFAULTS: Partial<Record<ViewContextKey, Partial<ViewState>>> = {
  inbox:     { viewMode: "list", ...ctx("updatedAt"), groupBy: "none" },
  capture:   { viewMode: "list", ...ctx("updatedAt"), groupBy: "none" },
  permanent: { viewMode: "list", ...ctx("updatedAt"), groupBy: "none" },
  review:    { viewMode: "list", ...ctx("updatedAt"), groupBy: "status" },
  folder:    { viewMode: "list", ...ctx("updatedAt") },
  tag:       { viewMode: "list", ...ctx("updatedAt") },
  label:     { viewMode: "list", ...ctx("updatedAt") },
  savedView: { viewMode: "list", ...ctx("updatedAt"), groupBy: "none" },
  wiki:           { viewMode: "list", ...ctx("updatedAt"), groupBy: "none", visibleColumns: ["title", "links", "tags", "updatedAt"], toggles: { showStubs: true } },
  "wiki-category": { viewMode: "list", ...ctx("title", "asc"), groupBy: "none", visibleColumns: ["parent", "tier", "articles", "stubs", "sub", "updatedAt"] },
  graph:          { viewMode: "list", ...ctx("updatedAt"), groupBy: "none", toggles: { showWikilinks: true, showTagNodes: false, showLabels: false } },
  calendar:       { viewMode: "calendar", ...ctx("createdAt"), groupBy: "none", toggles: { showNotes: true, showWiki: true } },
}

/** Build a ViewState for a specific context, merging defaults */
export function buildViewStateForContext(ctx: ViewContextKey): ViewState {
  return { ...DEFAULT_VIEW_STATE, ...CONTEXT_DEFAULTS[ctx] }
}

/** Build the full viewStateByContext map with defaults for all contexts */
export function buildDefaultViewStates(): Record<ViewContextKey, ViewState> {
  const result = {} as Record<ViewContextKey, ViewState>
  for (const key of VALID_VIEW_CONTEXT_KEYS) {
    result[key] = buildViewStateForContext(key)
  }
  return result
}

/* ── Shape Normalization (for migrations) ──────────────── */

/** Columns that must always be present, in guaranteed order (last = rightmost) */
const REQUIRED_TAIL_COLUMNS = ["updatedAt", "createdAt"] as const

function ensureRequiredColumns(columns: string[]): string[] {
  // Strip required columns from wherever they are, then append in fixed order
  const filtered = columns.filter((c) => !(REQUIRED_TAIL_COLUMNS as readonly string[]).includes(c))
  return [...filtered, ...REQUIRED_TAIL_COLUMNS]
}

/** Validate a single SortRule shape; returns null on invalid */
function validateSortRule(raw: unknown): SortRule | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const field = r.field as SortField
  const direction = r.direction as SortDirection
  if (!VALID_SORT_FIELDS.includes(field)) return null
  if (direction !== "asc" && direction !== "desc") return null
  return { field, direction }
}

/**
 * Normalize a persisted ViewState to ensure all fields are valid.
 * - Invalid sortField/groupBy/viewMode → fallback to default
 * - Unknown column keys → filtered out
 * - Missing required columns → auto-added
 * - Missing fields → filled from default
 * - Keeps sortField/sortDirection in sync with sortFields[0]
 */
export function normalizeViewState(raw: Partial<ViewState>, ctx: ViewContextKey): ViewState {
  const base = buildViewStateForContext(ctx)

  // Migrate persisted "project" references to "folder"
  const migrated: Partial<ViewState> = { ...raw }
  if ((migrated.sortField as string) === "project") migrated.sortField = "folder"
  if ((migrated.groupBy as string) === "project") migrated.groupBy = "folder"
  if (Array.isArray(migrated.visibleColumns)) {
    migrated.visibleColumns = migrated.visibleColumns.map((c) => c === "project" ? "folder" : c)
  }

  const merged = { ...base, ...migrated }

  // Validate / build sortFields chain (max MAX_SORT_RULES, dedup by field)
  let sortFields: SortRule[] = []
  if (Array.isArray(merged.sortFields)) {
    const seen = new Set<SortField>()
    for (const raw of merged.sortFields) {
      const rule = validateSortRule(raw)
      if (!rule) continue
      if (seen.has(rule.field)) continue
      seen.add(rule.field)
      sortFields.push(rule)
      if (sortFields.length >= MAX_SORT_RULES) break
    }
  }
  if (sortFields.length === 0) {
    // Fallback to legacy single-field shape
    const field = VALID_SORT_FIELDS.includes(merged.sortField) ? merged.sortField : base.sortFields[0].field
    const direction = (merged.sortDirection === "asc" || merged.sortDirection === "desc")
      ? merged.sortDirection
      : base.sortFields[0].direction
    sortFields = [{ field, direction }]
  }

  return {
    viewMode: VALID_VIEW_MODES.includes(merged.viewMode) ? merged.viewMode : base.viewMode,
    sortFields,
    sortField: sortFields[0].field,
    sortDirection: sortFields[0].direction,
    groupBy: VALID_GROUP_BY.includes(merged.groupBy) ? merged.groupBy : base.groupBy,
    subGroupBy: VALID_GROUP_BY.includes(merged.subGroupBy as GroupBy) ? (merged.subGroupBy as GroupBy) : "none",
    filters: Array.isArray(merged.filters) ? merged.filters : [],
    visibleColumns: ensureRequiredColumns(
      Array.isArray(merged.visibleColumns)
        ? merged.visibleColumns.filter((c) => VALID_COLUMNS.includes(c))
        : base.visibleColumns
    ),
    showEmptyGroups: typeof merged.showEmptyGroups === "boolean" ? merged.showEmptyGroups : false,
    toggles: (merged.toggles && typeof merged.toggles === "object" && !Array.isArray(merged.toggles))
      ? merged.toggles as Record<string, boolean>
      : {},
    groupOrder: (merged.groupOrder && typeof merged.groupOrder === "object" && !Array.isArray(merged.groupOrder))
      ? merged.groupOrder as Record<string, string[]>
      : null,
    subGroupOrder: (merged.subGroupOrder && typeof merged.subGroupOrder === "object" && !Array.isArray(merged.subGroupOrder))
      ? merged.subGroupOrder as Record<string, string[]>
      : null,
    subGroupSortBy: VALID_GROUP_SORT_BY.includes(merged.subGroupSortBy as GroupSortBy) ? (merged.subGroupSortBy as GroupSortBy) : "default",
  }
}

/**
 * Normalize the full viewStateByContext map.
 * - Fills missing context keys with defaults
 * - Removes unknown context keys
 * - Normalizes each ViewState shape
 */
export function normalizeViewStatesMap(
  raw: Record<string, unknown> | undefined
): Record<ViewContextKey, ViewState> {
  const result = buildDefaultViewStates()

  if (!raw || typeof raw !== "object") return result

  for (const key of VALID_VIEW_CONTEXT_KEYS) {
    const persisted = raw[key]
    if (persisted && typeof persisted === "object") {
      result[key] = normalizeViewState(persisted as Partial<ViewState>, key)
    }
  }

  return result
}
