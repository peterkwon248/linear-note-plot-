import { isToday, isThisWeek, isThisMonth } from "date-fns"
import type { Note, NoteStatus, NotePriority, TriageStatus } from "../types"
import type { GroupBy, NoteGroup } from "./types"
import { STATUS_ORDER, PRIORITY_ORDER } from "./types"

/**
 * Stage 5: Group sorted notes by the given dimension.
 * Returns groups in a natural display order.
 */
export function applyGrouping(notes: Note[], groupBy: GroupBy, extras?: { backlinksMap?: Map<string, number> }): NoteGroup[] {
  switch (groupBy) {
    case "none":
      return [{ key: "_all", label: "", notes }]

    case "status":
      return groupByStatus(notes)

    case "priority":
      return groupByPriority(notes)

    case "date":
      return groupByDate(notes)

    case "folder":
      return groupByFolder(notes)

    case "triage":
      return groupByTriage(notes)

    case "linkCount":
      return groupByLinkCount(notes, extras?.backlinksMap)

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

/* ── Folder grouping ──────────────────────────────────── */

function groupByFolder(notes: Note[]): NoteGroup[] {
  const map = new Map<string, Note[]>()
  const noFolder: Note[] = []

  for (const note of notes) {
    const folderId = note.folderId
    if (!folderId) {
      noFolder.push(note)
      continue
    }
    const bucket = map.get(folderId)
    if (bucket) bucket.push(note)
    else map.set(folderId, [note])
  }

  const groups: NoteGroup[] = []

  // Sort folder IDs (stable ordering)
  const sortedKeys = [...map.keys()].sort((a, b) => a.localeCompare(b))
  for (const key of sortedKeys) {
    groups.push({ key, label: key, notes: map.get(key)! })
  }

  if (noFolder.length > 0) {
    groups.push({ key: "_no_folder", label: "No Folder", notes: noFolder })
  }

  return groups
}

/* ── Triage grouping (Inbox workflow) ────────────────── */

const TRIAGE_LABELS: Record<TriageStatus, string> = {
  untriaged: "New",
  kept: "Kept",
  snoozed: "Snoozed",
  trashed: "Trashed",
}

const TRIAGE_KEYS: TriageStatus[] = ["untriaged", "kept", "snoozed", "trashed"]

function groupByTriage(notes: Note[]): NoteGroup[] {
  const buckets = new Map<TriageStatus, Note[]>()
  for (const key of TRIAGE_KEYS) buckets.set(key, [])

  for (const note of notes) {
    const bucket = buckets.get(note.triageStatus)
    if (bucket) bucket.push(note)
  }

  return TRIAGE_KEYS
    .map((key) => ({
      key,
      label: TRIAGE_LABELS[key],
      notes: buckets.get(key) ?? [],
    }))
}

/* ── Link count grouping (knowledge maturity) ────────── */

type LinkBucket = "none" | "few" | "well" | "hub"

const LINK_BUCKET_LABELS: Record<LinkBucket, string> = {
  none: "No Links",
  few: "1-2 Links",
  well: "3-5 Links",
  hub: "6+ Links",
}

const LINK_BUCKET_KEYS: LinkBucket[] = ["none", "few", "well", "hub"]

function getLinkBucket(totalLinks: number): LinkBucket {
  if (totalLinks === 0) return "none"
  if (totalLinks <= 2) return "few"
  if (totalLinks <= 5) return "well"
  return "hub"
}

function groupByLinkCount(notes: Note[], backlinksMap?: Map<string, number>): NoteGroup[] {
  const buckets: Record<LinkBucket, Note[]> = {
    none: [],
    few: [],
    well: [],
    hub: [],
  }

  for (const note of notes) {
    const outgoing = (note.linksOut ?? []).length
    const incoming = backlinksMap?.get(note.id) ?? 0
    const total = outgoing + incoming
    buckets[getLinkBucket(total)].push(note)
  }

  return LINK_BUCKET_KEYS
    .map((key) => ({
      key,
      label: LINK_BUCKET_LABELS[key],
      notes: buckets[key],
    }))
}
