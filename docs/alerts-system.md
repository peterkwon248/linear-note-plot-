# Alerts System

## What is the Alerts System?

The Alerts system provides proactive notifications about notes that need attention. Unlike the Review Queue (which is user-initiated — you go to `/review` to see what needs doing), Alerts are ambient: they appear in the sidebar badge and are always computed from current state.

## Why Separate from Review?

Review Queue (`/review`) and Alerts (`/alerts`) serve different purposes:

- **Review** is a daily workflow: "What should I work on today?" It aggregates inbox untriaged, snoozed-due, stale captures, unlinked permanents, SRS due. It uses `getReviewQueue()` from `lib/queries/notes.ts`.
- **Alerts** are proactive notifications: "Something needs your attention NOW." They surface time-sensitive conditions that may need immediate action.

Some conditions appear in both (SRS due, snooze expired), but they serve different UX purposes.

## Alert Types

### 1. SRS Due (`srs-due`)

- **Condition**: Permanent note with SRS state where `dueAt <= now`
- **Severity**: `warning`
- **Message**: `"[title]" is due for SRS review`
- **Skip if**: note is archived or trashed

### 2. Snooze Expired (`snooze-expired`)

- **Condition**: Inbox note with `triageStatus === "snoozed"` and `reviewAt <= now`
- **Severity**: `urgent`
- **Message**: `"[title]" snooze has expired`
- **Skip if**: note is archived or trashed

### 3. Stale Note (`stale-note`)

- **Condition**: Capture note with `lastTouchedAt` more than 7 days ago
- **Severity**: `info` (escalates to `warning` at 14+ days)
- **Message**: `"[title]" hasn't been touched in N days`
- **Skip if**: note is archived or trashed

## Computed Model

Alerts are **derived, not stored**. The function `computeAlerts(notes, srsMap, dismissedIds)` in `lib/alerts.ts` produces a fresh `Alert[]` on every render.

Only `dismissedAlertIds: string[]` is persisted in the store (via the alerts slice at `lib/store/slices/alerts.ts`).

### Why Computed?

- **No stale data**: alerts always reflect current state
- **No migration burden**: adding new alert types doesn't require store migration (only `dismissedAlertIds` is stored)
- **Deterministic**: same input always produces same alerts

### Alert ID Format

IDs are deterministic: `${type}:${noteId}` (e.g., `srs-due:abc123`). This means:

- Dismissing an alert stays dismissed until `clearDismissedAlerts()` is called
- If conditions change (e.g., note gets reviewed), the alert naturally disappears from `computeAlerts()` output

## Persistence Strategy

```
Store (Zustand persist, v19):
  dismissedAlertIds: string[]      # persisted in IDB
  dismissAlert(id: string)         # push to array
  clearDismissedAlerts()           # reset to []

Computation (lib/alerts.ts):
  computeAlerts(notes, srsMap, dismissedIds) → Alert[]
  # Called at render time, filters out dismissed IDs
```

Migration in `lib/store/migrate.ts`:

```typescript
// v19: Alerts — dismissed alert IDs
if (!state.dismissedAlertIds) state.dismissedAlertIds = []
```

## UI Structure

**Page**: `app/(app)/alerts/page.tsx`

- Grouped by alert type (snooze-expired first, then srs-due, then stale-note)
- Each group has a sticky header with type label and count
- Severity dots: urgent=red, warning=amber, info=muted
- Per-alert dismiss button (X icon, revealed on hover)
- "Clear all dismissed" button in page header
- Click a note to show detail panel, double-click to open editor
- Empty state with Bell icon when no active alerts

**Sidebar**: `components/linear-sidebar.tsx`

- Amber badge showing active alert count (between Review and Maps links)
- Badge only shows when count > 0

## Display Config

```typescript
// lib/alerts.ts
ALERT_TYPE_CONFIG: Record<AlertType, { label, colorClass, badgeClass }>
ALERT_TYPE_ORDER: AlertType[]  // display order: snooze-expired, srs-due, stale-note
```

## Future Extension Path

To add a new alert type:

1. Add the type to the `AlertType` union in `lib/types.ts`
2. Add computation logic in `computeAlerts()` in `lib/alerts.ts`
3. Add display config in `ALERT_TYPE_CONFIG` and ordering in `ALERT_TYPE_ORDER`
4. No store migration needed (`dismissedAlertIds` is generic)
