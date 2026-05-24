import type { WikiArticle } from "./types"

/**
 * A WikiArticle is a "stub" if the user hasn't modified it from the default template.
 * Default template = 3 section blocks + 1 empty text block = 4 blocks total.
 * Stub if: block count <= 4 AND all text blocks have empty content.
 */
const DEFAULT_BLOCK_COUNT = 4

export function isWikiStub(article: WikiArticle): boolean {
  // blocks=[] means not yet loaded from IDB — don't treat as stub
  if (article.blocks.length === 0) return false
  if (article.blocks.length > DEFAULT_BLOCK_COUNT) return false
  const textBlocks = article.blocks.filter((b) => b.type === "text")
  if (textBlocks.length === 0) return true // no text blocks = only section headers = stub
  return textBlocks.every((b) => !b.content?.trim())
}

/* ── Timeline planning (2026-05-20) ────────────────────────
 * Shared helpers for the bars-first WikiTimelineView. Kept in `wiki-utils.ts`
 * (not the view component) because the same horizon rule will likely surface
 * in future Smart Book chapter ordering / dashboard "Up next" surfaces. */

/** Parse an ISO string into a Date, returning null on any invalid input.
 *  Matches the WikiTimelineView's `safeDate` invariant — every consumer
 *  must guard NaN epochs (영구 룰: lookup map null guard). */
export function safeDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d
}

/**
 * Horizon = the right end of an article's timeline bar (design §3.2).
 *
 * Precedence (D3, plannedDate always wins):
 *   1. `plannedDate` — explicit intent. Even when `updatedAt > plannedDate`,
 *      this stays the horizon (overrun is currently NOT visualized; future
 *      Phase may add bar-internal styling).
 *   2. `updatedAt`   — real activity fallback.
 *   3. `createdAt`   — last-resort (returns a near-0-width bar, MIN_BAR_WIDTH
 *      kicks in at the renderer).
 *
 * Phase 1b2 (unified-temporal-hooks-prd v0.2): `plannedDate` is now passed
 * in by the caller (resolved from the `hooks` slice via
 * `getPlannedDateForWiki`). Article.plannedDate is being retired — Phase 1b3
 * drops it entirely. Pass `null` when no plan hook exists.
 *
 * If `createdAt` itself fails to parse the article is dropped upstream
 * (see WikiTimelineView's `validArticles` filter).
 */
export function getHorizon(article: WikiArticle, plannedDate: string | null = null): Date | null {
  const planned = safeDate(plannedDate)
  if (planned) return planned
  const updated = safeDate(article.updatedAt)
  if (updated) return updated
  return safeDate(article.createdAt)
}

/** Source of the horizon date — used by the timeline renderer to visually
 *  differentiate "user-planned" (dashed right edge) vs "auto fallback" (solid).
 *  Does NOT change `getHorizon()` return value — pure metadata.
 *  Callers that only need the date should keep using `getHorizon()`. */
export type HorizonSource = "planned" | "updated" | "created"

/** Returns which field drives the horizon for an article (D2 visual split). */
export function getHorizonSource(article: WikiArticle, plannedDate: string | null = null): HorizonSource {
  if (safeDate(plannedDate)) return "planned"
  if (safeDate(article.updatedAt)) return "updated"
  return "created"
}
