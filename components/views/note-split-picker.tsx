"use client"

import { useState, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { setNoteViewMode } from "@/lib/note-view-mode"
import { setSplitTargetNoteId } from "@/lib/note-split-mode"
import { Search, Scissors, ChevronRight } from "@/components/icons/imperial"

/* ──────────────────────────────────────────────────────────
 * NoteSplitPicker — standalone "wiki-level" split mode entry for NOTES.
 *
 * Mirrors the article-selector portion of components/views/wiki-split-page.tsx
 * (WikiSplitPage's `if (!selectedArticleId)` branch): a searchable picker of
 * notes. On selecting a note it hands off to the EXISTING split editor by
 * calling `setSplitTargetNoteId(id)`, which makes the already-mounted
 * NoteSplitOverlay (app/(app)/layout.tsx) render <NoteSplitPage noteId={id}/>.
 *
 * We deliberately do NOT reimplement the split editor — NoteSplitPage owns the
 * doc-split (extractedJson / remainingJson). Picking a note also exits this
 * standalone picker (setNoteViewMode("default")) so the two overlays don't
 * stack: the contextual split overlay takes over.
 * ────────────────────────────────────────────────────────── */

export function NoteSplitPicker() {
  const t = useT()
  const notes = usePlotStore((s) => s.notes)
  const [searchQuery, setSearchQuery] = useState("")

  // Only non-trashed notes are splittable.
  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return notes.filter(
      (n) => !n.trashed && (q.length === 0 || (n.title || "Untitled").toLowerCase().includes(q)),
    )
  }, [notes, searchQuery])

  const pickNote = (id: string) => {
    // Exit standalone picker, then hand off to the existing contextual split
    // overlay (NoteSplitOverlay → NoteSplitPage) via the split-mode store.
    setNoteViewMode("default")
    setSplitTargetNoteId(id)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
            <Scissors size={16} className="text-white/70" />
          </div>
          <div>
            <h2 className="text-note font-semibold text-white/90">Split Note</h2>
            <p className="text-2xs text-white/40">Choose a note to split</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setNoteViewMode("default")}
              className="rounded-md px-3 py-2 text-note text-white/50 transition-colors hover:bg-white/5 hover:text-white/70"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>

      {/* Search + list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="relative mb-4 max-w-lg">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes…"
            className="h-8 w-full rounded-md border border-white/[0.08] bg-white/[0.03] pl-8 pr-3 text-2xs text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>

        <div className="max-w-lg space-y-1">
          {filteredNotes.map((n) => (
            <button
              key={n.id}
              onClick={() => pickNote(n.id)}
              className="flex w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left transition-colors hover:bg-white/[0.05] hover:border-white/[0.1]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-note font-medium text-white/85">{n.title || "Untitled"}</p>
                {n.tags.length > 0 && (
                  <p className="text-2xs text-white/30">
                    {n.tags.length} tag{n.tags.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <ChevronRight size={14} className="shrink-0 text-white/20" />
            </button>
          ))}
          {filteredNotes.length === 0 && (
            <p className="py-8 text-center text-2xs text-white/25">No notes found</p>
          )}
        </div>
      </div>
    </div>
  )
}
