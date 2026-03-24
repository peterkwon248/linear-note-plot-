"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { Copy as PhCopy } from "@phosphor-icons/react/dist/ssr/Copy"
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr/SidebarSimple"
import { GitMerge } from "@phosphor-icons/react/dist/ssr/GitMerge"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { PencilLine } from "@phosphor-icons/react/dist/ssr/PencilLine"
import { Globe } from "@phosphor-icons/react/dist/ssr/Globe"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { pushUndo } from "@/lib/undo-manager"
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
  const deleteNote = usePlotStore((s) => s.deleteNote)
  const duplicateNote = usePlotStore((s) => s.duplicateNote)
  const setMergePickerOpen = usePlotStore((s) => s.setMergePickerOpen)
  const setLinkPickerOpen = usePlotStore((s) => s.setLinkPickerOpen)
  const detailsOpen = usePlotStore((s) => s.sidePanelOpen)
  const toggleDetailsOpen = usePlotStore((s) => s.toggleSidePanel)
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
          <ReferencedInBadges noteId={note.id} />
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
                <PushPin size={16} weight="regular" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{note.pinned ? "Unpin" : "PushPin"}</TooltipContent>
          </Tooltip>



          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary">
                <DotsThree size={16} weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => duplicateNote(note.id)}>
                <PhCopy size={16} weight="regular" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMergePickerOpen(true, note.id)}>
                <GitMerge size={16} weight="regular" />
                GitMerge with...
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLinkPickerOpen(true, note.id)}>
                <PhLink size={16} weight="regular" />
                Link to...
              </DropdownMenuItem>
              {/* Convert to Wiki removed — WikiArticle is now separate entity */}
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
                <Trash size={16} weight="regular" />
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
                {isReadMode ? <BookOpen size={16} weight="regular" /> : <PencilLine size={16} weight="regular" />}
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
                <SidebarSimple size={16} weight="regular" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{detailsOpen ? "Hide details" : "Show details"}</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Title */}
      {isReadMode ? (
        <h1 className="w-full bg-transparent px-6 pt-6 text-title font-semibold text-foreground">
          {localTitle || "Untitled"}
        </h1>
      ) : (
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full bg-transparent px-6 pt-6 text-title font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
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
      {/* WikiReadLayout removed — wiki rendering now handled by WikiArticleView */}
      {false ? (
        null
      ) : (
        /* Normal note editor */
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
      {!isReadMode && <FixedToolbar editor={editorInstance} noteId={activeNoteId ?? undefined} />}
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

/* ── Referenced In Badges ── */

function ReferencedInBadges({ noteId }: { noteId: string }) {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)

  const refs = useMemo(() => {
    return wikiArticles.filter((a) =>
      a.blocks.some((b) => b.type === "note-ref" && b.noteId === noteId)
    )
  }, [wikiArticles, noteId])

  if (refs.length === 0) return null

  const MAX_BADGES = 3
  const visible = refs.slice(0, MAX_BADGES)
  const overflow = refs.length - MAX_BADGES

  return (
    <div className="flex items-center gap-1 shrink-0">
      <span className="text-2xs text-muted-foreground/30">in</span>
      {visible.map((a) => (
        <button
          key={a.id}
          onClick={() => {
            import("@/lib/table-route").then(m => m.setActiveRoute("/wiki"))
            import("@/lib/wiki-article-nav").then(m => m.navigateToWikiArticle(a.id))
          }}
          className="rounded-[4px] bg-accent/8 px-1.5 py-px text-2xs font-medium text-accent/60 hover:text-accent transition-colors duration-100"
        >
          {a.title}
        </button>
      ))}
      {overflow > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="rounded-[4px] bg-secondary/50 px-1.5 py-px text-2xs font-medium text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-100">
              +{overflow} more
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto min-w-[140px] p-1">
            {refs.slice(MAX_BADGES).map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  import("@/lib/table-route").then(m => m.setActiveRoute("/wiki"))
                  import("@/lib/wiki-article-nav").then(m => m.navigateToWikiArticle(a.id))
                }}
                className="flex w-full items-center rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                {a.title}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
