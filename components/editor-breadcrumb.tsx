"use client"

import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { useActiveSpace, setActiveRoute, setActiveFolderId, getActiveRoute, DEFAULT_ROUTES } from "@/lib/table-route"
import { IconChevronRight } from "@/components/plot-icons"
import type { Note, ActivitySpace } from "@/lib/types"

interface EditorBreadcrumbProps {
  note: Note
  onClose?: () => void
}

const SPACE_LABELS: Record<ActivitySpace, string> = {
  home: "Home",
  notes: "Notes",
  wiki: "Wiki",
  calendar: "Calendar",
  ontology: "Graph",
}

export function EditorBreadcrumb({ note, onClose }: EditorBreadcrumbProps) {
  const router = useRouter()
  const activeSpace = useActiveSpace()
  const folders = usePlotStore((s) => s.folders)

  const folder = note.folderId ? folders.find((f) => f.id === note.folderId) : null

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

  return (
    <nav className="flex items-center gap-1 min-w-0">
      {/* Space crumb */}
      <button
        onClick={(e) => { e.stopPropagation(); navigateToSpace() }}
        className="shrink-0 text-lg text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        {SPACE_LABELS[activeSpace]}
      </button>

      {/* Folder crumb (optional) */}
      {folder && (
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

      {/* Note title crumb (non-clickable, current page) */}
      <span className="min-w-0 truncate text-lg font-medium text-foreground">
        {note.title || "Untitled"}
      </span>
    </nav>
  )
}
