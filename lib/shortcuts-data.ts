/* ── Shared keyboard-shortcut definitions ────────────────
 *  Single source of truth consumed by:
 *    - app/settings/shortcuts/page.tsx  (Settings page)
 *    - components/shortcut-overlay.tsx  (? overlay)
 * ─────────────────────────────────────────────────────── */

export interface ShortcutDef {
  keys: string[]
  description: string
}

export const generalShortcuts: ShortcutDef[] = [
  { keys: ["Ctrl", "K"], description: "Open command palette" },
  { keys: ["Ctrl", "B"], description: "Toggle sidebar" },
  { keys: ["/"], description: "Open search" },
  { keys: ["C"], description: "Create new note" },
  { keys: ["Esc"], description: "Close panel / Clear selection" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
]

export const navShortcuts: ShortcutDef[] = [
  { keys: ["G", "I"], description: "Go to Inbox" },
  { keys: ["G", "C"], description: "Go to Capture" },
  { keys: ["G", "M"], description: "Go to Permanent" },
  { keys: ["G", "N"], description: "Go to All Notes" },
  { keys: ["G", "P"], description: "Go to Projects" },
  { keys: ["G", "V"], description: "Go to Views" },
]

export const editorShortcuts: ShortcutDef[] = [
  { keys: ["Ctrl", "S"], description: "Save note" },
  { keys: ["Ctrl", "Shift", "P"], description: "Pin / Unpin note" },
  { keys: ["Ctrl", "\u232B"], description: "Delete note" },
  { keys: ["Ctrl", "B"], description: "Bold" },
  { keys: ["Ctrl", "I"], description: "Italic" },
  { keys: ["Ctrl", "U"], description: "Underline" },
  { keys: ["Ctrl", "E"], description: "Inline code" },
  { keys: ["Ctrl", "Z"], description: "Undo" },
  { keys: ["Ctrl", "Shift", "Z"], description: "Redo" },
]

export const triageShortcuts: ShortcutDef[] = [
  { keys: ["K"], description: "Keep note (Inbox)" },
  { keys: ["S"], description: "Snooze note (Inbox)" },
  { keys: ["T"], description: "Trash note (Inbox)" },
  { keys: ["P"], description: "Promote to Permanent (Capture)" },
  { keys: ["B"], description: "Move back to Inbox (Capture)" },
  { keys: ["D"], description: "Demote to Capture (Permanent)" },
]
