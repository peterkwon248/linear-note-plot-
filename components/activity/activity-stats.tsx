"use client"

import { useMemo } from "react"
import { format, parseISO } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { computeActivityStats } from "@/lib/datalog/helpers"

export function ActivityStats() {
  const notes = usePlotStore((s) => s.notes)
  const events = usePlotStore((s) => s.noteEvents)
  const openNote = usePlotStore((s) => s.openNote)

  const stats = useMemo(
    () => computeActivityStats(events, notes),
    [events, notes]
  )

  const maxDaily = Math.max(...stats.dailyActivity.map((d) => d.count), 1)

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-[13px] text-muted-foreground">
          No activity recorded yet
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Count cards */}
      <div className="grid grid-cols-3 gap-3">
        <CountCard label="Today" count={stats.todayCount} />
        <CountCard label="This Week" count={stats.weekCount} />
        <CountCard label="This Month" count={stats.monthCount} />
      </div>

      {/* Daily activity bar chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-[12px] font-medium text-muted-foreground">
          Daily Activity (7 days)
        </h3>
        <div className="flex items-end justify-between gap-2">
          {stats.dailyActivity.map((day) => {
            const height = day.count > 0 ? (day.count / maxDaily) * 40 : 2
            return (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] tabular-nums text-muted-foreground/60">
                  {day.count > 0 ? day.count : ""}
                </span>
                <div
                  className="w-full rounded-sm bg-primary/60"
                  style={{ height: `${height}px` }}
                />
                <span className="text-[10px] text-muted-foreground/60">
                  {format(parseISO(day.date), "EEE")}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Most opened */}
      {stats.mostOpened.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 text-[12px] font-medium text-muted-foreground">
            Most Opened
          </h3>
          <div className="space-y-1">
            {stats.mostOpened.map((item, i) => (
              <button
                key={item.noteId}
                onClick={() => openNote(item.noteId)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary/50"
              >
                <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground/50 w-4">
                  {i + 1}.
                </span>
                <span className="truncate text-[13px] text-foreground">
                  {item.title}
                </span>
                <span className="ml-auto shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CountCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-2xl font-semibold tabular-nums text-foreground">
        {count}
      </div>
      <div className="mt-0.5 text-[12px] text-muted-foreground">{label}</div>
    </div>
  )
}
