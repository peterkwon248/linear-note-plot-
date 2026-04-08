"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Editor, useEditorState } from "@tiptap/react"
import { UrlInputDialog } from "@/components/editor/url-input-dialog"
import { ColorPicker } from "./ColorPicker"
import { TableMenu } from "./TableMenu"
import { InsertMenu } from "@/components/insert-menu"
import { ToolbarButton, ToolbarDivider, ToolbarGroup, ToolbarSpacer } from "@/components/editor/toolbar/toolbar-primitives"
import {
  TextItalic,
  TextUnderline as UnderlineIcon,
  TextStrikethrough,
  Code as PhCode,
  CodeBlock,
  Link as PhLink,
  LinkBreak,
  ListBullets,
  ListNumbers,
  CheckSquare,
  Quotes,
  Minus as PhMinus,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  TextAlignJustify,
  ArrowCounterClockwise,
  ArrowClockwise,
  TextSuperscript,
  TextSubscript,
  ArrowUp,
  ArrowDown,
  TextIndent,
  TextOutdent,
  Eraser,
  ArrowLineUp,
  ArrowLineDown,
  GearSix,
  DotsThree,
  CaretRight,
  Image as PhImage,
  LinkSimple,
  MathOperations,
  CalendarDots,
  KeyReturn,
  PushPin,
  TextB,
  TextH,
  TextT,
  HighlighterCircle,
  Table,
  ArrowLeft,
  BookmarkSimple,
} from "@/lib/editor/editor-icons"
import {
  indentCommand,
  outdentCommand,
  removeFormattingCommand,
  moveListItemUp,
  moveListItemDown,
} from "./commands/custom-commands"
import type { EditorTier } from "./core/shared-editor-config"
import { useSettingsStore } from "@/lib/settings-store"
import { normalizeLayout, TOOLBAR_ITEM_LABELS, type ToolbarItemId } from "@/lib/editor/toolbar-config"
import { ArrangeMode } from "./toolbar/arrange-mode"
import { format } from "date-fns"
import { TEXT_COLORS, HIGHLIGHT_COLORS } from "@/lib/editor-colors"
import { usePlotStore } from "@/lib/store"
import { detectUrlType } from "@/lib/editor/url-detect"

interface FixedToolbarProps {
  editor: Editor | null
  position?: 'top' | 'bottom'
  onTogglePosition?: () => void
  noteId?: string
  tier?: EditorTier
}

function HeadingDropdown({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: 0, top: 0 })

  const headingOptions = [
    { level: 1, label: "H1", fontSize: "20px" },
    { level: 2, label: "H2", fontSize: "18px" },
    { level: 3, label: "H3", fontSize: "16px" },
    { level: 4, label: "H4", fontSize: "15px" },
    { level: 5, label: "H5", fontSize: "14px" },
    { level: 6, label: "H6", fontSize: "13px" },
  ] as const

  const headingState = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h1: e?.isActive("heading", { level: 1 }) ?? false,
      h2: e?.isActive("heading", { level: 2 }) ?? false,
      h3: e?.isActive("heading", { level: 3 }) ?? false,
      h4: e?.isActive("heading", { level: 4 }) ?? false,
      h5: e?.isActive("heading", { level: 5 }) ?? false,
      h6: e?.isActive("heading", { level: 6 }) ?? false,
    }),
  })

  const headingActiveMap: Record<number, boolean> = {
    1: headingState.h1,
    2: headingState.h2,
    3: headingState.h3,
    4: headingState.h4,
    5: headingState.h5,
    6: headingState.h6,
  }

  const isAnyHeadingActive = Object.values(headingActiveMap).some(Boolean)

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setPos({
      left: rect.left,
      top: rect.top - 6,
    })
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [isOpen, updatePosition])

  const handleSelect = useCallback(
    (level: number | null) => {
      if (level === null) editor.chain().focus().setParagraph().run()
      else editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()
      setIsOpen(false)
    },
    [editor]
  )

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isOpen) updatePosition()
    setIsOpen(!isOpen)
  }

  return (
    <>
      <button
        ref={buttonRef}
        onMouseDown={handleToggle}
        title="Heading"
        className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 cursor-pointer border-0 outline-none transition-colors duration-100 ${
          isAnyHeadingActive ? "text-foreground bg-toolbar-active" : "text-muted-foreground hover:text-foreground hover:bg-hover-bg"
        }`}
      >
        <TextH size={20} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed -translate-y-full min-w-[120px] bg-surface-overlay border border-border rounded-lg shadow-2xl p-1 z-[1000]"
            style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
          >
            {headingOptions.map(({ level, label, fontSize }) => (
              <button
                key={level}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(level) }}
                className={`w-full py-1.5 px-3 font-semibold text-left border-0 outline-none cursor-pointer rounded-md hover:bg-hover-bg ${
                  headingActiveMap[level] ? "bg-toolbar-active text-foreground" : "text-muted-foreground"
                }`}
                style={{ fontSize }}
              >
                {label}
              </button>
            ))}
            <button
              onMouseDown={(e) => { e.preventDefault(); handleSelect(null) }}
              className={`w-full py-1.5 px-3 text-note text-left border-0 outline-none cursor-pointer rounded-md hover:bg-hover-bg ${
                !isAnyHeadingActive ? "bg-toolbar-active text-foreground" : "text-muted-foreground"
              }`}
            >
              Normal
            </button>
          </div>,
          document.body
        )}
    </>
  )
}

function AlignDropdown({ editor, editorState, handleAlign, isVisible }: {
  editor: Editor
  editorState: { textAlign: string }
  handleAlign: (align: "left" | "center" | "right" | "justify") => void
  isVisible: (id: ToolbarItemId) => boolean
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open])

  if (!isVisible("textAlign")) return null

  const currentAlign = editorState.textAlign
  const CurrentIcon = currentAlign === "center" ? TextAlignCenter
    : currentAlign === "right" ? TextAlignRight
    : currentAlign === "justify" ? TextAlignJustify
    : TextAlignLeft

  const options = [
    { align: "left" as const, label: "Left", icon: TextAlignLeft, shortcut: "Ctrl+Shift+L" },
    { align: "center" as const, label: "Center", icon: TextAlignCenter, shortcut: "Ctrl+Shift+E" },
    { align: "right" as const, label: "Right", icon: TextAlignRight, shortcut: "Ctrl+Shift+R" },
    { align: "justify" as const, label: "Justified", icon: TextAlignJustify, shortcut: "Ctrl+Shift+J" },
  ]

  const rect = btnRef.current?.getBoundingClientRect()

  return (
    <>
      <div ref={btnRef}>
        <ToolbarButton
          onClick={() => setOpen(!open)}
          isActive={currentAlign !== "left"}
          title="Text alignment"
        >
          <CurrentIcon size={20} />
        </ToolbarButton>
      </div>
      {open && rect && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] min-w-[200px] rounded-lg border border-border bg-surface-overlay shadow-lg py-1"
          style={{ left: rect.left, bottom: window.innerHeight - rect.top + 4 }}
        >
          {options.map(({ align, label, icon: Icon, shortcut }) => (
            <button
              key={align}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { handleAlign(align); setOpen(false) }}
              className="flex items-center gap-3 w-full px-3 py-1.5 text-note text-foreground/80 hover:bg-hover-bg hover:text-foreground transition-colors cursor-pointer border-0 outline-none"
            >
              {currentAlign === align ? (
                <span className="w-4 text-center text-2xs">✓</span>
              ) : (
                <span className="w-4" />
              )}
              <Icon size={16} />
              <span className="flex-1 text-left">{label}</span>
              <span className="text-2xs text-muted-foreground/50">{shortcut}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

function TableSubPanel({ editor, moreMenuPinned, setMoreMenuOpen, setSubPanel }: {
  editor: Editor; moreMenuPinned: boolean; setMoreMenuOpen: (v: boolean) => void; setSubPanel: (v: "none" | "textColor" | "highlight" | "table") => void
}) {
  const [hoverRow, setHoverRow] = useState(0)
  const [hoverCol, setHoverCol] = useState(0)
  const maxRows = 6, maxCols = 6
  return (
    <>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setSubPanel("none")}
        className="flex items-center gap-1.5 px-1 pb-1.5 mb-1.5 border-b border-border text-2xs text-muted-foreground hover:text-foreground cursor-pointer border-0 outline-none bg-transparent"
      >
        <ArrowLeft size={14} /> Insert Table
      </button>
      <div
        className="grid gap-1 mb-2 px-1"
        style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}
        onMouseLeave={() => { setHoverRow(0); setHoverCol(0) }}
      >
        {Array.from({ length: maxRows * maxCols }).map((_, idx) => {
          const r = Math.floor(idx / maxCols) + 1
          const c = (idx % maxCols) + 1
          const isHighlighted = r <= hoverRow && c <= hoverCol
          return (
            <div
              key={idx}
              onMouseEnter={() => { setHoverRow(r); setHoverCol(c) }}
              onMouseDown={(e) => {
                e.preventDefault()
                editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run()
                setSubPanel("none")
                if (!moreMenuPinned) setMoreMenuOpen(false)
              }}
              className={`w-7 h-7 rounded-sm border cursor-pointer transition-all duration-[50ms] ${
                isHighlighted ? "border-[rgba(94,106,210,0.6)] bg-toolbar-active" : "border-border"
              }`}
            />
          )
        })}
      </div>
      <div className="text-2xs text-muted-foreground text-center">
        {hoverRow > 0 && hoverCol > 0 ? `${hoverRow} × ${hoverCol}` : "Hover to select size"}
      </div>
    </>
  )
}

function OverflowGrid({ editor, editorState, isVisible, handleSetLink, handleAlign, moreMenuPinned, setMoreMenuOpen }: {
  editor: Editor
  editorState: Record<string, any>
  isVisible: (id: ToolbarItemId) => boolean
  handleSetLink: () => void
  handleAlign: (align: "left" | "center" | "right" | "justify") => void
  moreMenuPinned: boolean
  setMoreMenuOpen: (v: boolean) => void
}) {
  const overflowFavorites = useSettingsStore((s) => s.overflowFavorites)
  const toggleFavorite = useSettingsStore((s) => s.toggleOverflowFavorite)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null)
  const [subPanel, setSubPanel] = useState<"none" | "textColor" | "highlight" | "table">("none")

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [contextMenu])

  const allItems: { id: ToolbarItemId; label: string; icon: React.ReactNode; action: () => void; active: boolean }[] = [
    { id: "bold", label: "Bold", icon: <TextB size={18} />, action: () => editor.chain().focus().toggleBold().run(), active: editorState.bold },
    { id: "italic", label: "Italic", icon: <TextItalic size={18} />, action: () => editor.chain().focus().toggleItalic().run(), active: editorState.italic },
    { id: "underline", label: "Underline", icon: <UnderlineIcon size={18} />, action: () => editor.chain().focus().toggleUnderline().run(), active: editorState.underline },
    { id: "strike", label: "Strike", icon: <TextStrikethrough size={18} />, action: () => editor.chain().focus().toggleStrike().run(), active: editorState.strike },
    { id: "superscript", label: "Super", icon: <TextSuperscript size={18} />, action: () => editor.chain().focus().toggleSuperscript().run(), active: editorState.superscript },
    { id: "subscript", label: "Sub", icon: <TextSubscript size={18} />, action: () => editor.chain().focus().toggleSubscript().run(), active: editorState.subscript },
    { id: "inlineCode", label: "Code", icon: <PhCode size={18} />, action: () => editor.chain().focus().toggleCode().run(), active: editorState.code },
    { id: "removeFormat", label: "Clear", icon: <Eraser size={18} />, action: () => removeFormattingCommand(editor), active: false },
    { id: "bulletList", label: "Bullets", icon: <ListBullets size={18} />, action: () => editor.chain().focus().toggleBulletList().run(), active: editorState.bulletList },
    { id: "orderedList", label: "Numbers", icon: <ListNumbers size={18} />, action: () => editor.chain().focus().toggleOrderedList().run(), active: editorState.orderedList },
    { id: "taskList", label: "Tasks", icon: <CheckSquare size={18} />, action: () => editor.chain().focus().toggleTaskList().run(), active: editorState.taskList },
    { id: "blockquote", label: "Quote", icon: <Quotes size={18} />, action: () => editor.chain().focus().toggleBlockquote().run(), active: editorState.blockquote },
    { id: "codeBlock", label: "Code Block", icon: <CodeBlock size={18} />, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editorState.codeBlock },
    { id: "divider", label: "Divider", icon: <PhMinus size={18} />, action: () => editor.chain().focus().setHorizontalRule().run(), active: false },
    { id: "bookmark", label: "Bookmark", icon: <BookmarkSimple size={18} />, action: () => { const { nanoid } = require("nanoid"); editor.chain().focus().insertContent({ type: "anchorMark", attrs: { id: nanoid(8), label: "" } }).run() }, active: false },
    { id: "link", label: "Link", icon: <PhLink size={18} />, action: handleSetLink, active: editorState.link },
    { id: "textAlign", label: "Align", icon: <TextAlignLeft size={18} />, action: () => {
      const next = editorState.textAlign === "left" ? "center" : editorState.textAlign === "center" ? "right" : editorState.textAlign === "right" ? "justify" : "left"
      handleAlign(next as "left" | "center" | "right" | "justify")
    }, active: editorState.textAlign !== "left" },
    { id: "indent", label: "Indent", icon: <TextIndent size={18} />, action: () => indentCommand(editor), active: false },
    { id: "outdent", label: "Outdent", icon: <TextOutdent size={18} />, action: () => outdentCommand(editor), active: false },
    { id: "undo", label: "Undo", icon: <ArrowCounterClockwise size={18} />, action: () => editor.chain().focus().undo().run(), active: false },
    { id: "redo", label: "Redo", icon: <ArrowClockwise size={18} />, action: () => editor.chain().focus().redo().run(), active: false },
    { id: "hardBreak", label: "Break", icon: <KeyReturn size={18} />, action: () => editor.chain().focus().setHardBreak().run(), active: false },
    { id: "date", label: "Date", icon: <CalendarDots size={18} />, action: () => editor.chain().focus().insertContent(format(new Date(), "yyyy-MM-dd")).run(), active: false },
    { id: "toggle", label: "Toggle", icon: <CaretRight size={18} />, action: () => editor.chain().focus().setDetails().run(), active: false },
    { id: "inlineMath", label: "Math", icon: <MathOperations size={18} />, action: () => editor.chain().focus().insertContent({ type: "inlineMath", attrs: { latex: "E = mc^2" } }).run(), active: false },
    { id: "blockMath", label: "Equation", icon: <MathOperations size={18} />, action: () => editor.chain().focus().insertContent({ type: "blockMath", attrs: { latex: "\\sum_{i=1}^{n} x_i" } }).run(), active: false },
    { id: "textColor", label: "Text Color", icon: <TextT size={18} />, action: () => setSubPanel("textColor"), active: false },
    { id: "highlight", label: "Highlight", icon: <HighlighterCircle size={18} />, action: () => setSubPanel("highlight"), active: false },
    { id: "table", label: "Table", icon: <Table size={18} />, action: () => setSubPanel("table"), active: false },
    { id: "image", label: "Image", icon: <PhImage size={18} />, action: () => {
      const input = document.createElement("input")
      input.type = "file"; input.accept = "image/*"
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => { editor.chain().focus().setImage({ src: reader.result as string }).run() }
        reader.readAsDataURL(file)
      }
      input.click()
      if (!moreMenuPinned) setMoreMenuOpen(false)
    }, active: false },
  ]
  const visibleItems = allItems.filter(item => isVisible(item.id))
  const favSet = new Set(overflowFavorites)
  const favoriteItems = overflowFavorites.map(id => visibleItems.find(i => i.id === id)).filter(Boolean) as typeof visibleItems

  const subPanelIds = new Set(["textColor", "highlight", "table"])
  const handleItemClick = (item: typeof allItems[0]) => {
    item.action()
    // Don't close for sub-panel items (they open inline)
    if (subPanelIds.has(item.id)) return
    if (!moreMenuPinned) setMoreMenuOpen(false)
  }

  const renderItem = (item: typeof allItems[0], isFav?: boolean) => (
    <button
      key={`${isFav ? "fav-" : ""}${item.id}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => handleItemClick(item)}
      onContextMenu={(e) => {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id })
      }}
      className={`flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors cursor-pointer border-0 outline-none ${
        item.active
          ? "bg-toolbar-active text-foreground"
          : "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
      }`}
    >
      {item.icon}
      <span className="text-[10px] leading-tight truncate w-full text-center">{item.label}</span>
    </button>
  )

  // Color apply helper
  const applyColor = (mode: "text" | "highlight", color: string) => {
    if (mode === "text") {
      if (!color) editor.chain().focus().unsetColor().run()
      else editor.chain().focus().setColor(color).run()
    } else {
      if (!color) editor.chain().focus().unsetHighlight().run()
      else editor.chain().focus().toggleHighlight({ color }).run()
    }
    if (!moreMenuPinned) { setMoreMenuOpen(false); setSubPanel("none") }
    else setSubPanel("none")
  }

  // Sub-panel: color palette
  if (subPanel === "textColor" || subPanel === "highlight") {
    const mode = subPanel === "textColor" ? "text" : "highlight"
    const colors = mode === "text" ? TEXT_COLORS : HIGHLIGHT_COLORS
    return (
      <>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setSubPanel("none")}
          className="flex items-center gap-1.5 px-1 pb-1.5 mb-1.5 border-b border-border text-2xs text-muted-foreground hover:text-foreground cursor-pointer border-0 outline-none bg-transparent"
        >
          <ArrowLeft size={14} /> {mode === "text" ? "Text Color" : "Highlight Color"}
        </button>
        <div className="grid grid-cols-8 gap-1">
          {colors.map((color) => (
            <button
              key={color.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyColor(mode, color.value)}
              title={color.label}
              className="w-8 h-8 rounded-md flex items-center justify-center cursor-pointer bg-transparent border border-border outline-none p-0 hover:border-foreground/20"
            >
              {!color.value ? (
                <div className="w-4 h-4 rounded-sm relative overflow-hidden border border-border">
                  <div className="absolute top-1/2 -left-0.5 -right-0.5 h-px bg-destructive -rotate-45" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: color.swatch, opacity: mode === "highlight" ? 0.7 : 1 }} />
              )}
            </button>
          ))}
        </div>
      </>
    )
  }

  // Sub-panel: table size picker (hover-select like TableMenu)
  if (subPanel === "table") {
    return <TableSubPanel editor={editor} moreMenuPinned={moreMenuPinned} setMoreMenuOpen={setMoreMenuOpen} setSubPanel={setSubPanel} />
  }

  return (
    <>
      {favoriteItems.length > 0 && (
        <>
          <div className="px-1 pb-1">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Favorites</span>
          </div>
          <div className="grid grid-cols-4 gap-1 mb-1.5 pb-1.5 border-b border-border">
            {favoriteItems.map(item => renderItem(item, true))}
          </div>
        </>
      )}
      <div className="grid grid-cols-4 gap-1">
        {visibleItems.map(item => renderItem(item))}
      </div>
      {/* Right-click context menu */}
      {contextMenu && createPortal(
        <div
          className="fixed z-[200] min-w-[160px] rounded-lg border border-border bg-surface-overlay shadow-xl py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { toggleFavorite(contextMenu.itemId); setContextMenu(null) }}
            className="w-full px-3 py-1.5 text-note text-left text-foreground/80 hover:bg-hover-bg hover:text-foreground transition-colors cursor-pointer border-0 outline-none"
          >
            {favSet.has(contextMenu.itemId) ? "Remove from Favorites" : "Add to Favorites"}
          </button>
        </div>,
        document.body
      )}
    </>
  )
}

export function FixedToolbar({ editor, position = 'bottom', onTogglePosition, noteId, tier = 'note' }: FixedToolbarProps) {
  const toolbarLayout = useSettingsStore((s) => s.toolbarLayout)
  const [arrangeOpen, setArrangeOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const [moreMenuPos, setMoreMenuPos] = useState({ left: 0, bottom: 0 })
  const [embedOpen, setEmbedOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  // Items hidden in wiki tier (no note-specific features, no UX options)
  const WIKI_HIDDEN_ITEMS: Set<ToolbarItemId> = new Set([
    "moveUp", "moveDown",
  ] as ToolbarItemId[])

  const normalizedLayout = normalizeLayout(toolbarLayout)
  const visibleSet = new Set(
    normalizedLayout.items.filter((i) => i.visible).map((i) => i.id)
  )
  const isVisible = (id: ToolbarItemId) =>
    visibleSet.has(id) && !(tier === "wiki" && WIKI_HIDDEN_ITEMS.has(id))

  const [moreMenuPinned, setMoreMenuPinned] = useState(false)
  const moreMenuPinnedRef = useRef(false)
  const moreMenuUsageRef = useRef<Map<string, number>>(new Map())

  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      underline: e?.isActive("underline") ?? false,
      strike: e?.isActive("strike") ?? false,
      superscript: e?.isActive("superscript") ?? false,
      subscript: e?.isActive("subscript") ?? false,
      code: e?.isActive("code") ?? false,
      bulletList: e?.isActive("bulletList") ?? false,
      orderedList: e?.isActive("orderedList") ?? false,
      taskList: e?.isActive("taskList") ?? false,
      blockquote: e?.isActive("blockquote") ?? false,
      codeBlock: e?.isActive("codeBlock") ?? false,
      link: e?.isActive("link") ?? false,
      isInList: (e?.isActive("listItem") || e?.isActive("taskItem")) ?? false,
      textAlign: (() => {
        if (e?.isActive({ textAlign: "center" })) return "center"
        if (e?.isActive({ textAlign: "right" })) return "right"
        if (e?.isActive({ textAlign: "justify" })) return "justify"
        return "left"
      })(),
      canUndo: e?.can().undo() ?? false,
      canRedo: e?.can().redo() ?? false,
    }),
  })

  const updateMoreMenuPos = useCallback(() => {
    if (!moreButtonRef.current) return
    const rect = moreButtonRef.current.getBoundingClientRect()
    const menuWidth = 340
    // Align right edge of menu to right edge of button, clamp to viewport
    let left = rect.right - menuWidth
    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8))
    setMoreMenuPos({
      left,
      bottom: window.innerHeight - rect.top + 6,
    })
  }, [])

  useEffect(() => {
    if (!moreMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (moreMenuPinnedRef.current) return
      const target = e.target as Node
      if (moreButtonRef.current?.contains(target) || moreMenuRef.current?.contains(target)) return
      setMoreMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [moreMenuOpen])

  if (!editor || !editorState) return null

  const handleSetLink = () => {
    if (editorState.link) { editor.chain().focus().unsetLink().run(); return }
    setLinkDialogOpen(true)
  }


  // Align handler: works for both text blocks and image nodes
  const handleAlign = (align: "left" | "center" | "right" | "justify") => {
    // Check if an image node is selected
    const { node } = editor.state.selection as any
    if (node?.type?.name === "image") {
      editor.chain().focus().updateAttributes("image", { textAlign: align }).run()
    } else {
      editor.chain().focus().setTextAlign(align).run()
    }
  }

  return (
    <div
      className={`shrink-0 sticky bottom-0 z-10 h-14 flex items-center gap-0.5 px-3 bg-background overflow-x-auto overflow-y-hidden min-w-0 ${
        position === 'top' ? 'border-b border-border' : 'border-t border-border'
      }`}
    >
      {isVisible("insert") && (
        <ToolbarGroup>
          <InsertMenu editor={editor} noteId={noteId} />
        </ToolbarGroup>
      )}
      {isVisible("insert") && isVisible("heading") && <ToolbarDivider />}
      {isVisible("heading") && (
        <ToolbarGroup>
          <HeadingDropdown editor={editor} />
        </ToolbarGroup>
      )}
      <ToolbarDivider />
      <ToolbarGroup>
        {isVisible("bold") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editorState.bold} title="Bold — Make text bold (Ctrl+B)">
            <TextB size={20} />
          </ToolbarButton>
        )}
        {isVisible("italic") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editorState.italic} title="Italic — Make text italic (Ctrl+I)">
            <TextItalic size={20} />
          </ToolbarButton>
        )}
        {isVisible("underline") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editorState.underline} title="Underline — Underline text (Ctrl+U)">
            <UnderlineIcon size={20} />
          </ToolbarButton>
        )}
        {isVisible("strike") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editorState.strike} title="Strikethrough — Draw a line through text">
            <TextStrikethrough size={20} />
          </ToolbarButton>
        )}
        {isVisible("superscript") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editorState.superscript} title="Superscript — Raise text above the baseline (X²)">
            <TextSuperscript size={20} />
          </ToolbarButton>
        )}
        {isVisible("subscript") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editorState.subscript} title="Subscript — Lower text below the baseline (X₂)">
            <TextSubscript size={20} />
          </ToolbarButton>
        )}
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        {isVisible("textColor") && <ColorPicker editor={editor} mode="text" />}
        {isVisible("highlight") && <ColorPicker editor={editor} mode="highlight" />}
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        {isVisible("bulletList") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editorState.bulletList} title="Bullet List — Create an unordered list">
            <ListBullets size={20} />
          </ToolbarButton>
        )}
        {isVisible("orderedList") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editorState.orderedList} title="Numbered List — Create an ordered list">
            <ListNumbers size={20} />
          </ToolbarButton>
        )}
        {isVisible("taskList") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editorState.taskList} title="Checklist — Create a task checklist">
            <CheckSquare size={20} />
          </ToolbarButton>
        )}
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        {isVisible("indent") && (
          <ToolbarButton onClick={() => indentCommand(editor)} title="Indent — Increase indentation (Tab)">
            <TextIndent size={20} />
          </ToolbarButton>
        )}
        {isVisible("outdent") && (
          <ToolbarButton onClick={() => outdentCommand(editor)} title="Outdent — Decrease indentation (Shift+Tab)">
            <TextOutdent size={20} />
          </ToolbarButton>
        )}
        {isVisible("moveUp") && (
          <ToolbarButton onClick={() => moveListItemUp(editor)} disabled={!editorState.isInList} title="Move Up — Move list item up (Alt+Shift+Up)">
            <ArrowLineUp size={20} />
          </ToolbarButton>
        )}
        {isVisible("moveDown") && (
          <ToolbarButton onClick={() => moveListItemDown(editor)} disabled={!editorState.isInList} title="Move Down — Move list item down (Alt+Shift+Down)">
            <ArrowLineDown size={20} />
          </ToolbarButton>
        )}
        {isVisible("removeFormat") && (
          <ToolbarButton onClick={() => removeFormattingCommand(editor)} title="Remove Formatting — Clear all text styles">
            <Eraser size={20} />
          </ToolbarButton>
        )}
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        {isVisible("blockquote") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editorState.blockquote} title="Blockquote — Add a quoted block">
            <Quotes size={20} />
          </ToolbarButton>
        )}
        {isVisible("codeBlock") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editorState.codeBlock} title="Code Block — Insert a code snippet block">
            <CodeBlock size={20} />
          </ToolbarButton>
        )}
        {isVisible("divider") && (
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider — Insert a horizontal line">
            <PhMinus size={20} />
          </ToolbarButton>
        )}
        {isVisible("bookmark") && (
          <ToolbarButton
            onClick={() => { const { nanoid } = require("nanoid"); editor.chain().focus().insertContent({ type: "anchorMark", attrs: { id: nanoid(8), label: "" } }).run() }}
            title="Bookmark — Insert navigation anchor"
          >
            <BookmarkSimple size={20} />
          </ToolbarButton>
        )}
        {isVisible("link") && (
          <>
            <ToolbarButton onClick={handleSetLink} isActive={editorState.link} title={editorState.link ? "Remove Link — Remove hyperlink (Ctrl+K)" : "Insert Link — Add a hyperlink to selected text (Ctrl+K)"}>
              {editorState.link ? <LinkBreak size={20} /> : <PhLink size={20} />}
            </ToolbarButton>
            <UrlInputDialog
              open={linkDialogOpen}
              mode="link"
              onClose={() => setLinkDialogOpen(false)}
              onSubmit={(url) => {
                editor.chain().focus().setLink({ href: url }).run()
                setLinkDialogOpen(false)
              }}
            />
          </>
        )}
        {isVisible("embed") && (
          <>
            <ToolbarButton
              title="Embed URL — Insert YouTube, audio, or link card from a URL"
              onClick={() => setEmbedOpen(true)}
            >
              <LinkSimple size={20} />
            </ToolbarButton>
            <UrlInputDialog
              open={embedOpen}
              mode="embed"
              onClose={() => setEmbedOpen(false)}
              onSubmit={(url) => {
                const type = detectUrlType(url)
                if (type === "youtube") {
                  editor.chain().focus().setYoutubeVideo({ src: url }).run()
                } else if (type === "audio") {
                  editor.chain().focus().insertContent({ type: "audio", attrs: { src: url } }).run()
                } else {
                  editor.chain().focus().insertContent({ type: "linkCard", attrs: { url } }).run()
                }
                setEmbedOpen(false)
              }}
            />
          </>
        )}
        {isVisible("table") && <TableMenu editor={editor} />}
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        <AlignDropdown editor={editor} editorState={editorState} handleAlign={handleAlign} isVisible={isVisible} />
      </ToolbarGroup>
      {/* Block Insert Group */}
      {(isVisible("toggle") || isVisible("image")) && <ToolbarDivider />}
      <ToolbarGroup>
        {isVisible("toggle") && (
          <ToolbarButton onClick={() => editor.chain().focus().setDetails().run()} title="Toggle — Insert a collapsible section">
            <CaretRight size={20} />
          </ToolbarButton>
        )}
        {isVisible("image") && (
          <ToolbarButton onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => {
                editor.chain().focus().setImage({ src: reader.result as string }).run()
              }
              reader.readAsDataURL(file)
            }
            input.click()
          }} title="Image — Upload and insert an image">
            <PhImage size={20} />
          </ToolbarButton>
        )}
      </ToolbarGroup>
      {/* Math & Insert Group */}
      {(isVisible("inlineMath") || isVisible("blockMath") || isVisible("date") || isVisible("hardBreak")) && <ToolbarDivider />}
      <ToolbarGroup>
        {isVisible("inlineMath") && (
          <ToolbarButton onClick={() => editor.chain().focus().insertContent({ type: "inlineMath", attrs: { latex: "E = mc^2" } }).run()} title="Inline Math — Insert an inline LaTeX formula">
            <MathOperations size={20} />
          </ToolbarButton>
        )}
        {isVisible("blockMath") && (
          <ToolbarButton onClick={() => editor.chain().focus().insertContent({ type: "blockMath", attrs: { latex: "\\sum_{i=1}^{n} x_i" } }).run()} title="Block Math — Insert a block-level math equation">
            <MathOperations size={20} />
          </ToolbarButton>
        )}
        {isVisible("date") && (
          <ToolbarButton onClick={() => {
            editor.chain().focus().insertContent(format(new Date(), "yyyy-MM-dd")).run()
          }} title="Insert Date — Insert today's date">
            <CalendarDots size={20} />
          </ToolbarButton>
        )}
        {isVisible("hardBreak") && (
          <ToolbarButton onClick={() => editor.chain().focus().setHardBreak().run()} title="Line Break — Insert a line break (Shift+Enter)">
            <KeyReturn size={20} />
          </ToolbarButton>
        )}
      </ToolbarGroup>
      <ToolbarSpacer />
      <ToolbarGroup>
        {isVisible("undo") && (
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editorState.canUndo} title="Undo — Undo last action (Ctrl+Z)">
            <ArrowCounterClockwise size={20} />
          </ToolbarButton>
        )}
        {isVisible("redo") && (
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editorState.canRedo} title="Redo — Redo last action (Ctrl+Shift+Z)">
            <ArrowClockwise size={20} />
          </ToolbarButton>
        )}
        {isVisible("inlineCode") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editorState.code} title="Inline Code — Format as inline code (Ctrl+E)">
            <PhCode size={20} />
          </ToolbarButton>
        )}
      </ToolbarGroup>
      <ToolbarDivider />
      {/* More actions overflow menu */}
      <button
        ref={moreButtonRef}
        onMouseDown={(e) => {
          e.preventDefault()
          if (!moreMenuOpen) updateMoreMenuPos()
          setMoreMenuOpen(!moreMenuOpen)
        }}
        title="More Actions — Additional toolbar options"
        className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 cursor-pointer border-0 outline-none transition-colors duration-100 text-muted-foreground hover:text-foreground hover:bg-hover-bg"
      >
        <DotsThree size={20} />
      </button>
      {moreMenuOpen && createPortal(
        <div
          ref={moreMenuRef}
          className="fixed z-[100] w-[340px] max-h-[520px] overflow-y-auto rounded-lg border border-border bg-surface-overlay shadow-xl p-2"
          style={{ left: moreMenuPos.left, bottom: moreMenuPos.bottom }}
        >
          {/* Pin toggle header */}
          <div className="flex items-center justify-between px-1 pb-1.5 mb-1.5 border-b border-border">
            <span className="text-2xs text-muted-foreground font-medium">More Actions</span>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { const next = !moreMenuPinned; setMoreMenuPinned(next); moreMenuPinnedRef.current = next }}
              title={moreMenuPinned ? "Unpin — Close on click" : "Pin — Keep open on click"}
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer border-0 outline-none ${
                moreMenuPinned ? "text-accent bg-toolbar-active" : "text-muted-foreground hover:text-foreground hover:bg-hover-bg"
              }`}
            >
              <PushPin size={14} />
            </button>
          </div>
          <OverflowGrid
            editor={editor}
            editorState={editorState}
            isVisible={isVisible}
            handleSetLink={handleSetLink}
            handleAlign={handleAlign}
            moreMenuPinned={moreMenuPinned}
            setMoreMenuOpen={setMoreMenuOpen}
          />
        </div>,
        document.body
      )}
      {tier !== "wiki" && (
        <ToolbarButton onClick={() => setArrangeOpen(true)} title="Arrange Toolbar — Customize toolbar layout">
          <GearSix size={20} />
        </ToolbarButton>
      )}
      {onTogglePosition && tier !== "wiki" && (
        <ToolbarButton onClick={onTogglePosition} title={position === 'bottom' ? "Move toolbar to top" : "Move toolbar to bottom"}>
          {position === 'bottom' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
        </ToolbarButton>
      )}
      {tier !== "wiki" && <ArrangeMode open={arrangeOpen} onClose={() => setArrangeOpen(false)} />}
    </div>
  )
}

