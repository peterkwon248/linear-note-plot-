"use client"

/**
 * insights-charts.tsx — Ontology Insights chart bundle (v2, 2026-05-27).
 *
 * Power Sabermetrics 정체성 — gap deep dive analytical depth.
 *
 * Charts:
 *   1. TaggedDonut       — Tagged vs Untagged notes
 *   2. OrphanDonut       — Orphan vs Connected notes
 *   3. CohesionRadial    — Cluster cohesion %
 *   4. TopNotesBar       — Composite score (WAR-like) horizontal bar
 *
 * ResizeObserver pattern (React 19/Next 16 width-0 issue, dashboard-charts.tsx
 * parity). NEVER use ResponsiveContainer.
 */

import { useEffect, useRef, useState } from "react"
import { Info } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts"
import { useT } from "@/lib/i18n"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

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
// Color tokens
// ────────────────────────────────────────────────────────────────────────────

const POSITIVE_COLOR = "var(--accent)"           // tagged / connected / cohesion good
const NEGATIVE_COLOR = "var(--muted-foreground)" // untagged / orphan (muted, not alarming)
const BAR_COLOR = "var(--accent)"

// ────────────────────────────────────────────────────────────────────────────
// ChartCard — shared wrapper
// ────────────────────────────────────────────────────────────────────────────

interface ChartCardProps {
  title: string
  /** Optional hover-card help — appears as an info icon next to the title. */
  helpTitle?: string
  helpBody?: string
  helpFormula?: string
  children: React.ReactNode
}

function ChartCard({ title, helpTitle, helpBody, helpFormula, children }: ChartCardProps) {
  const hasHelp = Boolean(helpTitle || helpBody)
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <h3 className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {hasHelp && (
          <HoverCard openDelay={150}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                aria-label="What does this mean?"
                className="text-muted-foreground/50 transition-colors hover:text-foreground"
              >
                <Info size={13} strokeWidth={2} />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" align="end" className="w-72">
              {helpTitle && (
                <h4 className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {helpTitle}
                </h4>
              )}
              {helpBody && (
                <p className="text-note leading-relaxed text-foreground/85">{helpBody}</p>
              )}
              {helpFormula && (
                <p className="mt-2 rounded-md bg-muted/50 px-2 py-1.5 text-2xs font-mono text-muted-foreground">
                  {helpFormula}
                </p>
              )}
            </HoverCardContent>
          </HoverCard>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 1. TaggedDonut — Tagged vs Untagged notes
// ────────────────────────────────────────────────────────────────────────────

interface TaggedDonutProps {
  tagged: number
  untagged: number
}

export function TaggedDonut({ tagged, untagged }: TaggedDonutProps) {
  const t = useT()
  const { ref, width } = useChartWidth()
  const size = Math.min(width, 200)

  const data = [
    { name: t("ontology.insights.tagged"), value: tagged, color: POSITIVE_COLOR },
    { name: t("ontology.insights.untagged"), value: untagged, color: NEGATIVE_COLOR },
  ].filter((d) => d.value > 0)

  const total = tagged + untagged
  const pct = total > 0 ? Math.round((tagged / total) * 100) : 0

  return (
    <ChartCard
      title={t("ontology.insights.coverage_tagged")}
      helpTitle={t("ontology.insights.help.tagged_title")}
      helpBody={t("ontology.insights.help.tagged_body")}
    >
      <div ref={ref} className="flex flex-col items-center gap-3">
        {total === 0 ? (
          <p className="py-8 text-note text-muted-foreground">
            {t("ontology.dashboard.empty.no_notes")}
          </p>
        ) : (
          <>
            <div className="relative">
              <PieChart width={size} height={size}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={size * 0.32}
                  outerRadius={size * 0.46}
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
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-semibold tabular-nums text-foreground">
                  {pct}%
                </span>
              </div>
            </div>
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
// 2. OrphanDonut — Orphans vs Connected notes
// ────────────────────────────────────────────────────────────────────────────

interface OrphanDonutProps {
  orphans: number
  connected: number
}

export function OrphanDonut({ orphans, connected }: OrphanDonutProps) {
  const t = useT()
  const { ref, width } = useChartWidth()
  const size = Math.min(width, 200)

  const data = [
    { name: t("ontology.insights.connected"), value: connected, color: POSITIVE_COLOR },
    { name: t("ontology.insights.orphans"), value: orphans, color: NEGATIVE_COLOR },
  ].filter((d) => d.value > 0)

  const total = orphans + connected
  const pct = total > 0 ? Math.round((orphans / total) * 100) : 0

  return (
    <ChartCard
      title={t("ontology.insights.coverage_orphan")}
      helpTitle={t("ontology.insights.help.orphan_title")}
      helpBody={t("ontology.insights.help.orphan_body")}
    >
      <div ref={ref} className="flex flex-col items-center gap-3">
        {total === 0 ? (
          <p className="py-8 text-note text-muted-foreground">
            {t("ontology.dashboard.empty.no_notes")}
          </p>
        ) : (
          <>
            <div className="relative">
              <PieChart width={size} height={size}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={size * 0.32}
                  outerRadius={size * 0.46}
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
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-semibold tabular-nums text-foreground">
                  {pct}%
                </span>
              </div>
            </div>
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
// 3. CohesionRadial — Cluster cohesion percentage
// ────────────────────────────────────────────────────────────────────────────

interface CohesionRadialProps {
  /** 0..1 */
  cohesion: number
}

export function CohesionRadial({ cohesion }: CohesionRadialProps) {
  const t = useT()
  const { ref, width } = useChartWidth()
  const size = Math.min(width, 200)

  const pct = Math.round(cohesion * 100)
  const data = [{ name: "cohesion", value: pct, fill: POSITIVE_COLOR }]

  return (
    <ChartCard
      title={t("ontology.insights.coverage_cohesion")}
      helpTitle={t("ontology.insights.help.cohesion_title")}
      helpBody={t("ontology.insights.help.cohesion_body")}
    >
      <div ref={ref} className="flex flex-col items-center gap-3">
        <div className="relative">
          <RadialBarChart
            width={size}
            height={size}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.36}
            outerRadius={size * 0.48}
            startAngle={90}
            endAngle={-270}
            data={data}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: "var(--surface-subtle)" }} dataKey="value" cornerRadius={4} />
          </RadialBarChart>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-semibold tabular-nums text-foreground">{pct}%</span>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 4. TopNotesBar — Composite score horizontal bar
// ────────────────────────────────────────────────────────────────────────────

interface TopNotesBarEntry {
  id: string
  title: string
  score: number
}

interface TopNotesBarProps {
  entries: TopNotesBarEntry[]
  onClick?: (id: string) => void
}

export function TopNotesBar({ entries, onClick }: TopNotesBarProps) {
  const t = useT()
  const { ref, width } = useChartWidth()

  const data = entries.slice(0, 10).map((e) => ({
    id: e.id,
    name: e.title.length > 28 ? `${e.title.slice(0, 26)}…` : e.title,
    score: Math.round(e.score * 10) / 10,
  }))

  const chartWidth = width > 0 ? width - 8 : 0
  const chartHeight = Math.max(220, data.length * 32)

  return (
    <ChartCard
      title={t("ontology.insights.top_notes")}
      helpTitle={t("ontology.insights.help.composite_title")}
      helpBody={t("ontology.insights.help.composite_body")}
      helpFormula={t("ontology.insights.top_notes_formula")}
    >
      <div ref={ref} className="w-full">
        <p className="mb-3 text-2xs text-muted-foreground/70">
          {t("ontology.insights.top_notes_formula")}
        </p>
        {data.length === 0 ? (
          <p className="py-8 text-center text-note text-muted-foreground">
            {t("ontology.dashboard.empty.no_notes")}
          </p>
        ) : (
          <BarChart
            width={chartWidth}
            height={chartHeight}
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 4, left: 0 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload[0] && onClick) {
                const payload = state.activePayload[0].payload as { id: string }
                onClick(payload.id)
              }
            }}
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
              width={160}
            />
            <Tooltip
              contentStyle={{ background: "var(--surface-overlay)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
              cursor={{ fill: "var(--hover-bg)" }}
            />
            <Bar dataKey="score" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
          </BarChart>
        )}
      </div>
    </ChartCard>
  )
}
