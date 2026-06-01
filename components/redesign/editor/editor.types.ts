import type { ReactNode } from "react"

/**
 * Editor surface view-model — the props contract between the live container
 * (`components/note-editor.tsx` → `NoteEditor`, which reads the store + runs
 * TipTap) and the pure presentational `EditorView` in this folder.
 *
 * SCOPE: editor **chrome / shell only**. The TipTap/ProseMirror engine is NOT
 * ported — the document body is rendered as static mock JSX (see editor.mock).
 * Everything here is plain data: store-derived note fields become strings,
 * i18n labels become literal strings (the mock supplies real ko/en text), icons
 * become ready-made ReactNodes. The presentational component never touches the
 * store, router, i18n, or `@tiptap/*` — it only renders this.
 *
 * Faithful sources:
 *   - header + toolbar mount: components/note-editor.tsx (NoteEditor, L456)
 *   - breadcrumb chrome:      components/editor-breadcrumb.tsx (visual only)
 *   - formatting toolbar:     components/editor/FixedToolbar.tsx
 *   - footers:                ReferencedInBadges (note-editor.tsx L880)
 */

/* ── Breadcrumb (editor-breadcrumb.tsx, visual reproduction) ───────────── */

/** One breadcrumb crumb (space / folder / parent note). */
export interface EditorCrumb {
  id: string
  label: string
}

/* ── Referenced-in badges (note-editor.tsx L880 ReferencedInBadges) ────── */

export interface EditorReferencedIn {
  id: string
  title: string
}

/* ── Meta / properties row (status · priority · tags · date chips) ─────── */

/** 4-stage completeness status — drives the Linear progress-circle glyph. */
export type EditorStatus = "backlog" | "todo" | "in_progress" | "done"

/** 5-tier priority. */
export type EditorPriority = "none" | "low" | "medium" | "high" | "urgent"

export interface EditorTag {
  id: string
  name: string
  /** Hex color for the chip (mock supplies a real PRESET_COLORS value). */
  color: string
}

export interface EditorMeta {
  status: EditorStatus
  /** Localized status label, e.g. "정리 중". */
  statusLabel: string
  priority: EditorPriority
  /** Localized priority label, e.g. "보통". */
  priorityLabel: string
  tags: EditorTag[]
  /** Short relative date, e.g. "3시간 전" (live: shortRelative(updatedAt)). */
  updatedLabel: string
}

/* ── Toolbar (FixedToolbar.tsx) ────────────────────────────────────────── */

/** One formatting toolbar button. `active` paints the toolbar-active token. */
export interface EditorToolbarButton {
  id: string
  /** Tooltip / title text. */
  title: string
  icon: ReactNode
  active?: boolean
  disabled?: boolean
}

/**
 * A divider-separated cluster of toolbar buttons (FixedToolbar ToolbarGroup).
 * Rendered left-to-right with a ToolbarDivider between groups.
 */
export interface EditorToolbarGroup {
  key: string
  buttons: EditorToolbarButton[]
}

/**
 * Document body block — a static approximation of TipTap output. The real
 * editor renders ProseMirror; here we render plain JSX from this descriptor so
 * Open Design sees representative content (headings / paragraphs / list /
 * callout / quote) without the engine.
 */
export type EditorBlock =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "callout"; icon: ReactNode; text: string }

export interface EditorViewModel {
  /** Secondary pane gets back/forward nav + a close button. */
  pane: "primary" | "secondary"
  /** Read mode hides the toolbar + makes the body non-editable (visual only). */
  isReadMode: boolean
  /** Pin state — paints the pin button chart-3 when true. */
  pinned: boolean
  /** Details side-panel open — paints the panel button foreground when true. */
  detailsOpen: boolean
  /** Whether the doc has collapsibles (enables the expand/collapse-all button). */
  hasCollapsibles: boolean
  /** Current expand/collapse-all state (drives the chevron direction). */
  allCollapsed: boolean

  breadcrumb: EditorCrumb[]
  referencedIn: EditorReferencedIn[]

  /** Title (live: first TipTap node). Rendered as a static title input. */
  title: string
  titlePlaceholder: string
  meta: EditorMeta

  toolbarGroups: EditorToolbarGroup[]
  body: EditorBlock[]
}

/** Optional callbacks — default noop in the preview (visual-only handoff). */
export interface EditorViewCallbacks {
  onTogglePin?: () => void
  onToggleReadMode?: () => void
  onToggleDetails?: () => void
  onToggleCollapseAll?: () => void
  onBack?: () => void
  onForward?: () => void
  onClose?: () => void
  onCrumb?: (id: string) => void
  onOpenReferencedIn?: (id: string) => void
  onToolbarAction?: (id: string) => void
}
