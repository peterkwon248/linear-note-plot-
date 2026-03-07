type Set = (fn: ((state: any) => any) | any) => void

export function createAlertsSlice(set: Set) {
  return {
    dismissedAlertIds: [] as string[],

    dismissAlert: (id: string) =>
      set((state: any) => ({
        dismissedAlertIds: [...state.dismissedAlertIds, id],
      })),

    clearDismissedAlerts: () => set({ dismissedAlertIds: [] }),
  }
}
