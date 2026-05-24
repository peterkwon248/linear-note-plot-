import type { ReactNode } from "react"
import type { SortField, SortDirection, ViewMode, GroupBy, SortRule, ViewContextKey } from "./types"
import { Hexagon, Cube, BookOpen, CircleHalf, Sticker as StickerIcon, Lightning, PencilSimple, Sparkle, Globe, DownloadSimple } from "@phosphor-icons/react"
import { Cuboid2x2 } from "@/components/icons/Cuboid2x2"
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import { WIKI_STATUS_HEX } from "@/lib/colors"

export interface FilterCategory {
  key: string
  label: string
  /** Optional i18n key — when set, FilterPanel renders `t(labelKey)` instead
   *  of `label`. Keeps view-configs.tsx as a static export while still
   *  letting the active locale translate the visible chrome. */
  labelKey?: string
  icon: ReactNode
  values: FilterValue[]
}

export interface FilterValue {
  key: string
  label: string
  labelKey?: string
  color?: string
  count?: number
  icon?: ReactNode
  /**
   * Optional sub-section header. When set, FilterPanel renders a small
   * group label above the first value of each group. Values must be
   * pre-sorted by group in the source array. Used by Ontology Hull
   * Phase 1 to organize cross-entity Status values
   * (Note / Wiki / Book).
   */
  group?: string
}

export interface QuickFilter {
  label: string
  labelKey?: string
  desc: string
  descKey?: string
  rules: Array<{ field: string; operator: string; value: string }>
}

/** A toggle entry rendered in DisplayPanel's "List/Board options" section. */
export interface DisplayToggle {
  key: string
  label: string
  labelKey?: string
  icon?: ReactNode
}

/** Mode visibility for grouping/property/sort options.
 *  - `"all"` (default when omitted) = visible in every view mode.
 *  - `ViewMode[]` = visible only in listed modes (hidden elsewhere).
 *
 *  This is the Linear-style "Show, don't disable" (audit L2): options that
 *  have no effect in the current mode are not rendered, instead of being
 *  shown as grayed-out noise. Combined with `normalizeViewState`
 *  mode-aware auto-cleanup (L3), the persisted state stays clean across
 *  mode transitions. */
export type ModeList = ViewMode[] | "all"

/** Single grouping option for the DisplayPanel grouping dropdown.
 *  `modes` filters which view modes the option appears in. */
export interface GroupingOption {
  value: GroupBy
  label: string
  labelKey?: string
  modes?: ModeList
}

/** Single ordering (sort) option for the DisplayPanel ordering dropdown. */
export interface OrderingOption {
  value: SortField
  label: string
  labelKey?: string
  modes?: ModeList
}

/** A toggleable property chip rendered in DisplayPanel's "Display properties" section.
 *  Property keys map to viewState.visibleColumns (or a special toggle channel
 *  for showAlphaIndex). */
export interface DisplayProperty {
  key: string
  label: string
  labelKey?: string
  icon?: ReactNode
  /** @deprecated Use `modes: ["board"]` instead. Kept for back-compat
   *  during the modes migration; DisplayPanel treats it as a synonym. */
  boardOnly?: boolean
  /** Visible view modes for this property chip. Omitted → "all".
   *  Common patterns:
   *    - `["list", "board"]` for properties that map to visibleColumns
   *    - `["board"]` for board-only badges (replaces `boardOnly`)
   *    - `["list"]` for list-only columns (rare)
   *    - omitted ("all") for universal properties like Title/Updated
   */
  modes?: ModeList
}

/** Single source of truth for display-panel configuration shape.
 *  Consumed by both view-configs.tsx (declares per-context configs) and
 *  components/display-panel.tsx (renders the popover). */
export interface DisplayConfig {
  orderingOptions: OrderingOption[]
  groupingOptions: GroupingOption[]
  toggles: DisplayToggle[]
  properties: DisplayProperty[]
  supportedModes?: ViewMode[]
  /** Default groupBy when switching to board mode from groupBy="none".
   *  Notes use "status" (the canonical board axis); Wiki has no status,
   *  so defaults to "label" (Category). DisplayPanel reads this on the
   *  list→board mode switch.
   *  @deprecated Prefer `defaultGroupByByMode.board` (audit L4 — explicit
   *  per-mode defaults). Kept for back-compat; if both set,
   *  `defaultGroupByByMode.board` wins. */
  boardDefaultGroupBy?: GroupBy
  /** Allow "family" grouping in Board mode. Default false (family tree
   *  doesn't fit board columns for most entities). Wiki Categories
   *  override to true (family-root-per-column is meaningful). */
  allowFamilyOnBoard?: boolean
  /** Whether sub-grouping (2nd-level group) is supported. Currently only
   *  Notes implements it (see notes-table / notes-board / use-notes-view).
   *  Default false — entities without subGroupBy handling hide the option
   *  from the DisplayPanel to avoid the "selection has no effect" bug. */
  supportsSubGrouping?: boolean
  /** Per-mode default groupBy. Audit L4: "Make the right thing default".
   *  When user enters a mode (or normalizeViewState auto-cleans an
   *  invalid groupBy for the mode), this map decides the fallback.
   *  Examples:
   *    - Wiki: `{ board: "wikiStatus", timeline: "wikiStatus" }`
   *    - Notes: `{ board: "status" }`
   *    - Books: `{ board: "kind" }`
   *  Falls back to "none" if not specified. */
  defaultGroupByByMode?: Partial<Record<ViewMode, GroupBy>>
  /** Per-mode default sort rule. Used when entering a mode resets sort,
   *  or as the canonical sort for modes whose Y-axis encodes order
   *  (timeline = createdAt asc). */
  defaultSortByMode?: Partial<Record<ViewMode, SortRule>>
}

export interface ViewConfig {
  showFilter: boolean
  showDisplay: boolean
  showDetailPanel: boolean
  filterCategories: FilterCategory[]
  quickFilters: QuickFilter[]
  displayConfig: DisplayConfig
}

// SVG Icons (14px, strokeWidth 1.2)
const StatusIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 2.5a5.5 5.5 0 010 11" fill="currentColor" opacity="0.15"/></svg>
const PriorityIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="3" y1="13" x2="3" y2="10"/><line x1="6.5" y1="13" x2="6.5" y2="7"/><line x1="10" y1="13" x2="10" y2="4"/><line x1="13" y1="13" x2="13" y2="2"/></svg>
const FolderIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"><path d="M14 12.5a1 1 0 01-1 1H3a1 1 0 01-1-1V3.5a1 1 0 011-1h3.5l1.5 2H13a1 1 0 011 1z"/></svg>
const LabelIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 4.5h12l2.5 3.5-2.5 3.5h-12z"/></svg>
const TagIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"><path d="M8.5 1.5H2v6.5l5.65 5.65a1 1 0 001.41 0l4.59-4.59a1 1 0 000-1.41z"/><circle cx="5" cy="5" r="1" fill="currentColor" stroke="none"/></svg>
const SourceIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><line x1="1.5" y1="8" x2="14.5" y2="8"/><path d="M8 2a10.5 10.5 0 013 6 10.5 10.5 0 01-3 6 10.5 10.5 0 01-3-6 10.5 10.5 0 013-6z"/></svg>
const CalendarIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="11" rx="1.5"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5.3" y1="1.3" x2="5.3" y2="4.7"/><line x1="10.7" y1="1.3" x2="10.7" y2="4.7"/></svg>
const LinkIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.7 8.7a3.3 3.3 0 005 .4l2-2a3.3 3.3 0 00-4.7-4.7L8.4 3"/><path d="M9.3 7.3a3.3 3.3 0 00-5-.4l-2 2a3.3 3.3 0 004.7 4.7l.6-.6"/></svg>
const ContentIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="2.5" y1="4" x2="13.5" y2="4"/><line x1="2.5" y1="8" x2="10" y2="8"/><line x1="2.5" y1="12" x2="7" y2="12"/></svg>
const PinIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="11" x2="8" y2="15"/><path d="M3.5 11h9V9.8a1.3 1.3 0 00-.7-1.2L10.5 8A1.3 1.3 0 0110 7V4h.5a1.3 1.3 0 000-2.7h-5a1.3 1.3 0 100 2.7H6v3a1.3 1.3 0 01-.5 1l-1.3.6a1.3 1.3 0 00-.7 1.2z"/></svg>
const ArchiveIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="2" width="13" height="3" rx="1"/><path d="M2.5 5v8a1.3 1.3 0 001.3 1.3h8.4A1.3 1.3 0 0013.5 13V5"/><line x1="6" y1="8.5" x2="10" y2="8.5"/></svg>
const TrashIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 4 3.3 4 14 4"/><path d="M12.7 4v9a1.3 1.3 0 01-1.4 1.3H4.7A1.3 1.3 0 013.3 13V4m2 0V2.7a1.3 1.3 0 011.4-1.4h2.6a1.3 1.3 0 011.4 1.4V4"/></svg>
const SortIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="2.5" y1="4" x2="10" y2="4"/><line x1="2.5" y1="8" x2="7.5" y2="8"/><line x1="2.5" y1="12" x2="5" y2="12"/></svg>
// Color dot: filled circle suggesting "color swatch"
const ColorDotIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="4.5" fill="currentColor"/></svg>
const GraphIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="3.3" r="1.7"/><circle cx="3.3" cy="12.7" r="1.7"/><circle cx="12.7" cy="12.7" r="1.7"/><line x1="8" y1="5" x2="3.3" y2="11"/><line x1="8" y1="5" x2="12.7" y2="11"/><line x1="5" y1="12.7" x2="11" y2="12.7"/></svg>
// Wiki: 활동바 BookOpen과 동일 — 일관성
const WikiIcon = <BookOpen size={14} weight="regular" />

// Parent: 위쪽 부모 노드 + 아래 self (selfd) — "내 위에 부모"
const ParentIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="3.3" r="1.7"/><line x1="8" y1="5" x2="8" y2="11"/><circle cx="8" cy="12.7" r="1.5" fill="currentColor" stroke="none"/></svg>

// Children: 위 self + 아래 두 자식 분기 — "내 아래 자식들"
const ChildrenIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="3.3" r="1.5" fill="currentColor" stroke="none"/><line x1="8" y1="5" x2="3.3" y2="11"/><line x1="8" y1="5" x2="12.7" y2="11"/><circle cx="3.3" cy="12.7" r="1.7"/><circle cx="12.7" cy="12.7" r="1.7"/></svg>
const EyeIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 8s2.7-5 7-5 7 5 7 5-2.7 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>
const CircleHalfIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="8" cy="8" r="5.5"/><path d="M8 2.5a5.5 5.5 0 010 11" fill="currentColor" opacity="0.5" stroke="none"/></svg>

export const NOTES_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: true,
  filterCategories: [
    { key: "status", label: "Status", labelKey: "filter.category.status", icon: StatusIcon, values: [
      { key: "stone", label: "Stone", labelKey: "status.stone", color: "rgba(255,255,255,0.32)", icon: <Hexagon size={14} weight="regular" style={{ color: "var(--chart-2)" }} /> },
      { key: "brick", label: "Brick", labelKey: "status.brick", color: "#f5a623", icon: <Cube size={14} weight="regular" style={{ color: "var(--chart-3)" }} /> },
      { key: "keystone", label: "Block", labelKey: "status.block", icon: <Cuboid2x2 size={14} weight="regular" style={{ color: "var(--status-keystone)" }} /> },
    ]},
    { key: "folder", label: "Folder", labelKey: "filter.category.folder", icon: FolderIcon, values: [] },
    { key: "label", label: "Label", labelKey: "filter.category.label", icon: LabelIcon, values: [] },
    { key: "tags", label: "Tags", labelKey: "filter.category.tags", icon: TagIcon, values: [] },
    { key: "source", label: "Source", labelKey: "filter.category.source", icon: SourceIcon, values: [
      { key: "manual", label: "Manual", icon: <PencilSimple size={14} weight="regular" className="text-muted-foreground" /> },
      { key: "webclip", label: "Web Clip", icon: <Globe size={14} weight="regular" className="text-muted-foreground" /> },
      { key: "import", label: "Import", icon: <DownloadSimple size={14} weight="regular" className="text-muted-foreground" /> },
    ]},
    { key: "updatedAt", label: "Dates", labelKey: "filter.category.dates", icon: CalendarIcon, values: [
      { key: "today", label: "Today" },
      { key: "yesterday", label: "Yesterday" },
      { key: "this-week", label: "This week" },
      { key: "last-7-days", label: "Last 7 days" },
      { key: "this-month", label: "This month" },
      { key: "last-30-days", label: "Last 30 days" },
      { key: "stale", label: "Stale (30+ days)" },
    ]},
    { key: "links", label: "Links", labelKey: "filter.category.links", icon: LinkIcon, values: [
      { key: "_any", label: "Has links" },
      { key: "backlinks", label: "Has backlinks" },
      { key: "_none", label: "No outbound" },
      { key: "_orphan", label: "True orphans (no in/out)" },
    ]},
    { key: "wikiRegistered", label: "Wiki", labelKey: "filter.category.wiki", icon: WikiIcon, values: [
      { key: "true", label: "In wiki" },
      { key: "false", label: "Not in wiki" },
    ]},
    { key: "content", label: "Content", labelKey: "filter.category.content", icon: ContentIcon, values: [
      { key: "hasImage", label: "Has images" },
      { key: "hasCode", label: "Has code blocks" },
      { key: "hasTable", label: "Has tables" },
    ]},
    { key: "pinned", label: "Pinned", labelKey: "filter.category.pinned", icon: PinIcon, values: [
      { key: "true", label: "Pinned" },
      { key: "false", label: "Not pinned" },
    ]},
  ],
  quickFilters: [
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
    { label: "Wiki-registered", labelKey: "filter.quick.wiki_registered", desc: "promoted to wiki", descKey: "filter.quick.wiki_registered_desc", rules: [
      { field: "wikiRegistered", operator: "eq", value: "true" },
    ]},
  ],
  displayConfig: {
    // 2026-05-24: gallery mode deprecated app-wide — Grid view replaces it
    // (user feedback: grid layout reads cleaner than the gallery card stack).
    // Persisted viewMode === "gallery" auto-migrates to "grid" in
    // normalizeViewState. supportedModes order matches the DisplayPanel tab strip.
    supportedModes: ["list", "board", "grid", "timeline"],
    supportsSubGrouping: true,
    orderingOptions: [
      { value: "updatedAt", label: "Updated", labelKey: "display.ordering.updated" },
      { value: "createdAt", label: "Created", labelKey: "display.ordering.created" },
      { value: "title", label: "Name", labelKey: "display.ordering.title" },
      { value: "links", label: "Links", labelKey: "filter.category.links" },
      { value: "reads", label: "Word count", labelKey: "display.property.words" },
    ],
    // L4: per-mode default groupBy. Timeline default = "status" mirrors
    // the Wiki timeline default ("wikiStatus") — Stone/Brick/Block lanes
    // give a "notes maturity over time" view that's the most useful
    // glance for the Notes timeline.
    // 2026-05-24 — grid mode = Books-parity flat card grid (no grouping
    // semantics). normalizeViewState reads this and resets invalid groupBy
    // on mode switch.
    defaultGroupByByMode: { board: "status", timeline: "status", grid: "none" },
    // Timeline Y-axis encodes time → sort by createdAt asc is canonical.
    defaultSortByMode: { timeline: { field: "createdAt", direction: "asc" } },
    groupingOptions: [
      { value: "none", label: "No grouping", labelKey: "display.grouping.none" },
      // 2026-05-24 — explicit modes for every grouping (Linear-style L1 "UI
      // 노출 = 100% 동작"). Grid is a flat card grid → no grouping options
      // outside "none". List/board keep the full axis set.
      { value: "status", label: "Status", labelKey: "display.property.status", modes: ["list", "board"] },
      { value: "folder", label: "Folder", labelKey: "display.property.folder", modes: ["list", "board"] },
      { value: "label", label: "Label", labelKey: "filter.category.label", modes: ["list", "board"] },
      { value: "parent", label: "Parent", labelKey: "display.property.parent", modes: ["list", "board"] },
      { value: "role", label: "Role", modes: ["list", "board"] },
      // family tree only makes sense in list (indent column). Board would
      // need allowFamilyOnBoard override (categories case).
      { value: "family", label: "Family", modes: ["list"] },
      // updatedAt time-bucket grouping. Timeline X-axis already encodes
      // time, so date grouping would duplicate the axis — hide in timeline.
      { value: "date", label: "Updated", labelKey: "display.ordering.updated", modes: ["list", "board"] },
      // Plot-consistent UX: alphabetical "Index" grouping moved from a
      // properties-chip toggle (legacy showAlphaIndex) into the grouping
      // dropdown alongside other grouping axes. Wired in lib/view-engine/group.ts.
      // L1: firstLetter only meaningful in list mode (board/gallery have
      // their own card/column language; alphabetical headers fight with them).
      { value: "firstLetter", label: "Index", modes: ["list"] },
    ],
    toggles: [
      { key: "showTrashed", label: "Show trashed", labelKey: "display.show_trashed", icon: TrashIcon },
      // Visible only when groupBy === "role" (display-panel.tsx guard).
      // ON: classify roles within the filtered slice. OFF (default):
      // classify against the full store so a filter doesn't lie about
      // "this note is a hub" vs "in this view it's a hub".
      { key: "filterAwareRole", label: "Role from filtered view" },
    ],
    properties: [
      { key: "status", label: "Status", labelKey: "display.property.status", icon: StatusIcon },
      // priority/label/tags surface only on the Board card (no equivalent
      // list column). modes: ["board"] hides them in non-board view modes —
      // prevents "chip toggles nothing" bug in list/gallery.
      { key: "priority", label: "Priority", icon: PriorityIcon, modes: ["board"] },
      { key: "label", label: "Label", labelKey: "filter.category.label", icon: LabelIcon, modes: ["board"] },
      { key: "tags", label: "Tags", labelKey: "filter.category.tags", icon: TagIcon, modes: ["board"] },
      { key: "folder", label: "Folder", labelKey: "display.property.folder", icon: FolderIcon },
      { key: "parent", label: "Parent", labelKey: "display.property.parent", icon: ParentIcon },
      { key: "children", label: "Children", labelKey: "display.property.children", icon: ChildrenIcon },
      { key: "links", label: "Backlinks", labelKey: "display.property.backlinks", icon: LinkIcon },
      { key: "wordCount", label: "Words", labelKey: "display.property.words", icon: ContentIcon },
      // createdAt/updatedAt are also meaningful for the timeline label
      // column (date row). Most other properties don't fit the narrow column.
      { key: "updatedAt", label: "Updated", labelKey: "display.property.updated", icon: CalendarIcon, modes: ["list", "board", "timeline"] },
      { key: "createdAt", label: "Created", labelKey: "display.property.created", icon: CalendarIcon, modes: ["list", "board", "timeline"] },
    ],
  },
}

// Wiki-specific filter/display options.
// 의도된 차이 (Notes 대비):
//   - priority sort 제외: wiki에 priority 개념 없음
//   - status filter 제외: stub/article은 런타임 파생 (isWikiStub) → toggle로 처리
//   - groupingOptions: tier(depth)/linkCount/parent/category — wiki 위계 반영
//   - filterCategories: category(WikiCategory)/links/dates/aliases/parent
export const WIKI_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: true,
  filterCategories: [
    // category: WikiCategory entity. values는 런타임 hydrate (wiki-view.tsx)
    { key: "category", label: "Category", icon: TagIcon, values: [] },
    { key: "links", label: "Backlinks", icon: LinkIcon, values: [
      { key: "_any", label: "Has backlinks" },
      { key: "5+", label: "5+ backlinks" },
      { key: "10+", label: "10+ backlinks" },
      { key: "_none", label: "No backlinks" },
      { key: "_orphan", label: "True orphans (no in/out)" },
    ]},
    { key: "updatedAt", label: "Updated", icon: CalendarIcon, values: [
      { key: "today", label: "Today" },
      { key: "yesterday", label: "Yesterday" },
      { key: "this-week", label: "This week" },
      { key: "last-7-days", label: "Last 7 days" },
      { key: "this-month", label: "This month" },
      { key: "last-30-days", label: "Last 30 days" },
      { key: "stale", label: "Stale (30+ days)" },
    ]},
    { key: "createdAt", label: "Created", icon: CalendarIcon, values: [
      { key: "today", label: "Today" },
      { key: "this-week", label: "This week" },
      { key: "this-month", label: "This month" },
    ]},
    { key: "title", label: "Aliases", icon: ContentIcon, values: [
      { key: "_aliased", label: "Has aliases" },
      { key: "_unaliased", label: "No aliases" },
    ]},
    // 4 카테고리 hierarchy filter (classifyWikiArticleRole과 일관)
    { key: "wikiTier", label: "Hierarchy", icon: GraphIcon, values: [
      { key: "_root", label: "Root (has children)" },
      { key: "_parent", label: "Parent (both)" },
      { key: "_child", label: "Child (no children)" },
      { key: "_solo", label: "Solo (isolated)" },
    ]},
  ],
  quickFilters: [
    { label: "Stale articles", desc: "30+ days no update", rules: [
      { field: "updatedAt", operator: "lt", value: "stale" },
    ]},
    { label: "Orphans", desc: "no backlinks", rules: [
      { field: "links", operator: "eq", value: "_none" },
    ]},
    { label: "Hubs", desc: "10+ backlinks", rules: [
      { field: "links", operator: "eq", value: "10+" },
    ]},
  ],
  displayConfig: {
    // 2026-05-24: gallery deprecated → grid replaces. See NOTES_VIEW_CONFIG.
    supportedModes: ["list", "board", "grid", "timeline"],
    // Wiki board default = "wikiStatus" (Stub / Article) — **2 column 고정
    // 보장**. Notes의 Stone/Brick/Block 패턴 정확 mirror (영구 룰 21 정합).
    // Status는 isWikiStub 기반 derived (block count >= 3 = article) →
    // drag-to-change는 무의미하지만 시각 분류로는 entity-uniformity 본질을
    // 가장 잘 표현. tier는 부차 axis로 dropdown에서 선택 가능 (parentArticleId
    // chain 풍부할 때 유용).
    boardDefaultGroupBy: "wikiStatus",
    // L4: per-mode default groupBy. Timeline default = wikiStatus (Stub vs
    // Article lane on time axis — the most useful "wiki at a glance" view).
    defaultGroupByByMode: { board: "wikiStatus", timeline: "wikiStatus", grid: "none" },
    // L4: timeline Y-axis encodes time → sort by createdAt asc is canonical.
    defaultSortByMode: { timeline: { field: "createdAt", direction: "asc" } },
    // priority 제외 (wiki에 의미 없음)
    orderingOptions: [
      { value: "updatedAt", label: "Updated" },
      { value: "createdAt", label: "Created" },
      { value: "title", label: "Name" },
      { value: "links", label: "Most linked" },
      { value: "reads", label: "Most read" },
      { value: "status", label: "Status" },
    ],
    // tier(depth) / linkCount(bucket) / parent — wiki 고유 위계 +
    // wikiStatus (Stub / Article) — Notes Stone/Brick/Block 정합 axis.
    groupingOptions: [
      { value: "none", label: "No grouping" },
      // 2026-05-24 — explicit modes for every grouping (Linear-style L1).
      // Grid = flat card grid → no grouping options outside "none".
      { value: "wikiStatus", label: "Status", modes: ["list", "board"] },
      { value: "tier", label: "Tier", modes: ["list", "board"] },
      { value: "linkCount", label: "Link count", modes: ["list", "board"] },
      { value: "parent", label: "Parent article", modes: ["list", "board"] },
      { value: "role", label: "Role", modes: ["list", "board"] },
      { value: "label", label: "Category", modes: ["list", "board"] },
      // family tree only makes sense in list (indent column).
      { value: "family", label: "Family", modes: ["list"] },
      // updatedAt grouping in timeline would duplicate the time axis.
      { value: "date", label: "Updated", modes: ["list", "board"] },
      // firstLetter alphabetical index — list-only (board has fixed cols,
      // gallery has card layout, timeline has time axis).
      { value: "firstLetter", label: "Index", modes: ["list"] },
    ],
    toggles: [
      { key: "showStubs", label: "Show stubs", icon: ContentIcon },
      // Visible only when groupBy === "role" (display-panel.tsx guard).
      // ON: classify roles within the filtered slice. OFF (default):
      // classify against full store — a filter doesn't lie about
      // "this article is a hub" vs "in this view it's a hub".
      { key: "filterAwareRole", label: "Role from filtered view" },
    ],
    properties: [
      // Title intentionally omitted — it's a required column, not toggleable.
      // Index moved to the grouping dropdown (firstLetter, label "Index") —
      // Plot-consistent UX: every display-properties chip = a real 1:1 column.
      { key: "status", label: "Status", icon: CircleHalfIcon },
      { key: "links", label: "Backlinks", icon: LinkIcon },
      { key: "reads", label: "Reads", icon: EyeIcon },
      { key: "tags", label: "Categories", icon: TagIcon },
      { key: "aliases", label: "Aliases", icon: ContentIcon },
      { key: "parent", label: "Parent", icon: ParentIcon },
      { key: "children", label: "Children", icon: ChildrenIcon },
      // B6: createdAt/updatedAt are also meaningful for the timeline label
      // column (date row). Most other properties don't fit the narrow column.
      { key: "createdAt", label: "Created", icon: CalendarIcon, modes: ["list", "board", "timeline"] },
      { key: "updatedAt", label: "Updated", icon: CalendarIcon, modes: ["list", "board", "timeline"] },
    ],
  },
}

export const WIKI_CATEGORY_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: true,
  filterCategories: [
    { key: "wikiTier", label: "Tier", icon: TagIcon, values: [
      { key: "1st", label: "Tier 1 (Top)" },
      { key: "2nd", label: "Tier 2" },
      { key: "3rd+", label: "Tier 3+" },
    ]},
    { key: "status", label: "Wikis", icon: TagIcon, values: [
      { key: "has-articles", label: "Has wikis" },
      { key: "empty", label: "Empty" },
    ]},
    { key: "hasSubs", label: "Subcategories", icon: FolderIcon, values: [
      { key: "yes", label: "Has subcategories" },
      { key: "no", label: "Leaf only" },
    ]},
    // Parent filter — dynamically populated from existing categories in wiki-category-page.
    { key: "parent", label: "Parent", icon: FolderIcon, values: [] },
    // Color filter — dynamically populated from category palette.
    { key: "color", label: "Color", icon: StatusIcon, values: [] },
  ],
  quickFilters: [],
  displayConfig: {
    supportedModes: ["list", "board"],
    allowFamilyOnBoard: true,
    orderingOptions: [
      { value: "title", label: "Name" },
      { value: "parent", label: "Parent" },
      { value: "tier", label: "Tier" },
      { value: "articles", label: "Articles" },
      { value: "sub", label: "Sub" },
      { value: "createdAt", label: "Created" },
      { value: "updatedAt", label: "Updated" },
    ],
    groupingOptions: [
      { value: "none", label: "No grouping" },
      { value: "tier", label: "Tier" },
      { value: "parent", label: "Parent" },
      // family allowed in board (allowFamilyOnBoard: true) — Categories
      // exception (family-root-per-column is meaningful).
      { value: "family", label: "Family" },
      // firstLetter alphabetical index — list-only.
      { value: "firstLetter", label: "Index", modes: ["list"] },
      { value: "createdAt", label: "Created" },
    ],
    toggles: [
      { key: "showDescription", label: "Show description", icon: ContentIcon },
      { key: "showStubsOnly", label: "Stubs only", icon: ContentIcon },
      { key: "showEmptyGroups", label: "Show empty", icon: EyeIcon },
    ],
    properties: [
      { key: "parent", label: "Parent" },
      { key: "tier", label: "Tier" },
      { key: "articles", label: "Articles" },
      { key: "sub", label: "Sub" },
      { key: "createdAt", label: "Created" },
      { key: "updatedAt", label: "Updated" },
    ],
  },
}

export const GRAPH_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: true,
  filterCategories: [
    // v2 Ontology Hull Phase 1 — Status filter entity별 분리.
    // Note status (stone/brick/block) + Wiki status (stub/article) +
    // Book kind (smart/manual/hybrid)를 flat values로 한 카테고리에
    // 묶음 (LOCKED #7 Option B nested의 일차 구현 — UI nested
    // sub-section은 follow-up, 우선은 flat list로 cross-entity
    // 필터링 활성).
    { key: "status", label: "Status", icon: StatusIcon, values: [
      // Status는 entity별로 의미 다름 → sub-section header(group)로 묶음.
      // FilterPanel이 group 변경 시점에 small label 렌더링 (LOCKED
      // Ontology Hull #7 Option B nested의 본 구현).
      { key: "stone",       label: "Stone",   icon: <Hexagon size={14} weight="regular" style={{ color: "var(--chart-2)" }} />, group: "Note" },
      { key: "brick",       label: "Brick",   icon: <Cube size={14} weight="regular" style={{ color: "var(--chart-3)" }} />, group: "Note" },
      { key: "keystone",    label: "Block",   icon: <Cuboid2x2 size={14} weight="regular" style={{ color: "var(--status-keystone)" }} />, group: "Note" },
      { key: "wiki-stub",   label: "Stub",    icon: <IconWikiStub size={14} style={{ color: WIKI_STATUS_HEX.stub }} />, group: "Wiki" },
      { key: "wiki-article", label: "Article", icon: <IconWikiArticle size={14} style={{ color: WIKI_STATUS_HEX.article }} />, group: "Wiki" },
      { key: "book-smart",  label: "Smart",   icon: <Lightning size={14} weight="regular" style={{ color: "#5E6AD2" }} />, group: "Book" },
      { key: "book-manual", label: "Manual",  icon: <PencilSimple size={14} weight="regular" style={{ color: "#6b7280" }} />, group: "Book" },
      { key: "book-hybrid", label: "Hybrid",  icon: <Sparkle size={14} weight="regular" style={{ color: "#D97706" }} />, group: "Book" },
    ]},
    { key: "tags", label: "Tags", icon: TagIcon, values: [] },
    { key: "label", label: "Label", icon: LabelIcon, values: [] },
    { key: "relationType", label: "Relations", icon: LinkIcon, values: [
      { key: "related-to", label: "Related to", color: "#6b7280" },
      { key: "inspired-by", label: "Inspired by", color: "#8b5cf6" },
      { key: "contradicts", label: "Contradicts", color: "#ef4444" },
      { key: "extends", label: "Extends", color: "#3b82f6" },
      { key: "depends-on", label: "Depends on", color: "#f59e0b" },
    ]},
    // v2 Ontology Hull Phase 4 — 특정 hull entity 만 표시. groupBy
    // value에 따라 values 동적 hydration (ontology-view). 빈
    // selection = 모두 표시 (default). selection 있으면 그 entity만.
    { key: "hullEntity", label: "Visible hulls", icon: <Sparkle size={14} weight="regular" />, values: [] },
  ],
  quickFilters: [],
  displayConfig: {
    supportedModes: ["graph", "insights"],
    orderingOptions: [
      { value: "links", label: "Connections" },
      { value: "title", label: "Name" },
    ],
    // Group by (= graph hull rule). Hull color = grouping entity's color.
    // tag/folder produce unified note+wiki hulls; label/category are
    // entity-specific. "connections" preserves the legacy BFS behavior.
    groupingOptions: [
      { value: "none",        label: "No grouping" },
      // Sticker = the most natural "user-defined cluster" — unified across
      // notes + wikis. Listed first so users discover it as the default
      // explicit-grouping mechanism.
      { value: "sticker",     label: "Sticker" },
      // v2 Ontology Hull Phase 2 — Book hull. Book.items의 refIds로
      // 멤버 결정 (note + wiki). Sticker/Folder/Category 패턴 정합.
      // (Multi-source 동시 toggle은 follow-up — 현재는 single hull
      // source select 시스템 그대로 활용.)
      { value: "book",        label: "Book" },
      { value: "tag",         label: "Tag" },
      { value: "label",       label: "Label" },
      { value: "category",    label: "Wiki Category" },
      { value: "folder",      label: "Folder" },
      { value: "status",      label: "Status" },
      { value: "connections", label: "Connections (legacy)" },
    ],
    toggles: [
      // Node type visibility
      { key: "showNotes",    label: "Show note nodes",    icon: <CircleHalf size={14} weight="fill" style={{ color: "var(--chart-3)" }} /> },
      { key: "showWiki",     label: "Show wiki nodes",    icon: <BookOpen size={14} weight="regular" style={{ color: "#8b5cf6" }} /> },
      { key: "showTagNodes", label: "Show tag nodes",     icon: TagIcon },
      // Edge / label visibility
      { key: "showWikilinks", label: "Show wikilinks", icon: LinkIcon },
      { key: "showLabels",    label: "Show labels",    icon: EyeIcon },
      // v2 Ontology Hull Phase 3 — Book sequence edge (opt-in, default
      // off). groupBy="book" + 활성 시 hull 안의 노드들 사이를 책 순서
      // (book.items order)대로 dashed thin arrow로 연결.
      { key: "showBookSequence", label: "Show book sequence", icon: <Sparkle size={14} weight="regular" /> },
    ],
    properties: [],
  },
}

export const INBOX_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: false,
  filterCategories: [
    // Path-A-Step-5: source filter — 5 InboxItemKind values.
    // Quick tabs cover 4 popular ones (All/Reminders/SRS/Snoozed); this filter
    // adds wiki-redlink + auto-enroll + multi-select.
    { key: "source", label: "Source", icon: SourceIcon, values: [
      { key: "reminder", label: "Reminder" },
      { key: "srs", label: "SRS due" },
      { key: "snooze-expired", label: "Snooze expired" },
      { key: "wiki-redlink", label: "Wiki red links" },
      { key: "auto-enroll", label: "Auto-enroll suggestions" },
    ]},
  ],
  quickFilters: [],
  displayConfig: {
    supportedModes: ["list"],
    orderingOptions: [
      { value: "createdAt", label: "Newest" },
      { value: "updatedAt", label: "Updated" },
      { value: "title", label: "Name" },
    ],
    groupingOptions: [],
    toggles: [
      { key: "showSnoozed", label: "Show snoozed", icon: CalendarIcon },
      { key: "showKept", label: "Show kept", icon: ArchiveIcon },
    ],
    properties: [
      { key: "source", label: "Source", icon: SourceIcon },
      { key: "createdAt", label: "Age", icon: CalendarIcon },
    ],
  },
}

export const INSIGHTS_VIEW_CONFIG: ViewConfig = {
  showFilter: false,
  showDisplay: true,
  showDetailPanel: false,
  filterCategories: [],
  quickFilters: [],
  displayConfig: {
    supportedModes: [],
    orderingOptions: [
      { value: "priority", label: "Severity" },
      { value: "reads", label: "Count" },
    ],
    groupingOptions: [],
    toggles: [
      { key: "showInfo", label: "Show info level", icon: EyeIcon },
      { key: "showResolved", label: "Show resolved", icon: ArchiveIcon },
    ],
    properties: [
      { key: "priority", label: "Severity", icon: PriorityIcon },
      { key: "reads", label: "Count", icon: ContentIcon },
    ],
  },
}

export const CALENDAR_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: true,
  filterCategories: [
    { key: "status", label: "Status", icon: StatusIcon, values: [
      { key: "stone", label: "Stone", color: "rgba(255,255,255,0.32)", icon: <Hexagon size={14} weight="regular" style={{ color: "var(--chart-2)" }} /> },
      { key: "brick", label: "Brick", color: "#f5a623", icon: <Cube size={14} weight="regular" style={{ color: "var(--chart-3)" }} /> },
      { key: "keystone", label: "Block", icon: <Cuboid2x2 size={14} weight="regular" style={{ color: "var(--status-keystone)" }} /> },
    ]},
    { key: "folder", label: "Folder", icon: FolderIcon, values: [] },
    { key: "label", label: "Label", icon: LabelIcon, values: [] },
    { key: "tags", label: "Tags", icon: TagIcon, values: [] },
  ],
  quickFilters: [],
  displayConfig: {
    supportedModes: [],
    orderingOptions: [
      { value: "createdAt", label: "Created date" },
      { value: "updatedAt", label: "Updated date" },
    ],
    groupingOptions: [],
    toggles: [
      { key: "showNotes", label: "Notes", icon: ContentIcon },
      { key: "showWiki", label: "Wiki", icon: LinkIcon },
    ],
    properties: [],
  },
}

// Templates-specific filter/display options (PR template-c).
// Templates entity is intentionally board-mode-free — templates are pre-set
// blueprints, not workflow items. Only list + grid modes make sense.
// `grid` is added to ViewMode in DisplayPanel via `supportedModes` filter.
export const TEMPLATES_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: true,
  filterCategories: [
    { key: "status", label: "Status", icon: StatusIcon, values: [
      { key: "stone", label: "Stone", color: "rgba(255,255,255,0.32)", icon: <Hexagon size={14} weight="regular" style={{ color: "var(--chart-2)" }} /> },
      { key: "brick", label: "Brick", color: "#f5a623", icon: <Cube size={14} weight="regular" style={{ color: "var(--chart-3)" }} /> },
      { key: "keystone", label: "Block", icon: <Cuboid2x2 size={14} weight="regular" style={{ color: "var(--status-keystone)" }} /> },
    ]},
    { key: "priority", label: "Priority", icon: PriorityIcon, values: [
      { key: "urgent", label: "Urgent" },
      { key: "high", label: "High" },
      { key: "medium", label: "Medium" },
      { key: "low", label: "Low" },
      { key: "none", label: "No priority" },
    ]},
    { key: "label", label: "Label", icon: LabelIcon, values: [] },  // hydrated at runtime
    { key: "folder", label: "Folder", icon: FolderIcon, values: [] },  // hydrated at runtime
    { key: "tags", label: "Tags", icon: TagIcon, values: [] },  // hydrated at runtime
    { key: "pinned", label: "Pinned", icon: PinIcon, values: [
      { key: "true", label: "Pinned" },
      { key: "false", label: "Not pinned" },
    ]},
  ],
  quickFilters: [
    { label: "Pinned only", desc: "show pinned templates", rules: [
      { field: "pinned", operator: "eq", value: "true" },
    ]},
  ],
  displayConfig: {
    supportedModes: ["list", "grid"],
    orderingOptions: [
      { value: "updatedAt", label: "Updated" },
      { value: "createdAt", label: "Created" },
      { value: "title", label: "Name" },
    ],
    groupingOptions: [
      { value: "none", label: "No grouping" },
      { value: "status", label: "Status" },
      { value: "priority", label: "Priority" },
      { value: "label", label: "Label" },
      { value: "folder", label: "Folder" },
      { value: "date", label: "Updated" },
      // firstLetter alphabetical index — list-only (grid uses card layout).
      { value: "firstLetter", label: "Index", modes: ["list"] },
    ],
    toggles: [],
    properties: [
      // Index lives in the grouping dropdown (firstLetter) — not a chip.
      { key: "updatedAt", label: "Updated", icon: CalendarIcon },
      { key: "createdAt", label: "Created", icon: CalendarIcon },
    ],
  },
}

// Labels entity index view config (PR group-c-d-2).
// Labels are categorical markers with a required color — no status/priority/board axis.
// list+grid only. Sort by name (alpha) or noteCount.
// 2026-05-19 — showFilter: true + usage filter (in_use / unused) for entity-uniformity.
// Label.color is non-nullable so colorStatus filter (Tags 패턴) doesn't apply —
// usage axis (noteCount === 0 vs > 0) is the meaningful filter for Labels.
export const LABELS_LIST_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: false,
  filterCategories: [
    { key: "usage", label: "Usage", icon: SortIcon, values: [
      { key: "in_use", label: "In use" },
      { key: "unused", label: "Unused" },
    ]},
  ],
  quickFilters: [],
  displayConfig: {
    supportedModes: ["list", "grid"],
    orderingOptions: [
      { value: "name", label: "Name" },
      { value: "noteCount", label: "Note count" },
    ],
    groupingOptions: [
      { value: "none", label: "No grouping" },
      // firstLetter alphabetical index — list-only (grid uses card layout).
      { value: "firstLetter", label: "Index", modes: ["list"] },
    ],
    toggles: [],
    properties: [
      { key: "noteCount", label: "Note count", icon: SortIcon },
      { key: "color", label: "Color", icon: ColorDotIcon },
    ],
  },
}

// Tags entity index view config (PR group-c-d-1).
// Tags are hashtag markers — no status/priority/board axis. list+grid only.
// Sort by name (alpha) or noteCount. No filter categories (tags don't have
// folder/label membership). Search is handled globally via searchQuery.
// Filter: colorStatus category added (Path-A-Step-4 — v109 opt-in color policy).
export const TAGS_LIST_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: false,
  filterCategories: [
    // Path-A-Step-4: opt-in color status filter (v109 policy — tags can have null color).
    { key: "colorStatus", label: "Color", icon: ColorDotIcon, values: [
      { key: "set", label: "Has color" },
      { key: "unset", label: "No color" },
    ]},
  ],
  quickFilters: [],
  displayConfig: {
    supportedModes: ["list", "grid"],
    orderingOptions: [
      { value: "name", label: "Name" },
      { value: "noteCount", label: "Note count" },
    ],
    groupingOptions: [
      { value: "none", label: "No grouping" },
      // firstLetter alphabetical index — list-only (grid uses card layout).
      { value: "firstLetter", label: "Index", modes: ["list"] },
    ],
    toggles: [],
    properties: [
      { key: "noteCount", label: "Note count", icon: SortIcon },
      { key: "color", label: "Color", icon: ColorDotIcon },
    ],
  },
}

// Files entity index view config (PR group-c-d-5 / Path-A-Step-1).
// Files are media entities (Attachment — type "image" | "url" | "file").
// list+grid both supported — image previews drive grid value. Sort by name /
// createdAt / size / fileType. groupBy "none" 1차.
// Filter: type category lifted into viewState.filters (Path-A-Step-1);
// local chip bar removed from library-view.tsx.
export const FILES_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: false,
  filterCategories: [
    { key: "type", label: "Type", icon: SortIcon, values: [
      { key: "image", label: "Image" },
      { key: "url", label: "Link" },
      { key: "file", label: "File" },
    ]},
  ],
  quickFilters: [],
  displayConfig: {
    supportedModes: ["list", "grid"],
    orderingOptions: [
      { value: "createdAt", label: "Created" },
      { value: "name", label: "Name" },
      { value: "size", label: "Size" },
      { value: "fileType", label: "Type" },
    ],
    groupingOptions: [
      { value: "none", label: "No grouping" },
      // firstLetter alphabetical index — list-only (grid uses card layout).
      { value: "firstLetter", label: "Index", modes: ["list"] },
    ],
    toggles: [],
    properties: [
      { key: "fileType", label: "Type", icon: SortIcon },
      { key: "size", label: "Size", icon: SortIcon },
    ],
  },
}

// References entity index view config (PR group-c-d-4 / §11.3 Path-A-Step-2).
// References are rich entities (title + content + infobox fields + tags + image)
// — first non-Note entity in this series. list+grid both supported.
// Sort by updatedAt / createdAt / title / fieldCount. groupBy "type" (link vs
// citation, derived from url field) is supported via the hook's classifier.
// Filter: "type" category (link/citation) lifted into viewState.filters (Path-A-Step-2).
// Note: quickFilter (all/linked/unlinked/links) and field-key filter are kept
// LOCAL to ReferencesView — multi-state UI doesn't fit toggles (boolean record).
// Future PR can lift those into viewState.filters.
// Search is local (ViewHeader searchValue/onSearchChange) for the same reason.
const RefLinkIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.7 8.7a3.3 3.3 0 005 .4l2-2a3.3 3.3 0 00-4.7-4.7L8.4 3"/><path d="M9.3 7.3a3.3 3.3 0 00-5-.4l-2 2a3.3 3.3 0 004.7 4.7l.6-.6"/></svg>
const RefCitationIcon = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 11.5V9.5a2 2 0 00-2-2H3"/><path d="M11 11.5V9.5a2 2 0 00-2-2H8"/><path d="M4 7.5V5.5"/><path d="M9 7.5V5.5"/></svg>
export const REFERENCES_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: false,
  filterCategories: [
    { key: "type", label: "Type", icon: SortIcon, values: [
      { key: "link", label: "Link", icon: RefLinkIcon },
      { key: "citation", label: "Citation", icon: RefCitationIcon },
    ]},
  ],
  quickFilters: [],
  displayConfig: {
    // 2026-05-24: gallery deprecated → grid replaces. See NOTES_VIEW_CONFIG.
    supportedModes: ["list", "grid"],
    orderingOptions: [
      { value: "updatedAt", label: "Updated" },
      { value: "createdAt", label: "Created" },
      { value: "title", label: "Name" },
      { value: "fieldCount", label: "Field count" },
    ],
    groupingOptions: [
      { value: "none", label: "No grouping" },
      // B11 — lifted from local React state into viewState single-source-of-truth.
      // "type" = link vs citation derived from url field; "fieldKey" pairs with
      // a separate local `groupFieldKey` selector (which key string to group by).
      { value: "type", label: "Type" },
      { value: "fieldKey", label: "Field key" },
      // firstLetter alphabetical index — list-only (grid uses card layout).
      { value: "firstLetter", label: "Index", modes: ["list"] },
    ],
    toggles: [],
    properties: [
      { key: "fieldCount", label: "Field count", icon: SortIcon },
      { key: "image", label: "Image", icon: ContentIcon },
    ],
  },
}

// Stickers entity index view config (PR group-c-d-3).
// Stickers are cross-everything bundling markers with required color (drives
// graph hull). list+grid only. Sort by name (alpha) or memberCount (cross-
// entity). No filter categories (stickers cross all entity kinds).
// Search is handled globally via searchQuery.
// Key difference from Tags/Labels: members are cross-entity (note + wiki +
// tag/label/category/file/reference) — count semantics differ accordingly.
export const STICKERS_LIST_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: false,
  filterCategories: [
    { key: "memberStatus", label: "Members", icon: SortIcon, values: [
      { key: "has-members", label: "Has members" },
      { key: "empty", label: "Empty" },
    ]},
    { key: "memberKind", label: "Member type", icon: TagIcon, values: [
      { key: "note", label: "Note" },
      { key: "wiki", label: "Wiki" },
      { key: "tag", label: "Tag" },
      { key: "label", label: "Label" },
      { key: "category", label: "Category" },
      { key: "file", label: "File" },
      { key: "reference", label: "Reference" },
    ]},
  ],
  quickFilters: [],
  displayConfig: {
    supportedModes: ["list", "grid"],
    orderingOptions: [
      { value: "name", label: "Name" },
      { value: "memberCount", label: "Member count" },
    ],
    groupingOptions: [
      { value: "none", label: "No grouping" },
      // firstLetter alphabetical index — list-only (grid uses card layout).
      { value: "firstLetter", label: "Index", modes: ["list"] },
    ],
    toggles: [],
    properties: [
      { key: "memberCount", label: "Member count", icon: SortIcon },
      { key: "color", label: "Color", icon: ColorDotIcon },
    ],
  },
}

// books-view-engine-2: Books list/grid config. Filter on Smart vs Manual,
// which smart sources are configured, pinned state, and date.
// supportedModes = grid + list now; PR 3 will add "board" + groupBy kind/pinned,
// PR 4 will add "gallery". groupingOptions/toggles intentionally minimal until then.
export const BOOKS_VIEW_CONFIG: ViewConfig = {
  showFilter: true,
  showDisplay: true,
  showDetailPanel: false,
  filterCategories: [
    // Notes filter status sub-menu 정합 — 각 value에 icon + color.
    // BookKindIcon (cover/leading) + BookKindChip (column chip) 패턴과 동일.
    { key: "kind", label: "Kind", icon: SortIcon, values: [
      { key: "smart",  label: "Smart",  icon: <Lightning     size={14} weight="regular" className="text-[#5E6AD2] dark:text-[#7C8AE7]" /> },
      { key: "manual", label: "Manual", icon: <PencilSimple  size={14} weight="regular" className="text-muted-foreground" /> },
      { key: "hybrid", label: "Hybrid", icon: <Sparkle       size={14} weight="regular" className="text-amber-600 dark:text-amber-400" /> },
    ]},
    // Which smart source(s) are configured. "_none" surfaces pure-manual books
    // for users converging on a tidier collection (mirrors Files _none pattern).
    { key: "sourceType", label: "Smart source", icon: SourceIcon, values: [
      { key: "folder",   label: "Folder",       icon: FolderIcon },
      { key: "category", label: "Wiki Category", icon: TagIcon },
      { key: "tag",      label: "Tag",          icon: TagIcon },
      { key: "label",    label: "Label",        icon: LabelIcon },
      { key: "sticker",  label: "Sticker",      icon: <StickerIcon size={14} weight="regular" /> },
      { key: "_none",    label: "No smart source" },
    ]},
    { key: "pinned", label: "Pin", icon: PinIcon, values: [
      { key: "true",  label: "Pinned" },
      { key: "false", label: "Not pinned" },
    ]},
    { key: "updatedAt", label: "Updated", icon: CalendarIcon, values: [
      { key: "today",        label: "Today" },
      { key: "yesterday",    label: "Yesterday" },
      { key: "this-week",    label: "This week" },
      { key: "last-7-days",  label: "Last 7 days" },
      { key: "this-month",   label: "This month" },
      { key: "last-30-days", label: "Last 30 days" },
    ]},
  ],
  quickFilters: [],
  displayConfig: {
    // books-view-engine-3/4: board mode (entity-agnostic).
    // 2026-05-24: timeline mode added — Book lifespan (createdAt → updatedAt)
    // on the time axis, grouped by kind (Smart/Hybrid/Manual) by default.
    // Gallery mode deprecated (replaced by Grid) — see NOTES_VIEW_CONFIG note.
    supportedModes: ["grid", "list", "board", "timeline"],
    // Books board default = "kind" (Smart / Hybrid / Manual) — **3 column 고정
    // 보장**. Notes status / Wiki wikiStatus 패턴 정합 (영구 룰 21 — entity-
    // uniformity). 모든 board 진입 시 entity-native enum axis로 자동 분류.
    boardDefaultGroupBy: "kind",
    // L4: per-mode default groupBy. Timeline mirrors board's "kind" axis so
    // smart/manual lifespans separate visually on the time axis.
    defaultGroupByByMode: { board: "kind", timeline: "kind" },
    // Timeline Y-axis encodes time → sort by createdAt asc is canonical.
    defaultSortByMode: { timeline: { field: "createdAt", direction: "asc" } },
    orderingOptions: [
      { value: "updatedAt", label: "Updated",    labelKey: "display.ordering.updated" },
      { value: "createdAt", label: "Created",    labelKey: "display.ordering.created" },
      { value: "title",     label: "Title",      labelKey: "display.ordering.title" },
      { value: "itemCount", label: "Item count", labelKey: "books.prop.item_count" },
    ],
    groupingOptions: [
      { value: "none",   label: "No grouping", labelKey: "display.grouping.none" },
      { value: "kind",   label: "Kind",        labelKey: "books.prop.kind" },
      { value: "pinned", label: "Pin status",  labelKey: "books.group.pin_status" },
      // updatedAt time-bucket — timeline already encodes time; hide there.
      { value: "date",   label: "Updated", labelKey: "display.ordering.updated", modes: ["list", "board"] },
      // firstLetter alphabetical index — list-only.
      { value: "firstLetter", label: "Index", modes: ["list"] },
    ],
    // showTrashed toggle is handled in books-view.tsx ViewHeader actions.
    toggles: [],
    properties: [
      { key: "itemCount", label: "Item count",    labelKey: "books.prop.item_count",   icon: SortIcon },
      { key: "kind",      label: "Kind",          labelKey: "books.prop.kind",         icon: SourceIcon },
      { key: "sources",   label: "Smart sources", labelKey: "books.prop.smart_sources", icon: SourceIcon },
      { key: "pinned",    label: "Pin",           labelKey: "books.prop.pin",          icon: PinIcon },
    ],
  },
}

export const VIEW_CONFIGS: Record<string, ViewConfig> = {
  notes: NOTES_VIEW_CONFIG,
  wiki: WIKI_VIEW_CONFIG,
  "wiki-category": WIKI_CATEGORY_VIEW_CONFIG,
  "library-categories": { ...WIKI_CATEGORY_VIEW_CONFIG },
  graph: GRAPH_VIEW_CONFIG,
  inbox: INBOX_VIEW_CONFIG,
  insights: INSIGHTS_VIEW_CONFIG,
  calendar: CALENDAR_VIEW_CONFIG,
  templates: TEMPLATES_VIEW_CONFIG,
  "tags-list": TAGS_LIST_VIEW_CONFIG,
  "labels-list": LABELS_LIST_VIEW_CONFIG,
  stickers: STICKERS_LIST_VIEW_CONFIG,
  references: REFERENCES_VIEW_CONFIG,
  files: FILES_VIEW_CONFIG,
  books: BOOKS_VIEW_CONFIG,
}

/** ctx-keyed view contexts (all, pinned, stone, folder, ...) that share the
 *  same Notes pipeline / DisplayConfig. Centralizing this set lets
 *  `getViewConfigForContext` map every Notes-like ctx to NOTES_VIEW_CONFIG
 *  without enumerating each ctx string at every call site. */
const NOTES_LIKE_CTX_KEYS = new Set<ViewContextKey>([
  "all", "pinned", "stone", "brick", "keystone", "unlinked", "review",
  "folder", "tag", "label", "trash", "savedView",
])

/** Resolve a ViewContextKey to its DisplayConfig owner. Returns `null` for
 *  contexts that don't have a fully-fledged ViewConfig (e.g. `query-*` inline
 *  query blocks). Callers can fall back to default ViewState behavior.
 *
 *  Used by `normalizeViewState` (mode-aware auto-cleanup — audit L3) so the
 *  validator can ask "is this groupBy/property still valid in the current
 *  viewMode?" before keeping a stale persisted value. */
export function getViewConfigForContext(ctx: ViewContextKey): ViewConfig | null {
  if (NOTES_LIKE_CTX_KEYS.has(ctx)) return NOTES_VIEW_CONFIG
  if (ctx === "wiki") return WIKI_VIEW_CONFIG
  if (ctx === "wiki-category") return WIKI_CATEGORY_VIEW_CONFIG
  if (ctx === "library-categories") return WIKI_CATEGORY_VIEW_CONFIG
  if (ctx === "graph") return GRAPH_VIEW_CONFIG
  if (ctx === "calendar") return CALENDAR_VIEW_CONFIG
  if (ctx === "templates") return TEMPLATES_VIEW_CONFIG
  if (ctx === "tags-list") return TAGS_LIST_VIEW_CONFIG
  if (ctx === "labels-list") return LABELS_LIST_VIEW_CONFIG
  if (ctx === "stickers") return STICKERS_LIST_VIEW_CONFIG
  if (ctx === "references") return REFERENCES_VIEW_CONFIG
  if (ctx === "files") return FILES_VIEW_CONFIG
  if (ctx === "books") return BOOKS_VIEW_CONFIG
  // query-*, or any future ctx without a config — caller falls back to defaults.
  return null
}
