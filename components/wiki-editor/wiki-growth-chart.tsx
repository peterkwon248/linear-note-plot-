"use client"

/**
 * Wiki growth chart — cumulative + delta time series for the wiki dashboard.
 *
 * Two stacked panels:
 *   1) Area chart of cumulative wiki articles over time
 *   2) Bar chart of new articles per bucket (with notes overlay)
 *
 * Uses the shared `computeWikiTimeSeries` for data prep. Recharts for rendering.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import type { Note, WikiArticle } from "@/lib/types"
import { computeWikiTimeSeries, type BucketSize } from "@/lib/insights/timeseries"

interface WikiGrowthChartProps {
  notes: Note[]
  wikiArticles: WikiArticle[]
}

const BUCKET_OPTIONS: { value: BucketSize; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
]

export function WikiGrowthChart({ notes, wikiArticles }: WikiGrowthChartProps) {
  const [bucketSize, setBucketSize] = useState<BucketSize>("month")
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  // Manual width measurement — Recharts ResponsiveContainer has been flaky on
  // React 19 / Next 16 (renders 0×N on first paint). ResizeObserver is the
  // simpler, more reliable path.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setWidth(Math.floor(w))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const data = useMemo(
    () =>
      computeWikiTimeSeries({
        notes,
        wikiArticles,
        bucketSize,
        maxBuckets: bucketSize === "day" ? 30 : bucketSize === "week" ? 26 : 24,
      }),
    [notes, wikiArticles, bucketSize],
  )

  if (data.length === 0) return null

  // Compact label for X axis: month → "MMM YY", week → "M/D", day → "M/D"
  const formatTick = (ts: string) => {
    const d = new Date(ts)
    if (bucketSize === "month") {
      return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    }
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  return (
    <div className="rounded-lg border border-border bg-card w-full">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h3 className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
          Wiki Growth Over Time
        </h3>
        <div className="flex items-center gap-0.5 rounded-md border border-border bg-secondary/50 p-0.5">
          {BUCKET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setBucketSize(opt.value)}
              className={`px-2 py-0.5 text-2xs rounded-sm transition-colors ${
                bucketSize === opt.value
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="px-4 py-3 space-y-4">
        {/* Cumulative area chart */}
        <div>
          <p className="mb-2 text-2xs text-muted-foreground">Cumulative articles &amp; notes</p>
          {width > 0 && (
          <AreaChart width={width - 32} height={140} data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="wikiArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="ts"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={formatTick}
                stroke="var(--border-subtle)"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                stroke="var(--border-subtle)"
                width={32}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 6,
                  fontSize: 11,
                }}
                labelFormatter={(label) => formatTick(String(label))}
              />
              <Area
                type="monotone"
                dataKey="totalWiki"
                stroke="var(--accent)"
                strokeWidth={1.5}
                fill="url(#wikiArea)"
                name="Wiki"
              />
              <Area
                type="monotone"
                dataKey="totalNotes"
                stroke="var(--muted-foreground)"
                strokeWidth={1}
                strokeDasharray="3 3"
                fill="none"
                name="Notes"
              />
          </AreaChart>
          )}
        </div>

        {/* New per bucket */}
        <div>
          <p className="mb-2 text-2xs text-muted-foreground">New per {bucketSize}</p>
          {width > 0 && (
          <BarChart width={width - 32} height={120} data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="ts"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={formatTick}
                stroke="var(--border-subtle)"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                stroke="var(--border-subtle)"
                width={32}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 6,
                  fontSize: 11,
                }}
                labelFormatter={(label) => formatTick(String(label))}
              />
              <Bar dataKey="newWiki" fill="var(--accent)" name="New Wiki" radius={[2, 2, 0, 0]} />
              <Bar dataKey="newNotes" fill="var(--muted-foreground)" fillOpacity={0.4} name="New Notes" radius={[2, 2, 0, 0]} />
          </BarChart>
          )}
        </div>
      </div>
    </div>
  )
}
