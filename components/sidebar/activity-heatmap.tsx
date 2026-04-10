"use client"

/**
 * ActivityHeatmap — GitHub-style mini contribution heatmap for the Calendar sidebar.
 * Shows the last 30 days of activity (notes created + wiki articles created/updated).
 * Cell color intensity reflects activity count. Month dividers mark month boundaries.
 */

import { useEffect, useMemo, useState } from "react"
import { format, parseISO, subDays, startOfDay, getMonth } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const DAYS = 30 // 5 columns × 6 rows = 30 days

interface DayCell {
  iso: string
  label: string
  count: number
  dayOfMonth: number
  month: number // 0-11
}

function intensityClass(count: number, max: number): string {
  if (count === 0) return "bg-sidebar-hover/40"
  const ratio = count / Math.max(1, max)
  if (ratio < 0.25) return "bg-accent/15"
  if (ratio < 0.5) return "bg-accent/30"
  if (ratio < 0.75) return "bg-accent/55"
  return "bg-accent/85"
}

export function ActivityHeatmap() {
  // Defer Date() init to client to avoid SSR hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  // Build last-30-day cells (newest last)
  const cells = useMemo<DayCell[]>(() => {
    if (!mounted) return []
    const today = startOfDay(new Date())
    const days: DayCell[] = []
    const counts: Record<string, number> = {}

    // Pre-bucket all created entities into yyyy-MM-dd keys
    for (const n of notes) {
      if (n.trashed) continue
      try {
        const key = format(parseISO(n.createdAt), "yyyy-MM-dd")
        counts[key] = (counts[key] ?? 0) + 1
      } catch {}
    }
    for (const w of wikiArticles) {
      try {
        const key = format(parseISO(w.createdAt), "yyyy-MM-dd")
        counts[key] = (counts[key] ?? 0) + 1
      } catch {}
    }

    for (let i = DAYS - 1; i >= 0; i--) {
      const day = subDays(today, i)
      const key = format(day, "yyyy-MM-dd")
      days.push({
        iso: key,
        label: format(day, "EEE, MMM d"),
        count: counts[key] ?? 0,
        dayOfMonth: day.getDate(),
        month: getMonth(day),
      })
    }
    return days
  }, [notes, wikiArticles, mounted])

  const maxCount = useMemo(() => Math.max(1, ...cells.map((c) => c.count)), [cells])
  const totalCount = useMemo(() => cells.reduce((sum, c) => sum + c.count, 0), [cells])
  const activeDays = useMemo(() => cells.filter((c) => c.count > 0).length, [cells])

  const handleClick = (iso: string) => {
    window.dispatchEvent(new CustomEvent("plot:calendar-jump", { detail: { iso } }))
  }

  // SSR placeholder — render fixed-height area until mounted
  if (!mounted) {
    return <div className="px-2.5 py-1 h-[60px]" aria-hidden />
  }

  return (
    <div className="px-2.5 py-1 select-none">
      {/* Caption */}
      <div className="flex items-center justify-between mb-1.5 text-2xs">
        <span className="text-sidebar-muted">Last 30 days</span>
        <span className="text-sidebar-foreground tabular-nums">
          {totalCount} <span className="text-sidebar-muted">in {activeDays}d</span>
        </span>
      </div>

      {/* Grid: 5 rows × 6 columns (oldest top-left → newest bottom-right) */}
      <div className="grid grid-cols-6 gap-0.5">
        {cells.map((cell, i) => {
          // Month divider: left border when this cell is the 1st of a month (and not the first cell)
          const isMonthStart = i > 0 && cell.dayOfMonth === 1
          return (
            <div
              key={cell.iso}
              className={cn("relative", isMonthStart && "pl-px")}
            >
              {isMonthStart && (
                <div className="absolute left-0 top-0 bottom-0 w-px bg-sidebar-muted/20" />
              )}
              <button
                onClick={() => handleClick(cell.iso)}
                className={cn(
                  "h-3 w-full rounded-[2px] transition-all hover:ring-1 hover:ring-accent/60",
                  intensityClass(cell.count, maxCount),
                )}
                title={`${cell.label}: ${cell.count} ${cell.count === 1 ? "item" : "items"}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
