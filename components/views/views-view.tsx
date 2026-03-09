"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { NotesTable } from "@/components/notes-table"
import { NoteDetailPanel } from "@/components/note-detail-panel"
import { useBacklinksIndex } from "@/lib/search/use-backlinks-index"
import { runAnalysis } from "@/lib/analysis"
import type { AnalysisResult } from "@/lib/analysis"
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
  Activity,
  AlertTriangle,
  Unlink,
  Clock,
  Brain,
  ArrowUpCircle,
  FileX,
  CalendarClock,
  ChevronRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
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

/* ── Insight display config ───────────────────────── */

const SEVERITY_STYLES: Record<string, { dot: string; badge: string }> = {
  critical: { dot: "bg-destructive", badge: "bg-destructive/10 text-destructive" },
  warning: { dot: "bg-chart-3", badge: "bg-chart-3/10 text-chart-3" },
  info: { dot: "bg-muted-foreground/40", badge: "bg-muted-foreground/10 text-muted-foreground" },
}

const RULE_ICONS: Record<string, React.ReactNode> = {
  "inbox-neglect": <CalendarClock className="h-4 w-4" />,
  "overdue-srs": <Brain className="h-4 w-4" />,
  "stale-notes": <Clock className="h-4 w-4" />,
  "orphan-notes": <Unlink className="h-4 w-4" />,
  "high-lapse-srs": <AlertTriangle className="h-4 w-4" />,
  "stuck-capture": <ArrowUpCircle className="h-4 w-4" />,
  "empty-notes": <FileX className="h-4 w-4" />,
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

  /* ── Insight mode ── */
  const [activeInsight, setActiveInsight] = useState<AnalysisResult | null>(null)
  const [insightPreviewId, setInsightPreviewId] = useState<string | null>(null)

  /* ── Analysis engine ── */
  const srsStateByNoteId = usePlotStore((s) => s.srsStateByNoteId)
  const openNote = usePlotStore((s) => s.openNote)
  const backlinks = useBacklinksIndex()

  const analysisResults = useMemo(
    () => runAnalysis(notes, srsStateByNoteId, backlinks),
    [notes, srsStateByNoteId, backlinks],
  )

  const totalInsightCount = useMemo(
    () => analysisResults.reduce((sum, r) => sum + r.count, 0),
    [analysisResults],
  )

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
     INSIGHT DETAIL MODE — Show matched notes for a rule
     ══════════════════════════════════════════════════ */
  if (activeInsight) {
    const matchedNotes = notes.filter((n) => activeInsight.noteIds.includes(n.id))
    const severity = SEVERITY_STYLES[activeInsight.severity] ?? SEVERITY_STYLES.info

    return (
      <div className="flex flex-1 overflow-hidden">
        <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
          {/* Header */}
          <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
            <button
              onClick={() => { setActiveInsight(null); setInsightPreviewId(null) }}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-[13px]">Views</span>
            </button>
            <span className="text-muted-foreground/40">/</span>
            <div className="flex items-center gap-2">
              <span className={severity.dot.replace("bg-", "text-")}>
                {RULE_ICONS[activeInsight.ruleId] ?? <Activity className="h-4 w-4" />}
              </span>
              <span className="text-[14px] font-semibold text-foreground">
                {activeInsight.label}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${severity.badge}`}>
                {activeInsight.count}
              </span>
            </div>
          </header>

          <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-2">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground">
              {activeInsight.description}
            </span>
          </div>

          {/* Note rows */}
          <div className="flex-1 overflow-y-auto">
            {matchedNotes.map((note) => (
              <div
                key={note.id}
                className={`group flex items-center border-b border-border px-5 py-2.5 transition-colors cursor-pointer ${
                  insightPreviewId === note.id
                    ? "bg-accent/8 border-l-2 border-l-accent"
                    : "hover:bg-secondary/30"
                }`}
                onClick={() => setInsightPreviewId(note.id)}
                onDoubleClick={() => openNote(note.id)}
              >
                <div className="mr-3 shrink-0">
                  <div className={`h-2 w-2 rounded-full ${severity.dot}`} />
                </div>
                <div className="flex flex-1 flex-col gap-0.5 min-w-0 pr-3">
                  <span className="truncate text-[15px] text-foreground">
                    {note.title || "Untitled"}
                  </span>
                  {note.preview && (
                    <span className="truncate text-[12px] text-muted-foreground">
                      {note.preview}
                    </span>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-secondary/50 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground mr-3">
                  {note.status}
                </span>
                <span className="shrink-0 text-[14px] tabular-nums text-muted-foreground">
                  {format(new Date(note.updatedAt), "MMM d")}
                </span>
              </div>
            ))}
          </div>
        </main>

        {/* Detail panel */}
        {insightPreviewId && (
          <aside className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden border-l border-border bg-card animate-in slide-in-from-right-4 fade-in duration-200">
            <NoteDetailPanel
              noteId={insightPreviewId}
              onClose={() => setInsightPreviewId(null)}
              onOpenNote={(id) => setInsightPreviewId(id)}
              onEditNote={() => {
                openNote(insightPreviewId)
                setInsightPreviewId(null)
              }}
              onTriageAction={() => setInsightPreviewId(null)}
              embedded
            />
          </aside>
        )}
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
        {/* ── Insights Section ── */}
        {analysisResults.length > 0 && (
          <div className="px-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-[13px] font-medium text-foreground">Insights</span>
              <span className="rounded-full bg-chart-3/10 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-chart-3">
                {totalInsightCount}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {analysisResults.map((result) => {
                const severity = SEVERITY_STYLES[result.severity] ?? SEVERITY_STYLES.info
                return (
                  <button
                    key={result.ruleId}
                    onClick={() => setActiveInsight(result)}
                    className="group flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-foreground/20 hover:bg-secondary/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className={severity.dot.replace("bg-", "text-")}>
                        {RULE_ICONS[result.ruleId] ?? <Activity className="h-4 w-4" />}
                      </span>
                      <span className="flex-1 truncate text-[13px] font-medium text-foreground">
                        {result.label}
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${severity.badge}`}>
                        {result.count}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {result.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Saved Views Section ── */}
        <div className="px-5 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-[13px] font-medium text-foreground">Saved Views</span>
          </div>
        </div>

        {savedViews.length === 0 ? (
          /* Empty state for saved views */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 mb-4">
              <Eye className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-[14px] font-medium text-foreground">
              No saved views yet
            </p>
            <p className="mt-1 max-w-[280px] text-[13px] text-muted-foreground/60 leading-relaxed">
              Create a view to save custom filter, sort, and grouping combinations.
            </p>
            <button
              onClick={handleNewView}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            >
              <Plus className="h-3.5 w-3.5" />
              Create your first view
            </button>
          </div>
        ) : (
          /* Views list */
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
