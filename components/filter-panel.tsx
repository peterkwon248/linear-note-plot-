"use client"

import { useMemo, useState, useRef, useCallback } from "react"
import type { ReactNode } from "react"
import type { FilterRule, FilterField } from "@/lib/view-engine/types"

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
  color?: string
  count?: number
  icon?: ReactNode
}

export interface FilterCategory {
  key: string
  label: string
  icon: ReactNode
  values: FilterValue[]
}

export interface QuickFilter {
  label: string
  desc: string
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
  const [openCat, setOpenCat] = useState<string | null>(null)
  const [subPanelTop, setSubPanelTop] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [subSearch, setSubSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const handleCatHover = useCallback((catKey: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (catKey !== openCat) setSubSearch("")
    setOpenCat(catKey)
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const rowRect = e.currentTarget.getBoundingClientRect()
      const offset = rowRect.top - containerRect.top
      setSubPanelTop(offset)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCat])

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
          className="absolute right-full w-[220px] max-h-[400px] overflow-y-auto border border-border-subtle bg-surface-overlay rounded-lg py-1 shrink-0 shadow-lg z-10 -mr-px"
          style={{ top: subPanelTop }}
        >
          <div className="px-2 pb-1">
            <input
              type="text"
              placeholder="Filter..."
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full bg-transparent border-b border-border px-2 py-1.5 text-note outline-none placeholder:text-muted-foreground"
            />
          </div>
          {activeCategory.values.filter((val) =>
            !subSearch || val.label.toLowerCase().includes(subSearch.toLowerCase())
          ).map((val) => {
            const isActive = activeFilters.some(
              (f) => f.field === activeCategory.key && f.value === val.key
            )
            return (
              <button
                key={val.key}
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
                {val.icon ? (
                  <span className="shrink-0 flex items-center">{val.icon}</span>
                ) : val.color ? (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: val.color }}
                  />
                ) : null}
                <span className={`flex-1 text-left text-note ${isActive ? "text-foreground font-medium" : "text-foreground"}`}>
                  {val.label}
                </span>
                {val.count !== undefined && (
                  <span className="text-2xs text-muted-foreground/50 tabular-nums">{val.count}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Main Panel (categories) — RIGHT side, always visible ── */}
      <div className="w-[260px] max-h-[560px] overflow-y-auto py-1 shrink-0">
        {/* Search input */}
        <div className="px-2 pb-1.5" onMouseEnter={() => setOpenCat(null)}>
          <input
            type="text"
            placeholder="Filter..."
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
              <span>Quick Filters</span>
            </div>
            {filteredQuickFilters.map((qf) => (
              <button
                key={qf.label}
                className="w-full flex items-center justify-between px-3 pl-8 py-1.5 hover:bg-hover-bg transition-colors cursor-default"
                onClick={() => onQuickFilter?.(qf.rules)}
              >
                <span className="text-note text-foreground leading-none">{qf.label}</span>
                <span className="text-2xs text-muted-foreground leading-none">{qf.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Categories */}
        {filteredCategories.map((cat) => {
          const activeCount = activeFilters.filter((f) => f.field === cat.key).length
          const isOpen = openCat === cat.key
          return (
            <button
              key={cat.key}
              className={`w-full flex items-center gap-2 px-3 py-2 transition-colors cursor-default ${
                isOpen ? "bg-active-bg" : "hover:bg-hover-bg"
              }`}
              onMouseEnter={(e) => handleCatHover(cat.key, e)}
              onClick={() => setOpenCat(isOpen ? null : cat.key)}
            >
              <span
                className={`text-note leading-none flex ${activeCount > 0 || isOpen ? "text-foreground" : "text-muted-foreground"}`}
              >
                {cat.icon}
              </span>
              <span
                className={[
                  "flex-1 text-left text-note",
                  activeCount > 0 || isOpen ? "text-foreground font-medium" : "text-muted-foreground",
                ].join(" ")}
              >
                {cat.label}
              </span>
              {activeCount > 0 && (
                <span className="rounded-full bg-accent/20 px-1.5 text-2xs text-accent font-medium tabular-nums">
                  {activeCount}
                </span>
              )}
              <span className={`flex transition-opacity ${isOpen ? "opacity-60" : "opacity-30"}`}>
                <ChevronRightSmall />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
