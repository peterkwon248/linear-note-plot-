"use client"

/**
 * v3 Gallery view — atelier cards on a warm canvas.
 *
 * Mockup ref:
 *   - JSX:   `docs/v3-mockup/plot-v3-unified-modes.jsx:11-69` (UGalleryMode + UGalleryCard)
 *   - CSS:   `docs/v3-mockup/plot-v3-unified.css:87-245`     (`.u-gallery`, `.u-card`)
 *
 * Layout/typography/colors are taken verbatim from the mockup. The Plot
 * adapter layer is intentionally minimal: hue / spread / excerpt come from
 * `lib/v3/note-helpers.ts`, and grouping reuses the mockup's Today /
 * Yesterday / This week / Older buckets.
 */

import { useMemo } from "react"
import { Hash } from "@phosphor-icons/react/dist/ssr/Hash"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import {
  getHueFromNoteId,
  getCoverGradient,
  getExcerpt,
  getSpread,
  getWordCount,
} from "@/lib/v3/note-helpers"
import { shortRelative } from "@/lib/format-utils"
import type { Note } from "@/lib/types"

interface GalleryViewProps {
  notes: Note[]
  /** Currently active / previewed note (highlights the matching card). */
  activeNoteId: string | null
  /** Card click handler — wired to preview pane in NotesTableView. */
  onNoteClick: (id: string) => void
  /** Optional title override (shown in the warm "The Workshop" header). */
  title?: string
}

/* ── Time grouping (mockup PlotData.groupByTime equivalent) ─────────── */

interface TimeGroup {
  id: "today" | "yesterday" | "this-week" | "older"
  label: string
  notes: Note[]
}

const DAY_MS = 24 * 60 * 60 * 1000

function groupByTime(notes: Note[]): TimeGroup[] {
  const now = Date.now()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayMs = startOfToday.getTime()
  const yesterdayMs = todayMs - DAY_MS
  const weekMs = todayMs - 7 * DAY_MS

  const buckets: Record<TimeGroup["id"], Note[]> = {
    today:       [],
    yesterday:   [],
    "this-week": [],
    older:       [],
  }

  for (const n of notes) {
    const t = new Date(n.updatedAt).getTime()
    if (Number.isNaN(t)) {
      buckets.older.push(n)
      continue
    }
    if (t >= todayMs)      buckets.today.push(n)
    else if (t >= yesterdayMs) buckets.yesterday.push(n)
    else if (t >= weekMs)      buckets["this-week"].push(n)
    else                       buckets.older.push(n)
  }

  // Suppress empty buckets in the order the mockup expects.
  const order: { id: TimeGroup["id"]; label: string }[] = [
    { id: "today",     label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "this-week", label: "This week" },
    { id: "older",     label: "Older" },
  ]
  return order
    .map(({ id, label }) => ({ id, label, notes: buckets[id] }))
    .filter((g) => g.notes.length > 0)
}

/* ── Component ──────────────────────────────────────────────────────── */

export function GalleryView({ notes, activeNoteId, onNoteClick, title }: GalleryViewProps) {
  const groups = useMemo(() => groupByTime(notes), [notes])

  if (notes.length === 0) {
    return (
      <div className="u-mode" data-mode="gallery">
        <div className="u-gallery">
          <div className="u-gallery__head">
            <div className="u-gallery__title">{title ?? "The Workshop"}</div>
            <div className="u-gallery__meta">no cards yet</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="u-mode" data-mode="gallery">
      <div className="u-gallery">
        <div className="u-gallery__head">
          <div className="u-gallery__title">{title ?? "The Workshop"}</div>
          <div className="u-gallery__meta">
            {notes.length} card{notes.length === 1 ? "" : "s"} · sorted by recency
          </div>
        </div>

        {groups.map((g) => (
          <section key={g.id}>
            <header className="u-gallery__section-head">
              <div className="u-gallery__section-label">{g.label}</div>
              <div className="u-gallery__section-count">
                {g.notes.length} {g.notes.length === 1 ? "card" : "cards"}
              </div>
            </header>
            <div className="u-gallery__grid">
              {g.notes.map((n) => (
                <GalleryCard
                  key={n.id}
                  note={n}
                  active={activeNoteId === n.id}
                  onClick={() => onNoteClick(n.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

/* ── Card ───────────────────────────────────────────────────────────── */

interface GalleryCardProps {
  note: Note
  active: boolean
  onClick: () => void
}

function GalleryCard({ note, active, onClick }: GalleryCardProps) {
  const hue = getHueFromNoteId(note.id)
  const cover = getCoverGradient(hue)
  const spread = getSpread(note.id)
  const excerpt = getExcerpt(note)
  const wordCount = getWordCount(note)

  return (
    <article
      className="u-card"
      data-active={active ? "true" : undefined}
      data-spread={spread}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="u-card__cover" style={{ background: cover }}>
        <div className="u-card__icon-bg">
          <FileText size={32} weight="regular" />
        </div>
      </div>
      <h3 className="u-card__title">{note.title || "Untitled"}</h3>
      {excerpt && <p className="u-card__excerpt">{excerpt}</p>}
      <footer className="u-card__foot">
        <div className="u-card__tags">
          {note.tags.slice(0, 2).map((t) => (
            <span key={t} className="u-card__tag">
              <Hash size={9} weight="regular" />
              {t}
            </span>
          ))}
        </div>
        <div className="u-card__meta">
          {wordCount > 0 && (
            <>
              <span>{wordCount.toLocaleString()}w</span>
              <span>·</span>
            </>
          )}
          <span>{shortRelative(note.updatedAt)}</span>
        </div>
      </footer>
    </article>
  )
}
