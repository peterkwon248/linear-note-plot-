/**
 * Shared TipTap Editor Configuration
 *
 * Factory function that produces extension sets for different editor contexts.
 * All extension imports are centralised here so individual editor components
 * only need to call `createEditorExtensions(tier, options)`.
 */

import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Highlight from "@tiptap/extension-highlight"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Color from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import Superscript from "@tiptap/extension-superscript"
import Subscript from "@tiptap/extension-subscript"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import Typography from "@tiptap/extension-typography"
import Dropcursor from "@tiptap/extension-dropcursor"
import CharacterCount from "@tiptap/extension-character-count"
import FontFamily from "@tiptap/extension-font-family"
import Youtube from "@tiptap/extension-youtube"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { common, createLowlight } from "lowlight"
import { Details, DetailsSummary, DetailsContent } from "@tiptap/extension-details"
import Mathematics from "@tiptap/extension-mathematics"
import { Node, Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"

import { TitleNode } from "./title-node"
import { ResizableImage } from "../ResizableImage"

// Custom document node that expects title as first child
const TitleDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "title block+",
})
import { CurrentLineHighlightExtension } from "../CurrentLineHighlight"
import { HashtagSuggestion } from "../HashtagSuggestion"
import { WikilinkSuggestion } from "../WikilinkSuggestion"
import { WikilinkDecorationExtension } from "../WikilinkDecoration"
import { SlashCommandExtension } from "../SlashCommand"
import { WikiQuoteExtension } from "../WikiQuoteExtension"

// ── Lowlight (syntax highlighting for code blocks) ──────────────────
const lowlight = createLowlight(common)

// ── Typewriter Extension ─────────────────────────────────────────────
// Scroll-based typewriter mode: keeps the caret vertically centred
// inside the scroll container.  Only active when Focus Mode is on.
// Uses a ProseMirror plugin so it fires synchronously on every
// transaction — no React render-delay.

const typewriterPluginKey = new PluginKey("typewriter")

const TypewriterExtension = Extension.create<{
  scrollContainerRef: { current: HTMLDivElement | null }
  focusModeRef: { current: boolean }
}>({
  name: "typewriter",

  addOptions() {
    return {
      scrollContainerRef: { current: null } as { current: HTMLDivElement | null },
      focusModeRef: { current: false },
    }
  },

  addProseMirrorPlugins() {
    const { scrollContainerRef, focusModeRef } = this.options
    return [
      new Plugin({
        key: typewriterPluginKey,
        view() {
          return {
            update(view, prevState) {
              // 1. Only active in Focus Mode
              if (!focusModeRef.current) return

              // 2. Skip during IME composition
              if (view.composing) return

              // 3. Only when selection is collapsed (cursor, not range)
              const { selection } = view.state
              if (!selection.empty) return

              // 4. Only when editor is focused
              if (!view.hasFocus()) return

              // 5. Skip if selection hasn't changed position
              if (prevState && prevState.selection.eq(view.state.selection)) return

              const container = scrollContainerRef.current
              if (!container) return

              // 6. Get cursor DOM coordinates
              const coords = view.coordsAtPos(selection.from)
              const containerRect = container.getBoundingClientRect()

              // 7. Calculate center of visible area
              const centerY = containerRect.top + containerRect.height / 2

              // 8. Offset from center
              const offsetFromCenter = coords.top - centerY

              // 9. Threshold: skip micro-adjustments (15% of container height)
              const threshold = containerRect.height * 0.15
              if (Math.abs(offsetFromCenter) < threshold) return

              // 10. Smooth scroll adjustment via requestAnimationFrame
              requestAnimationFrame(() => {
                container.scrollTop += offsetFromCenter
              })
            },
          }
        },
      }),
    ]
  },
})

// ── Types ────────────────────────────────────────────────────────────

export type EditorTier = "base" | "note" | "wiki" | "template"

export interface EditorConfigOptions {
  placeholder?: string
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
  focusModeRef?: React.MutableRefObject<boolean>
  currentLineHighlightRef?: React.MutableRefObject<boolean>
  /** When true, disables StarterKit's built-in document node (for title-document override) */
  disableDocument?: boolean
}

// ── Factory ──────────────────────────────────────────────────────────

function createBaseExtensions(options?: EditorConfigOptions): Extension[] {
  const placeholderText = options?.placeholder ?? "Start writing..."

  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      dropcursor: false,
      codeBlock: false,
      ...(options?.disableDocument ? { document: false } : {}),
    }),
    Placeholder.configure({
      placeholder: ({ node }: { node: { type: { name: string } } }) => {
        if (node.type.name === "title") return ""
        if (node.type.name === "heading") return "Heading"
        if (node.type.name === "codeBlock") return "Write code..."
        return placeholderText
      },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Link.configure({ openOnClick: false }),
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Color,
    TextStyle,
    Superscript,
    Subscript,
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    ResizableImage.configure({ inline: false, allowBase64: true }),
    CodeBlockLowlight.configure({ lowlight }),
    Typography,
    Dropcursor.configure({ color: "var(--accent)", width: 2, class: "drop-cursor" }),
    CharacterCount,
    FontFamily,
    Youtube.configure({ inline: false, allowFullscreen: true, HTMLAttributes: { class: "youtube-embed" } }),
    Details.configure({ HTMLAttributes: { class: "details-block" } }),
    DetailsSummary,
    DetailsContent,
    Mathematics,
  ] as Extension[]
}

/**
 * Create a configured set of TipTap extensions for the given editor tier.
 *
 * - **base**: Core formatting, tables, images, code blocks, etc.
 * - **note**: Full note editing (base + hashtags, wikilinks, slash commands, typewriter, etc.)
 * - **wiki**: Lightweight wiki TextBlock editing (base only)
 * - **template**: Template editing (base + slash commands)
 */
export function createEditorExtensions(
  tier: EditorTier,
  options?: EditorConfigOptions,
): Extension[] {
  const base = createBaseExtensions(options)

  switch (tier) {
    case "base":
    case "wiki":
      return base

    case "note": {
      // For note tier, disable StarterKit's document and use TitleDocument instead
      const noteBase = createBaseExtensions({ ...options, disableDocument: true })
      const noteExtensions: Extension[] = [
        TitleDocument as Extension,
        TitleNode as Extension,
        ...noteBase,
      ]

      // Hashtag & wikilink suggestions
      noteExtensions.push(
        HashtagSuggestion as Extension,
        WikilinkSuggestion as Extension,
        WikilinkDecorationExtension as Extension,
        SlashCommandExtension as Extension,
        WikiQuoteExtension as Extension,
      )

      // Typewriter (requires scrollContainerRef + focusModeRef)
      if (options?.scrollContainerRef && options?.focusModeRef) {
        noteExtensions.push(
          TypewriterExtension.configure({
            scrollContainerRef: options.scrollContainerRef,
            focusModeRef: options.focusModeRef,
          }) as Extension,
        )
      }

      // Current line highlight (requires enabledRef)
      if (options?.currentLineHighlightRef) {
        noteExtensions.push(
          CurrentLineHighlightExtension.configure({
            enabledRef: options.currentLineHighlightRef,
          }) as Extension,
        )
      }

      return noteExtensions
    }

    case "template": {
      return [
        ...base,
        SlashCommandExtension as Extension,
      ]
    }
  }
}

export { TypewriterExtension }
