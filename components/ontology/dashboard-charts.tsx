"use client"

/**
 * dashboard-charts.tsx — Ontology Dashboard chart bundle.
 *
 * Chunk 2 of dashboard fullwidth PRD (2026-05-25). Four charts in a single
 * file (small functions, shared ResizeObserver pattern):
 *   1. StatusDonut       — backlog/todo/in_progress/done distribution
 *   2. WikiStatusDonut   — complete (done) vs incomplete split (article.status)
 *   3. TopHubsBar        — top-N notes by backlinks (horizontal bar)
 *   4. CategoriesBar     — wiki category note counts (horizontal bar)
 *
 * ResizeObserver pattern (React 19/Next 16 width-0 issue) — NEVER use
 * ResponsiveContainer. Each chart owns its container ref and width state.
 *
 * Deferred to chunk 2b:
 *   - Weekly activity area chart (entityEvents time series, more complex)
 *   - Orphan vs Linked donut
 */

import { useEffect, useRef, useState } from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useT } from "@/lib/i18n"
import { NOTE_STATUS_HEX } from "@/lib/colors"

// ────────────────────────────────────────────────────────────────────────────
// Shared — useChartWidth hook (ResizeObserver pattern)
// ────────────────────────────────────────────────────────────────────────────

function useChartWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
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

  return { ref, width }
}

// ────────────────────────────────────────────────────────────────────────────
// Color tokens — Plot permanent rules (lib/colors.ts)
// NOTE_STATUS_HEX: backlog=slate-400, todo=blue-500, in_progress=amber-500, done=emerald-400
// Wiki status is unified with Notes (v151) — use NOTE_STATUS_HEX everywhere.
// ────────────────────────────────────────────────────────────────────────────

const BAR_COLOR = "var(--accent)"

// ────────────────────────────────────────────────────────────────────────────
// ChartCard — shared wrapper (border / title / chart slot)
// ────────────────────────────────────────────────────────────────────────────

interface ChartCardProps {
  title: string
  children: React.ReactNode
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 1. StatusDonut — Backlog / Todo / In Progress / Done distribution
// ────────────────────────────────────────────────────────────────────────────

interface StatusDonutProps {
  backlog: number
  todo: number
  in_progress: number
  done: number
}

export function StatusDonut({ backlog, todo, in_progress, done }: StatusDonutProps) {
  const t = useT()
  const { ref, width } = useChartWidth()
  const size = Math.min(width, 220)

  const data = [
    { name: t("status.backlog"), value: backlog, color: NOTE_STATUS_HEX.backlog },
    { name: t("status.todo"), value: todo, color: NOTE_STATUS_HEX.todo },
    { name: t("status.in_progress"), value: in_progress, color: NOTE_STATUS_HEX.in_progress },
    { name: t("status.done"), value: done, color: NOTE_STATUS_HEX.done },
  ].filter((d) => d.value > 0)

  const total = backlog + todo + in_progress + done

  return (
    <ChartCard title={t("ontology.dashboard.chart.status_distribution")}>
      <div ref={ref} className="flex flex-col items-center gap-3">
        {total === 0 ? (
          <p className="py-8 text-note text-muted-foreground">
            {t("ontology.dashboard.empty.no_notes")}
          </p>
        ) : (
          <>
            <PieChart width={size} height={size}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={size * 0.28}
                outerRadius={size * 0.42}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--surface-overlay)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
              />
            </PieChart>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
              {data.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: d.color }} />
                  <span>{d.name}</span>
                  <span className="tabular-nums text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ChartCard>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 2. WikiStatusDonut — Article / Stub distribution
// ────────────────────────────────────────────────────────────────────────────

interface WikiStatusDonutProps {
  articles: number
  stubs: number
}

export function WikiStatusDonut({ articles, stubs }: WikiStatusDonutProps) {
  const t = useT()
  const { ref, width } = useChartWidth()
  const size = Math.min(width, 220)

  const data = [
    // v151: "complete" (done = emerald) vs "incomplete" (in-progress = amber),
    // unified with the Notes status palette.
    { name: t("wiki.filter.articles"), value: articles, color: NOTE_STATUS_HEX.done },
    { name: t("wiki.filter.stubs"), value: stubs, color: NOTE_STATUS_HEX.in_progress },
  ].filter((d) => d.value > 0)

  const total = articles + stubs

  return (
    <ChartCard title={t("ontology.dashboard.chart.wiki_status")}>
      <div ref={ref} className="flex flex-col items-center gap-3">
        {total === 0 ? (
          <p className="py-8 text-note text-muted-foreground">
            {t("ontology.dashboard.empty.no_wikis")}
          </p>
        ) : (
          <>
            <PieChart width={size} height={size}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={size * 0.28}
                outerRadius={size * 0.42}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--surface-overlay)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
              />
            </PieChart>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
              {data.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: d.color }} />
                  <span>{d.name}</span>
                  <span className="tabular-nums text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ChartCard>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 3. TopHubsBar — top-N notes by backlink count (horizontal bar)
// ────────────────────────────────────────────────────────────────────────────

interface TopHubsBarProps {
  hubs: { id: string; title: string; backlinks: number; isWiki?: boolean }[]
}

export function TopHubsBar({ hubs }: TopHubsBarProps) {
  const t = useT()
  const { ref, width } = useChartWidth()

  const data = hubs.slice(0, 8).map((h) => ({
    name: h.title.length > 24 ? `${h.title.slice(0, 22)}…` : h.title,
    backlinks: h.backlinks,
  }))

  const chartWidth = width > 0 ? width - 8 : 0
  const chartHeight = Math.max(180, data.length * 28)

  return (
    <ChartCard title={t("ontology.dashboard.chart.top_hubs")}>
      <div ref={ref} className="w-full">
        {data.length === 0 ? (
          <p className="py-8 text-center text-note text-muted-foreground">
            {t("ontology.dashboard.empty.no_connections")}
          </p>
        ) : (
          <BarChart
            width={chartWidth}
            height={chartHeight}
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" />
            <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <Tooltip
              contentStyle={{ background: "var(--surface-overlay)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
              cursor={{ fill: "var(--hover-bg)" }}
            />
            <Bar dataKey="backlinks" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
          </BarChart>
        )}
      </div>
    </ChartCard>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 4. CategoriesBar — wiki category note counts (horizontal bar)
// ────────────────────────────────────────────────────────────────────────────

interface CategoriesBarProps {
  categories: { id: string; name: string; color: string; noteCount: number }[]
}

export function CategoriesBar({ categories }: CategoriesBarProps) {
  const t = useT()
  const { ref, width } = useChartWidth()

  const data = categories
    .slice()
    .sort((a, b) => b.noteCount - a.noteCount)
    .slice(0, 8)
    .map((c) => ({
      name: c.name.length > 20 ? `${c.name.slice(0, 18)}…` : c.name,
      count: c.noteCount,
      fill: c.color,
    }))

  const chartWidth = width > 0 ? width - 8 : 0
  const chartHeight = Math.max(180, data.length * 28)

  return (
    <ChartCard title={t("ontology.dashboard.chart.categories")}>
      <div ref={ref} className="w-full">
        {data.length === 0 ? (
          <p className="py-8 text-center text-note text-muted-foreground">
            {t("ontology.dashboard.empty.no_categories")}
          </p>
        ) : (
          <BarChart
            width={chartWidth}
            height={chartHeight}
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" />
            <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={{ background: "var(--surface-overlay)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
              cursor={{ fill: "var(--hover-bg)" }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        )}
      </div>
    </ChartCard>
  )
}
