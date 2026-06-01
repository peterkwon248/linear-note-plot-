import type { ReactNode } from "react"
import type { ActivitySpace, NoteStatus } from "@/lib/types"

/**
 * Sidebar surface view-model — the props contract between the live container
 * (`components/linear-sidebar.tsx`, the 2011-line `LinearSidebar` god that reads
 * 40+ store slices, the router, and i18n) and the pure presentational
 * `SidebarView` in this folder.
 *
 * Everything here is plain data: store-derived counts/lists become numbers and
 * arrays, i18n labels become literal strings (the mock supplies real ko text),
 * icons become ready-made ReactNodes. The presentational component never touches
 * the store, router, or i18n — it only renders this view-model.
 *
 * ── Context-generic by design ───────────────────────────────────────────────
 * The live sidebar switches between **7 contexts** off `useActiveSpace()`:
 *   Notes / Wiki / Calendar / Ontology / Library / Books / Home.
 * Each context is the same skeleton — a global Inbox (pinned top) + an optional
 * top status/kind nav block + Pinned + body sections (folders/more) + Recent —
 * just with different rows. So the view-model models that skeleton ONCE
 * (`SidebarContextModel`) and the presentational renders any context from it.
 *
 * This scaffolding ports **Notes** (full) and **Home** (Inbox + Pinned + Recent)
 * as the two worked contexts. The remaining 5 (Wiki/Calendar/Ontology/Library/
 * Books) follow the identical pattern — see the "후속 추가" note in sidebar-view.
 */

/** Shared shape for a single nav link (`NavLink` in the live file, L78). */
export interface SidebarNavLink {
  /** Stable id used for click callbacks (live: the route, e.g. "/notes"). */
  id: string
  label: string
  icon: ReactNode
  /** Trailing count; undefined hides the count span (live: `count > 0 ? n : undefined`). */
  count?: number
  active?: boolean
}

/** A pinned / recent entity row (shows a status-shape or entity glyph + title). */
export interface SidebarEntityRow {
  /** Stable id used for click callbacks (live: note/wiki/book id). */
  id: string
  title: string
  /** Ready-made leading glyph (live: StatusShapeIcon / IconWiki / BookKindIcon). */
  icon: ReactNode
  /** Optional trailing count (live: book item count); undefined = no count span. */
  count?: number
  /** Whether the row is draggable (live: notes are, wiki/book are not). */
  draggable?: boolean
}

/** A folder row inside the Folders section. */
export interface SidebarFolderRow {
  id: string
  name: string
  /** Trailing count; undefined when 0 (live: `count > 0 && <span>`). */
  count?: number
  active?: boolean
}

/**
 * Folders section view-model. `hiddenCount` drives the "+N more" / "Show less"
 * affordance (live: auto-collapse split of pinned/recent vs stale folders).
 */
export interface SidebarFoldersSection {
  label: string
  /** Label for the "new folder" inline input placeholder (live: "Folder name"). */
  newFolderPlaceholder: string
  folders: SidebarFolderRow[]
  /** Folders beyond the auto-collapse threshold; surfaced via "N more". */
  hiddenCount: number
}

/** A generic body section (Pinned / More / Recent) of plain nav-like rows. */
export interface SidebarSection {
  label: string
  rows: SidebarEntityRow[]
}

/**
 * One context body — everything the sidebar renders BELOW the global Inbox for a
 * given space. Each field is optional so a sparse context (Home = Pinned +
 * Recent only) just omits what it doesn't have.
 */
export interface SidebarContextModel {
  /** Which space this body belongs to (drives `data-active-space` token). */
  space: ActivitySpace
  /**
   * Top status/kind nav block (live: the `<div className="space-y-px">` right
   * under Inbox — All Notes + 4 status links + Pinned for Notes; Overview for
   * Home). Rendered as bare `.a-sb-link`s with no section header.
   */
  topNav: SidebarNavLink[]
  /** Pinned section (cross-entity quick access). Omitted when empty. */
  pinned?: SidebarSection
  /** Folders section. Omitted for contexts without folders (e.g. Home). */
  folders?: SidebarFoldersSection
  /** "More" section (live: Merge/Split/Templates/Insights for Notes). */
  more?: SidebarSection
  /** Recent section. Omitted when empty. */
  recent?: SidebarSection
}

/** The sidebar shell — chrome shared across all contexts. */
export interface SidebarViewModel {
  /** Current space display name (live: `t(\`nav.space.${activeSpace}\`)`). */
  spaceLabel: string
  /** Global Inbox link, pinned to the top across all spaces. */
  inbox: SidebarNavLink
  /** Footer Help button label (live: `t("nav.help")`). */
  helpLabel: string
  /** Footer Help keyboard hint (live: "?"). */
  helpHint: string
  /** Footer Trash aria/title label (live: `t("nav.trash")`). */
  trashLabel: string
}

/** Optional callbacks — default noop in the preview (visual-only handoff). */
export interface SidebarViewCallbacks {
  onCollapse?: () => void
  onOpenInbox?: () => void
  onOpenNav?: (id: string) => void
  onOpenFolder?: (id: string) => void
  onNewFolder?: () => void
  onShowAllFolders?: () => void
  onOpenEntity?: (id: string) => void
  onOpenHelp?: () => void
  onOpenTrash?: () => void
}

export type { ActivitySpace, NoteStatus }
