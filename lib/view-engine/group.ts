import { isToday, isThisWeek, isThisMonth } from "date-fns"
import type { Note, NoteStatus, NotePriority, TriageStatus } from "../types"
import type { GroupBy, NoteGroup } from "./types"
import { STATUS_ORDER, PRIORITY_ORDER } from "./types"

/**
 * Stage 5: Group sorted notes by the given dimension.
 * Returns groups in a natural display order.
 */
export function applyGrouping(notes: Note[], groupBy: GroupBy, extras?: { backlinksMap?: Map<string, number>; labelNames?: Map<string, string>; folderNames?: Map<string, string>; customOrder?: string[]; subGroupBy?: GroupBy }): NoteGroup[] {
  let groups: NoteGroup[]

  switch (groupBy) {
    case "none":
      return [{ key: "_all", label: "", notes }]

    case "status":
      groups = groupByStatus(notes); break
    case "priority":
      groups = groupByPriority(notes); break
    case "date":
      groups = groupByDate(notes); break
    case "folder":
      groups = groupByFolder(notes, extras?.folderNames); break
    case "label":
      groups = groupByLabel(notes, extras?.labelNames); break
    case "triage":
      groups = groupByTriage(notes); break
    case "linkCount":
      groups = groupByLinkCount(notes, extras?.backlinksMap); break
    default:
      return [{ key: "_all", label: "", notes }]
  }

  // Apply custom group ordering if provided
  const customOrder = extras?.customOrder
  if (customOrder && customOrder.length > 0) {
    const orderMap = new Map(customOrder.map((k, i) => [k, i]))
    groups.sort((a, b) => (orderMap.get(a.key) ?? 999) - (orderMap.get(b.key) ?? 999))
  }

  // Apply sub-grouping if specified
  const subGroupBy = extras?.subGroupBy
  if (subGroupBy && subGroupBy !== "none" && subGroupBy !== groupBy) {
    for (const group of groups) {
      if (group.notes.length === 0) continue
      const subGroups = applyGrouping(group.notes, subGroupBy, {
        backlinksMap: extras?.backlinksMap,
        labelNames: extras?.labelNames,
        folderNames: extras?.folderNames,
      })
      // Only apply sub-grouping if it actually splits notes into multiple groups
      const nonEmpty = subGroups.filter((sg) => sg.notes.length > 0)
      if (nonEmpty.length > 1) {
        group.subGroups = subGroups
      }
    }
  }

  return groups
}

/* ── Status grouping ──────────────────────────────────── */

const STATUS_LABELS: Record<NoteStatus, string> = {
  inbox: "Inbox",
  capture: "Capture",
  permanent: "Permanent",
}

const STATUS_KEYS: NoteStatus[] = ["inbox", "capture", "permanent"]

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

function groupByFolder(notes: Note[], folderNames?: Map<string, string>): NoteGroup[] {
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

  const sortedKeys = [...map.keys()].sort((a, b) => {
    const nameA = folderNames?.get(a) ?? a
    const nameB = folderNames?.get(b) ?? b
    return nameA.localeCompare(nameB)
  })
  for (const key of sortedKeys) {
    groups.push({ key, label: folderNames?.get(key) ?? key, notes: map.get(key)! })
  }

  if (noFolder.length > 0) {
    groups.push({ key: "_no_folder", label: "No Folder", notes: noFolder })
  }

  return groups
}

/* ── Label grouping ──────────────────────────────────── */

function groupByLabel(notes: Note[], labelNames?: Map<string, string>): NoteGroup[] {
  const map = new Map<string, Note[]>()
  const noLabel: Note[] = []

  for (const note of notes) {
    const labelId = (note as any).labelId as string | null
    if (!labelId) {
      noLabel.push(note)
      continue
    }
    const bucket = map.get(labelId)
    if (bucket) bucket.push(note)
    else map.set(labelId, [note])
  }

  const groups: NoteGroup[] = []

  const sortedKeys = [...map.keys()].sort((a, b) => {
    const nameA = labelNames?.get(a) ?? a
    const nameB = labelNames?.get(b) ?? b
    return nameA.localeCompare(nameB)
  })
  for (const key of sortedKeys) {
    groups.push({ key, label: labelNames?.get(key) ?? key, notes: map.get(key)! })
  }

  if (noLabel.length > 0) {
    groups.push({ key: "_no_label", label: "No Label", notes: noLabel })
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
