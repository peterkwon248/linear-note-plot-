"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { QuickCapture } from "@/components/home/quick-capture"
import { StatsRow } from "@/components/home/stats-row"
import { RecentCards } from "@/components/home/recent-cards"
import { MixedQuicklinks } from "@/components/home/mixed-quicklinks"
import { Clock as PhClock } from "@phosphor-icons/react/dist/ssr/Clock"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import { TrendUp } from "@phosphor-icons/react/dist/ssr/TrendUp"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { IconInbox } from "@/components/plot-icons"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import type { Note } from "@/lib/types"

/**
 * Home view — clean data dashboard (Wiki Dashboard style).
 */
export function HomeView() {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const tags = usePlotStore((s) => s.tags)
  const backlinkCounts = useBacklinksIndex()

  // Compute insights
  const insights = useMemo(() => {
    const liveNotes = notes.filter((n: Note) => !n.trashed)
    const inboxNotes = liveNotes.filter((n: Note) => n.status === "inbox")
    const recentlyEdited = [...liveNotes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
    
    // Featured note: most recently edited non-inbox note
    const featured = liveNotes
      .filter((n: Note) => n.status !== "inbox")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]

    // Most connected notes — out-degree (linksOut) + in-degree (backlinks via index)
    const withConnections = liveNotes
      .map((n: Note) => ({
        note: n,
        count: (n.linksOut?.length ?? 0) + (backlinkCounts.get(n.id) ?? 0),
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)

    return { inboxNotes, recentlyEdited, featured, withConnections }
  }, [notes, backlinkCounts])

  function jumpToOntologyInsights() {
    setActiveRoute("/ontology")
    requestAnimationFrame(() => {
      window.dispatchEvent(
        new CustomEvent("plot:set-ontology-tab", { detail: { tab: "insights" } }),
      )
    })
  }

  function handleOpenNote(noteId: string) {
    setActiveRoute("/notes")
    openNote(noteId)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        {/* Quick Capture (centered, narrow) */}
        <div className="mx-auto mb-10 max-w-2xl">
          <QuickCapture />
        </div>

        {/* Knowledge base (stats) */}
        <section className="mb-8">
          <header className="mb-3 px-1">
            <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Knowledge base
            </h3>
          </header>
          <StatsRow />
        </section>

        {/* Featured Note */}
        {insights.featured && (
          <button
            onClick={() => handleOpenNote(insights.featured!.id)}
            className="group mb-6 flex w-full items-start gap-4 rounded-lg border border-border bg-card p-4 text-left transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.03] hover:shadow-sm"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Sparkle className="text-accent" size={16} weight="regular" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground/60">Featured Note</span>
              </div>
              <h3 className="text-note font-semibold text-foreground group-hover:text-accent transition-colors">
                {insights.featured.title || "Untitled"}
              </h3>
              <p className="mt-0.5 text-2xs text-muted-foreground line-clamp-1">
                {insights.featured.preview || "No preview available"}
              </p>
            </div>
            <ArrowRight className="mt-1 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-accent" size={16} weight="regular" />
          </button>
        )}

        {/* Inbox Preview (if items exist) */}
        {insights.inboxNotes.length > 0 && (
          <section className="mb-6">
            <ContentCard
              title="Inbox"
              icon={IconInbox}
              iconColor="text-amber-500 dark:text-amber-400"
              trailing={
                <button
                  onClick={() => setActiveRoute("/inbox")}
                  className="text-2xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all <span aria-hidden>→</span>
                </button>
              }
            >
              {insights.inboxNotes.slice(0, 3).map((note) => (
                <NoteItem
                  key={note.id}
                  title={note.title || "Untitled"}
                  meta={shortRelative(note.updatedAt)}
                  onClick={() => handleOpenNote(note.id)}
                />
              ))}
            </ContentCard>
          </section>
        )}

        {/* Two-column content */}
        <div className="mb-8 grid grid-cols-1 gap-5 min-[700px]:grid-cols-2">
          {/* Recent Activity */}
          <ContentCard title="Recent Activity" icon={PhClock}>
            {insights.recentlyEdited.map((note) => (
              <NoteItem
                key={note.id}
                title={note.title || "Untitled"}
                meta={shortRelative(note.updatedAt)}
                onClick={() => handleOpenNote(note.id)}
              />
            ))}
          </ContentCard>

          {/* Most Connected */}
          {insights.withConnections.length > 0 && (
            <ContentCard title="Most Connected" icon={TrendUp}>
              {insights.withConnections.map(({ note, count }) => (
                <NoteItem
                  key={note.id}
                  title={note.title || "Untitled"}
                  meta={`${count} links`}
                  onClick={() => handleOpenNote(note.id)}
                />
              ))}
            </ContentCard>
          )}
        </div>

        {/* Recents (horizontal card gallery) */}
        <section className="mb-8">
          <header className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent
            </h3>
          </header>
          <RecentCards limit={4} />
        </section>

        {/* Quicklinks (unified pinned hub) */}
        <section className="mb-6">
          <header className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quicklinks
            </h3>
          </header>
          <MixedQuicklinks limit={8} />
        </section>

        {/* Subtle CTA into the maintenance hub */}
        <div className="flex items-center justify-center pt-2 pb-2">
          <button
            type="button"
            onClick={jumpToOntologyInsights}
            className="text-2xs text-muted-foreground/60 transition-colors duration-100 hover:text-foreground"
          >
            Improve your knowledge graph <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* Sub-Components */

function ContentCard({
  title,
  icon: Icon,
  iconColor = "text-muted-foreground",
  trailing,
  children,
}: {
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>
  iconColor?: string
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} strokeWidth={1.5} />
          <h3 className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
        </div>
        {trailing}
      </div>
      <div className="px-1.5 py-1">{children}</div>
    </div>
  )
}

function NoteItem({
  title,
  meta,
  onClick,
}: {
  title: string
  meta: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors duration-100 hover:bg-hover-bg"
    >
      <FileText className="shrink-0 text-muted-foreground/50" size={14} weight="regular" />
      <span className="min-w-0 flex-1 truncate text-note text-foreground/90 group-hover:text-foreground">{title}</span>
      <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">{meta}</span>
    </button>
  )
}

function shortRelative(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
