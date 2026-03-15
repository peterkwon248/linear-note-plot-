import type { WorkspaceNode, WorkspacePreset } from "./types"
import { createLeaf, createBranch } from "./tree-utils"

/** Build a workspace tree for a given preset */
export function buildPreset(preset: WorkspacePreset): WorkspaceNode {
  switch (preset) {
    case "focus":
      // Single full-screen editor
      return createLeaf({ type: "editor", noteId: null })

    case "editor-only":
      // Single editor with tab support (same structure as focus, different sidebar behavior)
      return createLeaf({ type: "editor", noteId: null })

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
