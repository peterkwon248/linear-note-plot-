import type { EntitySchema, PropertyDef } from "../property-def"
import type { QuickFilter } from "../../view-configs"
import {
  StatusIcon,
  TagIcon,
  LinkIcon,
  CalendarIcon,
  ContentIcon,
  ParentIcon,
  ChildrenIcon,
  GraphIcon,
  EyeIcon,
  CircleHalfIcon,
  StatusBacklogIcon,
  StatusTodoIcon,
  StatusInProgressIcon,
  StatusDoneIcon,
} from "../icons"
import { NOTE_STATUS_HEX } from "@/lib/colors"

/**
 * A3.2 / M3 — Wiki EntitySchema (plan §2-B, D2). Single source for the Wiki
 * filter / display / group / sort surfaces.
 *
 * INVARIANT (M3): `toViewConfig(WIKI_SCHEMA)` is structurally equivalent to the
 * live `WIKI_VIEW_CONFIG` in `view-configs.tsx` — proven by
 * `__tests__/adapter-equivalence.test.ts` (icon fields excluded, plan D4).
 * Every static value / label / labelKey / modes below mirrors the current
 * hand-written config exactly, so the M3 export swap is a no-op at runtime.
 *
 * Note on plan §2-B vs. reality: the plan's "D2 = Wiki priority ✅" mapping table
 * lists a `priority` axis, but the *live* `WIKI_VIEW_CONFIG` ships no priority
 * filter / display / group / sort surface today (priority has no meaning on
 * wiki articles yet). Per the task's "actual WIKI_VIEW_CONFIG value is the
 * top-priority source" rule, this schema reproduces the live config (no
 * priority) so equivalence holds. Adding priority is a separate,
 * behaviour-changing follow-up — out of scope for M3.
 *
 * Wiki shares the Notes 4-stage `status` axis (v151) but uses a DIFFERENT
 * GroupBy member for it: `wikiStatus` (the wiki-list pipeline reads
 * `article.status` under that key, keeping the fixed 4-column board). So the
 * `status` property's `groupBy` is overridden to `wikiStatus`.
 *
 * Ordering is load-bearing — ONE property list drives four differently-ordered
 * surfaces, and all four orders diverge from each other. A3.3-E1: the
 * declaration order is now the 6-CATEGORY CLUSTER order (workflow →
 * classification → relations → metrics → time → content), which is the FILTER
 * order; because EVERY sortable/groupable/displayable prop already carries an
 * explicit `sortOrder`/`groupOrder`/`displayOrder`, the other three surfaces are
 * unaffected by this re-clustering (the declaration-index fallback is never used
 * for them):
 *   - filter order  (isFilterable, = cluster/declaration order):
 *     status, category, links, wikiTier, updatedAt, createdAt, title
 *     (wikiTier moved up into the relations cluster — the one visible change)
 *   - sort order    (isSortable):    updatedAt, createdAt, title, links, reads,
 *     status                                (via `sortOrder`)
 *   - group order   (isGroupable):   wikiStatus, tier, linkCount, parent
 *     (via `groupOrder`), then extraGroupings role, label, family, date,
 *     firstLetter
 *   - display order (isDisplayable): status, links, reads, tags, aliases,
 *     parent, children, createdAt, updatedAt (via `displayOrder`, with the
 *     display-only tags/aliases/children supplied as extraDisplayProperties)
 *
 * Per-surface chrome text/icons that differ from the base:
 *   - `status`  → display column uses `CircleHalfIcon` (filter row = StatusIcon),
 *     and the filter category carries `filter.category.status` (display/group/
 *     sort stay the bare "Status" label with no labelKey).
 *   - `links`   → "Backlinks" in filter + display, "Most linked" in sort.
 *   - `title`   → "Aliases" in the filter, "Name" in the sort.
 *   - `wikiTier`→ "Hierarchy" filter category, "Tier" grouping option.
 *   - `reads`   → "Most read" in sort, "Reads" in the display column.
 *
 * Several display columns (tags = "Categories", aliases, children) and the
 * group-only axes (role, family, date, firstLetter) have no executable axis
 * under their own key, so per plan D-final they live in
 * `viewDefaults.extraDisplayProperties` / `extraGroupings` rather than as
 * PropertyDefs.
 */

const PROPERTIES: PropertyDef[] = [
  /* 1. status — filter ("Status") / display ("Status") / group (→wikiStatus,
   *    "Status") / sort ("Status"). v151 manual 4-stage, shared with Notes
   *    (NOTE_STATUS_HEX + status.* i18n). Filter row uses the StatusIcon chrome
   *    glyph; the display chip uses CircleHalfIcon (displayIcon). */
  {
    key: "status",
    category: "workflow",
    label: "Status",
    icon: StatusIcon,
    valueType: "enum",
    isFilterable: true,
    isDisplayable: true,
    isGroupable: true,
    isSortable: true,
    filterLabelKey: "filter.category.status",
    displayIcon: CircleHalfIcon,
    groupBy: "wikiStatus",
    displayOrder: 0,
    sortOrder: 5,
    groupOrder: 0,
    groupModes: ["list", "board"],
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

  /* 2. category — filter only ("Category"). WikiCategory entity; values are
   *    hydrated at runtime in wiki-view.tsx (cat.key === "category"). */
  {
    key: "category",
    category: "classification",
    label: "Category",
    icon: TagIcon,
    valueType: "entityRef",
    isFilterable: true,
    options: { kind: "dynamic", hydratorKey: "category" },
  },

  /* 3. links — filter ("Backlinks") / display ("Backlinks") / group
   *    (→linkCount, "Link count") / sort ("Most linked"). */
  {
    key: "links",
    category: "relations",
    label: "Backlinks",
    icon: LinkIcon,
    valueType: "numberBucket",
    isFilterable: true,
    isDisplayable: true,
    isGroupable: true,
    isSortable: true,
    sortLabel: "Most linked",
    groupBy: "linkCount",
    groupLabel: "Link count",
    displayOrder: 1,
    sortOrder: 3,
    groupOrder: 2,
    groupModes: ["list", "board"],
    buckets: [
      { key: "_any", label: "Has backlinks", operator: "gt", value: "0" },
      { key: "5+", label: "5+ backlinks", operator: "gt", value: "5" },
      { key: "10+", label: "10+ backlinks", operator: "gt", value: "10" },
      { key: "_none", label: "No backlinks", operator: "eq", value: "0" },
      { key: "_orphan", label: "True orphans (no in/out)", operator: "eq", value: "0" },
    ],
  },

  /* 4. wikiTier — filter ("Hierarchy", 4-stage role) / group (→tier, "Tier").
   *    classifyWikiArticleRole-consistent. Clustered into relations (was last in
   *    the legacy filter order); the explicit groupOrder 1 preserves its grouping
   *    slot regardless of array position. */
  {
    key: "wikiTier",
    category: "relations",
    label: "Hierarchy",
    icon: GraphIcon,
    valueType: "enum",
    isFilterable: true,
    isGroupable: true,
    groupBy: "tier",
    groupLabel: "Tier",
    groupOrder: 1,
    groupModes: ["list", "board"],
    options: {
      kind: "static",
      values: [
        { key: "_root", label: "Root (has children)" },
        { key: "_parent", label: "Parent (both)" },
        { key: "_child", label: "Child (no children)" },
        { key: "_solo", label: "Solo (isolated)" },
      ],
    },
  },

  /* 5. parent — display ("Parent") / group ("Parent article"). Non-filterable
   *    family-distinct relation (key is a GroupBy/SortField member). */
  {
    key: "parent",
    category: "relations",
    label: "Parent",
    icon: ParentIcon,
    valueType: "special",
    isDisplayable: true,
    isGroupable: true,
    groupLabel: "Parent article",
    displayOrder: 5,
    groupOrder: 3,
    groupModes: ["list", "board"],
  },

  /* 6. reads — sort ("Most read") / display ("Reads"). Non-filterable
   *    (metrics cluster). */
  {
    key: "reads",
    category: "metrics",
    label: "Reads",
    icon: EyeIcon,
    valueType: "numberBucket",
    isSortable: true,
    isDisplayable: true,
    sortLabel: "Most read",
    displayOrder: 2,
    sortOrder: 4,
  },

  /* 7. updatedAt — filter ("Updated") / sort ("Updated") / display ("Updated").
   *    Grouping is the group-only "date" axis (extraGroupings) since GroupBy has
   *    no "updatedAt" member, so this prop is not isGroupable. */
  {
    key: "updatedAt",
    category: "time",
    label: "Updated",
    icon: CalendarIcon,
    valueType: "dateBucket",
    isFilterable: true,
    isSortable: true,
    isDisplayable: true,
    displayOrder: 8,
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

  /* 8. createdAt — filter ("Created", 3 buckets) / sort ("Created") / display
   *    ("Created"). */
  {
    key: "createdAt",
    category: "time",
    label: "Created",
    icon: CalendarIcon,
    valueType: "dateBucket",
    isFilterable: true,
    isSortable: true,
    isDisplayable: true,
    displayOrder: 7,
    sortOrder: 1,
    displayModes: ["list", "board", "timeline"],
    buckets: [
      { key: "today", label: "Today", operator: "eq", value: "today" },
      { key: "this-week", label: "This week", operator: "eq", value: "this-week" },
      { key: "this-month", label: "This month", operator: "eq", value: "this-month" },
    ],
  },

  /* 9. title — filter ("Aliases", aliased/unaliased) / sort ("Name"). */
  {
    key: "title",
    category: "content",
    label: "Aliases",
    icon: ContentIcon,
    valueType: "special",
    isFilterable: true,
    isSortable: true,
    sortLabel: "Name",
    sortOrder: 2,
    options: {
      kind: "static",
      values: [
        { key: "_aliased", label: "Has aliases" },
        { key: "_unaliased", label: "No aliases" },
      ],
    },
  },
]

const QUICK_FILTERS: QuickFilter[] = [
  { label: "Stale articles", labelKey: "filter.quick.stale_articles", desc: "30+ days no update", descKey: "filter.quick.stale_articles_desc", rules: [
    { field: "updatedAt", operator: "lt", value: "stale" },
  ]},
  { label: "Orphans", labelKey: "filter.quick.orphans", desc: "no backlinks", descKey: "filter.quick.orphans_desc", rules: [
    { field: "links", operator: "eq", value: "_none" },
  ]},
  { label: "Hubs", labelKey: "filter.quick.hubs", desc: "10+ backlinks", descKey: "filter.quick.hubs_desc", rules: [
    { field: "links", operator: "eq", value: "10+" },
  ]},
  { label: "With aliases", labelKey: "filter.quick.aliased_articles", desc: "articles with aliases", descKey: "filter.quick.aliased_articles_desc", rules: [
    { field: "title", operator: "eq", value: "_aliased" },
  ]},
  { label: "Recent", labelKey: "filter.quick.recent_articles", desc: "created this week", descKey: "filter.quick.recent_articles_desc", rules: [
    { field: "createdAt", operator: "eq", value: "this-week" },
  ]},
]

export const WIKI_SCHEMA: EntitySchema = {
  entity: "wiki",
  properties: PROPERTIES,
  quickFilters: QUICK_FILTERS,
  viewDefaults: {
    supportedModes: ["list", "board", "grid", "timeline"],
    // Wiki board default = "wikiStatus" — 4 fixed columns (backlog/todo/
    // in_progress/done), Notes status board pattern mirror (rule 21).
    boardDefaultGroupBy: "wikiStatus",
    // L4: per-mode default groupBy. Timeline default = wikiStatus (status lanes
    // on the time axis). Grid = flat card grid → none.
    defaultGroupByByMode: { board: "wikiStatus", timeline: "wikiStatus", grid: "none" },
    // L4: timeline Y-axis encodes time → sort by createdAt asc is canonical.
    defaultSortByMode: { timeline: { field: "createdAt", direction: "asc" } },
    // The legacy Wiki "No grouping" option carried NO labelKey (unlike Notes/
    // Books). Suppress the adapter's default so the rendered text stays the bare
    // "No grouping" under every locale (runtime-identical to the old config).
    noneGroupingLabelKey: null,
    // Group-only axes appended after the property-derived groupings (wikiStatus,
    // tier, linkCount, parent) → reproduces the legacy grouping order: none,
    // wikiStatus, tier, linkCount, parent, role, label, family, date, firstLetter.
    extraGroupings: [
      { value: "role", label: "Role", modes: ["list", "board"] },
      { value: "label", label: "Category", modes: ["list", "board"] },
      { value: "family", label: "Family", modes: ["list"] },
      { value: "date", label: "Updated", modes: ["list", "board"] },
      { value: "firstLetter", label: "Index", modes: ["list"] },
    ],
    // Display-only columns whose key is not an executable axis (tags="Categories"
    // ≠ the "category" filter key; aliases; children). displayOrder interleaves
    // them: status(0), links(1), reads(2), tags(3), aliases(4), parent(5),
    // children(6), createdAt(7), updatedAt(8).
    extraDisplayProperties: [
      { key: "tags", label: "Categories", icon: TagIcon, displayOrder: 3 },
      { key: "aliases", label: "Aliases", icon: ContentIcon, displayOrder: 4 },
      { key: "children", label: "Children", icon: ChildrenIcon, displayOrder: 6 },
    ],
    toggles: [
      // Visible only when groupBy === "role" (display-panel.tsx guard). ON:
      // classify roles within the filtered slice; OFF (default): against the
      // full store.
      { key: "filterAwareRole", label: "Role from filtered view" },
    ],
  },
}
