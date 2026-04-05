/**
 * Shared TipTap Editor Configuration
 *
 * Factory function that produces extension sets for different editor contexts.
 * All extension imports are centralised here so individual editor components
 * only need to call `createEditorExtensions(tier, options)`.
 */

import { InputRule } from "@tiptap/core"
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
import Gapcursor from "@tiptap/extension-gapcursor"
import CharacterCount from "@tiptap/extension-character-count"
import FontFamily from "@tiptap/extension-font-family"
import Youtube from "@tiptap/extension-youtube"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { common, createLowlight } from "lowlight"
import { Details, DetailsSummary, DetailsContent } from "@tiptap/extension-details"
import Mathematics from "@tiptap/extension-mathematics"
import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import { CellSelection, deleteRow as pmDeleteRow, deleteColumn as pmDeleteColumn } from "prosemirror-tables"

import { ResizableImage } from "../ResizableImage"
import {
  indentCommand,
  outdentCommand,
  moveListItemUp,
  moveListItemDown,
} from "../commands/custom-commands"

import { CurrentLineHighlightExtension } from "../CurrentLineHighlight"
import { HashtagSuggestion } from "../HashtagSuggestion"
import { WikilinkSuggestion } from "../WikilinkSuggestion"
import { WikilinkDecorationExtension } from "../WikilinkDecoration"
import { mentionSuggestionConfig } from "../MentionSuggestion"
import { SlashCommandExtension } from "../SlashCommand"
import { WikiQuoteExtension } from "../WikiQuoteExtension"
import { Mention } from "@tiptap/extension-mention"
import { Emoji } from "@tiptap/extension-emoji"
import { InvisibleCharacters } from "@tiptap/extension-invisible-characters"
import { Audio } from "@tiptap/extension-audio"
import { Twitch } from "@tiptap/extension-twitch"
import { UniqueID } from "@tiptap/extension-unique-id"
import { FileHandler } from "@tiptap/extension-file-handler"
import { TableOfContents } from "@tiptap/extension-table-of-contents"
import { TocBlockNode } from "@/components/editor/nodes/toc-node"
import { CalloutBlockNode } from "@/components/editor/nodes/callout-node"
import { SummaryBlockNode } from "@/components/editor/nodes/summary-node"
import { ColumnsBlockNode, ColumnCellNode } from "@/components/editor/nodes/columns-node"
import { NoteEmbedNode } from "@/components/editor/nodes/note-embed-node"
import { InfoboxBlockNode } from "@/components/editor/nodes/infobox-node"
import { ContentBlockNode } from "@/components/editor/nodes/content-block-node"
import { AnchorMarkNode } from "@/components/editor/nodes/anchor-node"
import { AnchorDividerNode } from "@/components/editor/nodes/anchor-divider-node"
import { QueryBlockNode } from "@/components/editor/nodes/query-node"
import { handleMentionClick } from "@/lib/note-reference-actions"
import { showNotePreviewById, hideNotePreview, togglePreviewPin, isPreviewShowing } from "@/components/editor/note-hover-preview"

// ── Mention Interaction Extension ────────────────────────────────────
// Adds hover preview + click (Peek) + Ctrl+click (navigate) to @mentions.
// Uses DOM event delegation on the editor view.

const MentionInteractionExtension = Extension.create({
  name: "mentionInteraction",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("mentionInteraction"),
        props: {
          handleDOMEvents: {
            mousedown(_view, event) {
              const target = (event.target as HTMLElement).closest(".mention") as HTMLElement | null
              if (!target) return false
              if (target.closest("[data-hover-preview]")) return false

              const id = target.getAttribute("data-id")
              if (!id) return false

              // Toggle pin if preview is showing for this mention
              if (isPreviewShowing(id)) {
                event.preventDefault()
                event.stopPropagation()
                togglePreviewPin()
                return true
              }

              // Normal click → peek/navigate (use setTimeout to let mousedown complete)
              setTimeout(() => handleMentionClick(id, event), 0)
              return true
            },

            mouseover(_view, event) {
              const target = (event.target as HTMLElement).closest(".mention") as HTMLElement | null
              if (!target) return false
              if (target.closest("[data-hover-preview]")) return false

              const id = target.getAttribute("data-id")
              if (!id) return false

              showNotePreviewById(target, id)
              return false
            },

            mouseout(_view, event) {
              const target = (event.target as HTMLElement).closest(".mention") as HTMLElement | null
              if (!target) return false
              if (target.closest("[data-hover-preview]")) return false
              hideNotePreview()
              return false
            },
          },
        },
      }),
    ]
  },
})

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
}

// ── Factory ──────────────────────────────────────────────────────────

function createBaseExtensions(options?: EditorConfigOptions): Extension[] {
  const placeholderText = options?.placeholder ?? "Start writing..."

  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      dropcursor: false,
      codeBlock: false,
    }),
    Placeholder.configure({
      placeholder: ({ node }: { node: { type: { name: string } } }) => {
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
    TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
    Color,
    TextStyle, // also handles fontSize via style attribute
    Superscript,
    Subscript,
    Table.configure({ resizable: true }),
    TableRow,
    TableCell.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          backgroundColor: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
            renderHTML: (attrs: Record<string, unknown>) => {
              if (!attrs.backgroundColor) return {}
              return { style: `background-color: ${attrs.backgroundColor}` }
            },
          },
        }
      },
    }),
    TableHeader.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          backgroundColor: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
            renderHTML: (attrs: Record<string, unknown>) => {
              if (!attrs.backgroundColor) return {}
              return { style: `background-color: ${attrs.backgroundColor}` }
            },
          },
        }
      },
    }),
    ResizableImage.configure({ inline: false, allowBase64: true }),
    CodeBlockLowlight.configure({ lowlight }),
    Typography,
    Dropcursor.configure({ color: "transparent", width: 40, class: "drop-cursor" }),
    Gapcursor,
    CharacterCount,
    FontFamily,
    Youtube.configure({ inline: false, allowFullscreen: true, HTMLAttributes: { class: "youtube-embed" } }),
    Details.configure({ HTMLAttributes: { class: "details-block" }, persist: true }),
    DetailsSummary,
    DetailsContent,
    // Toggle delete: use right-click "Delete Block" or Backspace/Delete key
    Mathematics,
    // Single-dollar $...$ inline math input rule (Mathematics only supports $$...$$)
    Extension.create({
      name: "singleDollarMath",
      addInputRules() {
        const inlineMathType = this.editor.schema.nodes.inlineMath
        if (!inlineMathType) return []
        return [
          new InputRule({
            find: /(^|[^$])\$([^$\n]+?)\$$/,
            handler: ({ state, range, match }) => {
              const latex = match[2]
              if (!latex?.trim()) return
              const { tr } = state
              // Adjust range to not include the prefix character
              const prefixLength = match[1]?.length ?? 0
              const start = range.from + prefixLength
              const end = range.to
              tr.replaceWith(start, end, inlineMathType.create({ latex: latex.trim() }))
            },
          }),
        ]
      },
    }),
    // -- New extensions (Phase 1C+) --
    Audio,
    Twitch,
    UniqueID.configure({
      types: ['heading', 'paragraph', 'codeBlock', 'image', 'table', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'details', 'horizontalRule', 'tocBlock', 'calloutBlock', 'summaryBlock', 'columnsBlock', 'noteEmbed', 'infoboxBlock', 'contentBlock', 'anchorMark', 'anchorDivider', 'queryBlock'],
    }),
    InvisibleCharacters.configure({
      visible: false, // disabled by default, toggled via toolbar
    }),
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
/** Inject X delete buttons into .details-block elements */
function injectDetailsDeleteButtons(editor: any) {
  if (!editor?.view?.dom || !editor.isEditable) return;
  editor.view.dom.querySelectorAll('[data-type="details"], .details-block').forEach((block: HTMLElement) => {
    if (block.querySelector(".details-delete-btn")) return;
    block.style.position = "relative";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "details-delete-btn";
    btn.title = "Remove toggle";
    btn.textContent = "\u2715";
    Object.assign(btn.style, {
      position: "absolute", top: "4px", right: "6px", zIndex: "2",
      width: "22px", height: "22px", display: "flex", alignItems: "center",
      justifyContent: "center", background: "none", border: "none",
      cursor: "pointer", borderRadius: "4px", fontSize: "11px",
      color: "var(--muted-foreground)", opacity: "0", transition: "opacity 0.15s, color 0.15s",
    });
    block.addEventListener("mouseenter", () => { btn.style.opacity = "0.5"; });
    block.addEventListener("mouseleave", () => { btn.style.opacity = "0"; });
    btn.addEventListener("mouseenter", () => { btn.style.opacity = "1"; btn.style.color = "var(--destructive)"; });
    btn.addEventListener("mouseleave", () => { btn.style.opacity = "0.5"; btn.style.color = "var(--muted-foreground)"; });
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      try {
        const pos = editor.view.posAtDOM(block, 0);
        if (pos == null) return;
        const $pos = editor.state.doc.resolve(pos);
        for (let d = $pos.depth; d >= 0; d--) {
          if ($pos.node(d).type.name === "details") {
            const start = $pos.start(d) - 1;
            const node = $pos.node(d);
            editor.chain().focus().deleteRange({ from: start, to: start + node.nodeSize }).run();
            return;
          }
        }
      } catch { /* ignore */ }
    });
    block.appendChild(btn);
  });
}

export function createEditorExtensions(
  tier: EditorTier,
  options?: EditorConfigOptions,
): Extension[] {
  const base = createBaseExtensions(options)

  switch (tier) {
    case "base":
      return base

    case "wiki": {
      const wikiExtensions: Extension[] = [...base]

      // Slash commands + WikiQuote for wiki text blocks
      wikiExtensions.push(
        SlashCommandExtension as Extension,
        WikiQuoteExtension as Extension,
      )

      // Custom block nodes (shared with note tier)
      wikiExtensions.push(CalloutBlockNode as Extension)
      wikiExtensions.push(SummaryBlockNode as Extension)
      wikiExtensions.push(ColumnsBlockNode as Extension)
      wikiExtensions.push(ColumnCellNode as Extension)
      wikiExtensions.push(InfoboxBlockNode as Extension)
      wikiExtensions.push(ContentBlockNode as Extension)
      wikiExtensions.push(AnchorMarkNode as Extension)
      wikiExtensions.push(AnchorDividerNode as Extension)

      // Custom keyboard shortcuts (Tab indent, column navigation, etc.)
      const WikiKeyboardShortcuts = Extension.create({
        name: "customKeyboardShortcuts",
        priority: 1000,
        addKeyboardShortcuts() {
          return {
            Tab: ({ editor: e }) => {
              const { $from } = e.state.selection
              for (let d = $from.depth; d >= 0; d--) {
                if ($from.node(d).type.name === "columnCell") {
                  const parent = $from.node(d - 1)
                  if (parent?.type.name === "columnsBlock") {
                    const parentStart = $from.start(d - 1)
                    const cellIndex = $from.index(d - 1)
                    if (cellIndex + 1 < parent.childCount) {
                      let nextCellStart = parentStart
                      for (let i = 0; i <= cellIndex; i++) {
                        nextCellStart += parent.child(i).nodeSize
                      }
                      e.commands.setTextSelection(nextCellStart + 1)
                      return true
                    }
                  }
                  break
                }
              }
              if (e.isActive("table")) return e.commands.goToNextCell()
              return indentCommand(e)
            },
            "Shift-Tab": ({ editor: e }) => {
              const { $from } = e.state.selection
              for (let d = $from.depth; d >= 0; d--) {
                if ($from.node(d).type.name === "columnCell") {
                  const parent = $from.node(d - 1)
                  if (parent?.type.name === "columnsBlock") {
                    const parentStart = $from.start(d - 1)
                    const cellIndex = $from.index(d - 1)
                    if (cellIndex > 0) {
                      let prevCellStart = parentStart
                      for (let i = 0; i < cellIndex - 1; i++) {
                        prevCellStart += parent.child(i).nodeSize
                      }
                      e.commands.setTextSelection(prevCellStart + 1)
                      return true
                    }
                  }
                  break
                }
              }
              if (e.isActive("table")) return e.commands.goToPreviousCell()
              return outdentCommand(e)
            },
            "Alt-Shift-ArrowUp": ({ editor: e }) => moveListItemUp(e),
            "Alt-Shift-ArrowDown": ({ editor: e }) => moveListItemDown(e),
            Backspace: ({ editor: e }) => {
              const { $from } = e.state.selection
              if ($from.parent.type.name === "heading" && $from.parentOffset === 0) {
                return e.commands.setParagraph()
              }
              if (
                $from.parent.type.name === "paragraph" &&
                $from.parent.textContent === "" &&
                $from.parentOffset === 0
              ) {
                const resolvedPos = e.state.doc.resolve($from.before($from.depth))
                const indexInDoc = resolvedPos.index(0)
                if (indexInDoc > 0) {
                  const prevNode = e.state.doc.child(indexInDoc - 1)
                  if (prevNode.type.name === "table") {
                    const tableStart = $from.before($from.depth) - prevNode.nodeSize
                    const paraEnd = $from.after($from.depth)
                    const { tr } = e.state
                    tr.delete(tableStart, paraEnd)
                    e.view.dispatch(tr)
                    return true
                  }
                }
              }
              return false
            },
          }
        },
      })
      wikiExtensions.push(WikiKeyboardShortcuts as Extension)

      // Table keyboard (Delete key for row/col delete)
      const WikiTableKeyboard = Extension.create({
        name: "tableKeyboard",
        addProseMirrorPlugins() {
          return [
            new Plugin({
              key: new PluginKey("tableKeyboard"),
              props: {
                handleKeyDown(view, event) {
                  if (event.key !== "Delete") return false
                  const { state, dispatch } = view
                  const { selection } = state
                  if (!(selection instanceof CellSelection)) return false
                  const text = state.doc.textBetween(selection.from, selection.to).trim()
                  if (text !== "") return false
                  if (selection.isRowSelection()) return pmDeleteRow(state, dispatch)
                  if (selection.isColSelection()) return pmDeleteColumn(state, dispatch)
                  if (pmDeleteRow(state)) return pmDeleteRow(state, dispatch)
                  if (pmDeleteColumn(state)) return pmDeleteColumn(state, dispatch)
                  return false
                },
              },
            }),
          ]
        },
      })
      wikiExtensions.push(WikiTableKeyboard as Extension)

      return wikiExtensions
    }

    case "note": {
      const noteExtensions: Extension[] = [
        ...base,
      ]

      // Hashtag & wikilink suggestions
      noteExtensions.push(
        HashtagSuggestion as Extension,
        WikilinkSuggestion as Extension,
        WikilinkDecorationExtension as Extension,
        SlashCommandExtension as Extension,
        WikiQuoteExtension as Extension,
      )
      noteExtensions.push(
        Mention.configure({
          HTMLAttributes: { class: 'mention' },
          suggestion: mentionSuggestionConfig,
        }) as Extension,
        MentionInteractionExtension as Extension,
        Emoji as Extension,
      )
      // File drag-and-drop handler
      noteExtensions.push(
        FileHandler.configure({
          onDrop: () => {
            // TODO: Wire up file drop to attachment system (PR 3)
            return false
          },
          onPaste: () => {
            // TODO: Wire up file paste to attachment system (PR 3)
            return false
          },
        }) as Extension,
      )
      noteExtensions.push(
        TableOfContents as Extension,
      )
      noteExtensions.push(TocBlockNode as Extension)
      noteExtensions.push(CalloutBlockNode as Extension)
      noteExtensions.push(SummaryBlockNode as Extension)
      noteExtensions.push(ColumnsBlockNode as Extension)
      noteExtensions.push(ColumnCellNode as Extension)
      noteExtensions.push(NoteEmbedNode as Extension)
      noteExtensions.push(InfoboxBlockNode as Extension)
      noteExtensions.push(ContentBlockNode as Extension)
      noteExtensions.push(AnchorMarkNode as Extension)
      noteExtensions.push(AnchorDividerNode as Extension)
      noteExtensions.push(QueryBlockNode as Extension)

      // Custom keyboard shortcuts (Indent/Outdent, Move List)
      const CustomKeyboardShortcuts = Extension.create({
        name: "customKeyboardShortcuts",
        priority: 1000, // Higher priority to override default handlers
        addKeyboardShortcuts() {
          return {
            Tab: ({ editor: e }) => {
              // In columnCell → move to next sibling columnCell
              const { $from } = e.state.selection
              for (let d = $from.depth; d >= 0; d--) {
                if ($from.node(d).type.name === "columnCell") {
                  const parent = $from.node(d - 1)
                  if (parent?.type.name === "columnsBlock") {
                    const parentStart = $from.start(d - 1)
                    const cellIndex = $from.index(d - 1)
                    if (cellIndex + 1 < parent.childCount) {
                      let nextCellStart = parentStart
                      for (let i = 0; i <= cellIndex; i++) {
                        nextCellStart += parent.child(i).nodeSize
                      }
                      // +1 to enter inside the columnCell node
                      e.commands.setTextSelection(nextCellStart + 1)
                      return true
                    }
                  }
                  break
                }
              }
              // In table → go to next cell (TipTap default)
              if (e.isActive("table")) return e.commands.goToNextCell()
              return indentCommand(e)
            },
            "Shift-Tab": ({ editor: e }) => {
              // In columnCell → move to previous sibling columnCell
              const { $from } = e.state.selection
              for (let d = $from.depth; d >= 0; d--) {
                if ($from.node(d).type.name === "columnCell") {
                  const parent = $from.node(d - 1)
                  if (parent?.type.name === "columnsBlock") {
                    const parentStart = $from.start(d - 1)
                    const cellIndex = $from.index(d - 1)
                    if (cellIndex > 0) {
                      let prevCellStart = parentStart
                      for (let i = 0; i < cellIndex - 1; i++) {
                        prevCellStart += parent.child(i).nodeSize
                      }
                      // +1 to enter inside the columnCell node
                      e.commands.setTextSelection(prevCellStart + 1)
                      return true
                    }
                  }
                  break
                }
              }
              // In table → go to previous cell
              if (e.isActive("table")) return e.commands.goToPreviousCell()
              return outdentCommand(e)
            },
            "Alt-Shift-ArrowUp": ({ editor: e }) => moveListItemUp(e),
            "Alt-Shift-ArrowDown": ({ editor: e }) => moveListItemDown(e),
            // Backspace at start of heading → convert to paragraph (UpNote style)
            Backspace: ({ editor: e }) => {
              const { $from } = e.state.selection

              // Heading → paragraph
              if (
                $from.parent.type.name === "heading" &&
                $from.parentOffset === 0
              ) {
                return e.commands.setParagraph()
              }

              // Empty paragraph after table → delete paragraph + table
              if (
                $from.parent.type.name === "paragraph" &&
                $from.parent.textContent === "" &&
                $from.parentOffset === 0
              ) {
                const resolvedPos = e.state.doc.resolve($from.before($from.depth))
                const indexInDoc = resolvedPos.index(0)
                if (indexInDoc > 0) {
                  const prevNode = e.state.doc.child(indexInDoc - 1)
                  if (prevNode.type.name === "table") {
                    // Delete empty paragraph + table above
                    const tableStart = $from.before($from.depth) - prevNode.nodeSize
                    const paraEnd = $from.after($from.depth)
                    const { tr } = e.state
                    tr.delete(tableStart, paraEnd)
                    e.view.dispatch(tr)
                    return true
                  }
                }
              }

              return false
            },
          }
        },
      })
      noteExtensions.push(CustomKeyboardShortcuts as Extension)

      // Table keyboard — Delete key intercept (must be after Table extension)
      // prosemirror-tables의 tableEditing()이 Delete를 deleteCellSelection으로 선점하므로
      // addProseMirrorPlugins로 그보다 먼저 실행되는 플러그인을 등록
      const TableKeyboard = Extension.create({
        name: "tableKeyboard",
        addProseMirrorPlugins() {
          return [
            new Plugin({
              key: new PluginKey("tableKeyboard"),
              props: {
                handleKeyDown(view, event) {
                  if (event.key !== "Delete") return false

                  const { state, dispatch } = view
                  const { selection } = state
                  if (!(selection instanceof CellSelection)) return false

                  // Check if selected cells are all empty
                  const text = state.doc.textBetween(selection.from, selection.to).trim()
                  if (text !== "") return false // has text → default (clear content)

                  // Row selection → delete rows
                  if (selection.isRowSelection()) {
                    return pmDeleteRow(state, dispatch)
                  }
                  // Col selection → delete columns
                  if (selection.isColSelection()) {
                    return pmDeleteColumn(state, dispatch)
                  }
                  // Partial selection → try row first, then col
                  if (pmDeleteRow(state)) {
                    return pmDeleteRow(state, dispatch)
                  }
                  if (pmDeleteColumn(state)) {
                    return pmDeleteColumn(state, dispatch)
                  }

                  return false
                },
              },
            }),
          ]
        },
      })
      noteExtensions.push(TableKeyboard as Extension)

      // Table UI is handled by TableBubbleMenu component in TipTapEditor

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

/**
 * Render-only extensions for `generateHTML()`.
 * No keyboard shortcuts, no plugins, no interactive features.
 * Reuses the module-scope `lowlight` instance.
 */
export function createRenderExtensions(): Extension[] {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      dropcursor: false,
      codeBlock: false,
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Link.configure({ openOnClick: false }),
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
    Color,
    TextStyle,
    Superscript,
    Subscript,
    Table.configure({ resizable: false }),
    TableRow,
    TableCell.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          backgroundColor: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
            renderHTML: (attrs: Record<string, unknown>) => {
              if (!attrs.backgroundColor) return {}
              return { style: `background-color: ${attrs.backgroundColor}` }
            },
          },
        }
      },
    }),
    TableHeader.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          backgroundColor: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
            renderHTML: (attrs: Record<string, unknown>) => {
              if (!attrs.backgroundColor) return {}
              return { style: `background-color: ${attrs.backgroundColor}` }
            },
          },
        }
      },
    }),
    ResizableImage.configure({ inline: false, allowBase64: true }),
    CodeBlockLowlight.configure({ lowlight }),
    Typography,
    Gapcursor,
    CharacterCount,
    FontFamily,
    Youtube.configure({ inline: false, allowFullscreen: true, HTMLAttributes: { class: "youtube-embed" } }),
    Details.configure({ HTMLAttributes: { class: "details-block" }, persist: true }),
    DetailsSummary,
    DetailsContent,
    Mathematics,
    Audio,
    Twitch,
    // Wiki-specific nodes
    WikiQuoteExtension,
    CalloutBlockNode,
    SummaryBlockNode,
    ColumnsBlockNode,
    ColumnCellNode,
    InfoboxBlockNode,
    ContentBlockNode,
    AnchorMarkNode,
    AnchorDividerNode,
  ] as Extension[]
}

export { TypewriterExtension }
