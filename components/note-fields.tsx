"use client"

import {
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Minus,
  Zap,
  BookOpen,
  Archive as ArchiveIcon,
  ChevronDown,
  Check,
  Inbox,
  Tag,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { NoteStatus, NotePriority } from "@/lib/types"

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
  permanent: {
    label: "Permanent",
    color: "#45d483",
    bg: "rgba(69, 212, 131, 0.12)",
    icon: <ArchiveIcon className="h-3.5 w-3.5" />,
  },
}

const STATUS_OPTIONS: NoteStatus[] = ["inbox", "capture", "permanent"]

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

/* ── LabelBadge ──────────────────────────────────────── */

export function LabelBadge({ label }: { label: { name: string; color: string } }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium leading-none"
      style={{ backgroundColor: `${label.color}18`, color: label.color }}
    >
      <Tag className="h-2.5 w-2.5" />
      {label.name}
    </span>
  )
}

/* ── LabelDropdown ───────────────────────────────────── */

export function LabelDropdown({
  value,
  labels,
  onChange,
  variant = "button",
}: {
  value: string | null
  labels: { id: string; name: string; color: string }[]
  onChange: (labelId: string | null) => void
  variant?: "button" | "inline"
}) {
  const current = labels.find((l) => l.id === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "inline" ? (
          <button
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium leading-none transition-colors hover:brightness-125"
            style={current ? { backgroundColor: `${current.color}18`, color: current.color } : {}}
            onClick={(e) => e.stopPropagation()}
          >
            <Tag className="h-2.5 w-2.5" />
            {current?.name ?? "No label"}
          </button>
        ) : (
          <button
            className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/30 px-2.5 py-1.5 text-[14px] text-foreground transition-colors hover:bg-secondary/60"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="flex items-center gap-2">
              {current && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: current.color }}
                />
              )}
              {current?.name ?? "No label"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onChange(null)
          }}
          className="flex items-center justify-between"
        >
          <span className="text-muted-foreground">No label</span>
          {!value && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
        </DropdownMenuItem>
        {labels.map((l) => (
          <DropdownMenuItem
            key={l.id}
            onClick={(e) => {
              e.stopPropagation()
              onChange(l.id)
            }}
            className="flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-foreground">{l.name}</span>
            </span>
            {value === l.id && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

