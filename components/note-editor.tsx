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
        <textarea
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          placeholder="Start writing..."
          className="h-full w-full min-h-[300px] resize-none bg-transparent text-[14px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40"
        />
      </div>
    </div>
  )
}
