"use client"

import { useState, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { getReviewQueue } from "@/lib/queries/notes"
import { NoteDetailPanel } from "@/components/note-detail-panel"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import {
  Inbox,
  AlarmClock,
  AlertTriangle,
  Link2,
  ClipboardCheck,
  FileText,
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
    icon: <Inbox className="h-3.5 w-3.5" />,
    colorClass: "text-accent",
    badgeClass: "bg-accent/10 text-accent",
  },
  "snoozed-due": {
    label: "Snoozed — Due Now",
    icon: <AlarmClock className="h-3.5 w-3.5" />,
    colorClass: "text-chart-3",
    badgeClass: "bg-chart-3/10 text-chart-3",
  },
  "stale-capture": {
    label: "Capture — Stale",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    colorClass: "text-chart-3",
    badgeClass: "bg-chart-3/10 text-chart-3",
  },
  "unlinked-permanent": {
    label: "Permanent — Unlinked",
    icon: <Link2 className="h-3.5 w-3.5" />,
    colorClass: "text-destructive",
    badgeClass: "bg-destructive/10 text-destructive",
  },
}

const REASON_ORDER: ReviewReason[] = [
  "inbox-untriaged",
  "snoozed-due",
  "stale-capture",
  "unlinked-permanent",
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
}

/* ── ReviewPage ──────────────────────────────────────── */

export default function ReviewPage() {
  const notes = usePlotStore((s) => s.notes)
  const openNote = usePlotStore((s) => s.openNote)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)

  const [previewId, setPreviewId] = useState<string | null>(null)

  const reviewItems = useMemo(() => getReviewQueue(notes), [notes])

  const grouped = useMemo(() => {
    const map = new Map<ReviewReason, typeof reviewItems>()
    for (const reason of REASON_ORDER) {
      const group = reviewItems.filter((i) => i.reason === reason)
      if (group.length > 0) map.set(reason, group)
    }
    return map
  }, [reviewItems])

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
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-destructive">
                {reviewItems.length}
              </span>
            )}
          </div>
        </header>

        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-2">
          <ClipboardCheck className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            Notes requiring your attention, grouped by reason.
          </span>
        </div>

        {/* Content */}
        {reviewItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <ClipboardCheck className="mb-4 h-12 w-12 text-muted-foreground/20" />
            <p className="text-[13px] text-muted-foreground">All clear — nothing to review.</p>
            <p className="mt-1 text-[12px] text-muted-foreground/60">
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
                    <span className={`text-[12px] font-medium ${config.colorClass}`}>
                      {config.label}
                    </span>
                    <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${config.badgeClass}`}>
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
                          <FileText className="h-3.5 w-3.5 text-muted-foreground/40" />
                        </div>

                        {/* Title */}
                        <div className="flex flex-1 items-center gap-2 min-w-0 pr-3">
                          <span className="truncate text-[13px] text-foreground">
                            {note.title || "Untitled"}
                          </span>
                        </div>

                        {/* Stage badge */}
                        {stageBadge && (
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium mr-2 ${stageBadge.className}`}>
                            {stageBadge.label}
                          </span>
                        )}

                        {/* Reason badge */}
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium mr-3 ${reasonBadge.className}`}>
                          {reasonBadge.label}
                        </span>

                        {/* Date */}
                        <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">
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
        </aside>
      )}
    </div>
  )
}
