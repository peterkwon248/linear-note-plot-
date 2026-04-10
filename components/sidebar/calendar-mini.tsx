"use client"

/**
 * CalendarMini — compact monthly grid for the Calendar sidebar.
 * - Click a date → publishes a `plot:calendar-jump` custom event with ISO date string
 * - Highlights today
 * - Shows activity dot under days that have at least one note/wiki
 * - Auto-syncs with main calendar's currentDate via `plot:calendar-month-change` event
 */

import { useEffect, useMemo, useState, useCallback } from "react"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns"
import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { usePlotStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function CalendarMini() {
  // Defer Date() init to client to avoid SSR hydration mismatch
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  // Listen for main calendar's month changes to keep mini in sync
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ iso: string }>
      try {
        if (ce.detail?.iso) setCurrentDate(parseISO(ce.detail.iso))
      } catch {}
    }
    window.addEventListener("plot:calendar-month-change", handler as EventListener)
    return () => window.removeEventListener("plot:calendar-month-change", handler as EventListener)
  }, [])

  // Compute sets of dates with activity (createdAt = created, updatedAt = edited)
  const { createdDates, updatedDates } = useMemo(() => {
    const created = new Set<string>()
    const updated = new Set<string>()
    for (const n of notes) {
      if (n.trashed) continue
      try {
        created.add(format(parseISO(n.createdAt), "yyyy-MM-dd"))
        // Only count updatedAt if it differs from createdAt (actual edit, not just creation)
        if (n.updatedAt !== n.createdAt) {
          updated.add(format(parseISO(n.updatedAt), "yyyy-MM-dd"))
        }
      } catch {}
    }
    for (const w of wikiArticles) {
      try {
        created.add(format(parseISO(w.createdAt), "yyyy-MM-dd"))
        if (w.updatedAt !== w.createdAt) {
          updated.add(format(parseISO(w.updatedAt), "yyyy-MM-dd"))
        }
      } catch {}
    }
    return { createdDates: created, updatedDates: updated }
  }, [notes, wikiArticles])

  const calendarDays = useMemo(() => {
    if (!currentDate) return []
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [currentDate])

  const goPrev = useCallback(() => setCurrentDate((d) => (d ? subMonths(d, 1) : new Date())), [])
  const goNext = useCallback(() => setCurrentDate((d) => (d ? addMonths(d, 1) : new Date())), [])
  const goToday = useCallback(() => setCurrentDate(new Date()), [])

  const handleDayClick = useCallback((day: Date) => {
    const iso = format(day, "yyyy-MM-dd")
    window.dispatchEvent(new CustomEvent("plot:calendar-jump", { detail: { iso } }))
  }, [])

  // SSR placeholder — render nothing until mounted (avoids hydration mismatch)
  if (!currentDate) {
    return <div className="px-2.5 py-1 h-[180px]" aria-hidden />
  }

  return (
    <div className="px-2.5 py-1 select-none">
      {/* Header — month label + nav */}
      <div className="flex items-center justify-between mb-1.5">
        <button
          onClick={goToday}
          className="text-2xs font-semibold text-sidebar-foreground hover:text-sidebar-hover-text transition-colors"
          title="Jump to today"
        >
          {format(currentDate, "MMM yyyy")}
        </button>
        <div className="flex items-center gap-0.5">
          <button
            onClick={goPrev}
            className="flex h-5 w-5 items-center justify-center rounded text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors"
            title="Previous month"
          >
            <CaretLeft size={11} weight="bold" />
          </button>
          <button
            onClick={goNext}
            className="flex h-5 w-5 items-center justify-center rounded text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors"
            title="Next month"
          >
            <CaretRight size={11} weight="bold" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px mb-0.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div
            key={i}
            className="flex h-4 items-center justify-center text-[9px] font-medium uppercase text-sidebar-muted/60"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px">
        {calendarDays.map((day) => {
          const inMonth = isSameMonth(day, currentDate)
          const today = isToday(day)
          const dateKey = format(day, "yyyy-MM-dd")
          const hasCreated = createdDates.has(dateKey)
          const hasUpdated = updatedDates.has(dateKey)
          const hasBoth = hasCreated && hasUpdated
          return (
            <button
              key={dateKey}
              onClick={() => handleDayClick(day)}
              className={cn(
                "relative flex h-6 items-center justify-center rounded text-[10px] tabular-nums transition-colors",
                today && "bg-accent/15 text-accent font-semibold",
                !today && inMonth && "text-sidebar-foreground hover:bg-sidebar-hover",
                !today && !inMonth && "text-sidebar-muted/40 hover:bg-sidebar-hover/50",
              )}
            >
              {format(day, "d")}
              {/* Activity dots: accent=created, amber=updated, both=2 dots side by side */}
              {!today && (hasCreated || hasUpdated) && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-px">
                  {hasCreated && <span className="h-0.5 w-0.5 rounded-full bg-accent/60" />}
                  {hasUpdated && <span className="h-0.5 w-0.5 rounded-full bg-amber-400/60" />}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
