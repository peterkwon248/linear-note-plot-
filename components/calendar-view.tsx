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
  isSameDay,
  parseISO,
} from "date-fns"
import { ChevronLeft, ChevronRight, CalendarDays, FileText, Plus, X, SlidersHorizontal, LayoutList, LayoutGrid, Lightbulb, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { useSettingsStore } from "@/lib/settings-store"
import { useNotesView } from "@/lib/view-engine/use-notes-view"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { ViewContextKey } from "@/lib/view-engine/types"
import type { Note } from "@/lib/types"

/* ── Types ───────────────────────────────────────────── */

interface CalendarViewProps {
  context?: string
  title?: string
  showTabs?: boolean
  hideCreateButton?: boolean
  createNoteOverrides?: Partial<Note>
  folderId?: string
  tagId?: string
  labelId?: string
  onRowClick?: (noteId: string) => void
  activePreviewId?: string | null
  initialTab?: string
}

/* ── Day-of-week header labels (Mon-first) ───────────── */

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/* ── Max notes visible before "+N more" ─────────────── */

const MAX_VISIBLE = 3

/* ── Status dot colors matching STATUS_CONFIG ──────────── */

const STATUS_DOT: Record<string, string> = {
  inbox: "#06b6d4",
  capture: "#f2994a",
  permanent: "#45d483",
}

/* ── Status label config for dashboard ─────────────────── */

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  inbox: { text: "Inbox", color: "#06b6d4" },
  capture: { text: "Capture", color: "#f2994a" },
  permanent: { text: "Permanent", color: "#45d483" },
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
        "group flex w-full items-center gap-1.5 rounded-[5px] px-2 py-[3px] text-left transition-all duration-100",
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
        "group/cell relative flex min-h-[120px] flex-col gap-0.5 border-b border-r border-border p-1.5 transition-colors duration-100 cursor-pointer",
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
            "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold leading-none transition-colors",
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
            className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground/40 opacity-0 transition-all duration-100 hover:bg-secondary hover:text-foreground group-hover/cell:opacity-100"
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
              // Click the first overflow note to show it, or could be a popover in future
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
          <span className="text-[13px] font-semibold text-foreground">{formattedDate}</span>
          {noteCount > 0 && (
            <span className="text-[12px] text-muted-foreground/60">
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
              <p className="text-[13px] text-muted-foreground/70">No notes on this day</p>
            </div>
            <button
              onClick={() => onCreateNote(date)}
              className="mt-0.5 flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-[12px] font-medium text-foreground/80 transition-colors hover:bg-secondary/80 hover:text-foreground"
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
                    "group w-full rounded-lg border border-border/40 px-3 py-2.5 text-left transition-all duration-100",
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

                    <span className="flex-1 truncate text-[13px] font-medium text-foreground/90 group-hover:text-foreground">
                      {note.title || "Untitled"}
                    </span>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {/* Status badge */}
                      {statusInfo && (
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: statusInfo.color }}
                        >
                          {statusInfo.text}
                        </span>
                      )}

                      {/* Label badge */}
                      {label && (
                        <span
                          className="rounded px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide"
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
                        <span className="text-[11px] tabular-nums text-muted-foreground/50">
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

/* ── CalendarView ────────────────────────────────────── */

export function CalendarView({
  context,
  title,
  showTabs,
  hideCreateButton,
  createNoteOverrides,
  folderId,
  tagId,
  labelId,
  onRowClick,
  activePreviewId,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const viewContext = (context ?? "all") as ViewContextKey
  const backlinksMap = useBacklinksIndex()
  const { flatNotes } = useNotesView(viewContext, { backlinksMap, folderId, tagId, labelId })

  const labels = usePlotStore((s) => s.labels)
  const createNote = usePlotStore((s) => s.createNote)
  const openNote = usePlotStore((s) => s.openNote)
  const viewMode = useSettingsStore((s) => s.viewMode)
  const setViewMode = useSettingsStore((s) => s.setViewMode)

  /* ── Calendar grid days ──────────────────────────── */

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    // Start week on Monday (weekStartsOn: 1)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [currentMonth])

  /* ── Notes grouped by day ────────────────────────── */

  const notesByDay = useMemo(() => {
    const map = new Map<string, Note[]>()
    for (const note of flatNotes) {
      try {
        const date = parseISO(note.createdAt)
        const key = format(date, "yyyy-MM-dd")
        const existing = map.get(key)
        if (existing) {
          existing.push(note)
        } else {
          map.set(key, [note])
        }
      } catch {
        // skip malformed dates
      }
    }
    return map
  }, [flatNotes])

  /* ── Navigation ──────────────────────────────────── */

  const goToPrevMonth = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), [])
  const goToNextMonth = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), [])
  const goToToday = useCallback(() => setCurrentMonth(new Date()), [])

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

  /* ── Header note count (for current month only) ──── */

  const currentMonthCount = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return flatNotes.filter((note) => {
      try {
        const d = parseISO(note.createdAt)
        return d >= monthStart && d <= monthEnd
      } catch {
        return false
      }
    }).length
  }, [flatNotes, currentMonth])

  /* ── Check if viewing current month ─────────────── */

  const isCurrentMonth = isSameMonth(currentMonth, new Date())

  /* ── Notes for selected date ─────────────────────── */

  const selectedDateNotes = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, "yyyy-MM-dd")
    return notesByDay.get(key) ?? []
  }, [selectedDate, notesByDay])

  /* ── Render ──────────────────────────────────────── */

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* ── Header ─────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-4 w-4 text-muted-foreground/60" />
          <div className="flex items-baseline gap-2">
            <h1 className="text-[15px] font-semibold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h1>
            {currentMonthCount > 0 && (
              <span className="text-[12px] text-muted-foreground/60">
                {currentMonthCount} {currentMonthCount === 1 ? "note" : "notes"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Today button — only when not on current month */}
          {!isCurrentMonth && (
            <button
              onClick={goToToday}
              className="mr-1 rounded-md px-2.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Today
            </button>
          )}

          {/* Prev / Next */}
          <button
            onClick={goToPrevMonth}
            aria-label="Previous month"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNextMonth}
            aria-label="Next month"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Display menu */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Display
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="end">
              <div className="flex gap-1 px-3 py-2.5">
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[13px] font-medium transition-colors ${
                    viewMode === "table" || viewMode === "list"
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <LayoutList className="h-4 w-4" />
                  List
                </button>
                <button
                  onClick={() => setViewMode("board")}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[13px] font-medium transition-colors ${
                    viewMode === "board"
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Board
                </button>
                <button
                  onClick={() => setViewMode("insights")}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[13px] font-medium transition-colors ${
                    viewMode === "insights"
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Lightbulb className="h-4 w-4" />
                  Insights
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[13px] font-medium transition-colors ${
                    viewMode === "calendar"
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Calendar
                </button>
              </div>
            </PopoverContent>
          </Popover>


          {/* New note button */}
          {!hideCreateButton && (
            <button
              className="ml-1 flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/85"
              onClick={() => createNote(createNoteOverrides ?? {})}
            >
              <Plus className="h-3.5 w-3.5" />
              New note
            </button>
          )}
        </div>
      </header>

      {/* ── Day-of-week labels ──────────────────────── */}
      <div className="grid shrink-0 grid-cols-7 border-b border-border">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="border-r border-border px-2 py-2 last:border-r-0"
          >
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Calendar grid — scrollable, gives way to dashboard ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {flatNotes.length === 0 && (
          /* Empty state overlay — subtle, doesn't disrupt the calendar grid */
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 opacity-0 transition-opacity duration-300 [.has-no-notes_&]:pointer-events-auto [.has-no-notes_&]:opacity-100">
            <FileText className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-[14px] text-muted-foreground/50">No notes this month</p>
          </div>
        )}

        <div
          className={cn(
            "grid grid-cols-7",
            flatNotes.length === 0 && "has-no-notes",
          )}
        >
          {calendarDays.map((day) => {
            const key = format(day, "yyyy-MM-dd")
            const dayNotes = notesByDay.get(key) ?? []
            const isSelected = selectedDate ? isSameDay(selectedDate, day) : false

            return (
              <DayCell
                key={key}
                day={day}
                currentMonth={currentMonth}
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

        {/* Bottom empty state — when fully empty, show centered message inside the grid */}
        {flatNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/60">
              <CalendarDays className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-muted-foreground">No notes yet</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground/60">
                Click any day to create a note, or use New note above.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Day dashboard — slides up from bottom ───── */}
      {selectedDate && (
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
    </main>
  )
}
