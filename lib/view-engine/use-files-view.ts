"use client"

import { useMemo, useCallback } from "react"
import { usePlotStore } from "../store"
import type { ViewState, ViewContextKey } from "./types"
import { buildViewStateForContext } from "./defaults"
import type { Attachment } from "../types"

/**
 * Files-list pipeline result. Mirrors UseTagsViewResult / UseLabelsViewResult /
 * UseStickersViewResult / UseReferencesViewResult shape.
 *
 * Scope guard: deliberately does NOT reuse `applyFilters / applySort /
 * applyGrouping` from the notes pipeline — those are typed against `Note`
 * and would require generic refactoring (=scope creep). Thin files-only
 * implementations live here.
 *
 * Context: `files` (Attachment entity index at /library/files).
 *
 * Design decision (PR group-c-d-5 / Path-A-Step-1 §11.3):
 *   - Attachment is a **media entity** (type: "image" | "url" | "file").
 *   - The hook accepts the raw `Attachment[]` from the caller (pre-trash-filter
 *     only). Filter stage (Section 11.3, Path A Step 1) is now owned by this
 *     hook via `viewState.filters` — same-field OR, cross-field AND, matching
 *     `attachment.type`. Local chip bar in library-view.tsx has been removed.
 *   - The hook owns **filter + sort + group + viewState persist**.
 *   - totalCount = input length (pre-filter); flatCount = post-filter length.
 */
export interface FileGroup {
  key: string
  label: string
  attachments: Attachment[]
}

export interface UseFilesViewResult {
  groups: FileGroup[]
  flatAttachments: Attachment[]
  flatCount: number
  totalCount: number
  viewState: ViewState
  updateViewState: (patch: Partial<ViewState>) => void
  isHydrated: boolean
}

/* ── Stage 0: Filter ─────────────────────────────────── */

/**
 * Thin Attachment-specific filter implementation (Path-A-Step-1).
 * Supports field="type" with operator="eq" (same-field rules are OR'd,
 * cross-field rules are AND'd — matches the notes applyFilters contract).
 * Does NOT import the notes applyFilters (typed against Note, scope creep).
 */
function applyFileFilters(attachments: Attachment[], filters: ViewState["filters"]): Attachment[] {
  if (filters.length === 0) return attachments

  // Group rules by field
  const byField = new Map<string, typeof filters>()
  for (const rule of filters) {
    let bucket = byField.get(rule.field)
    if (!bucket) { bucket = []; byField.set(rule.field, bucket) }
    bucket.push(rule)
  }

  const fieldGroups = Array.from(byField.values())

  return attachments.filter((a) =>
    // AND across fields
    fieldGroups.every((fieldRules) =>
      // OR within same field
      fieldRules.some((rule) => {
        if (rule.field === "type") {
          return rule.operator === "eq"
            ? a.type === rule.value
            : a.type !== rule.value
        }
        // Unknown field — pass-through (safe default)
        return true
      }),
    ),
  )
}

/* ── Stage 1: Sort ────────────────────────────────────── */

function applyFileSort(attachments: Attachment[], viewState: ViewState): Attachment[] {
  if (attachments.length <= 1) return attachments
  const rules = viewState.sortFields.length > 0
    ? viewState.sortFields
    : [{ field: "createdAt" as const, direction: "desc" as const }]

  return [...attachments].sort((a, b) => {
    for (const rule of rules) {
      const dir = rule.direction === "asc" ? 1 : -1
      let r = 0
      switch (rule.field) {
        case "name":
        case "title":
          r = dir * (a.name || "").localeCompare(b.name || "")
          break
        case "fileType":
          r = dir * (a.type || "").localeCompare(b.type || "")
          break
        case "size":
          r = dir * ((a.size || 0) - (b.size || 0))
          break
        case "createdAt":
          r = dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          break
        default:
          r = 0
      }
      if (r !== 0) return r
    }
    return 0
  })
}

/* ── Stage 2: Group ───────────────────────────────────── */

function applyFileGrouping(attachments: Attachment[]): FileGroup[] {
  // Files-list only supports groupBy="none" in PR group-c-d-5.
  // Future PRs can add groupBy="fileType" (image/document/link buckets) —
  // extend this function only.
  return [{ key: "_all", label: "", attachments }]
}

/* ── Hook ──────────────────────────────────────────────── */

/**
 * Files-list pipeline hook. Wraps filter/sort/group stages with staged useMemo
 * (mirrors useTagsView / useLabelsView / useStickersView / useReferencesView).
 *
 * `contextKey` is locked to "files" — passing it explicitly keeps the call
 * site consistent with sibling hooks.
 *
 * Caller passes the raw (pre-trash-filter) `Attachment[]`. The hook handles
 * filter (viewState.filters, Path-A-Step-1) + sort + group + viewState persist.
 * totalCount = input length (pre-filter); flatCount = post-filter length.
 */
export function useFilesView(
  attachments: Attachment[],
  contextKey: ViewContextKey = "files",
): UseFilesViewResult {
  const viewState = usePlotStore((s) => s.viewStateByContext[contextKey]) ?? buildViewStateForContext(contextKey)
  const isHydrated = usePlotStore((s) => s._viewStateHydrated)
  const setViewState = usePlotStore((s) => s.setViewState)

  // Stage 0: filter (type filter via viewState.filters)
  const filtered = useMemo(
    () => applyFileFilters(attachments, viewState.filters),
    [attachments, viewState.filters],
  )

  // Stage 1: sort
  const sorted = useMemo(
    () => applyFileSort(filtered, viewState),
    [filtered, viewState],
  )

  // Stage 2: group (none-only in this PR)
  const groups = useMemo(
    () => applyFileGrouping(sorted),
    [sorted],
  )

  const updateViewState = useCallback(
    (patch: Partial<ViewState>) => setViewState(contextKey, patch),
    [setViewState, contextKey],
  )

  return {
    groups,
    flatAttachments: sorted,
    flatCount: sorted.length,
    totalCount: attachments.length,
    viewState,
    updateViewState,
    isHydrated,
  }
}
