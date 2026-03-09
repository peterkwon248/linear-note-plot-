"use client"

import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { PROJECT_STATUS_CONFIG, ProjectStatusDropdown } from "@/components/note-fields"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Plus,
  FolderOpen,
  Zap,
  Clock3,
  Coffee,
  SlidersHorizontal,
  Filter,
  Check,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import type { Project, ProjectStatus, ProjectFocus } from "@/lib/types"
import { useState, useMemo, useCallback } from "react"

/* ── Focus badge ──────────────────────────────────────── */

const FOCUS_CONFIG = {
  now: { label: "Now", icon: Zap, color: "#e5484d" },
  soon: { label: "Soon", icon: Clock3, color: "#f2c94c" },
  later: { label: "Later", icon: Coffee, color: "#5e6ad2" },
} as const

function FocusBadge({ project }: { project: Project }) {
  const cfg = project.focus ? FOCUS_CONFIG[project.focus] : null

  if (!cfg) {
    return <span className="text-muted-foreground/30 text-[12px]">—</span>
  }

  const Icon = cfg.icon
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1 cursor-default">
          <Icon className="h-4 w-4" style={{ color: cfg.color }} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[12px]">
        {cfg.label}
      </TooltipContent>
    </Tooltip>
  )
}

/* ── Project filter types ──────────────────────────────── */

type ProjectSortField = "name" | "status" | "focus" | "noteCount" | "targetDate"

interface ProjectFilter {
  type: "status" | "focus"
  value: string
}

const ALL_STATUSES: ProjectStatus[] = ["planning", "active", "review", "done", "canceled"]
const ALL_FOCUSES: { value: ProjectFocus; label: string }[] = [
  { value: "now", label: "Now" },
  { value: "soon", label: "Soon" },
  { value: "later", label: "Later" },
  { value: null, label: "No focus" },
]

/* ── Projects page ─────────────────────────────────────── */

export function ProjectsView() {
  const router = useRouter()
  const projects = usePlotStore((s) => s.projects)
  const notes = usePlotStore((s) => s.notes)
  const updateProject = usePlotStore((s) => s.updateProject)
  const createProject = usePlotStore((s) => s.createProject)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)

  const [filters, setFilters] = useState<ProjectFilter[]>([])
  const [sortField, setSortField] = useState<ProjectSortField>("name")
  const [sortAsc, setSortAsc] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")

  const hasFilter = useCallback((type: ProjectFilter["type"], value: string) => {
    return filters.some((f) => f.type === type && f.value === value)
  }, [filters])

  const toggleFilter = useCallback((type: ProjectFilter["type"], value: string) => {
    setFilters((prev) => {
      const exists = prev.some((f) => f.type === type && f.value === value)
      if (exists) return prev.filter((f) => !(f.type === type && f.value === value))
      return [...prev, { type, value }]
    })
  }, [])

  const filteredProjects = useMemo(() => {
    let result = [...projects]

    // Apply filters (OR within same type, AND across types)
    const statusFilters = filters.filter((f) => f.type === "status")
    const focusFilters = filters.filter((f) => f.type === "focus")

    if (statusFilters.length > 0) {
      result = result.filter((p) => statusFilters.some((f) => f.value === p.status))
    }
    if (focusFilters.length > 0) {
      result = result.filter((p) => focusFilters.some((f) => f.value === String(p.focus)))
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "name": cmp = a.name.localeCompare(b.name); break
        case "status": cmp = ALL_STATUSES.indexOf(a.status) - ALL_STATUSES.indexOf(b.status); break
        case "focus": {
          const order = ["now", "soon", "later", "null"]
          cmp = order.indexOf(String(a.focus)) - order.indexOf(String(b.focus))
          break
        }
        case "noteCount": {
          const ac = notes.filter((n) => n.projectId === a.id && !n.trashed).length
          const bc = notes.filter((n) => n.projectId === b.id && !n.trashed).length
          cmp = ac - bc
          break
        }
        case "targetDate": {
          const at = a.targetDate ? new Date(a.targetDate).getTime() : Infinity
          const bt = b.targetDate ? new Date(b.targetDate).getTime() : Infinity
          cmp = at - bt
          break
        }
      }
      return sortAsc ? cmp : -cmp
    })

    return result
  }, [projects, filters, sortField, sortAsc, notes])

  if (selectedNoteId) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <NoteEditor />
        <NoteInspector />
      </div>
    )
  }

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* Title */}
      <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-1">
        <h1 className="text-base font-semibold text-foreground">Projects</h1>
        <div className="flex items-center gap-1.5">
          <button
            className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[14px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            onClick={() => { setIsCreating(true); setNewProjectName("") }}
          >
            <Plus className="h-3.5 w-3.5" />
            New project
          </button>
        </div>
      </header>

      {/* Tabs + toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pt-1 pb-0">
        <div className="flex items-center gap-0">
          <button className="relative px-3 py-2 text-[15px] font-medium text-foreground">
            All projects
            <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-accent" />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[14px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Filter className="h-3.5 w-3.5" />
                Filter
                {filters.length > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/15 px-1 text-[11px] font-medium text-accent">
                    {filters.length}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span className="text-[14px]">Status</span>
                  {filters.filter((f) => f.type === "status").length > 0 && (
                    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/15 px-1 text-[11px] font-medium text-accent">
                      {filters.filter((f) => f.type === "status").length}
                    </span>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-44">
                  {ALL_STATUSES.map((s) => (
                    <DropdownMenuItem key={s} onSelect={(e) => { e.preventDefault(); toggleFilter("status", s) }}>
                      <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter("status", s) ? "text-accent opacity-100" : "opacity-0"}`} />
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: PROJECT_STATUS_CONFIG[s].color }}
                      />
                      <span className="text-[14px]">{PROJECT_STATUS_CONFIG[s].label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span className="text-[14px]">Focus</span>
                  {filters.filter((f) => f.type === "focus").length > 0 && (
                    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/15 px-1 text-[11px] font-medium text-accent">
                      {filters.filter((f) => f.type === "focus").length}
                    </span>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-40">
                  {ALL_FOCUSES.map((f) => (
                    <DropdownMenuItem key={String(f.value)} onSelect={(e) => { e.preventDefault(); toggleFilter("focus", String(f.value)) }}>
                      <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter("focus", String(f.value)) ? "text-accent opacity-100" : "opacity-0"}`} />
                      <span className="text-[14px]">{f.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {filters.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setFilters([])}>
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[14px]">Clear all filters</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Display dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[14px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Display
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground" disabled>
                Sort by
              </DropdownMenuItem>
              {([
                { field: "name" as const, label: "Name" },
                { field: "status" as const, label: "Status" },
                { field: "focus" as const, label: "Focus" },
                { field: "noteCount" as const, label: "Note count" },
                { field: "targetDate" as const, label: "Target date" },
              ]).map((opt) => (
                <DropdownMenuItem
                  key={opt.field}
                  onSelect={(e) => {
                    e.preventDefault()
                    if (sortField === opt.field) setSortAsc((v) => !v)
                    else { setSortField(opt.field); setSortAsc(true) }
                  }}
                >
                  <Check className={`h-3.5 w-3.5 shrink-0 ${sortField === opt.field ? "text-accent opacity-100" : "opacity-0"}`} />
                  <span className="text-[14px]">{opt.label}</span>
                  {sortField === opt.field && (
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {sortAsc ? "A→Z" : "Z→A"}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex shrink-0 items-center border-b border-border px-5 py-2">
        <div className="flex-1 min-w-0">
          <span className="text-[12px] font-medium text-muted-foreground">Name</span>
        </div>
        <div className="w-[56px] shrink-0 text-center">
          <span className="text-[12px] font-medium text-muted-foreground">Focus</span>
        </div>
        <div className="w-[56px] shrink-0 text-right">
          <span className="text-[12px] font-medium text-muted-foreground">Notes</span>
        </div>
        <div className="w-[90px] shrink-0 text-right">
          <span className="text-[12px] font-medium text-muted-foreground">Target date</span>
        </div>
        <div className="w-[100px] shrink-0 text-right">
          <span className="text-[12px] font-medium text-muted-foreground">Status</span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {isCreating && (
          <div className="flex items-center border-b border-border px-5 py-2.5 bg-secondary/20">
            <div className="flex flex-1 items-center gap-2.5 min-w-0 pr-3">
              <FolderOpen className="h-4 w-4 shrink-0 text-accent" />
              <input
                autoFocus
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newProjectName.trim()) {
                    createProject(newProjectName.trim())
                    setIsCreating(false)
                    setNewProjectName("")
                  }
                  if (e.key === "Escape") {
                    setIsCreating(false)
                    setNewProjectName("")
                  }
                }}
                onBlur={() => {
                  if (!newProjectName.trim()) {
                    setIsCreating(false)
                    setNewProjectName("")
                  }
                }}
                placeholder="Project name..."
                className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
            </div>
            <div className="w-[56px] shrink-0" />
            <div className="w-[56px] shrink-0" />
            <div className="w-[90px] shrink-0" />
            <div className="w-[100px] shrink-0" />
          </div>
        )}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-20 text-center">
            <div>
              <FolderOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-[15px] text-muted-foreground">
                {filters.length > 0 ? "No matching projects" : "No projects yet"}
              </p>
              <p className="mt-1 text-[14px] text-muted-foreground/60">
                {filters.length > 0 ? "Try adjusting your filters." : "Create a project to get started."}
              </p>
            </div>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const cfg = PROJECT_STATUS_CONFIG[project.status] ?? PROJECT_STATUS_CONFIG.planning
            return (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="group flex items-center border-b border-border px-5 py-2.5 transition-colors hover:bg-secondary/30 cursor-pointer"
              >
                {/* Name */}
                <div className="flex flex-1 items-center gap-2.5 min-w-0 pr-3">
                  <FolderOpen className="h-4 w-4 shrink-0 text-accent" />
                  <span className="truncate text-[15px] text-foreground">
                    {project.name}
                  </span>
                  {project.description && (
                    <span className="truncate text-[14px] text-muted-foreground">
                      {project.description}
                    </span>
                  )}
                </div>

                {/* Focus */}
                <div className="w-[56px] shrink-0 flex justify-center">
                  <FocusBadge project={project} />
                </div>

                {/* Note count */}
                <div className="w-[56px] shrink-0 text-right">
                  <span className="text-[14px] tabular-nums text-muted-foreground">
                    {notes.filter((n) => n.projectId === project.id && !n.trashed).length}
                  </span>
                </div>

                {/* Target date */}
                <div className="w-[90px] shrink-0 text-right">
                  <span className="text-[14px] tabular-nums text-muted-foreground">
                    {project.targetDate ? format(new Date(project.targetDate), "MMM d") : "—"}
                  </span>
                </div>

                {/* Status */}
                <div className="w-[100px] shrink-0 flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <ProjectStatusDropdown
                    value={project.status}
                    onChange={(s) => updateProject(project.id, { status: s })}
                    variant="label"
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}
