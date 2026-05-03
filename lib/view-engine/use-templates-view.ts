"use client"

import { useMemo, useCallback } from "react"
import { usePlotStore } from "../store"
import type { ViewState, ViewContextKey, FilterRule, SortRule, GroupBy } from "./types"
import { STATUS_ORDER, PRIORITY_ORDER } from "./types"
import { buildViewStateForContext } from "./defaults"
import type { NoteTemplate } from "../types"

/**
 * Templates pipeline result. Mirrors UseNotesViewResult shape (groups +
 * flatNotes + viewState + updateViewState) so consumers can swap call sites
 * with minimal friction.
 *
 * Scope guard: deliberately does NOT reuse `applyFilters / applySort /
 * applyGrouping` from the notes pipeline — those are typed against `Note`
 * and would require generic refactoring (=scope creep). Thin templates-only
 * implementations live here.
 */
export interface TemplateGroup {
  key: string
  label: string
  templates: NoteTemplate[]
}

export interface UseTemplatesViewResult {
  groups: TemplateGroup[]
  flatTemplates: NoteTemplate[]
  flatCount: number
  totalCount: number
  viewState: ViewState
  updateViewState: (patch: Partial<ViewState>) => void
}

/* ── Stage 1: User filters ────────────────────────────── */

function templateMatchesRule(t: NoteTemplate, rule: FilterRule): boolean {
  const { field, operator, value } = rule
  const eq = (a: unknown, b: unknown) => operator === "eq" ? a === b : a !== b

  switch (field) {
    case "status":   return eq(t.status, value)
    case "priority": return eq(t.priority, value)
    case "label": {
      const lid = t.labelId ?? ""
      if (value === "_none") return operator === "eq" ? lid === "" : lid !== ""
      return eq(lid, value)
    }
    case "folder": {
      const fid = t.folderId ?? ""
      if (value === "_none") return operator === "eq" ? fid === "" : fid !== ""
      return eq(fid, value)
    }
    case "tags": {
      const has = (t.tags ?? []).includes(value)
      return operator === "eq" ? has : !has
    }
    case "pinned": {
      const target = value === "true"
      return operator === "eq" ? t.pinned === target : t.pinned !== target
    }
    default:
      return true
  }
}

function applyTemplateFilters(templates: NoteTemplate[], filters: FilterRule[]): NoteTemplate[] {
  if (filters.length === 0) return templates
  // OR within field, AND across fields — same semantics as note filters.
  const byField = new Map<string, FilterRule[]>()
  for (const r of filters) {
    const bucket = byField.get(r.field) ?? []
    bucket.push(r)
    byField.set(r.field, bucket)
  }
  const groups = Array.from(byField.values())
  return templates.filter((t) =>
    groups.every((rules) => rules.some((r) => templateMatchesRule(t, r))),
  )
}

/* ── Stage 2: Search ──────────────────────────────────── */

function applyTemplateSearch(templates: NoteTemplate[], query: string): NoteTemplate[] {
  const q = query.trim().toLowerCase()
  if (!q) return templates
  return templates.filter((t) => {
    if (t.name.toLowerCase().includes(q)) return true
    if (t.description?.toLowerCase().includes(q)) return true
    return false
  })
}

/* ── Stage 3: Sort ────────────────────────────────────── */

function compareTemplate(a: NoteTemplate, b: NoteTemplate, rule: SortRule): number {
  const dir = rule.direction === "asc" ? 1 : -1
  switch (rule.field) {
    case "title":     return dir * a.name.localeCompare(b.name)
    case "status":    return dir * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
    case "priority":  return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    case "createdAt": return dir * (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0)
    case "updatedAt": return dir * (a.updatedAt < b.updatedAt ? -1 : a.updatedAt > b.updatedAt ? 1 : 0)
    default:          return 0
  }
}

function applyTemplateSort(templates: NoteTemplate[], sortFields: SortRule[]): NoteTemplate[] {
  if (templates.length <= 1) return templates
  const chain = sortFields.length > 0 ? sortFields : [{ field: "updatedAt" as const, direction: "desc" as const }]
  // Pinned templates float to the top regardless of sort (matches the legacy
  // behavior of templates-view.tsx and matches Notes-table semantics where
  // pinned-first is always preserved).
  const sorted = [...templates].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    for (const rule of chain) {
      const r = compareTemplate(a, b, rule)
      if (r !== 0) return r
    }
    return 0
  })
  return sorted
}

/* ── Stage 4: Group ───────────────────────────────────── */

function applyTemplateGrouping(
  templates: NoteTemplate[],
  groupBy: GroupBy,
  extras?: { labelNames?: Map<string, string>; folderNames?: Map<string, string> },
): TemplateGroup[] {
  if (groupBy === "none") {
    return [{ key: "_all", label: "", templates }]
  }

  if (groupBy === "status") {
    const buckets = new Map<string, NoteTemplate[]>()
    const labels: Record<string, string> = { inbox: "Inbox", capture: "Capture", permanent: "Permanent" }
    const order = ["inbox", "capture", "permanent"]
    for (const k of order) buckets.set(k, [])
    for (const t of templates) buckets.get(t.status)?.push(t)
    return order.map((k) => ({ key: k, label: labels[k], templates: buckets.get(k) ?? [] }))
  }

  if (groupBy === "priority") {
    const buckets = new Map<string, NoteTemplate[]>()
    const labels: Record<string, string> = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low", none: "No Priority" }
    const order = ["urgent", "high", "medium", "low", "none"]
    for (const k of order) buckets.set(k, [])
    for (const t of templates) buckets.get(t.priority)?.push(t)
    return order.map((k) => ({ key: k, label: labels[k], templates: buckets.get(k) ?? [] }))
  }

  if (groupBy === "label") {
    const map = new Map<string, NoteTemplate[]>()
    const noLabel: NoteTemplate[] = []
    for (const t of templates) {
      const lid = t.labelId
      if (!lid) { noLabel.push(t); continue }
      const bucket = map.get(lid) ?? []
      bucket.push(t)
      map.set(lid, bucket)
    }
    const sortedKeys = [...map.keys()].sort((a, b) => {
      const na = extras?.labelNames?.get(a) ?? a
      const nb = extras?.labelNames?.get(b) ?? b
      return na.localeCompare(nb)
    })
    const groups: TemplateGroup[] = sortedKeys.map((k) => ({
      key: k,
      label: extras?.labelNames?.get(k) ?? k,
      templates: map.get(k)!,
    }))
    if (noLabel.length > 0) {
      groups.push({ key: "_no_label", label: "No Label", templates: noLabel })
    }
    return groups
  }

  if (groupBy === "folder") {
    const map = new Map<string, NoteTemplate[]>()
    const noFolder: NoteTemplate[] = []
    for (const t of templates) {
      const fid = t.folderId
      if (!fid) { noFolder.push(t); continue }
      const bucket = map.get(fid) ?? []
      bucket.push(t)
      map.set(fid, bucket)
    }
    const sortedKeys = [...map.keys()].sort((a, b) => {
      const na = extras?.folderNames?.get(a) ?? a
      const nb = extras?.folderNames?.get(b) ?? b
      return na.localeCompare(nb)
    })
    const groups: TemplateGroup[] = sortedKeys.map((k) => ({
      key: k,
      label: extras?.folderNames?.get(k) ?? k,
      templates: map.get(k)!,
    }))
    if (noFolder.length > 0) {
      groups.push({ key: "_no_folder", label: "No Folder", templates: noFolder })
    }
    return groups
  }

  // Unknown grouping → fall back to single bucket.
  return [{ key: "_all", label: "", templates }]
}

/* ── Hook ──────────────────────────────────────────────── */

/**
 * Templates pipeline hook. Wraps the templates-only filter/search/sort/group
 * stages with staged useMemo so individual pipeline stages don't recompute
 * on unrelated viewState changes (mirrors useNotesView).
 *
 * `contextKey` is locked to "templates" — passing it explicitly keeps the
 * call site consistent with useNotesView/wiki-view.
 */
export function useTemplatesView(contextKey: ViewContextKey = "templates"): UseTemplatesViewResult {
  const templates = usePlotStore((s) => s.templates) as NoteTemplate[]
  const labels = usePlotStore((s) => s.labels)
  const folders = usePlotStore((s) => s.folders)
  const viewState = usePlotStore((s) => s.viewStateByContext[contextKey]) ?? buildViewStateForContext(contextKey)
  const searchQuery = usePlotStore((s) => s.searchQuery)
  const setViewState = usePlotStore((s) => s.setViewState)

  const labelNames = useMemo(() => {
    const m = new Map<string, string>()
    for (const l of labels) m.set(l.id, l.name)
    return m
  }, [labels])
  const folderNames = useMemo(() => {
    const m = new Map<string, string>()
    for (const f of folders) m.set(f.id, f.name)
    return m
  }, [folders])

  // Stage 0: drop trashed templates (templates context has no route slice,
  // but trashed templates are surfaced via /trash sub-tab, not here).
  const active = useMemo(() => templates.filter((t) => !t.trashed), [templates])
  const totalCount = active.length

  // Stage 1: user filters
  const filtered = useMemo(
    () => applyTemplateFilters(active, viewState.filters),
    [active, viewState.filters],
  )

  // Stage 2: search
  const searched = useMemo(
    () => applyTemplateSearch(filtered, searchQuery),
    [filtered, searchQuery],
  )

  // Stage 3: sort (pinned-first then sortFields)
  const sorted = useMemo(
    () => applyTemplateSort(searched, viewState.sortFields),
    [searched, viewState.sortFields],
  )

  // Stage 4: group
  const groups = useMemo(
    () => applyTemplateGrouping(sorted, viewState.groupBy, { labelNames, folderNames }),
    [sorted, viewState.groupBy, labelNames, folderNames],
  )

  const updateViewState = useCallback(
    (patch: Partial<ViewState>) => setViewState(contextKey, patch),
    [setViewState, contextKey],
  )

  return {
    groups,
    flatTemplates: sorted,
    flatCount: sorted.length,
    totalCount,
    viewState,
    updateViewState,
  }
}
