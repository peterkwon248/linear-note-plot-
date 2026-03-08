"use client"

import {
  Circle,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Minus,
  Zap,
  BookOpen,
  Archive as ArchiveIcon,
  FolderOpen,
  ChevronDown,
  Check,
  Inbox,
  Plus,
  X as XIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { NoteStatus, NotePriority, ProjectStatus, Project } from "@/lib/types"

/* ── Status config ────────────────────────────────────── */

export const STATUS_CONFIG: Record<
  NoteStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  inbox: {
    label: "Inbox",
    color: "#06b6d4",
    bg: "rgba(6, 182, 212, 0.12)",
    icon: <Inbox className="h-3.5 w-3.5" />,
  },
  capture: {
    label: "Capture",
    color: "#f2994a",
    bg: "rgba(242, 153, 74, 0.12)",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  reference: {
    label: "Reference",
    color: "#5e6ad2",
    bg: "rgba(94, 106, 210, 0.12)",
    icon: <BookOpen className="h-3.5 w-3.5" />,
  },
  permanent: {
    label: "Permanent",
    color: "#45d483",
    bg: "rgba(69, 212, 131, 0.12)",
    icon: <ArchiveIcon className="h-3.5 w-3.5" />,
  },
}

const STATUS_OPTIONS: NoteStatus[] = ["inbox", "capture", "reference", "permanent"]

/* ── Priority config ──────────────────────────────────── */

export const PRIORITY_CONFIG: Record<
  NotePriority,
  { label: string; color: string; icon: React.ReactNode }
> = {
  none: {
    label: "No priority",
    color: "#6b6b76",
    icon: <Minus className="h-3.5 w-3.5" />,
  },
  urgent: {
    label: "Urgent",
    color: "#e5484d",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  high: {
    label: "High",
    color: "#f2994a",
    icon: <ArrowUp className="h-3.5 w-3.5" />,
  },
  medium: {
    label: "Medium",
    color: "#f2c94c",
    icon: <ArrowRight className="h-3.5 w-3.5" />,
  },
  low: {
    label: "Low",
    color: "#5e6ad2",
    icon: <ArrowDown className="h-3.5 w-3.5" />,
  },
}

const PRIORITY_OPTIONS: NotePriority[] = ["none", "urgent", "high", "medium", "low"]

/* ── Project Status config ────────────────────────────── */

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bg: string }
> = {
  planning: { label: "Planning", color: "#6b6b76", bg: "rgba(107, 107, 118, 0.20)" },
  active: { label: "Active", color: "#5e6ad2", bg: "rgba(94, 106, 210, 0.12)" },
  review: { label: "Review", color: "#f2994a", bg: "rgba(242, 153, 74, 0.12)" },
  done: { label: "Done", color: "#45d483", bg: "rgba(69, 212, 131, 0.12)" },
  canceled: { label: "Canceled", color: "#e5484d", bg: "rgba(229, 72, 77, 0.12)" },
}

export const PROJECT_STATUS_OPTIONS: ProjectStatus[] = ["planning", "active", "review", "done", "canceled"]

/* ── StatusBadge ──────────────────────────────────────── */

export function StatusBadge({ status }: { status: NoteStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.capture
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium leading-none"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

/* ── PriorityBadge ────────────────────────────────────── */

export function PriorityBadge({ priority }: { priority: NotePriority }) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span
      className="inline-flex items-center gap-1 text-[14px]"
      style={{ color: cfg.color }}
    >
      {cfg.icon}
    </span>
  )
}

/* ── StatusDropdown ───────────────────────────────────── */

export function StatusDropdown({
  value,
  onChange,
  variant = "button",
}: {
  value: NoteStatus
  onChange: (status: NoteStatus) => void
  variant?: "button" | "inline"
}) {
  const current = STATUS_CONFIG[value] ?? STATUS_CONFIG.capture

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "inline" ? (
          <button
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium leading-none transition-colors hover:brightness-125"
            style={{ backgroundColor: current.bg, color: current.color }}
            onClick={(e) => e.stopPropagation()}
          >
            {current.icon}
            {current.label}
          </button>
        ) : (
          <button
            className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-[14px] text-foreground transition-colors hover:bg-secondary/60"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="flex items-center gap-2" style={{ color: current.color }}>
              {current.icon}
              {current.label}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {STATUS_OPTIONS.map((s) => {
          const cfg = STATUS_CONFIG[s]
          return (
            <DropdownMenuItem
              key={s}
              onClick={(e) => {
                e.stopPropagation()
                onChange(s)
              }}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2" style={{ color: cfg.color }}>
                {cfg.icon}
                <span className="text-foreground">{cfg.label}</span>
              </span>
              {value === s && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── PriorityDropdown ─────────────────────────────────── */

export function PriorityDropdown({
  value,
  onChange,
  variant = "button",
}: {
  value: NotePriority
  onChange: (priority: NotePriority) => void
  variant?: "button" | "inline"
}) {
  const current = PRIORITY_CONFIG[value]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "inline" ? (
          <button
            className="inline-flex items-center rounded-md p-1 transition-colors hover:bg-secondary"
            style={{ color: current.color }}
            onClick={(e) => e.stopPropagation()}
          >
            {current.icon}
          </button>
        ) : (
          <button
            className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-[14px] text-foreground transition-colors hover:bg-secondary/60"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="flex items-center gap-2" style={{ color: current.color }}>
              {current.icon}
              <span className="text-foreground">{current.label}</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {PRIORITY_OPTIONS.map((p) => {
          const cfg = PRIORITY_CONFIG[p]
          return (
            <DropdownMenuItem
              key={p}
              onClick={(e) => {
                e.stopPropagation()
                onChange(p)
              }}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2" style={{ color: cfg.color }}>
                {cfg.icon}
                <span className="text-foreground">{cfg.label}</span>
              </span>
              {value === p && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── ProjectStatusDropdown ────────────────────────────── */

export function ProjectStatusDropdown({
  value,
  onChange,
  variant = "default",
}: {
  value: ProjectStatus | null
  onChange: (status: ProjectStatus) => void
  variant?: "dot" | "label" | "default"
}) {
  const current = PROJECT_STATUS_CONFIG[value ?? "planning"] ?? PROJECT_STATUS_CONFIG.planning

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "dot" ? (
          <button
            className="inline-flex items-center justify-center rounded-md p-1 transition-colors hover:bg-secondary"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: current.color }} />
          </button>
        ) : variant === "label" ? (
          <button
            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[12px] font-medium leading-none transition-colors hover:brightness-125"
            style={{ backgroundColor: current.bg, color: current.color }}
            onClick={(e) => e.stopPropagation()}
          >
            {current.label}
          </button>
        ) : (
          <button
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium leading-none transition-colors hover:brightness-125"
            style={{ backgroundColor: current.bg, color: current.color }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: current.color }} />
            {current.label}
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {PROJECT_STATUS_OPTIONS.map((status) => {
          const cfg = PROJECT_STATUS_CONFIG[status]
          return (
            <DropdownMenuItem
              key={status}
              onClick={(e) => {
                e.stopPropagation()
                onChange(status)
              }}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span className="text-foreground">{cfg.label}</span>
              </span>
              {value === status && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── ProjectDropdown (assign/remove project) ─────────── */

export function ProjectDropdown({
  value,
  projects,
  onChange,
  onRemove,
  variant = "default",
}: {
  value: string | null
  projects: Project[]
  onChange: (projectId: string) => void
  onRemove?: () => void
  variant?: "table" | "default"
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "table" ? (
          <button
            className="inline-flex items-center justify-center rounded-md p-1 text-[14px] text-muted-foreground/30 transition-colors hover:bg-secondary hover:text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            —
          </button>
        ) : (
          <button
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <Plus className="h-3.5 w-3.5" />
            Set project
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {projects.length > 0 ? (
          <>
            {projects.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(p.id)
                }}
                className="flex items-center gap-2 text-[14px]"
              >
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{p.name}</span>
                {value === p.id && <Check className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <div className="px-2 py-1.5 text-[14px] text-muted-foreground">No projects yet</div>
        )}
        {value && onRemove && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="flex items-center gap-2 text-[14px] text-destructive focus:text-destructive"
          >
            <XIcon className="h-3.5 w-3.5" />
            Remove from project
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
