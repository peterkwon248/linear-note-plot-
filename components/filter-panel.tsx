"use client"

import React, { useMemo, useState, useRef, useCallback } from "react"
import type { ReactNode } from "react"
import type { FilterRule, FilterField } from "@/lib/view-engine/types"
import { useT } from "@/lib/i18n"

/* ── Linear 5규칙 — opacity 위계 클래스 레이어 (A3.3-E2 S5) ───────────
 * 라벨 > 아이콘 > 힌트·카운트 의 3-단 명도 사다리를 *구조적으로* 고정한다.
 * 정확한 0.9 / 0.7 / 0.5 LCH 값은 A3.1(LCH paired 토큰)의 몫 — 여기서는
 * 기존 text-foreground / text-muted-foreground 이산색을 유지하되, 세 tier가
 * 별도 클래스로 분리돼 존재하도록만 한다. 하드 opacity(/50)는 잠정값이며
 * A3.1에서 토큰으로 치환된다 (각 사용처에 주석 표기). */
// tier 1 — 라벨 (활성 행의 최상위 명도). A3.1: LCH 0.9 token 예정.
const TONE_LABEL_ACTIVE = "text-foreground font-medium"
const TONE_LABEL_IDLE = "text-muted-foreground"
// tier 2 — 아이콘 (라벨보다 한 단 흐림). A3.1: LCH 0.7 token 예정.
const TONE_ICON_ACTIVE = "text-foreground"
const TONE_ICON_IDLE = "text-muted-foreground"
// tier 3 — 힌트·카운트·chevron (최하 명도). A3.1: LCH 0.5 token 예정.
const TONE_HINT = "text-muted-foreground/50" /* A3.1: LCH token 예정 */

/* ── Inline SVG Icons ───────────────────────────────────── */

const SparkleIcon = () => (
  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1l1.8 4.8L14.5 7l-4.7 1.2L8 13l-1.8-4.8L1.5 7l4.7-1.2z" />
  </svg>
)

const ChevronRightSmall = () => (
  <svg width={11} height={11} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 4 10 8 6 12" />
  </svg>
)

const CheckIcon = () => (
  <svg width={11} height={11} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 8.5 6.5 12 13 5" />
  </svg>
)

/* ── Types ──────────────────────────────────────────────── */

export interface FilterValue {
  key: string
  label: string
  /** Optional i18n key — when set, FilterPanel renders `t(labelKey)`. */
  labelKey?: string
  color?: string
  count?: number
  icon?: ReactNode
  /** Sub-section header — when set, rendered as a small group label
   *  before the first value of each group. Values must be pre-sorted
   *  by group. Used by Ontology Status filter (Note / Wiki / Book). */
  group?: string
}

// (FilterValue extended in lib/view-engine/view-configs.tsx with optional
// `group` field for sub-section headers — kept loosely typed here since
// filter-panel imports its own minimal shape.)

export interface FilterCategory {
  key: string
  label: string
  labelKey?: string
  icon: ReactNode
  values: FilterValue[]
  /** 6-category cluster (workflow / classification / relations / metrics /
   *  time / content). Emitted by the schema adapter (view-configs.tsx
   *  FilterCategory.category, A3.3-E1). Drives the category dividers below
   *  (A3.3-E2 S3): a divider is rendered whenever this changes between two
   *  consecutive visible rows. Optional + loosely typed (string) since the
   *  remaining hand-written Tier-3 configs omit it — those render with no
   *  dividers (treated as one uncategorized run). */
  category?: string
}

export interface QuickFilter {
  label: string
  labelKey?: string
  desc: string
  descKey?: string
  rules: FilterRule[]
}

export interface FilterPanelProps {
  categories: FilterCategory[]
  activeFilters: FilterRule[]
  onToggle: (rule: FilterRule) => void
  quickFilters?: QuickFilter[]
  onQuickFilter?: (rules: FilterRule[]) => void
}

/* ── Checkbox ──────────────────────────────────────────── */

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={[
        "w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0 transition-all shadow-sm",
        checked
          ? "bg-accent border-transparent opacity-100 text-accent-foreground"
          : "border border-zinc-400 dark:border-zinc-600 bg-card opacity-0 group-hover/row:opacity-100",
      ].join(" ")}
    >
      {checked && <CheckIcon />}
    </div>
  )
}

/* ── FilterPanel (Linear-style: side-by-side panels) ───── */

export function FilterPanel({
  categories,
  activeFilters,
  onToggle,
  quickFilters,
  onQuickFilter,
}: FilterPanelProps) {
  const t = useT()
  const [openCat, setOpenCat] = useState<string | null>(null)
  const [subPanelTop, setSubPanelTop] = useState(0)
  const [subPanelMaxH, setSubPanelMaxH] = useState(400)
  const [searchQuery, setSearchQuery] = useState("")
  const [subSearch, setSubSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const handleCatHover = useCallback((catKey: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (catKey !== openCat) setSubSearch("")
    setOpenCat(catKey)
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const rowRect = e.currentTarget.getBoundingClientRect()
      // Keep the value sub-panel inside the viewport. It opens at the hovered
      // row's y and extends downward, so a low row (e.g. Date/Content) in a
      // centered dialog would push it past the bottom edge and clip it. Cap
      // its height to the visible band and shift the top up when needed.
      const pad = 8
      const vh = typeof window !== "undefined" ? window.innerHeight : 800
      const cat = categories.find((c) => c.key === catKey)
      const estHeight = Math.min(400, 44 + (cat?.values.length ?? 0) * 40)
      const maxH = Math.min(estHeight, vh - 2 * pad)
      const topVp = Math.min(Math.max(rowRect.top, pad), vh - pad - maxH)
      setSubPanelTop(topVp - containerRect.top)
      setSubPanelMaxH(maxH)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCat, categories])

  const q = searchQuery.toLowerCase()

  const filteredQuickFilters = useMemo(
    () =>
      quickFilters?.filter(
        (qf) =>
          !q || qf.label.toLowerCase().includes(q) || qf.desc.toLowerCase().includes(q),
      ),
    [quickFilters, q],
  )

  const filteredCategories = useMemo(
    () => categories.filter((c) => !q || c.label.toLowerCase().includes(q)),
    [categories, q],
  )

  const activeCategory = openCat
    ? categories.find((c) => c.key === openCat) ?? null
    : null

  return (
    <div ref={containerRef} className="relative flex">
      {/* ── Sub Panel (values) — LEFT side, positioned at hovered row's y ── */}
      {activeCategory && activeCategory.values.length > 0 && (
        <div
          className="absolute right-full w-[220px] overflow-y-auto border border-border-subtle bg-surface-overlay rounded-lg py-1 shrink-0 shadow-lg z-10 -mr-px"
          style={{ top: subPanelTop, maxHeight: subPanelMaxH }}
        >
          <div className="px-2 pb-1">
            <input
              type="text"
              placeholder={t("filter.search.placeholder")}
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full bg-transparent border-b border-border px-2 py-1.5 text-note outline-none placeholder:text-muted-foreground"
            />
          </div>
          {(() => {
            const filtered = activeCategory.values.filter((val) =>
              !subSearch || val.label.toLowerCase().includes(subSearch.toLowerCase())
            )
            return filtered.map((val, idx) => {
              const isActive = activeFilters.some(
                (f) => f.field === activeCategory.key && f.value === val.key
              )
              // v2 Ontology Hull Phase 1 — sub-section header when group
              // changes. First value of each group gets a small label
              // above it; values without group render without header.
              const prevGroup = idx > 0 ? filtered[idx - 1].group : undefined
              const showGroupHeader = val.group && val.group !== prevGroup
              return (
                <React.Fragment key={val.key}>
                  {showGroupHeader && (
                    <div className="px-3 pt-2 pb-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground/60">
                      {val.group}
                    </div>
                  )}
                  <button
                    className="group/row w-full flex items-center gap-2.5 px-3 py-2 hover:bg-hover-bg transition-colors cursor-default"
                    onClick={() =>
                      onToggle({
                        field: activeCategory.key as FilterField,
                        operator: "eq",
                        value: val.key,
                      })
                    }
                  >
                    <Checkbox checked={isActive} />
                    {/* tier-2 icon slot — fixed 16px box so every value row's
                        glyph shares one left x (Linear rule ①). */}
                    {val.icon ? (
                      <span className={`w-4 h-4 shrink-0 flex items-center justify-center ${TONE_ICON_IDLE}`}>{val.icon}</span>
                    ) : val.color ? (
                      <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: val.color }}
                        />
                      </span>
                    ) : null}
                    <span className={`flex-1 text-left text-note ${isActive ? TONE_LABEL_ACTIVE : "text-foreground"}`}>
                      {val.labelKey ? t(val.labelKey) : val.label}
                    </span>
                    {val.count !== undefined && (
                      <span className={`text-2xs tabular-nums ${TONE_HINT}`}>{val.count}</span>
                    )}
                  </button>
                </React.Fragment>
              )
            })
          })()}
        </div>
      )}

      {/* ── Main Panel (categories) — RIGHT side, always visible ── */}
      {/* Cap height to the space Radix measured between the popover and the
          viewport edge (--radix-popover-content-available-height) so the list
          scrolls instead of spilling off-screen; falls back to 560px when not
          rendered inside a Radix popover. */}
      <div
        className="w-[260px] overflow-y-auto py-1 shrink-0"
        style={{ maxHeight: "min(560px, var(--radix-popover-content-available-height, 560px))" }}
      >
        {/* Search input */}
        <div className="px-2 pb-1.5" onMouseEnter={() => setOpenCat(null)}>
          <input
            type="text"
            placeholder={t("filter.search.placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-border-subtle bg-background/50 px-2.5 py-1.5 text-note text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
            autoFocus
          />
        </div>

        {/* Quick Filters */}
        {filteredQuickFilters && filteredQuickFilters.length > 0 && (
          <div className="pb-1.5" onMouseEnter={() => setOpenCat(null)}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-2xs font-semibold text-accent uppercase tracking-wider">
              <SparkleIcon />
              <span>{t("filter.quick.title")}</span>
            </div>
            {filteredQuickFilters.map((qf) => (
              <button
                key={qf.label}
                className="w-full flex items-center justify-between px-3 pl-8 py-1.5 hover:bg-hover-bg transition-colors cursor-default"
                onClick={() => onQuickFilter?.(qf.rules)}
              >
                <span className="text-note text-foreground leading-none">{qf.labelKey ? t(qf.labelKey) : qf.label}</span>
                <span className="text-2xs text-muted-foreground leading-none">{qf.descKey ? t(qf.descKey) : qf.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Categories — grouped by 6-category cluster with dividers (Linear
            rule ②: divider = 의미 그룹 경계만). A divider is inserted whenever
            `category` changes between two consecutive VISIBLE rows; same-cluster
            rows are contiguous (locked by the schema, A3.3-E1), so this yields
            the workflow → classification → relations → metrics → time → content
            sections. Hand-written configs without `category` render as one run
            (no dividers). Mirrors the sub-panel `showGroupHeader` pattern. */}
        {filteredCategories.map((cat, idx) => {
          const activeCount = activeFilters.filter((f) => f.field === cat.key).length
          const isOpen = openCat === cat.key
          const isHot = activeCount > 0 || isOpen
          const prevCategory = idx > 0 ? filteredCategories[idx - 1].category : undefined
          const showDivider = idx > 0 && cat.category !== undefined && cat.category !== prevCategory
          return (
            <React.Fragment key={cat.key}>
              {showDivider && (
                <div role="separator" className="my-1 mx-3 border-t border-border-subtle" />
              )}
              <button
                className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors cursor-default ${
                  isOpen ? "bg-active-bg" : "hover:bg-hover-bg"
                }`}
                onMouseEnter={(e) => handleCatHover(cat.key, e)}
                onClick={() => setOpenCat(isOpen ? null : cat.key)}
              >
                {/* tier-2 icon — fixed 16px box so every category row's icon
                    shares one left x (= the value-row checkbox column). */}
                <span
                  className={`w-4 h-4 shrink-0 flex items-center justify-center ${isHot ? TONE_ICON_ACTIVE : TONE_ICON_IDLE}`}
                >
                  {cat.icon}
                </span>
                {/* tier-1 label */}
                <span
                  className={[
                    "flex-1 text-left text-note",
                    isHot ? TONE_LABEL_ACTIVE : TONE_LABEL_IDLE,
                  ].join(" ")}
                >
                  {cat.labelKey ? t(cat.labelKey) : cat.label}
                </span>
                {activeCount > 0 && (
                  <span className="rounded-full bg-accent/20 px-1.5 text-2xs text-accent font-medium tabular-nums">
                    {activeCount}
                  </span>
                )}
                {/* tier-3 hint (chevron). Tone = hint tier; open state nudges
                    it a touch brighter for affordance. A3.1: LCH token 예정. */}
                <span className={`flex transition-colors ${isOpen ? "text-muted-foreground/70" : TONE_HINT}`}>
                  <ChevronRightSmall />
                </span>
              </button>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
