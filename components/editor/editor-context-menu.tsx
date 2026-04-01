"use client"

import { useState, useCallback } from "react"
import * as ContextMenu from "@radix-ui/react-context-menu"
import type { Editor } from "@tiptap/react"
import {
  indentCommand,
  outdentCommand,
  removeFormattingCommand,
  moveListItemUp,
  moveListItemDown,
} from "./commands/custom-commands"

// Phosphor icons
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { Copy } from "@phosphor-icons/react/dist/ssr/Copy"
import { ClipboardText } from "@phosphor-icons/react/dist/ssr/ClipboardText"
import { SelectionAll } from "@phosphor-icons/react/dist/ssr/SelectionAll"
import { TextB } from "@phosphor-icons/react/dist/ssr/TextB"
import { TextItalic } from "@phosphor-icons/react/dist/ssr/TextItalic"
import { TextUnderline } from "@phosphor-icons/react/dist/ssr/TextUnderline"
import { TextStrikethrough } from "@phosphor-icons/react/dist/ssr/TextStrikethrough"
import { Code } from "@phosphor-icons/react/dist/ssr/Code"
import { Eraser } from "@phosphor-icons/react/dist/ssr/Eraser"
import { ArrowLineRight } from "@phosphor-icons/react/dist/ssr/ArrowLineRight"
import { ArrowLineLeft } from "@phosphor-icons/react/dist/ssr/ArrowLineLeft"
import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp"
import { ArrowDown } from "@phosphor-icons/react/dist/ssr/ArrowDown"
import { TextH } from "@phosphor-icons/react/dist/ssr/TextH"
import { ListBullets } from "@phosphor-icons/react/dist/ssr/ListBullets"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"
import { ListNumbers } from "@phosphor-icons/react/dist/ssr/ListNumbers"
import { CheckSquare } from "@phosphor-icons/react/dist/ssr/CheckSquare"
import { Quotes } from "@phosphor-icons/react/dist/ssr/Quotes"
import { CodeBlock } from "@phosphor-icons/react/dist/ssr/CodeBlock"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { Minus } from "@phosphor-icons/react/dist/ssr/Minus"
import { Table } from "@phosphor-icons/react/dist/ssr/Table"
import { Image } from "@phosphor-icons/react/dist/ssr/Image"
import { MathOperations } from "@phosphor-icons/react/dist/ssr/MathOperations"
import { Link } from "@phosphor-icons/react/dist/ssr/Link"
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { Info } from "@phosphor-icons/react/dist/ssr/Info"
import { Article } from "@phosphor-icons/react/dist/ssr/Article"
import { Columns as PhColumns } from "@phosphor-icons/react/dist/ssr/Columns"
import { Note as PhNote } from "@phosphor-icons/react/dist/ssr/Note"
import { Cube } from "@phosphor-icons/react/dist/ssr/Cube"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { IdentificationCard } from "@phosphor-icons/react/dist/ssr/IdentificationCard"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"

interface EditorContextMenuProps {
  editor: Editor | null
  children: React.ReactNode
}

const itemCls =
  "flex items-center gap-2 py-1.5 px-2.5 rounded-md text-note text-muted-foreground outline-none cursor-pointer hover:bg-hover-bg hover:text-foreground data-[highlighted]:bg-hover-bg data-[highlighted]:text-foreground"

const subTriggerCls =
  "flex items-center gap-2 py-1.5 px-2.5 rounded-md text-note text-muted-foreground outline-none cursor-pointer hover:bg-hover-bg hover:text-foreground data-[highlighted]:bg-hover-bg data-[highlighted]:text-foreground data-[state=open]:bg-hover-bg data-[state=open]:text-foreground"

const subContentCls =
  "min-w-[180px] rounded-lg bg-surface-overlay border border-border shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1 z-[9999]"

const separatorCls = "my-1 h-px bg-border"

function Shortcut({ keys }: { keys: string }) {
  return (
    <span className="ml-auto text-2xs text-muted-foreground/50 pl-4">{keys}</span>
  )
}

export function EditorContextMenu({ editor, children }: EditorContextMenuProps) {
  const [hasSelection, setHasSelection] = useState(false)
  const [isInList, setIsInList] = useState(false)

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open && editor) {
        // Capture selection state at the moment the menu opens
        setHasSelection(!editor.state.selection.empty)
        setIsInList(editor.isActive("listItem") || editor.isActive("taskItem"))
      }
    },
    [editor],
  )

  function cut() {
    document.execCommand("cut")
  }

  function copy() {
    document.execCommand("copy")
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText()
      editor?.chain().focus().insertContent(text).run()
    } catch {
      document.execCommand("paste")
    }
  }

  function selectAll() {
    editor?.chain().focus().selectAll().run()
  }

  function wrapInBlock(blockType: "calloutBlock" | "summaryBlock") {
    if (!editor) return
    const { from, to } = editor.state.selection
    const selectedSlice = editor.state.doc.slice(from, to)

    const content: any[] = []
    selectedSlice.content.forEach((node) => {
      content.push(node.toJSON())
    })

    if (content.length === 0 || content.every((c) => c.type === "text")) {
      const text = editor.state.doc.textBetween(from, to)
      content.length = 0
      content.push({ type: "paragraph", content: [{ type: "text", text }] })
    }

    const blockNode: any =
      blockType === "calloutBlock"
        ? { type: "calloutBlock", attrs: { calloutType: "info" }, content }
        : { type: "summaryBlock", content }

    editor.chain().focus().deleteRange({ from, to }).insertContent(blockNode).run()
  }

  function wrapInContentBlock() {
    if (!editor) return
    const { from, to } = editor.state.selection
    const slice = editor.state.doc.slice(from, to)
    const content: any[] = []
    slice.content.forEach((node) => {
      content.push(node.toJSON())
    })
    if (content.length === 0 || content.every((c: any) => c.type === "text")) {
      const text = editor.state.doc.textBetween(from, to)
      content.length = 0
      content.push({ type: "paragraph", content: [{ type: "text", text }] })
    }
    editor.chain().focus().deleteRange({ from, to }).insertContent({
      type: "contentBlock",
      content,
    }).run()
  }

  function mergeBlocks() {
    if (!editor) return
    const { from, to } = editor.state.selection
    // Collect text from each top-level block in the selection, join with hardBreak
    const texts: { text: string; marks?: any[] }[] = []
    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isBlock && node.isTextblock) {
        const inlineContent: any[] = []
        node.content.forEach((child) => {
          inlineContent.push(child.toJSON())
        })
        if (inlineContent.length > 0) {
          texts.push({ text: "", marks: undefined }) // placeholder
          // Store full inline content for rich text preservation
          ;(texts[texts.length - 1] as any).inlineContent = inlineContent
        } else {
          texts.push({ text: node.textContent })
        }
        return false // don't descend into this node's children
      }
      return true
    })
    if (texts.length <= 1) return // nothing to merge

    // Build merged paragraph content with hardBreaks between blocks
    const mergedContent: any[] = []
    texts.forEach((entry, i) => {
      const inlines = (entry as any).inlineContent
      if (inlines) {
        mergedContent.push(...inlines)
      } else if (entry.text) {
        mergedContent.push({ type: "text", text: entry.text })
      }
      if (i < texts.length - 1) {
        mergedContent.push({ type: "hardBreak" })
      }
    })

    // Expand selection to full blocks
    const $from = editor.state.doc.resolve(from)
    const $to = editor.state.doc.resolve(to)
    const blockFrom = $from.start($from.depth)
    const blockTo = $to.end($to.depth)
    // Find the outermost block boundaries
    let rangeFrom = blockFrom
    let rangeTo = blockTo
    // Walk up to find top-level block positions
    const startBlock = $from.start(1) // depth 1 = top-level block start
    const endBlock = $to.end(1)
    rangeFrom = startBlock > 0 ? startBlock - 1 : rangeFrom
    rangeTo = endBlock < editor.state.doc.content.size ? endBlock + 1 : rangeTo

    editor.chain().focus()
      .deleteRange({ from: rangeFrom, to: rangeTo })
      .insertContent({ type: "paragraph", content: mergedContent })
      .run()
  }

  function addToToc() {
    if (!editor) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, " ")
    if (!selectedText.trim()) return

    // Find the nearest heading/anchor that contains the selection for linking
    let targetId = ""
    const $from = editor.state.doc.resolve(from)
    for (let d = $from.depth; d >= 0; d--) {
      const node = $from.node(d)
      if (node.type.name === "heading" && node.attrs.id) {
        targetId = node.attrs.id
        break
      }
    }

    // Find the first TOC block in the document and add the entry
    let tocPos: number | null = null
    let tocNode: any = null
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "tocBlock" && tocPos === null) {
        tocPos = pos
        tocNode = node
        return false
      }
    })

    if (tocPos !== null && tocNode) {
      // Add entry to existing TOC block
      const existingEntries = (tocNode.attrs.entries as any[]) || []
      const newEntries = [...existingEntries, { label: selectedText.trim(), targetId, indent: 0 }]
      const tr = editor.state.tr
      tr.setNodeMarkup(tocPos, undefined, { ...tocNode.attrs, entries: newEntries })
      editor.view.dispatch(tr)
    } else {
      // No TOC block exists — insert one with this entry at the top of the document
      editor.chain().focus().insertContentAt(0, {
        type: "tocBlock",
        attrs: { entries: [{ label: selectedText.trim(), targetId, indent: 0 }] },
      }).run()
    }
  }

  return (
    <ContextMenu.Root onOpenChange={handleOpenChange}>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className="min-w-[200px] rounded-lg bg-surface-overlay border border-border shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1 z-[9999]"
        >
          {/* ── Clipboard ─────────────────────────────────── */}
          <ContextMenu.Item className={itemCls} onSelect={cut}>
            <Scissors size={14} />
            Cut
            <Shortcut keys="Ctrl+X" />
          </ContextMenu.Item>
          <ContextMenu.Item className={itemCls} onSelect={copy}>
            <Copy size={14} />
            Copy
            <Shortcut keys="Ctrl+C" />
          </ContextMenu.Item>
          <ContextMenu.Item className={itemCls} onSelect={paste}>
            <ClipboardText size={14} />
            Paste
            <Shortcut keys="Ctrl+V" />
          </ContextMenu.Item>
          <ContextMenu.Item className={itemCls} onSelect={selectAll}>
            <SelectionAll size={14} />
            Select All
            <Shortcut keys="Ctrl+A" />
          </ContextMenu.Item>

          <ContextMenu.Separator className={separatorCls} />

          {/* ── Format submenu ────────────────────────────── */}
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className={subTriggerCls}>
              <TextB size={14} />
              Format
              <CaretRight size={12} className="ml-auto" />
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent className={subContentCls}>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => editor?.chain().focus().toggleBold().run()}
                >
                  <TextB size={14} />
                  Bold
                  <Shortcut keys="Ctrl+B" />
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => editor?.chain().focus().toggleItalic().run()}
                >
                  <TextItalic size={14} />
                  Italic
                  <Shortcut keys="Ctrl+I" />
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => editor?.chain().focus().toggleUnderline().run()}
                >
                  <TextUnderline size={14} />
                  Underline
                  <Shortcut keys="Ctrl+U" />
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => editor?.chain().focus().toggleStrike().run()}
                >
                  <TextStrikethrough size={14} />
                  Strikethrough
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => editor?.chain().focus().toggleCode().run()}
                >
                  <Code size={14} />
                  Code
                  <Shortcut keys="Ctrl+E" />
                </ContextMenu.Item>
                <ContextMenu.Separator className={separatorCls} />
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => editor && removeFormattingCommand(editor)}
                >
                  <Eraser size={14} />
                  Remove Formatting
                </ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          {/* ── Merge / Wrap Block (selection only) ────── */}
          {hasSelection && (
            <>
              <ContextMenu.Item
                className={itemCls}
                onSelect={mergeBlocks}
              >
                <GitMerge size={14} />
                Merge Blocks
              </ContextMenu.Item>
              <ContextMenu.Sub>
                <ContextMenu.SubTrigger className={subTriggerCls}>
                  <Cube size={14} />
                  Wrap in
                  <CaretRight size={12} className="ml-auto" />
                </ContextMenu.SubTrigger>
                <ContextMenu.Portal>
                  <ContextMenu.SubContent className={subContentCls}>
                    <ContextMenu.Item
                      className={itemCls}
                      onSelect={() => wrapInBlock("calloutBlock")}
                    >
                      <Info size={14} />
                      Callout
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      className={itemCls}
                      onSelect={() => wrapInBlock("summaryBlock")}
                    >
                      <Article size={14} />
                      Summary
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      className={itemCls}
                      onSelect={wrapInContentBlock}
                    >
                      <Cube size={14} />
                      Block
                    </ContextMenu.Item>
                  </ContextMenu.SubContent>
                </ContextMenu.Portal>
              </ContextMenu.Sub>
              <ContextMenu.Item
                className={itemCls}
                onSelect={addToToc}
              >
                <BookmarkSimple size={14} />
                Add to TOC
              </ContextMenu.Item>
            </>
          )}

          {/* ── List submenu (only in list context) ───────── */}
          {isInList && (
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger className={subTriggerCls}>
                <ListBullets size={14} />
                List
                <CaretRight size={12} className="ml-auto" />
              </ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.SubContent className={subContentCls}>
                  <ContextMenu.Item
                    className={itemCls}
                    onSelect={() => editor && indentCommand(editor)}
                  >
                    <ArrowLineRight size={14} />
                    Indent
                    <Shortcut keys="Tab" />
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    className={itemCls}
                    onSelect={() => editor && outdentCommand(editor)}
                  >
                    <ArrowLineLeft size={14} />
                    Outdent
                    <Shortcut keys="Shift+Tab" />
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    className={itemCls}
                    onSelect={() => editor && moveListItemUp(editor)}
                  >
                    <ArrowUp size={14} />
                    Move Up
                    <Shortcut keys="Alt+Shift+↑" />
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    className={itemCls}
                    onSelect={() => editor && moveListItemDown(editor)}
                  >
                    <ArrowDown size={14} />
                    Move Down
                    <Shortcut keys="Alt+Shift+↓" />
                  </ContextMenu.Item>
                </ContextMenu.SubContent>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
          )}

          {/* ── Insert submenu ────────────────────────────── */}
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className={subTriggerCls}>
              <CaretDown size={14} />
              Insert
              <CaretRight size={12} className="ml-auto" />
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent className={subContentCls}>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() =>
                    editor?.chain().focus().setHeading({ level: 1 }).run()
                  }
                >
                  <TextH size={14} />
                  Heading 1
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() =>
                    editor?.chain().focus().setHeading({ level: 2 }).run()
                  }
                >
                  <TextH size={14} />
                  Heading 2
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() =>
                    editor?.chain().focus().setHeading({ level: 3 }).run()
                  }
                >
                  <TextH size={14} />
                  Heading 3
                </ContextMenu.Item>
                <ContextMenu.Separator className={separatorCls} />
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                >
                  <ListBullets size={14} />
                  Bullet List
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() =>
                    editor?.chain().focus().toggleOrderedList().run()
                  }
                >
                  <ListNumbers size={14} />
                  Numbered List
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() =>
                    editor?.chain().focus().toggleTaskList().run()
                  }
                >
                  <CheckSquare size={14} />
                  Checklist
                </ContextMenu.Item>
                <ContextMenu.Separator className={separatorCls} />
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() =>
                    editor?.chain().focus().toggleBlockquote().run()
                  }
                >
                  <Quotes size={14} />
                  Blockquote
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() =>
                    editor?.chain().focus().toggleCodeBlock().run()
                  }
                >
                  <CodeBlock size={14} />
                  Code Block
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => {
                    // Toggle extension — requires Details/Toggle extension
                    editor?.chain().focus().setDetails?.().run()
                  }}
                >
                  <CaretDown size={14} />
                  Toggle
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() =>
                    editor?.chain().focus().setHorizontalRule().run()
                  }
                >
                  <Minus size={14} />
                  Divider
                </ContextMenu.Item>
                <ContextMenu.Separator className={separatorCls} />
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() =>
                    editor
                      ?.chain()
                      .focus()
                      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                      .run()
                  }
                >
                  <Table size={14} />
                  Table
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => {
                    // Image insertion — trigger via command or slash menu
                    editor?.chain().focus().run()
                  }}
                >
                  <Image size={14} />
                  Image
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => {
                    // Insert math block
                    editor
                      ?.chain()
                      .focus()
                      .insertContent({ type: "mathBlock", attrs: { content: "" } })
                      .run()
                  }}
                >
                  <MathOperations size={14} />
                  Math
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => {
                    editor?.chain().focus().insertContent({ type: "tocBlock" }).run()
                  }}
                >
                  <ListBullets size={14} />
                  Table of Contents
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => {
                    editor?.chain().focus().insertContent({ type: "calloutBlock", attrs: { calloutType: "info" }, content: [{ type: "paragraph" }] }).run()
                  }}
                >
                  <Info size={14} />
                  Callout
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => {
                    editor?.chain().focus().insertContent({ type: "summaryBlock", content: [{ type: "paragraph" }] }).run()
                  }}
                >
                  <Article size={14} />
                  Summary
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => {
                    editor?.chain().focus().insertContent({
                      type: "columnsBlock",
                      content: [
                        { type: "columnCell", content: [{ type: "paragraph" }] },
                        { type: "columnCell", content: [{ type: "paragraph" }] },
                      ],
                    }).run()
                  }}
                >
                  <PhColumns size={14} />
                  Columns
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => {
                    editor?.chain().focus().insertContent({ type: "noteEmbed", attrs: { noteId: null } }).run()
                  }}
                >
                  <PhNote size={14} />
                  Embed Note
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => {
                    editor?.chain().focus().insertContent({
                      type: "infoboxBlock",
                      attrs: { title: "Info", rows: [{ label: "", value: "" }] },
                    }).run()
                  }}
                >
                  <IdentificationCard size={14} />
                  Infobox
                </ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          <ContextMenu.Separator className={separatorCls} />

          {/* ── Link submenu ──────────────────────────────── */}
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className={subTriggerCls}>
              <Link size={14} />
              Link
              <CaretRight size={12} className="ml-auto" />
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent className={subContentCls}>
                <ContextMenu.Item
                  className={itemCls}
                  onSelect={() => {
                    const url = window.prompt("Enter URL:")
                    if (url) {
                      editor?.chain().focus().setLink({ href: url }).run()
                    }
                  }}
                >
                  <Link size={14} />
                  Insert Link
                </ContextMenu.Item>
                <ContextMenu.Item
                  className={`${itemCls} opacity-50 cursor-not-allowed`}
                  disabled
                >
                  <NotePencil size={14} />
                  Link to Note
                  <span className="ml-auto text-2xs text-muted-foreground/40">TODO</span>
                </ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          {/* ── Extract as Note (selection only) ──────────── */}
          {hasSelection && (
            <>
              <ContextMenu.Separator className={separatorCls} />
              <ContextMenu.Item
                className={itemCls}
                onSelect={() => {
                  // TODO: implement extract-as-note
                  const selectedText = editor?.state.selection
                    ? editor.state.doc.textBetween(
                        editor.state.selection.from,
                        editor.state.selection.to,
                        " "
                      )
                    : ""
                  console.log("Extract as note:", selectedText)
                }}
              >
                <NotePencil size={14} />
                Extract as Note
              </ContextMenu.Item>
            </>
          )}
          <ContextMenu.Separator className={separatorCls} />

          {/* ── Delete Block ─────────────────────────────── */}
          <ContextMenu.Item
            className={itemCls + " text-destructive"}
            onSelect={() => {
              if (!editor) return
              const { $from } = editor.state.selection
              // Walk up to find the outermost deletable block (skip inline wrappers like detailsSummary/detailsContent)
              const skipTypes = new Set(["detailsSummary", "detailsContent", "listItem", "taskItem", "columnCell"])
              let targetDepth = -1
              for (let d = $from.depth; d >= 1; d--) {
                const node = $from.node(d)
                if (node.type.name === "doc") break
                if (!skipTypes.has(node.type.name)) {
                  targetDepth = d
                  // For compound blocks (details, columns), keep going up to find the container
                  if (node.type.name === "details" || node.type.name === "columnsBlock") break
                }
              }
              if (targetDepth >= 1) {
                const start = $from.start(targetDepth) - 1
                const node = $from.node(targetDepth)
                editor.chain().focus().deleteRange({ from: start, to: start + node.nodeSize }).run()
              }
            }}
          >
            <Trash size={14} />
            Delete Block
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
