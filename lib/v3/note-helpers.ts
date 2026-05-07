/**
 * v3 Note adapter helpers — bridge mockup dummy fields to Plot Note shape.
 *
 * The v3 mockups (see `docs/v3-mockup/plot-v3-unified-modes.jsx`) reference
 * decorative fields that do not exist on Plot's `Note` type: `note.hue`,
 * `note.spread`, `note.excerpt`, `note.wordCount`. Rather than mutate the
 * domain model, we synthesize them from existing Plot data.
 *
 * Determinism is the key contract: the same `noteId` must always map to the
 * same hue/spread, so the gallery does not "rewrite" itself between renders.
 */

import type { Note } from "@/lib/types"

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
