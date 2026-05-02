/**
 * Helper hook for ViewHeader's Save view button (Linear-style snapshot UX).
 *
 * Returns the right `saveViewMode` + `onSaveView` props for any view that
 * exposes ViewHeader. Resolves automatically:
 *  - No active view → "save-as" (button opens name-input popover)
 *  - Active view + dirty → "update" (button overwrites saved viewState)
 *  - Active view + clean → "clean" (button hidden)
 *
 * Each view's caller passes its ViewContextKey + SavedView.space so that:
 *  - The right viewState slice is read for dirty detection
 *  - createSavedView gets the right space tag (so the new view appears in the
 *    correct sidebar section)
 */

import { useCallback, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { useActiveViewId, setActiveViewId } from "@/lib/table-route"
import type { ViewContextKey } from "./types"
import type { SavedView } from "../types"
import { viewStateEquals } from "./saved-view-context"

type SaveViewMode = "save-as" | "update" | "clean"

export interface UseSaveViewPropsResult {
  saveViewMode: SaveViewMode
  onSaveView: (name?: string) => void
}

export function useSaveViewProps(
  contextKey: ViewContextKey,
  space: SavedView["space"],
): UseSaveViewPropsResult {
  const activeViewId = useActiveViewId()
  const savedViews = usePlotStore((s) => s.savedViews)
  const viewStateByContext = usePlotStore((s) => s.viewStateByContext)
  const createSavedView = usePlotStore((s) => s.createSavedView)
  const updateSavedView = usePlotStore((s) => s.updateSavedView)

  const activeView = useMemo(
    () => (activeViewId ? savedViews.find((v) => v.id === activeViewId) ?? null : null),
    [activeViewId, savedViews],
  )

  const currentViewState = viewStateByContext[contextKey]

  const saveViewMode: SaveViewMode = useMemo(() => {
    if (!activeView) return "save-as"
    return viewStateEquals(currentViewState as any, activeView.viewState as any) ? "clean" : "update"
  }, [activeView, currentViewState])

  const onSaveView = useCallback(
    (name?: string) => {
      if (saveViewMode === "update" && activeView) {
        updateSavedView(activeView.id, { viewState: currentViewState as any })
      } else if (saveViewMode === "save-as") {
        const trimmed = (name ?? "").trim()
        if (!trimmed) return
        const id = createSavedView(trimmed, currentViewState as any, space)
        // Auto-activate the freshly saved view so subsequent edits are tracked
        if (id) setActiveViewId(id)
      }
    },
    [saveViewMode, activeView, currentViewState, space, createSavedView, updateSavedView],
  )

  return { saveViewMode, onSaveView }
}
