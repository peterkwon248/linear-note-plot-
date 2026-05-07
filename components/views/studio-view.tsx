"use client"

/**
 * v3 Studio view — pro media tool surface (dark-forced).
 *
 * Mockup ref:
 *   - JSX:   `docs/v3-mockup/plot-v3-unified-modes.jsx:162-278` (UStudioMode)
 *   - CSS:   `docs/v3-mockup/plot-v3-unified.css:448-709`        (`.u-studio*`)
 *
 * Q4 LOCKED: dark-forced. Studio is a "studio" surface — the mockup uses a
 * deep neutral background even on light themes, and we honor that here. The
 * `.u-studio` block in `app/globals.css` hard-codes `background:#0d0e10` and
 * has no `.dark` overrides.
 *
 * Q12 LOCKED: rail track segments are SRS-derived (see
 * `lib/v3/note-helpers.ts#getStudioSegments`). Notes without an SRS entry
 * fall back to a stable noteId hash so the rail still looks alive.
 */

import { useMemo } from "react"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Play } from "@phosphor-icons/react/dist/ssr/Play"
import { SkipBack } from "@phosphor-icons/react/dist/ssr/SkipBack"
import { SkipForward } from "@phosphor-icons/react/dist/ssr/SkipForward"
import { Funnel } from "@phosphor-icons/react/dist/ssr/Funnel"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { usePlotStore } from "@/lib/store"
import {
  getHueFromNoteId,
  getExcerpt,
  getWordCount,
  getStudioSegments,
  roundFillTo01,
} from "@/lib/v3/note-helpers"
import { shortRelative } from "@/lib/format-utils"
import type { Note } from "@/lib/types"

interface StudioViewProps {
  notes: Note[]
  /** Currently active / previewed note (drives the inspector + active rail). */
  activeNoteId: string | null
  /** Rail click handler — wired to preview pane in NotesTableView. */
  onNoteClick: (id: string) => void
}

export function StudioView({ notes, activeNoteId, onNoteClick }: StudioViewProps) {
  const srsByNoteId = usePlotStore((s) => s.srsStateByNoteId)

  /* Pick the active note. If the previewed id no longer matches a row in this
   * filtered slice (e.g. user filtered it out), fall back to the first row so
   * the inspector never goes blank while rails are present. */
  const active = useMemo(
    () => notes.find((n) => n.id === activeNoteId) ?? notes[0] ?? null,
    [notes, activeNoteId],
  )

  /* Stable waveform bars — verbatim from mockup `barHeights` (line 173-180).
   * The pattern is deterministic so the timeline doesn't shimmer on rerenders. */
  const barHeights = useMemo(() => {
    const arr: number[] = []
    let s = 0.42
    for (let i = 0; i < 120; i++) {
      s = (Math.sin(i * 0.31) + Math.sin(i * 0.13) + 2.4) / 4.8
      arr.push(Math.max(0.08, Math.min(0.95, s + (i === 60 ? 0.1 : 0))))
    }
    return arr
  }, [])

  /* Mockup uses a hard-coded 32% playhead position purely as visual decoration. */
  const playheadPct = 32
  const totalNotes = notes.length

  /* Empty state — keep the chrome (transport bar, dark canvas) so the user
   * still sees they're in Studio; just suppress rail/inspector/timeline noise. */
  if (!active) {
    return (
      <div className="u-studio">
        <div className="u-studio__transport">
          <button className="u-studio__transport-btn" type="button" disabled>
            <SkipBack size={13} weight="regular" />
          </button>
          <button
            className="u-studio__transport-btn"
            data-primary="true"
            type="button"
            disabled
            title="Play"
          >
            <Play size={13} weight="fill" />
          </button>
          <button className="u-studio__transport-btn" type="button" disabled>
            <SkipForward size={13} weight="regular" />
          </button>
          <div className="u-studio__readout">00:00:00 / 00:00:00</div>
          <div className="u-studio__transport-meta">
            <span><b>Notes</b> 0 / 0</span>
          </div>
        </div>
        <div className="u-studio__canvas" />
        <aside className="u-studio__inspector">
          <div className="u-studio__inspector-section">
            <div className="u-studio__inspector-label">Empty</div>
            <div style={{ fontSize: 11.5, color: "#9aa0a8", lineHeight: 1.45 }}>
              No notes match the current view.
            </div>
          </div>
        </aside>
        <div className="u-studio__timeline">
          <div className="u-studio__timeline-head">
            <span>Master</span>
            <span style={{ fontFamily: "Geist Mono, monospace", fontVariantNumeric: "tabular-nums" }}>
              00 — 16 — 32 — 48 — 64
            </span>
          </div>
          <div className="u-studio__timeline-track" />
        </div>
      </div>
    )
  }

  return (
    <div className="u-studio">
      {/* ── Transport bar ──────────────────────────────────────── */}
      <div className="u-studio__transport">
        <button className="u-studio__transport-btn" type="button" title="Previous">
          <SkipBack size={13} weight="regular" />
        </button>
        <button
          className="u-studio__transport-btn"
          data-primary="true"
          type="button"
          title="Play"
        >
          <Play size={13} weight="fill" />
        </button>
        <button className="u-studio__transport-btn" type="button" title="Next">
          <SkipForward size={13} weight="regular" />
        </button>
        <div className="u-studio__readout">00:14:22 / 00:42:18</div>
        <button
          className="u-studio__transport-btn"
          style={{ marginLeft: 8 }}
          type="button"
          title="Filter"
        >
          <Funnel size={12} weight="regular" />
        </button>
        <button className="u-studio__transport-btn" type="button" title="Search">
          <MagnifyingGlass size={12} weight="regular" />
        </button>
        <div className="u-studio__transport-meta">
          <span><b>BPM</b> 124</span>
          <span><b>Key</b> A&#9837; maj</span>
          <span><b>Notes</b> {totalNotes} / {totalNotes}</span>
        </div>
      </div>

      {/* ── Canvas (rail list) ─────────────────────────────────── */}
      <div className="u-studio__canvas">
        {notes.map((n) => {
          const hue = getHueFromNoteId(n.id)
          const bg = `oklch(58% 0.16 ${hue})`
          const segs = getStudioSegments(n.id, srsByNoteId[n.id])
          return (
            <div
              key={n.id}
              className="u-studio__rail"
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
              <div className="u-studio__rail-head">
                <span
                  className="u-studio__rail-icon"
                  style={{ background: bg, color: "#fff" }}
                >
                  <FileText size={15} weight="regular" />
                </span>
                <div className="u-studio__rail-info">
                  <div className="u-studio__rail-title">{n.title || "Untitled"}</div>
                  <div className="u-studio__rail-meta">
                    {getWordCount(n).toLocaleString()}w · {n.status} · {shortRelative(n.updatedAt)}
                  </div>
                </div>
              </div>
              <div className="u-studio__rail-track">
                {segs.map((fill, i) => (
                  <div
                    key={i}
                    className="u-studio__seg"
                    data-fill={roundFillTo01(fill)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Inspector ──────────────────────────────────────────── */}
      <aside className="u-studio__inspector">
        <div className="u-studio__inspector-head">
          <span
            className="u-studio__inspector-icon"
            style={{
              background: `oklch(58% 0.16 ${getHueFromNoteId(active.id)})`,
              color: "#fff",
            }}
          >
            <FileText size={17} weight="regular" />
          </span>
          <div>
            <div className="u-studio__inspector-title">{active.title || "Untitled"}</div>
            <div className="u-studio__inspector-sub">
              TRACK · {active.id.slice(0, 8).toUpperCase()}
            </div>
          </div>
        </div>
        <div className="u-studio__inspector-section">
          <div className="u-studio__inspector-label">Stats</div>
          <div className="u-studio__pair">
            <span>Words</span><span>{getWordCount(active).toLocaleString()}</span>
          </div>
          <div className="u-studio__pair">
            <span>Links</span><span>{active.linksOut?.length ?? 0}</span>
          </div>
          <div className="u-studio__pair">
            <span>Updated</span><span>{shortRelative(active.updatedAt)}</span>
          </div>
          <div className="u-studio__pair">
            <span>Priority</span>
            <span style={{ textTransform: "capitalize" }}>{active.priority}</span>
          </div>
        </div>
        {active.tags.length > 0 && (
          <div className="u-studio__inspector-section">
            <div className="u-studio__inspector-label">Tags</div>
            <div className="u-studio__chip-row">
              {active.tags.map((t) => (
                <span key={t} className="u-studio__chip">{t}</span>
              ))}
            </div>
          </div>
        )}
        <div className="u-studio__inspector-section">
          <div className="u-studio__inspector-label">Excerpt</div>
          <div
            style={{
              fontSize: 11.5,
              color: "#9aa0a8",
              lineHeight: 1.45,
              fontStyle: "italic",
            }}
          >
            {getExcerpt(active) ? `"${getExcerpt(active)}"` : "—"}
          </div>
        </div>
      </aside>

      {/* ── Timeline ───────────────────────────────────────────── */}
      <div className="u-studio__timeline">
        <div className="u-studio__timeline-head">
          <span>Master · {active.title || "Untitled"}</span>
          <span
            style={{
              fontFamily: "Geist Mono, monospace",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            00 — 16 — 32 — 48 — 64
          </span>
        </div>
        <div className="u-studio__timeline-track">
          <div className="u-studio__waveform">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="u-studio__bar"
                style={{ height: `${h * 100}%`, opacity: 0.35 + h * 0.5 }}
              />
            ))}
          </div>
          <div className="u-studio__playhead" style={{ left: `${playheadPct}%` }} />
        </div>
      </div>
    </div>
  )
}
