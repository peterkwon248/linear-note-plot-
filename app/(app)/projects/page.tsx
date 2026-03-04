"use client"

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { NoteEditor } from "@/components/note-editor"
import { NoteInspector } from "@/components/note-inspector"
import { StatusDropdown, PriorityDropdown, PriorityBadge } from "@/components/note-fields"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Plus,
  FolderOpen,
  CheckCircle2,
  Circle,
  SlidersHorizontal,
  Filter,
  Users,
} from "lucide-react"
import { format } from "date-fns"
import type { Note } from "@/lib/types"

/* ── Health badge ──────────────────────────────────────── */

function HealthDot({ note }: { note: Note }) {
  // Derive health from note fields: has content + status != capture = healthy
  const hasContent = note.content.trim().length > 20
  const isProgressed = note.status !== "capture"
  const healthy = hasContent && isProgressed

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default">
          {healthy ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground/30" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[11px]">
        {healthy ? "On track" : "Needs attention"}
      </TooltipContent>
    </Tooltip>
  )
}

/* ── Progress ──────────────────────────────────────────── */

function StatusProgress({ note }: { note: Note }) {
  const pct =
    note.status === "capture" ? 0
    : note.status === "reference" ? 33
    : note.status === "permanent" ? 66
    : 100 // project

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1 w-12 overflow-hidden rounded-full bg-secondary">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  )
}

/* ── Projects page ─────────────────────────────────────── */

export default function ProjectsPage() {
  const notes = usePlotStore((s) => s.notes)
  const updateNote = usePlotStore((s) => s.updateNote)
  const openNote = usePlotStore((s) => s.openNote)
  const createNote = usePlotStore((s) => s.createNote)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)

  const projects = useMemo(
    () =>
      notes
        .filter((n) => n.status === "project" && !n.archived)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [notes]
  )

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
            onClick={() => createNote({ status: "project" })}
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
          <span className="text-[11px] font-medium text-muted-foreground">Health</span>
        </div>
        <div className="w-[72px] shrink-0 text-center">
          <span className="text-[11px] font-medium text-muted-foreground">Priority</span>
        </div>
        <div className="w-[56px] shrink-0 text-center">
          <span className="text-[11px] font-medium text-muted-foreground">Lead</span>
        </div>
        <div className="w-[90px] shrink-0 text-right">
          <span className="text-[11px] font-medium text-muted-foreground">Target date</span>
        </div>
        <div className="w-[80px] shrink-0 text-right">
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
                Create a note with status "Project" to see it here.
              </p>
            </div>
          </div>
        ) : (
          projects.map((note) => (
            <div
              key={note.id}
              className="group flex items-center border-b border-border px-5 py-2.5 transition-colors hover:bg-secondary/30 cursor-pointer"
              onClick={() => openNote(note.id)}
            >
              {/* Name */}
              <div className="flex flex-1 items-center gap-2.5 min-w-0 pr-3">
                <FolderOpen className="h-4 w-4 shrink-0 text-accent" />
                <span className="truncate text-[13px] text-foreground">
                  {note.title || "Untitled"}
                </span>
              </div>

              {/* Health */}
              <div className="w-[56px] shrink-0 flex justify-center">
                <HealthDot note={note} />
              </div>

              {/* Priority */}
              <div className="w-[72px] shrink-0 flex justify-center text-center" onClick={(e) => e.stopPropagation()}>
                <PriorityDropdown
                  value={note.priority}
                  onChange={(p) => updateNote(note.id, { priority: p })}
                  variant="inline"
                />
              </div>

              {/* Lead */}
              <div className="w-[56px] shrink-0 flex justify-center">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/30">
                  <Users className="h-2.5 w-2.5 text-muted-foreground/40" />
                </div>
              </div>

              {/* Target date */}
              <div className="w-[90px] shrink-0 text-right">
                <span className="text-[12px] tabular-nums text-muted-foreground">
                  {/* No target date on notes, show dash */}
                  {"--"}
                </span>
              </div>

              {/* Status */}
              <div className="w-[80px] shrink-0 flex justify-end">
                <StatusProgress note={note} />
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
