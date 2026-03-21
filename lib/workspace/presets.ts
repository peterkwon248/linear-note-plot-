import type { WorkspaceNode, WorkspacePreset } from "./types"
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

    default:
      return createLeaf({ type: "editor", noteId: null })
  }
}

/** Human-readable names for presets */
export const PRESET_LABELS: Record<WorkspacePreset, string> = {
  "focus": "Focus",
  "list-editor": "List + Editor",
  "editor-only": "Editor",
  "dual-editor": "Dual Editor",
}

/** Preset descriptions */
export const PRESET_DESCRIPTIONS: Record<WorkspacePreset, string> = {
  "focus": "Distraction-free single editor",
  "list-editor": "Note list with editor side by side",
  "editor-only": "Single editor with tabs",
  "dual-editor": "Two editors side by side",
}

/** Keyboard shortcut mapping (Ctrl+1..4) */
export const PRESET_SHORTCUTS: WorkspacePreset[] = [
  "focus",
  "list-editor",
  "editor-only",
  "dual-editor",
]
