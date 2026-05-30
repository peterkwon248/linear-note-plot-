import type { PropertyOption } from "./property-def"

/**
 * Dynamic option injection (plan §3, D5).
 *
 * Entity-ref properties (folder / label / tags / category / sticker) have their
 * values populated at runtime from the store. Rather than coupling the schema to
 * Zustand, the view supplies a `HydratorMap` of callbacks — the exact pattern
 * already used by `components/notes-table.tsx:889` (the `useMemo` that maps
 * `NOTES_VIEW_CONFIG.filterCategories` and fills folder/label/tags values+counts
 * from `useStore`). The adapter calls `hydrators[key]?.()` and falls back to an
 * empty array, mirroring today's "static config + runtime hydrate" two-step.
 */

/** Keys an entity-ref property can request a hydrator for. */
export type HydratorKey = "folder" | "label" | "tag" | "category" | "sticker"

/** Callback map injected by the consuming view. A missing key yields `[]`
 *  (same as the current empty `values: []` placeholder in view-configs). */
export type HydratorMap = Partial<Record<HydratorKey, () => PropertyOption[]>>
