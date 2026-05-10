"use client"

/**
 * useEffectiveViewMode — viewport-aware view mode resolver (split-mode-prd §5).
 *
 * Returns the *effective* viewMode for a given context. When the persisted
 * viewMode is "dual" but the viewport is too narrow (< 1200px), falls back
 * to "list" automatically per LOCKED #4. The persisted preference is preserved
 * — when the viewport widens again, dual mode resumes.
 *
 * SSR-safe: pre-mount returns the persisted mode (no hydration mismatch).
 * Toast fires only on transitions (narrow ↔ wide), not every resize event,
 * with a 200ms debounce to avoid spam during drag.
 *
 * Implements CRITIC MEDIUM-4 (SSR-safe mount guard) + MEDIUM-6 (transition-only
 * debounced toast).
 */

import { useEffect, useState, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import { usePane } from "@/components/workspace/pane-context"
import { toast } from "sonner"
import type { ViewContextKey, ViewMode } from "@/lib/view-engine/types"

const FALLBACK_THRESHOLD = 1200

export function useEffectiveViewMode(contextKey: ViewContextKey): ViewMode {
  const persistedMode = (usePlotStore(
    (s) => s.viewStateByContext[contextKey]?.viewMode,
  ) ?? "list") as ViewMode
  const pane = usePane()
  // PRD §LOCKED #9: secondary pane (⌘\) forces non-dual (primary-only MVP).
  // Dual = list+editor 통합 viewport, secondary는 단일 entity detail용.
  const viewMode: ViewMode =
    pane === "secondary" && persistedMode === "dual" ? "list" : persistedMode

  const [mounted, setMounted] = useState(false)
  const [isNarrow, setIsNarrow] = useState(false)
  const wasNarrowRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMounted(true)

    const checkNarrow = () => {
      const narrow = window.innerWidth < FALLBACK_THRESHOLD
      setIsNarrow(narrow)
      // Toast only on transitions, debounced to avoid spam during drag.
      // Skip when viewMode isn't "dual" — no fallback to announce.
      if (viewMode !== "dual") return
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        if (narrow !== wasNarrowRef.current) {
          if (narrow) {
            toast("Viewport too narrow — falling back to list mode", { duration: 3000 })
          } else {
            toast("Dual mode resumed", { duration: 2000 })
          }
          wasNarrowRef.current = narrow
        }
      }, 200)
    }

    checkNarrow()
    window.addEventListener("resize", checkNarrow)
    return () => {
      window.removeEventListener("resize", checkNarrow)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [viewMode])

  // Pre-mount: return persisted mode (SSR-safe, no hydration mismatch).
  if (!mounted) return viewMode
  // Post-mount: apply viewport fallback.
  if (viewMode === "dual" && isNarrow) return "list"
  return viewMode
}
