"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { setActiveRoute } from "@/lib/table-route"
import { ENTITY_ICONS } from "@/lib/entity-icons"
import { QuickCapture } from "@/components/home/quick-capture"
import { StatsRow } from "@/components/home/stats-row"
import { MixedQuicklinks } from "@/components/home/mixed-quicklinks"
import {
  TrendingUp as TrendUp,
  FileText,
  type LucideIcon,
} from "lucide-react"
import { IconHome } from "@/components/plot-icons"
import { ViewHeader } from "@/components/view-header"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import type { Book, Note } from "@/lib/types"

/**
 * Home view — clean data dashboard (Wiki Dashboard style).
 */
export function HomeView() {
  const t = useT()
  const router = useRouter()
  const notes = usePlotStore((s) => s.notes)
  const books = usePlotStore((s) => s.books)
  const openNote = usePlotStore((s) => s.openNote)
  const tags = usePlotStore((s) => s.tags)
  const backlinkCounts = useBacklinksIndex()

  // Compute insights
  const insights = useMemo(() => {
    const liveNotes = notes.filter((n: Note) => !n.trashed)

    // Most connected notes — out-degree (linksOut) + in-degree (backlinks via index)
    const withConnections = liveNotes
      .map((n: Note) => ({
        note: n,
        count: (n.linksOut?.length ?? 0) + (backlinkCounts.get(n.id) ?? 0),
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)

    return { withConnections }
  }, [notes, backlinkCounts])

  // Most Visited — top 5 cross-entity (Notes + Books) by `reads` desc.
  // Excludes trashed + items with no reads. Mirrors `insights` store reads.
  const mostVisited = useMemo(() => {
    type Visited = { id: string; kind: "note" | "book"; title: string; reads: number }
    const items: Visited[] = []
    for (const n of notes as Note[]) {
      const reads = n.reads ?? 0
      if (n.trashed || reads <= 0) continue
      items.push({ id: n.id, kind: "note", title: n.title || "Untitled", reads })
    }
    for (const b of books as Book[]) {
      const reads = b.reads ?? 0
      if (b.trashed || reads <= 0) continue
      items.push({ id: b.id, kind: "book", title: b.title || "Untitled book", reads })
    }
    return items.sort((a, b) => b.reads - a.reads).slice(0, 5)
  }, [notes, books])

  function jumpToInbox() {
    // §13: graph maintenance nudges moved to Inbox `detected` (발견 단일화).
    // "Improve your knowledge graph" CTA now routes to the Inbox where those
    // suggestions live (the ontology Insights tab was removed).
    setActiveRoute("/inbox")
    router.push("/inbox")
  }

  function handleOpenNote(noteId: string) {
    setActiveRoute("/notes")
    openNote(noteId)
  }

  // Mirror MixedQuicklinks' book-open path (components/home/mixed-quicklinks.tsx).
  function handleOpenBook(bookId: string) {
    setActiveRoute(`/books/${bookId}`)
    router.push(`/books/${bookId}`)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<IconHome size={20} />}
        title={t("home.title")}
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
              {t("home.knowledge_base")}
            </h3>
          </header>
          <StatsRow />
        </section>

        {/* Two-column content */}
        <div className="mb-8 grid grid-cols-1 gap-5 min-[700px]:grid-cols-2">
          {/* Most Connected */}
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

          {/* Most Visited — cross-entity (Notes + Books) by reads. Omitted when empty. */}
          {mostVisited.length > 0 && (
            <ContentCard title={t("home.most_visited")} icon={TrendUp}>
              {mostVisited.map((item, i) => (
                <RankedItem
                  key={`${item.kind}:${item.id}`}
                  rank={i + 1}
                  icon={item.kind === "book" ? ENTITY_ICONS.books : ENTITY_ICONS.notes}
                  title={item.title}
                  count={item.reads}
                  onClick={() =>
                    item.kind === "book" ? handleOpenBook(item.id) : handleOpenNote(item.id)
                  }
                />
              ))}
            </ContentCard>
          )}
        </div>

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
            onClick={jumpToInbox}
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
      <FileText className="shrink-0 text-muted-foreground" size={14} strokeWidth={2.5} />
      <span className="min-w-0 flex-1 truncate text-note text-foreground group-hover:text-foreground">{title}</span>
      <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">{meta}</span>
    </button>
  )
}

/**
 * RankedItem — Most Visited row. Mirrors NoteItem's exact row vocabulary
 * (group/flex/gap-2/rounded-md/px-2.5/py-2 + hover-bg, text-note title,
 * text-2xs tabular-nums count) but prepends a subtle rank number and uses a
 * per-entity glyph (ENTITY_ICONS.notes / .books) instead of a hardcoded icon.
 */
function RankedItem({
  rank,
  icon: Icon,
  title,
  count,
  onClick,
}: {
  rank: number
  icon: LucideIcon
  title: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors duration-100 hover:bg-hover-bg"
    >
      <span className="w-3.5 shrink-0 text-2xs tabular-nums text-muted-foreground/50">{rank}</span>
      <Icon className="shrink-0 text-muted-foreground" size={14} strokeWidth={2.5} />
      <span className="min-w-0 flex-1 truncate text-note text-foreground group-hover:text-foreground">{title}</span>
      <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">{count}</span>
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
