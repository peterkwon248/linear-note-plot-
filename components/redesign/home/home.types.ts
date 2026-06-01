import type { ReactNode } from "react"

/**
 * Home surface view-model — the props contract between the live container
 * (`components/views/home-view.tsx`, which reads the store) and the pure
 * presentational `HomeView` in this folder.
 *
 * Everything here is plain data: store-derived counts/lists become numbers and
 * arrays, i18n labels become literal strings (the mock supplies real ko/en
 * text), icons become ready-made ReactNodes. The presentational component never
 * touches the store, router, or i18n — it only renders this.
 */

/** One stats tile (e.g. Notes · 42 · "70% linked"). */
export interface HomeStatItem {
  /** Stable id used for click callbacks (live: the route, e.g. "/notes"). */
  id: string
  label: string
  value: number
  /** Small muted sub-line; "" when absent (renders a non-collapsing space). */
  sub: string
  /** Tailwind text-color class from KNOWLEDGE_INDEX_COLORS (e.g. its `.text`). */
  colorClass: string
  /** Tailwind bg class from KNOWLEDGE_INDEX_COLORS (e.g. its `.bg`). */
  bgClass: string
  icon: ReactNode
}

/** Stats group — 자산 3분류 (본체 / 분류 / 출처). */
export interface HomeStatGroup {
  key: string
  label: string
  items: HomeStatItem[]
}

/** Most Connected row. */
export interface HomeConnectedItem {
  id: string
  title: string
  /** e.g. "12 links". */
  meta: string
}

/** Most Visited ranked row (cross-entity: note | book). */
export interface HomeVisitedItem {
  id: string
  rank: number
  icon: ReactNode
  title: string
  count: number
}

/** Quicklink card (pinned note/wiki/folder/view/bookmark/book). */
export interface HomeQuicklink {
  key: string
  title: string
  /** e.g. "Note · 2h ago". */
  meta: string
  icon: ReactNode
  /** Tailwind bg+text class pair for the icon chip (colorForKind). */
  colorClass: string
}

export interface HomeViewModel {
  capturePlaceholder: string
  knowledgeBaseLabel: string
  statGroups: HomeStatGroup[]
  mostConnected: { label: string; items: HomeConnectedItem[] }
  mostVisited: { label: string; items: HomeVisitedItem[] }
  quicklinksLabel: string
  quicklinks: HomeQuicklink[]
  ctaLabel: string
}

/** Optional callbacks — default noop in the preview (visual-only handoff). */
export interface HomeViewCallbacks {
  onCapture?: (text: string) => void
  onOpenStat?: (id: string) => void
  onOpenConnected?: (id: string) => void
  onOpenVisited?: (id: string) => void
  onOpenQuicklink?: (key: string) => void
  onJumpToInbox?: () => void
}
