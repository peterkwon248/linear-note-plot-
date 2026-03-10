"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge, PriorityBadge } from "@/components/note-fields"
import { applyFilters } from "@/lib/view-engine/filter"
import { FileText, X, Plus, ChevronDown, CircleDot, Signal, Hash, Check } from "lucide-react"
import type { FilterRule, FilterField } from "@/lib/view-engine/types"
import type { NoteStatus, NotePriority } from "@/lib/types"
import type { LucideIcon } from "lucide-react"

/* ── Picker Filter Types ──────────────────────────────── */

interface PickerFilterValue {
  value: string
  label: string
}

interface PickerFilterGroup {
  key: string
  label: string
  icon: LucideIcon
  field: FilterField
  values: PickerFilterValue[]
}

/* ── Static filter group configs ──────────────────────── */

const STATUS_GROUP: PickerFilterGroup = {
  key: "status",
  label: "Status",
  icon: CircleDot,
  field: "status" as FilterField,
  values: [
    { value: "inbox", label: "Inbox" },
    { value: "capture", label: "Capture" },
    { value: "permanent", label: "Permanent" },
  ],
}

const PRIORITY_GROUP: PickerFilterGroup = {
  key: "priority",
  label: "Priority",
  icon: Signal,
  field: "priority" as FilterField,
  values: [
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "none", label: "No Priority" },
  ],
}

/* ── Chip label helper ────────────────────────────────── */

function getChipSummary(group: PickerFilterGroup, selected: Set<string>): string {
  const total = group.values.length
  const count = selected.size
  if (count === 0) return "None"
  if (count >= total) return "All"
  // 1-2 selected: show comma-separated labels
  if (count <= 2) {
    return group.values
      .filter((v) => selected.has(v.value))
      .map((v) => v.label)
      .join(", ")
  }
  // If only 1 deselected, show "All except X"
  const deselectedCount = total - count
  if (deselectedCount === 1) {
    const deselected = group.values.find((v) => !selected.has(v.value))
    return `All except ${deselected?.label ?? "?"}`
  }
  // Otherwise "N selected"
  return `${count} selected`
}

/* ── Props ──────────────────────────────────────── */

interface NotePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  /** Note IDs to exclude from the picker */
  excludeIds?: string[]
  /** Called when a note is selected */
  onSelect: (noteId: string) => void
}

/* ── Component ──────────────────────────────────── */

export function NotePickerDialog({
  open,
  onOpenChange,
  title = "Select a note",
  excludeIds = [],
  onSelect,
}: NotePickerDialogProps) {
  const notes = usePlotStore((s) => s.notes)
  const tags = usePlotStore((s) => s.tags)

  // Record<groupKey, Set<selectedValues>>
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({})

  // Reset filters when dialog opens
  useEffect(() => {
    if (open) setActiveFilters({})
  }, [open])

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds])

  // Build dynamic groups from store data
  const tagsGroup: PickerFilterGroup = useMemo(() => ({
    key: "tags",
    label: "Tags",
    icon: Hash,
    field: "tags" as FilterField,
    values: [
      { value: "_none", label: "No tags" },
      ...tags.map((t) => ({ value: t.id, label: t.name })),
    ],
  }), [tags])

  const allGroups = useMemo<PickerFilterGroup[]>(
    () => [STATUS_GROUP, PRIORITY_GROUP, tagsGroup],
    [tagsGroup],
  )

  // Convert activeFilters → FilterRule[] for applyFilters()
  const filterRules = useMemo(() => {
    const rules: FilterRule[] = []
    for (const [groupKey, selectedValues] of Object.entries(activeFilters)) {
      const group = allGroups.find((g) => g.key === groupKey)
      if (!group) continue
      // If ALL selected → no filter needed (skip)
      if (selectedValues.size >= group.values.length) continue
      // If none selected → shouldn't happen (chip removed)
      if (selectedValues.size === 0) continue
      // Add inclusion rules for selected values only
      for (const val of selectedValues) {
        rules.push({ field: group.field, operator: "eq", value: val })
      }
    }
    return rules
  }, [activeFilters, allGroups])

  // Base candidates: active, non-excluded notes
  const baseCandidates = useMemo(() => {
    return notes
      .filter((n) => !n.archived && !n.trashed && !excludeSet.has(n.id))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [notes, excludeSet])

  // Apply FilterRules from the view engine
  const candidates = useMemo(() => {
    return applyFilters(baseCandidates, filterRules)
  }, [baseCandidates, filterRules])

  const handleSelect = useCallback(
    (noteId: string) => {
      onSelect(noteId)
      onOpenChange(false)
    },
    [onSelect, onOpenChange],
  )

  // ── Filter handlers ──────────────────────────────

  const activateGroup = useCallback((groupKey: string) => {
    const group = allGroups.find((g) => g.key === groupKey)
    if (!group) return
    setActiveFilters((prev) => ({
      ...prev,
      [groupKey]: new Set(group.values.map((v) => v.value)),
    }))
  }, [allGroups])

  const toggleValue = useCallback((groupKey: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[groupKey]
      if (!current) return prev
      const next = new Set(current)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      // If set becomes empty, remove the group entirely
      if (next.size === 0) {
        const { [groupKey]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [groupKey]: next }
    })
  }, [])

  const selectAllInGroup = useCallback((groupKey: string) => {
    const group = allGroups.find((g) => g.key === groupKey)
    if (!group) return
    setActiveFilters((prev) => ({
      ...prev,
      [groupKey]: new Set(group.values.map((v) => v.value)),
    }))
  }, [allGroups])

  const clearGroup = useCallback((groupKey: string) => {
    setActiveFilters((prev) => {
      const { [groupKey]: _, ...rest } = prev
      return rest
    })
  }, [])

  // Custom cmdk filter: match title or preview
  const cmdkFilter = useCallback((value: string, search: string) => {
    const q = search.toLowerCase().trim()
    if (!q) return 1
    return value.toLowerCase().includes(q) ? 1 : 0
  }, [])

  // Derived lists
  const activeGroupKeys = Object.keys(activeFilters)
  const inactiveGroups = allGroups.filter((g) => !(g.key in activeFilters))

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Search and select a note"
      showCloseButton={false}
      filter={cmdkFilter}
      className="sm:max-w-[960px]"
    >
      <CommandInput placeholder="Search notes..." />

      {/* ── Chip-based filter bar ── */}
      <div
        className="flex items-center gap-1.5 border-b border-border px-3 py-1.5 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Active group chips */}
        {activeGroupKeys.map((groupKey) => {
          const group = allGroups.find((g) => g.key === groupKey)
          if (!group) return null
          const selected = activeFilters[groupKey]
          const GroupIcon = group.icon
          const summary = getChipSummary(group, selected)

          return (
            <DropdownMenu key={groupKey}>
              <DropdownMenuTrigger asChild>
                <button className="shrink-0 inline-flex items-center gap-1 rounded-md border border-accent/25 bg-accent/5 px-1.5 py-0.5 text-[11px] text-foreground transition-colors hover:bg-accent/10">
                  <GroupIcon className="h-3 w-3 text-accent/70" />
                  <span className="font-medium">{group.label}:</span>
                  <span className="max-w-[120px] truncate text-muted-foreground">{summary}</span>
                  <ChevronDown className="h-2.5 w-2.5 text-muted-foreground/50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52" onCloseAutoFocus={(e) => e.preventDefault()}>
                {group.values.map(({ value, label }) => (
                  <DropdownMenuItem
                    key={value}
                    onSelect={(e) => { e.preventDefault(); toggleValue(groupKey, value) }}
                  >
                    <Check className={`h-3.5 w-3.5 shrink-0 ${selected.has(value) ? "text-accent opacity-100" : "opacity-0"}`} />
                    {groupKey === "status" ? (
                      <StatusBadge status={value as NoteStatus} />
                    ) : groupKey === "priority" ? (
                      <>
                        <PriorityBadge priority={value as NotePriority} />
                        <span className="ml-1 text-[14px]">{label}</span>
                      </>
                    ) : groupKey === "tags" && value !== "_none" ? (
                      <>
                        {(() => {
                          const tag = tags.find((t) => t.id === value)
                          return tag ? (
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                          ) : null
                        })()}
                        <span className="text-[14px]">{label}</span>
                      </>
                    ) : (
                      <span className="text-[14px]">{label}</span>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between px-2 py-1">
                  <button
                    onClick={() => selectAllInGroup(groupKey)}
                    className="text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => clearGroup(groupKey)}
                    className="text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
              </DropdownMenuContent>
              {/* × button to remove chip — outside the dropdown */}
              <button
                onClick={() => clearGroup(groupKey)}
                className="shrink-0 -ml-0.5 rounded-sm p-0.5 text-muted-foreground/50 transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </DropdownMenu>
          )
        })}

        {/* Add buttons for inactive groups */}
        {inactiveGroups.map((group) => (
          <button
            key={group.key}
            onClick={() => activateGroup(group.key)}
            className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            {group.label}
          </button>
        ))}

        {/* Right side */}
        <div className="shrink-0 flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] tabular-nums text-muted-foreground/50">
            {candidates.length}/{baseCandidates.length}
          </span>
          {activeGroupKeys.length > 0 && (
            <button
              onClick={() => setActiveFilters({})}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <CommandList className="max-h-[560px]">
        <CommandEmpty>
          <div className="flex flex-col items-center gap-1.5 py-2">
            <FileText className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">No notes found</p>
            {activeGroupKeys.length > 0 && (
              <button
                onClick={() => setActiveFilters({})}
                className="text-[12px] text-accent hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </CommandEmpty>
        <CommandGroup>
          {candidates.map((note) => (
            <CommandItem
              key={note.id}
              value={`${note.title} ${note.preview}`}
              onSelect={() => handleSelect(note.id)}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground/40" />
              <div className="flex-1 min-w-0">
                <span className="truncate text-[14px] font-medium text-foreground block">
                  {note.title || "Untitled"}
                </span>
                {note.preview && (
                  <p className="truncate text-[12px] text-muted-foreground/50 mt-0.5">
                    {note.preview}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={note.status} />
                <span className="text-[11px] tabular-nums text-muted-foreground/40">
                  {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
