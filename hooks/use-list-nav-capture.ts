"use client"

/**
 * useListNavCapture — capture helper for list / board / grid views.
 *
 * Returns a `capture(orderedIds, openedId, label)` callback that FREEZES the
 * screen's visible-ordered IDs into the current pane's `listNavContext`. Call
 * it immediately before opening the entity (openNote / onOpenArticle) so the
 * editor can offer "← {label} N/M →".
 *
 * The originating route + active filter (folder / tag / label / view) are
 * captured here so the back button restores the exact screen. The label is
 * supplied by the caller (it owns the ViewHeader title). The flat ordered ID
 * array is also caller-supplied — each view knows its own render order
 * (use `flattenNoteGroupIds` / `flattenWikiGroupIds` for board/grouped).
 *
 * Pane-aware: route is read from the matching pane (primary vs secondary).
 * Folder/tag/label/view filters are global (primary) — secondary-pane filter
 * restore is best-effort.
 *
 * Spec: docs/01-plan/features/list-context-navigation.plan.md §3.
 */

import { useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { usePane } from "@/components/workspace/pane-context"
import {
  useActiveRoute,
  useActiveFolderId,
  useActiveTagId,
  useActiveLabelId,
  useActiveViewId,
  useSecondaryRoute,
} from "@/lib/table-route"

export function useListNavCapture(space: "notes" | "wiki") {
  const pane = usePane()
  const setListNavContext = usePlotStore((s) => s.setListNavContext)
  const primaryRoute = useActiveRoute()
  const secondaryRoute = useSecondaryRoute()
  const folderId = useActiveFolderId()
  const tagId = useActiveTagId()
  const labelId = useActiveLabelId()
  const viewId = useActiveViewId()

  const route = pane === "secondary" ? secondaryRoute : primaryRoute
  const fallbackRoute = space === "wiki" ? "/wiki" : "/notes"

  return useCallback(
    (orderedIds: string[], openedId: string, label: string) => {
      const index = orderedIds.indexOf(openedId)
      if (index < 0 || orderedIds.length === 0) {
        // Opened entity isn't in the visible set (shouldn't happen) — clear so
        // a stale snapshot doesn't linger.
        setListNavContext(pane, null)
        return
      }
      setListNavContext(pane, {
        space,
        ids: orderedIds,
        index,
        label,
        backRoute: route ?? fallbackRoute,
        backFolderId: folderId,
        backTagId: tagId,
        backLabelId: labelId,
        backViewId: viewId,
      })
    },
    [pane, setListNavContext, space, route, fallbackRoute, folderId, tagId, labelId, viewId],
  )
}
