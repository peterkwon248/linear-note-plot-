/**
 * Inbox Layer (Phase B v117) — Action Notification Queue.
 *
 * Linear-style "내가 반응해야 할 일들" queue. dismiss/snooze are user
 * actions on individual items, identified by (kind, sourceId).
 *
 * `kind` is the **action source** (why is this item in the inbox), not
 * an entity type — see `InboxItemKind`. The `sourceId` is the originating
 * entity ID (note id for reminder/srs/wiki-redlink, snoozed item id for
 * snooze-expired, suggestion id for auto-enroll).
 */

/**
 * Action source for an inbox item. NOT an entity type — describes WHY
 * the item appears in the inbox queue.
 */
export type InboxItemKind =
  | "reminder"        // Note.reviewAt 도래 (today + overdue)
  | "srs"             // SRS scheduled review 도래
  | "snooze-expired"  // 사용자 snooze가 만료된 항목 (self-referential)
  | "wiki-redlink"    // [[새 wiki]] 작성됐는데 article 미생성
  | "auto-enroll"     // clusterSuggestion (자동 등재 제안)

export interface InboxDismissed {
  kind: InboxItemKind
  /** Originating entity ID — note id / wiki id / suggestion id 등 */
  sourceId: string
  dismissedAt: string  // ISO
}

export interface InboxSnoozed {
  kind: InboxItemKind
  sourceId: string
  snoozedUntil: string  // ISO — 만료 시 다시 노출
  snoozedAt: string
}

type Set = (fn: ((state: any) => any) | any) => void

export function createInboxSlice(set: Set) {
  return {
    dismissInbox: (kind: InboxItemKind, sourceId: string): void => {
      set((state: any) => {
        const existing = (state.dismissedInboxItems as InboxDismissed[]).find(
          (item) => item.kind === kind && item.sourceId === sourceId
        )
        if (existing) {
          return {
            dismissedInboxItems: (state.dismissedInboxItems as InboxDismissed[]).map((item) =>
              item.kind === kind && item.sourceId === sourceId
                ? { ...item, dismissedAt: new Date().toISOString() }
                : item
            ),
          }
        }
        return {
          dismissedInboxItems: [
            ...state.dismissedInboxItems,
            { kind, sourceId, dismissedAt: new Date().toISOString() } satisfies InboxDismissed,
          ],
        }
      })
    },

    undoDismissInbox: (kind: InboxItemKind, sourceId: string): void => {
      set((state: any) => ({
        dismissedInboxItems: (state.dismissedInboxItems as InboxDismissed[]).filter(
          (item) => !(item.kind === kind && item.sourceId === sourceId)
        ),
      }))
    },

    snoozeInbox: (kind: InboxItemKind, sourceId: string, until: Date): void => {
      set((state: any) => {
        const now = new Date().toISOString()
        const snoozedUntil = until.toISOString()
        const existing = (state.snoozedInboxItems as InboxSnoozed[]).find(
          (item) => item.kind === kind && item.sourceId === sourceId
        )
        if (existing) {
          return {
            snoozedInboxItems: (state.snoozedInboxItems as InboxSnoozed[]).map((item) =>
              item.kind === kind && item.sourceId === sourceId
                ? { ...item, snoozedUntil, snoozedAt: now }
                : item
            ),
          }
        }
        return {
          snoozedInboxItems: [
            ...state.snoozedInboxItems,
            { kind, sourceId, snoozedUntil, snoozedAt: now } satisfies InboxSnoozed,
          ],
        }
      })
    },

    unsnoozeInbox: (kind: InboxItemKind, sourceId: string): void => {
      set((state: any) => ({
        snoozedInboxItems: (state.snoozedInboxItems as InboxSnoozed[]).filter(
          (item) => !(item.kind === kind && item.sourceId === sourceId)
        ),
      }))
    },

    clearExpiredSnoozed: (): void => {
      set((state: any) => {
        const now = new Date().toISOString()
        return {
          snoozedInboxItems: (state.snoozedInboxItems as InboxSnoozed[]).filter(
            (item) => item.snoozedUntil > now
          ),
        }
      })
    },
  }
}
