"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Plus as PhPlus,
  X as PhX,
  Check as PhCheck,
  Clock as PhClock,
  Link as PhLink,
  Eye as PhEye,
  FolderOpen,
  Pin as PushPin,
  CircleDashed,
  BookOpen,
  FileText,
  Type as TextT,
  CaseSensitive as TextAa,
} from "lucide-react"
import { ENTITY_ICONS } from "@/lib/entity-icons"
import type { FilterRule } from "@/lib/view-engine/types"
import type { Folder, Tag as TagType, Label } from "@/lib/types"
import { useT } from "@/lib/i18n"
import { FilterPanel, type FilterCategory, type QuickFilter } from "@/components/filter-panel"

/* ── Helpers ──────────────────────────────────────────── */

export function hasFilter(filters: FilterRule[], field: FilterRule["field"], value: string, operator: FilterRule["operator"] = "eq") {
  return filters.some((f) => f.field === field && f.operator === operator && f.value === value)
}

export function formatFilterLabel(rule: FilterRule, folderList?: Folder[], tagList?: TagType[], labelList?: Label[]): string {
  // Status
  if (rule.field === "status") return rule.value.charAt(0).toUpperCase() + rule.value.slice(1)
  // Folder
  if (rule.field === "folder" && rule.value === "_none") return "No folder"
  if (rule.field === "folder" && rule.value !== "_none" && folderList) {
    const folder = folderList.find((f) => f.id === rule.value)
    return folder ? folder.name : rule.value
  }
  // Label
  if (rule.field === "label" && rule.value === "_none") return "No label"
  if (rule.field === "label" && rule.value === "_any") return "Has label"
  if (rule.field === "label" && labelList) {
    const label = labelList.find((l) => l.id === rule.value)
    return label ? label.name : rule.value
  }
  // Tags
  if (rule.field === "tags" && rule.value === "_any") return "Has tags"
  if (rule.field === "tags" && rule.value === "_none") return "No tags"
  if (rule.field === "tags" && tagList) {
    const tag = tagList.find((t) => t.id === rule.value)
    return tag ? `#${tag.name}` : `#${rule.value}`
  }
  // Source
  if (rule.field === "source" && rule.value === "_none") return "No source"
  if (rule.field === "source") {
    const labels: Record<string, string> = { manual: "Manual", webclip: "Web clip", import: "Import", share: "Shared", api: "API" }
    return labels[rule.value] ?? rule.value
  }
  // Links
  if (rule.field === "links" && rule.operator === "eq" && rule.value === "0") return "Unlinked"
  if (rule.field === "links" && rule.operator === "gt") return `${rule.value}+ links`
  // Reads
  if (rule.field === "reads" && rule.operator === "eq" && rule.value === "0") return "Unread"
  if (rule.field === "reads" && rule.operator === "gt") return `${rule.value}+ reads`
  // Content
  if (rule.field === "content" && rule.value === "empty") return "Empty body"
  // Word count
  if (rule.field === "wordCount" && rule.operator === "lt") return `< ${rule.value} words`
  if (rule.field === "wordCount" && rule.operator === "gt") return `${rule.value}+ words`
  // Title
  if (rule.field === "title" && rule.value === "empty") return "Untitled"
  // Dates
  if (rule.field === "updatedAt" && rule.operator === "gt" && rule.value === "24h") return "Updated today"
  if (rule.field === "updatedAt" && rule.operator === "gt" && rule.value === "7d") return "Updated this week"
  if (rule.field === "updatedAt" && rule.operator === "gt" && rule.value === "30d") return "Updated this month"
  if (rule.field === "updatedAt" && rule.operator === "lt" && rule.value === "7d") return "Stale 7d+"
  if (rule.field === "updatedAt" && rule.operator === "lt" && rule.value === "30d") return "Stale 30d+"
  if (rule.field === "updatedAt" && rule.operator === "lt" && rule.value === "90d") return "Stale 90d+"
  if (rule.field === "createdAt" && rule.operator === "gt" && rule.value === "24h") return "Created today"
  if (rule.field === "createdAt" && rule.operator === "gt" && rule.value === "7d") return "Created this week"
  if (rule.field === "createdAt" && rule.operator === "gt" && rule.value === "30d") return "Created this month"
  // Pinned
  if (rule.field === "pinned" && (rule.value === "true" || rule.value === "yes")) return "Pinned"
  if (rule.field === "pinned" && (rule.value === "false" || rule.value === "no")) return "Not pinned"
  // Content
  if (rule.field === "content" && rule.value === "hasImage") return "Has images"
  if (rule.field === "content" && rule.value === "hasCode") return "Has code blocks"
  if (rule.field === "content" && rule.value === "hasTable") return "Has tables"
  if (rule.field === "content" && rule.value === "empty") return "Empty content"
  return `${rule.field}: ${rule.value}`
}

/* ── Filter chip 4-part decomposition (Linear-style) ─── */

const FIELD_INFO: Record<string, { label: string; icon: React.ReactNode }> = {
  status:         { label: "Status",    icon: <CircleDashed size={11} /> },
  folder:         { label: "Folder",    icon: <FolderOpen size={11} /> },
  label:          { label: "Label",     icon: <ENTITY_ICONS.labels size={11} /> },
  tags:           { label: "Tags",      icon: <ENTITY_ICONS.tags size={11} /> },
  source:         { label: "Source",    icon: <FileText size={11} /> },
  updatedAt:      { label: "Updated",   icon: <PhClock size={11} /> },
  createdAt:      { label: "Created",   icon: <PhClock size={11} /> },
  links:          { label: "Links",     icon: <PhLink size={11} /> },
  reads:          { label: "Reads",     icon: <PhEye size={11} /> },
  pinned:         { label: "Pinned",    icon: <PushPin size={11} /> },
  wikiRegistered: { label: "Wiki",      icon: <BookOpen size={11} /> },
  content:        { label: "Content",   icon: <FileText size={11} /> },
  title:          { label: "Title",     icon: <TextT size={11} /> },
  wordCount:      { label: "Words",     icon: <TextAa size={11} /> },
  category:       { label: "Category",  icon: <ENTITY_ICONS.categories size={11} /> },
  wikiTier:       { label: "Hierarchy", icon: <PhLink size={11} /> },
  connectedTo:    { label: "Connected", icon: <PhLink size={11} /> },
}

export function formatFilterChip(
  rule: FilterRule,
  folderList?: Folder[],
  tagList?: TagType[],
  labelList?: Label[],
  /** Optional translator — wire from `useT()` in a React caller so the
   *  chip respects the active locale. Falls back to English labels. */
  t?: (key: string) => string,
): { icon: React.ReactNode | null; fieldLabel: string; operatorLabel: string; valueLabel: string } {
  const info = FIELD_INFO[rule.field]
  const fieldLabel = info?.label ?? rule.field.charAt(0).toUpperCase() + rule.field.slice(1)
  const icon = info?.icon ?? null

  // Operator
  let operatorLabel = "is"
  const isDate = rule.field === "updatedAt" || rule.field === "createdAt"
  if (rule.operator === "neq") operatorLabel = "is not"
  else if (rule.operator === "lt") operatorLabel = isDate ? "older than" : "<"
  else if (rule.operator === "gt") operatorLabel = isDate ? "within" : ">"

  // Value
  const valueLabel = (() => {
    if (rule.field === "status") return rule.value.charAt(0).toUpperCase() + rule.value.slice(1)
    if (rule.field === "folder") {
      if (rule.value === "_none") return "None"
      const f = folderList?.find((x) => x.id === rule.value)
      return f?.name ?? rule.value
    }
    if (rule.field === "label") {
      if (rule.value === "_none") return "None"
      if (rule.value === "_any") return "Any"
      const l = labelList?.find((x) => x.id === rule.value)
      return l?.name ?? rule.value
    }
    if (rule.field === "tags") {
      if (rule.value === "_none") return "None"
      if (rule.value === "_any") return "Any"
      const t = tagList?.find((x) => x.id === rule.value)
      return t ? `#${t.name}` : rule.value
    }
    if (rule.field === "source") {
      if (rule.value === "_none") return "None"
      const map: Record<string, string> = { manual: "Manual", webclip: "Web clip", import: "Import" }
      return map[rule.value] ?? rule.value
    }
    if (rule.field === "links") {
      const map: Record<string, string> = { _any: "Any", _none: "None", _orphan: "Orphan", backlinks: "Has backlinks" }
      if (map[rule.value]) return map[rule.value]
      if (rule.value.endsWith("+")) return rule.value
      return rule.value
    }
    if (rule.field === "pinned") {
      if (rule.value === "true" || rule.value === "yes") return "Yes"
      if (rule.value === "false" || rule.value === "no") return "No"
      return rule.value
    }
    if (rule.field === "wikiRegistered") {
      if (rule.value === "true") return t ? t("filter.value.wiki.in") : "In a wiki article"
      if (rule.value === "false") return t ? t("filter.value.wiki.not_in") : "Not in any wiki article"
      return rule.value
    }
    if (rule.field === "connectedTo") {
      // value format "<noteId>:<direction>". Show note title + direction badge.
      const [targetId, dirRaw] = rule.value.split(":")
      const dir = dirRaw === "in" ? "← in" : dirRaw === "out" ? "out →" : "↔ both"
      // Hop into the store synchronously (cheap for a single id lookup).
      // Falls back to id-substring if the note has been deleted/renamed.
      let title: string = targetId
      try {
        const state = (typeof window !== "undefined" && (window as any).__plotStore)
          ? (window as any).__plotStore.getState()
          : null
        if (state) {
          const n = state.notes?.find((x: { id: string; title?: string }) => x.id === targetId)
          if (n?.title) title = n.title
          else {
            const w = state.wikiArticles?.find((x: { id: string; title?: string }) => x.id === targetId)
            if (w?.title) title = w.title
          }
        }
      } catch {}
      const short = title.length > 18 ? title.slice(0, 17) + "…" : title
      return `${short} (${dir})`
    }
    if (rule.field === "content") {
      const map: Record<string, string> = { empty: "Empty", hasImage: "Has images", hasCode: "Has code", hasTable: "Has tables" }
      return map[rule.value] ?? rule.value
    }
    if (rule.field === "title") {
      if (rule.value === "empty") return "Untitled"
      if (rule.value === "_aliased") return "Has aliases"
      if (rule.value === "_unaliased") return "No aliases"
      return rule.value
    }
    if (isDate) {
      const map: Record<string, string> = {
        today: "Today", yesterday: "Yesterday",
        "this-week": "This week", "this-month": "This month",
        "last-7-days": "Last 7 days", "last-30-days": "Last 30 days",
        stale: "Stale (30d+)",
      }
      return map[rule.value] ?? rule.value
    }
    if (rule.field === "wikiTier") {
      const map: Record<string, string> = { _root: "Root", _parent: "Parent", _child: "Child", _solo: "Solo" }
      return map[rule.value] ?? rule.value
    }
    if (rule.field === "category") {
      return rule.value === "_none" ? "None" : rule.value
    }
    return rule.value
  })()

  return { icon, fieldLabel, operatorLabel, valueLabel }
}

/* ── FilterChipBar (below toolbar, only when active) ── */

interface FilterChipBarProps {
  filters: FilterRule[]
  folders: Folder[]
  tags: TagType[]
  labels?: Label[]
  onRemoveFilter: (idx: number) => void
  onClearAll: () => void
  /** Update a single rule in place. Used by chips that support inline
   *  editing (e.g. connectedTo direction toggle). Optional so legacy
   *  callers without inline-edit support still compile. */
  onUpdateFilter?: (idx: number, rule: FilterRule) => void

  /* ── "+ Add more" → schema-driven FilterPanel (A3.3 M5) ──
   *  The chip bar's add-more dropdown now mounts the same FilterPanel the
   *  toolbar Filter button uses, fed by the entity's schema-generated
   *  categories. This replaces the legacy hardcoded FilterMenuItems so a
   *  single filter UI drives both surfaces. All four are optional so a
   *  caller that hasn't wired them yet simply hides the add-more button. */
  /** Schema-generated categories (same array passed to the toolbar FilterPanel). */
  filterCategories?: FilterCategory[]
  /** Toggle a single rule on/off (FilterPanel's `onToggle`). */
  onToggleRule?: (rule: FilterRule) => void
  /** Quick-filter presets surfaced at the top of the panel. */
  quickFilters?: QuickFilter[]
  /** Apply a quick-filter preset's whole rule set. */
  onQuickFilter?: (rules: FilterRule[]) => void
}

export function FilterChipBar({
  filters,
  folders,
  tags,
  labels = [],
  onRemoveFilter,
  onClearAll,
  onUpdateFilter,
  filterCategories,
  onToggleRule,
  quickFilters,
  onQuickFilter,
}: FilterChipBarProps) {
  const t = useT()
  if (filters.length === 0) return null

  // Only show the schema-driven "+ Add more" when the caller wired both the
  // categories and a toggle handler — otherwise there's nothing to add.
  const canAddMore = !!filterCategories && !!onToggleRule

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border px-5 py-2">
      {/* Active filter chips — Linear-style 4-part: [icon] field | op | value | × */}
      {filters.map((f, i) => {
        const parts = formatFilterChip(f, folders, tags, labels, t)
        // Inline-editable: connectedTo direction (Both / In / Out).
        // Step A of the broader chip-editing roadmap — same pattern can
        // extend to status/folder/label values in a follow-up.
        const isConnectedTo = f.field === "connectedTo" && !!onUpdateFilter
        return (
          <div
            key={i}
            className="inline-flex items-stretch overflow-hidden rounded-md border border-accent/30 bg-accent/[0.10] text-2xs font-medium leading-none"
          >
            {/* field + icon */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-accent">
              {parts.icon}
              <span>{parts.fieldLabel}</span>
            </span>
            <span className="w-px self-stretch bg-accent/25" aria-hidden />
            {/* operator */}
            <span className="inline-flex items-center px-1.5 py-0.5 text-accent/60">{parts.operatorLabel}</span>
            <span className="w-px self-stretch bg-accent/25" aria-hidden />
            {/* value (inline-editable for connectedTo) */}
            {isConnectedTo ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center px-2 py-0.5 text-accent hover:bg-accent/15 transition-colors cursor-pointer"
                    title="Click to change direction"
                  >
                    {parts.valueLabel}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-44 p-1">
                  {(["both", "in", "out"] as const).map((dir) => {
                    const [targetId, currentDir] = f.value.split(":")
                    const isCurrent = (currentDir || "both") === dir
                    const labels = { both: "↔ Both directions", in: "← Backlinks only", out: "→ Links out only" }
                    return (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => onUpdateFilter?.(i, { ...f, value: `${targetId}:${dir}` })}
                        className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-note text-left rounded hover:bg-accent ${isCurrent ? "font-medium text-foreground" : "text-foreground/80"}`}
                      >
                        {labels[dir]}
                        {isCurrent && <PhCheck className="ml-auto text-accent" size={12} strokeWidth={2.5} />}
                      </button>
                    )
                  })}
                </PopoverContent>
              </Popover>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 text-accent">{parts.valueLabel}</span>
            )}
            <span className="w-px self-stretch bg-accent/25" aria-hidden />
            {/* remove */}
            <button
              onClick={() => onRemoveFilter(i)}
              className="inline-flex items-center px-1.5 py-0.5 text-accent/60 hover:bg-accent/25 hover:text-accent transition-colors"
              aria-label="Remove filter"
            >
              <PhX size={10} />
            </button>
          </div>
        )
      })}

      {/* + Add more — schema-driven FilterPanel (mirrors the toolbar Filter
          button, which mounts the same FilterPanel inside a Popover). Popover
          (not DropdownMenu) so FilterPanel's own hover/side-by-side row UI
          isn't fighting Radix menu roving-focus. */}
      {canAddMore && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center justify-center rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground">
              <PhPlus size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={5}
            className="!w-auto !max-w-none rounded-lg border border-border-subtle bg-surface-overlay p-0 shadow-lg"
          >
            <FilterPanel
              categories={filterCategories!}
              activeFilters={filters}
              onToggle={onToggleRule!}
              quickFilters={quickFilters}
              onQuickFilter={onQuickFilter ? (rules) => onQuickFilter(rules as FilterRule[]) : undefined}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Clear — right aligned */}
      <div className="ml-auto">
        <button
          onClick={onClearAll}
          className="border-none bg-transparent px-1 py-0.5 text-2xs text-muted-foreground/70 transition-colors hover:text-muted-foreground"
        >
          Clear all
        </button>
      </div>
    </div>
  )
}
