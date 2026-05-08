/**
 * v3 Note adapter helpers — bridge mockup dummy fields to Plot Note shape.
 *
 * The v3 mockups (see `docs/v3-mockup/plot-v3-unified-modes.jsx`) reference
 * decorative fields that do not exist on Plot's `Note` type: `note.hue`,
 * `note.spread`, `note.excerpt`, `note.wordCount`, `note.tracks`. Rather than
 * mutate the domain model, we synthesize them from existing Plot data.
 *
 * Determinism is the key contract: the same `noteId` must always map to the
 * same hue/spread/segments, so views do not "rewrite" themselves between
 * renders.
 */

import type { Note } from "@/lib/types"
import type { SRSState } from "@/lib/srs"

/**
 * Mockup `note.hue` replacement. Stable hash of the `noteId` mapped to a hue
 * in the [0, 360) range. Used by gallery cover gradients so each card is
 * uniquely tinted but never shifts between sessions.
 */
export function getHueFromNoteId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return ((h % 360) + 360) % 360
}

/**
 * Mockup `.u-card__cover` gradient — verbatim from
 * `docs/v3-mockup/plot-v3-unified-modes.jsx:46`.
 *
 *   linear-gradient(135deg,
 *     oklch(72% 0.13 H) 0%,
 *     oklch(58% 0.16 (H+25)) 100%)
 *
 * Two-stop oklch keeps the gradient perceptually balanced regardless of hue.
 */
export function getCoverGradient(hue: number): string {
  const h2 = (hue + 25) % 360
  return `linear-gradient(135deg, oklch(72% 0.13 ${hue}) 0%, oklch(58% 0.16 ${h2}) 100%)`
}

/**
 * Mockup `note.excerpt` replacement. Prefer the curated `summary` (Q10
 * decision) and fall back to the auto-generated `preview` when no summary
 * exists. Returning `""` is intentional — the gallery card simply collapses
 * the line-clamped paragraph to zero height.
 */
export function getExcerpt(note: Note): string {
  return note.summary ?? note.preview ?? ""
}

/**
 * Mockup `note.spread` replacement. Drives `.u-card[data-spread="..."]` to
 * vary cover heights (`tall` = 132px, `wide` = 72px, `normal` = 92px) so the
 * gallery grid feels editorial rather than uniform. Deterministic 6-bucket
 * hash skews ~67% to "normal" so the variation reads as accent, not chaos.
 */
export function getSpread(id: string): "normal" | "wide" | "tall" {
  const h = id.charCodeAt(0) + (id.charCodeAt(1) || 0)
  const r = h % 6
  if (r === 0) return "wide"
  if (r === 1) return "tall"
  return "normal"
}

/**
 * Word-count estimate for the gallery card footer. Uses `preview` (always
 * populated, ~120 chars of plaintext) as a cheap signal — exact word count
 * would require the full note body from IDB, which the gallery should not
 * load synchronously.
 */
export function getWordCount(note: Note): number {
  const text = note.preview ?? ""
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Studio mode 4-segment fill values (0-1) — Q12 LOCKED.
 *
 * Mockup `note.tracks` replacement. The Studio rail track is split into 4
 * segments; the mockup hard-codes them (e.g. `[1, 0.7, 0.4, 0]`) for visual
 * texture. Plot derives them from the note's SRS state so the rail track
 * actually carries information:
 *
 *   seg 0 — step:        SRS step / 6           (learning maturity)
 *   seg 1 — accuracy:    1 - lapses / (step+lapses+1)
 *   seg 2 — dueness:     elapsed / interval     (how due is the next review)
 *   seg 3 — engagement:  (step+1) / 4           (capped, more reviews = fuller)
 *
 * Notes without an SRS entry (most of Plot — only Keystone notes auto-enter
 * SRS) fall back to a stable noteId hash so the rail still has a visual
 * fingerprint. The hash is purely decorative and never mistaken for SRS.
 */
export function getStudioSegments(
  noteId: string,
  srs?: SRSState | null,
): [number, number, number, number] {
  if (srs) {
    const step = Math.min(srs.step / 6, 1)
    const accuracy =
      srs.lapses === 0 ? 1 : Math.max(0, 1 - srs.lapses / (srs.step + srs.lapses + 1))
    const lastMs = new Date(srs.lastReviewedAt).getTime()
    const dueMs = new Date(srs.dueAt).getTime()
    const intervalMs = dueMs - lastMs
    const ageMs = Date.now() - lastMs
    const dueness =
      Number.isFinite(intervalMs) && intervalMs > 0
        ? Math.max(0, Math.min(ageMs / intervalMs, 1))
        : 0
    const engagement = Math.min((srs.step + 1) / 4, 1)
    return [step, accuracy, dueness, engagement]
  }
  // Fallback: stable hash → 4 deterministic decorative bytes.
  let h = 0
  for (let i = 0; i < noteId.length; i++) {
    h = (h * 31 + noteId.charCodeAt(i)) | 0
  }
  return [
    (h & 0xff) / 255,
    ((h >> 8) & 0xff) / 255,
    ((h >> 16) & 0xff) / 255,
    ((h >> 24) & 0xff) / 255,
  ]
}

/**
 * Round a 0..1 fill value to one decimal so it matches the mockup's
 * `data-fill="0|0.3|0.4|...|1"` selectors verbatim. Anything below 0.3 snaps
 * to "0" because the mockup CSS only defines visual stops at 0, 0.3, 0.4,
 * 0.5, 0.6, 0.7, 0.8, 0.9, 1.
 */
export function roundFillTo01(v: number): string {
  if (!Number.isFinite(v) || v <= 0) return "0"
  if (v >= 1) return "1"
  const r = Math.round(v * 10) / 10
  if (r < 0.3) return "0"
  return r.toFixed(1)
}

/**
 * Editorial-mode subtitle (Q10 LOCKED).
 *
 * The mockup's editorial deck (`<p className="u-edit__deck">`) renders a
 * curated subtitle. Plot maps that to `note.summary` first — a user-authored
 * summary line — and falls back to the auto-generated `preview` when no
 * summary exists. Empty string is intentional: the deck collapses to zero
 * height rather than being rendered as a stub.
 *
 * `getExcerpt` already does the same fallback for gallery cards, but we keep
 * `getSubtitle` as a separate name for editorial readability — the call site
 * (deck vs card excerpt) carries different semantics even when the value
 * matches today.
 */
export function getSubtitle(note: Note): string {
  return note.summary ?? note.preview ?? ""
}

/**
 * Editorial-mode body extraction (Q5 LOCKED).
 *
 * The mockup's `<div className="u-edit__body">` renders multiple paragraphs.
 * Plot derives them at render-time from the TipTap doc JSON rather than
 * persisting a denormalized "body" array on `Note`. Walking the doc tree:
 *   1. Recurse into `content[]` arrays.
 *   2. Stop at `paragraph` nodes — flatten their inline children into a
 *      single string (text marks, hard breaks → space).
 *   3. Skip empty paragraphs (whitespace-only); they exist as TipTap
 *      structural padding and would create empty `<p/>` in the spread.
 *
 * Returns up to `maxCount` non-empty paragraphs. The default of 4 matches
 * the mockup spread density — more than that and the two-column body starts
 * to overflow on common viewports. Schema-free: passing `null` /
 * `undefined` / non-doc objects returns `[]`.
 */
export function extractParagraphs(
  contentJson: Record<string, unknown> | null | undefined,
  maxCount = 4,
): string[] {
  if (!contentJson || typeof contentJson !== "object") return []
  const paragraphs: string[] = []

  function walk(node: unknown): void {
    if (!node || typeof node !== "object") return
    const n = node as { type?: string; content?: unknown[]; text?: string }

    // Paragraph leaf — flatten inline children, then stop recursing.
    if (n.type === "paragraph") {
      if (Array.isArray(n.content)) {
        const text = n.content
          .map((c) => {
            if (c && typeof c === "object" && "text" in c) {
              return String((c as { text: unknown }).text ?? "")
            }
            return ""
          })
          .join("")
          .trim()
        if (text.length > 0) paragraphs.push(text)
      }
      return
    }

    // Container — recurse into children.
    if (Array.isArray(n.content)) {
      for (const child of n.content) {
        if (paragraphs.length >= maxCount) return
        walk(child)
      }
    }
  }

  walk(contentJson)
  return paragraphs.slice(0, maxCount)
}

/**
 * Editorial-mode issue number — decorative.
 *
 * The mockup hardcodes "No. 47" in the issue strip. Plot replaces it with a
 * deterministic hash of the active noteId so each note feels like its own
 * "issue" without the number drifting between renders. Range 1-99 keeps the
 * label visually compact (two digits at most). Pure decoration — the value
 * never affects sort, filter, or persistence.
 */
export function getIssueNumber(noteId: string): string {
  let h = 0
  for (let i = 0; i < noteId.length; i++) {
    h = (h * 31 + noteId.charCodeAt(i)) | 0
  }
  const num = (Math.abs(h) % 99) + 1
  return `No. ${num}`
}
