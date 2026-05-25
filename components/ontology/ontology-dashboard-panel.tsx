"use client"

/**
 * OntologyDashboardPanel — the "Palantir" tab of the ontology view.
 *
 * Philosophy: pure stats, no action prompts. Sabermetrics for your
 * knowledge base. Insights tab handles "what should I do?". Dashboard
 * answers "what does my graph actually look like, in detail?"
 *
 * Sections (current scaffold):
 *   - Volume         — counts by entity type
 *   - Connectivity   — edge counts by kind, average links
 *   - Health         — actionable rates (orphans, untagged, broken)
 *   - Hubs           — top-N nodes by connection count
 *   - Tag frequency  — top tags by usage count
 *
 * Future sections (deferred to next PR with a proper PRD):
 *   - Time series (notes/edges/wikis added per day, last 30d)
 *   - Connectivity distribution (histogram)
 *   - Cluster analysis (connected component sizes)
 *   - Wiki article stats (avg blocks, infobox usage rate)
 *   - Stickers / Labels / Categories distribution
 *   - Reading stats (most-read notes)
 */

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { useKnowledgeMetrics } from "@/hooks/use-knowledge-metrics"
import { getEntityColor } from "@/lib/colors" // v109: opt-in color fallback
import { useT } from "@/lib/i18n"

export function OntologyDashboardPanel() {
  const t = useT()
  const m = useKnowledgeMetrics()
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const stickers = usePlotStore((s) => s.stickers)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const folders = usePlotStore((s) => s.folders)

  // Note status distribution
  const statusCounts = useMemo(() => {
    const c = { stone: 0, brick: 0, keystone: 0 }
    for (const n of notes) {
      if (n.status === "stone") c.stone++
      else if (n.status === "brick") c.brick++
      else if (n.status === "keystone") c.keystone++
    }
    return c
  }, [notes])

  // Tag usage frequency (top 10)
  const tagFrequency = useMemo(() => {
    const counts = new Map<string, number>()
    for (const n of notes) {
      for (const tid of n.tags) counts.set(tid, (counts.get(tid) ?? 0) + 1)
    }
    for (const w of wikiArticles) {
      for (const tid of w.tags ?? []) counts.set(tid, (counts.get(tid) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tid, count]) => ({
        tag: tags.find((t) => t.id === tid),
        count,
      }))
      .filter((row) => row.tag != null)
  }, [notes, wikiArticles, tags])

  // Top hubs (already in m.topHubs)
  const topHubs = m.topHubs.slice(0, 10)

  // Avg links per node
  const avgLinksPerNote =
    m.totalNotes > 0 ? (m.totalEdges / m.totalNotes).toFixed(2) : "0"

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <header>
        <h2 className="text-xl font-semibold">{t("ontology.dashboard.title")}</h2>
        <p className="text-note text-muted-foreground mt-1">
          {t("ontology.dashboard.subtitle")}
        </p>
      </header>

      {/* ── Volume ── */}
      <Section title={t("ontology.dashboard.section.volume")}>
        <Grid>
          <Stat label={t("ontology.dashboard.stat.notes")} value={m.totalNotes}
            sub={t("ontology.dashboard.meta.status_breakdown")
              .replace("{stone}", String(statusCounts.stone))
              .replace("{brick}", String(statusCounts.brick))
              .replace("{keystone}", String(statusCounts.keystone))} />
          <Stat label={t("ontology.dashboard.stat.wiki_articles")} value={m.totalWiki ?? wikiArticles.length} />
          <Stat label={t("ontology.dashboard.stat.tags")} value={tags.length} />
          <Stat label={t("ontology.dashboard.stat.labels")} value={labels.length} />
          <Stat label={t("ontology.dashboard.stat.stickers")} value={stickers.length} />
          <Stat label={t("ontology.dashboard.stat.wiki_categories")} value={wikiCategories.length} />
          <Stat label={t("ontology.dashboard.stat.folders")} value={folders.length} />
        </Grid>
      </Section>

      {/* ── Connectivity ── */}
      <Section title={t("ontology.dashboard.section.connectivity")}>
        <Grid>
          <Stat label={t("ontology.dashboard.stat.total_edges")} value={m.totalEdges} />
          <Stat label={t("ontology.dashboard.stat.avg_links")} value={avgLinksPerNote} />
          <Stat label={t("ontology.dashboard.stat.most_linked")}
            value={topHubs[0]?.title ?? "—"}
            sub={topHubs[0] ? t("ontology.dashboard.meta.connections").replace("{count}", String(topHubs[0].backlinks)) : ""} />
        </Grid>
      </Section>

      {/* ── Health (actionable rates) ── */}
      <Section title={t("ontology.dashboard.section.health")}>
        <Grid>
          <Stat label={t("ontology.dashboard.stat.orphans")}
            value={Math.round(m.orphanRate * m.totalNotes)}
            sub={t("ontology.dashboard.meta.percent_of_notes").replace("{count}", String(Math.round(m.orphanRate * 100)))}
            warn={m.orphanRate > 0} />
          <Stat label={t("ontology.dashboard.stat.untagged")}
            value={`${Math.round((1 - m.tagCoverage) * 100)}%`}
            sub={t("ontology.dashboard.meta.notes_count").replace("{count}", String(Math.round((1 - m.tagCoverage) * m.totalNotes)))}
            warn={m.tagCoverage < 1} />
          <Stat label={t("ontology.dashboard.stat.wiki_coverage")}
            value={`${m.totalNotes > 0 ? Math.round((m.totalWiki / m.totalNotes) * 100) : 0}%`} />
        </Grid>
      </Section>

      {/* ── Top Hubs ── */}
      <Section title={t("ontology.dashboard.section.top_hubs")}>
        {topHubs.length === 0 ? (
          <Empty>{t("ontology.dashboard.empty.no_connections")}</Empty>
        ) : (
          <ol className="flex flex-col">
            {topHubs.map((hub, i) => (
              <li key={hub.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-b-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xs text-muted-foreground tabular-nums w-5 shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-note truncate">{hub.title}</span>
                  {hub.isWiki && (
                    <span className="text-2xs px-1.5 py-0.5 rounded bg-accent text-accent-foreground shrink-0">
                      {t("nav.space.wiki")}
                    </span>
                  )}
                </div>
                <span className="text-2xs text-muted-foreground tabular-nums shrink-0">
                  {hub.backlinks} {hub.backlinks === 1 ? t("ontology.dashboard.meta.link_singular") : t("ontology.dashboard.meta.link_plural")}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* ── Tag frequency ── */}
      <Section title={t("ontology.dashboard.section.tag_frequency")}>
        {tagFrequency.length === 0 ? (
          <Empty>{t("ontology.dashboard.empty.no_tags")}</Empty>
        ) : (
          <ol className="flex flex-col">
            {tagFrequency.map((row, i) => (
              <li key={row.tag!.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-b-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xs text-muted-foreground tabular-nums w-5 shrink-0">
                    {i + 1}
                  </span>
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getEntityColor(row.tag!.color) }}
                  />
                  <span className="text-note truncate">{row.tag!.name}</span>
                </div>
                <span className="text-2xs text-muted-foreground tabular-nums shrink-0">
                  {row.count} {row.count === 1 ? t("ontology.dashboard.meta.use_singular") : t("ontology.dashboard.meta.use_plural")}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <footer className="text-2xs text-muted-foreground pt-4 border-t border-border-subtle">
        {t("ontology.dashboard.footer")}
      </footer>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</div>
  )
}

function Stat({
  label,
  value,
  sub,
  warn,
}: {
  label: string
  value: string | number
  sub?: string
  warn?: boolean
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-card p-3">
      <div className="text-2xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-medium tabular-nums mt-1 truncate ${warn ? "text-chart-3" : "text-foreground"}`}>
        {value}
      </div>
      {sub && (
        <div className="text-2xs text-muted-foreground mt-0.5 truncate">{sub}</div>
      )}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-note text-muted-foreground py-4 text-center bg-card rounded-md border border-border-subtle">
      {children}
    </div>
  )
}
