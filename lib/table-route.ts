/**
 * Lightweight external store for instant sidebar route switching.
 * Updates synchronously (no Next.js navigation delay).
 * Components subscribe via useSyncExternalStore.
 */

import { useSyncExternalStore } from "react"
import type { ActivitySpace } from "./types"

/* ── Route constants ─────────────────────────────────── */

/** Routes handled by NotesTableView (always-mounted table component) */
export const TABLE_VIEW_ROUTES = ["/notes", "/inbox", "/pinned", "/trash"]

/** Workflow routes — for future Phase 4 sidebar refactor */
export const WORKFLOW_ROUTES = ["/inbox", "/capture", "/permanent"]

/** Routes handled by individual always-mounted view components */
export const VIEW_ROUTES = ["/tags", "/labels", "/templates", "/ontology", "/insights", "/wiki", "/search", "/calendar"]

/** All routes that use instant switching (always-mounted in layout) */
export const ALL_SIDEBAR_ROUTES = [...TABLE_VIEW_ROUTES, ...VIEW_ROUTES]

/** Default route per activity space */
export const DEFAULT_ROUTES: Record<ActivitySpace, string> = {
  inbox: "/inbox",
  notes: "/notes",
  wiki: "/wiki",
  calendar: "/calendar",
  ontology: "/ontology",
}

/* ── Store ───────────────────────────────────────────── */

let _listeners: Array<() => void> = []
let _activeRoute: string | null = null
let _activeSpace: ActivitySpace = "notes"
let _activeFolderId: string | null = null
let _activeTagId: string | null = null
let _activeLabelId: string | null = null

/** Infer which activity space a route belongs to */
export function inferSpace(route: string): ActivitySpace {
  if (route === "/inbox") return "inbox"
  if (route === "/wiki") return "wiki"
  if (route.startsWith("/calendar")) return "calendar"
  if (route === "/ontology") return "ontology"
  // /notes, /tags, /labels, /templates, /insights, /capture, /permanent, /trash, /pinned, /search
  return "notes"
}

export function getActiveRoute(): string | null {
  return _activeRoute
}

export function setActiveRoute(route: string | null): void {
  if (_activeRoute === route) return
  _activeRoute = route
  // Auto-infer space from route (backward compatible)
  if (route) {
    _activeSpace = inferSpace(route)
  }
  _listeners.forEach((fn) => fn())
}

export function getActiveSpace(): ActivitySpace {
  return _activeSpace
}

export function setActiveSpace(space: ActivitySpace): void {
  if (_activeSpace === space) return
  _activeSpace = space
  _activeRoute = DEFAULT_ROUTES[space]
  _listeners.forEach((fn) => fn())
}

export function getActiveFolderId(): string | null {
  return _activeFolderId
}

export function setActiveFolderId(folderId: string | null): void {
  if (_activeFolderId === folderId) return
  _activeFolderId = folderId
  _activeTagId = null
  _activeLabelId = null
  _listeners.forEach((fn) => fn())
}

export function getActiveTagId(): string | null {
  return _activeTagId
}

export function setActiveTagId(tagId: string | null): void {
  if (_activeTagId === tagId) return
  _activeTagId = tagId
  _activeFolderId = null
  _activeLabelId = null
  _listeners.forEach((fn) => fn())
}

export function getActiveLabelId(): string | null {
  return _activeLabelId
}

export function setActiveLabelId(labelId: string | null): void {
  if (_activeLabelId === labelId) return
  _activeLabelId = labelId
  _activeFolderId = null
  _activeTagId = null
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

/* ── React hooks ──────────────────────────────────────── */

/** Subscribe to the active sidebar route. Returns null for fallback routes. */
export function useActiveRoute(): string | null {
  return useSyncExternalStore(subscribeActiveRoute, getActiveRoute, () => null)
}

/** Subscribe to the active activity space. */
export function useActiveSpace(): ActivitySpace {
  return useSyncExternalStore(subscribeActiveRoute, getActiveSpace, () => "notes" as ActivitySpace)
}

/** Subscribe to the active folder ID. Returns null when no folder is selected. */
export function useActiveFolderId(): string | null {
  return useSyncExternalStore(subscribeActiveRoute, getActiveFolderId, () => null)
}

/** Subscribe to the active tag ID. Returns null when no tag is selected. */
export function useActiveTagId(): string | null {
  return useSyncExternalStore(subscribeActiveRoute, getActiveTagId, () => null)
}

/** Subscribe to the active label ID. Returns null when no label is selected. */
export function useActiveLabelId(): string | null {
  return useSyncExternalStore(subscribeActiveRoute, getActiveLabelId, () => null)
}
