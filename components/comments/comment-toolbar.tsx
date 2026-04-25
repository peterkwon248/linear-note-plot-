"use client"

import type { Editor } from "@tiptap/react"
import { useEditorState } from "@tiptap/react"
import { cn } from "@/lib/utils"
import {
  TextB, TextItalic, TextUnderline, TextStrikethrough, Code,
  ListBullets, ListNumbers, CheckSquare, Quotes, Link as PhLink, Code as PhCode, CodeBlock,
} from "@/lib/editor/editor-icons"

/**
 * Compact toolbar for comment editor — fits in narrow popover (~480px).
 * Subset of FixedToolbar: only essential inline + list formatting.
 */
export function CommentToolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      taskList: e.isActive("taskList"),
      blockquote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
    }),
  })

  const handleLink = () => {
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("URL", previousUrl ?? "")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-t border-border-subtle bg-secondary/20">
      <ToolBtn active={state?.bold} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
        <TextB size={13} />
      </ToolBtn>
      <ToolBtn active={state?.italic} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
        <TextItalic size={13} />
      </ToolBtn>
      <ToolBtn active={state?.underline} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
        <TextUnderline size={13} />
      </ToolBtn>
      <ToolBtn active={state?.strike} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
        <TextStrikethrough size={13} />
      </ToolBtn>
      <ToolBtn active={state?.code} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code">
        <Code size={13} />
      </ToolBtn>

      <Divider />

      <ToolBtn active={state?.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
        <ListBullets size={13} />
      </ToolBtn>
      <ToolBtn active={state?.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
        <ListNumbers size={13} />
      </ToolBtn>
      <ToolBtn active={state?.taskList} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Task list">
        <CheckSquare size={13} />
      </ToolBtn>

      <Divider />

      <ToolBtn active={state?.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
        <Quotes size={13} />
      </ToolBtn>
      <ToolBtn active={state?.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
        <CodeBlock size={13} />
      </ToolBtn>
      <ToolBtn active={editor.isActive("link")} onClick={handleLink} title="Link">
        <PhLink size={13} />
      </ToolBtn>
    </div>
  )
}

function ToolBtn({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode
  active?: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={cn(
        "p-1 rounded transition-colors",
        active
          ? "bg-accent/20 text-accent"
          : "text-muted-foreground hover:bg-hover-bg hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-3.5 bg-border/60 mx-0.5" />
}
