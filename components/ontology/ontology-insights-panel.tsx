"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { useKnowledgeMetrics } from "@/hooks/use-knowledge-metrics"
import { MetricRow } from "./metric-row"
import { OntologyNudgeSection } from "./ontology-nudge-section"

/**
 * Ontology > Insights panel.
 *
 * Sabermetrics-style. Numbers + labels. No charts, no gradients, no cards.
 * Just rows, dividers, and uppercase section captions. Optimised for density:
 * a 1080-tall viewport renders ~30 metrics without scrolling.
 */
export function OntologyInsightsPanel() {
  const metrics = useKnowledgeMetrics()
  const openNote = usePlotStore((s) => s.openNote)

  /* ── Derived display strings ───────────────── */
  const orphanPct = useMemo(() => `${Math.round(metrics.orphanRate * 100)}%`, [metrics.orphanRate])
  const tagPct = useMemo(() => `${Math.round(metrics.tagCoverage * 100)}%`, [metrics.tagCoverage])
  const cohesionPct = useMemo(
    () => `${Math.round(metrics.clusterCohesion * 100)}%`,
    [metrics.clusterCohesion],
  )

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-6">
      {/* ── Overview: dense single-row stats ── */}
      <Section label="Overview">
        <StatLine items={[
          { label: "Notes", value: metrics.totalNotes },
          { label: "Wiki", value: metrics.totalWiki },
          { label: "Edges", value: metrics.totalEdges },
          { label: "Density", value: metrics.linkDensity.toFixed(1) },
        ]} />
      </Section>

      {/* ── Coverage ── */}
      <Section label="Coverage">
        <MetricRow label="Tagged notes" value={tagPct} />
        <MetricRow label="Orphan rate" value={orphanPct} />
        <MetricRow label="Cluster cohesion" value={cohesionPct} />
      </Section>

      {/* ── Nudge — actionable maintenance ── */}
      <OntologyNudgeSection />

      {/* ── Top by WAR ── */}
      <Section label="Knowledge WAR" sublabel="Top notes by composite score">
        {metrics.topByWAR.length === 0 ? (
          <Empty>No notes yet</Empty>
        ) : (
          metrics.topByWAR.map((entry, i) => (
            <MetricRow
              key={entry.id}
              rank={i + 1}
              label={entry.title}
              value={entry.score.toFixed(1)}
              onClick={() => openNote(entry.id)}
            />
          ))
        )}
      </Section>

      {/* ── Concept Reach ── */}
      <Section label="Concept Reach" sublabel="2-hop neighborhood size">
        {metrics.topByConceptReach.length === 0 ? (
          <Empty>No links yet</Empty>
        ) : (
          metrics.topByConceptReach.map((entry, i) => (
            <MetricRow
              key={entry.id}
              rank={i + 1}
              label={entry.title}
              value={entry.reach}
              onClick={() => openNote(entry.id)}
            />
          ))
        )}
      </Section>

      {/* ── Hubs ── */}
      <Section label="Hubs" sublabel="Most backlinked notes">
        {metrics.topHubs.length === 0 ? (
          <Empty>No backlinks yet</Empty>
        ) : (
          metrics.topHubs.map((entry, i) => (
            <MetricRow
              key={entry.id}
              rank={i + 1}
              label={entry.title}
              value={entry.backlinks}
              onClick={() => openNote(entry.id)}
            />
          ))
        )}
      </Section>
    </div>
  )
}

/* ── Section wrapper ──────────────────────────────────── */

function Section({
  label,
  sublabel,
  children,
}: {
  label: string
  sublabel?: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-6 border-b border-border/40 pb-4 last:border-b-0">
      <header className="mb-2 px-2">
        <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </h3>
        {sublabel && (
          <p className="mt-0.5 text-2xs text-muted-foreground/70">{sublabel}</p>
        )}
      </header>
      <div className="flex flex-col">{children}</div>
    </section>
  )
}

/* ── Single-row dense overview strip ──────────────────── */

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

/* ── Empty state ──────────────────────────────────────── */

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 py-1.5 text-2xs text-muted-foreground/70">{children}</p>
  )
}
