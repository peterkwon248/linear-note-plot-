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
 *
 * Cross-instance sync (PR-A follow-up): both GroupHeaderRow (toggles) and
 * sibling FieldRows (read-only) call this hook with the same key. Without
 * coordination each useState lives in its own closure, so toggling the header
 * only flipped the chevron while the field rows kept showing — the user saw
 * "toggle doesn't work." The module-level `stateCache` + `listeners` map make
 * the key the single source of truth, broadcasting toggles to every subscriber.
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

// ── In-memory single-source-of-truth + pubsub ──────────────────────────────
// Same key → shared cache entry + shared listener set. Toggling any instance
// updates the cache and synchronously notifies every other instance.

const stateCache = new Map<string, boolean>()
const listeners = new Map<string, Set<(v: boolean) => void>>()

function subscribe(key: string, fn: (v: boolean) => void): () => void {
  let set = listeners.get(key)
  if (!set) {
    set = new Set()
    listeners.set(key, set)
  }
  set.add(fn)
  return () => {
    set!.delete(fn)
    if (set!.size === 0) listeners.delete(key)
  }
}

function publish(key: string, value: boolean): void {
  stateCache.set(key, value)
  const set = listeners.get(key)
  if (set) {
    for (const fn of set) fn(value)
  }
}

/**
 * Test-only reset hook — clears the in-memory cache + listeners between
 * tests. Not exported from a public surface; vitest imports it directly.
 */
export function __resetInfoboxCollapseCache(): void {
  stateCache.clear()
  listeners.clear()
}

/**
 * Hook: collapsed state for a single (articleId, groupKey) pair.
 *
 * - Initial render returns the cached value if present, else `defaultCollapsed`
 *   (avoids SSR mismatch — cache is empty on the server).
 * - useEffect hydrates the cache from localStorage on first encounter of a key,
 *   then subscribes the local setter so subsequent toggles from any instance
 *   propagate here.
 * - `toggle` writes localStorage + publishes — both this instance and every
 *   sibling instance with the same key re-render in the same React batch.
 */
export function useInfoboxGroupCollapsed(
  articleId: string,
  groupKey: string,
  defaultCollapsed = false,
): [boolean, (next?: boolean) => void] {
  const key = makeKey(articleId, groupKey)
  const [collapsed, setCollapsed] = useState<boolean>(() =>
    stateCache.has(key) ? stateCache.get(key)! : defaultCollapsed,
  )

  useEffect(() => {
    // Hydrate cache from localStorage on first encounter of this key.
    if (!stateCache.has(key)) {
      const stored = safeRead(key)
      stateCache.set(key, stored ?? defaultCollapsed)
    }
    setCollapsed(stateCache.get(key)!)
    return subscribe(key, setCollapsed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const toggle = useCallback(
    (next?: boolean) => {
      const prev = stateCache.get(key) ?? defaultCollapsed
      const value = typeof next === "boolean" ? next : !prev
      safeWrite(key, value)
      publish(key, value)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )

  return [collapsed, toggle]
}
