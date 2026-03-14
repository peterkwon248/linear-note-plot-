import type { ViewContextKey } from "@/lib/view-engine/types"

/* ── Panel Content ─────────────────────────────────────── */

/** Every view type that can live inside a workspace leaf */
export type PanelContent =
  | { type: "editor"; noteId: string | null }
  | { type: "note-list"; context: ViewContextKey; folderId?: string; tagId?: string; labelId?: string }
  | { type: "tags" }
  | { type: "labels" }
  | { type: "activity" }
  | { type: "inspector"; noteId: string; followActive?: boolean }
  | { type: "calendar" }
  | { type: "insights" }
  | { type: "empty" }

/* ── Workspace Tree ────────────────────────────────────── */

export type SplitDirection = "horizontal" | "vertical"

export type DropZone = "center" | "top" | "bottom" | "left" | "right"

export interface WorkspaceTab {
  id: string
  noteId: string
  isPinned?: boolean
}

/** A leaf node — one panel with content */
export interface WorkspaceLeaf {
  kind: "leaf"
  id: string
  content: PanelContent
  /** Editor tabs (only meaningful when content.type === "editor") */
  tabs: WorkspaceTab[]
  activeTabId: string | null
}

/** A branch node — split container with two children */
export interface WorkspaceBranch {
  kind: "branch"
  id: string
  direction: SplitDirection
  children: [WorkspaceNode, WorkspaceNode]
  /** First child's share, 0.0–1.0 */
  ratio: number
}

export type WorkspaceNode = WorkspaceLeaf | WorkspaceBranch

/* ── Presets ────────────────────────────────────────────── */

export type WorkspacePreset =
  | "focus"
  | "list-editor"
  | "editor-only"
  | "dual-editor"
  | "research"

/* ── Helpers ───────────────────────────────────────────── */

export function isLeaf(node: WorkspaceNode): node is WorkspaceLeaf {
  return node.kind === "leaf"
}

export function isBranch(node: WorkspaceNode): node is WorkspaceBranch {
  return node.kind === "branch"
}
