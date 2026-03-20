"use client"

import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { useActiveSpace, setActiveRoute, setActiveFolderId, DEFAULT_ROUTES } from "@/lib/table-route"
import { IconChevronRight } from "@/components/plot-icons"
import type { Note, ActivitySpace } from "@/lib/types"

interface EditorBreadcrumbProps {
  note: Note
  onClose?: () => void
}

const SPACE_LABELS: Record<ActivitySpace, string> = {
  inbox: "Inbox",
  notes: "Notes",
  wiki: "Wiki",
  ontology: "Graph",
}

export function EditorBreadcrumb({ note, onClose }: EditorBreadcrumbProps) {
  const router = useRouter()
  const activeSpace = useActiveSpace()
  const folders = usePlotStore((s) => s.folders)

  const folder = note.folderId ? folders.find((f) => f.id === note.folderId) : null

  const navigateToSpace = () => {
    if (onClose) { onClose(); return }
    const route = DEFAULT_ROUTES[activeSpace]
    setActiveRoute(route)
    router.push(route)
    usePlotStore.getState().setSelectedNoteId(null)
  }

  const navigateToFolder = () => {
    if (onClose) { onClose(); return }
    setActiveRoute("/notes")
    setActiveFolderId(note.folderId)
    router.push("/notes")
    usePlotStore.getState().setSelectedNoteId(null)
  }

  return (
    <nav className="flex items-center gap-1 min-w-0">
      {/* Space crumb */}
      <button
        onClick={navigateToSpace}
        className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        {SPACE_LABELS[activeSpace]}
      </button>

      {/* Folder crumb (optional) */}
      {folder && (
        <>
          <IconChevronRight size={12} className="shrink-0 text-muted-foreground/40" />
          <button
            onClick={navigateToFolder}
            className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            {folder.name}
          </button>
        </>
      )}

      {/* Separator before note title */}
      <IconChevronRight size={12} className="shrink-0 text-muted-foreground/40" />

      {/* Note title crumb (non-clickable, current page) */}
      <span className="min-w-0 truncate text-sm font-medium text-foreground">
        {note.title || "Untitled"}
      </span>
    </nav>
  )
}
