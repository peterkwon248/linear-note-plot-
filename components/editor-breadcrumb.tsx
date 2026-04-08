"use client"

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
import { House } from "@phosphor-icons/react/dist/ssr/House"
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil"
import { BookOpenText } from "@phosphor-icons/react/dist/ssr/BookOpenText"
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank"
import { Graph } from "@phosphor-icons/react/dist/ssr/Graph"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import type { Note, ActivitySpace } from "@/lib/types"

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
  const currentSpace = pane === 'secondary' ? (secondarySpace ?? activeSpace) : activeSpace

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

      {/* Separator before note title */}
      <IconChevronRight size={16} className="shrink-0 text-muted-foreground/40" />

      {/* Note title crumb */}
      <span className="min-w-0 truncate text-lg font-medium text-foreground">
        {note.title || "Untitled"}
      </span>
    </nav>
  )
}
