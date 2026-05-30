import type { EntitySchema, PropertyDef } from "../property-def"
import type { QuickFilter } from "../../view-configs"
import {
  SortIcon,
  SourceIcon,
  CalendarIcon,
  PinIcon,
  FolderIcon,
  TagIcon,
  LabelIcon,
  BookKindSmartIcon,
  BookKindManualIcon,
  BookKindHybridIcon,
  SourceStickerIcon,
} from "../icons"

/**
 * A3.2 / M4 — Books EntitySchema (plan §2-C, D2). Single source for the Books
 * filter / display / group / sort surfaces.
 *
 * INVARIANT (M4): `toViewConfig(BOOKS_SCHEMA)` is structurally equivalent to the
 * live `BOOKS_VIEW_CONFIG` in `view-configs.tsx` — proven by
 * `__tests__/adapter-equivalence.test.ts` (icon fields excluded, plan D4).
 * Every static value / label / labelKey / modes below mirrors the current
 * hand-written config exactly, so the M4 export swap is a no-op at runtime.
 *
 * Note on plan §2-C vs. reality: the plan's "D2 = Kind + Priority" mapping table
 * also lists a `priority` axis, but the *live* `BOOKS_VIEW_CONFIG` ships no
 * priority filter / display / group / sort surface today. Per the task's
 * "actual BOOKS_VIEW_CONFIG value is the top-priority source" rule, this schema
 * reproduces the live config (no priority) so equivalence holds. Adding priority
 * is a separate, behaviour-changing follow-up — out of scope for M4.
 *
 * Books has no `status` axis, so `kind` (Smart / Manual / Hybrid) is the
 * board/grouping spine (boardDefaultGroupBy = "kind", entity-uniformity rule 21).
 *
 * Ordering is load-bearing — ONE property list drives four differently-ordered
 * surfaces. The single declaration order below
 * (kind → sourceType → pinned → updatedAt → createdAt → title → itemCount)
 * was chosen so the per-facet `.filter()` projections reproduce the legacy order
 * on every surface:
 *   - filter order  (isFilterable): kind, sourceType, pinned, updatedAt
 *   - sort order    (isSortable):   updatedAt, createdAt, title, itemCount
 *   - group order   (isGroupable):  kind, pinned  (+ extraGroupings date,
 *     firstLetter appended)
 *   - display order (isDisplayable): itemCount, kind, sources, pinned — this one
 *     diverges from declaration order, reproduced via explicit `displayOrder`
 *     (itemCount 0, kind 1, sources-extra 2, pinned 3).
 *
 * "sources" is a display-only column whose key is NOT a FilterField/GroupBy/
 * SortField member, so per plan D-final it lives in
 * `viewDefaults.extraDisplayProperties`, not as a PropertyDef.
 */

const PROPERTIES: PropertyDef[] = [
  /* 1. kind — filter / display / group. Smart / Manual / Hybrid. The Books
   *    board + grouping spine (no status axis on Books). */
  {
    key: "kind",
    category: "workflow",
    label: "Kind",
    icon: SortIcon,
    valueType: "enum",
    isFilterable: true,
    isDisplayable: true,
    isGroupable: true,
    // Display + group surfaces carry the i18n key; the filter category label is
    // the bare "Kind" string in the legacy config (no labelKey there).
    displayLabelKey: "books.prop.kind",
    groupLabelKey: "books.prop.kind",
    displayOrder: 1,
    displayIcon: SourceIcon, // display column uses SourceIcon, filter row SortIcon
    options: {
      kind: "static",
      values: [
        { key: "smart", label: "Smart", icon: BookKindSmartIcon },
        { key: "manual", label: "Manual", icon: BookKindManualIcon },
        { key: "hybrid", label: "Hybrid", icon: BookKindHybridIcon },
      ],
    },
  },

  /* 2. sourceType — filter only. Which smart source(s) are configured;
   *    "_none" surfaces pure-manual books. */
  {
    key: "sourceType",
    category: "classification",
    label: "Smart source",
    icon: SourceIcon,
    valueType: "enum",
    isFilterable: true,
    options: {
      kind: "static",
      values: [
        { key: "folder", label: "Folder", icon: FolderIcon },
        { key: "category", label: "Wiki Category", icon: TagIcon },
        { key: "tag", label: "Tag", icon: TagIcon },
        { key: "label", label: "Label", icon: LabelIcon },
        { key: "sticker", label: "Sticker", icon: SourceStickerIcon },
        { key: "_none", label: "No smart source" },
      ],
    },
  },

  /* 3. pinned — filter / display / group. */
  {
    key: "pinned",
    category: "workflow",
    label: "Pin",
    icon: PinIcon,
    valueType: "boolean",
    isFilterable: true,
    isDisplayable: true,
    isGroupable: true,
    // Per-surface labels: filter "Pin", group "Pin status", display "Pin".
    groupLabel: "Pin status",
    groupLabelKey: "books.group.pin_status",
    displayLabelKey: "books.prop.pin",
    displayOrder: 3,
    options: {
      kind: "static",
      values: [
        { key: "true", label: "Pinned" },
        { key: "false", label: "Not pinned" },
      ],
    },
  },

  /* 4. updatedAt — filter ("Updated") / sort ("Updated") / group (via "date").
   *    The grouping facet is provided by the group-only "date" axis in
   *    extraGroupings (GroupBy has no "updatedAt" member), so this prop is not
   *    marked isGroupable. */
  {
    key: "updatedAt",
    category: "time",
    label: "Updated",
    icon: CalendarIcon,
    valueType: "dateBucket",
    isFilterable: true,
    isSortable: true,
    sortLabelKey: "display.ordering.updated",
    buckets: [
      { key: "today", label: "Today", operator: "eq", value: "today" },
      { key: "yesterday", label: "Yesterday", operator: "eq", value: "yesterday" },
      { key: "this-week", label: "This week", operator: "eq", value: "this-week" },
      { key: "last-7-days", label: "Last 7 days", operator: "eq", value: "last-7-days" },
      { key: "this-month", label: "This month", operator: "eq", value: "this-month" },
      { key: "last-30-days", label: "Last 30 days", operator: "eq", value: "last-30-days" },
    ],
  },

  /* 5. createdAt — sort ("Created") only. */
  {
    key: "createdAt",
    category: "time",
    label: "Created",
    icon: CalendarIcon,
    valueType: "dateBucket",
    isSortable: true,
    sortLabelKey: "display.ordering.created",
  },

  /* 6. title — sort ("Title") only. */
  {
    key: "title",
    category: "content",
    label: "Title",
    labelKey: "display.ordering.title",
    icon: SortIcon,
    valueType: "special",
    isSortable: true,
  },

  /* 7. itemCount — sort ("Item count") / display ("Item count"). Book.items.length. */
  {
    key: "itemCount",
    category: "metrics",
    label: "Item count",
    labelKey: "books.prop.item_count",
    icon: SortIcon,
    valueType: "numberBucket",
    isSortable: true,
    isDisplayable: true,
    displayOrder: 0,
  },
]

const QUICK_FILTERS: QuickFilter[] = [
  { label: "Pinned", labelKey: "filter.quick.pinned_books", desc: "pinned books only", descKey: "filter.quick.pinned_books_desc", rules: [
    { field: "pinned", operator: "eq", value: "true" },
  ]},
  { label: "Active", labelKey: "filter.quick.active_books", desc: "updated this week", descKey: "filter.quick.active_books_desc", rules: [
    { field: "updatedAt", operator: "eq", value: "this-week" },
  ]},
  { label: "Smart", labelKey: "filter.quick.smart_books", desc: "auto-curated books", descKey: "filter.quick.smart_books_desc", rules: [
    { field: "kind", operator: "eq", value: "smart" },
  ]},
]

export const BOOKS_SCHEMA: EntitySchema = {
  entity: "books",
  properties: PROPERTIES,
  quickFilters: QUICK_FILTERS,
  viewDefaults: {
    // Books has no detail panel — Books config sets showDetailPanel:false.
    showDetailPanel: false,
    supportedModes: ["grid", "list", "board", "timeline"],
    // Board/timeline spine = "kind" (Smart / Hybrid / Manual) — 3 fixed columns.
    boardDefaultGroupBy: "kind",
    defaultGroupByByMode: { board: "kind", timeline: "kind" },
    defaultSortByMode: { timeline: { field: "createdAt", direction: "asc" } },
    // Group-only axes appended after the property-derived groupings (kind,
    // pinned) → reproduces the legacy order: none, kind, pinned, date, firstLetter.
    extraGroupings: [
      { value: "date", label: "Updated", labelKey: "display.ordering.updated", modes: ["list", "board"] },
      { value: "firstLetter", label: "Index", modes: ["list"] },
    ],
    // Display-only column (key "sources" is not an executable axis). displayOrder
    // 2 slots it between kind(1) and pinned(3), matching the legacy order
    // itemCount, kind, sources, pinned.
    extraDisplayProperties: [
      { key: "sources", label: "Smart sources", labelKey: "books.prop.smart_sources", icon: SourceIcon, displayOrder: 2 },
    ],
    toggles: [],
  },
}
