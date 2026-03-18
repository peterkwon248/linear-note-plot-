import type { WorkspaceNode, WorkspacePreset, ResearchPreset } from "./types"
import { createLeaf, createBranch } from "./tree-utils"

/** Build a workspace tree for a given preset */
export function buildPreset(preset: WorkspacePreset): WorkspaceNode {
  switch (preset) {
    case "focus":
      // Single full-screen editor
      return createLeaf({ type: "editor", noteId: null })

    case "editor-only":
      // Single empty launcher — user picks what to open
      return createLeaf({ type: "empty" })

    case "list-editor":
      // Note list (30%) + editor (70%) — note list is inside the workspace tree
      return createBranch("horizontal", [
        createLeaf({ type: "note-list", context: "all" }),
        createLeaf({ type: "editor", noteId: null }),
      ], 0.3)

    case "dual-editor":
      // Horizontal: editor (50%) + editor (50%)
      return createBranch("horizontal", [
        createLeaf({ type: "editor", noteId: null }),
        createLeaf({ type: "editor", noteId: null }),
      ], 0.5)

    case "research":
      // Note list (25%) + [ editor (65%) / tags (35%) ]
      return createBranch("horizontal", [
        createLeaf({ type: "note-list", context: "all" }),
        createBranch("vertical", [
          createLeaf({ type: "editor", noteId: null }),
          createLeaf({ type: "tags" }),
        ], 0.65),
      ], 0.25)

    default:
      return createLeaf({ type: "editor", noteId: null })
  }
}

/** Map from legacy LayoutMode string to workspace preset */
export function layoutModeToPreset(mode: string): WorkspacePreset {
  switch (mode) {
    case "focus": return "focus"
    case "three-column": return "list-editor"
    case "tabs": return "focus"  // "tabs" merged into "focus"
    case "panels": return "dual-editor"
    case "split": return "research"
    default: return "editor-only"
  }
}

/** Human-readable names for presets */
export const PRESET_LABELS: Record<WorkspacePreset, string> = {
  "focus": "Focus",
  "list-editor": "List + Editor",
  "editor-only": "Editor",
  "dual-editor": "Dual Editor",
  "research": "Research",
}

/** Preset descriptions */
export const PRESET_DESCRIPTIONS: Record<WorkspacePreset, string> = {
  "focus": "Distraction-free single editor",
  "list-editor": "Note list with editor side by side",
  "editor-only": "Single editor with tabs",
  "dual-editor": "Two editors side by side",
  "research": "List, editor, and tags for research",
}

/** Keyboard shortcut mapping (Ctrl+1..5) */
export const PRESET_SHORTCUTS: WorkspacePreset[] = [
  "focus",
  "list-editor",
  "editor-only",
  "dual-editor",
  "research",
]

/* ── Research Sub-Presets ─────────────────────────────── */

/** Build a workspace tree for a given research sub-preset */
export function buildResearchPreset(preset: ResearchPreset): WorkspaceNode {
  switch (preset) {
    case "two-cols":
      return createBranch("horizontal", [
        createLeaf({ type: "empty" }),
        createLeaf({ type: "empty" }),
      ], 0.5)

    case "three-cols":
      return createBranch("horizontal", [
        createLeaf({ type: "empty" }),
        createBranch("horizontal", [
          createLeaf({ type: "empty" }),
          createLeaf({ type: "empty" }),
        ], 0.5),
      ], 0.333)

    case "two-rows":
      return createBranch("vertical", [
        createLeaf({ type: "empty" }),
        createLeaf({ type: "empty" }),
      ], 0.5)

    case "left-right2":
      return createBranch("horizontal", [
        createLeaf({ type: "empty" }),
        createBranch("vertical", [
          createLeaf({ type: "empty" }),
          createLeaf({ type: "empty" }),
        ], 0.5),
      ], 0.5)

    case "left2-right":
      return createBranch("horizontal", [
        createBranch("vertical", [
          createLeaf({ type: "empty" }),
          createLeaf({ type: "empty" }),
        ], 0.5),
        createLeaf({ type: "empty" }),
      ], 0.5)

    case "grid-2x2":
      return createBranch("horizontal", [
        createBranch("vertical", [
          createLeaf({ type: "empty" }),
          createLeaf({ type: "empty" }),
        ], 0.5),
        createBranch("vertical", [
          createLeaf({ type: "empty" }),
          createLeaf({ type: "empty" }),
        ], 0.5),
      ], 0.5)

    default:
      return createBranch("horizontal", [
        createLeaf({ type: "empty" }),
        createLeaf({ type: "empty" }),
      ], 0.5)
  }
}

/** Human-readable names for research sub-presets */
export const RESEARCH_PRESET_LABELS: Record<ResearchPreset, string> = {
  "two-cols": "2 Columns",
  "three-cols": "3 Columns",
  "two-rows": "2 Rows",
  "left-right2": "1 + 2 Stack",
  "left2-right": "2 Stack + 1",
  "grid-2x2": "2x2 Grid",
}

/** All research presets in display order */
export const RESEARCH_PRESETS: ResearchPreset[] = [
  "two-cols",
  "three-cols",
  "two-rows",
  "left-right2",
  "left2-right",
  "grid-2x2",
]
