"use client"

import { useState, useMemo, useCallback } from "react"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
  Plus,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NOTE_STATUS_HEX } from "@/lib/colors"
import { usePlotStore } from "@/lib/store"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { ViewHeader } from "@/components/view-header"
import { FilterPanel } from "@/components/filter-panel"
import {
  ViewDistributionPanel,
  type DistributionItem,
} from "@/components/view-distribution-panel"
import { CALENDAR_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import type { FilterRule, FilterField, ViewContextKey } from "@/lib/view-engine/types"
import type { Note } from "@/lib/types"

/* ── Types ───────────────────────────────────────────── */

interface CalendarViewProps {
  context?: string
  title?: string
  hideCreateButton?: boolean
  createNoteOverrides?: Partial<Note>
  folderId?: string
  tagId?: string
  labelId?: string
  onRowClick?: (noteId: string) => void
  activePreviewId?: string | null
}

type CalendarMode = "month" | "week" | "agenda"
type DateSource = "createdAt" | "updatedAt"

/* ── Day-of-week header labels (Mon-first) ───────────── */

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/* ── Max notes visible before "+N more" ─────────────── */

const MAX_VISIBLE = 3

/* ── Status dot colors matching STATUS_CONFIG ──────────── */

const STATUS_DOT: Record<string, string> = {
  inbox: NOTE_STATUS_HEX.inbox,
  capture: NOTE_STATUS_HEX.capture,
  permanent: NOTE_STATUS_HEX.permanent,
}

/* ── Status label config for dashboard ─────────────────── */

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  inbox: { text: "Inbox", color: NOTE_STATUS_HEX.inbox },
  capture: { text: "Capture", color: NOTE_STATUS_HEX.capture },
  permanent: { text: "Permanent", color: NOTE_STATUS_HEX.permanent },
}

/* ── Layer type icon (tiny, inline) ───────────────────── */

function LayerIcon({ isWiki }: { isWiki: boolean }) {
  if (isWiki) {
    return (
      <svg
        width={10}
        height={10}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-muted-foreground/40"
      >
        <path d="M2 3h12M2 7h8M2 11h10" />
      </svg>
    )
  }
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-muted-foreground/40"
    >
      <path d="M4 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" />
      <line x1="5" y1="6" x2="11" y2="6" />
      <line x1="5" y1="9" x2="9" y2="9" />
    </svg>
  )
}

/* ── NotePill ────────────────────────────────────────── */

interface NotePillProps {
  note: Note
  labelColor?: string
  labelName?: string
  isActive: boolean
  onClick: () => void
}

function NotePill({ note, labelColor, labelName, isActive, onClick }: NotePillProps) {
  const dot = STATUS_DOT[note.status] ?? "#6b7280"

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-[5px] px-2 py-[3px] text-left transition-all duration-150",
        "hover:bg-secondary/80",
        isActive
          ? "bg-accent/15 ring-1 ring-accent/40 hover:bg-accent/20"
          : "bg-secondary/40",
      )}
    >
      {/* Status indicator dot */}
      <span
        className="h-[5px] w-[5px] shrink-0 rounded-full"
        style={{ backgroundColor: dot }}
      />

      {/* Layer type icon */}
      <LayerIcon isWiki={note.isWiki} />

      {/* Title */}
      <span className="flex-1 truncate text-[11.5px] font-medium leading-tight text-foreground/90 group-hover:text-foreground">
        {note.title || "Untitled"}
      </span>

      {/* Label badge */}
      {labelColor && labelName && (
        <span
          className="shrink-0 rounded px-1 py-px text-[9.5px] font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: `${labelColor}1a`,
            color: labelColor,
          }}
        >
          {labelName}
        </span>
      )}
    </button>
  )
}

/* ── DayCell ─────────────────────────────────────────── */

interface DayCellProps {
  day: Date
  currentMonth: Date
  notes: Note[]
  labels: Array<{ id: string; name: string; color: string }>
  activePreviewId?: string | null
  onNoteClick: (noteId: string) => void
  onCreateNote: (day: Date) => void
  onSelectDate: (day: Date) => void
  isSelected: boolean
}

function DayCell({
  day,
  currentMonth,
  notes,
  labels,
  activePreviewId,
  onNoteClick,
  onCreateNote,
  onSelectDate,
  isSelected,
}: DayCellProps) {
  const isCurrentMonth = isSameMonth(day, currentMonth)
  const isTodayDate = isToday(day)
  const dayNum = format(day, "d")
  const isWeekend = day.getDay() === 0 || day.getDay() === 6

  const visibleNotes = notes.slice(0, MAX_VISIBLE)
  const overflowCount = notes.length - MAX_VISIBLE

  const getLabelForNote = useCallback(
    (note: Note) => {
      if (!note.labelId) return null
      return labels.find((l) => l.id === note.labelId) ?? null
    },
    [labels],
  )

  return (
    <div
      className={cn(
        "group/cell relative flex min-h-[120px] flex-col gap-0.5 border-b border-r border-border p-1.5 transition-colors duration-150 cursor-pointer",
        isCurrentMonth ? "bg-background" : "bg-secondary/10",
        isWeekend && isCurrentMonth && "bg-secondary/5",
        isSelected && "ring-inset ring-1 ring-accent/50",
      )}
      onClick={() => onSelectDate(day)}
    >
      {/* Selected date top indicator */}
      {isSelected && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-sm bg-accent/60" />
      )}

      {/* Day number */}
      <div className="mb-0.5 flex items-center justify-between">
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full text-2xs font-semibold leading-none transition-colors",
            isTodayDate
              ? "bg-accent text-accent-foreground"
              : isCurrentMonth
                ? isWeekend
                  ? "text-muted-foreground/70"
                  : "text-foreground/80"
                : "text-muted-foreground/30",
          )}
        >
          {dayNum}
        </span>

        {/* Quick-create button — appears on hover */}
        {isCurrentMonth && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCreateNote(day)
            }}
            className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground/40 opacity-0 transition-all duration-150 hover:bg-secondary hover:text-foreground group-hover/cell:opacity-100"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      {/* Note pills */}
      <div className="flex flex-col gap-[3px]">
        {visibleNotes.map((note) => {
          const label = getLabelForNote(note)
          return (
            <NotePill
              key={note.id}
              note={note}
              labelColor={label?.color}
              labelName={label?.name}
              isActive={activePreviewId === note.id}
              onClick={() => onNoteClick(note.id)}
            />
          )
        })}

        {overflowCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (notes[MAX_VISIBLE]) onNoteClick(notes[MAX_VISIBLE].id)
            }}
            className="w-full rounded-[5px] px-2 py-[2px] text-left text-[10.5px] font-medium text-muted-foreground/60 transition-colors hover:bg-secondary/60 hover:text-muted-foreground"
          >
            +{overflowCount} more
          </button>
        )}
      </div>
    </div>
  )
}

/* ── DayDashboard ────────────────────────────────────── */

interface DayDashboardProps {
  date: Date
  notes: Note[]
  labels: Array<{ id: string; name: string; color: string }>
  activePreviewId?: string | null
  onNoteClick: (noteId: string) => void
  onEditNote: (noteId: string) => void
  onCreateNote: (day: Date) => void
  onClose: () => void
}

function DayDashboard({
  date,
  notes,
  labels,
  activePreviewId,
  onNoteClick,
  onEditNote,
  onCreateNote,
  onClose,
}: DayDashboardProps) {
  /* Sort notes oldest-first (timeline order) */
  const sortedNotes = useMemo(
    () =>
      [...notes].sort((a, b) => {
        try {
          return parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime()
        } catch {
          return 0
        }
      }),
    [notes],
  )

  const getLabelForNote = useCallback(
    (note: Note) => {
      if (!note.labelId) return null
      return labels.find((l) => l.id === note.labelId) ?? null
    },
    [labels],
  )

  const formattedDate = format(date, "MMMM d, yyyy")
  const noteCount = notes.length

  return (
    <div className="shrink-0 animate-in slide-in-from-bottom-2 duration-200 border-t border-border bg-secondary/10">
      {/* Dashboard header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-note font-semibold text-foreground">{formattedDate}</span>
          {noteCount > 0 && (
            <span className="text-xs text-muted-foreground/60">
              · {noteCount} {noteCount === 1 ? "note" : "notes"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onCreateNote(date)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Create note on this day"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close day panel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="max-h-[260px] overflow-y-auto px-3 py-2">
        {sortedNotes.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-2.5 py-6 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60">
              <CalendarDays className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-note text-muted-foreground/70">No notes on this day</p>
            </div>
            <button
              onClick={() => onCreateNote(date)}
              className="mt-0.5 flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-secondary/80 hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              Create note
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {sortedNotes.map((note) => {
              const label = getLabelForNote(note)
              const dot = STATUS_DOT[note.status] ?? "#6b7280"
              const statusInfo = STATUS_LABEL[note.status]
              const isActive = activePreviewId === note.id

              let timeStr = ""
              try {
                timeStr = format(parseISO(note.createdAt), "h:mm a")
              } catch {
                timeStr = ""
              }

              return (
                <button
                  key={note.id}
                  onClick={() => isActive ? onEditNote(note.id) : onNoteClick(note.id)}
                  className={cn(
                    "group w-full rounded-lg border border-border/40 px-3 py-2.5 text-left transition-all duration-150",
                    "hover:border-border/70 hover:bg-secondary/50",
                    isActive
                      ? "border-accent/30 bg-accent/10 ring-1 ring-accent/25 hover:bg-accent/15"
                      : "bg-card/50",
                  )}
                >
                  {/* Top row: dot + title + status badge + label badge + time */}
                  <div className="flex items-center gap-2">
                    <span
                      className="h-[6px] w-[6px] shrink-0 rounded-full"
                      style={{ backgroundColor: dot }}
                    />

                    <span className="flex-1 truncate text-note font-medium text-foreground/90 group-hover:text-foreground">
                      {note.title || "Untitled"}
                    </span>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {/* Status badge */}
                      {statusInfo && (
                        <span
                          className="text-2xs font-medium"
                          style={{ color: statusInfo.color }}
                        >
                          {statusInfo.text}
                        </span>
                      )}

                      {/* Label badge */}
                      {label && (
                        <span
                          className="rounded px-1.5 py-px text-2xs font-semibold uppercase tracking-wide"
                          style={{
                            backgroundColor: `${label.color}1a`,
                            color: label.color,
                          }}
                        >
                          {label.name}
                        </span>
                      )}

                      {/* Time */}
                      {timeStr && (
                        <span className="text-2xs tabular-nums text-muted-foreground/50">
                          {timeStr}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preview text */}
                  {note.preview && (
                    <p className="mt-1 line-clamp-2 pl-4 text-[11.5px] leading-relaxed text-muted-foreground/60">
                      {note.preview}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── WeekView ────────────────────────────────────────── */

interface WeekViewProps {
  weekStart: Date
  notesByDay: Map<string, Note[]>
  labels: Array<{ id: string; name: string; color: string }>
  activePreviewId?: string | null
  onNoteClick: (noteId: string) => void
  onCreateNote: (day: Date) => void
}

function WeekView({
  weekStart,
  notesByDay,
  labels,
  activePreviewId,
  onNoteClick,
  onCreateNote,
}: WeekViewProps) {
  const weekDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(weekStart, { weekStartsOn: 1 }),
        end: endOfWeek(weekStart, { weekStartsOn: 1 }),
      }),
    [weekStart],
  )

  const getLabelForNote = useCallback(
    (note: Note) => {
      if (!note.labelId) return null
      return labels.find((l) => l.id === note.labelId) ?? null
    },
    [labels],
  )

  return (
    <div className="flex flex-1 overflow-hidden">
      {weekDays.map((day) => {
        const key = format(day, "yyyy-MM-dd")
        const dayNotes = notesByDay.get(key) ?? []
        return (
          <div
            key={key}
            className="flex flex-1 flex-col border-r border-border last:border-r-0 overflow-hidden"
          >
            {/* Day header */}
            <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-background px-2 py-1.5">
              <span
                className={cn(
                  "text-xs font-semibold",
                  isToday(day) ? "text-accent" : "text-muted-foreground",
                )}
              >
                {format(day, "EEE d")}
              </span>
              {dayNotes.length > 0 && (
                <span className="ml-1 text-2xs text-muted-foreground/50">
                  {dayNotes.length}
                </span>
              )}
            </div>

            {/* Notes list */}
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-1.5">
              {dayNotes.map((note) => {
                const label = getLabelForNote(note)
                return (
                  <NotePill
                    key={note.id}
                    note={note}
                    labelColor={label?.color}
                    labelName={label?.name}
                    isActive={activePreviewId === note.id}
                    onClick={() => onNoteClick(note.id)}
                  />
                )
              })}
              {dayNotes.length === 0 && (
                <button
                  onClick={() => onCreateNote(day)}
                  className="mt-1 flex items-center gap-1 rounded-md px-2 py-1 text-2xs text-muted-foreground/40 transition-colors hover:bg-secondary/50 hover:text-muted-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── AgendaView ──────────────────────────────────────── */

interface AgendaViewProps {
  notesByDay: Map<string, Note[]>
  labels: Array<{ id: string; name: string; color: string }>
  activePreviewId?: string | null
  onNoteClick: (noteId: string) => void
}

function AgendaView({
  notesByDay,
  labels,
  activePreviewId,
  onNoteClick,
}: AgendaViewProps) {
  const datesWithNotes = useMemo(() => {
    return Array.from(notesByDay.entries())
      .filter(([, notes]) => notes.length > 0)
      .sort(([a], [b]) => a.localeCompare(b))
  }, [notesByDay])

  const getLabelForNote = useCallback(
    (note: Note) => {
      if (!note.labelId) return null
      return labels.find((l) => l.id === note.labelId) ?? null
    },
    [labels],
  )

  return (
    <div className="flex-1 overflow-y-auto">
      {datesWithNotes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <CalendarDays className="h-5 w-5 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No notes in this period</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {datesWithNotes.map(([dateKey, notes]) => {
            const date = parseISO(dateKey)
            return (
              <div key={dateKey} className="px-5 py-3">
                {/* Date header */}
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isToday(date) ? "text-accent" : "text-muted-foreground",
                    )}
                  >
                    {isToday(date) ? "Today" : format(date, "EEEE, MMMM d")}
                  </span>
                  <span className="text-2xs text-muted-foreground/40">
                    {notes.length}
                  </span>
                </div>
                {/* Notes list */}
                <div className="flex flex-col gap-1">
                  {notes.map((note) => {
                    const label = getLabelForNote(note)
                    return (
                      <NotePill
                        key={note.id}
                        note={note}
                        labelColor={label?.color}
                        labelName={label?.name}
                        isActive={activePreviewId === note.id}
                        onClick={() => onNoteClick(note.id)}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── CalendarView ────────────────────────────────────── */

export function CalendarView({
  context,
  title,
  hideCreateButton,
  createNoteOverrides,
  folderId,
  tagId,
  labelId,
  onRowClick,
  activePreviewId,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  /* ── Calendar-specific state ──────────────────────── */

  const [calendarFilters, setCalendarFilters] = useState<FilterRule[]>([])
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month")
  const [dateSource, setDateSource] = useState<DateSource>("createdAt")
  const [layers, setLayers] = useState({ notes: true, wiki: true })
  const [showDistribution, setShowDistribution] = useState(false)

  /* ── Store / hooks ────────────────────────────────── */

  const viewContext = (context ?? "all") as ViewContextKey
  const backlinksMap = useBacklinksIndex()
  const { flatNotes } = useNotesView(viewContext, { backlinksMap, folderId, tagId, labelId })

  const labels = usePlotStore((s) => s.labels)
  const folders = usePlotStore((s) => s.folders)
  const tags = usePlotStore((s) => s.tags)
  const createNote = usePlotStore((s) => s.createNote)
  const openNote = usePlotStore((s) => s.openNote)

  /* ── Filter logic ─────────────────────────────────── */

  const filteredNotes = useMemo(() => {
    let result = flatNotes

    // Apply layer filters
    if (!layers.notes && !layers.wiki) return []
    if (!layers.notes) result = result.filter((n) => n.isWiki)
    if (!layers.wiki) result = result.filter((n) => !n.isWiki)

    // Apply user filters
    for (const rule of calendarFilters) {
      if (rule.field === "status") result = result.filter((n) => n.status === rule.value)
      if (rule.field === "folder") result = result.filter((n) => n.folderId === rule.value)
      if (rule.field === "label") result = result.filter((n) => n.labelId === rule.value)
      if (rule.field === "tags") result = result.filter((n) => n.tags.includes(rule.value))
    }
    return result
  }, [flatNotes, calendarFilters, layers])

  /* ── Notes grouped by day ────────────────────────── */

  const notesByDay = useMemo(() => {
    const map = new Map<string, Note[]>()
    for (const note of filteredNotes) {
      try {
        const dateField = dateSource === "updatedAt" ? note.updatedAt : note.createdAt
        const date = parseISO(dateField)
        const key = format(date, "yyyy-MM-dd")
        const existing = map.get(key)
        if (existing) existing.push(note)
        else map.set(key, [note])
      } catch {
        // skip malformed dates
      }
    }
    return map
  }, [filteredNotes, dateSource])

  /* ── Calendar grid days (month view) ──────────────── */

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [currentDate])

  /* ── Navigation ──────────────────────────────────── */

  const goToPrev = useCallback(() => {
    if (calendarMode === "week") {
      setCurrentDate((d) => subWeeks(d, 1))
    } else {
      setCurrentDate((d) => subMonths(d, 1))
    }
  }, [calendarMode])

  const goToNext = useCallback(() => {
    if (calendarMode === "week") {
      setCurrentDate((d) => addWeeks(d, 1))
    } else {
      setCurrentDate((d) => addMonths(d, 1))
    }
  }, [calendarMode])

  const goToToday = useCallback(() => setCurrentDate(new Date()), [])

  /* ── Note click ──────────────────────────────────── */

  const handleNoteClick = useCallback(
    (noteId: string) => {
      if (onRowClick) {
        onRowClick(noteId)
      } else {
        openNote(noteId)
      }
    },
    [onRowClick, openNote],
  )

  /* ── Create note on a specific day ──────────────── */

  const handleCreateOnDay = useCallback(
    (day: Date) => {
      const isoDate = day.toISOString()
      createNote({
        ...createNoteOverrides,
        createdAt: isoDate,
      })
    },
    [createNote, createNoteOverrides],
  )

  /* ── Select / deselect a date ────────────────────── */

  const handleSelectDate = useCallback((day: Date) => {
    setSelectedDate((prev) => (prev && isSameDay(prev, day) ? null : day))
  }, [])

  /* ── Filter toggle (same pattern as wiki-view) ───── */

  const handleFilterToggle = useCallback((rule: FilterRule) => {
    setCalendarFilters((prev) => {
      const exists = prev.some(
        (f) => f.field === rule.field && f.value === rule.value,
      )
      return exists
        ? prev.filter((f) => !(f.field === rule.field && f.value === rule.value))
        : [...prev, rule]
    })
  }, [])

  /* ── Header note count (for current month only) ──── */

  const currentMonthCount = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    return filteredNotes.filter((note) => {
      try {
        const dateField = dateSource === "updatedAt" ? note.updatedAt : note.createdAt
        const d = parseISO(dateField)
        return d >= monthStart && d <= monthEnd
      } catch {
        return false
      }
    }).length
  }, [filteredNotes, currentDate, dateSource])

  /* ── Check if viewing current month ─────────────── */

  const isCurrentMonthView = isSameMonth(currentDate, new Date())

  /* ── Notes for selected date ─────────────────────── */

  const selectedDateNotes = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, "yyyy-MM-dd")
    return notesByDay.get(key) ?? []
  }, [selectedDate, notesByDay])

  /* ── Distribution panel ─────────────────────────── */

  const distributionTabs = useMemo(
    () => [
      { key: "status", label: "Status" },
      { key: "folder", label: "Folder" },
      { key: "tags", label: "Tags" },
    ],
    [],
  )

  const getDistribution = useCallback(
    (tabKey: string): DistributionItem[] => {
      switch (tabKey) {
        case "status": {
          const counts: Record<string, number> = {}
          for (const n of filteredNotes) counts[n.status] = (counts[n.status] ?? 0) + 1
          return Object.entries(counts).map(([key, count]) => ({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            count,
            color: STATUS_DOT[key],
          }))
        }
        case "folder": {
          const counts: Record<string, number> = {}
          for (const n of filteredNotes) {
            const fid = n.folderId ?? "_none"
            counts[fid] = (counts[fid] ?? 0) + 1
          }
          return Object.entries(counts).map(([key, count]) => {
            const folder = folders.find((f) => f.id === key)
            return {
              key,
              label: folder?.name ?? (key === "_none" ? "No folder" : key),
              count,
            }
          })
        }
        case "tags": {
          const counts: Record<string, number> = {}
          for (const n of filteredNotes) {
            for (const tid of n.tags) counts[tid] = (counts[tid] ?? 0) + 1
          }
          return Object.entries(counts).map(([key, count]) => {
            const tag = tags.find((t) => t.id === key)
            return {
              key,
              label: tag?.name ?? key,
              count,
              color: tag?.color,
            }
          })
        }
        default:
          return []
      }
    },
    [filteredNotes, folders, tags],
  )

  const handleDistributionItemClick = useCallback(
    (tabKey: string, itemKey: string) => {
      const fieldMap: Record<string, FilterField> = {
        status: "status",
        folder: "folder",
        tags: "tags",
      }
      const field = fieldMap[tabKey]
      if (!field) return
      const rule: FilterRule = { field, operator: "eq", value: itemKey }
      const exists = calendarFilters.some(
        (f) => f.field === rule.field && f.operator === rule.operator && f.value === rule.value,
      )
      if (!exists) {
        setCalendarFilters((prev) => [...prev, rule])
      }
    },
    [calendarFilters],
  )

  /* ── Title text based on mode ─────────────────────── */

  const headerTitle = useMemo(() => {
    if (calendarMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
      const we = endOfWeek(currentDate, { weekStartsOn: 1 })
      if (isSameMonth(ws, we)) {
        return format(ws, "MMMM yyyy")
      }
      return `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`
    }
    return format(currentDate, "MMMM yyyy")
  }, [currentDate, calendarMode])

  /* ── Render ──────────────────────────────────────── */

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* ── ViewHeader ──────────────────────────────── */}
      <ViewHeader
        icon={<CalendarDays className="h-5 w-5" strokeWidth={1.5} />}
        title={headerTitle}
        count={currentMonthCount}
        showFilter
        hasActiveFilters={calendarFilters.length > 0}
        filterContent={
          <FilterPanel
            categories={CALENDAR_VIEW_CONFIG.filterCategories}
            activeFilters={calendarFilters}
            onToggle={handleFilterToggle}
          />
        }
        showDisplay
        displayContent={
          <div className="w-[280px] p-3 space-y-4">
            {/* Calendar by */}
            <div>
              <div className="text-2xs font-medium text-muted-foreground/50 uppercase tracking-wide mb-2">Calendar by</div>
              <div className="flex gap-1">
                {(["createdAt", "updatedAt"] as const).map((src) => (
                  <button
                    key={src}
                    onClick={() => setDateSource(src)}
                    className={cn(
                      "flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      dateSource === src
                        ? "bg-accent/15 text-accent"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {src === "createdAt" ? "Created" : "Updated"}
                  </button>
                ))}
              </div>
            </div>

            {/* Layers */}
            <div>
              <div className="text-2xs font-medium text-muted-foreground/50 uppercase tracking-wide mb-2">Layers</div>
              <div className="space-y-1">
                {([
                  { key: "notes" as const, label: "Notes" },
                  { key: "wiki" as const, label: "Wiki" },
                ] as const).map((layer) => (
                  <button
                    key={layer.key}
                    onClick={() => setLayers((l) => ({ ...l, [layer.key]: !l[layer.key] }))}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors hover:bg-secondary"
                  >
                    <span className={layers[layer.key] ? "text-foreground" : "text-muted-foreground/40"}>
                      {layer.label}
                    </span>
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        layers[layer.key] ? "border-accent bg-accent" : "border-border",
                      )}
                    >
                      {layers[layer.key] && (
                        <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                          <path d="M4 8l3 3 5-5" />
                        </svg>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        }
        showDetailPanel
        detailPanelOpen={showDistribution}
        onDetailPanelToggle={() => setShowDistribution(!showDistribution)}
        onCreateNew={!hideCreateButton ? () => { const id = createNote(createNoteOverrides ?? {}); if (id) openNote(id) } : undefined}
      />

      {/* ── Calendar controls bar ──────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-5 py-2">
        {/* Left: Calendar mode tabs */}
        <div className="flex items-center gap-1">
          {(["month", "week", "agenda"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setCalendarMode(mode)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                calendarMode === mode
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground/70",
              )}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Center: Month/Week navigation */}
        <div className="flex items-center gap-1">
          {!isCurrentMonthView && (
            <button
              onClick={goToToday}
              className="mr-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Today
            </button>
          )}
          <button
            onClick={goToPrev}
            aria-label={calendarMode === "week" ? "Previous week" : "Previous month"}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={goToNext}
            aria-label={calendarMode === "week" ? "Next week" : "Next month"}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

      {/* ── Day-of-week labels (for month and week modes) ── */}
      {calendarMode !== "agenda" && (
        <div className="grid shrink-0 grid-cols-7 border-b border-border">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="border-r border-border px-2 py-2 last:border-r-0"
            >
              <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Main content area ──────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Month view */}
          {calendarMode === "month" && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredNotes.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/60">
                    <CalendarDays className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">No notes yet</p>
                    <p className="mt-0.5 text-note text-muted-foreground/60">
                      Click any day to create a note, or use New note above.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd")
                  const dayNotes = notesByDay.get(key) ?? []
                  const isSelected = selectedDate ? isSameDay(selectedDate, day) : false

                  return (
                    <DayCell
                      key={key}
                      day={day}
                      currentMonth={currentDate}
                      notes={dayNotes}
                      labels={labels}
                      activePreviewId={activePreviewId}
                      onNoteClick={handleNoteClick}
                      onCreateNote={handleCreateOnDay}
                      onSelectDate={handleSelectDate}
                      isSelected={isSelected}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Week view */}
          {calendarMode === "week" && (
            <WeekView
              weekStart={currentDate}
              notesByDay={notesByDay}
              labels={labels}
              activePreviewId={activePreviewId}
              onNoteClick={handleNoteClick}
              onCreateNote={handleCreateOnDay}
            />
          )}

          {/* Agenda view */}
          {calendarMode === "agenda" && (
            <AgendaView
              notesByDay={notesByDay}
              labels={labels}
              activePreviewId={activePreviewId}
              onNoteClick={handleNoteClick}
            />
          )}

          {/* Day dashboard (bottom panel for month view) */}
          {selectedDate && calendarMode === "month" && (
            <DayDashboard
              date={selectedDate}
              notes={selectedDateNotes}
              labels={labels}
              activePreviewId={activePreviewId}
              onNoteClick={handleNoteClick}
              onEditNote={openNote}
              onCreateNote={handleCreateOnDay}
              onClose={() => setSelectedDate(null)}
            />
          )}
        </div>

        {/* Distribution panel */}
        {showDistribution && (
          <ViewDistributionPanel
            tabs={distributionTabs}
            getDistribution={getDistribution}
            onItemClick={handleDistributionItemClick}
            onClose={() => setShowDistribution(false)}
          />
        )}
      </div>
    </main>
  )
}
