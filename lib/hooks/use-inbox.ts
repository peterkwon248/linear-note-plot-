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
 * Sources: reminder / srs / snooze-expired / wiki-redlink / auto-enroll.
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
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const clusterSuggestions = usePlotStore((s) => s.clusterSuggestions)

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

    // Source: wiki-redlink — [[link]] 작성됐는데 wiki article 미생성 (refs >= 2)
    const wikiTitleSet = new Set(wikiArticles.map((a: { title: string }) => a.title.toLowerCase()))
    const redLinkRefs = new Map<string, Set<string>>()
    // firstSeen: link text 원본 (대소문자 보존) — 최초 발견 기준
    const redLinkOriginal = new Map<string, string>()
    for (const note of notes) {
      if (note.trashed) continue
      for (const link of (note.linksOut ?? [])) {
        const normalized = link.toLowerCase()
        if (!wikiTitleSet.has(normalized)) {
          if (!redLinkRefs.has(normalized)) {
            redLinkRefs.set(normalized, new Set())
            redLinkOriginal.set(normalized, link)
          }
          redLinkRefs.get(normalized)!.add(note.id)
        }
      }
    }
    for (const [normalized, refs] of redLinkRefs) {
      if (refs.size < 2) continue
      if (!isVisible("wiki-redlink", normalized)) continue

      // ts = 해당 link 가진 노트들 중 max updatedAt
      let maxTs = ""
      for (const noteId of refs) {
        const n = noteById.get(noteId)
        if (n && n.updatedAt > maxTs) maxTs = n.updatedAt
      }

      items.push({
        kind: "wiki-redlink",
        sourceId: normalized,
        title: redLinkOriginal.get(normalized) ?? normalized,
        ts: maxTs || new Date().toISOString(),
        action: "Create wiki?",
        meta: `${refs.size} notes`,
      })
    }

    // Source: auto-enroll — clusterSuggestions with status === "pending"
    for (const suggestion of (clusterSuggestions ?? [])) {
      if (suggestion.status !== "pending") continue
      if (!isVisible("auto-enroll", suggestion.id)) continue

      const firstTitle = suggestion.conceptTitles[0] ?? "Unnamed cluster"
      const extraCount = suggestion.conceptTitles.length - 1

      items.push({
        kind: "auto-enroll",
        sourceId: suggestion.id,
        title: extraCount > 0 ? `${firstTitle} +${extraCount}` : firstTitle,
        ts: suggestion.createdAt,
        action: "Enroll wiki?",
        meta: `${suggestion.noteIds.length} notes`,
      })
    }

    // 정렬: oldest ts first (overdue 먼저)
    items.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0))

    return items
  }, [notes, dismissedInboxItems, snoozedInboxItems, srsStateByNoteId, wikiArticles, clusterSuggestions])
}
