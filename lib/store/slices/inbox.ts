import type { EntityKind } from "../../types"

export interface InboxDismissed {
  kind: EntityKind
  id: string
  dismissedAt: string  // ISO
}

export interface InboxSnoozed {
  kind: EntityKind
  id: string
  snoozedUntil: string  // ISO — past snoozed expires automatically
  snoozedAt: string
}

type Set = (fn: ((state: any) => any) | any) => void

export function createInboxSlice(set: Set) {
  return {
    dismissInbox: (kind: EntityKind, id: string): void => {
      set((state: any) => {
        const existing = (state.dismissedInboxItems as InboxDismissed[]).find(
          (item) => item.kind === kind && item.id === id
        )
        if (existing) {
          return {
            dismissedInboxItems: (state.dismissedInboxItems as InboxDismissed[]).map((item) =>
              item.kind === kind && item.id === id
                ? { ...item, dismissedAt: new Date().toISOString() }
                : item
            ),
          }
        }
        return {
          dismissedInboxItems: [
            ...state.dismissedInboxItems,
            { kind, id, dismissedAt: new Date().toISOString() } satisfies InboxDismissed,
          ],
        }
      })
    },

    undoDismissInbox: (kind: EntityKind, id: string): void => {
      set((state: any) => ({
        dismissedInboxItems: (state.dismissedInboxItems as InboxDismissed[]).filter(
          (item) => !(item.kind === kind && item.id === id)
        ),
      }))
    },

    snoozeInbox: (kind: EntityKind, id: string, until: Date): void => {
      set((state: any) => {
        const now = new Date().toISOString()
        const snoozedUntil = until.toISOString()
        const existing = (state.snoozedInboxItems as InboxSnoozed[]).find(
          (item) => item.kind === kind && item.id === id
        )
        if (existing) {
          return {
            snoozedInboxItems: (state.snoozedInboxItems as InboxSnoozed[]).map((item) =>
              item.kind === kind && item.id === id
                ? { ...item, snoozedUntil, snoozedAt: now }
                : item
            ),
          }
        }
        return {
          snoozedInboxItems: [
            ...state.snoozedInboxItems,
            { kind, id, snoozedUntil, snoozedAt: now } satisfies InboxSnoozed,
          ],
        }
      })
    },

    unsnoozeInbox: (kind: EntityKind, id: string): void => {
      set((state: any) => ({
        snoozedInboxItems: (state.snoozedInboxItems as InboxSnoozed[]).filter(
          (item) => !(item.kind === kind && item.id === id)
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
