"use client"

/**
 * v3 Editorial view — newsroom spread.
 *
 * Mockup ref:
 *   - JSX:   `docs/v3-mockup/plot-v3-unified-modes.jsx:280-335` (UEditorialMode)
 *   - CSS:   `docs/v3-mockup/plot-v3-unified.css:248-447`        (`.u-edit*`)
 *
 * Layout / typography / colors are taken verbatim from the mockup. The Plot
 * adapter layer is intentionally minimal:
 *   - Q5 LOCKED: feature body comes from `extractParagraphs(contentJson)` —
 *     runtime-derived from the TipTap doc tree, no schema change. Falls back
 *     to the gallery-style excerpt when the body is empty / unhydrated.
 *   - Q10 LOCKED: deck (subtitle) prefers `note.summary`, falls back to
 *     `note.preview`. Same fallback the gallery card uses.
 *   - Mockup `note.author` / `note.issue` / `note.tone` are decorative;
 *     Plot maps them to "You" / `getIssueNumber()` / `note.status` so the
 *     spread always reads as a real issue without polluting the domain
 *     model.
 */

import { useMemo } from "react"
import {
  getSubtitle,
  getExcerpt,
  getWordCount,
  extractParagraphs,
  getIssueNumber,
} from "@/lib/v3/note-helpers"
import { shortRelative } from "@/lib/format-utils"
import type { Note } from "@/lib/types"

interface EditorialViewProps {
  notes: Note[]
  /** Currently active / featured note (drives the masthead spread). */
  activeNoteId: string | null
  /** Rail entry click handler — wired to preview pane in NotesTableView. */
  onNoteClick: (id: string) => void
}

export function EditorialView({ notes, activeNoteId, onNoteClick }: EditorialViewProps) {
  /* Pick the featured note. If the previewed id no longer matches a row in
   * this filtered slice (e.g. user filtered it out), fall back to the first
   * row so the spread never goes blank while the rail still has entries. */
  const active = useMemo(
    () => notes.find((n) => n.id === activeNoteId) ?? notes[0] ?? null,
    [notes, activeNoteId],
  )

  /* Today's date — formatted to match the mockup's "Wed · Nov 6, 2025"
   * pattern (weekday, short month, day, year, dot separators). Computed at
   * render time so the masthead always reflects the current session. */
  const today = useMemo(() => {
    const d = new Date()
    const wk = d.toLocaleDateString("en-US", { weekday: "short" })
    const mo = d.toLocaleDateString("en-US", { month: "short" })
    const day = d.getDate()
    const yr = d.getFullYear()
    return `${wk} · ${mo} ${day}, ${yr}`
  }, [])

  /* Derive the body paragraphs from the active note's TipTap doc tree.
   * `note.contentJson` is hydrated by `<BodyProvider>` at app init — for
   * notes without a body (or before hydration completes), fall back to the
   * single-line excerpt so the spread still has something to render. */
  const bodyParagraphs = useMemo(() => {
    if (!active) return [] as string[]
    const fromJson = extractParagraphs(active.contentJson)
    if (fromJson.length > 0) return fromJson
    const ex = getExcerpt(active)
    return ex ? [ex] : []
  }, [active])

  /* Empty state — still render the masthead so the user sees they're in
   * Editorial mode. The mockup never shows an empty case but Plot views
   * filter aggressively, so we degrade gracefully. */
  if (!active) {
    return (
      <div className="u-edit">
        <div className="u-edit__masthead">
          <div className="u-edit__masthead-l">Vol. III · Plot Press</div>
          <div className="u-edit__title">The Marginalia</div>
          <div className="u-edit__masthead-r">{today}</div>
        </div>
        <div className="u-edit__strip">
          <span>No issues — Empty desk</span>
          <span>0 entries</span>
        </div>
      </div>
    )
  }

  /* Rail entries — up to 6 other notes, mockup-equivalent slicing. */
  const others = notes.filter((n) => n.id !== active.id).slice(0, 6)

  /* Mockup `note.tags[0]?.replace('-', ' ')` — title-case the first tag for
   * the kicker; fall back to "Notes" so the kicker line is never blank. */
  const kicker = (active.tags[0]?.replace(/-/g, " ") || "Notes").trim()

  return (
    <div className="u-edit">
      {/* ── Masthead ─────────────────────────────────────────── */}
      <div className="u-edit__masthead">
        <div className="u-edit__masthead-l">Vol. III · Plot Press</div>
        <div className="u-edit__title">The Marginalia</div>
        <div className="u-edit__masthead-r">{today}</div>
      </div>

      {/* ── Issue strip ──────────────────────────────────────── */}
      <div className="u-edit__strip">
        <span>{getIssueNumber(active.id)} — Feature</span>
        <span>
          {notes.length} {notes.length === 1 ? "entry" : "entries"} · {active.status}
        </span>
      </div>

      {/* ── Spread (feature + rail) ──────────────────────────── */}
      <div className="u-edit__spread">
        <article className="u-edit__feature">
          <div className="u-edit__kicker">{kicker}</div>
          <h1 className="u-edit__headline">{active.title || "Untitled"}</h1>
          {getSubtitle(active) && (
            <p className="u-edit__deck">{getSubtitle(active)}</p>
          )}
          <div className="u-edit__byline">
            <span>
              By <b>You</b>
            </span>
            <span>·</span>
            <span>{getWordCount(active).toLocaleString()} words</span>
            <span>·</span>
            <span>{shortRelative(active.updatedAt)} ago</span>
          </div>
          <div className="u-edit__body">
            {bodyParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p style={{ color: "#8a7f6c", fontStyle: "italic" }}>
              — Continued on the next spread.
            </p>
          </div>
        </article>

        <aside className="u-edit__rail">
          <div className="u-edit__rail-head">In this issue</div>
          {others.map((n) => {
            const entryKicker = (n.tags[0]?.replace(/-/g, " ") || "Notes").trim()
            const entryDeck = getSubtitle(n) || getExcerpt(n).slice(0, 80)
            return (
              <div
                key={n.id}
                className="u-edit__entry"
                data-active={activeNoteId === n.id ? "true" : undefined}
                role="button"
                tabIndex={0}
                onClick={() => onNoteClick(n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onNoteClick(n.id)
                  }
                }}
              >
                <div className="u-edit__entry-kicker">{entryKicker}</div>
                <div className="u-edit__entry-title">{n.title || "Untitled"}</div>
                {entryDeck && (
                  <div className="u-edit__entry-deck">
                    {entryDeck}
                    {entryDeck.length === 80 ? "…" : ""}
                  </div>
                )}
                <div className="u-edit__entry-meta">
                  <span>{getWordCount(n).toLocaleString()}w</span>
                  <span>·</span>
                  <span>{shortRelative(n.updatedAt)}</span>
                </div>
              </div>
            )
          })}
          {others.length === 0 && (
            <div className="u-edit__entry-deck" style={{ paddingTop: 4 }}>
              No companion entries in this issue.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
