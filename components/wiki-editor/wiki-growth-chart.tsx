"use client"

/**
 * Wiki growth chart — cumulative + delta time series for the wiki dashboard.
 *
 * Supports dataFilter ("all" | "articles" | "stubs") for Article/Stub split.
 * "all" mode: stacked bar (Articles + Stubs) + multi-line cumulative.
 * "articles" / "stubs": single-color chart.
 *
 * ResizeObserver pattern — NO ResponsiveContainer (React 19/Next 16 width-0 issue).
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

export type DataFilter = "all" | "articles" | "stubs"

interface WikiGrowthChartProps {
  notes: Note[]
  wikiArticles: WikiArticle[]
  bucketSize: BucketSize
  dataFilter?: DataFilter
}

// Article = violet-ish accent, Stub = amber (matches wiki-list filter tab style)
const COLOR_ARTICLE = "var(--accent)"
const COLOR_STUB = "rgb(217 119 6)" // amber-600 equivalent
const COLOR_NOTES = "var(--muted-foreground)"

export function WikiGrowthChart({
  notes,
  wikiArticles,
  bucketSize,
  dataFilter = "all",
}: WikiGrowthChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

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

  const formatTick = (ts: string) => {
    const d = new Date(ts)
    if (bucketSize === "month") {
      return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    }
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  const chartWidth = width > 0 ? width - 32 : 0

  // Derive cumulative dataKey(s) and bar dataKey(s) by filter
  const cumulativeKeys: { key: string; color: string; dash?: string; name: string }[] =
    dataFilter === "all"
      ? [
          { key: "totalArticles", color: COLOR_ARTICLE, name: "Articles" },
          { key: "totalStubs", color: COLOR_STUB, name: "Stubs" },
          { key: "totalNotes", color: COLOR_NOTES, dash: "3 3", name: "Notes" },
        ]
      : dataFilter === "articles"
        ? [{ key: "totalArticles", color: COLOR_ARTICLE, name: "Articles" }]
        : [{ key: "totalStubs", color: COLOR_STUB, name: "Stubs" }]

  const newBarKeys: { key: string; color: string; name: string }[] =
    dataFilter === "all"
      ? [
          { key: "newArticles", color: COLOR_ARTICLE, name: "New Articles" },
          { key: "newStubs", color: COLOR_STUB, name: "New Stubs" },
        ]
      : dataFilter === "articles"
        ? [{ key: "newArticles", color: COLOR_ARTICLE, name: "New Articles" }]
        : [{ key: "newStubs", color: COLOR_STUB, name: "New Stubs" }]

  const bucketLabel = bucketSize === "day" ? "day" : bucketSize === "week" ? "week" : "month"
  const cumulativeLabel =
    dataFilter === "all"
      ? "Cumulative articles, stubs & notes"
      : dataFilter === "articles"
        ? "Cumulative articles"
        : "Cumulative stubs"

  return (
    <div ref={containerRef} className="px-4 py-3 space-y-4">
      {/* Cumulative area chart */}
      <div>
        <p className="mb-2 text-2xs text-muted-foreground">{cumulativeLabel}</p>
        {chartWidth > 0 && (
          <AreaChart
            width={chartWidth}
            height={140}
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              {cumulativeKeys.map((k) => (
                <linearGradient key={k.key} id={`grad-${k.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={k.color} stopOpacity={k.dash ? 0 : 0.35} />
                  <stop offset="100%" stopColor={k.color} stopOpacity={0.03} />
                </linearGradient>
              ))}
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
            {cumulativeKeys.map((k) => (
              <Area
                key={k.key}
                type="monotone"
                dataKey={k.key}
                stroke={k.color}
                strokeWidth={k.dash ? 1 : 1.5}
                strokeDasharray={k.dash}
                fill={k.dash ? "none" : `url(#grad-${k.key})`}
                name={k.name}
              />
            ))}
          </AreaChart>
        )}
      </div>

      {/* New per bucket bar chart */}
      <div>
        <p className="mb-2 text-2xs text-muted-foreground">New per {bucketLabel}</p>
        {chartWidth > 0 && (
          <BarChart
            width={chartWidth}
            height={120}
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
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
            {newBarKeys.map((k, idx) => (
              <Bar
                key={k.key}
                dataKey={k.key}
                fill={k.color}
                fillOpacity={idx === 0 ? 1 : 0.55}
                name={k.name}
                stackId="wiki"
                radius={idx === newBarKeys.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        )}
      </div>
    </div>
  )
}
