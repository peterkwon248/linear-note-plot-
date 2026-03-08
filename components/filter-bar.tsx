"use client"

import { Filter, Plus, X, Check, Zap, Clock, Link2, Eye, FileQuestion, FolderOpen, Tag, Pin } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { StatusBadge, PriorityBadge } from "@/components/note-fields"
import type { FilterRule, GroupBy } from "@/lib/view-engine/types"
import type { NoteStatus, NotePriority, Project } from "@/lib/types"

/* ── Helpers ──────────────────────────────────────────── */

function hasFilter(filters: FilterRule[], field: FilterRule["field"], value: string, operator: FilterRule["operator"] = "eq") {
  return filters.some((f) => f.field === field && f.operator === operator && f.value === value)
}

function formatFilterLabel(rule: FilterRule, projectList?: Project[]): string {
  if (rule.field === "status") return rule.value.charAt(0).toUpperCase() + rule.value.slice(1)
  if (rule.field === "priority" && rule.value === "none") return "No priority"
  if (rule.field === "priority") return rule.value.charAt(0).toUpperCase() + rule.value.slice(1)
  if (rule.field === "project" && rule.value === "_none") return "No project"
  if (rule.field === "project" && rule.value !== "_none" && projectList) {
    const proj = projectList.find((p) => p.id === rule.value)
    return proj ? `Project: ${proj.name}` : `Project: ${rule.value}`
  }
  if (rule.field === "links" && rule.operator === "eq" && rule.value === "0") return "Unlinked"
  if (rule.field === "reads" && rule.operator === "eq" && rule.value === "0") return "Unread"
  if (rule.field === "content" && rule.value === "empty") return "Empty"
  if (rule.field === "updatedAt" && rule.operator === "gt" && rule.value === "24h") return "Updated today"
  if (rule.field === "updatedAt" && rule.operator === "gt" && rule.value === "7d") return "Updated this week"
  if (rule.field === "updatedAt" && rule.operator === "lt" && rule.value === "30d") return "Stale (30d+)"
  if (rule.field === "createdAt" && rule.operator === "gt" && rule.value === "7d") return "Created this week"
  if (rule.field === "tags" && rule.value === "_any") return "Has tags"
  if (rule.field === "tags" && rule.value === "_none") return "No tags"
  if (rule.field === "pinned" && rule.value === "true") return "Pinned"
  return `${rule.field}: ${rule.value}`
}

/* ── Shared menu items ───────────────────────────────── */

interface FilterMenuProps {
  filters: FilterRule[]
  groupBy: GroupBy
  isSingleStatusTab: boolean
  projects: Project[]
  onToggleFilter: (field: FilterRule["field"], value: string, operator?: FilterRule["operator"]) => void
  onSetFilters: (filters: FilterRule[]) => void
}

function FilterMenuItems({
  filters,
  groupBy,
  isSingleStatusTab,
  projects,
  onToggleFilter,
  onSetFilters,
}: FilterMenuProps) {
  const showStatusFilter = groupBy !== "status" && groupBy !== "triage" && !isSingleStatusTab
  const showPriorityFilter = groupBy !== "priority"
  const showUnlinkedFilter = groupBy !== "linkCount"
  const showProjectFilter = groupBy !== "project"

  return (
    <>
      {/* ── Presets ── */}
      <DropdownMenuItem className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground" disabled>
        <Zap className="h-3.5 w-3.5 mr-1" /> Quick Filters
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => {
        e.preventDefault()
        onSetFilters([
          { field: "updatedAt", operator: "lt", value: "30d" },
          { field: "links", operator: "eq", value: "0" },
        ])
      }}>
        <span className="text-[14px]">Needs attention</span>
        <span className="ml-auto text-[11px] text-muted-foreground">stale + unlinked</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => {
        e.preventDefault()
        onSetFilters([{ field: "updatedAt", operator: "gt", value: "7d" }])
      }}>
        <span className="text-[14px]">Active work</span>
        <span className="ml-auto text-[11px] text-muted-foreground">updated &lt; 7d</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => {
        e.preventDefault()
        onSetFilters([
          { field: "links", operator: "eq", value: "0" },
          { field: "reads", operator: "eq", value: "0" },
        ])
      }}>
        <span className="text-[14px]">Orphans</span>
        <span className="ml-auto text-[11px] text-muted-foreground">unlinked + unread</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />

      {/* ── Status ── */}
      {showStatusFilter && (
        <>
          <DropdownMenuItem className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground" disabled>
            Status
          </DropdownMenuItem>
          {(["inbox", "capture", "reference", "permanent"] as NoteStatus[]).map((s) => (
            <DropdownMenuItem key={s} onSelect={(e) => { e.preventDefault(); onToggleFilter("status", s) }}>
              <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "status", s) ? "text-accent opacity-100" : "opacity-0"}`} />
              <StatusBadge status={s} />
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
        </>
      )}

      {/* ── Priority ── */}
      {showPriorityFilter && (
        <>
          <DropdownMenuItem className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground" disabled>
            Priority
          </DropdownMenuItem>
          {(["urgent", "high", "medium", "low", "none"] as NotePriority[]).map((p) => (
            <DropdownMenuItem key={p} onSelect={(e) => { e.preventDefault(); onToggleFilter("priority", p) }}>
              <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "priority", p) ? "text-accent opacity-100" : "opacity-0"}`} />
              <PriorityBadge priority={p} />
              <span className="ml-2 text-[14px] capitalize">{p === "none" ? "No priority" : p}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
        </>
      )}

      {/* ── Project ── */}
      {showProjectFilter && (
        <>
          <DropdownMenuItem className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground" disabled>
            Project
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("project", "_none") }}>
            <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "project", "_none") ? "text-accent opacity-100" : "opacity-0"}`} />
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-[14px]">No project</span>
          </DropdownMenuItem>
          {projects.map((proj) => (
            <DropdownMenuItem key={proj.id} onSelect={(e) => { e.preventDefault(); onToggleFilter("project", proj.id) }}>
              <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "project", proj.id) ? "text-accent opacity-100" : "opacity-0"}`} />
              <span className="text-[14px]">{proj.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
        </>
      )}

      {/* ── Time ── */}
      <DropdownMenuItem className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground" disabled>
        Time
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "24h", "gt") }}>
        <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "updatedAt", "24h", "gt") ? "text-accent opacity-100" : "opacity-0"}`} />
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-[14px]">Updated today</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "7d", "gt") }}>
        <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "updatedAt", "7d", "gt") ? "text-accent opacity-100" : "opacity-0"}`} />
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-[14px]">Updated this week</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("updatedAt", "30d", "lt") }}>
        <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "updatedAt", "30d", "lt") ? "text-accent opacity-100" : "opacity-0"}`} />
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-[14px]">Stale (30d+ ago)</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("createdAt", "7d", "gt") }}>
        <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "createdAt", "7d", "gt") ? "text-accent opacity-100" : "opacity-0"}`} />
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-[14px]">Created this week</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />

      {/* ── Content ── */}
      <DropdownMenuItem className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground" disabled>
        Content
      </DropdownMenuItem>
      {showUnlinkedFilter && (
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("links", "0") }}>
          <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "links", "0") ? "text-accent opacity-100" : "opacity-0"}`} />
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-[14px]">Unlinked</span>
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("reads", "0") }}>
        <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "reads", "0") ? "text-accent opacity-100" : "opacity-0"}`} />
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-[14px]">Unread</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("content", "empty") }}>
        <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "content", "empty") ? "text-accent opacity-100" : "opacity-0"}`} />
        <FileQuestion className="h-4 w-4 text-muted-foreground" />
        <span className="text-[14px]">Empty notes</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("tags", "_any") }}>
        <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "tags", "_any") ? "text-accent opacity-100" : "opacity-0"}`} />
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-[14px]">Has tags</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("tags", "_none") }}>
        <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "tags", "_none") ? "text-accent opacity-100" : "opacity-0"}`} />
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-[14px]">No tags</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFilter("pinned", "true") }}>
        <Check className={`h-3.5 w-3.5 shrink-0 ${hasFilter(filters, "pinned", "true") ? "text-accent opacity-100" : "opacity-0"}`} />
        <Pin className="h-4 w-4 text-muted-foreground" />
        <span className="text-[14px]">Pinned only</span>
      </DropdownMenuItem>
    </>
  )
}

/* ── FilterButton (toolbar) ──────────────────────────── */

interface FilterButtonProps extends FilterMenuProps {
  /* inherits filters, groupBy, isSingleStatusTab, projects, onToggleFilter, onSetFilters */
}

export function FilterButton(props: FilterButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[14px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Filter className="h-4 w-4" />
          Filter
          {props.filters.length > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/15 px-1 text-[11px] font-medium text-accent">
              {props.filters.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 max-h-[420px] overflow-y-auto">
        <FilterMenuItems {...props} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── FilterChipBar (below toolbar, only when active) ── */

interface FilterChipBarProps extends FilterMenuProps {
  onRemoveFilter: (idx: number) => void
  onClearAll: () => void
}

export function FilterChipBar({
  filters,
  projects,
  onRemoveFilter,
  onClearAll,
  ...menuProps
}: FilterChipBarProps) {
  if (filters.length === 0) return null

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-5 py-1.5">
      {/* Active filter chips */}
      {filters.map((f, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-[12px] text-foreground"
        >
          <span className="text-muted-foreground">{formatFilterLabel(f, projects)}</span>
          <button
            onClick={() => onRemoveFilter(i)}
            className="ml-0.5 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      {/* + Add more */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center justify-center rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Plus className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 max-h-[420px] overflow-y-auto">
          <FilterMenuItems filters={filters} projects={projects} {...menuProps} />
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear — right aligned */}
      <div className="ml-auto">
        <button
          onClick={onClearAll}
          className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
