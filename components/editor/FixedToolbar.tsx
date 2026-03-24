"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Editor, useEditorState } from "@tiptap/react"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading,
  Code,
  CodeXml,
  Link2,
  Unlink,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Superscript,
  Subscript,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { ColorPicker } from "./ColorPicker"
import { TableMenu } from "./TableMenu"
import { InsertMenu } from "@/components/insert-menu"

interface FixedToolbarProps {
  editor: Editor | null
  position?: 'top' | 'bottom'
  onTogglePosition?: () => void
  noteId?: string
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => { if (!disabled) onClick() }}
      disabled={disabled}
      title={title}
      className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border-0 outline-none transition-colors duration-75 ${
        disabled ? "cursor-not-allowed opacity-40 text-muted-foreground" :
        isActive ? "cursor-pointer text-foreground bg-toolbar-active" :
        "cursor-pointer text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06]"
      }`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return (
    <div className="w-px h-7 bg-foreground/10 mx-1.5 shrink-0" />
  )
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
        className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 cursor-pointer border-0 outline-none transition-colors duration-75 ${
          isAnyHeadingActive ? "text-foreground bg-toolbar-active" : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06]"
        }`}
      >
        <Heading size={24} strokeWidth={1.5} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed -translate-x-1/2 min-w-[120px] bg-popover border border-border rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.55)] p-1 z-[1000]"
            style={{ left: `${pos.left}px`, bottom: `${pos.bottom}px` }}
          >
            {headingOptions.map(({ level, label, fontSize }) => (
              <button
                key={level}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(level) }}
                className={`w-full py-1.5 px-3 font-semibold text-left border-0 outline-none cursor-pointer rounded-md hover:bg-foreground/[0.06] ${
                  headingActiveMap[level] ? "bg-toolbar-active text-foreground" : "text-muted-foreground"
                }`}
                style={{ fontSize }}
              >
                {label}
              </button>
            ))}
            <button
              onMouseDown={(e) => { e.preventDefault(); handleSelect(null) }}
              className={`w-full py-1.5 px-3 text-note text-left border-0 outline-none cursor-pointer rounded-md hover:bg-foreground/[0.06] ${
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

export function FixedToolbar({ editor, position = 'bottom', onTogglePosition, noteId }: FixedToolbarProps) {
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
      className={`shrink-0 sticky bottom-0 z-10 h-14 flex items-center gap-0.5 px-4 bg-background overflow-x-auto overflow-y-hidden min-w-0 ${
        position === 'top' ? 'border-b border-border' : 'border-t border-border'
      }`}
    >
      <InsertMenu editor={editor} noteId={noteId} />
      <ToolbarDivider />
      <HeadingDropdown editor={editor} />
      <ToolbarDivider />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editorState.bold} title="Bold (Ctrl+B)">
        <Bold size={24} strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editorState.italic} title="Italic (Ctrl+I)">
        <Italic size={24} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editorState.underline} title="Underline (Ctrl+U)">
        <UnderlineIcon size={24} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editorState.strike} title="Strikethrough">
        <Strikethrough size={24} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editorState.superscript} title="Superscript">
        <Superscript size={24} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editorState.subscript} title="Subscript">
        <Subscript size={24} strokeWidth={1.5} />
      </ToolbarButton>

      <ToolbarDivider />

      <ColorPicker editor={editor} mode="text" />
      <ColorPicker editor={editor} mode="highlight" />

      <ToolbarDivider />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editorState.bulletList} title="Bullet list">
        <List size={24} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editorState.orderedList} title="Numbered list">
        <ListOrdered size={24} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editorState.taskList} title="Checklist">
        <ListTodo size={24} strokeWidth={1.5} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editorState.blockquote} title="Blockquote">
        <Quote size={24} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editorState.codeBlock} title="Code block">
        <CodeXml size={24} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        <Minus size={24} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={handleSetLink} isActive={editorState.link} title={editorState.link ? "Remove link" : "Insert link"}>
        {editorState.link ? <Unlink size={24} strokeWidth={1.5} /> : <Link2 size={24} strokeWidth={1.5} />}
      </ToolbarButton>
      <TableMenu editor={editor} />

      <ToolbarDivider />

      <ToolbarButton onClick={() => handleAlign("left")} isActive={editorState.alignLeft} title="Align left">
        <AlignLeft size={24} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => handleAlign("center")} isActive={editorState.alignCenter} title="Align center">
        <AlignCenter size={24} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => handleAlign("right")} isActive={editorState.alignRight} title="Align right">
        <AlignRight size={24} strokeWidth={1.5} />
      </ToolbarButton>

      <div className="flex-1" />

      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editorState.canUndo} title="Undo (Ctrl+Z)">
        <Undo2 size={24} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editorState.canRedo} title="Redo (Ctrl+Shift+Z)">
        <Redo2 size={24} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editorState.code} title="Inline code (Ctrl+E)">
        <Code size={23} strokeWidth={1.5} />
      </ToolbarButton>
      {onTogglePosition && (
        <>
          <ToolbarDivider />
          <ToolbarButton onClick={onTogglePosition} title={position === 'bottom' ? "Move toolbar to top" : "Move toolbar to bottom"}>
            {position === 'bottom' ? <ArrowUp size={24} strokeWidth={1.5} /> : <ArrowDown size={24} strokeWidth={1.5} />}
          </ToolbarButton>
        </>
      )}
    </div>
  )
}
