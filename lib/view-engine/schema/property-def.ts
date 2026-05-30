import type { ReactNode } from "react"
import type { FilterField, SortField, GroupBy, ViewMode } from "../types"
import type { DisplayToggle, GroupingOption, DisplayProperty, QuickFilter } from "../view-configs"
import type { HydratorKey } from "./hydrators"

/**
 * A3.2 schema engine — `PropertyDef` is the single source of truth for a
 * view-engine entity's filter / display / group / sort surfaces.
 *
 * Design: docs/01-plan/features/linear-filter-display-schema-engine.plan.md (§1).
 *
 * The engine does NOT introduce new enums. Every slot that maps to the runtime
 * (filter execution case, viewState.groupBy, sort field, visibleColumns) is
 * typed against the existing `../types` unions so the type system enforces the
 * "schema generates UI only, execution stays in filter.ts/group.ts/sort.ts"
 * contract (plan §0.4, §6 D-final).
 */

/** A PropertyDef's canonical key. It is ALWAYS a member of an existing
 *  `../types` union (FilterField / GroupBy / SortField) — never a fabricated
 *  enum — so the key always names a real, executable axis that filter.ts /
 *  group.ts / sort.ts already handle (plan iron-rule: "no new enum"). Properties
 *  that have a filter facet use a `FilterField`; group/sort-only axes (e.g.
 *  `parent`) use their `GroupBy` / `SortField` member. Pure display-only
 *  columns with no executable axis (e.g. `children`) are NOT PropertyDefs —
 *  they live in `ViewDefaults.extraDisplayProperties` (DisplayProperty.key is a
 *  plain string). */
export type PropertyKey = FilterField | GroupBy | SortField

/** 6-category shared axis (spec A2). Drives the filter divider grouping and the
 *  display-section ordering — the semantic unit, not a behavioural one. */
export type PropertyCategory =
  | "workflow"        // status, priority, kind, pinned
  | "classification"  // folder, label, tags, category
  | "relations"       // links, parent, children, connectedTo
  | "metrics"         // wordCount, reads, itemCount
  | "time"            // createdAt, updatedAt
  | "content"         // hasImage/code/table, aliases, title

/** Widget type = filter sub-panel + display cell render branch (FlowBase
 *  type-switch port). */
export type PropertyValueType =
  | "enum" | "entityRef" | "dateBucket" | "numberBucket" | "boolean" | "special"

export type PropertyOptionSource =
  | { kind: "static"; values: PropertyOption[] }
  | { kind: "dynamic"; hydratorKey: HydratorKey }

export interface PropertyOption {
  key: string
  label: string
  labelKey?: string         // i18n (mirrors FilterValue.labelKey)
  color?: string            // NOTE_STATUS_HEX etc.
  icon?: ReactNode          // per-option icon
  group?: string            // sub-section header (Ontology Status Note&Wiki/Book)
}

export interface FilterBucket {
  key: string               // "today" / "stale" / "5+"
  label: string
  labelKey?: string
  /** Bucket → filter rule operator. Mirrors FilterOperator subset used by
   *  date/number sentinels in filter.ts. */
  operator: "eq" | "gt" | "lt"
  value: string             // "24h" / "30d" / "4"
  group?: string            // "Updated" / "Stale" / "Created" sub-header
}

export interface PropertyDef {
  key: PropertyKey          // execution case + viewState match. Existing unions only (see PropertyKey).
  category: PropertyCategory
  label: string             // default label for every surface (override per-surface below)
  labelKey?: string         // default i18n key for every surface
  icon: ReactNode           // chrome icon (filter row, leading 16px, strokeWidth 1.5)
  valueType: PropertyValueType

  isFilterable?: boolean
  isDisplayable?: boolean
  isGroupable?: boolean
  isSortable?: boolean

  options?: PropertyOptionSource  // enum / entityRef
  buckets?: FilterBucket[]        // dateBucket / numberBucket

  groupBy?: GroupBy         // omitted → cast `key`
  sortField?: SortField     // omitted → cast `key`
  columnKey?: string        // display → visibleColumns key (omitted → `key`)

  filterModes?: ViewMode[] | "all"
  displayModes?: ViewMode[] | "all"
  groupModes?: ViewMode[] | "all"
  sortModes?: ViewMode[] | "all"

  /** Per-surface label / labelKey overrides. The same concept legitimately
   *  carries different chrome text per surface in the legacy configs
   *  (e.g. `links` → "Links" in the filter/sort but "Backlinks" in the display
   *  column; `status` → `filter.category.status` vs `display.property.status`).
   *  When unset, the surface falls back to `label` / `labelKey`. */
  filterLabel?: string
  filterLabelKey?: string
  displayLabel?: string
  displayLabelKey?: string
  groupLabel?: string
  groupLabelKey?: string
  sortLabel?: string
  sortLabelKey?: string

  /** Explicit display-property ordering. The legacy display-properties order
   *  diverges from the filter order (display shows label/tags before folder,
   *  filter shows folder first). Displayables are emitted sorted by
   *  `displayOrder` ascending, falling back to declaration index for ties /
   *  unset — so only the diverging entries need a number. */
  displayOrder?: number
}

/** A display-only column with no executable filter/group/sort axis (e.g. the
 *  Notes "children" relation column). `displayOrder` lets it interleave with
 *  the property-derived display columns at the right position. */
export interface ExtraDisplayProperty extends DisplayProperty {
  displayOrder?: number
}

/** View-level settings that don't reduce to a PropertyDef — preserved verbatim
 *  from the existing `DisplayConfig` residual fields (plan §1, D1/D3). */
export interface ViewDefaults {
  supportedModes?: ViewMode[]
  toggles: DisplayToggle[]
  /** group-only axes (family / role / firstLetter) that have no filter/display
   *  counterpart — appended after the property-derived grouping options. */
  extraGroupings?: GroupingOption[]
  /** display-only columns with no filter/group/sort axis (e.g. "children").
   *  Merged into the display-properties list and sorted by `displayOrder`
   *  alongside the property-derived columns. */
  extraDisplayProperties?: ExtraDisplayProperty[]
  boardDefaultGroupBy?: GroupBy
  defaultGroupByByMode?: Partial<Record<ViewMode, GroupBy>>
  /** Per-mode default sort rule. Matches `DisplayConfig.defaultSortByMode`
   *  (a `SortRule`, not a bare `SortField`). */
  defaultSortByMode?: import("../view-configs").DisplayConfig["defaultSortByMode"]
  supportsSubGrouping?: boolean
  allowFamilyOnBoard?: boolean
}

export interface EntitySchema {
  entity: "notes" | "wiki" | "books"
  properties: PropertyDef[]
  viewDefaults: ViewDefaults
  /** quickFilters stay un-schematized (view-level, plan D1) but travel with the
   *  schema so the adapter can pass them straight through to ViewConfig. */
  quickFilters: QuickFilter[]
}
