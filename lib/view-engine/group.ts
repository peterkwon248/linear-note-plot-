import { isToday, isThisWeek, isThisMonth } from "date-fns"
import type { Note, NoteStatus, NotePriority, TriageStatus } from "../types"
import type { GroupBy, GroupSortBy, NoteGroup } from "./types"
import { STATUS_ORDER, PRIORITY_ORDER } from "./types"
import { classifyNoteRole, type NoteRole } from "../note-hierarchy"

/**
 * Stage 5: Group sorted notes by the given dimension.
 * Returns groups in a natural display order.
 */
export function applyGrouping(notes: Note[], groupBy: GroupBy, extras?: { backlinksMap?: Map<string, number>; labelNames?: Map<string, string>; folderNames?: Map<string, string>; customOrder?: string[]; subGroupBy?: GroupBy; subGroupCustomOrder?: string[]; subGroupSortBy?: GroupSortBy; allNotes?: Note[]; filterAwareRole?: boolean }): NoteGroup[] {
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
    case "family":
      return groupByFamily(notes)
    case "parent":
      groups = groupByParent(notes, extras?.folderNames); break
    case "role": {
      // filterAwareRole ON → classify within current view slice (notes)
      // filterAwareRole OFF (default) → classify within full store (allNotes ?? notes)
      const lookupSource = extras?.filterAwareRole ? notes : (extras?.allNotes ?? notes)
      groups = groupByRole(notes, lookupSource); break
    }
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
  const subGroupSortBy = extras?.subGroupSortBy ?? "default"
  // Family sub-grouping disabled — family computes root from absolute parent chain,
  // so nesting it under another group would compute roots within a sliced subset (incorrect)
  if (subGroupBy && subGroupBy !== "none" && subGroupBy !== "family" && subGroupBy !== groupBy) {
    for (const group of groups) {
      if (group.notes.length === 0) continue
      const subGroups = applyGrouping(group.notes, subGroupBy, {
        backlinksMap: extras?.backlinksMap,
        labelNames: extras?.labelNames,
        folderNames: extras?.folderNames,
        // Only pass customOrder when manual mode is active
        customOrder: subGroupSortBy === "manual" ? extras?.subGroupCustomOrder : undefined,
        // Forward role-classification context so sub-group "Role" honors the filter-aware toggle
        // (without these, sub-group Role would always classify against the group slice — ignoring the toggle)
        allNotes: extras?.allNotes,
        filterAwareRole: extras?.filterAwareRole,
      })
      // Only apply sub-grouping if it actually splits notes into multiple groups
      const nonEmpty = subGroups.filter((sg) => sg.notes.length > 0)
      if (nonEmpty.length > 1) {
        // Apply sort criterion to non-empty sub-groups
        if (subGroupSortBy === "name") {
          nonEmpty.sort((a, b) => a.label.localeCompare(b.label))
          group.subGroups = nonEmpty
        } else if (subGroupSortBy === "count") {
          nonEmpty.sort((a, b) => b.notes.length - a.notes.length)
          group.subGroups = nonEmpty
        } else {
          // "default" (natural order) or "manual" (customOrder already applied inside applyGrouping)
          group.subGroups = subGroups
        }
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

  // v107 N:M: a note can belong to multiple folders. Decision (per plan
  // §"Group by folder 다중 표시"): the note appears in EACH of its folder
  // buckets. Visual marker for cross-folder notes lands in PR (b/c).
  for (const note of notes) {
    const ids = note.folderIds ?? []
    if (ids.length === 0) {
      noFolder.push(note)
      continue
    }
    for (const folderId of ids) {
      const bucket = map.get(folderId)
      if (bucket) bucket.push(note)
      else map.set(folderId, [note])
    }
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

/* ── Parent grouping (direct parent) ────────────────── */

function groupByParent(notes: Note[], _folderNames?: Map<string, string>): NoteGroup[] {
  const noteMap = new Map<string, Note>(notes.map((n) => [n.id, n]))
  const parentGroups = new Map<string, Note[]>()
  const noParent: Note[] = []

  for (const note of notes) {
    const parentId = note.parentNoteId
    if (!parentId) {
      noParent.push(note)
      continue
    }
    const bucket = parentGroups.get(parentId)
    if (bucket) bucket.push(note)
    else parentGroups.set(parentId, [note])
  }

  const groups: NoteGroup[] = []
  const sortedParentIds = [...parentGroups.keys()].sort((a, b) => {
    const titleA = noteMap.get(a)?.title ?? a
    const titleB = noteMap.get(b)?.title ?? b
    return titleA.localeCompare(titleB)
  })

  for (const parentId of sortedParentIds) {
    const parent = noteMap.get(parentId)
    groups.push({
      key: `parent-${parentId}`,
      label: parent?.title || "Untitled",
      notes: parentGroups.get(parentId)!,
    })
  }

  if (noParent.length > 0) {
    groups.push({ key: "_no_parent", label: "No Parent", notes: noParent })
  }

  return groups
}

/* ── Role grouping (Root / Parent / Child / Solo) ────── */

const ROLE_KEYS: NoteRole[] = ["root", "parent", "child", "solo"]

const ROLE_LABELS: Record<NoteRole, string> = {
  root: "Root",
  parent: "Parent",
  child: "Child",
  solo: "Solo",
}

function groupByRole(notes: Note[], lookupSource: Note[]): NoteGroup[] {
  const buckets: Record<NoteRole, Note[]> = {
    root: [],
    parent: [],
    child: [],
    solo: [],
  }
  const store = { notes: lookupSource }
  for (const note of notes) {
    buckets[classifyNoteRole(note.id, store)].push(note)
  }
  return ROLE_KEYS.map((key) => ({
    key: `role-${key}`,
    label: ROLE_LABELS[key],
    notes: buckets[key],
  }))
}

/* ── Family grouping (tree / ancestor) ───────────────── */

const MAX_DEPTH = 20

/**
 * Build a map of noteId → depth from root via parentNoteId chain.
 * Root notes (parentNoteId = null or pointing outside the set) have depth 0.
 * Cycle-safe via visited Set + MAX_DEPTH cap.
 */
function buildDepthMap(notes: Note[]): Map<string, number> {
  const noteMap = new Map<string, Note>(notes.map((n) => [n.id, n]))
  const depthCache = new Map<string, number>()

  function getDepth(noteId: string, visited: Set<string>): number {
    if (depthCache.has(noteId)) return depthCache.get(noteId)!
    if (visited.has(noteId)) return 0  // cycle guard
    const note = noteMap.get(noteId)
    if (!note || !note.parentNoteId || !noteMap.has(note.parentNoteId)) {
      depthCache.set(noteId, 0)
      return 0
    }
    const nextVisited = new Set(visited)
    nextVisited.add(noteId)
    const parentDepth = getDepth(note.parentNoteId, nextVisited)
    const depth = Math.min(parentDepth + 1, MAX_DEPTH)
    depthCache.set(noteId, depth)
    return depth
  }

  for (const note of notes) {
    getDepth(note.id, new Set())
  }

  return depthCache
}

/**
 * Find the root ancestor ID for a note.
 * Traverses parentNoteId chain upward until no parent found in set.
 * Cycle-safe via visited Set + MAX_DEPTH cap.
 */
function getRootId(noteId: string, noteMap: Map<string, Note>): string {
  const visited = new Set<string>()
  let current = noteId
  let steps = 0

  while (steps < MAX_DEPTH) {
    if (visited.has(current)) break  // cycle guard
    visited.add(current)
    const note = noteMap.get(current)
    if (!note || !note.parentNoteId || !noteMap.has(note.parentNoteId)) break
    current = note.parentNoteId
    steps++
  }

  return current
}

/**
 * Group notes by their root ancestor (family).
 * Each group contains all descendants of the same root, sorted by depth then title.
 * depthMap: Record<noteId, depth> is included in each group.
 */
function groupByFamily(notes: Note[]): NoteGroup[] {
  const noteMap = new Map<string, Note>(notes.map((n) => [n.id, n]))
  const depthMap = buildDepthMap(notes)

  // Group by root ancestor
  const families = new Map<string, Note[]>()
  for (const note of notes) {
    const rootId = getRootId(note.id, noteMap)
    const bucket = families.get(rootId)
    if (bucket) bucket.push(note)
    else families.set(rootId, [note])
  }

  // Build NoteGroup array, sorted by root title
  const groups: NoteGroup[] = []
  for (const [rootId, members] of families) {
    const root = noteMap.get(rootId)
    const rootLabel = root?.title || "Untitled"

    // Sort members by depth, then title
    const sorted = [...members].sort((a, b) => {
      const da = depthMap.get(a.id) ?? 0
      const db = depthMap.get(b.id) ?? 0
      if (da !== db) return da - db
      return (a.title || "").localeCompare(b.title || "")
    })

    const groupDepthMap: Record<string, number> = {}
    for (const note of sorted) {
      groupDepthMap[note.id] = depthMap.get(note.id) ?? 0
    }

    groups.push({
      key: `family-${rootId}`,
      label: rootLabel,
      notes: sorted,
      depthMap: groupDepthMap,
    })
  }

  // Sort groups by root label
  groups.sort((a, b) => a.label.localeCompare(b.label))

  return groups
}
