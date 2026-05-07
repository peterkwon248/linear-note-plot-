"use client"
import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import type { InboxItemKind } from "@/lib/store/slices/inbox"

/**
 * Action-based inbox notification queue (Linear 정합).
 *
 * Each item answers "내가 반응해야 할 일" — *왜* 이게 inbox에 있는가
 * (`kind`)와 그 원본 entity (`sourceId`)를 추적한다. Entity 분류가 아닌
 * action source 기준으로 묶인다 ("정리 안 된 dashboard"가 아님).
 *
 * Sources: reminder / srs / snooze-expired.
 * wiki-redlink / auto-enroll 은 후속 PR에서 추가.
 */
export interface InboxItem {
  /** Action source — *왜* 이게 inbox에 있는가 */
  kind: InboxItemKind
  /** 원본 entity ID (note id / suggestion id 등) */
  sourceId: string
  /** Display label (note title / "5 cards due" / etc.) */
  title: string
  /** 정렬용 timestamp — due / scheduled 시점. ISO. */
  ts: string
  /** Optional action hint ("Due today", "Overdue 2d", "Create wiki?") */
  action?: string
  /** Optional secondary meta (folder, tag, source detail) */
  meta?: string
}

export function useInbox(): InboxItem[] {
  const notes = usePlotStore((s) => s.notes)
  const dismissedInboxItems = usePlotStore((s) => s.dismissedInboxItems)
  const snoozedInboxItems = usePlotStore((s) => s.snoozedInboxItems)
  const srsStateByNoteId = usePlotStore((s) => s.srsStateByNoteId)

  return useMemo(() => {
    const now = Date.now()
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    const todayEndMs = todayEnd.getTime()

    const dismissedSet = new Set(
      dismissedInboxItems.map((item) => `${item.kind}:${item.sourceId}`)
    )
    const snoozedSet = new Set(
      snoozedInboxItems
        .filter((item) => new Date(item.snoozedUntil).getTime() > now)
        .map((item) => `${item.kind}:${item.sourceId}`)
    )

    function isVisible(kind: InboxItemKind, sourceId: string): boolean {
      const key = `${kind}:${sourceId}`
      return !dismissedSet.has(key) && !snoozedSet.has(key)
    }

    // noteId → note 빠른 조회용 (snooze-expired title 해소에 사용)
    const noteById = new Map(notes.map((n) => [n.id, n]))

    const items: InboxItem[] = []

    // Source: reminder — Note.reviewAt due (today + overdue)
    for (const note of notes) {
      if (note.trashed) continue
      if (!note.reviewAt) continue
      const dueMs = new Date(note.reviewAt).getTime()
      if (dueMs > todayEndMs) continue  // future reminder — skip
      if (!isVisible("reminder", note.id)) continue

      const overdueDays = Math.floor((now - dueMs) / 86_400_000)
      const action =
        overdueDays >= 1 ? `Overdue ${overdueDays}d` :
        dueMs <= now ? "Due now" :
        "Due today"

      items.push({
        kind: "reminder",
        sourceId: note.id,
        title: note.title || "Untitled",
        ts: note.reviewAt,
        action,
      })
    }

    // Source: srs — SRS scheduled review 도래 (dueAt <= now)
    for (const [noteId, srsState] of Object.entries(srsStateByNoteId)) {
      const dueMs = new Date(srsState.dueAt).getTime()
      if (dueMs > now) continue  // future — skip
      if (!isVisible("srs", noteId)) continue

      const note = noteById.get(noteId)
      if (!note || note.trashed) continue

      const overdueDays = Math.floor((now - dueMs) / 86_400_000)
      const action = overdueDays >= 1 ? `Review overdue ${overdueDays}d` : "Review now"

      items.push({
        kind: "srs",
        sourceId: noteId,
        title: note.title || "Untitled",
        ts: srsState.dueAt,
        action,
      })
    }

    // Source: snooze-expired — 만료된 snooze 항목 다시 노출
    for (const snoozed of snoozedInboxItems) {
      const expiredMs = new Date(snoozed.snoozedUntil).getTime()
      if (expiredMs > now) continue  // 아직 active snooze — skip
      if (!isVisible("snooze-expired", snoozed.sourceId)) continue

      // 원본 entity title 해소 (reminder/srs → note title)
      const note = noteById.get(snoozed.sourceId)
      const title = note ? (note.title || "Untitled") : snoozed.sourceId

      items.push({
        kind: "snooze-expired",
        sourceId: snoozed.sourceId,
        title,
        ts: snoozed.snoozedUntil,
        action: "Snooze ended",
        meta: `(was ${snoozed.kind})`,
      })
    }

    // 정렬: oldest ts first (overdue 먼저)
    items.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0))

    return items
  }, [notes, dismissedInboxItems, snoozedInboxItems, srsStateByNoteId])
}
