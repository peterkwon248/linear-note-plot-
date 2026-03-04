"use client"

import { useState, useEffect } from "react"
import {
  Pin,
  Archive,
  Trash2,
  MoreHorizontal,
  Copy,
  ArrowLeft,
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
import type { Note } from "@/lib/types"
import { suggestLinks } from "@/lib/queries/notes"
import { LinkSuggestion } from "@/components/link-suggestion"

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
  const createChainNote = usePlotStore((s) => s.createChainNote)

  const note = notes.find((n) => n.id === selectedNoteId) ?? null

  const allNotes = notes

  const [localTitle, setLocalTitle] = useState("")
  const [localContent, setLocalContent] = useState("")
  const [suggestions, setSuggestions] = useState<Note[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

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

  const handleContentChange = (value: string) => {
    setLocalContent(value)

    // Detect [[ trigger for link suggestions
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement | null
    if (textarea && note) {
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = value.slice(0, cursorPos)
      const lastBracket = textBeforeCursor.lastIndexOf("[[")
      const lastCloseBracket = textBeforeCursor.lastIndexOf("]]")

      if (lastBracket > lastCloseBracket && lastBracket !== -1) {
        const query = textBeforeCursor.slice(lastBracket + 2)
        if (query.length >= 1) {
          const results = suggestLinks(query, allNotes, note.id)
          setSuggestions(results)
          setShowSuggestions(results.length > 0)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      } else {
        setShowSuggestions(false)
      }
    }
  }

  const handleSuggestionSelect = (selectedNote: Note) => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement | null
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = localContent.slice(0, cursorPos)
    const lastBracket = textBeforeCursor.lastIndexOf("[[")

    if (lastBracket !== -1) {
      const before = localContent.slice(0, lastBracket)
      const after = localContent.slice(cursorPos)
      const newContent = before + "[[" + selectedNote.title + "]]" + after
      setLocalContent(newContent)
      setShowSuggestions(false)
      setSuggestions([])

      // Move cursor after the inserted link
      requestAnimationFrame(() => {
        const newPos = lastBracket + selectedNote.title.length + 4 // [[ + title + ]]
        textarea.setSelectionRange(newPos, newPos)
        textarea.focus()
      })
    }
  }

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
        <div className="relative">
          <textarea
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (showSuggestions && e.key === "Escape") {
                e.preventDefault()
                setShowSuggestions(false)
                return
              }
              if (e.shiftKey && e.key === "Enter") {
                e.preventDefault()
                if (note) createChainNote(note.id)
              }
            }}
            placeholder="Start writing..."
            className="h-full w-full min-h-[300px] resize-none bg-transparent text-[14px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40"
          />
          <LinkSuggestion
            suggestions={suggestions}
            onSelect={handleSuggestionSelect}
            visible={showSuggestions}
          />
        </div>
      </div>
    </div>
  )
}
