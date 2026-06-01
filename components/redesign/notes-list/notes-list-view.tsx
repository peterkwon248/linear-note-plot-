"use client"

/**
 * Notes-list surface — pure presentational (preview-first redesign scaffolding).
 *
 * Faithful port of the live notes surface:
 *   - column header chrome:  components/notes-table.tsx `TH` + `COLUMN_DEFS` (L138-L208)
 *   - row layout:            components/notes-table.tsx `NoteRowInner` (L1781-L2105)
 *   - group header:          components/notes-table.tsx group header branch (L1478-L1527)
 *   - container / sort chip: components/notes-table.tsx main return (L1165-L1324)
 *
 * Every className is copied verbatim from those code paths. Store reads / i18n /
 * routing replaced by `NotesListViewModel` props (see ./notes-list.types.ts).
 * No usePlotStore / useRouter / useT here — this is the unit handed to Open Design.
 *
 * Intentionally omitted (visual-only stubs or out of scope):
 *   - drag-to-select rectangle
 *   - virtual scrolling (plain .map — preview set is small)
 *   - TrashEntityList / trash tab sub-filter
 *   - context menus
 *   - FloatingActionBar (multi-select)
 *   - FilterChipBar / ViewHeader chrome (shared shell, separate surface)
 */

import { useState } from "react"
import {
  ArrowUp,
  ArrowDown,
  ArrowDownUp as ArrowsDownUp,
  ChevronDown as CaretDown,
  Pin as PushPin,
  X as PhX,
  Check as PhCheck,
  Minus as PhMinus,
  Globe,
  Download as DownloadSimple,
  Share2 as ShareNetwork,
  Zap as Lightning,
  Pencil as PencilSimple,
  SquarePen as PhNotePencil,
} from "lucide-react"
import { CircleDashed } from "@phosphor-icons/react/dist/ssr/CircleDashed"
import { Circle } from "@phosphor-icons/react/dist/ssr/Circle"
import { CircleHalf } from "@phosphor-icons/react/dist/ssr/CircleHalf"
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle"
import { StatusShapeIcon } from "@/components/status-icon"
import type { NoteSource, NoteStatus } from "@/lib/types"
import type {
  NotesListViewModel,
  NotesListCallbacks,
  NotesListNote,
  NoteColumnDef,
  SortField,
  SortDirection,
} from "./notes-list.types"

/* ── Pure STATUS_CONFIG (no useT) ───────────────────────── */
// Inlined from components/note-fields.tsx STATUS_CONFIG — label literals
// in Korean so the preview renders real text. CSS vars resolve from globals.css.
const STATUS_CONFIG_PURE: Record<
  NoteStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  backlog: {
    label: "백로그",
    color: "var(--status-backlog)",
    bg: "color-mix(in srgb, var(--status-backlog) 18%, transparent)",
    border: "color-mix(in srgb, var(--status-backlog) 35%, transparent)",
    icon: <CircleDashed size={14} weight="bold" />,
  },
  todo: {
    label: "할 일",
    color: "var(--status-todo)",
    bg: "color-mix(in srgb, var(--status-todo) 18%, transparent)",
    border: "color-mix(in srgb, var(--status-todo) 35%, transparent)",
    icon: <Circle size={14} weight="bold" />,
  },
  in_progress: {
    label: "진행 중",
    color: "var(--status-in_progress)",
    bg: "color-mix(in srgb, var(--status-in_progress) 18%, transparent)",
    border: "color-mix(in srgb, var(--status-in_progress) 35%, transparent)",
    icon: <CircleHalf size={14} weight="bold" />,
  },
  done: {
    label: "완료",
    color: "var(--status-done)",
    bg: "color-mix(in srgb, var(--status-done) 18%, transparent)",
    border: "color-mix(in srgb, var(--status-done) 35%, transparent)",
    icon: <CheckCircle size={14} weight="bold" />,
  },
}

/* ── SourceIcon ─────────────────────────────────────────── */
// Verbatim from notes-table.tsx L1761-L1771

function SourceIcon({ source }: { source: NoteSource }) {
  const Icon = {
    manual: PencilSimple,
    webclip: Globe,
    import: DownloadSimple,
    share: ShareNetwork,
    api: Lightning,
  }[source ?? "manual"]
  if (!Icon) return null
  return <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
}

/* ── Pure StatusBadge ───────────────────────────────────── */
// Inline reimplementation of StatusBadge (note-fields.tsx L150-L162) using
// literal labels (no useT). JSX structure identical.

function PureStatusBadge({ status }: { status: NoteStatus }) {
  const cfg = STATUS_CONFIG_PURE[status] ?? STATUS_CONFIG_PURE.in_progress
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-medium leading-none"
      style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

/* ── TH (header cell) ───────────────────────────────────── */
// Verbatim from notes-table.tsx L167-L208

function TH({
  label,
  col,
  sortCol,
  sortDir,
  onSort,
  className = "",
  hideInactiveHint = false,
}: {
  label: string
  col?: SortField
  sortCol: SortField
  sortDir: SortDirection
  onSort: (c: SortField) => void
  className?: string
  hideInactiveHint?: boolean
}) {
  if (!col) {
    return (
      <span className={`inline-flex items-center text-note font-medium text-foreground/80 ${className}`}>
        {label}
      </span>
    )
  }
  const active = sortCol === col
  return (
    <button
      className={`group/th inline-flex items-center gap-1 text-note font-medium text-foreground/80 transition-colors hover:text-foreground ${className}`}
      onClick={() => onSort(col)}
    >
      {label}
      {active ? (
        sortDir === "asc" ? <ArrowUp className="text-muted-foreground" size={12} strokeWidth={2} /> : <ArrowDown className="text-muted-foreground" size={12} strokeWidth={2} />
      ) : hideInactiveHint ? null : (
        <ArrowsDownUp className="opacity-0 group-hover/th:opacity-60" size={12} strokeWidth={2} />
      )}
    </button>
  )
}

/* ── GroupHeader ─────────────────────────────────────────── */
// Verbatim list-mode group header from notes-table.tsx L1479-L1503

function GroupHeader({
  label,
  count,
  collapsed,
  onToggle,
}: {
  label: string
  count: number
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <div
      className="a-tg select-none transition-colors cursor-pointer hover:bg-hover-bg"
      onClick={onToggle}
    >
      <CaretDown
        className={`transition-transform ${collapsed ? "-rotate-90" : ""}`}
        size={11}
        strokeWidth={2}
      />
      <span className="a-tg__label">{label}</span>
      <span className="a-tg__count tabular-nums">{count}</span>
      <div className="a-tg__line" />
    </div>
  )
}

/* ── NoteRow ─────────────────────────────────────────────── */
// Verbatim from notes-table.tsx NoteRowInner (L1829-L2104).
// Store reads replaced by props; useFolderPickerData / usePlotStore removed.
// Tooltip wrappers for updatedAt/createdAt/children: static title= only
// (no Radix Tooltip — avoids dependency on the UI library here; visual chrome preserved).

function NoteRow({
  note,
  isActive = false,
  isSelected = false,
  selectionActive = false,
  visibleColumns,
  gridTemplate,
  onOpen,
  onClick,
}: {
  note: NotesListNote
  isActive?: boolean
  isSelected?: boolean
  selectionActive?: boolean
  visibleColumns: string[]
  gridTemplate: string
  onOpen: () => void
  onClick?: (e: React.MouseEvent) => void
}) {
  const visibleCols = visibleColumns

  return (
    <div
      data-note-row
      style={{ display: "grid", gridTemplateColumns: gridTemplate, paddingLeft: 20, paddingRight: 20 }}
      data-active={isActive ? "true" : undefined}
      className={`a-row group items-center cursor-pointer ${isSelected ? "is-selected" : ""}`}
      onClick={onClick ?? onOpen}
    >
      {/* Checkbox — reveal-on-hover via opacity (a-row__reveal). */}
      <div
        data-checkbox
        data-show={selectionActive || isSelected ? "true" : undefined}
        className="a-row__reveal flex items-center justify-center cursor-pointer rounded h-8"
        onClick={(e) => {
          e.stopPropagation()
          const syntheticEvent = { ...e, metaKey: true, ctrlKey: true, shiftKey: false } as React.MouseEvent
          onClick?.(syntheticEvent)
        }}
      >
        <div
          className={`rounded-[4px] border flex items-center justify-center transition-colors pointer-events-none shadow-sm h-4 w-4 ${
            isSelected ? "bg-accent border-accent" : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500"
          }`}
        >
          {isSelected && <PhCheck className="text-accent-foreground" size={8} strokeWidth={2.5} />}
        </div>
      </div>

      {/* Name — v3: .a-row__lead (icon + title)
          marginLeft -8: grid gap 상쇄해 체크박스에 가깝게 (위키 wiki-list 정합) */}
      <div className="flex flex-col min-w-0" style={{ marginLeft: -8 }}>
        <div className="a-row__lead">
          <span className="a-row__icon" data-tone={note.status}>
            <StatusShapeIcon status={note.status} size={13} />
          </span>
          <span className="a-row__title">
            {note.title || "제목 없음"}
          </span>
          {note.pinned && (
            <PushPin
              size={11}
              fill="currentColor" strokeWidth={2}
              className="shrink-0 text-amber-500"
            />
          )}
          {note.label && (
            <span
              className="shrink-0 inline-flex items-center gap-1 rounded-full border-solid px-1.5 py-0.5 text-2xs font-medium"
              style={{
                backgroundColor: `color-mix(in srgb, ${note.label.color} 18%, transparent)`,
                color: note.label.color,
                borderColor: `color-mix(in srgb, ${note.label.color} 55%, transparent)`,
                borderWidth: "1.5px",
              }}
            >
              {note.label.name}
            </span>
          )}
          <SourceIcon source={note.source} />
        </div>
      </div>

      {/* Status — Plot StatusBadge (icon + label, Plot 정체성 보존) */}
      {visibleCols.includes("status") && (
        <div className="flex items-center justify-start">
          <PureStatusBadge status={note.status} />
        </div>
      )}

      {/* Folder — PR (b): N:M render. */}
      {visibleCols.includes("folder") && (
        <div className="a-row__cell flex items-center justify-center gap-1.5">
          {note.folders.length === 0 ? (
            <span className="text-note text-muted-foreground">—</span>
          ) : (() => {
            const visible = note.folders.slice(0, 2)
            const overflow = note.folders.length - visible.length
            return (
              <>
                {visible.map((f) => (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1 min-w-0 max-w-[120px]"
                    title={f.name}
                  >
                    {f.color && (
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: f.color }}
                      />
                    )}
                    <span className="text-note text-foreground truncate">{f.name}</span>
                  </span>
                ))}
                {overflow > 0 && (
                  <span
                    className="text-2xs text-muted-foreground tabular-nums shrink-0"
                    title={note.folders.slice(2).map((f) => f.name).join(", ")}
                  >
                    +{overflow}
                  </span>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* Parent — v3 .a-row__cell */}
      {visibleCols.includes("parent") && (
        <div className="a-row__cell flex items-center" title={note.parentTitle || undefined}>
          {note.parentTitle ? (
            <span className="truncate">{note.parentTitle}</span>
          ) : (
            <span className="opacity-70">{"—"}</span>
          )}
        </div>
      )}

      {/* Children — v3 .a-row__cell */}
      {visibleCols.includes("children") && (
        <div className="a-row__cell" style={{ textAlign: "center" }}>
          {(note.childTitles?.length ?? 0) > 0 ? (
            <span
              className="tabular-nums cursor-help"
              title={note.childTitles!.join(", ")}
            >
              {note.childTitles!.length}
            </span>
          ) : (
            <span className="tabular-nums opacity-70">—</span>
          )}
        </div>
      )}

      {/* Links — v3 .a-row__links (right-aligned, soft-fg, tabular) */}
      {visibleCols.includes("links") && (
        <div className="a-row__cell a-row__links" style={{ textAlign: "center" }}>
          <span className="tabular-nums">{note.links}</span>
        </div>
      )}

      {/* Reads — v3 .a-row__links style (compact tabular) */}
      {visibleCols.includes("reads") && (
        <div className="a-row__cell a-row__links" style={{ textAlign: "center" }}>
          <span className="tabular-nums">{note.reads}</span>
        </div>
      )}

      {/* Word Count — v3 .a-row__words */}
      {visibleCols.includes("wordCount") && (
        <div className="a-row__cell a-row__words">
          <span className="tabular-nums">{note.wordCount}</span>
        </div>
      )}

      {/* Updated — v3 .a-row__updated (right-aligned, tabular) */}
      {visibleCols.includes("updatedAt") && (
        <div className="a-row__cell a-row__updated">
          <span className="tabular-nums cursor-default" title={note.updatedAt}>
            {shortRelative(note.updatedAt)}
          </span>
        </div>
      )}

      {/* Created — v3 .a-row__updated (right-aligned, tabular) */}
      {visibleCols.includes("createdAt") && (
        <div className="a-row__cell a-row__updated">
          <span className="tabular-nums cursor-default" title={note.createdAt}>
            {absDate(note.createdAt)}
          </span>
        </div>
      )}
    </div>
  )
}

/* ── Date helpers (pure) ─────────────────────────────────── */
// Inlined lightweight replacements for shortRelative / absDate
// (avoids importing date-fns and format-utils which pull store deps).
// Faithful to the display output for preview purposes.

// Fixed reference "now" so the preview is deterministic — no Date.now() means
// no SSR/client drift on the relative label or the title tooltip (which would
// otherwise trip a hydration mismatch). Matches notes-list.mock.tsx's anchor.
const PREVIEW_NOW = Date.parse("2026-06-01T12:00:00.000Z")

function shortRelative(iso: string): string {
  const now = PREVIEW_NOW
  const then = new Date(iso).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "방금"
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}일 전`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}주 전`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}달 전`
  return `${Math.floor(months / 12)}년 전`
}

function absDate(iso: string): string {
  const d = new Date(iso)
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${months[d.getMonth()]} ${d.getDate()}`
}

/* ── NotesListView ───────────────────────────────────────── */

export function NotesListView({
  vm,
  callbacks = {},
}: {
  vm: NotesListViewModel
  callbacks?: NotesListCallbacks
}) {
  // UI-local state: which groups are collapsed
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  // UI-local state: select-all header checkbox simulation
  const [allSelected, setAllSelected] = useState(false)
  const [someSelected, setSomeSelected] = useState(false)

  function toggleGroupCollapse(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    callbacks.onToggleGroupCollapse?.(key)
  }

  function handleSort(col: SortField) {
    callbacks.onSort?.(col)
  }

  const { viewState, columnDefs } = vm

  // Column defs that are in visibleColumns (title always present)
  const visibleColDefs = columnDefs.filter(
    (c) => c.id === "title" || viewState.visibleColumns.includes(c.id as any)
  )

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* ── Sort chip (Linear-style 3-part: key | value | ×) ── */}
      {/* mirrors notes-table.tsx L1297-L1323 */}
      {vm.showSortChip && (
        <div className="flex items-center px-5 py-2">
          <div className="inline-flex items-stretch overflow-hidden rounded-md border border-border bg-secondary/40 text-2xs font-medium leading-none">
            {/* key */}
            <span className="inline-flex items-center px-2 py-0.5 text-muted-foreground">정렬 기준</span>
            <span className="w-px self-stretch bg-border" aria-hidden />
            {/* value + direction (click to toggle) */}
            <button
              onClick={() => callbacks.onToggleSortDirection?.()}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-foreground hover:bg-hover-bg transition-colors"
              title="방향 전환"
            >
              {vm.sortChipLabel}
            </button>
            <span className="w-px self-stretch bg-border" aria-hidden />
            {/* remove */}
            <button
              onClick={() => callbacks.onRemoveSortChip?.()}
              className="inline-flex items-center px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
              title="정렬 제거"
            >
              <PhX size={12} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {vm.isEmpty ? (
          /* ── Empty state ──────────────────────────────── */
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <PhNotePencil size={32} strokeWidth={1.5} className="text-muted-foreground/70" />
            <p className="text-note">아직 노트가 없습니다</p>
            <p className="text-2xs text-muted-foreground/60">새 노트를 추가하거나 필터를 조정해 보세요</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* ── Column headers ─────────────────────────────── */}
            {/* mirrors notes-table.tsx L1394-L1453 */}
            <div
              data-header-row
              style={{ display: "grid", gridTemplateColumns: viewState.gridTemplate }}
              className="a-th"
            >
              {/* Select-all checkbox */}
              <div className="flex items-center justify-center">
                <div
                  className={`h-4 w-4 rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors shadow-sm ${
                    allSelected
                      ? "bg-accent border-accent"
                      : someSelected
                        ? "bg-accent/50 border-accent"
                        : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-500"
                  }`}
                  onClick={() => {
                    const next = !allSelected
                    setAllSelected(next)
                    setSomeSelected(false)
                    if (next) callbacks.onSelectAll?.()
                    else callbacks.onClearSelection?.()
                  }}
                >
                  {allSelected && (
                    <PhCheck className="text-accent-foreground" size={10} strokeWidth={2.5} />
                  )}
                  {someSelected && !allSelected && (
                    <PhMinus className="text-accent-foreground" size={10} strokeWidth={2} />
                  )}
                </div>
              </div>

              {/* Column header cells */}
              {visibleColDefs.map((col) => (
                <div
                  key={col.id}
                  className={col.align ?? ""}
                  style={col.id === "title" ? { marginLeft: -8 } : undefined}
                >
                  {col.id === "title" ? (
                    <TH
                      label={col.label}
                      col={col.sortField}
                      sortCol={viewState.sortField}
                      sortDir={viewState.sortDirection}
                      onSort={handleSort}
                      className=""
                      hideInactiveHint
                    />
                  ) : (
                    <TH
                      label={col.label}
                      col={col.sortField}
                      sortCol={viewState.sortField}
                      sortDir={viewState.sortDirection}
                      onSort={handleSort}
                      className={`${col.align === "text-right" ? "justify-end" : col.align === "text-center" ? "justify-center" : ""}`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* ── Rows ─────────────────────────────────────── */}
            {vm.groups.map((group) => (
              <div key={group.key}>
                {/* Group header — only rendered when grouped */}
                {vm.viewState.isGrouped && (
                  <GroupHeader
                    label={group.label}
                    count={group.count}
                    collapsed={collapsedGroups.has(group.key)}
                    onToggle={() => toggleGroupCollapse(group.key)}
                  />
                )}

                {/* Note rows — hidden when group is collapsed */}
                {!collapsedGroups.has(group.key) &&
                  group.notes.map((note) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      isActive={false}
                      isSelected={false}
                      selectionActive={false}
                      visibleColumns={viewState.visibleColumns}
                      gridTemplate={viewState.gridTemplate}
                      onOpen={() => callbacks.onRowClick?.(note.id)}
                    />
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
