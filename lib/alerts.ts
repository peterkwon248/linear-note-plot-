import type { Note, Alert, AlertType } from "./types"
import type { SRSState } from "./srs"

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Compute current alerts from application state.
 * Alerts are derived (not stored) — only dismissed IDs are persisted.
 */
export function computeAlerts(
  notes: Note[],
  srsMap: Record<string, SRSState>,
  dismissedIds: Set<string>,
): Alert[] {
  const alerts: Alert[] = []
  const nowMs = Date.now()
  const nowISO = new Date().toISOString()

  for (const note of notes) {
    if (note.archived || note.triageStatus === "trashed") continue

    // 1. SRS due — permanent notes with overdue SRS
    if (note.status === "permanent") {
      const srs = srsMap[note.id]
      if (srs && srs.dueAt <= nowISO) {
        const id = alertId("srs-due", note.id)
        if (!dismissedIds.has(id)) {
          alerts.push({
            id,
            type: "srs-due",
            noteId: note.id,
            message: `"${note.title || "Untitled"}" is due for SRS review`,
            severity: "warning",
          })
        }
      }
    }

    // 2. Snooze expired — snoozed inbox notes past reviewAt
    if (
      note.status === "inbox" &&
      note.triageStatus === "snoozed" &&
      note.reviewAt &&
      new Date(note.reviewAt).getTime() <= nowMs
    ) {
      const id = alertId("snooze-expired", note.id)
      if (!dismissedIds.has(id)) {
        alerts.push({
          id,
          type: "snooze-expired",
          noteId: note.id,
          message: `"${note.title || "Untitled"}" snooze has expired`,
          severity: "urgent",
        })
      }
    }

    // 3. Stale note — capture notes untouched for 7+ days
    if (note.status === "capture") {
      const touched = new Date(note.lastTouchedAt ?? note.updatedAt).getTime()
      const daysStale = (nowMs - touched) / DAY_MS
      if (daysStale >= 7) {
        const id = alertId("stale-note", note.id)
        if (!dismissedIds.has(id)) {
          alerts.push({
            id,
            type: "stale-note",
            noteId: note.id,
            message: `"${note.title || "Untitled"}" hasn't been touched in ${Math.floor(daysStale)} days`,
            severity: daysStale >= 14 ? "warning" : "info",
          })
        }
      }
    }
  }

  return alerts
}

function alertId(type: AlertType, noteId: string): string {
  return `${type}:${noteId}`
}

/* ── Alert display config ─────────────────────────── */

export const ALERT_TYPE_CONFIG: Record<
  AlertType,
  { label: string; colorClass: string; badgeClass: string }
> = {
  "srs-due": {
    label: "SRS — Due for Review",
    colorClass: "text-chart-5",
    badgeClass: "bg-chart-5/10 text-chart-5",
  },
  "snooze-expired": {
    label: "Snooze Expired",
    colorClass: "text-chart-3",
    badgeClass: "bg-chart-3/10 text-chart-3",
  },
  "stale-note": {
    label: "Stale Notes",
    colorClass: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground",
  },
}

export const ALERT_TYPE_ORDER: AlertType[] = [
  "snooze-expired",
  "srs-due",
  "stale-note",
]
