import type {
  FilterCategory,
  FilterValue,
  DisplayConfig,
  GroupingOption,
  OrderingOption,
  DisplayProperty,
  ViewConfig,
} from "../view-configs"
import type { GroupBy, SortField } from "../types"
import type {
  EntitySchema,
  PropertyDef,
  PropertyOption,
} from "./property-def"
import type { HydratorMap } from "./hydrators"

/**
 * A3.2 schema engine — adapter (plan §3).
 *
 * Converts a `PropertyDef[]`-driven `EntitySchema` into the existing consumer
 * contract (`FilterCategory[]` / `DisplayConfig` / `ViewConfig`). The output
 * shape is byte-for-byte the same as a hand-written view-config, so the
 * consuming components (FilterPanel / DisplayPanel / notes-table) need zero
 * changes — this is the "config generation inversion, not a rebuild" thesis.
 *
 * Equivalence is proven by `__tests__/adapter-equivalence.test.ts`:
 * `toViewConfig(NOTES_SCHEMA)` ≈ `NOTES_VIEW_CONFIG` (icon fields excluded from
 * the structural compare; see plan D4).
 */

export type { HydratorMap } from "./hydrators"

/** Map a schema PropertyOption → the consumer's FilterValue (drops engine-only
 *  fields, keeps label/labelKey/color/icon/group). `count` is left undefined —
 *  it is populated later by the view's runtime hydrate step, identical to the
 *  current static→hydrate flow. */
function optionToFilterValue(opt: PropertyOption): FilterValue {
  const v: FilterValue = { key: opt.key, label: opt.label }
  if (opt.labelKey !== undefined) v.labelKey = opt.labelKey
  if (opt.color !== undefined) v.color = opt.color
  if (opt.icon !== undefined) v.icon = opt.icon
  if (opt.group !== undefined) v.group = opt.group
  return v
}

/** Resolve a property's filter values:
 *   - enum / boolean   → static option list
 *   - entityRef        → hydrators[key]?.() ?? []  (runtime-injected, plan D5)
 *   - date/numberBucket→ buckets mapped to {key,label,group}
 *   - special          → [] (runtime chip, e.g. connectedTo — no static values)
 */
function resolveFilterValues(prop: PropertyDef, hydrators?: HydratorMap): FilterValue[] {
  if (prop.options) {
    if (prop.options.kind === "static") {
      return prop.options.values.map(optionToFilterValue)
    }
    // dynamic
    const supplied = hydrators?.[prop.options.hydratorKey]
    const opts = supplied ? supplied() : []
    return opts.map(optionToFilterValue)
  }
  if (prop.buckets) {
    return prop.buckets.map((b) => {
      const v: FilterValue = { key: b.key, label: b.label }
      if (b.labelKey !== undefined) v.labelKey = b.labelKey
      if (b.group !== undefined) v.group = b.group
      return v
    })
  }
  return []
}

export function toFilterCategories(
  schema: EntitySchema,
  hydrators?: HydratorMap,
): FilterCategory[] {
  const out: FilterCategory[] = []
  for (const prop of schema.properties) {
    if (!prop.isFilterable) continue
    const labelKey = prop.filterLabelKey ?? prop.labelKey
    const cat: FilterCategory = {
      key: prop.key,
      label: prop.filterLabel ?? prop.label,
      icon: prop.icon,
      values: resolveFilterValues(prop, hydrators),
    }
    if (labelKey !== undefined) cat.labelKey = labelKey
    out.push(cat)
  }
  return out
}

export function toDisplayConfig(schema: EntitySchema): DisplayConfig {
  const { properties, viewDefaults } = schema

  const orderingOptions: OrderingOption[] = properties
    .filter((p) => p.isSortable)
    .map((p) => {
      const labelKey = p.sortLabelKey ?? p.labelKey
      const o: OrderingOption = {
        value: (p.sortField ?? (p.key as unknown as SortField)),
        label: p.sortLabel ?? p.label,
      }
      if (labelKey !== undefined) o.labelKey = labelKey
      if (p.sortModes !== undefined) o.modes = p.sortModes
      return o
    })

  const propertyGroupings: GroupingOption[] = properties
    .filter((p) => p.isGroupable)
    .map((p) => {
      const labelKey = p.groupLabelKey ?? p.labelKey
      const g: GroupingOption = {
        value: (p.groupBy ?? (p.key as unknown as GroupBy)),
        label: p.groupLabel ?? p.label,
      }
      if (labelKey !== undefined) g.labelKey = labelKey
      if (p.groupModes !== undefined) g.modes = p.groupModes
      return g
    })

  const groupingOptions: GroupingOption[] = [
    { value: "none" as GroupBy, label: "No grouping", labelKey: "display.grouping.none" },
    ...propertyGroupings,
    ...(viewDefaults.extraGroupings ?? []),
  ]

  // Display order can diverge from the filter/declaration order — build a
  // combined list of property-derived columns + display-only extras
  // ("children" etc.), each tagged with an order key, then sort. Order key =
  // explicit `displayOrder` when set, else a stable declaration index. Ties
  // fall back to declaration index so the sort stays deterministic.
  type OrderedDisplay = { d: DisplayProperty; order: number; seq: number }
  const collected: OrderedDisplay[] = []
  let seq = 0

  properties.forEach((p, i) => {
    if (!p.isDisplayable) return
    const labelKey = p.displayLabelKey ?? p.labelKey
    const d: DisplayProperty = {
      key: p.columnKey ?? p.key,
      label: p.displayLabel ?? p.label,
    }
    if (labelKey !== undefined) d.labelKey = labelKey
    if (p.icon !== undefined) d.icon = p.icon
    if (p.displayModes !== undefined) d.modes = p.displayModes
    collected.push({ d, order: p.displayOrder ?? i, seq: seq++ })
  })

  for (const extra of viewDefaults.extraDisplayProperties ?? []) {
    const { displayOrder, ...rest } = extra
    collected.push({ d: rest, order: displayOrder ?? seq, seq: seq++ })
  }

  collected.sort((a, b) => (a.order !== b.order ? a.order - b.order : a.seq - b.seq))
  const displayProperties: DisplayProperty[] = collected.map((c) => c.d)

  const config: DisplayConfig = {
    orderingOptions,
    groupingOptions,
    toggles: viewDefaults.toggles,
    properties: displayProperties,
  }
  if (viewDefaults.supportedModes !== undefined) config.supportedModes = viewDefaults.supportedModes
  if (viewDefaults.boardDefaultGroupBy !== undefined) config.boardDefaultGroupBy = viewDefaults.boardDefaultGroupBy
  if (viewDefaults.allowFamilyOnBoard !== undefined) config.allowFamilyOnBoard = viewDefaults.allowFamilyOnBoard
  if (viewDefaults.supportsSubGrouping !== undefined) config.supportsSubGrouping = viewDefaults.supportsSubGrouping
  if (viewDefaults.defaultGroupByByMode !== undefined) config.defaultGroupByByMode = viewDefaults.defaultGroupByByMode
  if (viewDefaults.defaultSortByMode !== undefined) config.defaultSortByMode = viewDefaults.defaultSortByMode
  return config
}

export function toViewConfig(
  schema: EntitySchema,
  hydrators?: HydratorMap,
): ViewConfig {
  return {
    showFilter: true,
    showDisplay: true,
    showDetailPanel: true,
    filterCategories: toFilterCategories(schema, hydrators),
    quickFilters: schema.quickFilters,
    displayConfig: toDisplayConfig(schema),
  }
}
