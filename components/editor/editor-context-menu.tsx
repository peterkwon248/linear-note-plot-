"use client"

import { useState } from "react"
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
import { IdentificationCard } from "@phosphor-icons/react/dist/ssr/IdentificationCard"
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr/BookmarkSimple"

interface EditorContextMenuProps {
  editor: Editor | null
  children: React.ReactNode
}

const itemCls =
  "flex items-center gap-2 py-1.5 px-2.5 rounded-md text-sm text-muted-foreground outline-none cursor-pointer hover:bg-hover-bg hover:text-foreground data-[highlighted]:bg-hover-bg data-[highlighted]:text-foreground"

const subTriggerCls =
  "flex items-center gap-2 py-1.5 px-2.5 rounded-md text-sm text-muted-foreground outline-none cursor-pointer hover:bg-hover-bg hover:text-foreground data-[highlighted]:bg-hover-bg data-[highlighted]:text-foreground data-[state=open]:bg-hover-bg data-[state=open]:text-foreground"

const subContentCls =
  "min-w-[180px] rounded-lg bg-popover border border-border shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1 z-[9999]"

const separatorCls = "my-1 h-px bg-border"

function Shortcut({ keys }: { keys: string }) {
  return (
    <span className="ml-auto text-[10px] text-muted-foreground/50 pl-4">{keys}</span>
  )
}

export function EditorContextMenu({ editor, children }: EditorContextMenuProps) {
  const [hasSelection, setHasSelection] = useState(false)
  const [isInList, setIsInList] = useState(false)

  // Recalculate on context menu open (right-click) so values are fresh
  const handleOpenChange = (open: boolean) => {
    if (open && editor) {
      setHasSelection(!editor.state.selection.empty)
      setIsInList(editor.isActive("listItem") || editor.isActive("taskItem"))
    }
  }

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

  function wrapInBlock(blockType: "calloutBlock" | "summaryBlock" | "sectionBlock") {
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

    let blockNode: any
    if (blockType === "calloutBlock") {
      blockNode = { type: "calloutBlock", attrs: { calloutType: "info" }, content }
    } else if (blockType === "sectionBlock") {
      blockNode = { type: "sectionBlock", attrs: { id: `section-${Date.now()}`, title: "Untitled Section" }, content }
    } else {
      blockNode = { type: "summaryBlock", content }
    }

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

  return (
    <ContextMenu.Root onOpenChange={handleOpenChange}>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className="min-w-[200px] rounded-lg bg-popover border border-border shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1 z-[9999]"
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

          {/* ── Wrap in Block submenu (selection only) ────── */}
          {hasSelection && (
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger className={subTriggerCls}>
                <Cube size={14} />
                Make Block
                <CaretRight size={12} className="ml-auto" />
              </ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.SubContent className={subContentCls}>
                  <ContextMenu.Item
                    className={itemCls}
                    onSelect={wrapInContentBlock}
                  >
                    <Cube size={14} />
                    Block
                  </ContextMenu.Item>
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
                    onSelect={() => wrapInBlock("sectionBlock")}
                  >
                    <BookmarkSimple size={14} />
                    Section
                  </ContextMenu.Item>
                </ContextMenu.SubContent>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
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
                  <span className="ml-auto text-[10px] text-muted-foreground/40">TODO</span>
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
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
