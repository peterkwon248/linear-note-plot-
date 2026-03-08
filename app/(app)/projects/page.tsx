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
} from "lucide-react"
import { format } from "date-fns"
import type { Project } from "@/lib/types"

/* ── Focus badge ──────────────────────────────────────── */

const FOCUS_CONFIG = {
  now: { label: "Now", icon: Zap, color: "#e5484d" },
  soon: { label: "Soon", icon: Clock3, color: "#f2c94c" },
  later: { label: "Later", icon: Coffee, color: "#5e6ad2" },
} as const

function FocusBadge({ project }: { project: Project }) {
  const cfg = project.focus ? FOCUS_CONFIG[project.focus] : null

  if (!cfg) {
    return <span className="text-muted-foreground/30 text-[11px]">—</span>
  }

  const Icon = cfg.icon
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1 cursor-default">
          <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[11px]">
        {cfg.label}
      </TooltipContent>
    </Tooltip>
  )
}

/* ── Projects page ─────────────────────────────────────── */

export default function ProjectsPage() {
  const router = useRouter()
  const projects = usePlotStore((s) => s.projects)
  const notes = usePlotStore((s) => s.notes)
  const updateProject = usePlotStore((s) => s.updateProject)
  const createProject = usePlotStore((s) => s.createProject)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)

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
            className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/80"
            onClick={() => createProject("New Project")}
          >
            <Plus className="h-3 w-3" />
            New project
          </button>
        </div>
      </header>

      {/* Tabs + toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pt-1 pb-0">
        <div className="flex items-center gap-0">
          <button className="relative px-3 py-2 text-[13px] font-medium text-foreground">
            All projects
            <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-accent" />
          </button>
          <button className="px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground">
            + New view
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Filter className="h-3 w-3" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <SlidersHorizontal className="h-3 w-3" />
            Display
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex shrink-0 items-center border-b border-border px-5 py-2">
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-medium text-muted-foreground">Name</span>
        </div>
        <div className="w-[56px] shrink-0 text-center">
          <span className="text-[11px] font-medium text-muted-foreground">Focus</span>
        </div>
        <div className="w-[56px] shrink-0 text-right">
          <span className="text-[11px] font-medium text-muted-foreground">Notes</span>
        </div>
        <div className="w-[90px] shrink-0 text-right">
          <span className="text-[11px] font-medium text-muted-foreground">Target date</span>
        </div>
        <div className="w-[100px] shrink-0 text-right">
          <span className="text-[11px] font-medium text-muted-foreground">Status</span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-20 text-center">
            <div>
              <FolderOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-[13px] text-muted-foreground">No projects yet</p>
              <p className="mt-1 text-[12px] text-muted-foreground/60">
                Create a project to get started.
              </p>
            </div>
          </div>
        ) : (
          projects.map((project) => {
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
                  <span className="truncate text-[13px] text-foreground">
                    {project.name}
                  </span>
                  {project.description && (
                    <span className="truncate text-[12px] text-muted-foreground">
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
                  <span className="text-[12px] tabular-nums text-muted-foreground">
                    {notes.filter((n) => n.projectId === project.id && !n.trashed).length}
                  </span>
                </div>

                {/* Target date */}
                <div className="w-[90px] shrink-0 text-right">
                  <span className="text-[12px] tabular-nums text-muted-foreground">
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
