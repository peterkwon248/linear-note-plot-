"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { PROJECT_STATUS_CONFIG, ProjectStatusDropdown, PriorityDropdown } from "@/components/note-fields"
import {
  ArrowLeft,
  FolderOpen,
  FileText,
  Plus,
  Link,
  Zap,
  Clock3,
  Coffee,
  CalendarDays,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  SlidersHorizontal,
} from "lucide-react"
import {
  format,
  endOfMonth,
  endOfQuarter,
  addMonths,
  addQuarters,
  endOfYear,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  subMonths,
} from "date-fns"
import type { ProjectFocus } from "@/lib/types"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/* ── Focus indicator (urgency) ────────────────────────── */

const FOCUS_OPTIONS = [
  { key: "now" as const, label: "Now", icon: Zap, color: "#e5484d", bg: "rgba(229, 72, 77, 0.12)" },
  { key: "soon" as const, label: "Soon", icon: Clock3, color: "#f2c94c", bg: "rgba(242, 201, 76, 0.12)" },
  { key: "later" as const, label: "Later", icon: Coffee, color: "#5e6ad2", bg: "rgba(94, 106, 210, 0.12)" },
]

function FocusSelector({ value, onChange }: { value: ProjectFocus; onChange: (f: ProjectFocus) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {FOCUS_OPTIONS.map(({ key, label, icon: Icon, color, bg }) => {
        const active = value === key
        return (
          <button
            key={key}
            onClick={() => onChange(active ? null : key)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-all"
            style={{
              backgroundColor: active ? bg : "transparent",
              color: active ? color : "var(--muted-foreground)",
              opacity: active ? 1 : 0.4,
            }}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

/* ── Target date picker (Linear-style) ───────────────── */

function getQuarterLabel(date: Date) {
  const q = Math.ceil((date.getMonth() + 1) / 3)
  return `Q${q} ${date.getFullYear()}`
}

function getHalfLabel(date: Date) {
  const h = date.getMonth() < 6 ? 1 : 2
  return `H${h} ${date.getFullYear()}`
}

function buildDatePresets() {
  const now = new Date()
  const presets: { label: string; date: Date; group: string }[] = []

  // Month presets
  const thisMonthEnd = endOfMonth(now)
  const nextMonthEnd = endOfMonth(addMonths(now, 1))
  presets.push({ label: format(thisMonthEnd, "MMM yyyy"), date: thisMonthEnd, group: "Month" })
  presets.push({ label: format(nextMonthEnd, "MMM yyyy"), date: nextMonthEnd, group: "Month" })

  // Quarter presets
  const thisQuarterEnd = endOfQuarter(now)
  const nextQuarterEnd = endOfQuarter(addQuarters(now, 1))
  presets.push({ label: getQuarterLabel(now), date: thisQuarterEnd, group: "Quarter" })
  presets.push({ label: getQuarterLabel(addQuarters(now, 1)), date: nextQuarterEnd, group: "Quarter" })

  // Half presets
  const currentHalf = now.getMonth() < 6 ? 0 : 1
  const h1End = new Date(now.getFullYear(), 5, 30)
  const h2End = new Date(now.getFullYear(), 11, 31)
  if (currentHalf === 0) {
    presets.push({ label: `H1 ${now.getFullYear()}`, date: h1End, group: "Half" })
    presets.push({ label: `H2 ${now.getFullYear()}`, date: h2End, group: "Half" })
  } else {
    presets.push({ label: `H2 ${now.getFullYear()}`, date: h2End, group: "Half" })
    presets.push({ label: `H1 ${now.getFullYear() + 1}`, date: new Date(now.getFullYear() + 1, 5, 30), group: "Half" })
  }

  // Year
  const yearEnd = endOfYear(now)
  presets.push({ label: `${now.getFullYear()}`, date: yearEnd, group: "Year" })
  presets.push({ label: `${now.getFullYear() + 1}`, date: endOfYear(new Date(now.getFullYear() + 1, 0, 1)), group: "Year" })

  return presets
}

function MiniCalendar({
  selected,
  onSelect,
}: {
  selected: Date | null
  onSelect: (date: Date) => void
}) {
  const [viewMonth, setViewMonth] = useState(() => selected ?? new Date())
  const [view, setView] = useState<"days" | "months" | "years">("days")

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const currentYear = viewMonth.getFullYear()
  const yearRangeStart = currentYear - (currentYear % 12)
  const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i)

  // ── Year grid ──
  if (view === "years") {
    return (
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setViewMonth(new Date(currentYear - 12, viewMonth.getMonth(), 1))}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[14px] font-medium text-foreground">
            {yearRangeStart} – {yearRangeStart + 11}
          </span>
          <button
            onClick={() => setViewMonth(new Date(currentYear + 12, viewMonth.getMonth(), 1))}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {years.map((y) => {
            const isCurrent = y === new Date().getFullYear()
            const isViewYear = y === currentYear
            return (
              <button
                key={y}
                onClick={() => {
                  setViewMonth(new Date(y, viewMonth.getMonth(), 1))
                  setView("months")
                }}
                className={`flex h-8 items-center justify-center rounded-md text-[14px] transition-colors ${
                  isViewYear
                    ? "bg-accent text-accent-foreground font-medium"
                    : isCurrent
                    ? "text-accent font-medium hover:bg-secondary"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {y}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Month grid ──
  if (view === "months") {
    return (
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setViewMonth(new Date(currentYear - 1, viewMonth.getMonth(), 1))}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("years")}
            className="text-[14px] font-medium text-foreground hover:text-accent transition-colors"
          >
            {currentYear}
          </button>
          <button
            onClick={() => setViewMonth(new Date(currentYear + 1, viewMonth.getMonth(), 1))}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((m, i) => {
            const isCurrentMonth = i === new Date().getMonth() && currentYear === new Date().getFullYear()
            const isViewMonth = i === viewMonth.getMonth()
            return (
              <button
                key={m}
                onClick={() => {
                  setViewMonth(new Date(currentYear, i, 1))
                  setView("days")
                }}
                className={`flex h-8 items-center justify-center rounded-md text-[14px] transition-colors ${
                  isViewMonth
                    ? "bg-accent text-accent-foreground font-medium"
                    : isCurrentMonth
                    ? "text-accent font-medium hover:bg-secondary"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {m}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Day grid (default) ──
  return (
    <div className="p-2">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setView("months")}
          className="text-[14px] font-medium text-foreground hover:text-accent transition-colors"
        >
          {format(viewMonth, "MMMM yyyy")}
        </button>
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="flex h-7 items-center justify-center text-[11px] font-medium text-muted-foreground/50">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = isSameMonth(day, viewMonth)
          const isSelected = selected && isSameDay(day, selected)
          const today = isToday(day)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              className={`flex h-7 w-full items-center justify-center rounded-md text-[12px] transition-colors ${
                isSelected
                  ? "bg-accent text-accent-foreground font-medium"
                  : today
                  ? "text-accent font-medium hover:bg-secondary"
                  : inMonth
                  ? "text-foreground hover:bg-secondary"
                  : "text-muted-foreground/25 hover:bg-secondary/50"
              }`}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TargetDatePicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (date: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const presets = useMemo(() => buildDatePresets(), [])

  const groups = useMemo(() => {
    const map = new Map<string, typeof presets>()
    for (const p of presets) {
      const arr = map.get(p.group) ?? []
      arr.push(p)
      map.set(p.group, arr)
    }
    return map
  }, [presets])

  const selectDate = (date: Date) => {
    onChange(date.toISOString())
    setOpen(false)
    setShowCalendar(false)
  }

  return (
    <Popover open={open} onOpenChange={(o) => {
      setOpen(o)
      if (!o) setShowCalendar(false)
    }}>
      <PopoverTrigger asChild>
        <button className="text-[15px] text-foreground hover:text-accent transition-colors">
          {value ? format(new Date(value), "MMM d, yyyy") : "Set date..."}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0" sideOffset={4}>
        {showCalendar ? (
          <div>
            <MiniCalendar
              selected={value ? new Date(value) : null}
              onSelect={selectDate}
            />
            <div className="border-t border-border p-2">
              <button
                onClick={() => setShowCalendar(false)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[14px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back to presets
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {Array.from(groups.entries()).map(([group, items]) => (
              <div key={group}>
                <div className="px-2 py-1 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                  {group}
                </div>
                {items.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => selectDate(preset.date)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[14px] text-foreground transition-colors hover:bg-secondary"
                  >
                    <span>{preset.label}</span>
                    <span className="text-[12px] text-muted-foreground/50">
                      {format(preset.date, "MMM d")}
                    </span>
                  </button>
                ))}
              </div>
            ))}

            <div className="border-t border-border pt-1 mt-1">
              <button
                onClick={() => setShowCalendar(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[14px] text-foreground transition-colors hover:bg-secondary"
              >
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60" />
                Pick exact date...
              </button>
            </div>

            {value && (
              <div className="border-t border-border pt-1 mt-1">
                <button
                  onClick={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[14px] text-destructive transition-colors hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear date
                </button>
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/* ── Project detail page ──────────────────────────────── */

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const projects = usePlotStore((s) => s.projects)
  const notes = usePlotStore((s) => s.notes)
  const updateProject = usePlotStore((s) => s.updateProject)
  const updateNote = usePlotStore((s) => s.updateNote)
  const createNote = usePlotStore((s) => s.createNote)
  const openNote = usePlotStore((s) => s.openNote)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)

  const [noteFilter, setNoteFilter] = useState<"all" | "active" | "done">("all")
  const [noteSortField, setNoteSortField] = useState<"updatedAt" | "title" | "status" | "priority">("updatedAt")
  const [noteSortAsc, setNoteSortAsc] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState("")

  const project = projects.find((p) => p.id === projectId)

  const allProjectNotes = useMemo(
    () => notes.filter((n) => n.projectId === projectId && !n.trashed),
    [notes, projectId]
  )

  const projectNotes = useMemo(() => {
    let result = [...allProjectNotes]

    if (noteFilter === "active") {
      result = result.filter((n) => n.status !== "permanent")
    } else if (noteFilter === "done") {
      result = result.filter((n) => n.status === "permanent")
    }

    result.sort((a, b) => {
      let cmp = 0
      switch (noteSortField) {
        case "updatedAt": cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break
        case "title": cmp = (a.title || "").localeCompare(b.title || ""); break
        case "status": {
          const ORDER: Record<string, number> = { inbox: 0, capture: 1, reference: 2, permanent: 3 }
          cmp = (ORDER[a.status] ?? 0) - (ORDER[b.status] ?? 0)
          break
        }
        case "priority": {
          const ORDER: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3, urgent: 4 }
          cmp = (ORDER[a.priority] ?? 0) - (ORDER[b.priority] ?? 0)
          break
        }
      }
      return noteSortAsc ? cmp : -cmp
    })

    return result
  }, [allProjectNotes, noteFilter, noteSortField, noteSortAsc])

  const unassignedNotes = useMemo(
    () =>
      notes
        .filter((n) => n.projectId === null && !n.trashed)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [notes]
  )

  const PICKER_LIMIT = 15
  const displayedNotes = pickerSearch ? unassignedNotes : unassignedNotes.slice(0, PICKER_LIMIT)
  const hasMoreNotes = !pickerSearch && unassignedNotes.length > PICKER_LIMIT

  const stats = useMemo(() => {
    const total = allProjectNotes.length
    const permanent = allProjectNotes.filter((n) => n.status === "permanent").length
    const active = total - permanent
    return { total, permanent, active }
  }, [allProjectNotes])

  // If editing a note, show the editor
  if (selectedNoteId) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <NoteEditor />
        <NoteInspector />
      </div>
    )
  }

  if (!project) {
    return (
      <main className="flex h-full flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <FolderOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-[15px] text-muted-foreground">Project not found</p>
          <button
            onClick={() => router.push("/projects")}
            className="mt-3 text-[14px] text-accent hover:underline"
          >
            Back to projects
          </button>
        </div>
      </main>
    )
  }

  const statusCfg = PROJECT_STATUS_CONFIG[project.status] ?? PROJECT_STATUS_CONFIG.planning

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/projects")}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <FolderOpen className="h-5 w-5 text-accent" />
          <h1 className="text-base font-semibold text-foreground">{project.name}</h1>
          <span
            className="rounded-md px-2 py-0.5 text-[12px] font-medium"
            style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Meta section */}
        <div className="border-b border-border px-5 py-4 space-y-3">
          {/* Row 1: Status + Focus */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-muted-foreground w-16">Status</span>
              <div onClick={(e) => e.stopPropagation()}>
                <ProjectStatusDropdown
                  value={project.status}
                  onChange={(s) => updateProject(project.id, { status: s })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-muted-foreground w-16">Focus</span>
              <FocusSelector
                value={project.focus}
                onChange={(f) => updateProject(project.id, { focus: f })}
              />
            </div>
          </div>
          {/* Row 2: Description */}
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-medium text-muted-foreground w-16">Desc</span>
            <input
              value={project.description || ""}
              onChange={(e) => updateProject(project.id, { description: e.target.value })}
              placeholder="Add a description..."
              className="flex-1 bg-transparent text-[14px] text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:text-foreground"
            />
          </div>
          {/* Row 3: Target date */}
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-medium text-muted-foreground w-16">Target</span>
            <TargetDatePicker
              value={project.targetDate}
              onChange={(date) => updateProject(project.id, { targetDate: date })}
            />
          </div>
        </div>

        {/* Notes toolbar */}
        <div className="flex items-center justify-between border-b border-border px-5 py-2">
          <div className="flex items-center gap-1">
            {(["all", "active", "done"] as const).map((tab) => {
              const count = tab === "all" ? stats.total : tab === "active" ? stats.active : stats.permanent
              const isActive = noteFilter === tab
              return (
                <button
                  key={tab}
                  onClick={() => setNoteFilter(tab)}
                  className={`rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors ${
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="ml-1.5 text-[12px] text-muted-foreground">{count}</span>
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[14px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Display
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground" disabled>
                  Sort by
                </DropdownMenuItem>
                {([
                  { field: "updatedAt" as const, label: "Updated" },
                  { field: "title" as const, label: "Title" },
                  { field: "status" as const, label: "Status" },
                  { field: "priority" as const, label: "Priority" },
                ]).map((opt) => (
                  <DropdownMenuItem
                    key={opt.field}
                    onSelect={(e) => {
                      e.preventDefault()
                      if (noteSortField === opt.field) setNoteSortAsc((v) => !v)
                      else { setNoteSortField(opt.field); setNoteSortAsc(true) }
                    }}
                  >
                    <Check className={`h-3.5 w-3.5 shrink-0 ${noteSortField === opt.field ? "text-accent opacity-100" : "opacity-0"}`} />
                    <span className="text-[14px]">{opt.label}</span>
                    {noteSortField === opt.field && (
                      <span className="ml-auto text-[11px] text-muted-foreground">
                        {noteSortAsc ? "A\u2192Z" : "Z\u2192A"}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add existing note popover */}
            <Popover open={pickerOpen} onOpenChange={(open) => {
              setPickerOpen(open)
              if (!open) setPickerSearch("")
            }}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-[14px] font-medium text-foreground transition-colors hover:bg-secondary/80">
                  <Link className="h-3.5 w-3.5" />
                  Add existing
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0" sideOffset={4}>
                <Command>
                  <CommandInput
                    placeholder="Search notes..."
                    className="text-[14px]"
                    value={pickerSearch}
                    onValueChange={setPickerSearch}
                  />
                  <CommandList>
                    <CommandEmpty className="py-4 text-[14px] text-muted-foreground">
                      No matching notes
                    </CommandEmpty>
                    <CommandGroup>
                      {displayedNotes.map((note) => (
                        <CommandItem
                          key={note.id}
                          value={note.title || "Untitled"}
                          onSelect={() => {
                            updateNote(note.id, { projectId: project.id })
                            setPickerOpen(false)
                            setPickerSearch("")
                          }}
                          className="flex items-center justify-between gap-2 text-[14px]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                            <span className="truncate">{note.title || "Untitled"}</span>
                          </div>
                          <span
                            className={`shrink-0 inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                              note.status === "permanent"
                                ? "bg-[#45d483]/12 text-[#45d483]"
                                : note.status === "capture"
                                ? "bg-[#f2994a]/12 text-[#f2994a]"
                                : note.status === "reference"
                                ? "bg-[#5e6ad2]/12 text-[#5e6ad2]"
                                : "bg-[#06b6d4]/12 text-[#06b6d4]"
                            }`}
                          >
                            {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {hasMoreNotes && (
                      <div className="border-t border-border px-3 py-2 text-[12px] text-muted-foreground/60">
                        {unassignedNotes.length - PICKER_LIMIT} more — type to search
                      </div>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Add note button */}
            <button
              onClick={() => {
                const id = createNote({ projectId: project.id })
                openNote(id)
              }}
              className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[14px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            >
              <Plus className="h-3.5 w-3.5" />
              Add note
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center border-b border-border px-5 py-2">
          <div className="flex-1 min-w-0">
            <span className="text-[12px] font-medium text-muted-foreground">Title</span>
          </div>
          <div className="w-[80px] shrink-0 text-right">
            <span className="text-[12px] font-medium text-muted-foreground">Status</span>
          </div>
          <div className="w-[80px] shrink-0 text-right">
            <span className="text-[12px] font-medium text-muted-foreground">Priority</span>
          </div>
          <div className="w-[80px] shrink-0 text-right">
            <span className="text-[12px] font-medium text-muted-foreground">Updated</span>
          </div>
          <div className="w-[32px] shrink-0" />
        </div>

        {/* Note rows */}
        {projectNotes.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-center">
            <div>
              <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="text-[15px] text-muted-foreground">
                {noteFilter !== "all" ? "No matching notes" : "No notes in this project"}
              </p>
              <p className="mt-1 text-[14px] text-muted-foreground/60">
                {noteFilter !== "all" ? "Try a different filter." : "Add notes to track progress."}
              </p>
            </div>
          </div>
        ) : (
          projectNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => openNote(note.id)}
              className="group flex items-center border-b border-border px-5 py-2.5 transition-colors hover:bg-secondary/30 cursor-pointer"
            >
              <div className="flex flex-1 items-center gap-2.5 min-w-0 pr-3">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                <span className="truncate text-[15px] text-foreground">
                  {note.title || "Untitled"}
                </span>
              </div>
              <div className="w-[80px] shrink-0 text-right">
                <span
                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                    note.status === "permanent"
                      ? "bg-[#45d483]/12 text-[#45d483]"
                      : note.status === "capture"
                      ? "bg-[#f2994a]/12 text-[#f2994a]"
                      : note.status === "reference"
                      ? "bg-[#5e6ad2]/12 text-[#5e6ad2]"
                      : "bg-[#06b6d4]/12 text-[#06b6d4]"
                  }`}
                >
                  {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                </span>
              </div>
              <div className="w-[80px] shrink-0 text-right" onClick={(e) => e.stopPropagation()}>
                <PriorityDropdown
                  value={note.priority}
                  onChange={(p) => updateNote(note.id, { priority: p })}
                  variant="inline"
                />
              </div>
              <div className="w-[80px] shrink-0 text-right">
                <span className="text-[14px] tabular-nums text-muted-foreground">
                  {format(new Date(note.updatedAt), "MMM d")}
                </span>
              </div>
              <div className="w-[32px] shrink-0 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    updateNote(note.id, { projectId: null })
                  }}
                  className="rounded-md p-0.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60 hover:!text-destructive hover:!bg-destructive/10"
                  title="Remove from project"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
