"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { getMapStats } from "@/lib/queries/notes"
import {
  Map as MapIcon,
  Plus,
  FileText,
  Link2,
  BarChart3,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function MapsView() {
  const router = useRouter()
  const notes = usePlotStore((s) => s.notes)
  const knowledgeMaps = usePlotStore((s) => s.knowledgeMaps)
  const createKnowledgeMap = usePlotStore((s) => s.createKnowledgeMap)
  const deleteKnowledgeMap = usePlotStore((s) => s.deleteKnowledgeMap)
  const updateKnowledgeMap = usePlotStore((s) => s.updateKnowledgeMap)

  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const backlinks = useBacklinksIndex()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")

  const handleCreate = () => {
    if (!newTitle.trim()) return
    const id = createKnowledgeMap(newTitle.trim(), newDescription.trim())
    toast.success(`Map "${newTitle.trim()}" created`)
    setNewTitle("")
    setNewDescription("")
    setCreating(false)
    router.push(`/maps/${id}`)
  }

  const handleDelete = (id: string, title: string) => {
    deleteKnowledgeMap(id)
    toast.success(`Map "${title}" deleted`)
  }

  const handleStartEdit = (map: { id: string; title: string; description: string }) => {
    setEditingId(map.id)
    setEditTitle(map.title)
    setEditDescription(map.description)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editTitle.trim()) return
    updateKnowledgeMap(editingId, { title: editTitle.trim(), description: editDescription.trim() })
    toast.success("Map updated")
    setEditingId(null)
  }

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-1">
        <div className="flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-base font-semibold text-foreground">Knowledge Maps</h1>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[12px] font-medium tabular-nums text-muted-foreground">
            {knowledgeMaps.length}
          </span>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[14px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
        >
          <Plus className="h-3.5 w-3.5" />
          New Map
        </button>
      </header>

      <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-2">
        <MapIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[12px] text-muted-foreground">
          Conceptual knowledge spaces for organizing related notes.
        </span>
      </div>

      {/* Create form */}
      {creating && (
        <div className="border-b border-border px-5 py-4 bg-secondary/20">
          <div className="space-y-3 max-w-md">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
                if (e.key === "Escape") {
                  setCreating(false)
                  setNewTitle("")
                  setNewDescription("")
                }
              }}
              placeholder="Map title..."
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
                if (e.key === "Escape") {
                  setCreating(false)
                  setNewTitle("")
                  setNewDescription("")
                }
              }}
              placeholder="Description (optional)..."
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="rounded-md bg-accent px-3 py-1.5 text-[14px] font-medium text-accent-foreground hover:bg-accent/80 disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => { setCreating(false); setNewTitle(""); setNewDescription("") }}
                className="rounded-md border border-border px-3 py-1.5 text-[14px] text-muted-foreground hover:bg-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maps grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {knowledgeMaps.length === 0 && !creating ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/50 mb-5">
              <MapIcon className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-[16px] font-medium text-foreground">Create your first knowledge map</p>
            <p className="mt-1.5 max-w-[280px] text-[14px] text-muted-foreground/60 leading-relaxed">
              Knowledge maps help you organize related notes into conceptual spaces.
            </p>
            <button
              onClick={() => setCreating(true)}
              className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[14px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Map
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {knowledgeMaps.map((map) => {
              const stats = getMapStats(map, notes, backlinks)
              const isEditing = editingId === map.id

              return (
                <div
                  key={map.id}
                  className="group relative rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/30 hover:bg-secondary/20 cursor-pointer"
                  onClick={() => {
                    if (!isEditing) router.push(`/maps/${map.id}`)
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="h-3.5 w-3.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: map.color }}
                      />
                      {isEditing ? (
                        <div className="flex-1 space-y-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-[15px] font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                          <input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                            placeholder="Description..."
                            className="w-full rounded border border-border bg-background px-2 py-1 text-[14px] focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                          <div className="flex gap-2">
                            <button onClick={handleSaveEdit} className="rounded bg-accent px-2 py-1 text-[12px] text-accent-foreground">Save</button>
                            <button onClick={() => setEditingId(null)} className="rounded border border-border px-2 py-1 text-[12px] text-muted-foreground">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <span className="truncate text-[15px] font-medium text-foreground">
                          {map.title}
                        </span>
                      )}
                    </div>
                    {!isEditing && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-secondary">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartEdit(map) }} className="text-[14px]">
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(map.id, map.title) }} className="text-[14px] text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Description */}
                  {!isEditing && map.description && (
                    <p className="mb-3 text-[14px] text-muted-foreground line-clamp-2">
                      {map.description}
                    </p>
                  )}

                  {/* Stats */}
                  {!isEditing && (
                    <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {stats.noteCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Link2 className="h-3.5 w-3.5" />
                        {stats.internalLinks}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5" />
                        {stats.stages.permanent}p / {stats.stages.capture}c / {stats.stages.inbox}i
                      </span>
                    </div>
                  )}

                  {/* Date */}
                  {!isEditing && (
                    <div className="mt-2 text-[11px] text-muted-foreground/60">
                      Updated {format(new Date(map.updatedAt), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
