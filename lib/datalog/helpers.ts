import type { NoteEvent, NoteEventType, Note } from "@/lib/types"
import {
  isToday,
  isYesterday,
  format,
  parseISO,
  startOfDay,
  subDays,
  startOfWeek,
  startOfMonth,
} from "date-fns"

/** Get events for a specific note, newest first */
export function getEventsForNote(
  events: NoteEvent[],
  noteId: string,
  limit?: number
): NoteEvent[] {
  const filtered = events
    .filter((e) => e.noteId === noteId)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  return limit ? filtered.slice(0, limit) : filtered
}

/** Group events by date label (Today, Yesterday, Mar 10...), newest first */
export function groupEventsByDate(
  events: NoteEvent[]
): { label: string; date: string; events: NoteEvent[] }[] {
  const sorted = [...events].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  )

  const groups = new Map<string, NoteEvent[]>()
  for (const event of sorted) {
    const date = parseISO(event.at)
    const dayKey = format(date, "yyyy-MM-dd")
    if (!groups.has(dayKey)) groups.set(dayKey, [])
    groups.get(dayKey)!.push(event)
  }

  return Array.from(groups.entries()).map(([dayKey, evts]) => {
    const date = parseISO(dayKey)
    let label: string
    if (isToday(date)) label = "Today"
    else if (isYesterday(date)) label = "Yesterday"
    else label = format(date, "MMM d")
    return { label, date: dayKey, events: evts }
  })
}

/** Filter events by allowed types */
export function filterEventsByTypes(
  events: NoteEvent[],
  types: NoteEventType[]
): NoteEvent[] {
  const set = new Set(types)
  return events.filter((e) => set.has(e.type))
}

/** Compute activity statistics */
export function computeActivityStats(
  events: NoteEvent[],
  notes: Note[]
): {
  todayCount: number
  weekCount: number
  monthCount: number
  mostOpened: { noteId: string; title: string; count: number }[]
  dailyActivity: { date: string; count: number }[]
} {
  const now = new Date()
  const todayStart = startOfDay(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const monthStart = startOfMonth(now)

  let todayCount = 0
  let weekCount = 0
  let monthCount = 0
  const openCounts = new Map<string, number>()

  for (const e of events) {
    const d = parseISO(e.at)
    if (d >= todayStart) todayCount++
    if (d >= weekStart) weekCount++
    if (d >= monthStart) monthCount++
    if (e.type === "opened") {
      openCounts.set(e.noteId, (openCounts.get(e.noteId) ?? 0) + 1)
    }
  }

  // Most opened — top 5
  const noteMap = new Map(notes.map((n) => [n.id, n.title]))
  const mostOpened = Array.from(openCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([noteId, count]) => ({
      noteId,
      title: noteMap.get(noteId) ?? "Untitled",
      count,
    }))

  // Daily activity — last 7 days
  const dailyActivity: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const day = subDays(now, i)
    const dayKey = format(day, "yyyy-MM-dd")
    const dayStart = startOfDay(day)
    const dayEnd = startOfDay(subDays(now, i - 1))
    const count = events.filter((e) => {
      const d = parseISO(e.at)
      return d >= dayStart && d < dayEnd
    }).length
    dailyActivity.push({ date: dayKey, count })
  }

  return { todayCount, weekCount, monthCount, mostOpened, dailyActivity }
}
