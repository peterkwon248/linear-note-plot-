"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { ViewHeader } from "@/components/view-header"
import { shortRelative } from "@/lib/format-utils"
import type React from "react"
import { GitBranch } from "@phosphor-icons/react/dist/ssr/GitBranch"
import { Circle as PhCircle } from "@phosphor-icons/react/dist/ssr/Circle"
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { TrendUp } from "@phosphor-icons/react/dist/ssr/TrendUp"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Clock as PhClock } from "@phosphor-icons/react/dist/ssr/Clock"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { WorkspaceEditorArea } from "@/components/workspace/workspace-editor-area"
import { usePane, usePaneOpenNote } from "@/components/workspace/pane-context"

/* ── StatCard ─────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  suffix,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>
  label: string
  value: string | number
  color: string
  suffix?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-4 w-4", color)} strokeWidth={1.5} />
        <span className="text-2xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums text-foreground">
        {value}
        {suffix && (
          <span className="text-lg font-normal text-muted-foreground">{suffix}</span>
        )}
      </p>
    </div>
  )
}

/* ── DashboardCard ────────────────────────────────────── */

function DashboardCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {title}
      </h3>
      {subtitle && (
        <p className="text-2xs text-muted-foreground mb-3">{subtitle}</p>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

/* ── GraphInsightsView ────────────────────────────────── */

export function GraphInsightsView() {
  const notes = usePlotStore((s) => s.notes)
  const relations = usePlotStore((s) => s.relations)
  const openNote = usePaneOpenNote()
  const selectedNoteIdStore = usePlotStore((s) => s.selectedNoteId)
  const pane = usePane()
  const isEditing = pane === 'primary' && selectedNoteIdStore !== null
  const backlinkCounts = useBacklinksIndex()

  /* ── Core stats ── */
  const nonTrashed = useMemo(() => notes.filter((n) => !n.trashed), [notes])

  const nodeCount = nonTrashed.length

  const edgeCount = useMemo(
    () => nonTrashed.reduce((sum, n) => sum + (n.linksOut?.length ?? 0), 0),
    [nonTrashed]
  )

  const density = useMemo(() => {
    const n = nodeCount
    if (n < 2) return 0
    const possible = n * (n - 1)
    return ((edgeCount / possible) * 100).toFixed(2)
  }, [nodeCount, edgeCount])

  /* ── Orphan calculation ── */
  const orphans = useMemo(() => {
    return nonTrashed.filter((n) => {
      const hasOut = n.linksOut && n.linksOut.length > 0
      const hasIn = (backlinkCounts.get(n.id) ?? 0) > 0
      return !hasOut && !hasIn
    })
  }, [nonTrashed, backlinkCounts])

  /* ── Hub calculation ── */
  const hubs = useMemo(() => {
    return nonTrashed
      .map((n) => ({
        note: n,
        connections: (n.linksOut?.length ?? 0) + (backlinkCounts.get(n.id) ?? 0),
      }))
      .filter((h) => h.connections >= 5)
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 8)
  }, [nonTrashed, backlinkCounts])

  const hubCount = useMemo(
    () =>
      nonTrashed.filter(
        (n) => (n.linksOut?.length ?? 0) + (backlinkCounts.get(n.id) ?? 0) >= 5
      ).length,
    [nonTrashed, backlinkCounts]
  )

  /* ── Wiki coverage ── */
  const wikiNotes = useMemo(() => nonTrashed.filter((n) => n.noteType === "wiki"), [nonTrashed])
  const wikiPercent = useMemo(
    () => (nodeCount > 0 ? Math.round((wikiNotes.length / nodeCount) * 100) : 0),
    [wikiNotes.length, nodeCount]
  )
  /* ── Recently linked notes ── */
  const recentlyLinked = useMemo(() => {
    return [...nonTrashed]
      .filter((n) => n.linksOut && n.linksOut.length > 0)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [nonTrashed])

  // ── Workspace editor area: show when editing in primary pane ──
  if (isEditing) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <WorkspaceEditorArea />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<GitBranch size={20} weight="regular" />}
        title="Graph Insights"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[860px] px-6 py-8">
          {/* ── Stat cards row ── */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            <StatCard
              icon={PhCircle}
              label="Nodes"
              value={nodeCount}
              color="text-foreground"
            />
            <StatCard
              icon={PhLink}
              label="Edges"
              value={edgeCount}
              color="text-accent"
            />
            <StatCard
              icon={Warning}
              label="Orphans"
              value={orphans.length}
              color={orphans.length > 0 ? "text-chart-3" : "text-muted-foreground"}
            />
            <StatCard
              icon={Lightning}
              label="Hubs"
              value={hubCount}
              color="text-chart-2"
            />
            {/* Density card with progress bar */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendUp className="text-chart-5" size={16} weight="regular" />
                <span className="text-2xs font-medium text-muted-foreground">Density</span>
              </div>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {density}
                <span className="text-lg font-normal text-muted-foreground">%</span>
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-chart-5 transition-all duration-200"
                  style={{ width: `${Math.min(parseFloat(String(density)) * 10, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-2xs text-muted-foreground">
                {edgeCount} / {nodeCount > 1 ? nodeCount * (nodeCount - 1) : 0} possible
              </p>
            </div>
          </div>

          {/* ── Insight cards 2-col grid ── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Orphan Nodes */}
            <DashboardCard
              title="Orphan Nodes"
              subtitle="No connections detected"
            >
              {orphans.length === 0 ? (
                <p className="text-2xs text-muted-foreground py-2 px-2">
                  No orphan nodes — your graph is well connected.
                </p>
              ) : (
                orphans.slice(0, 8).map((note) => (
                  <button
                    key={note.id}
                    onClick={() => openNote(note.id)}
                    className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-hover-bg"
                  >
                    <FileText className="shrink-0 text-chart-3" size={12} weight="regular" />
                    <span className="min-w-0 flex-1 truncate text-2xs text-foreground">
                      {note.title || "Untitled"}
                    </span>
                    <span className="hidden shrink-0 text-2xs font-medium text-accent group-hover:block">
                      Open
                    </span>
                  </button>
                ))
              )}
              {orphans.length > 8 && (
                <p className="px-2 pt-1 text-2xs text-muted-foreground">
                  +{orphans.length - 8} more orphan nodes
                </p>
              )}
            </DashboardCard>

            {/* Hub Nodes */}
            <DashboardCard
              title="Hub Nodes"
              subtitle="Most connected nodes"
            >
              {hubs.length === 0 ? (
                <p className="text-2xs text-muted-foreground py-2 px-2">
                  No hub nodes yet (5+ connections required).
                </p>
              ) : (
                hubs.slice(0, 5).map(({ note, connections }) => (
                  <button
                    key={note.id}
                    onClick={() => openNote(note.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-hover-bg"
                  >
                    <Lightning className="shrink-0 text-chart-2" size={12} weight="regular" />
                    <span className="min-w-0 flex-1 truncate text-2xs text-foreground">
                      {note.title || "Untitled"}
                    </span>
                    <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
                      {connections} links
                    </span>
                  </button>
                ))
              )}
            </DashboardCard>

            {/* Wiki Coverage */}
            <DashboardCard
              title="Wiki Coverage"
              subtitle="Wiki article distribution"
            >
              <div className="px-2 py-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-2xs text-muted-foreground">Total Notes</p>
                    <p className="text-ui font-semibold tabular-nums text-foreground">
                      {nodeCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xs text-muted-foreground">Wiki Articles</p>
                    <p className="text-ui font-semibold tabular-nums text-accent">
                      {wikiNotes.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xs text-muted-foreground">Coverage</p>
                    <p className="text-ui font-semibold tabular-nums text-foreground">
                      {wikiPercent}%
                    </p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xs text-muted-foreground">Wiki %</span>
                    <span className="text-2xs tabular-nums text-muted-foreground">
                      {wikiNotes.length} / {nodeCount}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-200"
                      style={{ width: `${wikiPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </DashboardCard>

            {/* Recent Connections */}
            <DashboardCard
              title="Recent Connections"
              subtitle="Recently linked notes"
            >
              {recentlyLinked.length === 0 ? (
                <p className="text-2xs text-muted-foreground py-2 px-2">
                  No linked notes yet.
                </p>
              ) : (
                recentlyLinked.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => openNote(note.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-hover-bg"
                  >
                    <PhClock className="shrink-0 text-muted-foreground" size={12} weight="regular" />
                    <span className="min-w-0 flex-1 truncate text-2xs text-foreground">
                      {note.title || "Untitled"}
                    </span>
                    <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
                      {note.linksOut?.length ?? 0} out
                    </span>
                    <span className="ml-1 shrink-0 text-2xs tabular-nums text-muted-foreground">
                      · {shortRelative(note.updatedAt)}
                    </span>
                  </button>
                ))
              )}
            </DashboardCard>
          </div>
        </div>
      </div>
    </div>
  )
}
