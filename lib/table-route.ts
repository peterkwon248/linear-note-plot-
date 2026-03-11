/**
 * Lightweight external store for instant sidebar route switching.
 * Updates synchronously (no Next.js navigation delay).
 * Components subscribe via useSyncExternalStore.
 */

import { useSyncExternalStore } from "react"

/* ── Route constants ─────────────────────────────────── */

/** Routes handled by NotesTableView (always-mounted table component) */
export const TABLE_VIEW_ROUTES = ["/notes", "/pinned", "/trash"]

/** Routes handled by individual always-mounted view components */
export const VIEW_ROUTES = ["/inbox", "/activity"]

/** All routes that use instant switching (always-mounted in layout) */
export const ALL_SIDEBAR_ROUTES = [...TABLE_VIEW_ROUTES, ...VIEW_ROUTES]

/* ── Store ───────────────────────────────────────────── */

let _listeners: Array<() => void> = []
let _activeRoute: string | null = null
let _activeFolderId: string | null = null

export function getActiveRoute(): string | null {
  return _activeRoute
}

export function setActiveRoute(route: string | null): void {
  if (_activeRoute === route) return
  _activeRoute = route
  _listeners.forEach((fn) => fn())
}

export function getActiveFolderId(): string | null {
  return _activeFolderId
}

export function setActiveFolderId(folderId: string | null): void {
  if (_activeFolderId === folderId) return
  _activeFolderId = folderId
  _listeners.forEach((fn) => fn())
}

export function subscribeActiveRoute(fn: () => void): () => void {
  _listeners.push(fn)
  return () => {
    _listeners = _listeners.filter((f) => f !== fn)
  }
}

/** Initialize from pathname (e.g., on page load or popstate). */
export function syncFromPathname(pathname: string): void {
  if (ALL_SIDEBAR_ROUTES.includes(pathname)) {
    setActiveRoute(pathname)
  } else {
    setActiveRoute(null)
  }
}

/* ── React hook ──────────────────────────────────────── */

/** Subscribe to the active sidebar route. Returns null for fallback routes. */
export function useActiveRoute(): string | null {
  return useSyncExternalStore(subscribeActiveRoute, getActiveRoute, () => null)
}

/** Subscribe to the active folder ID. Returns null when no folder is selected. */
export function useActiveFolderId(): string | null {
  return useSyncExternalStore(subscribeActiveRoute, getActiveFolderId, () => null)
}
