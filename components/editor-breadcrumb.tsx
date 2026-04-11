"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { useActiveSpace, setActiveRoute, setActiveFolderId, getActiveRoute, DEFAULT_ROUTES, setSecondarySpace, setSecondaryRoute, useSecondarySpace, clearSecondaryRoute } from "@/lib/table-route"
import { IconChevronRight } from "@/components/plot-icons"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { House } from "@phosphor-icons/react/dist/ssr/House"
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil"
import { BookOpenText } from "@phosphor-icons/react/dist/ssr/BookOpenText"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import type { Note, ActivitySpace } from "@/lib/types"
import { StatusShapeIcon } from "@/components/status-icon"

interface EditorBreadcrumbProps {
  note: Note
  onClose?: () => void
  pane?: 'primary' | 'secondary'
}

const SPACE_LABELS: Record<ActivitySpace, string> = {
  home: "Home",
  notes: "Notes",
  wiki: "Wiki",
  calendar: "Calendar",
  ontology: "Graph",
  library: "Library",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SPACE_ICONS: Record<ActivitySpace, any> = {
  home: House,
  notes: NotePencil,
  wiki: BookOpenText,
  calendar: CalendarBlank,
  ontology: Graph,
  library: Books,
}

const ALL_SPACES: ActivitySpace[] = ["home", "notes", "wiki", "calendar", "ontology", "library"]

export function EditorBreadcrumb({ note, onClose, pane = 'primary' }: EditorBreadcrumbProps) {
  const router = useRouter()
  const activeSpace = useActiveSpace()
  const secondarySpace = useSecondarySpace()
  const folders = usePlotStore((s) => s.folders)

  const folder = note.folderId ? folders.find((f) => f.id === note.folderId) : null
  // Notes always show "Notes" in breadcrumb regardless of which space opened the split
  const currentSpace = pane === 'secondary' ? 'notes' as ActivitySpace : activeSpace

  // Primary pane: navigate to space (close editor, show list)
  const navigateToSpace = () => {
    if (onClose) { onClose(); return }
    usePlotStore.getState().setSelectedNoteId(null)
    const route = DEFAULT_ROUTES[activeSpace]
    const currentRoute = getActiveRoute()
    setActiveRoute(route)
    if (currentRoute !== route) router.push(route)
  }

  const navigateToFolder = () => {
    if (onClose) { onClose(); return }
    usePlotStore.getState().setSelectedNoteId(null)
    const currentRoute = getActiveRoute()
    setActiveRoute("/notes")
    setActiveFolderId(note.folderId)
    if (currentRoute !== "/notes") router.push("/notes")
  }

  // Secondary pane: switch space via dropdown → show list in right panel
  const handleSecondarySpaceSwitch = (space: ActivitySpace) => {
    // Clear the secondary note so the panel shows the list view
    usePlotStore.getState().closeSecondary()
    setSecondarySpace(space)
  }

  // Secondary pane: "back to list" = close the note, keep secondarySpace for list view
  const handleSecondaryBackToList = () => {
    // closeSecondary clears everything, but we want to keep the space
    // So we just clear the note ID manually — the secondary route/space stays
    const store = usePlotStore.getState()
    // Clear note but keep secondary space active
    const currentSecSpace = secondarySpace
    store.closeSecondary()
    if (currentSecSpace) {
      setSecondarySpace(currentSecSpace)
    }
  }

  return (
    <nav className="flex items-center gap-1 min-w-0">
      {/* Space crumb */}
      {pane === 'secondary' ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 flex items-center gap-1 text-lg text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              {SPACE_LABELS[currentSpace]}
              <CaretDown size={12} weight="bold" className="text-muted-foreground/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {ALL_SPACES.map((space) => {
              const Icon = SPACE_ICONS[space]
              return (
                <DropdownMenuItem
                  key={space}
                  onClick={() => handleSecondarySpaceSwitch(space)}
                  className={cn(currentSpace === space && "bg-accent/10 text-accent")}
                >
                  <Icon size={16} weight="regular" />
                  {SPACE_LABELS[space]}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); navigateToSpace() }}
          className="shrink-0 text-lg text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          {SPACE_LABELS[currentSpace]}
        </button>
      )}

      {/* Folder crumb (optional, primary only) */}
      {folder && pane === 'primary' && (
        <>
          <IconChevronRight size={16} className="shrink-0 text-muted-foreground/40" />
          <button
            onClick={(e) => { e.stopPropagation(); navigateToFolder() }}
            className="shrink-0 text-lg text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            {folder.name}
          </button>
        </>
      )}

      {/* Separator before note title — clickable note picker */}
      <NotePickerChevron pane={pane} currentNoteId={note.id} />

      {/* Note title crumb */}
      <span className="min-w-0 truncate text-lg font-medium text-foreground">
        {note.title || "Untitled"}
      </span>
    </nav>
  )
}

function NotePickerChevron({ pane, currentNoteId }: { pane: 'primary' | 'secondary'; currentNoteId: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const notes = usePlotStore((s) => s.notes)
  const labels = usePlotStore((s) => s.labels)
  const openNote = usePlotStore((s) => s.openNote)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return notes
      .filter((n) => !n.trashed && n.id !== currentNoteId && n.title.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 20)
  }, [notes, query, currentNoteId])

  const getLabel = (labelId: string | null | undefined) =>
    labelId ? labels.find((l) => l.id === labelId) : null

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery("") }}>
      <PopoverTrigger asChild>
        <button className="shrink-0 rounded p-0.5 text-muted-foreground/40 hover:text-muted-foreground hover:bg-hover-bg transition-colors">
          <IconChevronRight size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0" sideOffset={4}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes..."
          className="w-full px-3.5 py-2.5 text-note bg-transparent border-b border-border text-foreground outline-none placeholder:text-muted-foreground/50"
        />
        <div className="max-h-[360px] overflow-y-auto py-1">
          {filtered.map((n) => {
            const label = getLabel(n.labelId)
            return (
              <button
                key={n.id}
                onClick={() => {
                  openNote(n.id, { pane })
                  setOpen(false)
                  setQuery("")
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-foreground/80 hover:bg-hover-bg transition-colors"
              >
                <StatusShapeIcon status={n.status} size={16} />
                <span className="truncate text-note font-medium flex-1">{n.title || "Untitled"}</span>
                {label && (
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: label.color + '20', color: label.color }}
                  >
                    {label.name}
                  </span>
                )}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="px-3.5 py-6 text-note text-muted-foreground/50 text-center">
              No notes found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
