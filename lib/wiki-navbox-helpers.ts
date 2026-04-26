/**
 * Navbox helpers for PR2 — schema migration + group derivation.
 *
 * Background:
 *   - Pre-PR2 navbox blocks stored manual articles as a flat
 *     `navboxArticleIds: string[]` plus an optional `navboxCategoryId`.
 *   - PR2 introduces a multi-group structure (`navboxGroups: NavboxGroup[]`)
 *     so namuwiki-style multi-tier navboxes work natively.
 *
 *   Block storage lives in IDB (plot-wiki-block-meta) so we cannot run a
 *   synchronous Zustand migration. Instead, components ALWAYS pass through
 *   `deriveNavboxGroups()` which:
 *     1. returns `navboxGroups` verbatim when present.
 *     2. otherwise wraps the legacy single-list into a single default group.
 *
 *   On first user edit (any onUpdate that supplies navboxGroups), the new
 *   shape gets persisted to IDB and the legacy field becomes obsolete.
 */

import { nanoid } from "nanoid"
import type { NavboxGroup, NavboxItem, WikiBlock } from "./types"

/** Build a single default group from a legacy `navboxArticleIds` list. */
export function legacyArticleIdsToGroup(ids: string[] | undefined): NavboxGroup {
  const items: NavboxItem[] = (ids ?? []).map((articleId) => ({
    id: nanoid(),
    label: "",
    targetType: "wiki" as const,
    targetId: articleId,
  }))
  return {
    id: "default",
    label: "",
    labelColor: null,
    itemColor: null,
    collapsedByDefault: false,
    items,
  }
}

/**
 * Returns a normalized `NavboxGroup[]` for any navbox block, regardless of
 * whether it was authored under the legacy or PR2 schema. Always returns a
 * fresh array (safe to mutate / pass downstream).
 */
export function deriveNavboxGroups(block: WikiBlock): NavboxGroup[] {
  if (block.type !== "navbox") return []

  // PR2 path — explicit groups already authored.
  if (block.navboxGroups && block.navboxGroups.length > 0) {
    // Defensive clone, ensure each group has stable id + items array.
    return block.navboxGroups.map<NavboxGroup>((g) => ({
      id: g.id || nanoid(),
      label: g.label ?? "",
      labelColor: g.labelColor ?? null,
      itemColor: g.itemColor ?? null,
      collapsedByDefault: !!g.collapsedByDefault,
      items: (g.items ?? []).map<NavboxItem>((it) => ({
        id: it.id || nanoid(),
        label: it.label ?? "",
        targetType: it.targetType,
        targetId: it.targetId ?? null,
        url: it.url ?? null,
      })),
    }))
  }

  // Legacy path — manual `navboxArticleIds`. Wrap in single group.
  if (block.navboxMode === "manual" && block.navboxArticleIds?.length) {
    return [legacyArticleIdsToGroup(block.navboxArticleIds)]
  }

  // Legacy category mode — no groups (renderer still pulls from category).
  return []
}

/** Generate an empty group with placeholder fields, for the "Add group" button. */
export function makeEmptyGroup(label = ""): NavboxGroup {
  return {
    id: nanoid(),
    label,
    labelColor: null,
    itemColor: null,
    collapsedByDefault: false,
    items: [],
  }
}

/** Generate an empty navbox item. */
export function makeEmptyItem(targetType: NavboxItem["targetType"] = "wiki"): NavboxItem {
  return {
    id: nanoid(),
    label: "",
    targetType,
    targetId: null,
    url: null,
  }
}
