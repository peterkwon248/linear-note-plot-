/**
 * Toolbar layout configuration.
 * Defines which toolbar items are visible and in what order.
 * Persisted in settings store.
 */

export interface ToolbarItemConfig {
  id: string
  visible: boolean
}

/**
 * All available toolbar item IDs, matching the groups in FixedToolbar.
 * Each ID maps to a specific button or group in the toolbar.
 */
export const TOOLBAR_ITEM_IDS = [
  "insert",        // InsertMenu (+ button)
  "heading",       // HeadingDropdown (H1-H6)
  "bold",          // Bold
  "italic",        // Italic
  "underline",     // Underline
  "strike",        // Strikethrough
  "superscript",   // Superscript
  "subscript",     // Subscript
  "textColor",     // Text color picker
  "highlight",     // Highlight color picker
  "bulletList",    // Bullet list
  "orderedList",   // Numbered list
  "taskList",      // Checklist
  "indent",        // Indent
  "outdent",       // Outdent
  "moveUp",        // Move list item up
  "moveDown",      // Move list item down
  "removeFormat",  // Remove formatting (Eraser)
  "blockquote",    // Blockquote
  "codeBlock",     // Code Block
  "divider",       // Horizontal rule
  "link",          // Link
  "embed",         // Embed URL (YouTube, audio, or link card)
  "table",         // Table menu
  "textAlign",     // Text alignment dropdown (Left/Center/Right/Justify)
  "undo",          // Undo
  "redo",          // Redo
  "inlineCode",    // Inline code
  "toggle",        // Collapsible section (Details)
  "image",         // Image upload
  "inlineMath",    // Inline math formula
  "blockMath",     // Block math equation
  "date",          // Insert current date
  "hardBreak",     // Line break
] as const

export type ToolbarItemId = typeof TOOLBAR_ITEM_IDS[number]

export interface ToolbarLayout {
  items: ToolbarItemConfig[]
  version: number
}

/** Labels for each toolbar item -- shown in Arrange Mode */
export const TOOLBAR_ITEM_LABELS: Record<ToolbarItemId, string> = {
  insert: "Insert Menu",
  heading: "Heading",
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strike: "Strikethrough",
  superscript: "Superscript",
  subscript: "Subscript",
  textColor: "Text Color",
  highlight: "Highlight",
  bulletList: "Bullet List",
  orderedList: "Numbered List",
  taskList: "Checklist",
  indent: "Indent",
  outdent: "Outdent",
  moveUp: "Move Up",
  moveDown: "Move Down",
  removeFormat: "Remove Formatting",
  blockquote: "Blockquote",
  codeBlock: "Code Block",
  divider: "Divider",
  link: "Link",
  table: "Table",
  textAlign: "Text Align",
  undo: "Undo",
  redo: "Redo",
  inlineCode: "Inline Code",
  toggle: "Toggle (Collapse)",
  image: "Image",
  embed: "Embed URL",
  inlineMath: "Inline Math",
  blockMath: "Block Math",
  date: "Date",
  hardBreak: "Line Break",
}

/** Items hidden by default — niche features accessible via slash command */
const DEFAULT_HIDDEN: Set<string> = new Set(["inlineMath", "blockMath"])

/** Default toolbar layout -- most items visible, niche items hidden */
export const DEFAULT_TOOLBAR_LAYOUT: ToolbarLayout = {
  items: TOOLBAR_ITEM_IDS.map((id) => ({ id, visible: !DEFAULT_HIDDEN.has(id) })),
  version: 2,
}

/**
 * Ensure a layout has all known items.
 * Missing items (new features) get appended as visible.
 * Unknown items (removed features) get filtered out.
 */
export function normalizeLayout(layout: ToolbarLayout): ToolbarLayout {
  const knownIds = new Set<string>(TOOLBAR_ITEM_IDS)
  const existingIds = new Set(layout.items.map((i) => i.id))

  // Filter out unknown items
  const filtered = layout.items.filter((i) => knownIds.has(i.id))

  // Append missing items
  const missing = TOOLBAR_ITEM_IDS
    .filter((id) => !existingIds.has(id))
    .map((id) => ({ id, visible: true }))

  return { items: [...filtered, ...missing], version: layout.version }
}
