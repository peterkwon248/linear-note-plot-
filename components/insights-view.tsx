"use client"

import { useState, useMemo } from "react"
import {
  AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp,
  Lightbulb, Activity, TrendingUp, FileText, Eye,
  SlidersHorizontal, LayoutList, LayoutGrid,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ViewHeader } from "@/components/view-header"
import { usePlotStore } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { runAnalysis } from "@/lib/analysis/engine"
import { computeActivityStats } from "@/lib/datalog/helpers"
import { format, subDays } from "date-fns"
import type { AnalysisResult, AnalysisSeverity } from "@/lib/analysis/types"

/* ── Severity helpers ─────────────────────────────────── */

const SEVERITY_ORDER: Record<AnalysisSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

const SEVERITY_CONFIG: Record<AnalysisSeverity, {
  dot: string
  badge: string
  icon: typeof AlertCircle
}> = {
  critical: {
    dot: "bg-red-500",
    badge: "bg-red-500/15 text-red-400 border-red-500/20",
    icon: AlertCircle,
  },
  warning: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    icon: AlertTriangle,
  },
  info: {
    dot: "bg-blue-500",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    icon: Info,
  },
}

/* ── StatCard ─────────────────────────────────────────── */

function StatCard({ label, value, icon: Icon, accent }: {
  label: string
  value: number
  icon: typeof Activity
  accent: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[22px] font-semibold text-foreground leading-none">{value}</p>
        <p className="text-2xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  )
}

/* ── MiniBarChart (7-day activity) ────────────────────── */

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">7-Day Activity</span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {data.map((d) => {
          const height = max > 0 ? (d.count / max) * 100 : 0
          const date = new Date(d.date)
          const dayLabel = format(date, "EEE")
          const isToday = format(new Date(), "yyyy-MM-dd") === d.date

          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
                <div
                  className={`w-full max-w-[24px] rounded-sm transition-all ${
                    isToday ? "bg-accent" : "bg-muted-foreground/20"
                  }`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${d.count} events`}
                />
              </div>
              <span className={`text-[9px] ${isToday ? "text-accent font-medium" : "text-muted-foreground/60"}`}>
                {dayLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── MostOpened ───────────────────────────────────────── */

function MostOpenedList({ items }: { items: { noteId: string; title: string; count: number }[] }) {
  const openNote = usePlotStore((s) => s.openNote)

  if (items.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Most Opened</span>
      </div>
      <div className="space-y-0.5">
        {items.map((item, i) => (
          <button
            key={item.noteId}
            onClick={() => openNote(item.noteId)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-secondary"
          >
            <span className="text-2xs text-muted-foreground/50 w-4 text-right">{i + 1}</span>
            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="flex-1 truncate text-note text-foreground/80">{item.title}</span>
            <span className="text-2xs text-muted-foreground">{item.count}×</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── LifecycleStats ───────────────────────────────────── */

function LifecycleStats({ notes }: { notes: any[] }) {
  const active = notes.filter((n) => !n.trashedAt && !n.archivedAt)
  const inbox = active.filter((n) => n.status === "inbox").length
  const capture = active.filter((n) => n.status === "capture").length
  const permanent = active.filter((n) => n.status === "permanent").length
  const wiki = active.filter((n) => n.isWiki).length

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Note Lifecycle</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Inbox", value: inbox, color: "text-chart-3" },
          { label: "Capture", value: capture, color: "text-chart-2" },
          { label: "Permanent", value: permanent, color: "text-chart-5" },
          { label: "Wiki", value: wiki, color: "text-accent" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className={`text-[18px] font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── InsightCard ──────────────────────────────────────── */

const INITIAL_SHOW = 5

function InsightCard({ result }: { result: AnalysisResult }) {
  const [expanded, setExpanded] = useState(false)
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)

  const config = SEVERITY_CONFIG[result.severity]
  const Icon = config.icon

  const matchedNotes = useMemo(() => {
    const idSet = new Set(result.noteIds)
    return notes.filter((n) => idSet.has(n.id))
  }, [notes, result.noteIds])

  const visibleNotes = expanded ? matchedNotes : matchedNotes.slice(0, INITIAL_SHOW)
  const remaining = matchedNotes.length - INITIAL_SHOW

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${config.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{result.label}</span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium ${config.badge}`}>
              {result.count}
            </span>
          </div>
          <p className="mt-0.5 text-note text-muted-foreground">{result.description}</p>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Note list (collapsed by default — shows first 5) */}
      {(expanded || matchedNotes.length <= INITIAL_SHOW) && matchedNotes.length > 0 && (
        <div className="mt-3 space-y-1 pl-5">
          {visibleNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => openNote(note.id)}
              className="block w-full truncate rounded px-2 py-1 text-left text-note text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              {note.title || "Untitled"}
            </button>
          ))}
          {!expanded && remaining > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Show {remaining} more...
            </button>
          )}
        </div>
      )}

      {/* When collapsed and more than INITIAL_SHOW items, show clickable summary */}
      {!expanded && matchedNotes.length > INITIAL_SHOW && (
        <div className="mt-3 pl-5">
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className="h-3 w-3" />
            Show {matchedNotes.length} notes...
          </button>
        </div>
      )}
    </div>
  )
}

/* ── InsightsView ─────────────────────────────────────── */

export function InsightsView() {
  const setViewMode = useSettingsStore((s) => s.setViewMode)
  const [displayOpen, setDisplayOpen] = useState(false)
  const notes = usePlotStore((s) => s.notes)
  const noteEvents = usePlotStore((s) => s.noteEvents)
  const srsMap = usePlotStore((s) => s.srsStateByNoteId)
  const backlinks = useBacklinksIndex()

  // Activity stats
  const activityStats = useMemo(
    () => computeActivityStats(noteEvents ?? [], notes),
    [noteEvents, notes],
  )

  // Analysis results
  const results = useMemo(
    () => runAnalysis(notes, srsMap, backlinks),
    [notes, srsMap, backlinks],
  )

  const sorted = useMemo(
    () => [...results].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
    [results],
  )

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0 }
    for (const r of results) c[r.severity] += 1
    return c
  }, [results])

  const total = results.length

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <ViewHeader
        icon={<Lightbulb className="h-5 w-5" strokeWidth={1.5} />}
        title="Insights"
        actions={
          <Popover open={displayOpen} onOpenChange={setDisplayOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                Display
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="end">
              <div className="flex gap-1 border-b border-border px-3 py-2.5">
                <button
                  onClick={() => { setViewMode("table"); setDisplayOpen(false) }}
                  className="flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                >
                  <LayoutList className="h-4 w-4" />
                  List
                </button>
                <button
                  onClick={() => { setViewMode("board"); setDisplayOpen(false) }}
                  className="flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Board
                </button>
              </div>
            </PopoverContent>
          </Popover>
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* ── Activity Dashboard ────────────────────── */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60 mb-3">
            Activity
          </h3>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <StatCard
              label="Today"
              value={activityStats.todayCount}
              icon={Activity}
              accent="bg-chart-5/15 text-chart-5"
            />
            <StatCard
              label="This Week"
              value={activityStats.weekCount}
              icon={TrendingUp}
              accent="bg-chart-2/15 text-chart-2"
            />
            <StatCard
              label="This Month"
              value={activityStats.monthCount}
              icon={FileText}
              accent="bg-accent/15 text-accent"
            />
          </div>

          {/* 7-day chart + Most Opened + Lifecycle */}
          <div className="grid grid-cols-3 gap-3">
            <MiniBarChart data={activityStats.dailyActivity} />
            <MostOpenedList items={activityStats.mostOpened} />
            <LifecycleStats notes={notes} />
          </div>
        </section>

        {/* ── Health Issues ─────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
              Health
            </h3>
            {total > 0 && (
              <div className="flex items-center gap-1.5">
                {counts.critical > 0 && (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${SEVERITY_CONFIG.critical.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_CONFIG.critical.dot}`} />
                    {counts.critical}
                  </span>
                )}
                {counts.warning > 0 && (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${SEVERITY_CONFIG.warning.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_CONFIG.warning.dot}`} />
                    {counts.warning}
                  </span>
                )}
                {counts.info > 0 && (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${SEVERITY_CONFIG.info.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_CONFIG.info.dot}`} />
                    {counts.info}
                  </span>
                )}
              </div>
            )}
          </div>

          {total === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-secondary/30 py-10 text-center">
              <Lightbulb className="mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm font-medium text-foreground/70">All good!</p>
              <p className="mt-0.5 text-xs text-muted-foreground">No issues detected.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((result) => (
                <InsightCard key={result.ruleId} result={result} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
