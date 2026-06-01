/**
 * Insights surface view-model — props 계약.
 *
 * 라이브 `InsightsView`(components/insights-view.tsx)에서 store/i18n 의존을
 * 모두 제거한 순수 plain data 계약. mock이 실제 한국어 리터럴을 제공하고,
 * presentational은 이 타입만 보고 렌더한다.
 *
 * 라이브 `notes: any[]` (LifecycleStats) → 여기서 NoteLifecycleSummary 정의.
 * AnalysisResult noteIds: string[] → matchedNotes를 미리 계산해 prop으로 전달.
 */

export type InsightSeverity = "info" | "warning" | "critical"

/* ── Activity stats (computeActivityStats 반환형 그대로) ─────────────── */

export interface DailyActivityPoint {
  /** "yyyy-MM-dd" 포맷 */
  date: string
  count: number
}

export interface MostOpenedItem {
  noteId: string
  title: string
  count: number
}

export interface ActivityStats {
  todayCount: number
  weekCount: number
  monthCount: number
  mostOpened: MostOpenedItem[]
  /** 최근 7일 — 길이 7 고정 */
  dailyActivity: DailyActivityPoint[]
}

/* ── Lifecycle stats (LifecycleStats 서브컴포넌트용) ────────────────── */

export interface LifecycleCounts {
  backlog: number
  todo: number
  inProgress: number
  done: number
  wiki: number
}

/* ── Severity config (SEVERITY_CONFIG 순수 상수 버전) ───────────────── */

export interface SeverityConfig {
  dot: string
  badge: string
}

/* ── Analysis result (InsightCard 단위) ─────────────────────────────── */

/** 라이브 AnalysisResult + pre-resolved note titles (store 읽기 제거용) */
export interface InsightResultItem {
  ruleId: string
  label: string
  description: string
  severity: InsightSeverity
  count: number
  /** store에서 미리 resolve된 노트 목록 (id + title) */
  matchedNotes: { id: string; title: string }[]
}

/* ── Section labels (i18n 문자열 — mock이 한국어 리터럴 제공) ────────── */

export interface InsightsLabels {
  /** sidebar.insights */
  pageTitle: string
  /** notes.insights.section.activity */
  sectionActivity: string
  /** notes.insights.stat.today */
  statToday: string
  /** notes.insights.stat.this_week */
  statThisWeek: string
  /** notes.insights.stat.this_month */
  statThisMonth: string
  /** notes.insights.chart.7day_activity */
  chart7dayActivity: string
  /** notes.insights.section.most_opened */
  sectionMostOpened: string
  /** notes.insights.section.lifecycle */
  sectionLifecycle: string
  /** status.backlog */
  statusBacklog: string
  /** status.todo */
  statusTodo: string
  /** status.in_progress */
  statusInProgress: string
  /** status.done */
  statusDone: string
  /** notes.insights.lifecycle.wiki */
  lifecycleWiki: string
  /** notes.insights.section.health */
  sectionHealth: string
  /** notes.insights.empty.all_good */
  emptyAllGood: string
  /** notes.insights.empty.no_issues */
  emptyNoIssues: string
  /** notes.insights.show_n_more: "{count}개 더 보기" */
  showNMore: string
  /** notes.insights.show_n_notes: "노트 {count}개 모두 보기" */
  showNNotes: string
  /** notes.insights.events_count (tooltip): "{count}건" */
  eventsCount: string
}

/* ── Top-level view-model ────────────────────────────────────────────── */

export interface InsightsViewModel {
  labels: InsightsLabels
  activityStats: ActivityStats
  lifecycleCounts: LifecycleCounts
  /** severity별 count (health 섹션 뱃지) */
  severityCounts: { critical: number; warning: number; info: number }
  /** severity 내림차순 정렬 완료된 인사이트 목록 */
  sortedResults: InsightResultItem[]
}

/* ── Callbacks ───────────────────────────────────────────────────────── */

export interface InsightsViewCallbacks {
  onOpenNote?: (noteId: string) => void
}
