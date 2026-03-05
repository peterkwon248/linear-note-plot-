"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Pin,
  Archive,
  Trash2,
  MoreHorizontal,
  Copy,
  ArrowLeft,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CheckSquare,
  Link2,
  Minus,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { usePlotStore } from "@/lib/store"
import { InsertMenu } from "@/components/insert-menu"

export function NoteEditor() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const categories = usePlotStore((s) => s.categories)
  const updateNote = usePlotStore((s) => s.updateNote)
  const togglePin = usePlotStore((s) => s.togglePin)
  const toggleArchive = usePlotStore((s) => s.toggleArchive)
  const deleteNote = usePlotStore((s) => s.deleteNote)
  const duplicateNote = usePlotStore((s) => s.duplicateNote)

  const note = notes.find((n) => n.id === selectedNoteId) ?? null

  const [localTitle, setLocalTitle] = useState("")
  const [localContent, setLocalContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /** Wrap selection with prefix/suffix or insert at cursor */
  const wrapSelection = useCallback((prefix: string, suffix: string = prefix) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = localContent.slice(start, end)
    const replacement = `${prefix}${selected || "text"}${suffix}`
    const next = localContent.slice(0, start) + replacement + localContent.slice(end)
    setLocalContent(next)
    requestAnimationFrame(() => {
      ta.focus()
      const cursorPos = start + prefix.length
      const cursorEnd = start + prefix.length + (selected || "text").length
      ta.setSelectionRange(cursorPos, cursorEnd)
    })
  }, [localContent])

  /** Insert prefix at the start of the current line */
  const insertLinePrefix = useCallback((prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = localContent.lastIndexOf("\n", start - 1) + 1
    const next = localContent.slice(0, lineStart) + prefix + localContent.slice(lineStart)
    setLocalContent(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length)
    })
  }, [localContent])

  useEffect(() => {
    if (note) {
      setLocalTitle(note.title)
      setLocalContent(note.content)
    }
  }, [note?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!note) return
    const timer = setTimeout(() => {
      if (localTitle !== note.title) {
        updateNote(note.id, { title: localTitle })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localTitle]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!note) return
    const timer = setTimeout(() => {
      if (localContent !== note.content) {
        updateNote(note.id, { content: localContent })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localContent]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!note) return null

  const currentFolder = folders.find((f) => f.id === note.folderId)
  const currentCategory = categories.find((c) => c.id === note.category)

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Editor Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSelectedNoteId(null)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Back to list</TooltipContent>
          </Tooltip>
          <span className="mx-1 h-4 w-px bg-border" />
          {currentFolder && (
            <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: currentFolder.color }}
              />
              {currentFolder.name}
            </span>
          )}
          {currentFolder && currentCategory && (
            <span className="text-[12px] text-muted-foreground/40">/</span>
          )}
          {currentCategory && (
            <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: currentCategory.color }}
              />
              {currentCategory.name}
            </span>
          )}
          {!currentFolder && !currentCategory && (
            <span className="text-[12px] text-muted-foreground">
              {format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <InsertMenu
            onInsertImage={() => {
              setLocalContent((prev) => prev + "\n![Image description](url)\n")
            }}
            onInsertFile={() => {
              setLocalContent((prev) => prev + "\n[File attachment](url)\n")
            }}
            onInsertTable={() => {
              setLocalContent(
                (prev) =>
                  prev +
                  "\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n"
              )
            }}
            onInsertDate={() => {
              setLocalContent(
                (prev) => prev + format(new Date(), "yyyy-MM-dd")
              )
            }}
            onInsertDivider={() => {
              setLocalContent((prev) => prev + "\n---\n")
            }}
            onInsertCodeBlock={() => {
              setLocalContent((prev) => prev + "\n```\n\n```\n")
            }}
          />

          <span className="mx-1 h-4 w-px bg-border" />
        </div>

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => togglePin(note.id)}
                className={cn(
                  "rounded-md p-1.5 transition-colors hover:bg-secondary",
                  note.pinned ? "text-[#f2994a]" : "text-muted-foreground"
                )}
              >
                <Pin className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{note.pinned ? "Unpin" : "Pin"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggleArchive(note.id)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
              >
                <Archive className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => duplicateNote(note.id)}>
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  deleteNote(note.id)
                  setSelectedNoteId(null)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-border px-4 py-1.5">
        <ToolbarButton label="Bold" shortcut="Ctrl+B" onClick={() => wrapSelection("**")}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Italic" shortcut="Ctrl+I" onClick={() => wrapSelection("_")}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Strikethrough" onClick={() => wrapSelection("~~")}>
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Inline code" onClick={() => wrapSelection("`")}>
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton label="Heading 1" onClick={() => insertLinePrefix("# ")}>
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Heading 2" onClick={() => insertLinePrefix("## ")}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Heading 3" onClick={() => insertLinePrefix("### ")}>
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton label="Bullet list" onClick={() => insertLinePrefix("- ")}>
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => insertLinePrefix("1. ")}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Task list" onClick={() => insertLinePrefix("- [ ] ")}>
          <CheckSquare className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Blockquote" onClick={() => insertLinePrefix("> ")}>
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton label="Link" onClick={() => wrapSelection("[", "](url)")}>
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Divider" onClick={() => {
          setLocalContent((prev) => prev + "\n---\n")
        }}>
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Title Input */}
      <input
        type="text"
        value={localTitle}
        onChange={(e) => setLocalTitle(e.target.value)}
        placeholder="Untitled"
        className="w-full bg-transparent px-6 pt-6 text-[24px] font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
      />

      {/* Content Textarea */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          placeholder="Start writing..."
          className="h-full w-full min-h-[300px] resize-none bg-transparent text-[14px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); wrapSelection("**") }
            if ((e.ctrlKey || e.metaKey) && e.key === "i") { e.preventDefault(); wrapSelection("_") }
          }}
        />
      </div>
    </div>
  )
}

/* ─── Toolbar button ─────────────────────────────── */

function ToolbarButton({
  label,
  shortcut,
  onClick,
  children,
}: {
  label: string
  shortcut?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent className="text-[11px]">
        {label}
        {shortcut && (
          <kbd className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px] font-mono leading-none text-muted-foreground">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
