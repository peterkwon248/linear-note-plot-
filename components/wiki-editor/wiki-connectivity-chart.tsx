"use client"

/**
 * Wiki connectivity chart — wiki-to-wiki link edges over time.
 *
 * Visualises how the knowledge graph grows denser: cumulative totalWikiEdges
 * (wiki article linksOut) as a filled area chart.
 *
 * ResizeObserver pattern — NO ResponsiveContainer (React 19/Next 16 width-0 issue).
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import type { Note, WikiArticle } from "@/lib/types"
import { computeWikiTimeSeries, type BucketSize } from "@/lib/insights/timeseries"

interface WikiConnectivityChartProps {
  notes: Note[]
  wikiArticles: WikiArticle[]
  bucketSize: BucketSize
}

export function WikiConnectivityChart({
  notes,
  wikiArticles,
  bucketSize,
}: WikiConnectivityChartProps) {
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

  // Check if there's any connectivity data at all
  const hasEdges = data.some((p) => p.totalWikiEdges > 0)

  return (
    <div ref={containerRef} className="px-4 py-3">
      {!hasEdges ? (
        <div className="flex h-[140px] items-center justify-center">
          <p className="text-2xs text-muted-foreground/60">
            No wiki-to-wiki links yet. Add{" "}
            <span className="font-mono">[[Article Title]]</span> links inside wiki articles.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-2 text-2xs text-muted-foreground">
            Wiki article links (cumulative) — knowledge graph connectivity
          </p>
          {chartWidth > 0 && (
            <AreaChart
              width={chartWidth}
              height={260}
              data={data}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="connArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2, #0e7490)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-2, #0e7490)" stopOpacity={0.04} />
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
                dataKey="totalWikiEdges"
                stroke="var(--chart-2, #0e7490)"
                strokeWidth={1.5}
                fill="url(#connArea)"
                name="Wiki Links"
              />
            </AreaChart>
          )}
        </>
      )}
    </div>
  )
}
