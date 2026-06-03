/**
 * Lightweight external store for instant sidebar route switching.
 * Updates synchronously (no Next.js navigation delay).
 * Components subscribe via useSyncExternalStore.
 */

import { useSyncExternalStore } from "react"
import type { ActivitySpace } from "./types"

/* ── Route constants ─────────────────────────────────── */

/** Routes handled by NotesTableView (always-mounted table component) */
export const TABLE_VIEW_ROUTES = ["/notes", "/backlog", "/todo", "/in-progress", "/done", "/pinned", "/trash"]

/** Workflow routes — for future Phase 4 sidebar refactor */
export const WORKFLOW_ROUTES = ["/backlog", "/todo", "/in-progress", "/done"]

/** Routes handled by individual always-mounted view components */
export const VIEW_ROUTES = ["/home", "/inbox", "/labels", "/library/labels", "/library/categories", "/stickers", "/templates", "/ontology", "/insights", "/wiki", "/wiki/insights", "/search", "/calendar", "/library", "/library/references", "/library/tags", "/library/files", "/books", "/books/smart-books", "/books/insights"]

/** All routes that use instant switching (always-mounted in layout) */
export const ALL_SIDEBAR_ROUTES = [...TABLE_VIEW_ROUTES, ...VIEW_ROUTES]

/** Default route per activity space */
export const DEFAULT_ROUTES: Record<ActivitySpace, string> = {
  home: "/home",
  notes: "/notes",
  wiki: "/wiki",
  calendar: "/calendar",
  ontology: "/ontology",
  library: "/library",
  books: "/books",
}

/* ── Store ───────────────────────────────────────────── */

let _listeners: Array<() => void> = []
let _activeRoute: string | null = null
let _activeSpace: ActivitySpace = "notes"
let _activeFolderId: string | null = null
let _activeTagId: string | null = null
let _activeLabelId: string | null = null
let _activeViewId: string | null = null
let _pendingFilters: import("./view-engine/types").FilterRule[] | null = null

/* ── Route History Stack (global back/forward) ──────── */

let _routeHistory: string[] = []
let _routeHistoryIndex = -1
let _isNavigatingHistory = false // prevent push during goBack/goForward

function _pushRouteHistory(route: string): void {
  if (_isNavigatingHistory) return
  // Don't push duplicate
  if (_routeHistory[_routeHistoryIndex] === route) return
  // Truncate forward history
  _routeHistory = _routeHistory.slice(0, _routeHistoryIndex + 1)
  _routeHistory.push(route)
  _routeHistoryIndex = _routeHistory.length - 1
  // Cap at 50 entries
  if (_routeHistory.length > 50) {
    _routeHistory = _routeHistory.slice(_routeHistory.length - 50)
    _routeHistoryIndex = _routeHistory.length - 1
  }
}

export function routeGoBack(): boolean {
  if (_routeHistoryIndex <= 0) return false
  _isNavigatingHistory = true
  _routeHistoryIndex--
  const route = _routeHistory[_routeHistoryIndex]
  setActiveRoute(route)
  // Sync URL without triggering Next.js navigation (routeToUrl keeps book
  // detail on the pre-rendered /books?book= URL so F5 doesn't hard-load).
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", routeToUrl(route))
  }
  _isNavigatingHistory = false
  return true
}

export function routeGoForward(): boolean {
  if (_routeHistoryIndex >= _routeHistory.length - 1) return false
  _isNavigatingHistory = true
  _routeHistoryIndex++
  const route = _routeHistory[_routeHistoryIndex]
  setActiveRoute(route)
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", routeToUrl(route))
  }
  _isNavigatingHistory = false
  return true
}

/** Infer which activity space a route belongs to */
export function inferSpace(route: string): ActivitySpace {
  if (route === "/home" || route === "/inbox") return "home"
  if (route === "/wiki" || route === "/wiki/templates" || route === "/wiki/insights") return "wiki"
  if (route.startsWith("/calendar")) return "calendar"
  if (route === "/ontology") return "ontology"
  if (route.startsWith("/library")) return "library"
  // Stickers — cross-everything index, lives in Library per 33-design-decisions §8.
  // Routed at /stickers (not /library/stickers) for URL brevity.
  if (route === "/stickers") return "library"
  if (route.startsWith("/books")) return "books"
  // /notes, /backlog, /todo, /in-progress, /done, /tags, /labels, /templates, /insights, /trash, /pinned, /search
  return "notes"
}

export function getActiveRoute(): string | null {
  return _activeRoute
}

/**
 * When true, setActiveRoute calls are redirected to setSecondaryRoute.
 * This is set by PaneProvider when secondary panel views call setActiveRoute.
 */
let _interceptForSecondary = false

export function setRouteInterceptForSecondary(enabled: boolean): void {
  _interceptForSecondary = enabled
}

export function setActiveRoute(route: string | null, spaceHint?: ActivitySpace): void {
  // Intercept: if called from secondary pane context, redirect to secondary route
  if (_interceptForSecondary && route) {
    setSecondaryRoute(route)
    return
  }
  if (_activeRoute === route && (!spaceHint || _activeSpace === spaceHint)) return
  _activeRoute = route
  // Auto-infer space from route (backward compatible)
  if (route) {
    // `/folder/[id]` is cross-kind (a folder can be note | wiki | book), so
    // inferSpace() can't tell which space it belongs to and would wrongly fall
    // back to "notes". Honor an explicit spaceHint (folder page passes
    // folder.kind); otherwise keep the current space so a sidebar folder click
    // stays inside its own context (Books folder → stays in Books, etc.).
    if (spaceHint) {
      _activeSpace = spaceHint
    } else if (!route.startsWith("/folder/")) {
      _activeSpace = inferSpace(route)
    }
    _pushRouteHistory(route)
  }
  _listeners.forEach((fn) => fn())
}

/** Force notify listeners even if route hasn't changed (e.g. closing editor on same route) */
export function forceRouteRefresh(): void {
  _listeners.forEach((fn) => fn())
}

export function getActiveSpace(): ActivitySpace {
  return _activeSpace
}

export function setActiveSpace(space: ActivitySpace): void {
  if (_activeSpace === space) return
  _activeSpace = space
  _activeRoute = DEFAULT_ROUTES[space]
  _pushRouteHistory(_activeRoute)
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
  _activeViewId = null
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
  _activeViewId = null
  _listeners.forEach((fn) => fn())
}

export function getActiveLabelId(): string | null {
  return _activeLabelId
}

export function getActiveViewId(): string | null {
  return _activeViewId
}

export function setActiveLabelId(labelId: string | null): void {
  if (_activeLabelId === labelId) return
  _activeLabelId = labelId
  _activeFolderId = null
  _activeTagId = null
  _activeViewId = null
  _listeners.forEach((fn) => fn())
}

export function setActiveViewId(viewId: string | null): void {
  if (_activeViewId === viewId) return
  _activeViewId = viewId
  _activeFolderId = null
  _activeTagId = null
  _activeLabelId = null
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
  // Book detail deep-link / F5: the URL is `/books?book={id}` (a query on the
  // pre-rendered /books page — see routeToUrl). Restore the detail route so a
  // hard-load lands on the book, not the grid.
  if (pathname === "/books" && typeof window !== "undefined") {
    const bookId = new URLSearchParams(window.location.search).get("book")
    if (bookId) {
      setActiveRoute(`/books/${bookId}`)
      return
    }
  }
  if (ALL_SIDEBAR_ROUTES.includes(pathname)) {
    setActiveRoute(pathname)
  } else if (pathname.startsWith("/books/")) {
    // Legacy path-form deep link (/books/{id}, pre-2026-06-03). Still resolved
    // for backward compat; new navigations use the /books?book= query form.
    setActiveRoute(pathname)
  } else {
    setActiveRoute(null)
  }
}

/**
 * Parse a `/books/{id}` route and return the book id.
 * Returns null when route is `/books` (grid) or any non-book route.
 */
export function getBookIdFromRoute(route: string | null): string | null {
  if (!route || !route.startsWith("/books/")) return null
  const id = route.slice("/books/".length)
  return id.length > 0 ? id : null
}

/**
 * Map an internal route to the address-bar URL. Book detail is represented as a
 * query on the pre-rendered `/books` page (`/books?book={id}`) rather than a
 * path param (`/books/{id}`).
 *
 * Why: the static-export desktop shell (Tauri) has no pre-rendered file for
 * `/books/{id}`, so a real navigation there hard-loads → Tauri's asset handler
 * falls back to the root `index.html` → the layout's start-view effect (which
 * fires at pathname "/") redirects to `/home` = the "Home flash" users hit when
 * opening a book (2026-06-03 report). Keeping the pathname on the pre-rendered
 * `/books` avoids the hard-load entirely and makes F5 / deep-links resolve via
 * syncFromPathname. Mirrors the wiki `/wiki?article=` pattern.
 *
 * Smart-Book (`/books/smart-books`) and Insights (`/books/insights`) are real
 * pre-rendered routes — pass them, and every non-book route, through unchanged.
 */
export function routeToUrl(route: string | null): string {
  if (!route) return "/"
  const bookId = getBookIdFromRoute(route)
  if (bookId && bookId !== "smart-books" && bookId !== "insights") {
    return `/books?book=${bookId}`
  }
  return route
}

/* ── Pending Filters (one-shot injection from Home cards) ── */

export function getPendingFilters(): import("./view-engine/types").FilterRule[] | null {
  return _pendingFilters
}

export function setPendingFilters(filters: import("./view-engine/types").FilterRule[]): void {
  _pendingFilters = filters
  _listeners.forEach((fn) => fn())
}

export function clearPendingFilters(): void {
  _pendingFilters = null
  // Don't notify — consumer already processed
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

/** Subscribe to the active view ID. Returns null when no view is selected. */
export function useActiveViewId(): string | null {
  return useSyncExternalStore(subscribeActiveRoute, getActiveViewId, () => null)
}

/** Subscribe to pending filters (one-shot injection from Home). */
export function usePendingFilters(): import("./view-engine/types").FilterRule[] | null {
  return useSyncExternalStore(subscribeActiveRoute, getPendingFilters, () => null)
}

/* ── Secondary Panel Route (independent from primary) ── */

let _secondaryListeners: Array<() => void> = []
let _secondaryRoute: string | null = null
let _secondarySpace: ActivitySpace | null = null

export function getSecondaryRoute(): string | null { return _secondaryRoute }
export function getSecondarySpace(): ActivitySpace | null { return _secondarySpace }

export function setSecondaryRoute(route: string | null): void {
  if (_secondaryRoute === route) return
  _secondaryRoute = route
  if (route) {
    _secondarySpace = inferSpace(route)
  }
  _secondaryListeners.forEach((fn) => fn())
}

export function setSecondarySpace(space: ActivitySpace): void {
  _secondarySpace = space
  _secondaryRoute = DEFAULT_ROUTES[space]
  _secondaryListeners.forEach((fn) => fn())
}

export function clearSecondaryRoute(): void {
  _secondaryRoute = null
  _secondarySpace = null
  _secondaryListeners.forEach((fn) => fn())
}

function subscribeSecondaryRoute(fn: () => void): () => void {
  _secondaryListeners.push(fn)
  return () => { _secondaryListeners = _secondaryListeners.filter((f) => f !== fn) }
}

export function useSecondaryRoute(): string | null {
  return useSyncExternalStore(subscribeSecondaryRoute, getSecondaryRoute, () => null)
}

export function useSecondarySpace(): ActivitySpace | null {
  return useSyncExternalStore(subscribeSecondaryRoute, getSecondarySpace, () => null)
}
