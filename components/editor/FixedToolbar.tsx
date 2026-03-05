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
} from "lucide-react"
import { ColorPicker } from "./ColorPicker"
import { TableMenu } from "./TableMenu"
import { InsertMenu } from "@/components/insert-menu"

interface FixedToolbarProps {
  editor: Editor | null
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
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? "var(--muted-foreground)" : isActive ? "var(--foreground)" : "var(--muted-foreground)",
        backgroundColor: isActive ? "rgba(94,106,210,0.2)" : "transparent",
        border: "none",
        outline: "none",
        opacity: disabled ? 0.4 : 1,
      }}
      className="hover:text-foreground hover:bg-foreground/[0.06] transition-colors duration-75"
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return (
    <div
      style={{
        width: "1px",
        height: "16px",
        backgroundColor: "color-mix(in srgb, var(--foreground) 10%, transparent)",
        margin: "0 6px",
        flexShrink: 0,
      }}
    />
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
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          cursor: "pointer",
          color: isAnyHeadingActive ? "var(--foreground)" : "var(--muted-foreground)",
          backgroundColor: isAnyHeadingActive ? "rgba(94,106,210,0.2)" : "transparent",
          border: "none",
          outline: "none",
        }}
        className="hover:text-foreground hover:bg-foreground/[0.06] transition-colors duration-75"
      >
        <Heading size={15} strokeWidth={1.5} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              left: `${pos.left}px`,
              bottom: `${pos.bottom}px`,
              transform: "translateX(-50%)",
              minWidth: "120px",
              backgroundColor: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.55)",
              padding: "4px",
              zIndex: 1000,
            }}
          >
            {headingOptions.map(({ level, label, fontSize }) => (
              <button
                key={level}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(level) }}
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  fontSize,
                  fontWeight: 600,
                  textAlign: "left",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  borderRadius: "6px",
                  backgroundColor: headingActiveMap[level] ? "rgba(94,106,210,0.2)" : "transparent",
                  color: headingActiveMap[level] ? "var(--foreground)" : "var(--muted-foreground)",
                }}
                className="hover:bg-foreground/[0.06]"
              >
                {label}
              </button>
            ))}
            <button
              onMouseDown={(e) => { e.preventDefault(); handleSelect(null) }}
              style={{
                width: "100%",
                padding: "6px 12px",
                fontSize: "13px",
                textAlign: "left",
                border: "none",
                outline: "none",
                cursor: "pointer",
                borderRadius: "6px",
                backgroundColor: !isAnyHeadingActive ? "rgba(94,106,210,0.2)" : "transparent",
                color: !isAnyHeadingActive ? "var(--foreground)" : "var(--muted-foreground)",
              }}
              className="hover:bg-foreground/[0.06]"
            >
              Normal
            </button>
          </div>,
          document.body
        )}
    </>
  )
}

export function FixedToolbar({ editor }: FixedToolbarProps) {
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

  return (
    <div
      className="flex-shrink-0"
      style={{
        height: "44px",
        display: "flex",
        alignItems: "center",
        gap: "2px",
        padding: "0 16px",
        borderTop: "1px solid var(--border)",
        backgroundColor: "transparent",
        overflowX: "auto",
        overflowY: "hidden",
      }}
    >
      <InsertMenu editor={editor} />
      <ToolbarDivider />
      <HeadingDropdown editor={editor} />
      <ToolbarDivider />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editorState.bold} title="Bold (Ctrl+B)">
        <Bold size={15} strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editorState.italic} title="Italic (Ctrl+I)">
        <Italic size={15} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editorState.underline} title="Underline (Ctrl+U)">
        <UnderlineIcon size={15} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editorState.strike} title="Strikethrough">
        <Strikethrough size={15} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editorState.superscript} title="Superscript">
        <Superscript size={15} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editorState.subscript} title="Subscript">
        <Subscript size={15} strokeWidth={1.5} />
      </ToolbarButton>

      <ToolbarDivider />

      <ColorPicker editor={editor} mode="text" />
      <ColorPicker editor={editor} mode="highlight" />

      <ToolbarDivider />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editorState.bulletList} title="Bullet list">
        <List size={15} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editorState.orderedList} title="Numbered list">
        <ListOrdered size={15} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editorState.taskList} title="Checklist">
        <ListTodo size={15} strokeWidth={1.5} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editorState.blockquote} title="Blockquote">
        <Quote size={15} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editorState.codeBlock} title="Code block">
        <CodeXml size={15} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        <Minus size={15} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={handleSetLink} isActive={editorState.link} title={editorState.link ? "Remove link" : "Insert link"}>
        {editorState.link ? <Unlink size={15} strokeWidth={1.5} /> : <Link2 size={15} strokeWidth={1.5} />}
      </ToolbarButton>
      <TableMenu editor={editor} />

      <ToolbarDivider />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editorState.alignLeft} title="Align left">
        <AlignLeft size={15} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editorState.alignCenter} title="Align center">
        <AlignCenter size={15} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editorState.alignRight} title="Align right">
        <AlignRight size={15} strokeWidth={1.5} />
      </ToolbarButton>

      <div style={{ flex: 1 }} />

      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editorState.canUndo} title="Undo (Ctrl+Z)">
        <Undo2 size={15} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editorState.canRedo} title="Redo (Ctrl+Shift+Z)">
        <Redo2 size={15} strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editorState.code} title="Inline code (Ctrl+E)">
        <Code size={14} strokeWidth={1.5} />
      </ToolbarButton>
    </div>
  )
}
