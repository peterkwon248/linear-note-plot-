/**
 * Single source of truth for all insertable blocks.
 * Used by SlashCommand, InsertMenu, and ContextMenu.
 */
import type { Editor } from "@tiptap/core"
import type { ComponentType } from "react"
import { detectUrlType } from "@/lib/editor/url-detect"
import { requestEmbedUrl } from "@/lib/editor/embed-url-request"

export interface InsertableBlock {
  id: string
  title: string
  description: string
  /** Phosphor icon component — passed as prop, rendered by consumer */
  iconName: string
  keywords: string[]
  command: (editor: Editor) => void
  category: "text" | "media" | "structure" | "block" | "note" | "math"
}

/**
 * All insertable blocks — the canonical registry.
 *
 * NOTE: Icon components are NOT imported here to keep this file
 * framework-agnostic. Consumers map `iconName` to the actual
 * Phosphor component at render time.
 */
export const INSERTABLE_BLOCKS: InsertableBlock[] = [
  // ── Text / Heading ──────────────────────────────────────
  {
    id: "heading1",
    title: "Heading 1",
    description: "Large section heading",
    iconName: "TextH",
    keywords: ["h1", "heading", "title"],
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    category: "text",
  },
  {
    id: "heading2",
    title: "Heading 2",
    description: "Medium section heading",
    iconName: "TextH",
    keywords: ["h2", "heading", "subtitle"],
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    category: "text",
  },
  {
    id: "heading3",
    title: "Heading 3",
    description: "Small section heading",
    iconName: "TextH",
    keywords: ["h3", "heading"],
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    category: "text",
  },

  // ── Lists ───────────────────────────────────────────────
  {
    id: "bulletList",
    title: "Bullet List",
    description: "Unordered list with bullets",
    iconName: "ListBullets",
    keywords: ["bullet", "list", "unordered", "ul"],
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
    category: "block",
  },
  {
    id: "orderedList",
    title: "Numbered List",
    description: "Ordered list with numbers",
    iconName: "ListNumbers",
    keywords: ["numbered", "list", "ordered", "ol"],
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    category: "block",
  },
  {
    id: "taskList",
    title: "Checklist",
    description: "Task list with checkboxes",
    iconName: "CheckSquare",
    keywords: ["checklist", "task", "todo", "checkbox"],
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
    category: "block",
  },

  // ── Block Elements ──────────────────────────────────────
  {
    id: "blockquote",
    title: "Blockquote",
    description: "Quoted text block",
    iconName: "Quotes",
    keywords: ["quote", "blockquote", "citation"],
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    category: "block",
  },
  {
    id: "codeBlock",
    title: "Code Block",
    description: "Code with syntax highlighting",
    iconName: "Code",
    keywords: ["code", "codeblock", "syntax", "programming"],
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    category: "block",
  },
  {
    id: "toggle",
    title: "Toggle",
    description: "Collapsible section",
    iconName: "CaretRight",
    keywords: ["toggle", "collapse", "details", "summary", "accordion"],
    command: (editor) => editor.chain().focus().setDetails().run(),
    category: "block",
  },
  {
    id: "divider",
    title: "Divider",
    description: "Horizontal divider line",
    iconName: "Minus",
    keywords: ["divider", "separator", "hr", "line"],
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    category: "block",
  },
  {
    id: "bookmark",
    title: "Bookmark",
    description: "Inline anchor marker for navigation",
    iconName: "BookmarkSimple",
    keywords: ["bookmark", "anchor", "marker", "pin"],
    command: (editor) => {
      const { nanoid } = require("nanoid")
      editor.chain().focus().insertContent({
        type: "anchorMark",
        attrs: { id: nanoid(8), label: "" },
      }).run()
    },
    category: "block",
  },
  {
    id: "bookmarkDivider",
    title: "Bookmark Divider",
    description: "Section divider with bookmark label",
    iconName: "BookmarkSimple",
    keywords: ["bookmark", "divider", "section", "anchor"],
    command: (editor) => {
      const { nanoid } = require("nanoid")
      editor.chain().focus().insertContent({
        type: "anchorDivider",
        attrs: { id: nanoid(8), label: "" },
      }).run()
    },
    category: "block",
  },

  // ── Structure ───────────────────────────────────────────
  {
    id: "table",
    title: "Table",
    description: "Insert a 3×3 table",
    iconName: "Table",
    keywords: ["table", "grid", "spreadsheet"],
    command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    category: "structure",
  },

  // ── Media ───────────────────────────────────────────────
  {
    id: "image",
    title: "Image",
    description: "Upload an image",
    iconName: "Image",
    keywords: ["image", "photo", "picture", "upload"],
    command: () => {
      // Handled by InsertMenu file input — slash command triggers the same
    },
    category: "media",
  },
  {
    id: "embed",
    title: "Embed URL",
    description: "Embed a URL (YouTube, audio, or link card)",
    iconName: "LinkSimple",
    keywords: ["embed", "url", "link", "youtube", "video", "audio", "sound"],
    command: (editor) => {
      requestEmbedUrl((url) => {
        if (!url) return
        const type = detectUrlType(url)
        if (type === "youtube") {
          editor.chain().focus().setYoutubeVideo({ src: url }).run()
        } else if (type === "audio") {
          editor.chain().focus().insertContent({ type: "audio", attrs: { src: url } }).run()
        } else {
          editor.chain().focus().insertContent({ type: "linkCard", attrs: { url } }).run()
        }
      })
    },
    category: "media",
  },
  // ── Math ────────────────────────────────────────────────
  {
    id: "inlineMath",
    title: "Inline Math",
    description: "Inline LaTeX formula",
    iconName: "MathOperations",
    keywords: ["math", "latex", "formula", "equation", "inline"],
    command: (editor) => editor.chain().focus().insertContent("$E = mc^2$").run(),
    category: "math",
  },
  {
    id: "blockMath",
    title: "Block Math",
    description: "Display math equation",
    iconName: "MathOperations",
    keywords: ["math", "latex", "formula", "equation", "block", "display"],
    command: (editor) => editor.chain().focus().insertContent("$$\n\\sum_{i=1}^{n} x_i\n$$").run(),
    category: "math",
  },

  // ── Query ───────────────────────────────────────────────
  {
    id: "queryBlock",
    title: "Query",
    description: "Inline filtered notes table",
    iconName: "Database",
    keywords: ["query", "database", "table", "filter", "view", "inline"],
    command: (editor) => {
      const { nanoid } = require("nanoid")
      editor.chain().focus().insertContent({ type: "queryBlock", attrs: { queryId: nanoid(8) } }).run()
    },
    category: "structure",
  },

  // ── Note-specific ───────────────────────────────────────
  {
    id: "date",
    title: "Date",
    description: "Insert current date",
    iconName: "CalendarDots",
    keywords: ["date", "today", "time", "timestamp"],
    command: (editor) => {
      const { format } = require("date-fns")
      editor.chain().focus().insertContent(format(new Date(), "yyyy-MM-dd")).run()
    },
    category: "note",
  },
]

/**
 * Get blocks filtered by category.
 */
export function getBlocksByCategory(category: InsertableBlock["category"]): InsertableBlock[] {
  return INSERTABLE_BLOCKS.filter((b) => b.category === category)
}

/**
 * Get all blocks except those in excluded categories.
 */
export function getBlocksExcluding(...excludeCategories: InsertableBlock["category"][]): InsertableBlock[] {
  return INSERTABLE_BLOCKS.filter((b) => !excludeCategories.includes(b.category))
}
