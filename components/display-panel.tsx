"use client"

import { useState } from "react"
import type { SortField, GroupBy, GroupSortBy, ViewMode, ViewState } from "@/lib/view-engine/types"
import type { ReactNode } from "react"

export interface DisplayConfig {
  orderingOptions: { value: SortField; label: string }[]
  groupingOptions: { value: GroupBy; label: string }[]
  toggles: DisplayToggle[]
  properties: DisplayProperty[]
  supportedModes?: ViewMode[]
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

/* ── View mode icons ── */

const ListIcon = () => (
  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <line x1="2.5" y1="4" x2="13.5" y2="4" />
    <line x1="2.5" y1="8" x2="13.5" y2="8" />
    <line x1="2.5" y1="12" x2="13.5" y2="12" />
  </svg>
)

const BoardIcon = () => (
  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="2" width="4" height="12" rx="1" />
    <rect x="6" y="2" width="4" height="9" rx="1" />
    <rect x="10.5" y="2" width="4" height="7" rx="1" />
  </svg>
)

/* ── Icons ─────────────────────────────────────────────── */

const ChevronDown = () => (
  <svg width={10} height={10} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 6 8 10 12 6" />
  </svg>
)

const CheckIcon = () => (
  <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 8.5 6.5 12 13 5" />
  </svg>
)

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

const SortAscIcon = () => (
  <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="12" x2="8" y2="4" />
    <polyline points="4 8 8 4 12 8" />
  </svg>
)

const SortDescIcon = () => (
  <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="4" x2="8" y2="12" />
    <polyline points="4 8 8 12 12 8" />
  </svg>
)

/* ── Toggle component ───────────────────────────────────── */

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="relative w-[34px] h-5 rounded-full shrink-0 transition-colors duration-200"
      style={{ background: on ? "#5e6ad2" : "rgba(255,255,255,0.12)" }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-[left] duration-200"
        style={{
          left: on ? 16 : 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        }}
      />
    </button>
  )
}

/* ── Dropdown component ─────────────────────────────────── */

function ChipDropdown<T extends string>({
  value,
  options,
  onChange,
  disabledValues,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  disabledValues?: T[]
}) {
  const [open, setOpen] = useState(false)
  const currentLabel = options.find((o) => o.value === value)?.label ?? value

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/80 bg-surface-overlay text-note font-medium"
      >
        {currentLabel}
        <ChevronDown />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-md border border-border/80 bg-surface-overlay py-1 shadow-lg">
            {options.map((opt) => {
              const disabled = disabledValues?.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (!disabled) {
                      onChange(opt.value)
                      setOpen(false)
                    }
                  }}
                  disabled={disabled}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-note ${
                    disabled
                      ? "text-muted-foreground/30 cursor-not-allowed"
                      : "hover:bg-hover-bg"
                  }`}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && (
                    <span className="text-accent">
                      <CheckIcon />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Mode config helpers ────────────────────────────────── */

const MODE_DEFS: { mode: ViewMode; icon: () => ReactNode; label: string }[] = [
  { mode: "list", icon: ListIcon, label: "List" },
  { mode: "board", icon: BoardIcon, label: "Board" },
]

function resolveViewMode(viewMode: ViewMode): "list" | "board" {
  if (viewMode === "board") return "board"
  return "list"
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
  const groupingOptions = config.groupingOptions ?? []
  const subGroupOptions = groupingOptions.filter((o) => o.value !== viewState.groupBy)
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
          <div className="flex rounded-lg border border-border/80 bg-card p-0.5">
            {MODE_DEFS.filter((d) => supportedModes.includes(d.mode)).map((def) => {
              const isActive = currentMode === def.mode
              const Icon = def.icon
              return (
                <button
                  key={def.mode}
                  onClick={() => {
                    const patch: Partial<ViewState> = { viewMode: def.mode as ViewMode }
                    // Board needs groupBy — fallback to status if none
                    if (def.mode === "board" && viewState.groupBy === "none") {
                      patch.groupBy = "status"
                    }
                    onViewStateChange(patch)
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-note font-medium transition-all ${
                    isActive
                      ? "bg-active-bg-strong text-foreground shadow-sm"
                      : "text-muted-foreground/60 hover:text-muted-foreground"
                  }`}
                >
                  <Icon />
                  {def.label}
                </button>
              )
            })}
          </div>
          <hr className="border-border/60" />
        </>
      )}

      {/* ── Section 1: Grouping / Columns ── */}
      {groupingOptions.length > 0 && (
        <>
          {isBoard ? (
            /* Board: Columns만 표시 (Rows/Group order는 board에서 미지원) */
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

      {/* ── Section 2: Ordering + Sort direction ── */}
      <div className="flex items-center justify-between">
        <span className="text-note text-muted-foreground">Ordering</span>
        <div className="flex items-center gap-1">
          <ChipDropdown<SortField>
            value={viewState.sortField}
            options={config.orderingOptions}
            onChange={(v) => onViewStateChange({ sortField: v })}
          />
          <button
            onClick={() =>
              onViewStateChange({
                sortDirection: viewState.sortDirection === "asc" ? "desc" : "asc",
              })
            }
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border/80 bg-surface-overlay text-muted-foreground hover:text-foreground transition-colors"
            title={viewState.sortDirection === "asc" ? "Ascending" : "Descending"}
          >
            {viewState.sortDirection === "asc" ? <SortAscIcon /> : <SortDescIcon />}
          </button>
        </div>
      </div>

      {/* ── Section 3: Built-in toggles (always shown) ── */}
      <hr className="border-border/60" />
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-note flex-1">Order permanent by recency</span>
          <Toggle
            on={!!viewState.orderPermanentByRecency}
            onChange={() =>
              onViewStateChange({
                orderPermanentByRecency: !viewState.orderPermanentByRecency,
              })
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-note flex-1">Show thread</span>
          <Toggle
            on={!!viewState.showThread}
            onChange={() =>
              onViewStateChange({ showThread: !viewState.showThread })
            }
          />
        </div>
      </div>

      {/* ── Section 4: Mode-specific toggles ── */}
      {config.toggles.length > 0 && (
        <>
          <hr className="border-border/60" />
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-medium text-muted-foreground/50 mb-0">
              {optionsSectionLabel}
            </p>
            {config.toggles.map((toggle) => (
              <div key={toggle.key} className="flex items-center gap-2">
                {toggle.icon && (
                  <span className="text-muted-foreground/50 shrink-0">
                    {toggle.icon}
                  </span>
                )}
                <span className="text-note flex-1">{toggle.label}</span>
                <Toggle
                  on={
                    toggle.key === "showEmptyGroups"
                      ? !!viewState.showEmptyGroups
                      : !!toggleStates[toggle.key]
                  }
                  onChange={() => {
                    if (toggle.key === "showEmptyGroups") {
                      onViewStateChange({ showEmptyGroups: !viewState.showEmptyGroups })
                    } else {
                      onToggleChange?.(toggle.key, !toggleStates[toggle.key])
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Section 5: Display properties ── */}
      {config.properties.length > 0 && (
        <>
          <hr className="border-border/60" />
          <div>
            <p className="text-xs font-medium text-muted-foreground/50 mb-2.5">
              Display properties
            </p>
            <div className="flex flex-wrap gap-1.5">
              {config.properties.map((prop) => {
                const active = viewState.visibleColumns.includes(prop.key)
                return (
                  <button
                    key={prop.key}
                    onClick={() => handlePropertyToggle(prop.key)}
                    className={[
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors",
                      active
                        ? "border-accent/30 bg-accent/[0.14] text-accent/90"
                        : "border-border/80 bg-transparent text-muted-foreground",
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
