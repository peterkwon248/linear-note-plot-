"use client"
import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import type { InboxItemKind } from "@/lib/store/slices/inbox"
import { getSnoozeHooks, getSRSHooks, getPlanHooks } from "@/lib/store/hook-selectors"
import { useT } from "@/lib/i18n"
import type { SRSState } from "@/lib/srs"

/**
 * Action-based inbox notification queue (Linear 정합).
 *
 * Each item answers "내가 반응해야 할 일" — *왜* 이게 inbox에 있는가
 * (`kind`)와 그 원본 entity (`sourceId`)를 추적한다. Entity 분류가 아닌
 * action source 기준으로 묶인다 ("정리 안 된 dashboard"가 아님).
 *
 * Sources: reminder / srs / snooze-expired / wiki-redlink / auto-enroll / plan-due.
 *
 * Phase 1c (unified-temporal-hooks-prd §6): each item also carries an
 * intent `section` that maps to the Inbox UI's three columns:
 *  - `do`       — 할 일 (snooze due / plan due / triage / snooze-expired)
 *  - `review`   — 되새김 (SRS — empties is not the goal)
 *  - `detected` — 시스템이 찾은 것 (wiki-redlink / auto-enroll / staleness)
 *
 * Empty `do` + non-empty `review`/`detected` = "Inbox-zero" semantics (Q6).
 */
export type InboxSection = "do" | "review" | "detected"

export interface InboxItem {
  /** Action source — *왜* 이게 inbox에 있는가 */
  kind: InboxItemKind
  /** Intent section the item lives in (PRD §6 mapping). */
  section: InboxSection
  /** 원본 entity ID (note id / wiki id / suggestion id 등) */
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

/** Convenience grouping returned by `useInboxBySection`. */
export interface InboxSections {
  do: InboxItem[]
  review: InboxItem[]
  detected: InboxItem[]
}

/** Map an InboxItemKind to its intent section (PRD §6 mapping). */
function sectionFor(kind: InboxItemKind): InboxSection {
  switch (kind) {
    case "reminder":
    case "plan-due":
    case "snooze-expired":
    case "task":
      return "do"
    case "srs":
      return "review"
    case "wiki-redlink":
    case "auto-enroll":
      return "detected"
  }
}

export function useInbox(): InboxItem[] {
  const notes = usePlotStore((s) => s.notes)
  const dismissedInboxItems = usePlotStore((s) => s.dismissedInboxItems)
  const snoozedInboxItems = usePlotStore((s) => s.snoozedInboxItems)
  const hooks = usePlotStore((s) => s.hooks)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const clusterSuggestions = usePlotStore((s) => s.clusterSuggestions)
  const todoTasks = usePlotStore((s) => s.todoTasks)
  const t = useT()

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
    const wikiById = new Map(wikiArticles.map((a) => [a.id, a]))

    const items: InboxItem[] = []
    const push = (item: Omit<InboxItem, "section">) => {
      items.push({ ...item, section: sectionFor(item.kind) })
    }

    // Source: reminder — snooze hook scheduled <= todayEnd (today + overdue).
    // Phase 1b2: reads from unified `hooks` slice instead of Note.reviewAt.
    for (const h of getSnoozeHooks(hooks)) {
      if (h.target.kind !== "note") continue
      if (h.trigger.kind !== "scheduled") continue
      const note = noteById.get(h.target.id)
      if (!note || note.trashed) continue
      const dueMs = new Date(h.trigger.at).getTime()
      if (dueMs > todayEndMs) continue
      if (!isVisible("reminder", note.id)) continue

      const overdueDays = Math.floor((now - dueMs) / 86_400_000)
      const action =
        overdueDays >= 1 ? t("inbox.action.overdue_days").replace("{count}", String(overdueDays)) :
        dueMs <= now ? t("inbox.action.due_now") :
        t("inbox.action.due_today")

      push({
        kind: "reminder",
        sourceId: note.id,
        title: note.title || t("common.untitled"),
        ts: h.trigger.at,
        action,
      })
    }

    // Source: srs — SRS scheduled review 도래 (state.srsState.dueAt <= now).
    // Phase 1b2: reads from unified `hooks` slice instead of srsStateByNoteId.
    for (const h of getSRSHooks(hooks)) {
      if (h.target.kind !== "note") continue
      const srs: SRSState | undefined =
        h.trigger.kind === "srs"
          ? h.trigger.srsState
          : (h.state as { srsState?: SRSState } | undefined)?.srsState
      if (!srs) continue
      const dueMs = new Date(srs.dueAt).getTime()
      if (dueMs > now) continue
      if (!isVisible("srs", h.target.id)) continue
      const note = noteById.get(h.target.id)
      if (!note || note.trashed) continue

      const overdueDays = Math.floor((now - dueMs) / 86_400_000)
      const action = overdueDays >= 1
        ? t("inbox.action.review_overdue").replace("{count}", String(overdueDays))
        : t("inbox.action.review_now")

      push({
        kind: "srs",
        sourceId: h.target.id,
        title: note.title || t("common.untitled"),
        ts: srs.dueAt,
        action,
      })
    }

    // Source: plan-due — wiki article plan hook scheduled <= todayEnd.
    // Phase 1c: planned dates that hit "today or overdue" land in Do. Future
    // plans stay on the timeline only (pull surface, see PRD §6.2).
    for (const h of getPlanHooks(hooks)) {
      if (h.target.kind !== "wiki") continue
      if (h.trigger.kind !== "scheduled") continue
      const article = wikiById.get(h.target.id)
      if (!article || article.trashed) continue
      const dueMs = new Date(h.trigger.at).getTime()
      if (dueMs > todayEndMs) continue
      if (!isVisible("plan-due", article.id)) continue

      const overdueDays = Math.floor((now - dueMs) / 86_400_000)
      const action =
        overdueDays >= 1 ? t("inbox.action.overdue_days").replace("{count}", String(overdueDays)) :
        dueMs <= now ? t("inbox.action.plan_due_now") :
        t("inbox.action.plan_due_today")

      push({
        kind: "plan-due",
        sourceId: article.id,
        title: article.title || t("common.untitled"),
        ts: h.trigger.at,
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
      const title = note ? (note.title || t("common.untitled")) : snoozed.sourceId

      push({
        kind: "snooze-expired",
        sourceId: snoozed.sourceId,
        title,
        ts: snoozed.snoozedUntil,
        action: t("inbox.action.snooze_ended"),
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

      push({
        kind: "wiki-redlink",
        sourceId: normalized,
        title: redLinkOriginal.get(normalized) ?? normalized,
        ts: maxTs || new Date().toISOString(),
        action: t("inbox.action.create_wiki"),
        meta: t("inbox.meta.notes_count").replace("{count}", String(refs.size)),
      })
    }

    // Source: task — incomplete checkbox in any note body (Phase α-1 Inbox
    // 흡수). Memory parked → LOCKED: Todos 별도 view 폐기 방향으로 가는 첫
    // step. todoTasks는 todo-index가 자동 rebuild (노트 본문 walk).
    // sourceId = task.id (composite noteId:position), title = task.text,
    // meta = source note title, ts = note.updatedAt (task 자체 ts 없음).
    for (const task of todoTasks) {
      if (task.checked) continue
      if (!isVisible("task", task.id)) continue

      // Phase α-2: task의 origin은 노트 또는 위키 article. entityKind 기준 분기
      // (default "note" for α-1 backward compat).
      if (task.entityKind === "wiki") {
        const wiki = wikiById.get(task.noteId)
        if (!wiki || wiki.trashed) continue
        push({
          kind: "task",
          sourceId: task.id,
          title: task.text || t("common.untitled_task"),
          ts: wiki.updatedAt,
          meta: wiki.title || t("common.untitled"),
        })
        continue
      }

      const note = noteById.get(task.noteId)
      if (!note || note.trashed) continue

      // "Quick Tasks" auto-generated note title → localized label.
      // Keep the underlying note title as English (data) so existing
      // store lookups (find by title === "Quick Tasks") still work.
      const sourceLabel =
        note.title === "Quick Tasks"
          ? t("todos.quick_tasks_note")
          : note.title || t("common.untitled")

      push({
        kind: "task",
        sourceId: task.id,
        title: task.text || t("common.untitled_task"),
        ts: note.updatedAt,
        meta: sourceLabel,
      })
    }

    // Source: auto-enroll — clusterSuggestions with status === "pending"
    for (const suggestion of (clusterSuggestions ?? [])) {
      if (suggestion.status !== "pending") continue
      if (!isVisible("auto-enroll", suggestion.id)) continue

      const firstTitle = suggestion.conceptTitles[0] ?? "Unnamed cluster"
      const extraCount = suggestion.conceptTitles.length - 1

      push({
        kind: "auto-enroll",
        sourceId: suggestion.id,
        title: extraCount > 0 ? `${firstTitle} +${extraCount}` : firstTitle,
        ts: suggestion.createdAt,
        action: t("inbox.action.enroll_wiki"),
        meta: t("inbox.meta.notes_count").replace("{count}", String(suggestion.noteIds.length)),
      })
    }

    // 정렬: oldest ts first (overdue 먼저)
    items.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0))

    return items
  }, [notes, dismissedInboxItems, snoozedInboxItems, hooks, wikiArticles, clusterSuggestions, todoTasks, t])
}

/**
 * Group the flat InboxItem list by intent section (PRD §6). Empty sections
 * still surface in the UI — Q6 RESOLVED: Review/Detected are "영원" and the
 * three cards always render, even when empty.
 */
export function useInboxBySection(): InboxSections {
  const items = useInbox()
  return useMemo(() => {
    const out: InboxSections = { do: [], review: [], detected: [] }
    for (const item of items) out[item.section].push(item)
    return out
  }, [items])
}
