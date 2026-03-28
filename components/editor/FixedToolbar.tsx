"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Editor, useEditorState } from "@tiptap/react"
import { ColorPicker } from "./ColorPicker"
import { TableMenu } from "./TableMenu"
import { InsertMenu } from "@/components/insert-menu"
import { ToolbarButton, ToolbarDivider, ToolbarGroup, ToolbarSpacer } from "@/components/editor/toolbar/toolbar-primitives"
import { TextB } from "@phosphor-icons/react/dist/ssr/TextB"
import { TextItalic } from "@phosphor-icons/react/dist/ssr/TextItalic"
import { TextUnderline as UnderlineIcon } from "@phosphor-icons/react/dist/ssr/TextUnderline"
import { TextStrikethrough } from "@phosphor-icons/react/dist/ssr/TextStrikethrough"
import { TextH } from "@phosphor-icons/react/dist/ssr/TextH"
import { Code as PhCode } from "@phosphor-icons/react/dist/ssr/Code"
import { CodeBlock } from "@phosphor-icons/react/dist/ssr/CodeBlock"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { LinkBreak } from "@phosphor-icons/react/dist/ssr/LinkBreak"
import { ListBullets } from "@phosphor-icons/react/dist/ssr/ListBullets"
import { ListNumbers } from "@phosphor-icons/react/dist/ssr/ListNumbers"
import { CheckSquare } from "@phosphor-icons/react/dist/ssr/CheckSquare"
import { Quotes } from "@phosphor-icons/react/dist/ssr/Quotes"
import { Minus as PhMinus } from "@phosphor-icons/react/dist/ssr/Minus"
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr/TextAlignLeft"
import { TextAlignCenter } from "@phosphor-icons/react/dist/ssr/TextAlignCenter"
import { TextAlignRight } from "@phosphor-icons/react/dist/ssr/TextAlignRight"
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise"
import { ArrowClockwise } from "@phosphor-icons/react/dist/ssr/ArrowClockwise"
import { TextSuperscript } from "@phosphor-icons/react/dist/ssr/TextSuperscript"
import { TextSubscript } from "@phosphor-icons/react/dist/ssr/TextSubscript"
import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp"
import { ArrowDown } from "@phosphor-icons/react/dist/ssr/ArrowDown"
import { TextIndent } from "@phosphor-icons/react/dist/ssr/TextIndent"
import { TextOutdent } from "@phosphor-icons/react/dist/ssr/TextOutdent"
import { Eraser } from "@phosphor-icons/react/dist/ssr/Eraser"
import { ArrowLineUp } from "@phosphor-icons/react/dist/ssr/ArrowLineUp"
import { ArrowLineDown } from "@phosphor-icons/react/dist/ssr/ArrowLineDown"
import {
  indentCommand,
  outdentCommand,
  removeFormattingCommand,
  moveListItemUp,
  moveListItemDown,
} from "./commands/custom-commands"
import type { EditorTier } from "./core/shared-editor-config"
import { useSettingsStore } from "@/lib/settings-store"
import { normalizeLayout, type ToolbarItemId } from "@/lib/editor/toolbar-config"
import { ArrangeMode } from "./toolbar/arrange-mode"
import { GearSix } from "@phosphor-icons/react/dist/ssr/GearSix"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"
import { Image as PhImage } from "@phosphor-icons/react/dist/ssr/Image"
import { YoutubeLogo } from "@phosphor-icons/react/dist/ssr/YoutubeLogo"
import { SpeakerHigh } from "@phosphor-icons/react/dist/ssr/SpeakerHigh"
import { TwitchLogo } from "@phosphor-icons/react/dist/ssr/TwitchLogo"
import { MathOperations } from "@phosphor-icons/react/dist/ssr/MathOperations"
import { CalendarDots } from "@phosphor-icons/react/dist/ssr/CalendarDots"
import { KeyReturn } from "@phosphor-icons/react/dist/ssr/KeyReturn"
import { Crosshair } from "@phosphor-icons/react/dist/ssr/Crosshair"
import { TextAa } from "@phosphor-icons/react/dist/ssr/TextAa"
import { Paragraph } from "@phosphor-icons/react/dist/ssr/Paragraph"
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye"
import { format } from "date-fns"
import { usePlotStore } from "@/lib/store"

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
  const [pos, setPos] = useState({ left: 0, bottom: 0 })

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
      left: rect.left + rect.width / 2,
      bottom: window.innerHeight - rect.top + 6,
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
        className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 cursor-pointer border-0 outline-none transition-colors duration-75 ${
          isAnyHeadingActive ? "text-foreground bg-toolbar-active" : "text-muted-foreground hover:text-foreground hover:bg-hover-bg"
        }`}
      >
        <TextH size={22} weight="light" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed -translate-x-1/2 min-w-[120px] bg-popover border border-border rounded-lg shadow-2xl p-1 z-[1000]"
            style={{ left: `${pos.left}px`, bottom: `${pos.bottom}px` }}
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

export function FixedToolbar({ editor, position = 'bottom', onTogglePosition, noteId, tier = 'note' }: FixedToolbarProps) {
  // TODO: Hide/show buttons based on tier (wiki = minimal set, template = base + variable)
  const toolbarLayout = useSettingsStore((s) => s.toolbarLayout)
  const spellcheck = useSettingsStore((s) => s.spellcheck)
  const setSpellcheck = useSettingsStore((s) => s.setSpellcheck)
  const currentLineHighlight = useSettingsStore((s) => s.currentLineHighlight)
  const setCurrentLineHighlight = useSettingsStore((s) => s.setCurrentLineHighlight)
  const sidebarCollapsed = usePlotStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = usePlotStore((s) => s.setSidebarCollapsed)
  const restoreSidebar = usePlotStore((s) => s.restoreSidebar)
  const [arrangeOpen, setArrangeOpen] = useState(false)

  const normalizedLayout = normalizeLayout(toolbarLayout)
  const visibleSet = new Set(
    normalizedLayout.items.filter((i) => i.visible).map((i) => i.id)
  )
  const isVisible = (id: ToolbarItemId) => visibleSet.has(id)

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
      alignLeft: e?.isActive({ textAlign: "left" }) ?? false,
      alignCenter: e?.isActive({ textAlign: "center" }) ?? false,
      alignRight: e?.isActive({ textAlign: "right" }) ?? false,
      canUndo: e?.can().undo() ?? false,
      canRedo: e?.can().redo() ?? false,
    }),
  })

  if (!editor || !editorState) return null

  const handleSetLink = () => {
    if (editorState.link) { editor.chain().focus().unsetLink().run(); return }
    const url = window.prompt("Enter URL:")
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  // Align handler: works for both text blocks and image nodes
  const handleAlign = (align: "left" | "center" | "right") => {
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
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editorState.bold} title="Bold (Ctrl+B)">
            <TextB size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("italic") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editorState.italic} title="Italic (Ctrl+I)">
            <TextItalic size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("underline") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editorState.underline} title="Underline (Ctrl+U)">
            <UnderlineIcon size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("strike") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editorState.strike} title="Strikethrough">
            <TextStrikethrough size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("superscript") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editorState.superscript} title="Superscript">
            <TextSuperscript size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("subscript") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editorState.subscript} title="Subscript">
            <TextSubscript size={22} weight="light" />
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
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editorState.bulletList} title="Bullet list">
            <ListBullets size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("orderedList") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editorState.orderedList} title="Numbered list">
            <ListNumbers size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("taskList") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editorState.taskList} title="Checklist">
            <CheckSquare size={22} weight="light" />
          </ToolbarButton>
        )}
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        {isVisible("indent") && (
          <ToolbarButton onClick={() => indentCommand(editor)} title="Indent (Tab)">
            <TextIndent size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("outdent") && (
          <ToolbarButton onClick={() => outdentCommand(editor)} title="Outdent (Shift+Tab)">
            <TextOutdent size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("moveUp") && (
          <ToolbarButton onClick={() => moveListItemUp(editor)} title="Move list item up (Alt+Shift+Up)">
            <ArrowLineUp size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("moveDown") && (
          <ToolbarButton onClick={() => moveListItemDown(editor)} title="Move list item down (Alt+Shift+Down)">
            <ArrowLineDown size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("removeFormat") && (
          <ToolbarButton onClick={() => removeFormattingCommand(editor)} title="Remove formatting">
            <Eraser size={22} weight="light" />
          </ToolbarButton>
        )}
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        {isVisible("blockquote") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editorState.blockquote} title="Blockquote">
            <Quotes size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("codeBlock") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editorState.codeBlock} title="Code Block">
            <CodeBlock size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("divider") && (
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <PhMinus size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("link") && (
          <ToolbarButton onClick={handleSetLink} isActive={editorState.link} title={editorState.link ? "Remove link" : "Insert link"}>
            {editorState.link ? <LinkBreak size={22} weight="light" /> : <PhLink size={22} weight="light" />}
          </ToolbarButton>
        )}
        {isVisible("table") && <TableMenu editor={editor} />}
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarGroup>
        {isVisible("alignLeft") && (
          <ToolbarButton onClick={() => handleAlign("left")} isActive={editorState.alignLeft} title="Align left">
            <TextAlignLeft size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("alignCenter") && (
          <ToolbarButton onClick={() => handleAlign("center")} isActive={editorState.alignCenter} title="Align center">
            <TextAlignCenter size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("alignRight") && (
          <ToolbarButton onClick={() => handleAlign("right")} isActive={editorState.alignRight} title="Align right">
            <TextAlignRight size={22} weight="light" />
          </ToolbarButton>
        )}
      </ToolbarGroup>
      {/* Block Insert Group */}
      {(isVisible("toggle") || isVisible("image") || isVisible("youtube") || isVisible("audio") || isVisible("twitch")) && <ToolbarDivider />}
      <ToolbarGroup>
        {isVisible("toggle") && (
          <ToolbarButton onClick={() => editor.chain().focus().setDetails().run()} title="Toggle (collapsible)">
            <CaretRight size={22} weight="light" />
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
          }} title="Image">
            <PhImage size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("youtube") && (
          <ToolbarButton onClick={() => {
            const url = window.prompt("Enter YouTube URL:")
            if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run()
          }} title="YouTube">
            <YoutubeLogo size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("audio") && (
          <ToolbarButton onClick={() => {
            const url = window.prompt("Enter audio file URL:")
            if (url) editor.chain().focus().insertContent({ type: "audio", attrs: { src: url } }).run()
          }} title="Audio">
            <SpeakerHigh size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("twitch") && (
          <ToolbarButton onClick={() => {
            const url = window.prompt("Enter Twitch URL:")
            if (url) editor.chain().focus().insertContent(`<iframe src="${url}" width="100%" height="400" allowfullscreen></iframe>`).run()
          }} title="Twitch">
            <TwitchLogo size={22} weight="light" />
          </ToolbarButton>
        )}
      </ToolbarGroup>
      {/* Math & Insert Group */}
      {(isVisible("inlineMath") || isVisible("blockMath") || isVisible("date") || isVisible("hardBreak")) && <ToolbarDivider />}
      <ToolbarGroup>
        {isVisible("inlineMath") && (
          <ToolbarButton onClick={() => editor.chain().focus().insertContent("$E = mc^2$").run()} title="Inline Math">
            <MathOperations size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("blockMath") && (
          <ToolbarButton onClick={() => editor.chain().focus().insertContent("$$\n\\sum_{i=1}^{n} x_i\n$$").run()} title="Block Math">
            <MathOperations size={22} weight="regular" />
          </ToolbarButton>
        )}
        {isVisible("date") && (
          <ToolbarButton onClick={() => {
            editor.chain().focus().insertContent(format(new Date(), "yyyy-MM-dd")).run()
          }} title="Insert Date">
            <CalendarDots size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("hardBreak") && (
          <ToolbarButton onClick={() => editor.chain().focus().setHardBreak().run()} title="Line Break">
            <KeyReturn size={22} weight="light" />
          </ToolbarButton>
        )}
      </ToolbarGroup>
      <ToolbarSpacer />
      {/* Settings Toggle Group */}
      {(isVisible("focusMode") || isVisible("spellcheck") || isVisible("currentLineHighlight") || isVisible("invisibleChars")) && (
        <>
          <ToolbarGroup>
            {isVisible("focusMode") && (
              <ToolbarButton onClick={() => {
                if (sidebarCollapsed) restoreSidebar()
                else setSidebarCollapsed(true)
              }} isActive={sidebarCollapsed} title="Focus Mode">
                <Crosshair size={22} weight="light" />
              </ToolbarButton>
            )}
            {isVisible("spellcheck") && (
              <ToolbarButton onClick={() => setSpellcheck(!spellcheck)} isActive={spellcheck} title="Spellcheck">
                <TextAa size={22} weight="light" />
              </ToolbarButton>
            )}
            {isVisible("currentLineHighlight") && (
              <ToolbarButton onClick={() => setCurrentLineHighlight(!currentLineHighlight)} isActive={currentLineHighlight} title="Line Highlight">
                <Paragraph size={22} weight="light" />
              </ToolbarButton>
            )}
            {isVisible("invisibleChars") && (
              <ToolbarButton onClick={() => {
                try {
                  editor.chain().focus().run()
                  const ext = editor.extensionManager.extensions.find((e: { name: string }) => e.name === 'invisibleCharacters')
                  if (ext) {
                    const currentVisible = (ext.options as Record<string, unknown>).visible ?? false
                    ;(ext.options as Record<string, unknown>).visible = !currentVisible
                    editor.view.dispatch(editor.state.tr)
                  }
                } catch { /* noop */ }
              }} title="Invisible Characters">
                <Eye size={22} weight="light" />
              </ToolbarButton>
            )}
          </ToolbarGroup>
          <ToolbarDivider />
        </>
      )}
      <ToolbarGroup>
        {isVisible("undo") && (
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editorState.canUndo} title="Undo (Ctrl+Z)">
            <ArrowCounterClockwise size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("redo") && (
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editorState.canRedo} title="Redo (Ctrl+Shift+Z)">
            <ArrowClockwise size={22} weight="light" />
          </ToolbarButton>
        )}
        {isVisible("inlineCode") && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editorState.code} title="Inline code (Ctrl+E)">
            <PhCode size={22} weight="light" />
          </ToolbarButton>
        )}
      </ToolbarGroup>
      <ToolbarDivider />
      <ToolbarButton onClick={() => setArrangeOpen(true)} title="Arrange toolbar">
        <GearSix size={22} weight="light" />
      </ToolbarButton>
      {onTogglePosition && (
        <>
          <ToolbarButton onClick={onTogglePosition} title={position === 'bottom' ? "Move toolbar to top" : "Move toolbar to bottom"}>
            {position === 'bottom' ? <ArrowUp size={22} weight="light" /> : <ArrowDown size={22} weight="light" />}
          </ToolbarButton>
        </>
      )}
      <ArrangeMode open={arrangeOpen} onClose={() => setArrangeOpen(false)} />
    </div>
  )
}
