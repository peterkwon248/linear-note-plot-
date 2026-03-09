"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { NotesTable } from "@/components/notes-table"
import {
  Eye,
  Plus,
  Filter,
  Trash2,
  Pencil,
  MoreHorizontal,
  ChevronLeft,
  Save,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SavedView } from "@/lib/types"
import type { FilterRule, ViewState } from "@/lib/view-engine/types"

/* ── Helpers ──────────────────────────────────────── */

function formatFilterLabel(field: string, op: string, value: string): string {
  const fieldLabels: Record<string, string> = {
    status: "Status", priority: "Priority", project: "Project",
    tags: "Tags", pinned: "Pinned", source: "Source",
    links: "Links", reads: "Reads", updatedAt: "Updated",
    createdAt: "Created", content: "Content", wordCount: "Words",
    title: "Title",
  }
  const opLabels: Record<string, string> = {
    eq: "is", neq: "is not", gt: ">", lt: "<",
  }
  return `${fieldLabels[field] ?? field} ${opLabels[op] ?? op} ${value}`
}

/* ── ViewsView ────────────────────────────────────── */

export function ViewsView() {
  const savedViews = usePlotStore((s) => s.savedViews)
  const notes = usePlotStore((s) => s.notes)
  const createSavedView = usePlotStore((s) => s.createSavedView)
  const updateSavedView = usePlotStore((s) => s.updateSavedView)
  const deleteSavedView = usePlotStore((s) => s.deleteSavedView)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)
  const setViewState = usePlotStore((s) => s.setViewState)
  const viewStateByContext = usePlotStore((s) => s.viewStateByContext)

  /* ── Mode: list vs detail ── */
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const activeView = savedViews.find((v) => v.id === activeViewId) ?? null

  /* ── List mode state ── */
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  /* ── Detail mode: header name editing ── */
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const titleInputRef = useRef<HTMLInputElement>(null)

  /* ── Note count for list (lightweight) ── */
  const activeNoteCount = useMemo(() => {
    return notes.filter((n) => !n.archived && !n.trashed).length
  }, [notes])

  const viewNoteCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    const activeNotes = notes.filter((n) => !n.archived && !n.trashed)

    for (const view of savedViews) {
      if (view.filters.length === 0) {
        counts[view.id] = activeNotes.length
        continue
      }
      counts[view.id] = activeNotes.filter((n) =>
        view.filters.every((f) => {
          const fieldVal = (n as any)[f.field]
          switch (f.operator) {
            case "eq": return String(fieldVal) === f.value
            case "neq": return String(fieldVal) !== f.value
            case "gt": return Number(fieldVal) > Number(f.value)
            case "lt": return Number(fieldVal) < Number(f.value)
            default: return true
          }
        })
      ).length
    }
    return counts
  }, [notes, savedViews])

  /* ── Enter detail mode ── */
  const openView = useCallback((view: SavedView) => {
    // Seed viewStateByContext["savedView"] with this view's saved config
    const patch: Partial<ViewState> = {
      filters: (view.filters ?? []) as FilterRule[],
      sortField: (view.sortField as any) ?? "updatedAt",
      sortDirection: (view.sortDirection as any) ?? "desc",
      groupBy: (view.groupBy as any) ?? "none",
      viewMode: (view.viewMode as any) ?? "table",
    }
    setViewState("savedView", patch)
    setActiveViewId(view.id)
  }, [setViewState])

  /* ── Create new view → open it ── */
  const handleNewView = useCallback(() => {
    const id = createSavedView(`View ${savedViews.length + 1}`, { filters: [] })
    const newView = usePlotStore.getState().savedViews.find((v) => v.id === id)
    if (newView) {
      openView(newView)
      // Start editing the title immediately
      setIsEditingTitle(true)
      setEditTitle(newView.name)
    }
  }, [createSavedView, savedViews.length, openView])

  /* ── Save current viewState back to SavedView ── */
  const handleSaveView = useCallback(() => {
    if (!activeViewId) return
    const currentViewState = viewStateByContext["savedView"]
    if (!currentViewState) return

    updateSavedView(activeViewId, {
      filters: currentViewState.filters as any,
      sortField: currentViewState.sortField,
      sortDirection: currentViewState.sortDirection,
      groupBy: currentViewState.groupBy,
      viewMode: currentViewState.viewMode,
    })
  }, [activeViewId, viewStateByContext, updateSavedView])

  /* ── Back to list ── */
  const handleBack = useCallback(() => {
    setActiveViewId(null)
    setIsEditingTitle(false)
  }, [])

  /* ── Rename in list ── */
  const handleStartEdit = (view: SavedView) => {
    setEditingId(view.id)
    setEditingName(view.name)
  }

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      updateSavedView(editingId, { name: editingName.trim() })
    }
    setEditingId(null)
    setEditingName("")
  }

  /* ── Title edit in detail mode ── */
  const handleSaveTitle = useCallback(() => {
    if (activeViewId && editTitle.trim()) {
      updateSavedView(activeViewId, { name: editTitle.trim() })
    }
    setIsEditingTitle(false)
  }, [activeViewId, editTitle, updateSavedView])

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  /* ── Check if current view state differs from saved ── */
  const hasUnsavedChanges = useMemo(() => {
    if (!activeView) return false
    const current = viewStateByContext["savedView"]
    if (!current) return false

    const savedFilters = JSON.stringify(activeView.filters ?? [])
    const currentFilters = JSON.stringify(current.filters ?? [])
    if (savedFilters !== currentFilters) return true

    if ((activeView.sortField ?? "updatedAt") !== current.sortField) return true
    if ((activeView.sortDirection ?? "desc") !== current.sortDirection) return true
    if ((activeView.groupBy ?? "none") !== current.groupBy) return true
    if ((activeView.viewMode ?? "table") !== current.viewMode) return true

    return false
  }, [activeView, viewStateByContext])

  /* ── Note editor shortcut ── */
  if (selectedNoteId) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <NoteEditor />
        <NoteInspector />
      </div>
    )
  }

  /* ══════════════════════════════════════════════════
     DETAIL MODE — Full NotesTable for the selected view
     ══════════════════════════════════════════════════ */
  if (activeView) {
    return (
      <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
        {/* Detail Header */}
        <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-[13px]">Views</span>
          </button>

          <span className="text-muted-foreground/40">/</span>

          {/* View name (editable) */}
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle()
                if (e.key === "Escape") setIsEditingTitle(false)
              }}
              onBlur={handleSaveTitle}
              className="flex-1 bg-transparent text-[14px] font-semibold text-foreground focus:outline-none"
            />
          ) : (
            <button
              onClick={() => {
                setIsEditingTitle(true)
                setEditTitle(activeView.name)
              }}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[14px] font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              {activeView.name}
            </button>
          )}

          <div className="flex-1" />

          {/* Save button */}
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveView}
              className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
          )}

          {/* Delete view */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onSelect={() => {
                  setIsEditingTitle(true)
                  setEditTitle(activeView.name)
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="text-[13px]">Rename</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  handleBack()
                  deleteSavedView(activeView.id)
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="text-[13px]">Delete view</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* NotesTable — fully reused with savedView context */}
        <NotesTable
          context="savedView"
          showTabs={false}
          hideCreateButton={false}
        />
      </main>
    )
  }

  /* ══════════════════════════════════════════════════
     LIST MODE — Saved views list
     ══════════════════════════════════════════════════ */
  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-1">
        <h1 className="text-base font-semibold text-foreground">Views</h1>
        <button
          onClick={handleNewView}
          className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
        >
          <Plus className="h-3.5 w-3.5" />
          New view
        </button>
      </header>

      <p className="px-5 pb-3 text-[13px] text-muted-foreground">
        Save custom filter, sort, and display combinations as reusable views.
      </p>

      {/* Content */}
      <ScrollArea className="flex-1">
        {savedViews.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/50 mb-5">
              <Eye className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-[15px] font-medium text-foreground">
              No saved views yet
            </p>
            <p className="mt-1.5 max-w-[280px] text-[13px] text-muted-foreground/60 leading-relaxed">
              Create a view to save custom filter, sort, and grouping combinations for quick access.
            </p>
            <button
              onClick={handleNewView}
              className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            >
              <Plus className="h-3.5 w-3.5" />
              Create your first view
            </button>
          </div>
        ) : (
          /* ── Views list ── */
          <div className="px-2">
            {savedViews.map((view) => {
              const matchCount = viewNoteCounts[view.id] ?? 0
              const isEditing = editingId === view.id

              return (
                <div
                  key={view.id}
                  onClick={() => openView(view)}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer hover:bg-secondary/40"
                >
                  <Eye className="h-4 w-4 shrink-0 text-muted-foreground/50" />

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit()
                          if (e.key === "Escape") {
                            setEditingId(null)
                            setEditingName("")
                          }
                        }}
                        onBlur={handleSaveEdit}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent text-[14px] text-foreground focus:outline-none"
                      />
                    ) : (
                      <span className="truncate text-[14px] text-foreground">
                        {view.name}
                      </span>
                    )}
                  </div>

                  {/* Filter count badge */}
                  {view.filters.length > 0 && (
                    <span className="flex items-center gap-1 rounded-md bg-secondary/60 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      <Filter className="h-3 w-3" />
                      {view.filters.length}
                    </span>
                  )}

                  {/* Note count */}
                  <span className="text-[13px] tabular-nums text-muted-foreground/60">
                    {matchCount}
                  </span>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md p-1 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:!bg-secondary"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onSelect={() => handleStartEdit(view)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="text-[13px]">Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => deleteSavedView(view.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="text-[13px]">Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </main>
  )
}
