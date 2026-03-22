/**
 * Lightweight external store for navigating to a specific WikiArticle.
 * Set from anywhere (e.g., note editor "Referenced in" badge),
 * read by WikiView to open the article.
 */

import { useSyncExternalStore } from "react"

let _pendingArticleId: string | null = null
const _listeners = new Set<() => void>()

function notify() {
  for (const fn of _listeners) fn()
}

/** Navigate to a specific WikiArticle by ID. */
export function navigateToWikiArticle(articleId: string) {
  _pendingArticleId = articleId
  notify()
}

/** Consume the pending article ID (returns it and clears). */
export function consumePendingWikiArticle(): string | null {
  const id = _pendingArticleId
  _pendingArticleId = null
  return id
}

/** React hook to subscribe to pending WikiArticle navigation. */
export function usePendingWikiArticle(): string | null {
  return useSyncExternalStore(
    (cb) => { _listeners.add(cb); return () => _listeners.delete(cb) },
    () => _pendingArticleId,
    () => null
  )
}
