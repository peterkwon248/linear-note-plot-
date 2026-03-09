"use client"

import { useState, useMemo, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { computeNextStep, INTERVALS, type SRSRating } from "@/lib/srs"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { getReviewQueue } from "@/lib/queries/notes"
import { NoteDetailPanel } from "@/components/note-detail-panel"
import { FloatingActionBar } from "@/components/floating-action-bar"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import {
  Inbox,
  AlarmClock,
  AlertTriangle,
  Link2,
  ClipboardCheck,
  FileText,
  RotateCcw,
  Bell,
} from "lucide-react"
import { format } from "date-fns"
import type { ReviewReason } from "@/lib/queries/notes"

/* ── Section config ──────────────────────────────────── */

const SECTION_CONFIG: Record<
  ReviewReason,
  { label: string; icon: React.ReactNode; colorClass: string; badgeClass: string }
> = {
  "inbox-untriaged": {
    label: "Inbox — Needs Triage",
    icon: <Inbox className="h-4 w-4" />,
    colorClass: "text-accent",
    badgeClass: "bg-accent/10 text-accent",
  },
  "snoozed-due": {
    label: "Snoozed — Due Now",
    icon: <AlarmClock className="h-4 w-4" />,
    colorClass: "text-chart-3",
    badgeClass: "bg-chart-3/10 text-chart-3",
  },
  "stale-capture": {
    label: "Capture — Stale",
    icon: <AlertTriangle className="h-4 w-4" />,
    colorClass: "text-chart-3",
    badgeClass: "bg-chart-3/10 text-chart-3",
  },
  "unlinked-permanent": {
    label: "Permanent — Unlinked",
    icon: <Link2 className="h-4 w-4" />,
    colorClass: "text-destructive",
    badgeClass: "bg-destructive/10 text-destructive",
  },
  "srs-due": {
    label: "SRS — Due for Review",
    icon: <RotateCcw className="h-4 w-4" />,
    colorClass: "text-chart-5",
    badgeClass: "bg-chart-5/10 text-chart-5",
  },
  "remind-due": {
    label: "Reminded — Due Now",
    icon: <Bell className="h-4 w-4" />,
    colorClass: "text-[#a78bfa]",
    badgeClass: "bg-[#a78bfa]/10 text-[#a78bfa]",
  },
}

const REASON_ORDER: ReviewReason[] = [
  "inbox-untriaged",
  "snoozed-due",
  "remind-due",
  "stale-capture",
  "unlinked-permanent",
  "srs-due",
]

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  inbox: { label: "Inbox", className: "bg-accent/10 text-accent" },
  capture: { label: "Capture", className: "bg-chart-2/10 text-chart-2" },
  permanent: { label: "Permanent", className: "bg-chart-5/10 text-chart-5" },
}

const REASON_BADGE: Record<ReviewReason, { label: string; className: string }> = {
  "inbox-untriaged": { label: "Untriaged", className: "bg-accent/10 text-accent" },
  "snoozed-due": { label: "Snoozed Due", className: "bg-chart-3/10 text-chart-3" },
  "stale-capture": { label: "Stale", className: "bg-chart-3/10 text-chart-3" },
  "unlinked-permanent": { label: "Unlinked", className: "bg-destructive/10 text-destructive" },
  "srs-due": { label: "SRS Due", className: "bg-chart-5/10 text-chart-5" },
  "remind-due": { label: "Reminded", className: "bg-[#a78bfa]/10 text-[#a78bfa]" },
}

/* ── ReviewView ──────────────────────────────────────── */

export function ReviewView() {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const srsStateByNoteId = usePlotStore((s) => s.srsStateByNoteId)
  const reviewSRS = usePlotStore((s) => s.reviewSRS)

  const backlinks = useBacklinksIndex()

  const [previewId, setPreviewId] = useState<string | null>(null)

  const reviewItems = useMemo(() => getReviewQueue(notes, backlinks, srsStateByNoteId), [notes, backlinks, srsStateByNoteId])

  const grouped = useMemo(() => {
    const map = new Map<ReviewReason, typeof reviewItems>()
    for (const reason of REASON_ORDER) {
      const group = reviewItems.filter((i) => i.reason === reason)
      if (group.length > 0) map.set(reason, group)
    }
    return map
  }, [reviewItems])

  const RATING_LABELS = ["Again", "Hard", "Good", "Easy"] as const
  const RATING_COLORS = [
    "text-destructive hover:bg-destructive/10",
    "text-chart-3 hover:bg-chart-3/10",
    "text-chart-5 hover:bg-chart-5/10",
    "text-accent hover:bg-accent/10",
  ] as const

  const currentReason = useMemo(() => {
    if (!previewId) return null
    return reviewItems.find((i) => i.note.id === previewId)?.reason ?? null
  }, [previewId, reviewItems])

  const goNextSRS = useCallback(() => {
    const srsItems = reviewItems.filter((i) => i.reason === "srs-due" && i.note.id !== previewId)
    if (srsItems.length > 0) {
      setPreviewId(srsItems[0].note.id)
    } else {
      setPreviewId(null)
    }
  }, [reviewItems, previewId])

  // Full editor mode
  if (selectedNoteId) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <NoteEditor />
        <NoteInspector />
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-foreground">Review</h1>
            {reviewItems.length > 0 && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[12px] font-medium tabular-nums text-destructive">
                {reviewItems.length}
              </span>
            )}
          </div>
        </header>

        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-2">
          <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[12px] text-muted-foreground">
            Notes requiring your attention, grouped by reason.
          </span>
        </div>

        {/* Content */}
        {reviewItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <ClipboardCheck className="mb-4 h-12 w-12 text-muted-foreground/20" />
            <p className="text-[15px] text-muted-foreground">All clear — nothing to review.</p>
            <p className="mt-1 text-[14px] text-muted-foreground/60">
              Check back later as notes move through your workflow.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {REASON_ORDER.map((reason) => {
              const group = grouped.get(reason)
              if (!group) return null
              const config = SECTION_CONFIG[reason]
              return (
                <div key={reason}>
                  {/* Section header */}
                  <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-5 py-2 backdrop-blur-sm">
                    <span className={config.colorClass}>{config.icon}</span>
                    <span className={`text-[14px] font-medium ${config.colorClass}`}>
                      {config.label}
                    </span>
                    <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${config.badgeClass}`}>
                      {group.length}
                    </span>
                  </div>

                  {/* Rows */}
                  {group.map(({ note, reason: itemReason }) => {
                    const stageBadge = STATUS_BADGE[note.status]
                    const reasonBadge = REASON_BADGE[itemReason]
                    return (
                      <div
                        key={note.id}
                        className={`group flex items-center border-b border-border px-5 py-2.5 transition-colors cursor-pointer ${
                          previewId === note.id
                            ? "bg-accent/8 border-l-2 border-l-accent"
                            : "hover:bg-secondary/30"
                        }`}
                        onClick={() => setPreviewId(note.id)}
                        onDoubleClick={() => openNote(note.id)}
                      >
                        {/* Icon */}
                        <div className="mr-3 shrink-0">
                          <FileText className="h-4 w-4 text-muted-foreground/40" />
                        </div>

                        {/* Title */}
                        <div className="flex flex-1 items-center gap-2 min-w-0 pr-3">
                          <span className="truncate text-[15px] text-foreground">
                            {note.title || "Untitled"}
                          </span>
                        </div>

                        {/* Stage badge */}
                        {stageBadge && (
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium mr-2 ${stageBadge.className}`}>
                            {stageBadge.label}
                          </span>
                        )}

                        {/* Reason badge */}
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium mr-3 ${reasonBadge.className}`}>
                          {reasonBadge.label}
                        </span>

                        {/* Date */}
                        <span className="shrink-0 text-[14px] tabular-nums text-muted-foreground">
                          {format(new Date(note.updatedAt), "MMM d")}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Detail panel */}
      {previewId && (
        <aside className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-l border-border bg-card animate-in slide-in-from-right-4 fade-in duration-200">
          <NoteDetailPanel
            noteId={previewId}
            onClose={() => setPreviewId(null)}
            onOpenNote={(id) => setPreviewId(id)}
            onEditNote={() => {
              openNote(previewId)
              setPreviewId(null)
            }}
            onTriageAction={() => setPreviewId(null)}
            embedded
          />
          {/* SRS Rating Bar */}
          {currentReason === "srs-due" && (
            <div className="flex shrink-0 items-center gap-2 border-t border-border bg-secondary/20 px-4 py-3">
              {([0, 1, 2, 3] as const).map((rating) => {
                const srs = srsStateByNoteId[previewId]
                const preview = computeNextStep(rating, srs?.step ?? 0)
                return (
                  <button
                    key={rating}
                    onClick={() => {
                      reviewSRS(previewId, rating)
                      goNextSRS()
                    }}
                    className={`flex flex-1 flex-col items-center gap-0.5 rounded-md border border-border bg-card px-2 py-2 text-center transition-colors ${RATING_COLORS[rating]}`}
                  >
                    <span className="text-[14px] font-medium">{RATING_LABELS[rating]}</span>
                    <span className="text-[11px] tabular-nums opacity-60">{INTERVALS[preview.step]}d</span>
                  </button>
                )
              })}
            </div>
          )}
        </aside>
      )}

      {/* Floating action bar */}
      {previewId && (
        <FloatingActionBar
          selectedIds={new Set([previewId])}
          effectiveTab="all"
          notes={notes}
          onClearSelection={() => setPreviewId(null)}
        />
      )}
    </div>
  )
}
