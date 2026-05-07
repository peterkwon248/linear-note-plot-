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
 * 첫 source = `reminder` (Note.reviewAt 도래). srs / snooze-expired /
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

    // 정렬: oldest due first (overdue 먼저), 같으면 createdAt
    items.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0))

    return items
  }, [notes, dismissedInboxItems, snoozedInboxItems])
}
