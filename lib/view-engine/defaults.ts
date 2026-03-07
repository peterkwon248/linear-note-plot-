import type { ViewState, ViewContextKey } from "./types"
import { VALID_VIEW_CONTEXT_KEYS, VALID_SORT_FIELDS, VALID_GROUP_BY, VALID_VIEW_MODES, VALID_COLUMNS } from "./types"

/* ── Default ViewState ─────────────────────────────────── */

export const DEFAULT_VIEW_STATE: ViewState = {
  viewMode: "table",
  sortField: "updatedAt",
  sortDirection: "desc",
  groupBy: "none",
  filters: [],
  visibleColumns: ["title", "status", "project", "links", "reads", "priority", "updatedAt", "createdAt"],
  showEmptyGroups: false,
}

/* ── Context-specific overrides ────────────────────────── */

const CONTEXT_DEFAULTS: Partial<Record<ViewContextKey, Partial<ViewState>>> = {
  inbox:     { viewMode: "list", sortField: "updatedAt", groupBy: "none" },
  capture:   { viewMode: "list", sortField: "updatedAt", groupBy: "none" },
  permanent: { viewMode: "list", sortField: "updatedAt", groupBy: "none" },
  review:    { viewMode: "list", sortField: "updatedAt", groupBy: "status" },
  archive:   { viewMode: "list", sortField: "updatedAt" },
  folder:    { viewMode: "list", sortField: "updatedAt" },
  category:  { viewMode: "list", sortField: "updatedAt" },
  tag:       { viewMode: "list", sortField: "updatedAt" },
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

/**
 * Normalize a persisted ViewState to ensure all fields are valid.
 * - Invalid sortField/groupBy/viewMode → fallback to default
 * - Unknown column keys → filtered out
 * - Missing required columns → auto-added
 * - Missing fields → filled from default
 */
export function normalizeViewState(raw: Partial<ViewState>, ctx: ViewContextKey): ViewState {
  const base = buildViewStateForContext(ctx)
  const merged = { ...base, ...raw }

  return {
    viewMode: VALID_VIEW_MODES.includes(merged.viewMode) ? merged.viewMode : base.viewMode,
    sortField: VALID_SORT_FIELDS.includes(merged.sortField) ? merged.sortField : base.sortField,
    sortDirection: (merged.sortDirection === "asc" || merged.sortDirection === "desc")
      ? merged.sortDirection
      : base.sortDirection,
    groupBy: VALID_GROUP_BY.includes(merged.groupBy) ? merged.groupBy : base.groupBy,
    filters: Array.isArray(merged.filters) ? merged.filters : [],
    visibleColumns: ensureRequiredColumns(
      Array.isArray(merged.visibleColumns)
        ? merged.visibleColumns.filter((c) => VALID_COLUMNS.includes(c))
        : base.visibleColumns
    ),
    showEmptyGroups: typeof merged.showEmptyGroups === "boolean" ? merged.showEmptyGroups : false,
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
