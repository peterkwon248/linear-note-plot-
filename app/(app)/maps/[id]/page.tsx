"use client"

import { useState, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { getMapStats } from "@/lib/queries/notes"
import { KnowledgeMapCanvas } from "@/components/knowledge-map-canvas"
import { NoteDetailPanel } from "@/components/note-detail-panel"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import {
  Map as MapIcon,
  FileText,
  Link2,
  Plus,
  X,
  ArrowLeft,
  Search,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

export default function MapDetailPage() {
  const params = useParams()
  const router = useRouter()
  const mapId = params.id as string

  const notes = usePlotStore((s) => s.notes)
  const knowledgeMaps = usePlotStore((s) => s.knowledgeMaps)
  const addNoteToMap = usePlotStore((s) => s.addNoteToMap)
  const removeNoteFromMap = usePlotStore((s) => s.removeNoteFromMap)
  const openNote = usePlotStore((s) => s.openNote)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)

  const map = knowledgeMaps.find((m) => m.id === mapId)
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addQuery, setAddQuery] = useState("")

  const mapNotes = useMemo(
    () => (map ? notes.filter((n) => map.noteIds.includes(n.id)) : []),
    [map, notes]
  )

  const stats = useMemo(
    () => (map ? getMapStats(map, notes) : null),
    [map, notes]
  )

  // Notes available to add (not already in map, not archived)
  const addableNotes = useMemo(() => {
    if (!map) return []
    const inMap = new Set(map.noteIds)
    return notes
      .filter((n) => !inMap.has(n.id) && !n.archived)
      .filter((n) => {
        if (!addQuery.trim()) return true
        const q = addQuery.toLowerCase()
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      })
      .slice(0, 20)
  }, [map, notes, addQuery])

  const handleOpenNote = useCallback((id: string) => {
    setPreviewId(id)
    setFocusNoteId(id)
  }, [])

  const handleAddNote = useCallback((noteId: string) => {
    if (!map) return
    addNoteToMap(map.id, noteId)
    const note = notes.find((n) => n.id === noteId)
    toast.success(`Added "${note?.title || "Untitled"}" to map`)
  }, [map, addNoteToMap, notes])

  const handleRemoveNote = useCallback((noteId: string) => {
    if (!map) return
    removeNoteFromMap(map.id, noteId)
    const note = notes.find((n) => n.id === noteId)
    toast.success(`Removed "${note?.title || "Untitled"}" from map`)
    if (previewId === noteId) setPreviewId(null)
    if (focusNoteId === noteId) setFocusNoteId(null)
  }, [map, removeNoteFromMap, notes, previewId, focusNoteId])

  // Full editor mode
  if (selectedNoteId) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <NoteEditor />
        <NoteInspector />
      </div>
    )
  }

  if (!map) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-[13px] text-muted-foreground">Map not found.</p>
        <button
          onClick={() => router.push("/maps")}
          className="mt-2 text-[12px] text-accent hover:underline"
        >
          Back to Maps
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main content */}
      <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/maps")}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: map.color }}
            />
            <h1 className="text-base font-semibold text-foreground truncate">
              {map.title}
            </h1>
            {map.description && (
              <span className="text-[12px] text-muted-foreground truncate hidden sm:inline">
                — {map.description}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {stats && (
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mr-2">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {stats.noteCount}
                </span>
                <span className="flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  {stats.internalLinks}
                </span>
              </div>
            )}
            <button
              onClick={() => setAdding(!adding)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                adding
                  ? "bg-secondary text-foreground"
                  : "bg-accent text-accent-foreground hover:bg-accent/80"
              }`}
            >
              {adding ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {adding ? "Done" : "Add Notes"}
            </button>
          </div>
        </header>

        {/* Add notes panel */}
        {adding && (
          <div className="shrink-0 border-b border-border bg-secondary/20 px-5 py-3">
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={addQuery}
                onChange={(e) => setAddQuery(e.target.value)}
                placeholder="Search notes to add..."
                className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {addableNotes.length === 0 ? (
                <p className="text-[12px] text-muted-foreground/60 py-2">
                  {addQuery ? "No matching notes found." : "All notes are already in this map."}
                </p>
              ) : (
                addableNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/50 cursor-pointer"
                    onClick={() => handleAddNote(note.id)}
                  >
                    <Plus className="h-3 w-3 text-accent shrink-0" />
                    <span className="truncate text-[12px] text-foreground">{note.title || "Untitled"}</span>
                    <span className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      note.status === "inbox" ? "bg-accent/10 text-accent" :
                      note.status === "capture" ? "bg-chart-2/10 text-chart-2" :
                      "bg-chart-5/10 text-chart-5"
                    }`}>
                      {note.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Two-panel: Note list + Graph */}
        <div className="flex flex-1 overflow-hidden">
          {/* Note list sidebar */}
          <div className="w-[240px] shrink-0 border-r border-border overflow-y-auto">
            <div className="px-3 py-2 border-b border-border">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Notes ({mapNotes.length})
              </span>
            </div>
            {mapNotes.length === 0 ? (
              <div className="px-3 py-4">
                <p className="text-[12px] text-muted-foreground/60">No notes yet. Click "Add Notes" to get started.</p>
              </div>
            ) : (
              <div className="space-y-px py-1">
                {mapNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                      focusNoteId === note.id
                        ? "bg-accent/8 border-l-2 border-l-accent"
                        : "hover:bg-secondary/30"
                    }`}
                    onClick={() => handleOpenNote(note.id)}
                  >
                    <FileText className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                    <span className="truncate text-[12px] text-foreground flex-1">
                      {note.title || "Untitled"}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveNote(note.id) }}
                      className="shrink-0 rounded p-0.5 text-muted-foreground/0 group-hover:text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove from map"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Graph canvas */}
          <div className="flex-1 overflow-auto bg-secondary/5 flex items-center justify-center p-4">
            <KnowledgeMapCanvas
              map={map}
              notes={notes}
              onOpenNote={handleOpenNote}
              focusNoteId={focusNoteId}
            />
          </div>
        </div>
      </main>

      {/* Detail panel */}
      {previewId && (
        <aside className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-l border-border bg-card animate-in slide-in-from-right-4 fade-in duration-200">
          <NoteDetailPanel
            noteId={previewId}
            onClose={() => { setPreviewId(null) }}
            onOpenNote={(id) => handleOpenNote(id)}
            onEditNote={() => {
              openNote(previewId)
              setPreviewId(null)
            }}
            embedded
          />
        </aside>
      )}
    </div>
  )
}
