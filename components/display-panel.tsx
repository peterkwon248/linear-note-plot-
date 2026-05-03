"use client"

import type { SortField, GroupBy, GroupSortBy, ViewMode, ViewState, SortRule } from "@/lib/view-engine/types"
import { MAX_SORT_RULES } from "@/lib/view-engine/types"
import type { ReactNode } from "react"
import { List } from "@phosphor-icons/react/dist/ssr/List"
import { Kanban } from "@phosphor-icons/react/dist/ssr/Kanban"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { ChartLine } from "@phosphor-icons/react/dist/ssr/ChartLine"
import { SortAscending } from "@phosphor-icons/react/dist/ssr/SortAscending"
import { SortDescending } from "@phosphor-icons/react/dist/ssr/SortDescending"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { ChipDropdown } from "@/components/ui/chip-dropdown"

export interface DisplayConfig {
  orderingOptions: { value: SortField; label: string }[]
  groupingOptions: { value: GroupBy; label: string }[]
  toggles: DisplayToggle[]
  properties: DisplayProperty[]
  supportedModes?: ViewMode[]
  /** Default groupBy when switching to board mode from groupBy="none".
   *  Notes default to "status" (canonical board axis); Wiki has no status,
   *  so it sets "label" (Category). DisplayPanel reads this on the
   *  list→board mode switch. */
  boardDefaultGroupBy?: GroupBy
}

export interface DisplayToggle {
  key: string
  label: string
  icon?: ReactNode
}

export interface DisplayProperty {
  key: string
  label: string
  icon?: ReactNode
}

interface DisplayPanelProps {
  config: DisplayConfig
  viewState: ViewState
  onViewStateChange: (patch: Partial<ViewState>) => void
  /** Toggle states for view-specific toggles (showArchived, showTrashed, etc.) */
  toggleStates?: Record<string, boolean>
  onToggleChange?: (key: string, value: boolean) => void
  /** Show List/Board view mode switcher */
  showViewMode?: boolean
}

/* ── Icons ─────────────────────────────────────────────── */

export const ArchiveIcon = () => (
  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="2" width="13" height="3" rx="1" />
    <path d="M2.5 5v8a1.3 1.3 0 001.3 1.3h8.4A1.3 1.3 0 0013.5 13V5" />
    <line x1="6" y1="8.5" x2="10" y2="8.5" />
  </svg>
)

export const TrashIcon = () => (
  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2 4 3.3 4 14 4" />
    <path d="M12.7 4v9a1.3 1.3 0 01-1.4 1.3H4.7A1.3 1.3 0 013.3 13V4m2 0V2.7a1.3 1.3 0 011.4-1.4h2.6a1.3 1.3 0 011.4 1.4V4" />
  </svg>
)

export const SortIcon = () => (
  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
    <line x1="2.5" y1="4" x2="10" y2="4" />
    <line x1="2.5" y1="8" x2="7.5" y2="8" />
    <line x1="2.5" y1="12" x2="5" y2="12" />
  </svg>
)

/* ── Mode config helpers ────────────────────────────────── */

const MODE_DEFS: { mode: ViewMode; icon: ReactNode; label: string }[] = [
  { mode: "list",     icon: <List size={14} weight="regular" />,     label: "List" },
  { mode: "board",    icon: <Kanban size={14} weight="regular" />,   label: "Board" },
  { mode: "graph",    icon: <Graph size={14} weight="regular" />,    label: "Graph" },
  { mode: "insights", icon: <ChartLine size={14} weight="regular" />, label: "Insights" },
]

function resolveViewMode(viewMode: ViewMode): ViewMode {
  // Just pass through — caller decides what's valid for their context.
  return viewMode
}

/* ── DisplayPanel ───────────────────────────────────────── */

export function DisplayPanel({
  config,
  viewState,
  onViewStateChange,
  toggleStates = {},
  onToggleChange,
  showViewMode,
}: DisplayPanelProps) {
  const supportedModes = config.supportedModes ?? (["list", "board"] as ViewMode[])
  const currentMode = resolveViewMode(viewState.viewMode)
  const isBoard = currentMode === "board"

  /* ── Grouping options ── */
  // "family" is List-only — exclude from Board column selector
  const groupingOptions = (config.groupingOptions ?? []).filter(
    (o) => !(isBoard && o.value === "family")
  )
  const subGroupOptions = groupingOptions.filter(
    (o) => o.value !== viewState.groupBy && o.value !== "family"
  )
  // Grouping 드롭다운에서 현재 subGroupBy 값을 disabled로 표시 (none은 항상 허용)
  const disabledGroupByValues = viewState.subGroupBy && viewState.subGroupBy !== "none"
    ? [viewState.subGroupBy]
    : []

  /* ── Sub-group order options ── */
  const groupOrderOptions: { value: GroupSortBy; label: string }[] = [
    { value: "default", label: "Default" },
    { value: "manual", label: "Manual" },
    { value: "name", label: "Name" },
    { value: "count", label: "Count" },
  ]

  /* ── Mode-specific section label ── */
  const optionsSectionLabel = isBoard
    ? "Board options"
    : "List options"

  function handlePropertyToggle(key: string) {
    const current = viewState.visibleColumns
    const newColumns = current.includes(key)
      ? current.filter((c) => c !== key)
      : [...current, key]
    onViewStateChange({ visibleColumns: newColumns })
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* ── Section 0: View Mode (List / Board) ── */}
      {showViewMode && (
        <>
          <div className="flex rounded-lg border border-border-subtle bg-card p-0.5">
            {MODE_DEFS.filter((d) => supportedModes.includes(d.mode)).map((def) => {
              const isActive = currentMode === def.mode
              return (
                <button
                  key={def.mode}
                  onClick={() => {
                    const patch: Partial<ViewState> = { viewMode: def.mode as ViewMode }
                    // Board needs a non-"none" groupBy — fall back to the
                    // config's preferred axis. Notes default to "status",
                    // Wiki to "label" (Category). Per-config so Wiki users
                    // don't end up with an empty status-grouped board (Wiki
                    // has no status field).
                    if (def.mode === "board" && viewState.groupBy === "none") {
                      patch.groupBy = config.boardDefaultGroupBy ?? "status"
                    }
                    onViewStateChange(patch)
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-note font-medium transition-all ${
                    isActive
                      ? "bg-active-bg-strong text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {def.icon}
                  {def.label}
                </button>
              )
            })}
          </div>
          <hr className="border-border-subtle" />
        </>
      )}

      {/* ── Section 1: Grouping / Columns ── */}
      {groupingOptions.length > 0 && (
        <>
          {isBoard ? (
            /* Board: Columns (required) + Rows (sub-group) + Group order */
            <>
              <div className="flex items-center justify-between">
                <span className="text-note text-muted-foreground">Columns</span>
                <ChipDropdown<GroupBy>
                  value={viewState.groupBy}
                  options={groupingOptions}
                  onChange={(v) => {
                    const patch: Partial<ViewState> = { groupBy: v }
                    if (v === viewState.subGroupBy) patch.subGroupBy = "none"
                    onViewStateChange(patch)
                  }}
                  disabledValues={["none" as GroupBy, ...(disabledGroupByValues as GroupBy[])]}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-note text-muted-foreground">Rows</span>
                <ChipDropdown<GroupBy>
                  value={viewState.subGroupBy ?? "none"}
                  options={subGroupOptions}
                  onChange={(v) => onViewStateChange({ subGroupBy: v })}
                />
              </div>
              {viewState.subGroupBy && viewState.subGroupBy !== "none" && (
                <div className="flex items-center justify-between pl-3">
                  <span className="text-2xs text-muted-foreground/60">Group order</span>
                  <ChipDropdown<GroupSortBy>
                    value={viewState.subGroupSortBy ?? "default"}
                    options={groupOrderOptions}
                    onChange={(v) => onViewStateChange({ subGroupSortBy: v })}
                  />
                </div>
              )}
            </>
          ) : (
            /* List: Grouping + optional Sub-grouping */
            <>
              <div className="flex items-center justify-between">
                <span className="text-note text-muted-foreground">Grouping</span>
                <ChipDropdown<GroupBy>
                  value={viewState.groupBy}
                  options={groupingOptions}
                  onChange={(v) => {
                    const patch: Partial<ViewState> = { groupBy: v }
                    if (v === viewState.subGroupBy) patch.subGroupBy = "none"
                    onViewStateChange(patch)
                  }}
                  disabledValues={disabledGroupByValues as GroupBy[]}
                />
              </div>
              {viewState.groupBy !== "none" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-note text-muted-foreground">Sub-grouping</span>
                    <ChipDropdown<GroupBy>
                      value={viewState.subGroupBy ?? "none"}
                      options={subGroupOptions}
                      onChange={(v) => onViewStateChange({ subGroupBy: v })}
                    />
                  </div>
                  {viewState.subGroupBy && viewState.subGroupBy !== "none" && (
                    <div className="flex items-center justify-between pl-3">
                      <span className="text-2xs text-muted-foreground/60">Group order</span>
                      <ChipDropdown<GroupSortBy>
                        value={viewState.subGroupSortBy ?? "default"}
                        options={groupOrderOptions}
                        onChange={(v) => onViewStateChange({ subGroupSortBy: v })}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── Section 2: Ordering (multi-sort chain) ── */}
      {(() => {
        // Resolve current sort chain — fall back to legacy single-field shape if absent
        const sortFields: SortRule[] = (Array.isArray(viewState.sortFields) && viewState.sortFields.length > 0)
          ? viewState.sortFields
          : [{ field: viewState.sortField, direction: viewState.sortDirection }]

        const orderingValues = config.orderingOptions.map(o => o.value)

        function updateRuleAt(idx: number, patch: Partial<SortRule>) {
          const next = sortFields.map((r, i) => i === idx ? { ...r, ...patch } : r)
          onViewStateChange({ sortFields: next })
        }

        function removeRuleAt(idx: number) {
          if (sortFields.length <= 1) return
          const next = sortFields.filter((_, i) => i !== idx)
          onViewStateChange({ sortFields: next })
        }

        function addRule() {
          if (sortFields.length >= MAX_SORT_RULES) return
          // Pick the first ordering option not already used
          const used = new Set(sortFields.map(r => r.field))
          const nextField = orderingValues.find(v => !used.has(v)) ?? orderingValues[0]
          const next: SortRule[] = [...sortFields, { field: nextField, direction: "desc" }]
          onViewStateChange({ sortFields: next })
        }

        return (
          <div className="flex flex-col gap-1.5">
            {sortFields.map((rule, idx) => {
              // Disable already-used fields (except current row's own value)
              const usedElsewhere = sortFields
                .filter((_, i) => i !== idx)
                .map(r => r.field)
              return (
                <div key={`${idx}-${rule.field}`} className="flex items-center justify-between">
                  <span className="text-note text-muted-foreground">
                    {idx === 0 ? "Ordering" : idx === 1 ? "Then by" : "Then by"}
                  </span>
                  <div className="flex items-center gap-1">
                    <ChipDropdown<SortField>
                      value={rule.field}
                      options={config.orderingOptions}
                      onChange={(v) => updateRuleAt(idx, { field: v })}
                      disabledValues={usedElsewhere as SortField[]}
                    />
                    <button
                      onClick={() => updateRuleAt(idx, { direction: rule.direction === "asc" ? "desc" : "asc" })}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border-subtle bg-surface-overlay text-muted-foreground hover:text-foreground transition-colors"
                      title={rule.direction === "asc" ? "Ascending" : "Descending"}
                    >
                      {rule.direction === "asc" ? <SortAscending size={12} weight="regular" /> : <SortDescending size={12} weight="regular" />}
                    </button>
                    {idx > 0 && (
                      <button
                        onClick={() => removeRuleAt(idx)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg transition-colors"
                        title="Remove sort"
                      >
                        <PhX size={11} weight="regular" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {sortFields.length < MAX_SORT_RULES && sortFields.length < orderingValues.length && (
              <button
                onClick={addRule}
                className="self-end inline-flex items-center gap-1 px-2 py-1 rounded-md text-2xs text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
              >
                <PhPlus size={11} weight="regular" />
                Add sort
              </button>
            )}
          </div>
        )
      })()}

      {/* ── Section 3: Mode-specific options (toggles) ── */}
      {config.toggles.length > 0 && (
        <>
          <hr className="border-border-subtle" />
          <div className="flex flex-col gap-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-accent/80 mb-0">
              {optionsSectionLabel}
            </p>
            {config.toggles.map((toggle) => {
              // filterAwareRole is only meaningful when groupBy === "role"
              if (toggle.key === "filterAwareRole" && viewState.groupBy !== "role") return null
              return (
                <div key={toggle.key} className="flex items-center gap-2">
                  {toggle.icon && (
                    <span className="text-muted-foreground shrink-0">
                      {toggle.icon}
                    </span>
                  )}
                  <ToggleSwitch
                    label={toggle.label}
                    checked={
                      toggle.key === "showEmptyGroups"
                        ? !!viewState.showEmptyGroups
                        : !!toggleStates[toggle.key]
                    }
                    onCheckedChange={() => {
                      if (toggle.key === "showEmptyGroups") {
                        onViewStateChange({ showEmptyGroups: !viewState.showEmptyGroups })
                      } else {
                        onToggleChange?.(toggle.key, !toggleStates[toggle.key])
                      }
                    }}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Section 5: Display properties ── */}
      {config.properties.length > 0 && (
        <>
          <hr className="border-border-subtle" />
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-accent/80 mb-2.5">
              Display properties
            </p>
            <div className="flex flex-wrap gap-1.5">
              {config.properties.map((prop) => {
                // Special: showAlphaIndex is a display-mode flag stored in
                // viewState.toggles, not a column in visibleColumns. Route the
                // chip click through the same toggle channel as LIST OPTIONS.
                if (prop.key === "showAlphaIndex") {
                  const active = !!toggleStates["showAlphaIndex"]
                  return (
                    <button
                      key={prop.key}
                      onClick={() => onToggleChange?.("showAlphaIndex", !active)}
                      className={[
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-2xs font-medium transition-colors",
                        active
                          ? "border-accent/30 bg-accent/[0.14] text-accent/90"
                          : "border-border-subtle bg-transparent text-muted-foreground",
                      ].join(" ")}
                    >
                      {prop.icon && <span className="shrink-0">{prop.icon}</span>}
                      {prop.label}
                    </button>
                  )
                }
                const active = viewState.visibleColumns.includes(prop.key)
                return (
                  <button
                    key={prop.key}
                    onClick={() => handlePropertyToggle(prop.key)}
                    className={[
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-2xs font-medium transition-colors",
                      active
                        ? "border-accent/30 bg-accent/[0.14] text-accent/90"
                        : "border-border-subtle bg-transparent text-muted-foreground",
                    ].join(" ")}
                  >
                    {prop.icon && <span className="shrink-0">{prop.icon}</span>}
                    {prop.label}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
