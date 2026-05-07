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
 * Design decision (PR group-c-d-5):
 *   - Attachment is a **media entity** (type: "image" | "url" | "file").
 *   - Like References, the hook accepts a **pre-filtered** Attachment[] from
 *     the caller. FilesView keeps its existing local filter (all / image /
 *     document) — multi-state radio doesn't fit `viewState.toggles` (boolean
 *     record). Future PR can lift it into `viewState.filters`.
 *   - The hook owns **sort + group + viewState persist** only.
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
 * Files-list pipeline hook. Wraps sort/group stages with staged useMemo
 * (mirrors useTagsView / useLabelsView / useStickersView / useReferencesView).
 *
 * `contextKey` is locked to "files" — passing it explicitly keeps the call
 * site consistent with sibling hooks.
 *
 * Caller passes a pre-filtered `Attachment[]` (after applying local
 * type filter: all / image / document). The hook handles sort + group
 * + viewState persist.
 */
export function useFilesView(
  filteredAttachments: Attachment[],
  contextKey: ViewContextKey = "files",
): UseFilesViewResult {
  const viewState = usePlotStore((s) => s.viewStateByContext[contextKey]) ?? buildViewStateForContext(contextKey)
  const isHydrated = usePlotStore((s) => s._viewStateHydrated)
  const setViewState = usePlotStore((s) => s.setViewState)

  // Stage 1: sort
  const sorted = useMemo(
    () => applyFileSort(filteredAttachments, viewState),
    [filteredAttachments, viewState],
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
    totalCount: filteredAttachments.length,
    viewState,
    updateViewState,
    isHydrated,
  }
}
