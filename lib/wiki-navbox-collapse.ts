/**
 * Per-article + per-navbox + per-group collapse state.
 *
 * Mirrors the `wiki-infobox-collapse` pattern but scoped to navbox blocks.
 * UI-only ephemeral state kept in localStorage so two tabs viewing different
 * articles don't collide and so it doesn't bloat the Zustand persist payload.
 *
 * Key shape (group):  plot.navbox-collapsed.{articleId}.{blockId}.{groupId}
 * Key shape (whole):  plot.navbox-collapsed.{articleId}.{blockId}.__all__
 */

import { useCallback, useEffect, useState } from "react"

const PREFIX = "plot.navbox-collapsed"

function makeGroupKey(articleId: string, blockId: string, groupId: string): string {
  return `${PREFIX}.${articleId}.${blockId}.${groupId}`
}

function makeBlockKey(articleId: string, blockId: string): string {
  return `${PREFIX}.${articleId}.${blockId}.__all__`
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
 * Hook: collapsed state for a single navbox group (articleId, blockId, groupId).
 *
 * - Initial render returns `defaultCollapsed` (avoids SSR mismatch).
 * - useEffect reads localStorage and overrides when present.
 * - Toggle persists immediately.
 */
export function useNavboxGroupCollapsed(
  articleId: string,
  blockId: string,
  groupId: string,
  defaultCollapsed = false,
): [boolean, (next?: boolean) => void] {
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed)

  useEffect(() => {
    const stored = safeRead(makeGroupKey(articleId, blockId, groupId))
    if (stored !== null) {
      setCollapsed(stored)
    } else {
      setCollapsed(defaultCollapsed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, blockId, groupId])

  const toggle = useCallback(
    (next?: boolean) => {
      setCollapsed((prev) => {
        const value = typeof next === "boolean" ? next : !prev
        safeWrite(makeGroupKey(articleId, blockId, groupId), value)
        return value
      })
    },
    [articleId, blockId, groupId],
  )

  return [collapsed, toggle]
}

/**
 * Hook: collapsed state for the WHOLE navbox (the outer "[펼치기·접기]" toggle).
 */
export function useNavboxBlockCollapsed(
  articleId: string,
  blockId: string,
  defaultCollapsed = false,
): [boolean, (next?: boolean) => void] {
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed)

  useEffect(() => {
    const stored = safeRead(makeBlockKey(articleId, blockId))
    if (stored !== null) {
      setCollapsed(stored)
    } else {
      setCollapsed(defaultCollapsed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, blockId])

  const toggle = useCallback(
    (next?: boolean) => {
      setCollapsed((prev) => {
        const value = typeof next === "boolean" ? next : !prev
        safeWrite(makeBlockKey(articleId, blockId), value)
        return value
      })
    },
    [articleId, blockId],
  )

  return [collapsed, toggle]
}
