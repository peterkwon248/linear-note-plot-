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
import type { NoteStatus, NotePriority, ProjectLevel } from "@/lib/types"

/* ── Status config ────────────────────────────────────── */

const STATUS_CONFIG: Record<
  NoteStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  inbox: {
    label: "Inbox",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    icon: <Inbox className="h-3 w-3" />,
  },
  capture: {
    label: "Capture",
    color: "#f2994a",
    bg: "rgba(242, 153, 74, 0.12)",
    icon: <Zap className="h-3 w-3" />,
  },
  reference: {
    label: "Reference",
    color: "#5e6ad2",
    bg: "rgba(94, 106, 210, 0.12)",
    icon: <BookOpen className="h-3 w-3" />,
  },
  permanent: {
    label: "Permanent",
    color: "#45d483",
    bg: "rgba(69, 212, 131, 0.12)",
    icon: <ArchiveIcon className="h-3 w-3" />,
  },
}

const STATUS_OPTIONS: NoteStatus[] = ["inbox", "capture", "reference", "permanent"]

/* ── Priority config ──────────────────────────────────── */

const PRIORITY_CONFIG: Record<
  NotePriority,
  { label: string; color: string; icon: React.ReactNode }
> = {
  none: {
    label: "No priority",
    color: "#6b6b76",
    icon: <Minus className="h-3 w-3" />,
  },
  urgent: {
    label: "Urgent",
    color: "#e5484d",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  high: {
    label: "High",
    color: "#f2994a",
    icon: <ArrowUp className="h-3 w-3" />,
  },
  medium: {
    label: "Medium",
    color: "#f2c94c",
    icon: <ArrowRight className="h-3 w-3" />,
  },
  low: {
    label: "Low",
    color: "#5e6ad2",
    icon: <ArrowDown className="h-3 w-3" />,
  },
}

const PRIORITY_OPTIONS: NotePriority[] = ["none", "urgent", "high", "medium", "low"]

/* ── Project Level config ────────────────────────────── */

export const PROJECT_LEVEL_CONFIG: Record<
  ProjectLevel,
  { label: string; color: string; bg: string }
> = {
  planning: { label: "Planning", color: "#6b6b76", bg: "rgba(107, 107, 118, 0.20)" },
  active: { label: "Active", color: "#5e6ad2", bg: "rgba(94, 106, 210, 0.12)" },
  review: { label: "Review", color: "#f2994a", bg: "rgba(242, 153, 74, 0.12)" },
  done: { label: "Done", color: "#45d483", bg: "rgba(69, 212, 131, 0.12)" },
}

export const PROJECT_LEVEL_OPTIONS: ProjectLevel[] = ["planning", "active", "review", "done"]

/* ── StatusBadge ──────────────────────────────────────── */

export function StatusBadge({ status }: { status: NoteStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.capture
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none"
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
      className="inline-flex items-center gap-1 text-[12px]"
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
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none transition-colors hover:brightness-125"
            style={{ backgroundColor: current.bg, color: current.color }}
            onClick={(e) => e.stopPropagation()}
          >
            {current.icon}
            {current.label}
          </button>
        ) : (
          <button
            className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-[12px] text-foreground transition-colors hover:bg-secondary/60"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="flex items-center gap-2" style={{ color: current.color }}>
              {current.icon}
              {current.label}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
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
              {value === s && <Check className="h-3 w-3 text-muted-foreground" />}
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
            className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-[12px] text-foreground transition-colors hover:bg-secondary/60"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="flex items-center gap-2" style={{ color: current.color }}>
              {current.icon}
              <span className="text-foreground">{current.label}</span>
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
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
              {value === p && <Check className="h-3 w-3 text-muted-foreground" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── ProjectLevelDropdown ────────────────────────────── */

export function ProjectLevelDropdown({
  value,
  onChange,
  variant = "default",
}: {
  value: ProjectLevel | null
  onChange: (level: ProjectLevel) => void
  variant?: "dot" | "label" | "default"
}) {
  const current = PROJECT_LEVEL_CONFIG[value ?? "planning"] ?? PROJECT_LEVEL_CONFIG.planning

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
            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none transition-colors hover:brightness-125"
            style={{ backgroundColor: current.bg, color: current.color }}
            onClick={(e) => e.stopPropagation()}
          >
            {current.label}
          </button>
        ) : (
          <button
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none transition-colors hover:brightness-125"
            style={{ backgroundColor: current.bg, color: current.color }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: current.color }} />
            {current.label}
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {PROJECT_LEVEL_OPTIONS.map((lvl) => {
          const cfg = PROJECT_LEVEL_CONFIG[lvl]
          return (
            <DropdownMenuItem
              key={lvl}
              onClick={(e) => {
                e.stopPropagation()
                onChange(lvl)
              }}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span className="text-foreground">{cfg.label}</span>
              </span>
              {value === lvl && <Check className="h-3 w-3 text-muted-foreground" />}
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
  existingProjects,
  onChange,
  onRemove,
  variant = "default",
}: {
  value: string | null
  existingProjects: string[]
  onChange: (project: string) => void
  onRemove?: () => void
  variant?: "table" | "default"
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "table" ? (
          <button
            className="inline-flex items-center justify-center rounded-md p-1 text-[12px] text-muted-foreground/30 transition-colors hover:bg-secondary hover:text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            —
          </button>
        ) : (
          <button
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <Plus className="h-3 w-3" />
            Set project
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {existingProjects.length > 0 && (
          <>
            {existingProjects.map((p) => (
              <DropdownMenuItem
                key={p}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(p)
                }}
                className="flex items-center gap-2 text-[12px]"
              >
                <FolderOpen className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{p}</span>
                {value === p && <Check className="ml-auto h-3 w-3 text-muted-foreground" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                const name = prompt("Project name:")
                if (name?.trim()) onChange(name.trim())
              }}
              className="flex items-center gap-2 text-[12px] text-muted-foreground"
            >
              <Plus className="h-3 w-3" />
              New project...
            </DropdownMenuItem>
          </>
        )}
        {existingProjects.length === 0 && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              const name = prompt("Project name:")
              if (name?.trim()) onChange(name.trim())
            }}
            className="flex items-center gap-2 text-[12px]"
          >
            <Plus className="h-3 w-3 text-muted-foreground" />
            New project...
          </DropdownMenuItem>
        )}
        {value && onRemove && (
          <>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="flex items-center gap-2 text-[12px] text-destructive focus:text-destructive"
            >
              <XIcon className="h-3 w-3" />
              Remove from project
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
