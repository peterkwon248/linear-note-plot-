"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Pin,
  Archive,
  Trash2,
  MoreHorizontal,
  Copy,
  ArrowLeft,
  PanelRight,
  Merge,
  Link2,
  X,
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
import { BacklinksFooter } from "@/components/editor/backlinks-footer"
import type { Tag } from "@/lib/types"

interface NoteTagBarProps {
  noteId: string
  noteTags: string[]
}

function NoteTagBar({ noteId, noteTags }: NoteTagBarProps) {
  const allTags = usePlotStore((s) => s.tags)
  const createTag = usePlotStore((s) => s.createTag)
  const addTagToNote = usePlotStore((s) => s.addTagToNote)
  const removeTagFromNote = usePlotStore((s) => s.removeTagFromNote)

  const [inputValue, setInputValue] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Tags currently assigned to this note
  const assignedTags = allTags.filter((t) => noteTags.includes(t.id))

  // Raw query without leading #
  const query = inputValue.startsWith("#") ? inputValue.slice(1) : inputValue

  // Filter suggestions: existing tags not already on note, matching query
  const suggestions = allTags.filter(
    (t) =>
      !noteTags.includes(t.id) &&
      (query === "" || t.name.toLowerCase().includes(query.toLowerCase()))
  )

  const commitTag = useCallback(
    (raw: string) => {
      const name = raw.trim().replace(/^#+/, "")
      if (!name) return
      const existing = allTags.find(
        (t) => t.name.toLowerCase() === name.toLowerCase()
      )
      if (existing) {
        if (!noteTags.includes(existing.id)) {
          addTagToNote(noteId, existing.id)
        }
      } else {
        createTag(name, "#888888")
        // The new tag will be in store after createTag; find it by name
        // We need a slight trick: createTag is synchronous in zustand
        // Get updated tags directly from store snapshot
        const updatedTags = usePlotStore.getState().tags
        const newTag = updatedTags.find(
          (t: Tag) => t.name.toLowerCase() === name.toLowerCase()
        )
        if (newTag) {
          addTagToNote(noteId, newTag.id)
        }
      }
    },
    [allTags, noteTags, noteId, addTagToNote, createTag]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
      return
    }
    if (e.key === "Escape") {
      setShowDropdown(false)
      setInputValue("")
      setActiveIndex(-1)
      return
    }
    if (e.key === "Enter") {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        // Select highlighted suggestion
        const tag = suggestions[activeIndex]
        addTagToNote(noteId, tag.id)
        setInputValue("")
        setShowDropdown(false)
        setActiveIndex(-1)
        return
      }
      // Commit typed value — support comma-separated multi-tag input
      const parts = inputValue
        .split(/,/)
        .map((p) => p.trim())
        .filter(Boolean)
      parts.forEach((p) => commitTag(p))
      setInputValue("")
      setShowDropdown(false)
      setActiveIndex(-1)
    }
  }

  const handleSuggestionClick = (tag: Tag) => {
    addTagToNote(noteId, tag.id)
    setInputValue("")
    setShowDropdown(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const handleBlur = () => {
    // Delay to allow suggestion click to fire first
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setShowDropdown(false)
        // Commit any pending input on blur
        if (inputValue.trim()) {
          const parts = inputValue
            .split(/,/)
            .map((p) => p.trim())
            .filter(Boolean)
          parts.forEach((p) => commitTag(p))
          setInputValue("")
        }
      }
    }, 150)
  }

  const visibleSuggestions = showDropdown && query.length >= 0 ? suggestions.slice(0, 8) : []

  return (
    <div className="relative flex flex-wrap items-center gap-1.5 border-t border-border/50 px-6 py-3">
      {/* Assigned tag pills */}
      {assignedTags.map((tag) => (
        <span
          key={tag.id}
          className="group inline-flex items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-[12px] text-muted-foreground"
        >
          #{tag.name}
          <button
            onClick={() => removeTagFromNote(noteId, tag.id)}
            className="ml-0.5 rounded-full p-0.5 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
            aria-label={`Remove tag ${tag.name}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      {/* Input */}
      <div className="relative flex items-center">
        <span className="text-[12px] text-muted-foreground/50 select-none">#</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue.startsWith("#") ? inputValue.slice(1) : inputValue}
          onChange={(e) => {
            const raw = e.target.value
            // Comma triggers immediate commit of preceding tag(s)
            if (raw.includes(",")) {
              const parts = raw.split(",").map((p) => p.trim()).filter(Boolean)
              // Commit all complete parts (before last comma)
              // If ends with comma, commit all; otherwise keep last part as input
              const endsWithComma = raw.trimEnd().endsWith(",")
              const toCommit = endsWithComma ? parts : parts.slice(0, -1)
              const remaining = endsWithComma ? "" : parts[parts.length - 1] || ""
              toCommit.forEach((p) => commitTag(p))
              setInputValue(remaining)
              setActiveIndex(-1)
              setShowDropdown(remaining.length > 0)
              return
            }
            setInputValue(raw)
            setActiveIndex(-1)
            setShowDropdown(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          onBlur={handleBlur}
          placeholder={assignedTags.length === 0 ? "Add tags..." : ""}
          className="w-[80px] min-w-[60px] bg-transparent text-[12px] text-muted-foreground outline-none placeholder:text-muted-foreground/40 focus:w-[120px] transition-[width] duration-150"
          aria-autocomplete="list"
          aria-expanded={visibleSuggestions.length > 0}
        />
      </div>

      {/* Autocomplete dropdown */}
      {visibleSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-6 z-50 mb-1 max-h-40 overflow-y-auto rounded-md border border-border bg-popover shadow-md"
          role="listbox"
        >
          {visibleSuggestions.map((tag, i) => (
            <button
              key={tag.id}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSuggestionClick(tag)
              }}
              className={cn(
                "flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[12px] text-foreground transition-colors hover:bg-secondary",
                i === activeIndex && "bg-secondary"
              )}
            >
              <span className="text-muted-foreground">#</span>
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface NoteEditorProps {
  noteId?: string
  onClose?: () => void
}

export function NoteEditor({ noteId: propNoteId, onClose }: NoteEditorProps = {}) {
  const storeSelectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const activeNoteId = propNoteId ?? storeSelectedNoteId
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const notes = usePlotStore((s) => s.notes)
  const folders = usePlotStore((s) => s.folders)
  const updateNote = usePlotStore((s) => s.updateNote)
  const togglePin = usePlotStore((s) => s.togglePin)
  const toggleArchive = usePlotStore((s) => s.toggleArchive)
  const deleteNote = usePlotStore((s) => s.deleteNote)
  const duplicateNote = usePlotStore((s) => s.duplicateNote)
  const setMergePickerOpen = usePlotStore((s) => s.setMergePickerOpen)
  const setLinkPickerOpen = usePlotStore((s) => s.setLinkPickerOpen)
  const detailsOpen = usePlotStore((s) => s.detailsOpen)
  const toggleDetailsOpen = usePlotStore((s) => s.toggleDetailsOpen)
  const sidebarCollapsed = usePlotStore((s) => s.sidebarCollapsed)
  const confirmDelete = useSettingsStore((s) => s.confirmDelete)

  const note = notes.find((n) => n.id === activeNoteId) ?? null
  const focusMode = sidebarCollapsed && !detailsOpen

  const [localTitle, setLocalTitle] = useState("")
  const noteIdRef = useRef(note?.id)

  useEffect(() => {
    noteIdRef.current = note?.id
    if (note) {
      setLocalTitle(note.title)
    }
  }, [note?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!note) return
    const capturedId = note.id
    const timer = setTimeout(() => {
      if (noteIdRef.current !== capturedId) return
      if (localTitle !== note.title) {
        updateNote(capturedId, { title: localTitle })
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
        onClose ? onClose() : setSelectedNoteId(null)
        return
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [note, togglePin, deleteNote, setSelectedNoteId, confirmDelete])

  if (!note) return null

  const currentFolder = folders.find((f) => f.id === note.folderId)

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* SURFACE: centered column, constrained in focus mode */}
      <div
        className={cn(
          "flex flex-col flex-1 overflow-hidden w-full mx-auto",
          focusMode
            ? "max-w-[880px] transition-[max-width] duration-300"
            : "max-w-none"
        )}
      >
      {/* Editor Header */}
      <header className={cn(
        "flex items-center justify-between border-b border-border py-2",
        focusMode ? "px-6" : "px-4"
      )}>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onClose ? onClose() : setSelectedNoteId(null)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Back to list</TooltipContent>
          </Tooltip>
          <span className="mx-1 h-4 w-px bg-border" />
          {currentFolder && (
            <span className="flex items-center gap-1.5 text-[14px] text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: currentFolder.color }}
              />
              {currentFolder.name}
            </span>
          )}
          {!currentFolder && (
            <span className="text-[14px] text-muted-foreground">
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
                <Copy className="h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMergePickerOpen(true, note.id)}>
                <Merge className="h-4 w-4" />
                Merge with...
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLinkPickerOpen(true, note.id)}>
                <Link2 className="h-4 w-4" />
                Link to...
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
                  onClose ? onClose() : setSelectedNoteId(null)
                }}
              >
                <Trash2 className="h-4 w-4" />
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
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4">
          <NoteEditorAdapter note={note} />
        </div>
        <NoteTagBar noteId={note.id} noteTags={note.tags ?? []} />
        <BacklinksFooter noteId={note.id} />
      </div>
      </div>
    </div>
  )
}
