"use client"

import { useState, useRef, useEffect, useMemo } from "react"
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
  Plus,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { NoteStatus, NotePriority } from "@/lib/types"

const TAG_COLORS = [
  "#e5484d", "#f2994a", "#f2c94c", "#45d483", "#06b6d4",
  "#5e6ad2", "#9b59b6", "#e91e8c", "#8b5cf6", "#0ea5e9",
]

function pickColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

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

/* ── TagPicker ──────────────────────────────────────── */

export function TagPicker({
  noteId,
  selectedTagIds,
  allTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
}: {
  noteId: string
  selectedTagIds: string[]
  allTags: { id: string; name: string; color: string }[]
  onAddTag: (noteId: string, tagId: string) => void
  onRemoveTag: (noteId: string, tagId: string) => void
  onCreateTag: (name: string, color: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setSearch("")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = useMemo(
    () => allTags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [allTags, search]
  )

  const exactMatch = allTags.some((t) => t.name.toLowerCase() === search.trim().toLowerCase())
  const showCreate = search.trim().length > 0 && !exactMatch

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id))

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex flex-wrap gap-1">
        {selectedTags.map((t) => (
          <span
            key={t.id}
            className="group/tag inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: `${t.color}18`, color: t.color }}
          >
            {t.name}
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveTag(noteId, t.id) }}
              className="ml-0.5 rounded-full p-0 opacity-0 transition-opacity group-hover/tag:opacity-100 hover:bg-black/10"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <Plus className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-52 p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="border-b border-border p-2">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or create tag..."
              className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && showCreate) {
                  e.preventDefault()
                  onCreateTag(search.trim(), pickColor(search.trim()))
                  setSearch("")
                }
              }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.map((t) => {
              const isSelected = selectedTagIds.includes(t.id)
              return (
                <button
                  key={t.id}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-[13px] transition-colors hover:bg-secondary/50"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isSelected) onRemoveTag(noteId, t.id)
                    else onAddTag(noteId, t.id)
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-foreground">{t.name}</span>
                  </span>
                  {isSelected && <Check className="h-3 w-3 text-muted-foreground" />}
                </button>
              )
            })}
            {showCreate && (
              <button
                className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-accent transition-colors hover:bg-secondary/50"
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateTag(search.trim(), pickColor(search.trim()))
                  setSearch("")
                }}
              >
                <Plus className="h-3 w-3" />
                Create &ldquo;{search.trim()}&rdquo;
              </button>
            )}
            {filtered.length === 0 && !showCreate && (
              <p className="px-3 py-2 text-[13px] text-muted-foreground/60">No tags found.</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* ── LabelPicker ────────────────────────────────────── */

export function LabelPicker({
  noteId,
  currentLabelId,
  allLabels,
  onSetLabel,
  onCreateLabel,
}: {
  noteId: string
  currentLabelId: string | null
  allLabels: { id: string; name: string; color: string }[]
  onSetLabel: (noteId: string, labelId: string | null) => void
  onCreateLabel: (name: string, color: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setSearch("")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = useMemo(
    () => allLabels.filter((l) => l.name.toLowerCase().includes(search.toLowerCase())),
    [allLabels, search]
  )

  const exactMatch = allLabels.some((l) => l.name.toLowerCase() === search.trim().toLowerCase())
  const showCreate = search.trim().length > 0 && !exactMatch

  const current = allLabels.find((l) => l.id === currentLabelId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium leading-none transition-colors hover:bg-secondary"
          style={current ? { backgroundColor: `${current.color}18`, color: current.color } : {}}
          onClick={(e) => e.stopPropagation()}
        >
          {current ? (
            <>
              <Tag className="h-2.5 w-2.5" />
              {current.name}
            </>
          ) : (
            <span className="text-muted-foreground">Add label</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="border-b border-border p-2">
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or create label..."
            className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && showCreate) {
                e.preventDefault()
                onCreateLabel(search.trim(), pickColor(search.trim()))
                setSearch("")
              }
            }}
          />
        </div>
        <div className="max-h-48 overflow-y-auto py-1">
          {currentLabelId && (
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary/50"
              onClick={(e) => {
                e.stopPropagation()
                onSetLabel(noteId, null)
                setOpen(false)
              }}
            >
              <X className="h-3 w-3" />
              Remove label
            </button>
          )}
          {filtered.map((l) => (
            <button
              key={l.id}
              className="flex w-full items-center justify-between px-3 py-1.5 text-[13px] transition-colors hover:bg-secondary/50"
              onClick={(e) => {
                e.stopPropagation()
                onSetLabel(noteId, l.id)
                setOpen(false)
              }}
            >
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-foreground">{l.name}</span>
              </span>
              {currentLabelId === l.id && <Check className="h-3 w-3 text-muted-foreground" />}
            </button>
          ))}
          {showCreate && (
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-accent transition-colors hover:bg-secondary/50"
              onClick={(e) => {
                e.stopPropagation()
                onCreateLabel(search.trim(), pickColor(search.trim()))
                setSearch("")
              }}
            >
              <Plus className="h-3 w-3" />
              Create &ldquo;{search.trim()}&rdquo;
            </button>
          )}
          {filtered.length === 0 && !showCreate && (
            <p className="px-3 py-2 text-[13px] text-muted-foreground/60">No labels found.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

