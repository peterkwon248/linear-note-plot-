"use client"

import { useMemo } from "react"
import { ViewHeader } from "@/components/view-header"
import { useT } from "@/lib/i18n"
import { usePlotStore } from "@/lib/store"
import { IconInsight } from "@/components/plot-icons"
import { StatusShapeIcon } from "@/components/status-icon"
import { STATUS_CONFIG } from "@/components/note-fields"
import { NOTE_STATUS_HEX } from "@/lib/colors"
import { WIKI_STATUS_ORDER } from "@/lib/view-engine/wiki-list-pipeline"
import { WikiInsightsChart } from "@/components/wiki-editor/wiki-insights-chart"
import { setWikiViewMode, setWikiStatusFilter } from "@/lib/wiki-view-mode"
import { setActiveRoute } from "@/lib/table-route"
import { useRouter } from "next/navigation"
import type { WikiStatus } from "@/lib/types"

/* ── Status breakdown card ────────────────────────────────
 * 4-stage status count (backlog/todo/in_progress/done) for wiki articles,
 * fully unified with Notes — shared StatusShapeIcon + NOTE_STATUS_HEX +
 * status.* i18n labels. Clicking a stage jumps to the wiki list filtered by
 * that status (drives the same `wikiStatusFilter` external store the sidebar
 * status links use). */
function WikiStatusBreakdown({
  counts,
  onSelectStatus,
  t,
}: {
  counts: Record<WikiStatus, number>
  onSelectStatus: (status: WikiStatus) => void
  t: (k: string) => string
}) {
  const total = WIKI_STATUS_ORDER.reduce((sum, s) => sum + counts[s], 0)

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xs font-medium text-muted-foreground">
          {t("wiki.insights.section.status")}
        </span>
        <span className="text-2xs tabular-nums text-muted-foreground/60">{total}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {WIKI_STATUS_ORDER.map((status) => {
          const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.backlog
          return (
            <button
              key={status}
              onClick={() => onSelectStatus(status)}
              className="flex flex-col items-center gap-1.5 rounded-md px-2 py-2.5 transition-colors hover:bg-hover-bg"
            >
              <StatusShapeIcon status={status} size={18} />
              <span
                className="text-lg font-semibold tabular-nums leading-none"
                style={{ color: NOTE_STATUS_HEX[status] }}
              >
                {counts[status]}
              </span>
              <span className="text-2xs text-muted-foreground">{t(cfg.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── WikiInsightsView ─────────────────────────────────────
 * Wiki entity Insights page (entity-insights-coherence.plan.md FR-1).
 * Mirrors the Notes `insights-view.tsx` layout (ViewHeader + sectioned
 * scroll body). Reuses the existing `WikiInsightsChart` (Growth/Connectivity)
 * verbatim and adds the shared 4-stage status breakdown. */
export function WikiInsightsView() {
  const t = useT()
  const router = useRouter()
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  // Live (non-trashed) wiki articles — same predicate as wiki-view's wikiNotes,
  // so the status counts here match the list/dashboard.
  const wikiNotes = useMemo(
    () => wikiArticles.filter((a) => !(a as { trashed?: boolean }).trashed),
    [wikiArticles],
  )

  const statusCounts = useMemo(() => {
    const counts: Record<WikiStatus, number> = { backlog: 0, todo: 0, in_progress: 0, done: 0 }
    for (const a of wikiNotes) counts[a.status]++
    return counts
  }, [wikiNotes])

  // Status stage click → open the wiki list scoped to that status (same
  // mechanism the sidebar status nav links use).
  const handleSelectStatus = (status: WikiStatus) => {
    setWikiStatusFilter(status)
    setWikiViewMode("list")
    setActiveRoute("/wiki")
    router.push("/wiki")
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header — mirrors Notes insights ViewHeader. */}
      <ViewHeader icon={<IconInsight size={20} />} title={t("sidebar.insights")} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* ── Status breakdown ──────────────────────── */}
        <section>
          <h3 className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 mb-3">
            {t("wiki.insights.section.status")}
          </h3>
          <WikiStatusBreakdown counts={statusCounts} onSelectStatus={handleSelectStatus} t={t} />
        </section>

        {/* ── Growth / Connectivity ─────────────────── */}
        <section>
          <h3 className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 mb-3">
            {t("wiki.insights.section.trends")}
          </h3>
          <WikiInsightsChart notes={notes} wikiArticles={wikiNotes} />
        </section>
      </div>
    </div>
  )
}
