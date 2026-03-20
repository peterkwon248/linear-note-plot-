"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Pin,
  Archive,
  Trash2,
  MoreHorizontal,
  Copy,
  PanelRight,
  Merge,
  Link2,
  BookOpen,
  PenLine,
  Globe,
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
import { usePlotStore } from "@/lib/store"
import { EditorBreadcrumb } from "@/components/editor-breadcrumb"
import { useSettingsStore } from "@/lib/settings-store"
import { NoteEditorAdapter } from "@/components/editor/NoteEditorAdapter"
import { FixedToolbar } from "@/components/editor/FixedToolbar"
import { BacklinksFooter } from "@/components/editor/backlinks-footer"
import type { Editor } from "@tiptap/react"
import type { Note, Relation, Tag } from "@/lib/types"
import { WikiTOC } from "@/components/editor/wiki-toc"
import { WikiInfobox } from "@/components/editor/wiki-infobox"
import { WikiCategories } from "@/components/editor/wiki-categories"
import { WikiDisambig } from "@/components/editor/wiki-disambig"
import { WikiRelatedDocs } from "@/components/editor/wiki-related-docs"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import { shortRelative } from "@/lib/format-utils"

interface NoteEditorProps {
  noteId?: string
  onClose?: () => void
}

export function NoteEditor({ noteId: propNoteId, onClose }: NoteEditorProps = {}) {
  const storeSelectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const activeNoteId = propNoteId ?? storeSelectedNoteId
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const notes = usePlotStore((s) => s.notes)
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
  const convertToWiki = usePlotStore((s) => s.convertToWiki)
  const revertFromWiki = usePlotStore((s) => s.revertFromWiki)
  const allTags = usePlotStore((s) => s.tags)
  const relations = usePlotStore((s) => s.relations)

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

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* SURFACE: full-width column */}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
      {/* Editor Header */}
      <header className={cn(
        "flex items-center justify-between border-b border-border py-2 px-4"
      )}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <EditorBreadcrumb note={note} onClose={onClose} />
          {note.isWiki && (
            <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-2xs font-medium text-purple-400 shrink-0">
              <Globe className="h-3 w-3" />
              Wiki
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
                  note.pinned ? "text-chart-3" : "text-muted-foreground"
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
              {note.isWiki ? (
                <DropdownMenuItem onClick={() => revertFromWiki(note.id)}>
                  <Globe className="h-4 w-4" />
                  Revert from Wiki
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => convertToWiki(note.id)}>
                  <Globe className="h-4 w-4" />
                  Convert to Wiki
                </DropdownMenuItem>
              )}
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
                  isReadMode ? "text-accent" : "text-muted-foreground"
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
        <h1 className="w-full bg-transparent px-6 pt-6 text-[28px] font-semibold text-foreground">
          {localTitle || "Untitled"}
        </h1>
      ) : (
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full bg-transparent px-6 pt-6 text-[28px] font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
        />
      )}

      {/* Wiki aliases — only shown outside of wiki read mode */}
      {note.isWiki && !isReadMode && note.aliases && note.aliases.length > 0 && (
        <div className="flex items-center gap-1.5 px-6 pt-1">
          <span className="text-xs text-muted-foreground/60">Also known as:</span>
          {note.aliases.map((alias, i) => (
            <span
              key={i}
              className="rounded-full bg-secondary px-2 py-0.5 text-2xs text-muted-foreground"
            >
              {alias}
            </span>
          ))}
        </div>
      )}

      {/* Content Editor */}
      {note.isWiki && isReadMode ? (
        <WikiReadLayout
          note={note}
          allTags={allTags}
          relations={relations}
          onEditorReady={handleEditorReady}
        />
      ) : (
        /* Normal mode / wiki edit mode */
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto flex flex-col">
          {note.isWiki && !isReadMode && (
            <div className="px-6 pt-4">
              <WikiInfobox
                noteId={note.id}
                entries={note.wikiInfobox ?? []}
                editable={true}
                className="max-w-[400px]"
              />
            </div>
          )}
          <div className="px-6 py-4 min-w-0 flex-1 flex flex-col">
            <NoteEditorAdapter note={note} onEditorReady={handleEditorReady} editable={!isReadMode} />
            <BacklinksFooter noteId={note.id} />
          </div>
        </div>
      )}
      </div>

      {/* FixedToolbar — outside SURFACE, full width (hidden in read mode) */}
      {!isReadMode && <FixedToolbar editor={editorInstance} />}
    </div>
  )
}

/* ── Wiki Read Mode: 3-column layout ──────────────────────── */

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-2xs text-muted-foreground">{label}</span>
      <span className="text-2xs font-medium text-foreground">{value}</span>
    </div>
  )
}

function WikiReadLayout({
  note,
  allTags,
  relations,
  onEditorReady,
}: {
  note: Note
  allTags: Tag[]
  relations: Relation[]
  onEditorReady: (editor: unknown) => void
}) {
  const backlinks = useBacklinksFor(note.id)

  const backlinkCount = backlinks.length
  const relationCount = relations.filter(
    (r) => r.sourceNoteId === note.id || r.targetNoteId === note.id
  ).length

  return (
    <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex">
      {/* Left: TOC sidebar */}
      <aside className="w-[200px] shrink-0 overflow-y-auto border-r border-border p-4">
        <div className="sticky top-0">
          <WikiTOC content={note.content} className="w-full" />
        </div>
      </aside>

      {/* Center: Article content */}
      <div className="flex-1 overflow-y-auto">
        <div className="wiki-read-content px-8 py-6 max-w-[780px]">
          {/* Disambig banner */}
          <WikiDisambig noteId={note.id} noteTitle={note.title} />

          {/* Aliases as subtitle */}
          {note.aliases && note.aliases.length > 0 && (
            <p className="text-sm text-muted-foreground mb-6">
              {note.aliases.join(" · ")}
            </p>
          )}

          {/* Article body */}
          <NoteEditorAdapter note={note} onEditorReady={onEditorReady} editable={false} />

          {/* Related wiki docs */}
          <WikiRelatedDocs noteId={note.id} />

          {/* Backlinks */}
          <BacklinksFooter noteId={note.id} />
        </div>
      </div>

      {/* Right: Infobox sidebar */}
      <aside className="w-[260px] shrink-0 overflow-y-auto border-l border-border p-4 space-y-4">
        {/* Infobox */}
        {(note.wikiInfobox ?? []).length > 0 && (
          <WikiInfobox
            noteId={note.id}
            entries={note.wikiInfobox ?? []}
            editable={false}
            className="w-full"
          />
        )}

        {/* Categories as badges */}
        {note.tags.length > 0 && (
          <WikiCategories noteTagIds={note.tags} allTags={allTags} />
        )}

        {/* Activity stats */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Activity
          </h4>
          <div className="space-y-1.5">
            <StatRow label="Connected notes" value={`${backlinkCount}`} />
            <StatRow label="Ontology links" value={`${relationCount}`} />
            <StatRow label="Last modified" value={shortRelative(note.updatedAt)} />
          </div>
        </div>
      </aside>
    </div>
  )
}
