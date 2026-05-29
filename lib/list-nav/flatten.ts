/**
 * Flatten grouped view results → visible-ordered entity IDs.
 *
 * Used by list/board/grid capture sites to freeze the screen's render order
 * into `ListNavContext.ids`. Mirrors what the user sees:
 *  - List (grouped): group order, notes top→bottom within each group.
 *  - Board: column left→right, cards top→bottom (groups ARE the columns).
 *  - Grid: row-major (callers pass the flat list directly, no grouping).
 *
 * Spec: docs/01-plan/features/list-context-navigation.plan.md §1, §3.
 */

import type { NoteGroup } from "@/lib/view-engine/types"
import type { WikiGroup } from "@/lib/view-engine/wiki-list-pipeline"

/**
 * Flatten note groups (and any sub-groups) into render-ordered IDs.
 * A group with sub-groups defers to them; otherwise its own notes are used.
 */
export function flattenNoteGroupIds(groups: NoteGroup[]): string[] {
  const out: string[] = []
  for (const g of groups) {
    if (g.subGroups && g.subGroups.length > 0) {
      out.push(...flattenNoteGroupIds(g.subGroups))
    } else {
      for (const n of g.notes) out.push(n.id)
    }
  }
  return out
}

/** Flatten wiki groups (board columns / grouped list) into render-ordered IDs. */
export function flattenWikiGroupIds(groups: WikiGroup[]): string[] {
  return groups.flatMap((g) => g.articles.map((a) => a.id))
}
