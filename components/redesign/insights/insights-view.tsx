"use client"

/**
 * Insights — pure presentational (preview-first redesign scaffolding).
 *
 * 라이브 god: components/insights-view.tsx
 *
 * 모든 className을 라이브에서 글자 그대로 복제. store / i18n / 데이터 hook
 * 의존 0. InsightsViewModel props + UI-로컬 useState만 사용.
 * Open Design 핸드오프 단위.
 *
 * 포팅 범위:
 *   - StatCard 그리드 (3개 — 오늘/이번 주/이번 달)
 *   - MiniBarChart (7일 활동)
 *   - MostOpenedList
 *   - LifecycleStats (backlog/todo/in_progress/done/wiki 5열)
 *   - InsightCard 리스트 (severity dot + badge + 펼침/접힘)
 *   - Health 섹션 severity count 뱃지
 *   - empty state (이슈 없음)
 *
 * 제외 (scope 명시):
 *   - ViewHeader / DisplayPanel chrome (공유 셸 — 별도 surface)
 *   - ontology-graph-canvas (force-directed graph — scope 아님)
 */

import { useState } from "react"
import { format } from "date-fns"
import {
  CircleAlert as WarningCircle,
  TriangleAlert as Warning,
  Info as PhInfo,
  ChevronDown as CaretDown,
  ChevronUp as CaretUp,
  Lightbulb,
  Activity as PhActivity,
  TrendingUp as TrendUp,
  FileText,
  Eye as PhEye,
} from "lucide-react"
import type {
  InsightsViewModel,
  InsightsViewCallbacks,
  InsightResultItem,
  InsightSeverity,
} from "./insights.types"

/* ── Severity config (순수 상수 — 라이브 SEVERITY_CONFIG 그대로) ─── */

const SEVERITY_CONFIG: Record<InsightSeverity, {
  dot: string
  badge: string
  icon: typeof WarningCircle
}> = {
  critical: {
    dot: "bg-red-500",
    badge: "bg-red-500/15 text-red-400 border-red-500/20",
    icon: WarningCircle,
  },
  warning: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    icon: Warning,
  },
  info: {
    dot: "bg-blue-500",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    icon: PhInfo,
  },
}

/* ── StatCard ─────────────────────────────────────────────────────── */

function StatCard({ label, value, icon: Icon, accent }: {
  label: string
  value: number
  icon: typeof PhActivity
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

/* ── MiniBarChart (7-day activity) ───────────────────────────────── */

function MiniBarChart({
  data,
  chartLabel,
  eventsCountTemplate,
}: {
  data: { date: string; count: number }[]
  chartLabel: string
  eventsCountTemplate: string
}) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendUp className="text-muted-foreground" size={14} strokeWidth={2} />
        <span className="text-2xs font-medium text-muted-foreground">{chartLabel}</span>
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
                  title={eventsCountTemplate.replace("{count}", String(d.count))}
                />
              </div>
              <span className={`text-2xs ${isToday ? "text-accent font-medium" : "text-muted-foreground/60"}`}>
                {dayLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── MostOpenedList ───────────────────────────────────────────────── */

function MostOpenedList({
  items,
  sectionLabel,
  onOpenNote,
}: {
  items: { noteId: string; title: string; count: number }[]
  sectionLabel: string
  onOpenNote?: (noteId: string) => void
}) {
  if (items.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <PhEye className="text-muted-foreground" size={14} strokeWidth={2} />
        <span className="text-2xs font-medium text-muted-foreground">{sectionLabel}</span>
      </div>
      <div className="space-y-0.5">
        {items.map((item, i) => (
          <button
            key={item.noteId}
            onClick={() => onOpenNote?.(item.noteId)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-hover-bg"
          >
            <span className="text-2xs text-muted-foreground/70 w-4 text-right">{i + 1}</span>
            <FileText className="text-muted-foreground shrink-0" size={12} strokeWidth={2} />
            <span className="flex-1 truncate text-note text-foreground/80">{item.title}</span>
            <span className="text-2xs text-muted-foreground">{item.count}×</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── LifecycleStats ───────────────────────────────────────────────── */

function LifecycleStats({
  counts,
  labels,
}: {
  counts: {
    backlog: number
    todo: number
    inProgress: number
    done: number
    wiki: number
  }
  labels: {
    sectionLabel: string
    backlog: string
    todo: string
    inProgress: string
    done: string
    wiki: string
  }
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <PhActivity className="text-muted-foreground" size={14} strokeWidth={2} />
        <span className="text-2xs font-medium text-muted-foreground">{labels.sectionLabel}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: labels.backlog, value: counts.backlog, color: "text-chart-3" },
          { label: labels.todo, value: counts.todo, color: "text-chart-1" },
          { label: labels.inProgress, value: counts.inProgress, color: "text-chart-2" },
          { label: labels.done, value: counts.done, color: "text-chart-5" },
          { label: labels.wiki, value: counts.wiki, color: "text-accent" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className={`text-lg font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-2xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── InsightCard ──────────────────────────────────────────────────── */

const INITIAL_SHOW = 5

function InsightCard({
  result,
  showNMoreTemplate,
  showNNotesTemplate,
  onOpenNote,
}: {
  result: InsightResultItem
  showNMoreTemplate: string
  showNNotesTemplate: string
  onOpenNote?: (noteId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const config = SEVERITY_CONFIG[result.severity]
  const Icon = config.icon
  const matchedNotes = result.matchedNotes
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
            <span className="text-note font-semibold text-foreground">{result.label}</span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium ${config.badge}`}>
              {result.count}
            </span>
          </div>
          <p className="mt-0.5 text-note text-muted-foreground">{result.description}</p>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
        >
          {expanded ? <CaretUp size={16} strokeWidth={2} /> : <CaretDown size={16} strokeWidth={2} />}
        </button>
      </div>

      {/* Note list (collapsed by default — shows first 5) */}
      {(expanded || matchedNotes.length <= INITIAL_SHOW) && matchedNotes.length > 0 && (
        <div className="mt-3 space-y-1 pl-5">
          {visibleNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => onOpenNote?.(note.id)}
              className="block w-full truncate rounded px-2 py-1 text-left text-note text-foreground/80 transition-colors hover:bg-hover-bg hover:text-foreground"
            >
              {note.title || "Untitled"}
            </button>
          ))}
          {!expanded && remaining > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="px-2 py-1 text-2xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {showNMoreTemplate.replace("{count}", String(remaining))}
            </button>
          )}
        </div>
      )}

      {/* When collapsed and more than INITIAL_SHOW items, show clickable summary */}
      {!expanded && matchedNotes.length > INITIAL_SHOW && (
        <div className="mt-3 pl-5">
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 px-2 py-1 text-2xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <CaretDown size={12} strokeWidth={2} />
            {showNNotesTemplate.replace("{count}", String(matchedNotes.length))}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── InsightsView (메인 export) ───────────────────────────────────── */

export function InsightsView({
  vm,
  callbacks = {},
}: {
  vm: InsightsViewModel
  callbacks?: InsightsViewCallbacks
}) {
  const { labels, activityStats, lifecycleCounts, severityCounts, sortedResults } = vm
  const total = sortedResults.length

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* ── Activity Dashboard ──────────────────────── */}
        <section>
          <h3 className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60 mb-3">
            {labels.sectionActivity}
          </h3>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <StatCard
              label={labels.statToday}
              value={activityStats.todayCount}
              icon={PhActivity}
              accent="bg-chart-5/15 text-chart-5"
            />
            <StatCard
              label={labels.statThisWeek}
              value={activityStats.weekCount}
              icon={TrendUp}
              accent="bg-chart-2/15 text-chart-2"
            />
            <StatCard
              label={labels.statThisMonth}
              value={activityStats.monthCount}
              icon={FileText}
              accent="bg-accent/15 text-accent"
            />
          </div>

          {/* 7-day chart + Most Opened + Lifecycle */}
          <div className="grid grid-cols-3 gap-3">
            <MiniBarChart
              data={activityStats.dailyActivity}
              chartLabel={labels.chart7dayActivity}
              eventsCountTemplate={labels.eventsCount}
            />
            <MostOpenedList
              items={activityStats.mostOpened}
              sectionLabel={labels.sectionMostOpened}
              onOpenNote={callbacks.onOpenNote}
            />
            <LifecycleStats
              counts={lifecycleCounts}
              labels={{
                sectionLabel: labels.sectionLifecycle,
                backlog: labels.statusBacklog,
                todo: labels.statusTodo,
                inProgress: labels.statusInProgress,
                done: labels.statusDone,
                wiki: labels.lifecycleWiki,
              }}
            />
          </div>
        </section>

        {/* ── Health Issues ─────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/60">
              {labels.sectionHealth}
            </h3>
            {total > 0 && (
              <div className="flex items-center gap-1.5">
                {severityCounts.critical > 0 && (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium ${SEVERITY_CONFIG.critical.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_CONFIG.critical.dot}`} />
                    {severityCounts.critical}
                  </span>
                )}
                {severityCounts.warning > 0 && (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium ${SEVERITY_CONFIG.warning.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_CONFIG.warning.dot}`} />
                    {severityCounts.warning}
                  </span>
                )}
                {severityCounts.info > 0 && (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium ${SEVERITY_CONFIG.info.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_CONFIG.info.dot}`} />
                    {severityCounts.info}
                  </span>
                )}
              </div>
            )}
          </div>

          {total === 0 ? (
            /* Compact empty state — no oversized empty box (chunk 3a polish). */
            <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-secondary/20 px-4 py-2.5 text-note">
              <Lightbulb className="shrink-0 text-muted-foreground/60" size={14} strokeWidth={2} />
              <span className="font-medium text-foreground/70">{labels.emptyAllGood}</span>
              <span className="text-muted-foreground">{labels.emptyNoIssues}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedResults.map((result) => (
                <InsightCard
                  key={result.ruleId}
                  result={result}
                  showNMoreTemplate={labels.showNMore}
                  showNNotesTemplate={labels.showNNotes}
                  onOpenNote={callbacks.onOpenNote}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
