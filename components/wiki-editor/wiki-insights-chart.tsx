"use client"

/**
 * WikiInsightsChart — wrapper with chart-type + bucket-size + data-filter controls.
 *
 * Layout:
 *   [Growth | Connectivity]          ← chart type (segmented, top-left)
 *                    [Day Week Month] ← bucket size (segmented, top-right)
 *   [All] [Articles] [Stubs]          ← data filter (Growth only, below header)
 *   ── chart area ──
 */

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { Note, WikiArticle } from "@/lib/types"
import type { BucketSize } from "@/lib/insights/timeseries"
import { useT } from "@/lib/i18n"
import { WikiGrowthChart, type DataFilter } from "./wiki-growth-chart"
import { WikiConnectivityChart } from "./wiki-connectivity-chart"

type ChartType = "growth" | "connectivity"

interface WikiInsightsChartProps {
  notes: Note[]
  wikiArticles: WikiArticle[]
}

const CHART_TYPES: { value: ChartType; labelKey: string }[] = [
  { value: "growth", labelKey: "wiki.tab.growth" },
  { value: "connectivity", labelKey: "wiki.tab.connectivity" },
]

const BUCKET_OPTIONS: { value: BucketSize; labelKey: string }[] = [
  { value: "day", labelKey: "wiki.range.day" },
  { value: "week", labelKey: "wiki.range.week" },
  { value: "month", labelKey: "wiki.range.month" },
]

const DATA_FILTERS: { value: DataFilter; labelKey: string }[] = [
  { value: "all", labelKey: "wiki.filter.all" },
  { value: "articles", labelKey: "wiki.filter.articles" },
  { value: "stubs", labelKey: "wiki.filter.stubs" },
]

export function WikiInsightsChart({ notes, wikiArticles }: WikiInsightsChartProps) {
  const t = useT()
  const [chartType, setChartType] = useState<ChartType>("growth")
  const [bucketSize, setBucketSize] = useState<BucketSize>("month")
  const [dataFilter, setDataFilter] = useState<DataFilter>("all")

  // Count "complete" (done) vs "incomplete" (not-yet-done) for sub-tab labels.
  // v151: based on the manual 4-stage status. Excludes trashed.
  const counts = useMemo(() => {
    const live = wikiArticles.filter((w) => !(w as { trashed?: boolean }).trashed)
    let stubs = 0
    let articles = 0
    for (const w of live) {
      if (w.status === "done") articles++
      else stubs++
    }
    return { all: live.length, articles, stubs }
  }, [wikiArticles])

  return (
    <div className="rounded-lg border border-border bg-card w-full">
      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        {/* Chart type toggle */}
        <div className="flex items-center gap-0.5 rounded-md border border-border bg-secondary/50 p-0.5">
          {CHART_TYPES.map((ct) => (
            <button
              key={ct.value}
              type="button"
              onClick={() => setChartType(ct.value)}
              className={cn(
                "px-2 py-0.5 text-2xs rounded-sm transition-colors",
                chartType === ct.value
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(ct.labelKey)}
            </button>
          ))}
        </div>

        {/* Bucket size toggle */}
        <div className="flex items-center gap-0.5 rounded-md border border-border bg-secondary/50 p-0.5">
          {BUCKET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setBucketSize(opt.value)}
              className={cn(
                "px-2 py-0.5 text-2xs rounded-sm transition-colors",
                bucketSize === opt.value
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Data filter sub-tabs (Growth only) ── */}
      {chartType === "growth" && (
        <div className="flex items-center gap-1 border-b border-border px-4 py-2">
          {DATA_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setDataFilter(f.value)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-2xs font-medium transition-all duration-100",
                dataFilter === f.value
                  ? f.value === "stubs"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-foreground/10 text-foreground"
                  : f.value === "stubs"
                    ? "text-amber-600/80 dark:text-amber-400/80 hover:bg-hover-bg hover:text-amber-600 dark:hover:text-amber-400"
                    : "text-muted-foreground hover:bg-hover-bg hover:text-foreground",
              )}
            >
              {t(f.labelKey)}
              <span className="ml-1 tabular-nums text-muted-foreground/70">
                {counts[f.value]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Chart area ── */}
      {chartType === "growth" ? (
        <WikiGrowthChart
          notes={notes}
          wikiArticles={wikiArticles}
          bucketSize={bucketSize}
          dataFilter={dataFilter}
        />
      ) : (
        <WikiConnectivityChart
          notes={notes}
          wikiArticles={wikiArticles}
          bucketSize={bucketSize}
        />
      )}
    </div>
  )
}
