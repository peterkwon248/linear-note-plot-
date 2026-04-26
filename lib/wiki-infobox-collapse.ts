/**
 * Per-article + per-group infobox collapse state.
 *
 * Stored in localStorage (NOT Zustand) — UI-only ephemeral state, not worth
 * polluting the store + persist layer. Keys are scoped by article id, so two
 * tabs viewing different articles don't collide.
 *
 * Key shape:  plot.infobox-collapsed.{articleId}.{groupKey}
 *
 * SSR safety: lazy initialization inside useEffect — never read localStorage
 * during render. First paint reflects `defaultCollapsed`, subsequent paints
 * reflect persisted state.
 */

import { useCallback, useEffect, useState } from "react"

const PREFIX = "plot.infobox-collapsed"

function makeKey(articleId: string, groupKey: string): string {
  return `${PREFIX}.${articleId}.${groupKey}`
}

function safeRead(key: string): boolean | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return null
    return raw === "1"
  } catch {
    return null
  }
}

function safeWrite(key: string, value: boolean): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, value ? "1" : "0")
  } catch {
    // ignore quota / privacy mode
  }
}

/**
 * Hook: collapsed state for a single (articleId, groupKey) pair.
 *
 * - Initial render returns `defaultCollapsed` (avoids SSR mismatch).
 * - useEffect reads localStorage and overrides when present.
 * - Toggle persists immediately.
 */
export function useInfoboxGroupCollapsed(
  articleId: string,
  groupKey: string,
  defaultCollapsed = false,
): [boolean, (next?: boolean) => void] {
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed)

  // Hydrate from localStorage after mount.
  useEffect(() => {
    const stored = safeRead(makeKey(articleId, groupKey))
    if (stored !== null) {
      setCollapsed(stored)
    } else {
      setCollapsed(defaultCollapsed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, groupKey])

  const toggle = useCallback(
    (next?: boolean) => {
      setCollapsed((prev) => {
        const value = typeof next === "boolean" ? next : !prev
        safeWrite(makeKey(articleId, groupKey), value)
        return value
      })
    },
    [articleId, groupKey],
  )

  return [collapsed, toggle]
}
