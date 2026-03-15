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
  BookOpen,
  PenLine,
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
import { FixedToolbar } from "@/components/editor/FixedToolbar"
import { BacklinksFooter } from "@/components/editor/backlinks-footer"
import type { Editor } from "@tiptap/react"
import { LayoutModeSwitcher } from "@/components/editor/layout-mode-switcher"

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
  const confirmDelete = useSettingsStore((s) => s.confirmDelete)

  const note = notes.find((n) => n.id === activeNoteId) ?? null

  const [localTitle, setLocalTitle] = useState("")
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)
  const [isReadMode, setIsReadMode] = useState(false)
  const noteIdRef = useRef(note?.id)

  const handleEditorReady = useCallback((editor: unknown) => {
    setEditorInstance(editor as Editor | null)
  }, [])

  useEffect(() => {
    noteIdRef.current = note?.id
    if (note) {
      setLocalTitle(note.title)
      setIsReadMode(note.isWiki ?? false)
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
      // Ctrl+Shift+E: toggle read/edit mode
      if (mod && e.shiftKey && e.key === "E") {
        e.preventDefault()
        setIsReadMode((prev) => !prev)
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
      {/* SURFACE: full-width column */}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
      {/* Editor Header */}
      <header className={cn(
        "flex items-center justify-between border-b border-border py-2 px-4"
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

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsReadMode((prev) => !prev)}
                className={cn(
                  "rounded-md p-1.5 transition-colors hover:bg-secondary",
                  isReadMode ? "text-[#5e6ad2]" : "text-muted-foreground"
                )}
              >
                {isReadMode ? <BookOpen className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {isReadMode ? "Edit mode (Ctrl+Shift+E)" : "Read mode (Ctrl+Shift+E)"}
            </TooltipContent>
          </Tooltip>

          <span className="mx-0.5 h-4 w-px bg-border" />
          <LayoutModeSwitcher />
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

      {/* Title */}
      {isReadMode ? (
        <h1 className="w-full bg-transparent px-6 pt-6 text-[24px] font-semibold text-foreground">
          {localTitle || "Untitled"}
        </h1>
      ) : (
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full bg-transparent px-6 pt-6 text-[24px] font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
        />
      )}

      {/* Content Editor */}
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto flex flex-col">
        <div className="px-6 py-4 min-w-0 flex-1 flex flex-col">
          <NoteEditorAdapter note={note} onEditorReady={handleEditorReady} editable={!isReadMode} />
          <BacklinksFooter noteId={note.id} />
        </div>
      </div>
      </div>

      {/* FixedToolbar — outside SURFACE, full width (hidden in read mode) */}
      {!isReadMode && <FixedToolbar editor={editorInstance} />}
    </div>
  )
}
