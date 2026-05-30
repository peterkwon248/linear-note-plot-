import type { EntitySchema, PropertyDef } from "../property-def"
import type { QuickFilter } from "../../view-configs"
import {
  StatusIcon,
  PriorityIcon,
  FolderIcon,
  LabelIcon,
  TagIcon,
  SourceIcon,
  CalendarIcon,
  LinkIcon,
  ContentIcon,
  PinIcon,
  ParentIcon,
  ChildrenIcon,
  WikiIcon,
  TrashIcon,
  StatusBacklogIcon,
  StatusTodoIcon,
  StatusInProgressIcon,
  StatusDoneIcon,
  SourceManualIcon,
  SourceWebclipIcon,
  SourceImportIcon,
} from "../icons"
import { NOTE_STATUS_HEX } from "@/lib/colors"

/**
 * A3.2 — Notes EntitySchema (plan §2-A). Single source for the Notes
 * filter / display / group / sort surfaces.
 *
 * INVARIANT (M1): `toViewConfig(NOTES_SCHEMA)` is structurally equivalent to the
 * live `NOTES_VIEW_CONFIG` in `view-configs.tsx` — proven by
 * `__tests__/adapter-equivalence.test.ts` (icon fields excluded, plan D4).
 * Until M2 swaps the export, both coexist as parallel truths, so every static
 * value / label / labelKey / modes below mirrors the current hand-written
 * config exactly.
 *
 * Ordering is load-bearing. ONE property list drives four differently-ordered
 * surfaces. A3.3-E1: the declaration order is now the 6-CATEGORY CLUSTER order
 * (workflow → classification → relations → metrics → time → content), which is
 * what the FILTER surface renders (with the upcoming category dividers). The
 * other three surfaces keep their previous order, pinned against this new array
 * order via explicit `*Order` hints:
 *   - filter order  (isFilterable, = cluster/declaration order):
 *     status, pinned, folder, label, tags, source, links, wikiRegistered,
 *     updatedAt, content,
 *   - sort order    diverges from the cluster order → pinned via `sortOrder`
 *     (updatedAt 0, createdAt 1, title 2, links 3, wordCount/reads 4),
 *   - group order   = `isGroupable` props in their natural cluster order
 *     (status, folder, label, parent — already monotonic across the clusters,
 *     so no `groupOrder` needed) then the group-only `extraGroupings`
 *     (role, family, date, firstLetter),
 *   - display order diverges (label/tags before folder) and is reproduced via
 *     explicit `displayOrder` hints (unchanged from before).
 *
 * Several concepts carry different chrome text per surface — encoded with the
 * per-surface `*Label` / `*LabelKey` overrides (e.g. `links` = "Links" in
 * filter/sort but "Backlinks" in the display column; `updatedAt` = "Dates"
 * filter category but "Updated" sort/display).
 */

const PROPERTIES: PropertyDef[] = [
  /* ── workflow cluster (status, priority, pinned) ───────────── */

  /* status — filter / display / group (not sortable). */
  {
    key: "status",
    category: "workflow",
    label: "Status",
    icon: StatusIcon,
    valueType: "enum",
    isFilterable: true,
    isDisplayable: true,
    isGroupable: true,
    filterLabelKey: "filter.category.status",
    displayLabelKey: "display.property.status",
    groupLabelKey: "display.property.status",
    displayOrder: 0,
    groupModes: ["list", "board", "grid"],
    options: {
      kind: "static",
      values: [
        { key: "backlog", label: "Backlog", labelKey: "status.backlog", color: NOTE_STATUS_HEX.backlog, icon: StatusBacklogIcon },
        { key: "todo", label: "Todo", labelKey: "status.todo", color: NOTE_STATUS_HEX.todo, icon: StatusTodoIcon },
        { key: "in_progress", label: "In Progress", labelKey: "status.in_progress", color: NOTE_STATUS_HEX.in_progress, icon: StatusInProgressIcon },
        { key: "done", label: "Done", labelKey: "status.done", color: NOTE_STATUS_HEX.done, icon: StatusDoneIcon },
      ],
    },
  },

  /* priority — board-only display badge. */
  {
    key: "priority",
    category: "workflow",
    label: "Priority",
    icon: PriorityIcon,
    valueType: "enum",
    isDisplayable: true,
    displayOrder: 1,
    displayModes: ["board"],
  },

  /* pinned — filter only. */
  {
    key: "pinned",
    category: "workflow",
    label: "Pinned",
    labelKey: "filter.category.pinned",
    icon: PinIcon,
    valueType: "boolean",
    isFilterable: true,
    options: {
      kind: "static",
      values: [
        { key: "true", label: "Pinned" },
        { key: "false", label: "Not pinned" },
      ],
    },
  },

  /* ── classification cluster (folder, label, tags, source) ──── */

  /* folder — filter / display / group. */
  {
    key: "folder",
    category: "classification",
    label: "Folder",
    icon: FolderIcon,
    valueType: "entityRef",
    isFilterable: true,
    isDisplayable: true,
    isGroupable: true,
    filterLabelKey: "filter.category.folder",
    displayLabelKey: "display.property.folder",
    groupLabelKey: "display.property.folder",
    displayOrder: 4,
    groupModes: ["list", "board", "grid"],
    options: { kind: "dynamic", hydratorKey: "folder" },
  },

  /* label — filter / board-display / group. */
  {
    key: "label",
    category: "classification",
    label: "Label",
    labelKey: "filter.category.label",
    icon: LabelIcon,
    valueType: "entityRef",
    isFilterable: true,
    isDisplayable: true,
    isGroupable: true,
    displayOrder: 2,
    displayModes: ["board"],
    groupModes: ["list", "board", "grid"],
    options: { kind: "dynamic", hydratorKey: "label" },
  },

  /* tags — filter / board-display. */
  {
    key: "tags",
    category: "classification",
    label: "Tags",
    labelKey: "filter.category.tags",
    icon: TagIcon,
    valueType: "entityRef",
    isFilterable: true,
    isDisplayable: true,
    displayOrder: 3,
    displayModes: ["board"],
    options: { kind: "dynamic", hydratorKey: "tag" },
  },

  /* source — filter only. */
  {
    key: "source",
    category: "classification",
    label: "Source",
    labelKey: "filter.category.source",
    icon: SourceIcon,
    valueType: "enum",
    isFilterable: true,
    options: {
      kind: "static",
      values: [
        { key: "manual", label: "Manual", icon: SourceManualIcon },
        { key: "webclip", label: "Web Clip", icon: SourceWebclipIcon },
        { key: "import", label: "Import", icon: SourceImportIcon },
      ],
    },
  },

  /* ── relations cluster (parent, links, wikiRegistered) ─────── */

  /* parent — display / group (family-distinct relation). */
  {
    key: "parent",
    category: "relations",
    label: "Parent",
    labelKey: "display.property.parent",
    icon: ParentIcon,
    valueType: "special",
    isDisplayable: true,
    isGroupable: true,
    displayOrder: 5,
    groupModes: ["list", "board", "grid"],
  },

  /* links — filter ("Links" buckets) / sort ("Links") / display ("Backlinks").
   *    sortOrder 3 keeps the sort dropdown order (updated/created/name/links/
   *    word-count) despite links now preceding the dates in the array. */
  {
    key: "links",
    category: "relations",
    label: "Links",
    labelKey: "filter.category.links",
    icon: LinkIcon,
    valueType: "numberBucket",
    isFilterable: true,
    isSortable: true,
    isDisplayable: true,
    displayLabel: "Backlinks",
    displayLabelKey: "display.property.backlinks",
    displayOrder: 7,
    sortOrder: 3,
    buckets: [
      { key: "_any", label: "Has links", operator: "gt", value: "0" },
      { key: "backlinks", label: "Has backlinks", operator: "gt", value: "0" },
      { key: "_none", label: "No outbound", operator: "eq", value: "0" },
      { key: "_orphan", label: "True orphans (no in/out)", operator: "eq", value: "0" },
    ],
  },

  /* wikiRegistered — filter only (note ↔ wiki membership). */
  {
    key: "wikiRegistered",
    category: "relations",
    label: "Wiki",
    labelKey: "filter.category.wiki",
    icon: WikiIcon,
    valueType: "boolean",
    isFilterable: true,
    options: {
      kind: "static",
      values: [
        { key: "true", label: "In a wiki article", labelKey: "filter.value.wiki.in" },
        { key: "false", label: "Not in any wiki article", labelKey: "filter.value.wiki.not_in" },
      ],
    },
  },

  /* ── metrics cluster (wordCount) ───────────────────────────── */

  /* wordCount — display column "Words"; sorts via SortField "reads"
   *     ("Word count"). One concept, two legacy keys reconciled by sortField.
   *     sortOrder 4 = last in the sort dropdown (unchanged). */
  {
    key: "wordCount",
    category: "metrics",
    label: "Words",
    labelKey: "display.property.words",
    icon: ContentIcon,
    valueType: "numberBucket",
    isSortable: true,
    isDisplayable: true,
    sortField: "reads",
    sortLabel: "Word count",
    columnKey: "wordCount",
    displayOrder: 8,
    sortOrder: 4,
  },

  /* ── time cluster (updatedAt, createdAt) ───────────────────── */

  /* updatedAt — filter ("Dates") / sort ("Updated") / display ("Updated").
   *    sortOrder 0 = first in the sort dropdown.
   *    (children is a display-only column with no executable axis → it lives in
   *    viewDefaults.extraDisplayProperties, not here.) */
  {
    key: "updatedAt",
    category: "time",
    label: "Updated",
    icon: CalendarIcon,
    valueType: "dateBucket",
    isFilterable: true,
    isSortable: true,
    isDisplayable: true,
    filterLabel: "Dates",
    filterLabelKey: "filter.category.dates",
    sortLabelKey: "display.ordering.updated",
    displayLabelKey: "display.property.updated",
    displayOrder: 9,
    sortOrder: 0,
    displayModes: ["list", "board", "timeline"],
    buckets: [
      { key: "today", label: "Today", operator: "eq", value: "today" },
      { key: "yesterday", label: "Yesterday", operator: "eq", value: "yesterday" },
      { key: "this-week", label: "This week", operator: "eq", value: "this-week" },
      { key: "last-7-days", label: "Last 7 days", operator: "eq", value: "last-7-days" },
      { key: "this-month", label: "This month", operator: "eq", value: "this-month" },
      { key: "last-30-days", label: "Last 30 days", operator: "eq", value: "last-30-days" },
      { key: "stale", label: "Stale (30+ days)", operator: "lt", value: "stale" },
    ],
  },

  /* createdAt — sort ("Created") / display ("Created"). sortOrder 1. */
  {
    key: "createdAt",
    category: "time",
    label: "Created",
    icon: CalendarIcon,
    valueType: "dateBucket",
    isSortable: true,
    isDisplayable: true,
    sortLabelKey: "display.ordering.created",
    displayLabelKey: "display.property.created",
    displayOrder: 10,
    sortOrder: 1,
    displayModes: ["list", "board", "timeline"],
  },

  /* ── content cluster (title, content) ──────────────────────── */

  /* title — sort ("Name") only. sortOrder 2. */
  {
    key: "title",
    category: "content",
    label: "Name",
    labelKey: "display.ordering.title",
    icon: ContentIcon,
    valueType: "special",
    isSortable: true,
    sortOrder: 2,
  },

  /* content — filter only (has image / code / table). */
  {
    key: "content",
    category: "content",
    label: "Content",
    labelKey: "filter.category.content",
    icon: ContentIcon,
    valueType: "enum",
    isFilterable: true,
    options: {
      kind: "static",
      values: [
        { key: "hasImage", label: "Has images" },
        { key: "hasCode", label: "Has code blocks" },
        { key: "hasTable", label: "Has tables" },
      ],
    },
  },
]

const QUICK_FILTERS: QuickFilter[] = [
  { label: "Needs attention", labelKey: "filter.quick.needs_attention", desc: "stale + unlinked", descKey: "filter.quick.needs_attention_desc", rules: [
    { field: "updatedAt", operator: "lt", value: "stale" },
    { field: "links", operator: "eq", value: "_none" },
  ]},
  { label: "Active work", labelKey: "filter.quick.active_work", desc: "updated < 7d", descKey: "filter.quick.active_work_desc", rules: [
    { field: "updatedAt", operator: "eq", value: "this-week" },
  ]},
  { label: "Unlinked", labelKey: "filter.quick.unlinked", desc: "no outbound links", descKey: "filter.quick.unlinked_desc", rules: [
    { field: "links", operator: "eq", value: "_none" },
  ]},
  { label: "True orphans", labelKey: "filter.quick.true_orphans", desc: "no in/out links", descKey: "filter.quick.true_orphans_desc", rules: [
    { field: "links", operator: "eq", value: "_orphan" },
  ]},
  { label: "In a wiki article", labelKey: "filter.quick.wiki_registered", desc: "embedded inside a wiki article", descKey: "filter.quick.wiki_registered_desc", rules: [
    { field: "wikiRegistered", operator: "eq", value: "true" },
  ]},
]

export const NOTES_SCHEMA: EntitySchema = {
  entity: "notes",
  properties: PROPERTIES,
  quickFilters: QUICK_FILTERS,
  viewDefaults: {
    supportedModes: ["list", "board", "grid", "timeline"],
    supportsSubGrouping: true,
    defaultGroupByByMode: { board: "status", timeline: "status", grid: "none" },
    defaultSortByMode: { timeline: { field: "createdAt", direction: "asc" } },
    // Group-only axes, appended after property-derived groupings (status,
    // folder, label, parent) → reproduces the legacy grouping order:
    // none, status, folder, label, parent, role, family, date, firstLetter.
    extraGroupings: [
      { value: "role", label: "Role", modes: ["list", "board", "grid"] },
      { value: "family", label: "Family", modes: ["list"] },
      { value: "date", label: "Updated", labelKey: "display.ordering.updated", modes: ["list", "board", "grid"] },
      { value: "firstLetter", label: "Index", modes: ["list"] },
    ],
    // Display-only column with no filter/group/sort axis. displayOrder 6 slots
    // it between parent(5) and links/Backlinks(7), matching the legacy order.
    extraDisplayProperties: [
      { key: "children", label: "Children", labelKey: "display.property.children", icon: ChildrenIcon, displayOrder: 6 },
    ],
    toggles: [
      { key: "showTrashed", label: "Show trashed", labelKey: "display.show_trashed", icon: TrashIcon },
      { key: "filterAwareRole", label: "Role from filtered view" },
    ],
  },
}
