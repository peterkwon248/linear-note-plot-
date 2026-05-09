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
import { IconInbox, IconHome } from "@/components/plot-icons"
import { ViewHeader } from "@/components/view-header"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { useInbox, type InboxItem } from "@/lib/hooks/use-inbox"
import { InboxSourceIcon } from "@/components/inbox/inbox-source-icon"
import type { Note } from "@/lib/types"
import type { InboxItemKind } from "@/lib/store/slices/inbox"

/**
 * Home view — clean data dashboard (Wiki Dashboard style).
 */
export function HomeView() {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const tags = usePlotStore((s) => s.tags)
  const backlinkCounts = useBacklinksIndex()
  const inboxItems = useInbox()

  // Compute insights
  const insights = useMemo(() => {
    const liveNotes = notes.filter((n: Note) => !n.trashed)
    const recentlyEdited = [...liveNotes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)

    // Featured note: most recently edited non-stone note
    const featured = liveNotes
      .filter((n: Note) => n.status !== "stone")
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

    return { recentlyEdited, featured, withConnections }
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
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<IconHome size={20} />}
        title="Home"
      />
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
            <ArrowRight className="mt-1 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-accent" size={16} weight="regular" />
          </button>
        )}

        {/* Inbox card — action-based notification queue */}
        {inboxItems.length > 0 && (
          <section className="mb-6">
            <ContentCard
              title="Inbox"
              icon={IconInbox}
              iconColor="text-muted-foreground"
              trailing={
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-2xs font-medium tabular-nums text-muted-foreground">
                    {inboxItems.length}
                  </span>
                  <button
                    onClick={() => setActiveRoute("/inbox")}
                    className="text-2xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View all <span aria-hidden>→</span>
                  </button>
                </div>
              }
            >
              {inboxItems.slice(0, 5).map((item) => (
                <InboxRow
                  key={`${item.kind}:${item.sourceId}`}
                  item={item}
                  onClick={() => {
                    if (item.kind === "wiki-redlink" || item.kind === "auto-enroll") {
                      setActiveRoute("/wiki")
                    } else {
                      handleOpenNote(item.sourceId)
                    }
                  }}
                />
              ))}
              {inboxItems.length > 5 && (
                <button
                  onClick={() => setActiveRoute("/inbox")}
                  className="w-full px-2.5 py-1.5 text-left text-2xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                >
                  +{inboxItems.length - 5} more
                </button>
              )}
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
      <FileText className="shrink-0 text-muted-foreground" size={14} weight="bold" />
      <span className="min-w-0 flex-1 truncate text-note text-foreground group-hover:text-foreground">{title}</span>
      <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">{meta}</span>
    </button>
  )
}

function InboxRow({ item, onClick }: { item: InboxItem; onClick: () => void }) {
  const isOverdue = item.action?.toLowerCase().includes("overdue") ?? false
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors duration-100 hover:bg-hover-bg"
    >
      <InboxSourceIcon
        kind={item.kind}
        className="shrink-0 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground/70"
      />
      <span className="min-w-0 flex-1 truncate text-note text-foreground">
        {item.title}
      </span>
      {item.action && (
        <span
          className={`shrink-0 text-2xs tabular-nums ${
            isOverdue
              ? "text-amber-500 dark:text-amber-400"
              : "text-muted-foreground"
          }`}
        >
          {item.action}
        </span>
      )}
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
