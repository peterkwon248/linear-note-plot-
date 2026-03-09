"use client"

import { useState, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { computeAlerts, ALERT_TYPE_CONFIG, ALERT_TYPE_ORDER } from "@/lib/alerts"
import { NoteDetailPanel } from "@/components/note-detail-panel"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import {
  Bell,
  RotateCcw,
  AlarmClock,
  AlertTriangle,
  FileText,
  X,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"
import type { AlertType, Alert } from "@/lib/types"

/* ── Icons per alert type ────────────────────────────── */

const ALERT_ICONS: Record<AlertType, React.ReactNode> = {
  "srs-due": <RotateCcw className="h-4 w-4" />,
  "snooze-expired": <AlarmClock className="h-4 w-4" />,
  "stale-note": <AlertTriangle className="h-4 w-4" />,
}

const SEVERITY_DOT: Record<string, string> = {
  urgent: "bg-destructive",
  warning: "bg-chart-3",
  info: "bg-muted-foreground/40",
}

/* ── AlertsView ──────────────────────────────────────── */

export function AlertsView() {
  const notes = usePlotStore((s) => s.notes)
  const srsStateByNoteId = usePlotStore((s) => s.srsStateByNoteId)
  const dismissedAlertIds = usePlotStore((s) => s.dismissedAlertIds) ?? []
  const dismissAlert = usePlotStore((s) => s.dismissAlert)
  const clearDismissedAlerts = usePlotStore((s) => s.clearDismissedAlerts)
  const openNote = usePlotStore((s) => s.openNote)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)

  const [previewId, setPreviewId] = useState<string | null>(null)

  const dismissedSet = useMemo(() => new Set(dismissedAlertIds), [dismissedAlertIds])

  const alerts = useMemo(
    () => computeAlerts(notes, srsStateByNoteId, dismissedSet),
    [notes, srsStateByNoteId, dismissedSet],
  )

  const grouped = useMemo(() => {
    const map = new Map<AlertType, Alert[]>()
    for (const type of ALERT_TYPE_ORDER) {
      const group = alerts.filter((a) => a.type === type)
      if (group.length > 0) map.set(type, group)
    }
    return map
  }, [alerts])

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
            <h1 className="text-base font-semibold text-foreground">Alerts</h1>
            {alerts.length > 0 && (
              <span className="rounded-full bg-chart-3/10 px-2 py-0.5 text-[12px] font-medium tabular-nums text-chart-3">
                {alerts.length}
              </span>
            )}
          </div>
          {dismissedAlertIds.length > 0 && (
            <button
              onClick={clearDismissedAlerts}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear dismissed
            </button>
          )}
        </header>

        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-2">
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[12px] text-muted-foreground">
            SRS reviews, expired snoozes, and stale notes that need attention.
          </span>
        </div>

        {/* Content */}
        {alerts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Bell className="mb-4 h-12 w-12 text-muted-foreground/20" />
            <p className="text-[15px] text-muted-foreground">No alerts right now.</p>
            <p className="mt-1 text-[14px] text-muted-foreground/60">
              You&apos;ll see alerts when notes need your attention.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {ALERT_TYPE_ORDER.map((type) => {
              const group = grouped.get(type)
              if (!group) return null
              const config = ALERT_TYPE_CONFIG[type]
              return (
                <div key={type}>
                  {/* Section header */}
                  <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-5 py-2 backdrop-blur-sm">
                    <span className={config.colorClass}>{ALERT_ICONS[type]}</span>
                    <span className={`text-[14px] font-medium ${config.colorClass}`}>
                      {config.label}
                    </span>
                    <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${config.badgeClass}`}>
                      {group.length}
                    </span>
                  </div>

                  {/* Rows */}
                  {group.map((alert) => {
                    const note = notes.find((n) => n.id === alert.noteId)
                    if (!note) return null
                    return (
                      <div
                        key={alert.id}
                        className={`group flex items-center border-b border-border px-5 py-2.5 transition-colors cursor-pointer ${
                          previewId === alert.noteId
                            ? "bg-accent/8 border-l-2 border-l-accent"
                            : "hover:bg-secondary/30"
                        }`}
                        onClick={() => setPreviewId(alert.noteId)}
                        onDoubleClick={() => openNote(alert.noteId)}
                      >
                        {/* Severity dot */}
                        <div className="mr-3 shrink-0">
                          <div className={`h-2 w-2 rounded-full ${SEVERITY_DOT[alert.severity]}`} />
                        </div>

                        {/* Content */}
                        <div className="flex flex-1 flex-col gap-0.5 min-w-0 pr-3">
                          <span className="truncate text-[15px] text-foreground">
                            {note.title || "Untitled"}
                          </span>
                          <span className="truncate text-[12px] text-muted-foreground">
                            {alert.message}
                          </span>
                        </div>

                        {/* Status badge */}
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium mr-3 ${config.badgeClass}`}>
                          {note.status}
                        </span>

                        {/* Date */}
                        <span className="shrink-0 text-[14px] tabular-nums text-muted-foreground mr-2">
                          {format(new Date(note.updatedAt), "MMM d")}
                        </span>

                        {/* Dismiss */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            dismissAlert(alert.id)
                            if (previewId === alert.noteId) setPreviewId(null)
                          }}
                          className="shrink-0 rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
                          title="Dismiss"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
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
