"use client"

import { setActiveRoute } from "@/lib/table-route"
import { QuickCapture } from "@/components/home/quick-capture"
import { StatsRow } from "@/components/home/stats-row"
import { RecentCards } from "@/components/home/recent-cards"
import { MixedQuicklinks } from "@/components/home/mixed-quicklinks"

/**
 * Home view — clean data dashboard.
 *
 * Layout:
 *   1. Quick Capture (centered, narrow)
 *   2. Knowledge base (stats card grid)
 *   3. Recents (card gallery, 4 items)
 *   4. Quicklinks (mixed pinned: notes + wiki + folders + views + bookmarks)
 *   5. CTA to Ontology
 */
export function HomeView() {
  function jumpToOntologyInsights() {
    setActiveRoute("/ontology")
    requestAnimationFrame(() => {
      window.dispatchEvent(
        new CustomEvent("plot:set-ontology-tab", { detail: { tab: "insights" } }),
      )
    })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        {/* ── Quick Capture (centered, narrow) ── */}
        <div className="mx-auto mb-10 max-w-2xl">
          <QuickCapture />
        </div>

        {/* ── Knowledge base (stats) ── */}
        <section className="mb-8">
          <header className="mb-3 px-1">
            <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Knowledge base
            </h3>
          </header>
          <StatsRow />
        </section>

        {/* ── Recents (horizontal card gallery) ── */}
        <section className="mb-8">
          <header className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent
            </h3>
          </header>
          <RecentCards limit={4} />
        </section>

        {/* ── Quicklinks (unified pinned hub) ── */}
        <section className="mb-6">
          <header className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quicklinks
            </h3>
          </header>
          <MixedQuicklinks limit={8} />
        </section>

        {/* ── Subtle CTA into the maintenance hub ── */}
        <div className="flex items-center justify-center pt-2 pb-2">
          <button
            type="button"
            onClick={jumpToOntologyInsights}
            className="text-2xs text-muted-foreground/50 transition-colors duration-100 hover:text-foreground"
          >
            Improve your knowledge graph <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
