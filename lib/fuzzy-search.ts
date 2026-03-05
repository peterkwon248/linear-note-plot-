import Fuse from "fuse.js"
import type { RangeTuple, FuseResultMatch } from "fuse.js"
import type { ReactNode } from "react"
import { createElement } from "react"
import type { Note } from "@/lib/types"

/* ── Fuse Configuration ──────────────────────────────────
 *  threshold 0.35  – tolerant enough for typos/abbreviations
 *                    ("wlc" → "Welcome") while avoiding noisy
 *                    false positives. Slightly above the default
 *                    0.6 aggressiveness → fewer but better matches.
 *  keys             – title weighted 2× over content so title
 *                    matches rank higher naturally.
 *  minMatchCharLength – ignore single-char matches to reduce noise.
 *  includeMatches   – needed for highlight rendering.
 *  includeScore     – needed for sorting by relevance.
 * ──────────────────────────────────────────────────────── */

const FUSE_OPTIONS: Fuse.IFuseOptions<Note> = {
  keys: [
    { name: "title", weight: 2 },
    { name: "content", weight: 1 },
  ],
  includeMatches: true,
  includeScore: true,
  threshold: 0.35,
  minMatchCharLength: 2,
}

/** Create a reusable Fuse instance – wrap with useMemo in components. */
export function createNoteFuse(notes: Note[]): Fuse<Note> {
  return new Fuse(notes, FUSE_OPTIONS)
}

/* ── Result type ─────────────────────────────────────── */

export interface FuzzyNoteResult {
  note: Note
  score: number
  matches: FuseResultMatch[]
}

/** Run fuzzy search and return a typed result array sorted by score. */
export function searchNotes(fuse: Fuse<Note>, query: string): FuzzyNoteResult[] {
  if (!query.trim()) return []
  return fuse.search(query).map((r) => ({
    note: r.item,
    score: r.score ?? 1,
    matches: (r.matches ?? []) as FuseResultMatch[],
  }))
}

/* ── Highlight helper ────────────────────────────────── */

/**
 * Merge and sort Fuse match indices, then wrap matched chars in <mark>.
 * Returns a ReactNode (array of strings and <mark> elements).
 *
 * Handles:
 *  - multiple ranges
 *  - overlapping / adjacent ranges (merged)
 *  - out-of-order indices (sorted first)
 */
export function highlightMatches(
  text: string,
  indices: readonly RangeTuple[] | undefined,
): ReactNode {
  if (!indices || indices.length === 0) return text

  // 1. Sort by start index
  const sorted = [...indices].sort((a, b) => a[0] - b[0])

  // 2. Merge overlapping / adjacent ranges
  const merged: [number, number][] = []
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1]
    if (last && start <= last[1] + 1) {
      // Overlap or adjacent → extend
      last[1] = Math.max(last[1], end)
    } else {
      merged.push([start, end])
    }
  }

  // 3. Build ReactNode array
  const parts: ReactNode[] = []
  let cursor = 0

  for (let i = 0; i < merged.length; i++) {
    const [start, end] = merged[i]
    // Text before match
    if (cursor < start) {
      parts.push(text.slice(cursor, start))
    }
    // Matched text
    parts.push(
      createElement(
        "mark",
        {
          key: `m-${i}`,
          className: "bg-accent/30 text-foreground rounded-sm",
        },
        text.slice(start, end + 1),
      ),
    )
    cursor = end + 1
  }

  // Remaining text after last match
  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }

  return parts
}

/**
 * Convenience: extract title-match indices from a FuzzyNoteResult.
 * Returns undefined when no title match exists (content-only match).
 */
export function getTitleIndices(
  matches: FuseResultMatch[],
): readonly RangeTuple[] | undefined {
  const titleMatch = matches.find((m) => m.key === "title")
  return titleMatch?.indices
}
