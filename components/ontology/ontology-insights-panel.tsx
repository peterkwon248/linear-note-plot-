"use client"

/**
 * Ontology > Insights panel (v2, 2026-05-27).
 *
 * Power Sabermetrics 정체성 — knowledge graph deep dive analytical depth.
 *
 * Sections (Phase 1 MVP):
 *   1. Stats        — Edges / Density (graph-specific KPI, Notes/Wiki Dashboard 중복 폐기)
 *   2. Coverage     — Mosaic 3 차트 (Tagged donut + Orphan donut + Cohesion radial)
 *   3. Nudge        — Actionable maintenance (keep, dashboard differentiator)
 *   4. Top Notes    — Composite score horizontal bar chart (was sabermetrics list)
 *
 * Deferred to Phase 2:
 *   - Growth time series (entityEvents-based area chart)
 *   - Hub & Orphan deep dive
 *   - Connectivity distribution histogram
 *
 * Layout: max-w-5xl (영구 LOCKED #136 v2) + space-y-6 between sections.
 */

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { useKnowledgeMetrics } from "@/hooks/use-knowledge-metrics"
import { useT } from "@/lib/i18n"
import { OntologyNudgeSection } from "./ontology-nudge-section"
import {
  TaggedDonut,
  OrphanDonut,
  CohesionRadial,
  TopNotesBar,
} from "./insights-charts"

export function OntologyInsightsPanel() {
  const t = useT()
  const metrics = useKnowledgeMetrics()
  const openNote = usePlotStore((s) => s.openNote)

  /* ── Derived display values ────────────────── */
  const tagged = useMemo(
    () => Math.round(metrics.tagCoverage * metrics.totalNotes),
    [metrics.tagCoverage, metrics.totalNotes],
  )
  const untagged = metrics.totalNotes - tagged
  const orphans = useMemo(
    () => Math.round(metrics.orphanRate * metrics.totalNotes),
    [metrics.orphanRate, metrics.totalNotes],
  )
  const connected = metrics.totalNotes - orphans

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      {/* ── Section 1: Graph Health Stats ── */}
      <Section label={t("ontology.insights.section.health")}>
        <StatLine
          items={[
            { label: t("ontology.insights.stat.edges"), value: metrics.totalEdges },
            { label: t("ontology.insights.stat.density"), value: metrics.linkDensity.toFixed(1) },
            { label: t("ontology.insights.stat.notes"), value: metrics.totalNotes },
            { label: t("ontology.insights.stat.wiki"), value: metrics.totalWiki },
          ]}
        />
      </Section>

      {/* ── Section 2: Coverage Mosaic (3 차트) ── */}
      <section>
        <header className="mb-3">
          <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("ontology.insights.section.coverage")}
          </h3>
        </header>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <TaggedDonut tagged={tagged} untagged={untagged} />
          <OrphanDonut orphans={orphans} connected={connected} />
          <CohesionRadial cohesion={metrics.clusterCohesion} />
        </div>
      </section>

      {/* ── Section 3: Nudge (actionable, keep) ── */}
      <OntologyNudgeSection />

      {/* ── Section 4: Top Notes Bar Chart ── */}
      <section>
        <TopNotesBar
          entries={metrics.topByWAR.map((e) => ({ id: e.id, title: e.title, score: e.score }))}
          onClick={openNote}
        />
      </section>
    </div>
  )
}

/* ── Section wrapper ──────────────────────────────────── */

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section>
      <header className="mb-2 px-2">
        <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </h3>
      </header>
      <div className="flex flex-col">{children}</div>
    </section>
  )
}

/* ── Dense overview strip ──────────────────────────────── */

function StatLine({
  items,
}: {
  items: Array<{ label: string; value: number | string }>
}) {
  return (
    <div className="flex items-stretch divide-x divide-border/40 px-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-1 flex-col gap-0.5 px-3 py-1.5 first:pl-0"
        >
          <span className="text-2xs text-muted-foreground">{item.label}</span>
          <span className="text-sm font-medium tabular-nums text-foreground">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}
