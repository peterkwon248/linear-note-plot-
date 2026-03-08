import { isToday, isThisWeek, isThisMonth } from "date-fns"
import type { Note, NoteStatus, NotePriority } from "../types"
import type { GroupBy, NoteGroup } from "./types"
import { STATUS_ORDER, PRIORITY_ORDER } from "./types"

/**
 * Stage 5: Group sorted notes by the given dimension.
 * Returns groups in a natural display order.
 */
export function applyGrouping(notes: Note[], groupBy: GroupBy): NoteGroup[] {
  switch (groupBy) {
    case "none":
      return [{ key: "_all", label: "", notes }]

    case "status":
      return groupByStatus(notes)

    case "priority":
      return groupByPriority(notes)

    case "date":
      return groupByDate(notes)

    case "project":
      return groupByProject(notes)

    default:
      return [{ key: "_all", label: "", notes }]
  }
}

/* ── Status grouping ──────────────────────────────────── */

const STATUS_LABELS: Record<NoteStatus, string> = {
  inbox: "Inbox",
  capture: "Capture",
  reference: "Reference",
  permanent: "Permanent",
}

const STATUS_KEYS: NoteStatus[] = ["inbox", "capture", "reference", "permanent"]

function groupByStatus(notes: Note[]): NoteGroup[] {
  const buckets = new Map<NoteStatus, Note[]>()
  for (const key of STATUS_KEYS) buckets.set(key, [])

  for (const note of notes) {
    const bucket = buckets.get(note.status)
    if (bucket) bucket.push(note)
  }

  return STATUS_KEYS
    .map((key) => ({
      key,
      label: STATUS_LABELS[key],
      notes: buckets.get(key) ?? [],
    }))
}

/* ── Priority grouping ────────────────────────────────── */

const PRIORITY_LABELS: Record<NotePriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "No Priority",
}

// Display order: urgent first
const PRIORITY_KEYS: NotePriority[] = ["urgent", "high", "medium", "low", "none"]

function groupByPriority(notes: Note[]): NoteGroup[] {
  const buckets = new Map<NotePriority, Note[]>()
  for (const key of PRIORITY_KEYS) buckets.set(key, [])

  for (const note of notes) {
    const bucket = buckets.get(note.priority)
    if (bucket) bucket.push(note)
  }

  return PRIORITY_KEYS
    .map((key) => ({
      key,
      label: PRIORITY_LABELS[key],
      notes: buckets.get(key) ?? [],
    }))
}

/* ── Date grouping ────────────────────────────────────── */

type DateBucket = "Today" | "This Week" | "This Month" | "Older"

const DATE_KEYS: DateBucket[] = ["Today", "This Week", "This Month", "Older"]

function getDateBucket(dateStr: string): DateBucket {
  const d = new Date(dateStr)
  if (isToday(d)) return "Today"
  if (isThisWeek(d, { weekStartsOn: 1 })) return "This Week"
  if (isThisMonth(d)) return "This Month"
  return "Older"
}

function groupByDate(notes: Note[]): NoteGroup[] {
  const buckets: Record<DateBucket, Note[]> = {
    Today: [],
    "This Week": [],
    "This Month": [],
    Older: [],
  }

  for (const note of notes) {
    buckets[getDateBucket(note.updatedAt)].push(note)
  }

  return DATE_KEYS
    .map((key) => ({
      key,
      label: key,
      notes: buckets[key],
    }))
}

/* ── Project grouping ─────────────────────────────────── */

function groupByProject(notes: Note[]): NoteGroup[] {
  const map = new Map<string, Note[]>()
  const noProject: Note[] = []

  for (const note of notes) {
    const projId = note.projectId
    if (!projId) {
      noProject.push(note)
      continue
    }
    const bucket = map.get(projId)
    if (bucket) bucket.push(note)
    else map.set(projId, [note])
  }

  const groups: NoteGroup[] = []

  // Sort project IDs (stable ordering)
  const sortedKeys = [...map.keys()].sort((a, b) => a.localeCompare(b))
  for (const key of sortedKeys) {
    groups.push({ key, label: key, notes: map.get(key)! })
  }

  if (noProject.length > 0) {
    groups.push({ key: "_no_project", label: "No Project", notes: noProject })
  }

  return groups
}
