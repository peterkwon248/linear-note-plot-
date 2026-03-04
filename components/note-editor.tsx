"use client"

import { useState, useEffect } from "react"
import {
  Pin,
  Archive,
  Trash2,
  FileText,
  FolderOpen,
  Tag,
  X,
  Plus,
  ChevronDown,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { usePlotStore } from "@/lib/store"

export function NoteEditor() {
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const tags = usePlotStore((s) => s.tags)
  const categories = usePlotStore((s) => s.categories)
  const updateNote = usePlotStore((s) => s.updateNote)
  const togglePin = usePlotStore((s) => s.togglePin)
  const toggleArchive = usePlotStore((s) => s.toggleArchive)
  const deleteNote = usePlotStore((s) => s.deleteNote)
  const addTagToNote = usePlotStore((s) => s.addTagToNote)
  const removeTagFromNote = usePlotStore((s) => s.removeTagFromNote)

  const note = notes.find((n) => n.id === selectedNoteId) ?? null

  const [localTitle, setLocalTitle] = useState("")
  const [localContent, setLocalContent] = useState("")
  const [folderOpen, setFolderOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)

  // Sync local state when selected note changes
  useEffect(() => {
    if (note) {
      setLocalTitle(note.title)
      setLocalContent(note.content)
    }
  }, [note?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save for title
  useEffect(() => {
    if (!note) return
    const timer = setTimeout(() => {
      if (localTitle !== note.title) {
        updateNote(note.id, { title: localTitle })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localTitle]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save for content
  useEffect(() => {
    if (!note) return
    const timer = setTimeout(() => {
      if (localContent !== note.content) {
        updateNote(note.id, { content: localContent })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localContent]) // eslint-disable-line react-hooks/exhaustive-deps

  // Empty state
  if (!note) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-[13px] text-muted-foreground">Select a note</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Choose a note from the list or create a new one.
          </p>
        </div>
      </div>
    )
  }

  const currentFolder = folders.find((f) => f.id === note.folderId)
  const currentCategory = categories.find((c) => c.id === note.category)
  const noteTags = tags.filter((t) => note.tags.includes(t.id))
  const availableTags = tags.filter((t) => !note.tags.includes(t.id))

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Editor Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-[12px] text-muted-foreground">
          {format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => togglePin(note.id)}
                className={cn(
                  "rounded-md p-1.5 transition-colors hover:bg-secondary",
                  note.pinned
                    ? "text-[#f2994a]"
                    : "text-muted-foreground"
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

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => deleteNote(note.id)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Title Input */}
      <input
        type="text"
        value={localTitle}
        onChange={(e) => setLocalTitle(e.target.value)}
        placeholder="Untitled"
        className="w-full bg-transparent px-6 pt-4 text-[22px] font-semibold text-foreground outline-none placeholder:text-muted-foreground"
      />

      {/* Metadata Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-2">
        {/* Folder Selector */}
        <Popover open={folderOpen} onOpenChange={setFolderOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary">
              <FolderOpen className="h-3 w-3" />
              <span>{currentFolder?.name ?? "No folder"}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-1">
            <button
              onClick={() => {
                updateNote(note.id, { folderId: null })
                setFolderOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors hover:bg-secondary",
                note.folderId === null
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              No folder
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => {
                  updateNote(note.id, { folderId: folder.id })
                  setFolderOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors hover:bg-secondary",
                  note.folderId === folder.id
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: folder.color }}
                />
                {folder.name}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Category Selector */}
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary">
              {currentCategory && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: currentCategory.color }}
                />
              )}
              <span>{currentCategory?.name ?? "No category"}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-1">
            <button
              onClick={() => {
                updateNote(note.id, { category: "" })
                setCategoryOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors hover:bg-secondary",
                note.category === ""
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              No category
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  updateNote(note.id, { category: cat.id })
                  setCategoryOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors hover:bg-secondary",
                  note.category === cat.id
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Tag Badges */}
        {noteTags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: `${tag.color}18`,
              color: tag.color,
            }}
          >
            {tag.name}
            <button
              onClick={() => removeTagFromNote(note.id, tag.id)}
              className="rounded-full p-0.5 transition-colors hover:bg-black/10"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}

        {/* Add Tag Popover */}
        {availableTags.length > 0 && (
          <Popover open={tagOpen} onOpenChange={setTagOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary">
                <Tag className="h-3 w-3" />
                <Plus className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-1">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    addTagToNote(note.id, tag.id)
                    setTagOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Content Textarea */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <textarea
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          placeholder="Start writing..."
          className="h-full w-full min-h-[300px] resize-none bg-transparent text-[14px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}
