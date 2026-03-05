"use client"

import { useState, useEffect } from "react"
import {
  Pin,
  Archive,
  Trash2,
  MoreHorizontal,
  Copy,
  ArrowLeft,
  PanelRight,
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
import { useSettingsStore } from "@/lib/settings-store"
import { NoteEditorAdapter } from "@/components/editor/NoteEditorAdapter"

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
  const detailsOpen = usePlotStore((s) => s.detailsOpen)
  const toggleDetailsOpen = usePlotStore((s) => s.toggleDetailsOpen)
  const confirmDelete = useSettingsStore((s) => s.confirmDelete)

  const note = notes.find((n) => n.id === selectedNoteId) ?? null

  const [localTitle, setLocalTitle] = useState("")

  useEffect(() => {
    if (note) {
      setLocalTitle(note.title)
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

  // Editor keyboard shortcuts: Ctrl+S, Ctrl+Shift+P, Ctrl+Backspace
  useEffect(() => {
    if (!note) return
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      // Ctrl+S: save (auto-saved, just prevent default)
      if (mod && e.key === "s") {
        e.preventDefault()
        return
      }
      // Ctrl+Shift+P: toggle pin
      if (mod && e.shiftKey && e.key === "P") {
        e.preventDefault()
        togglePin(note.id)
        return
      }
      // Ctrl+Backspace: delete note
      if (mod && e.key === "Backspace") {
        e.preventDefault()
        if (confirmDelete) {
          const ok = window.confirm("Are you sure you want to delete this note?")
          if (!ok) return
        }
        deleteNote(note.id)
        setSelectedNoteId(null)
        return
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [note, togglePin, deleteNote, setSelectedNoteId, confirmDelete])

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
                  if (confirmDelete) {
                    const ok = window.confirm("Are you sure you want to delete this note?")
                    if (!ok) return
                  }
                  deleteNote(note.id)
                  setSelectedNoteId(null)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="mx-0.5 h-4 w-px bg-border" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleDetailsOpen}
                className={cn(
                  "rounded-md p-1.5 transition-colors hover:bg-secondary",
                  detailsOpen ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <PanelRight className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{detailsOpen ? "Hide details" : "Show details"}</TooltipContent>
          </Tooltip>
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

      {/* Content Editor */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <NoteEditorAdapter note={note} />
      </div>
    </div>
  )
}
