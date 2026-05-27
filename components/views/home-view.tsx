"use client"

import { useMemo, type ComponentType, type ReactNode } from "react"
import { usePlotStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { setActiveRoute } from "@/lib/table-route"
import { QuickCapture } from "@/components/home/quick-capture"
import { StatsRow } from "@/components/home/stats-row"
import { RecentCards } from "@/components/home/recent-cards"
import { MixedQuicklinks } from "@/components/home/mixed-quicklinks"
import { DashboardCard } from "@/components/shell/dashboard-card"
import {
  ArrowUpRight,
  Clock as PhClock,
  FileText,
  Sparkles as Sparkle,
  TrendingUp as TrendUp,
} from "lucide-react"
import { IconHome, IconInbox } from "@/components/plot-icons"
import { ViewHeader } from "@/components/view-header"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { useInbox, type InboxItem } from "@/lib/hooks/use-inbox"
import { InboxSourceIcon } from "@/components/inbox/inbox-source-icon"
import type { Note } from "@/lib/types"

type IconComponent = ComponentType<{
  className?: string
  size?: number
  strokeWidth?: number
}>

/**
 * Home view: a calm command surface for capture, triage, and recent context.
 */
export function HomeView() {
  const t = useT()
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const backlinkCounts = useBacklinksIndex()
  const inboxItems = useInbox()

  const liveNoteCount = useMemo(
    () => notes.filter((n) => !n.trashed).length,
    [notes],
  )

  const insights = useMemo(() => {
    const liveNotes = notes.filter((n: Note) => !n.trashed)
    const recentlyEdited = [...liveNotes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)

    const featured = liveNotes
      .filter((n: Note) => n.status !== "stone")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]

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
        title={t("home.title")}
      />
      <div className="plot-home flex-1 overflow-y-auto">
        <div className="plot-home__inner">
          <section className="plot-home__command">
            <div className="plot-home__intro">
              <span className="plot-home__eyebrow">{t("home.knowledge_base")}</span>
              <h2 className="plot-home__title">{t("home.title")}</h2>
              <p className="plot-home__meta">
                {liveNoteCount} notes / {inboxItems.length} inbox
              </p>
            </div>
            <div className="plot-home__capture">
              <QuickCapture />
            </div>
          </section>

          <section className="plot-home__stats" aria-label={t("home.knowledge_base")}>
            <StatsRow />
          </section>

          <section className="plot-home__grid">
            {insights.featured && (
              <button
                type="button"
                onClick={() => handleOpenNote(insights.featured!.id)}
                className="plot-home__feature group"
              >
                <span className="plot-home__feature-icon">
                  <Sparkle size={16} strokeWidth={1.5} />
                </span>
                <span className="plot-home__feature-copy">
                  <span className="plot-home__eyebrow">{t("home.featured_note")}</span>
                  <span className="plot-home__feature-title">
                    {insights.featured.title || "Untitled"}
                  </span>
                  <span className="plot-home__feature-preview">
                    {insights.featured.preview || "No preview available"}
                  </span>
                </span>
                <ArrowUpRight className="plot-home__feature-arrow" size={16} strokeWidth={1.5} />
              </button>
            )}

            {inboxItems.length > 0 && (
              <ContentCard
                title={t("home.inbox")}
                icon={IconInbox}
                trailing={
                  <div className="flex items-center gap-2">
                    <span className="plot-count-pill">{inboxItems.length}</span>
                    <button
                      type="button"
                      onClick={() => setActiveRoute("/inbox")}
                      className="plot-text-action"
                    >
                      {t("home.view_all")}
                      <ArrowUpRight size={12} strokeWidth={1.5} aria-hidden />
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
                    type="button"
                    onClick={() => setActiveRoute("/inbox")}
                    className="plot-row-action"
                  >
                    +{inboxItems.length - 5} more
                  </button>
                )}
              </ContentCard>
            )}
          </section>

          <div className="plot-home__columns">
            <ContentCard title={t("home.recent_activity")} icon={PhClock}>
              {insights.recentlyEdited.map((note) => (
                <NoteItem
                  key={note.id}
                  title={note.title || "Untitled"}
                  meta={shortRelative(note.updatedAt)}
                  onClick={() => handleOpenNote(note.id)}
                />
              ))}
            </ContentCard>

            {insights.withConnections.length > 0 && (
              <ContentCard title={t("home.most_connected")} icon={TrendUp}>
                {insights.withConnections.map(({ note, count }) => (
                  <NoteItem
                    key={note.id}
                    title={note.title || "Untitled"}
                    meta={t("home.links").replace("{count}", String(count))}
                    onClick={() => handleOpenNote(note.id)}
                  />
                ))}
              </ContentCard>
            )}
          </div>

          <section className="plot-section">
            <header className="plot-section__header">
              <h3>{t("home.recent")}</h3>
            </header>
            <RecentCards limit={4} />
          </section>

          <section className="plot-section">
            <header className="plot-section__header">
              <h3>Quicklinks</h3>
            </header>
            <MixedQuicklinks limit={8} />
          </section>

          <div className="plot-home__footer-action">
            <button
              type="button"
              onClick={jumpToOntologyInsights}
              className="plot-text-action"
            >
              Improve your knowledge graph
              <ArrowUpRight size={12} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContentCard({
  title,
  icon: Icon,
  trailing,
  children,
}: {
  title: string
  icon: IconComponent
  trailing?: ReactNode
  children: ReactNode
}) {
  return (
    <DashboardCard
      title={title}
      icon={<Icon className="h-3.5 w-3.5" strokeWidth={1.5} />}
      action={trailing}
      className="plot-card--list"
      bodyClassName="plot-card__body--rows"
    >
      {children}
    </DashboardCard>
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
      type="button"
      onClick={onClick}
      className="plot-list-row group"
    >
      <FileText className="shrink-0 text-muted-foreground" size={14} strokeWidth={1.5} />
      <span className="min-w-0 flex-1 truncate text-note text-foreground">{title}</span>
      <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">{meta}</span>
    </button>
  )
}

function InboxRow({ item, onClick }: { item: InboxItem; onClick: () => void }) {
  const isOverdue = item.action?.toLowerCase().includes("overdue") ?? false
  return (
    <button
      type="button"
      onClick={onClick}
      className="plot-list-row group"
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
