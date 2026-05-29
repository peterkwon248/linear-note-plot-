"use client"

/**
 * BooksInsightsView — Books entity Insights page.
 *
 * Mirrors `wiki-insights-view.tsx` (ViewHeader + sectioned scroll body), but
 * Books have NO status field, so the primary axis is KIND (Smart / Manual /
 * Hybrid, via getBookKind). Sections:
 *   - Kind breakdown (Smart⚡ / Manual✏️ / Hybrid✨ counts + bar chart)
 *   - Totals (total books, total items)
 *   - Smart-source health (books with sources, avg sources per smart book)
 *   - Reading progress (books with a lastReadItemId set)
 *
 * Charts use the project's mandated useRef + ResizeObserver pattern — NEVER
 * ResponsiveContainer (React 19 / Next 16 width-0 bug). Mirrors
 * wiki-growth-chart.tsx.
 *
 * Spec: `docs/01-plan/features/smart-book-preset.plan.md` §6.
 */

import { useMemo, useEffect, useRef, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts"
import { ViewHeader } from "@/components/view-header"
import { useT } from "@/lib/i18n"
import { usePlotStore } from "@/lib/store"
import { IconInsight } from "@/components/plot-icons"
import { BookKindIcon } from "@/components/property-chips"
import { getBookKind, type BookKind } from "@/lib/view-engine/use-books-view"
import type { Book } from "@/lib/types"

/* ── Kind colors (mirror BookKindIcon: Smart violet / Hybrid amber / Manual neutral) ── */
const KIND_COLOR: Record<BookKind, string> = {
  smart: "#5E6AD2",
  hybrid: "#d97706",
  manual: "var(--muted-foreground)",
}
const KIND_ORDER: BookKind[] = ["smart", "hybrid", "manual"]

/* ── Kind breakdown card (counts + bar chart) ─────────────────────────── */

function KindBreakdown({
  counts,
  t,
}: {
  counts: Record<BookKind, number>
  t: (k: string) => string
}) {
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

  const total = KIND_ORDER.reduce((sum, k) => sum + counts[k], 0)
  const chartWidth = width > 0 ? width - 32 : 0

  const data = useMemo(
    () =>
      KIND_ORDER.map((k) => ({
        kind: k,
        label: t(`books.kind.${k}`),
        count: counts[k],
      })),
    [counts, t],
  )

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xs font-medium text-muted-foreground">{t("books.insights.section.kind")}</span>
        <span className="text-2xs tabular-nums text-muted-foreground/60">{total}</span>
      </div>

      {/* Count tiles (mirrors WikiStatusBreakdown grid) */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {KIND_ORDER.map((kind) => (
          <div key={kind} className="flex flex-col items-center gap-1.5 rounded-md px-2 py-2.5">
            <BookKindIcon kind={kind} size={18} />
            <span
              className="text-lg font-semibold tabular-nums leading-none"
              style={{ color: KIND_COLOR[kind] }}
            >
              {counts[kind]}
            </span>
            <span className="text-2xs text-muted-foreground">{t(`books.kind.${kind}`)}</span>
          </div>
        ))}
      </div>

      {/* Bar chart — ResizeObserver, never ResponsiveContainer. */}
      <div ref={containerRef}>
        {chartWidth > 0 && total > 0 && (
          <BarChart
            width={chartWidth}
            height={140}
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
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
              cursor={{ fill: "var(--hover-bg)" }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.kind} fill={KIND_COLOR[d.kind]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </div>
    </div>
  )
}

/* ── Metric tile ──────────────────────────────────────────────────────── */

function MetricTile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="text-2xl font-semibold tabular-nums text-foreground leading-none">{value}</div>
      <div className="mt-1.5 text-2xs text-muted-foreground">{label}</div>
    </div>
  )
}

/* ── View ─────────────────────────────────────────────────────────────── */

export function BooksInsightsView() {
  const t = useT()
  const books = usePlotStore((s) => s.books) as Book[]

  // Live (non-trashed) books — same predicate the books list uses.
  const liveBooks = useMemo(() => books.filter((b) => !b.trashed), [books])

  const kindCounts = useMemo(() => {
    const counts: Record<BookKind, number> = { smart: 0, manual: 0, hybrid: 0 }
    for (const b of liveBooks) counts[getBookKind(b)]++
    return counts
  }, [liveBooks])

  const metrics = useMemo(() => {
    const totalBooks = liveBooks.length
    const totalItems = liveBooks.reduce((sum, b) => sum + (b.items?.length ?? 0), 0)
    // Smart-source health.
    const withSources = liveBooks.filter((b) => (b.smartSources?.length ?? 0) > 0)
    const totalSources = withSources.reduce((sum, b) => sum + (b.smartSources?.length ?? 0), 0)
    const avgSources = withSources.length > 0 ? totalSources / withSources.length : 0
    // Reading progress — books the user has a saved reading position in.
    const withReading = liveBooks.filter((b) => !!b.lastReadItemId).length
    return {
      totalBooks,
      totalItems,
      withSourcesCount: withSources.length,
      avgSources: Math.round(avgSources * 10) / 10,
      withReading,
    }
  }, [liveBooks])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader icon={<IconInsight size={20} />} title={t("sidebar.insights")} />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* ── Kind breakdown ── */}
        <section>
          <h3 className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 mb-3">
            {t("books.insights.section.kind")}
          </h3>
          <KindBreakdown counts={kindCounts} t={t} />
        </section>

        {/* ── Totals ── */}
        <section>
          <h3 className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 mb-3">
            {t("books.insights.section.totals")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile value={metrics.totalBooks} label={t("books.insights.metric.totalBooks")} />
            <MetricTile value={metrics.totalItems} label={t("books.insights.metric.totalItems")} />
          </div>
        </section>

        {/* ── Smart-source health ── */}
        <section>
          <h3 className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 mb-3">
            {t("books.insights.section.health")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile value={metrics.withSourcesCount} label={t("books.insights.metric.withSources")} />
            <MetricTile value={metrics.avgSources} label={t("books.insights.metric.avgSources")} />
          </div>
        </section>

        {/* ── Reading progress ── */}
        <section>
          <h3 className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 mb-3">
            {t("books.insights.section.reading")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile value={metrics.withReading} label={t("books.insights.metric.inProgress")} />
          </div>
        </section>
      </div>
    </div>
  )
}
