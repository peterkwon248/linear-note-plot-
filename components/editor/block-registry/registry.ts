/**
 * Block Registry — central definition of all insertable blocks.
 *
 * To add a new block (e.g. Banner, Navigation Box):
 *   1. Add an entry to BLOCK_REGISTRY below with the desired `surfaces`.
 *   2. The slash menu and Insert dropdown pick it up automatically.
 *   3. If you want a FixedToolbar quick-access button, reference it by id
 *      in FixedToolbar.tsx via `callBlock(registry, "yourId", editor)`.
 *
 * Templates are NOT registry entries — they are dynamically loaded from the
 * store in SlashCommand.tsx. Registry is only for static/built-in blocks.
 */

import { format } from "date-fns"
import { nanoid } from "nanoid"
import {
  TextHOne,
  TextHTwo,
  TextHThree,
  ListBullets,
  ListNumbers,
  CheckSquare,
  Quotes,
  Code as PhCode,
  Minus as PhMinus,
  Table as PhTable,
  CaretRight,
  MathOperations,
  Layout,
  Info,
  Article,
  Columns as PhColumns,
  Note as PhNote,
  BookOpen,
  IdentificationCard,
  Cube,
  BookmarkSimple,
  Asterisk,
  Database,
  LinkSimple,
  Book,
  CalendarDots,
  Megaphone,
  Cake,
  Timer,
} from "@/lib/editor/editor-icons"
import { detectUrlType } from "@/lib/editor/url-detect"
import { requestEmbedUrl } from "@/lib/editor/embed-url-request"
import type { BlockRegistryEntry } from "./types"
import { chainWithRange } from "./types"

/** Helper: build column content for N columns. */
function columnCells(count: number) {
  return Array.from({ length: count }, () => ({
    type: "columnCell",
    content: [{ type: "paragraph" }],
  }))
}

export const BLOCK_REGISTRY: readonly BlockRegistryEntry[] = [
  // ── Text ─────────────────────────────────────────────────────────────
  {
    id: "heading-1",
    label: "Heading 1",
    description: "Large heading",
    icon: TextHOne,
    surfaces: ["slash"],
    group: "text",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range).setNode("heading", { level: 1 }).run(),
  },
  {
    id: "heading-2",
    label: "Heading 2",
    description: "Medium heading",
    icon: TextHTwo,
    surfaces: ["slash"],
    group: "text",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range).setNode("heading", { level: 2 }).run(),
  },
  {
    id: "heading-3",
    label: "Heading 3",
    description: "Small heading",
    icon: TextHThree,
    surfaces: ["slash"],
    group: "text",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range).setNode("heading", { level: 3 }).run(),
  },
  {
    id: "bullet-list",
    label: "Bullet List",
    description: "Unordered list",
    icon: ListBullets,
    surfaces: ["slash"],
    group: "text",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range).toggleBulletList().run(),
  },
  {
    id: "numbered-list",
    label: "Numbered List",
    description: "Ordered list",
    icon: ListNumbers,
    surfaces: ["slash"],
    group: "text",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range).toggleOrderedList().run(),
  },
  {
    id: "checklist",
    label: "Checklist",
    description: "Task list with checkboxes",
    icon: CheckSquare,
    surfaces: ["slash"],
    group: "text",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range).toggleTaskList().run(),
  },
  {
    id: "blockquote",
    label: "Blockquote",
    description: "Blockquote",
    icon: Quotes,
    surfaces: ["slash"],
    group: "text",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range).toggleBlockquote().run(),
  },
  {
    id: "code-block",
    label: "Code Block",
    description: "Code with syntax highlighting",
    icon: PhCode,
    surfaces: ["slash", "insertMenu"],
    group: "text",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range).toggleCodeBlock().run(),
  },

  // ── Structure ────────────────────────────────────────────────────────
  {
    id: "table",
    label: "Table",
    description: "3×3 table with header",
    icon: PhTable,
    surfaces: ["slash", "insertMenu"],
    group: "structure",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    id: "query",
    label: "Query",
    description: "Inline filtered notes table",
    icon: Database,
    surfaces: ["slash", "insertMenu"],
    group: "structure",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range)
        .insertContent({ type: "queryBlock", attrs: { queryId: nanoid(8) } })
        .run(),
  },
  {
    id: "toc",
    label: "Table of Contents",
    description: "Auto-generated heading outline",
    aliases: ["toc", "outline"],
    icon: Layout,
    surfaces: ["slash", "insertMenu"],
    group: "structure",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range).insertContent({ type: "tocBlock" }).run(),
  },
  {
    id: "callout",
    label: "Callout",
    description: "Colored info/warning/tip box",
    aliases: ["alert", "note"],
    icon: Info,
    surfaces: ["slash", "insertMenu"],
    group: "structure",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range)
        .insertContent({
          type: "calloutBlock",
          attrs: { calloutType: "info" },
          content: [{ type: "paragraph" }],
        })
        .run(),
  },
  {
    id: "summary",
    label: "Summary",
    description: "Collapsible summary / TL;DR section",
    aliases: ["tldr"],
    icon: Article,
    surfaces: ["slash", "insertMenu"],
    group: "structure",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range)
        .insertContent({
          type: "summaryBlock",
          content: [{ type: "paragraph" }],
        })
        .run(),
  },
  {
    id: "columns-2",
    label: "2 Columns",
    description: "2-column side-by-side layout",
    icon: PhColumns,
    surfaces: ["slash", "insertMenu"],
    group: "structure",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range)
        .insertContent({ type: "columnsBlock", content: columnCells(2) })
        .run(),
  },
  {
    id: "columns-3",
    label: "3 Columns",
    description: "3-column layout",
    icon: PhColumns,
    surfaces: ["slash"],
    group: "structure",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range)
        .insertContent({ type: "columnsBlock", content: columnCells(3) })
        .run(),
  },
  {
    id: "columns-4",
    label: "4 Columns",
    description: "4-column layout",
    icon: PhColumns,
    surfaces: ["slash"],
    group: "structure",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range)
        .insertContent({ type: "columnsBlock", content: columnCells(4) })
        .run(),
  },
  {
    id: "infobox",
    label: "Infobox",
    description: "Key-value info card",
    icon: IdentificationCard,
    surfaces: ["slash", "insertMenu"],
    group: "structure",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range)
        .insertContent({
          type: "infoboxBlock",
          attrs: {
            title: "Info",
            rows: [{ label: "", value: "" }],
          },
        })
        .run(),
  },
  {
    id: "banner",
    label: "Banner",
    description: "Highlighted banner with title and subtitle",
    aliases: ["banner", "hero", "notice", "announce"],
    icon: Megaphone,
    surfaces: ["slash", "insertMenu"],
    group: "structure",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range)
        .insertContent({
          type: "bannerBlock",
          attrs: { title: "Banner title", subtitle: "Subtitle", bgColor: null },
        })
        .run(),
  },
  {
    id: "content-block",
    label: "Block",
    description: "Wrap content in a draggable block",
    icon: Cube,
    surfaces: ["slash"],
    group: "structure",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range)
        .insertContent({
          type: "contentBlock",
          content: [{ type: "paragraph" }],
        })
        .run(),
  },

  // ── Layout ───────────────────────────────────────────────────────────
  {
    id: "divider",
    label: "Divider",
    description: "Horizontal rule",
    aliases: ["hr", "rule"],
    icon: PhMinus,
    surfaces: ["slash", "insertMenu"],
    group: "layout",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range).setHorizontalRule().run(),
  },
  {
    id: "bookmark",
    label: "Bookmark",
    description: "Inline anchor point for quick navigation",
    aliases: ["anchor"],
    icon: BookmarkSimple,
    surfaces: ["slash", "insertMenu"],
    group: "layout",
    tier: "base",
    execute: ({ editor, range }) => {
      // Slash-triggered: blank label, user types next.
      // Menu-triggered: "Bookmark" placeholder (matches previous inline code).
      const label = range ? "Bookmark" : ""
      chainWithRange(editor, range)
        .insertContent({
          type: "anchorMark",
          attrs: { id: nanoid(8), label },
        })
        .run()
    },
  },
  {
    id: "bookmark-divider",
    label: "Bookmark Divider",
    description: "Section divider with bookmark label",
    icon: BookmarkSimple,
    surfaces: ["slash"],
    group: "layout",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range)
        .insertContent({ type: "anchorDivider", attrs: { label: "Section" } })
        .run(),
  },
  {
    id: "toggle",
    label: "Toggle",
    description: "Collapsible content",
    aliases: ["details", "collapse"],
    icon: CaretRight,
    surfaces: ["slash", "insertMenu"],
    group: "layout",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range).setDetails().run(),
  },

  // ── Embed ────────────────────────────────────────────────────────────
  {
    id: "embed-note",
    label: "Embed Note",
    description: "Embed a note preview",
    aliases: ["include", "transclude"],
    icon: PhNote,
    surfaces: ["slash", "insertMenu"],
    group: "embed",
    tier: "base",
    execute: ({ editor, range }) => {
      if (range) editor.chain().focus().deleteRange(range).run()
      // Include editorTier so listeners can route to the correct picker
      const editorTier = editor.schema.nodes.queryBlock ? "note" : "wiki"
      window.dispatchEvent(
        new CustomEvent("plot:embed-note-pick", { detail: { editor, editorTier } }),
      )
    },
  },
  {
    id: "embed-wiki",
    label: "Embed Wiki",
    description: "Embed a wiki article",
    aliases: ["include", "transclude"],
    icon: BookOpen,
    surfaces: ["slash", "insertMenu"],
    group: "embed",
    tier: "base",
    execute: ({ editor, range }) => {
      if (range) editor.chain().focus().deleteRange(range).run()
      // Include editorTier so listeners can route to the correct picker
      const editorTier = editor.schema.nodes.queryBlock ? "note" : "wiki"
      window.dispatchEvent(
        new CustomEvent("plot:embed-wiki-pick", { detail: { editor, editorTier } }),
      )
    },
  },
  {
    id: "embed-url",
    label: "Embed URL",
    description: "Embed YouTube, audio, or link card from a URL",
    aliases: ["youtube", "link"],
    icon: LinkSimple,
    surfaces: ["slash", "insertMenu"],
    group: "embed",
    tier: "base",
    execute: ({ editor, range }) => {
      if (range) editor.chain().focus().deleteRange(range).run()
      requestEmbedUrl((url) => {
        if (!url) return
        const type = detectUrlType(url)
        const chain = editor.chain().focus()
        if (type === "youtube") {
          chain.setYoutubeVideo({ src: url }).run()
        } else if (type === "audio") {
          chain.insertContent({ type: "audio", attrs: { src: url } }).run()
        } else {
          chain.insertContent({ type: "linkCard", attrs: { url } }).run()
        }
      })
    },
  },

  // ── Field ────────────────────────────────────────────────────────────
  {
    id: "footnote",
    label: "Footnote",
    description: "Add a footnote reference",
    icon: Asterisk,
    surfaces: ["slash", "insertMenu"],
    group: "field",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range)
        .insertContent({
          type: "footnoteRef",
          attrs: { id: nanoid(8), content: "", referenceId: null, comment: null },
        })
        .run(),
  },
  {
    id: "reference",
    label: "Reference",
    description: "Add a reference to this note",
    icon: Book,
    surfaces: ["slash", "insertMenu"],
    group: "field",
    tier: "base",
    execute: ({ editor, range }) => {
      if (range) editor.chain().focus().deleteRange(range).run()
      window.dispatchEvent(new CustomEvent("plot:open-reference-picker"))
    },
  },
  {
    id: "date",
    label: "Date",
    description: "Insert today's date",
    aliases: ["today"],
    icon: CalendarDots,
    surfaces: ["insertMenu"],
    group: "field",
    tier: "base",
    execute: ({ editor, range }) =>
      chainWithRange(editor, range)
        .insertContent(format(new Date(), "yyyy-MM-dd"))
        .run(),
  },
  {
    id: "age",
    label: "Age",
    description: "Auto-calculated age from a birth date",
    aliases: ["age", "birthday", "born", "나이", "만나이"],
    icon: Cake,
    surfaces: ["slash", "insertMenu"],
    group: "field",
    tier: "base",
    execute: ({ editor, range }) => {
      // Default to empty so the chip renders "[date]" placeholder until the user picks a DOB.
      const chain = range
        ? editor.chain().focus().deleteRange(range)
        : editor.chain().focus()
      chain.insertContent({ type: "ageMacro", attrs: { date: "" } }).run()
    },
  },
  {
    id: "dday",
    label: "D-Day",
    description: "Countdown to a target date",
    aliases: ["dday", "countdown", "timer", "deadline", "카운트다운"],
    icon: Timer,
    surfaces: ["slash", "insertMenu"],
    group: "field",
    tier: "base",
    execute: ({ editor, range }) => {
      // 기본값: 오늘 + 7일
      const d = new Date()
      d.setDate(d.getDate() + 7)
      const target = d.toISOString().slice(0, 10)
      const chain = range
        ? editor.chain().focus().deleteRange(range)
        : editor.chain().focus()
      chain.insertContent({ type: "ddayMacro", attrs: { date: target, label: null } }).run()
    },
  },

  // ── Math ─────────────────────────────────────────────────────────────
  {
    id: "math-inline",
    label: "Math (Inline)",
    description: "Inline LaTeX equation",
    aliases: ["latex", "equation"],
    icon: MathOperations,
    surfaces: ["slash", "insertMenu"],
    group: "math",
    tier: "base",
    execute: ({ editor, range }) => {
      // Insert with empty latex — NodeView shows "$ math $" placeholder.
      // User clicks the chip to open the Popover and enter LaTeX.
      chainWithRange(editor, range)
        .insertContent({ type: "inlineMath", attrs: { latex: "" } })
        .run()
    },
  },
  {
    id: "math-block",
    label: "Math (Block)",
    description: "Block LaTeX equation",
    aliases: ["latex", "equation"],
    icon: MathOperations,
    surfaces: ["slash", "insertMenu"],
    group: "math",
    tier: "base",
    execute: ({ editor, range }) => {
      // Insert with empty latex — NodeView shows "$$ math $$" placeholder.
      chainWithRange(editor, range)
        .insertContent({ type: "blockMath", attrs: { latex: "" } })
        .run()
    },
  },
]

/** Look up an entry by id. Throws if missing (catches typos at call sites). */
export function getBlock(id: string): BlockRegistryEntry {
  const entry = BLOCK_REGISTRY.find((e) => e.id === id)
  if (!entry) {
    throw new Error(`Block registry: no entry with id="${id}"`)
  }
  return entry
}

/** Filter entries for a given surface + tier. */
export function getBlocksForSurface(
  surface: "slash" | "insertMenu",
  tier: "base" | "note" | "wiki" = "base",
): BlockRegistryEntry[] {
  return BLOCK_REGISTRY.filter(
    (e) =>
      e.surfaces.includes(surface) &&
      // "base" tier appears in both note and wiki editors.
      // Non-base tier entries only appear in their matching editor.
      (e.tier === "base" || e.tier === tier),
  )
}
