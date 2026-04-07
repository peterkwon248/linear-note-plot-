"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { ViewHeader } from "@/components/view-header"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Tag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Folder } from "@phosphor-icons/react/dist/ssr/Folder"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { Copy } from "@phosphor-icons/react/dist/ssr/Copy"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { ListBullets } from "@phosphor-icons/react/dist/ssr/ListBullets"
import { Check } from "@phosphor-icons/react/dist/ssr/Check"
import { Minus } from "@phosphor-icons/react/dist/ssr/Minus"
import { CaretUp } from "@phosphor-icons/react/dist/ssr/CaretUp"
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown"
import { SquaresFour } from "@phosphor-icons/react/dist/ssr/SquaresFour"
import { cn } from "@/lib/utils"
import { useActiveRoute, setActiveRoute } from "@/lib/table-route"
import type { Reference } from "@/lib/types"

/* ── Types ────────────────────────────────────────── */

type QuickFilterType = "all" | "linked" | "unlinked"
type SortField = "updatedAt" | "title" | "createdAt"
type SortDir = "asc" | "desc"

/* ── Quick Filter Button ─────────────────────────── */

function QuickFilterButton({
  label,
  active,
  onClick,
  count,
}: {
  label: string
  active: boolean
  onClick: () => void
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-medium transition-colors",
        active
          ? "bg-accent/10 text-accent"
          : "text-muted-foreground/50 hover:text-foreground hover:bg-hover-bg"
      )}
    >
      {label}
      {count !== undefined && (
        <span className="text-muted-foreground/40">{count}</span>
      )}
    </button>
  )
}

/* ── Quick Filter Bar ────────────────────────────── */

function QuickFilterBar({
  quickFilter,
  setQuickFilter,
  totalCount,
  linkedCount,
  unlinkedCount,
  fieldKeys,
  activeFieldKeys,
  toggleFieldKey,
}: {
  quickFilter: QuickFilterType
  setQuickFilter: (f: QuickFilterType) => void
  totalCount: number
  linkedCount: number
  unlinkedCount: number
  fieldKeys: string[]
  activeFieldKeys: Set<string>
  toggleFieldKey: (key: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5 px-5 py-1.5 border-b border-border/30">
      <QuickFilterButton
        label="All"
        active={quickFilter === "all"}
        onClick={() => setQuickFilter("all")}
        count={totalCount}
      />
      <QuickFilterButton
        label="Linked"
        active={quickFilter === "linked"}
        onClick={() => setQuickFilter("linked")}
        count={linkedCount}
      />
      <QuickFilterButton
        label="Unlinked"
        active={quickFilter === "unlinked"}
        onClick={() => setQuickFilter("unlinked")}
        count={unlinkedCount}
      />

      {fieldKeys.length > 0 && (
        <div className="w-px h-4 bg-border/50 mx-1" />
      )}
      {fieldKeys.map((key) => (
        <QuickFilterButton
          key={key}
          label={key}
          active={activeFieldKeys.has(key)}
          onClick={() => toggleFieldKey(key)}
        />
      ))}
    </div>
  )
}

/* ── Reference Row ────────────────────────────────── */

function ReferenceRow({
  ref_,
  isSelected,
  isMultiSelected,
  isMultiMode,
  onClick,
  onMultiSelect,
  onDelete,
  onCopyTitle,
  onEdit,
}: {
  ref_: Reference
  isSelected: boolean
  isMultiSelected: boolean
  isMultiMode: boolean
  onClick: () => void
  onMultiSelect: (e: React.MouseEvent) => void
  onDelete: () => void
  onCopyTitle: () => void
  onEdit: () => void
}) {
  const fieldCount = ref_.fields.length
  const timeAgo = ref_.updatedAt
    ? formatDistanceToNow(new Date(ref_.updatedAt), { addSuffix: false })
    : ""

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      onMultiSelect(e)
    } else {
      onClick()
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          onClick={handleClick}
          className={cn(
            "w-full text-left px-5 py-3 border-b border-border/50 transition-colors duration-100",
            "hover:bg-hover-bg focus-visible:outline-none",
            isSelected && !isMultiMode && "bg-hover-bg",
            isMultiSelected && "bg-accent/8"
          )}
        >
          <div className="flex items-start gap-2.5">
            {/* Checkbox in multi-select mode */}
            {isMultiMode && (
              <div
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0 rounded border transition-colors flex items-center justify-center",
                  isMultiSelected
                    ? "border-accent bg-accent text-white"
                    : "border-border/80 bg-transparent"
                )}
              >
                {isMultiSelected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            )}
            {!isMultiMode && (
              <FileText
                weight="duotone"
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-note font-medium text-foreground">
                  {ref_.title || "Untitled Reference"}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {fieldCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-secondary/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
                      {fieldCount}
                    </span>
                  )}
                  {timeAgo && (
                    <span className="text-2xs text-muted-foreground/50 whitespace-nowrap">
                      {timeAgo}
                    </span>
                  )}
                </div>
              </div>
              {ref_.content && (
                <div className="mt-0.5 truncate text-2xs text-muted-foreground/70">
                  {ref_.content}
                </div>
              )}
            </div>
          </div>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onEdit}>
          <PencilSimple weight="bold" className="mr-2 h-3.5 w-3.5" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem onClick={onCopyTitle}>
          <Copy weight="bold" className="mr-2 h-3.5 w-3.5" />
          Copy title
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash weight="bold" className="mr-2 h-3.5 w-3.5" />
          Delete reference
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/* ── Empty State ─────────────────────────────────── */

function EmptyReferences({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <Books weight="duotone" className="h-12 w-12 text-muted-foreground/30" />
      <div>
        <p className="text-note font-medium text-muted-foreground/60">
          No references yet
        </p>
        <p className="mt-1 text-2xs text-muted-foreground/40 max-w-[280px]">
          References are reusable sources linked to your footnotes.
          Create one to get started.
        </p>
      </div>
      <button
        onClick={onCreate}
        className="mt-2 flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-2xs font-medium text-accent hover:bg-accent/20 transition-colors"
      >
        <Plus weight="bold" className="h-3 w-3" />
        New Reference
      </button>
    </div>
  )
}

/* ── Coming Soon Placeholder ─────────────────────── */

function ComingSoonTab({ label }: { label: string }) {
  const Icon = label === "Tags" ? Tag : Folder
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground/40">
      <Icon weight="duotone" className="h-10 w-10" />
      <span className="text-note font-medium">{label}</span>
      <span className="text-2xs">Coming Soon</span>
    </div>
  )
}

/* ── Search Empty State ──────────────────────────── */

function SearchEmpty({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <Books weight="duotone" className="h-8 w-8 text-muted-foreground/25" />
      <p className="text-2xs text-muted-foreground/40">
        No references matching &quot;{query}&quot;
      </p>
    </div>
  )
}

/* ── Floating Action Bar Divider ─────────────────── */

function Divider() {
  return <div className="h-7 w-px bg-border mx-1.5" />
}

/* ── Library Floating Action Bar ─────────────────── */

function LibraryFloatingActionBar({
  selectedIds,
  references,
  onClearSelection,
}: {
  selectedIds: Set<string>
  references: Record<string, Reference>
  onClearSelection: () => void
}) {
  const deleteReference = usePlotStore((s) => s.deleteReference)
  const updateReference = usePlotStore((s) => s.updateReference)

  const count = selectedIds.size
  if (count === 0) return null

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteReference(id))
    onClearSelection()
    toast.success(`Deleted ${count} reference${count > 1 ? "s" : ""}`)
  }

  const handleBulkExport = () => {
    const text = [...selectedIds]
      .map((id) => references[id])
      .filter(Boolean)
      .map((r) => {
        let s = r.title || "Untitled Reference"
        if (r.content) s += "\n" + r.content
        if (r.fields.length) s += "\n" + r.fields.map((f) => `  ${f.key}: ${f.value}`).join("\n")
        return s
      })
      .join("\n\n---\n\n")
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${count} reference${count > 1 ? "s" : ""} to clipboard`)
  }

  const handleBulkAddField = () => {
    const key = window.prompt("Field name:")
    if (!key) return
    const value = window.prompt("Field value:") ?? ""
    selectedIds.forEach((id) => {
      const ref = references[id]
      if (ref) {
        updateReference(id, { fields: [...ref.fields, { key, value }] })
      }
    })
    toast.success(`Added "${key}" to ${count} reference${count > 1 ? "s" : ""}`)
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-overlay px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* Selection info */}
        <button
          onClick={onClearSelection}
          className="mr-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-active-bg transition-colors"
        >
          <Lightning size={14} weight="fill" className="text-accent" />
          {count} selected
          <PhX size={12} weight="regular" className="ml-0.5 text-muted-foreground/50" />
        </button>

        <Divider />

        {/* Delete */}
        <button
          onClick={handleBulkDelete}
          title="Delete selected"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash size={16} weight="regular" />
          Delete
        </button>

        <Divider />

        {/* Export / Copy */}
        <button
          onClick={handleBulkExport}
          title="Copy to clipboard"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium text-foreground hover:bg-hover-bg transition-colors"
        >
          <Copy size={16} weight="regular" />
          Export
        </button>

        {/* Add Field */}
        <button
          onClick={handleBulkAddField}
          title="Add field to all"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium text-foreground hover:bg-hover-bg transition-colors"
        >
          <ListBullets size={16} weight="regular" />
          Add Field
        </button>
      </div>
    </div>
  )
}

/* ── Dashboard Section ───────────────────────────── */

function DashboardSection({
  title,
  href,
  disabled,
  stats,
}: {
  title: string
  href?: string
  disabled?: boolean
  stats: Array<{ label: string; value: number; muted?: boolean }>
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-2xs font-medium text-muted-foreground/60 uppercase tracking-wider">
          {title}
        </h3>
        {href && !disabled && (
          <button
            onClick={() => setActiveRoute(href)}
            className="text-2xs text-accent hover:underline"
          >
            View all →
          </button>
        )}
        {disabled && (
          <span className="text-2xs text-muted-foreground/30">Coming soon</span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col items-center gap-1 p-4 rounded-xl border",
              disabled
                ? "border-border/20 opacity-30"
                : stat.muted
                  ? "border-border/30 opacity-50"
                  : "border-border/50 hover:border-accent/20 transition-colors"
            )}
          >
            <span
              className={cn(
                "text-2xl font-bold tabular-nums",
                disabled ? "text-muted-foreground/30" : "text-foreground"
              )}
            >
              {stat.value}
            </span>
            <span className="text-2xs text-muted-foreground/50">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Library Overview ────────────────────────────── */

function LibraryOverview() {
  const references = usePlotStore((s) => s.references)
  const tags = usePlotStore((s) => s.tags)
  const attachments = usePlotStore((s) => s.attachments)

  // Reference stats
  const refList = Object.values(references)
  const refTotal = refList.length
  const refLinked = refList.filter((r) => r.content.trim()).length
  const refUnlinked = refTotal - refLinked
  const refEmpty = refList.filter(
    (r) => !r.title.trim() || r.title === "Untitled Reference"
  ).length

  // Tag stats
  const tagTotal = tags.filter((t) => !t.trashed).length

  // File/attachment stats
  const fileTotal = attachments.length
  const imageCount = attachments.filter((a) => a.type === "image").length
  const docCount = attachments.filter((a) => a.type !== "image").length

  // Recent references (sorted by updatedAt desc)
  const recentRefs = useMemo(
    () =>
      [...refList]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5),
    [refList]
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ViewHeader
        icon={<SquaresFour weight="duotone" className="h-4 w-4" />}
        title="Library"
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl space-y-8">
          {/* References Section */}
          <DashboardSection
            title="References"
            href="/library/references"
            stats={[
              { label: "Total", value: refTotal },
              { label: "Linked", value: refLinked },
              { label: "Unlinked", value: refUnlinked },
              { label: "Empty", value: refEmpty, muted: refEmpty === 0 },
            ]}
          />

          {/* Tags Section */}
          <DashboardSection
            title="Tags"
            disabled
            stats={[{ label: "Total", value: tagTotal }]}
          />

          {/* Files Section */}
          <DashboardSection
            title="Files"
            disabled
            stats={[
              { label: "Total", value: fileTotal },
              { label: "Images", value: imageCount },
              { label: "Documents", value: docCount },
            ]}
          />

          {/* Recent Activity */}
          {recentRefs.length > 0 && (
            <div>
              <h3 className="text-2xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-3">
                Recent
              </h3>
              <div className="space-y-1">
                {recentRefs.map((ref) => (
                  <button
                    key={ref.id}
                    onClick={() => setActiveRoute("/library/references")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-hover-bg transition-colors text-left"
                  >
                    <Books
                      size={14}
                      className="text-muted-foreground/50 shrink-0"
                    />
                    <span className="flex-1 truncate text-note text-foreground">
                      {ref.title || "Untitled"}
                    </span>
                    <span className="text-2xs text-muted-foreground/40 shrink-0">
                      {formatDistanceToNow(new Date(ref.updatedAt), {
                        addSuffix: false,
                      })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── References View ─────────────────────────────── */

function ReferencesView() {
  const references = usePlotStore((s) => s.references)
  const createReference = usePlotStore((s) => s.createReference)
  const deleteReference = usePlotStore((s) => s.deleteReference)
  const openReferencePanel = usePlotStore((s) => s.openReferencePanel)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all")
  const [activeFieldKeys, setActiveFieldKeys] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<SortField>("updatedAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const lastClickedIdRef = useRef<string | null>(null)

  const isMultiMode = selectedIds.size > 0

  /* ── Filter/Sort helpers ── */

  const toggleFieldKey = useCallback((key: string) => {
    setActiveFieldKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const toggleSort = useCallback((field: SortField) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      } else {
        setSortDir(field === "title" ? "asc" : "desc")
      }
      return field
    })
  }, [])

  const hasActiveFilters = quickFilter !== "all" || activeFieldKeys.size > 0

  /* ── Derived data ── */

  const totalCount = useMemo(() => Object.keys(references).length, [references])

  const linkedCount = useMemo(
    () => Object.values(references).filter((r) => r.content.trim()).length,
    [references]
  )
  const unlinkedCount = useMemo(
    () => totalCount - linkedCount,
    [totalCount, linkedCount]
  )

  const fieldKeys = useMemo(() => {
    const keys = new Set<string>()
    Object.values(references).forEach((r) =>
      r.fields.forEach((f) => {
        if (f.key.trim()) keys.add(f.key.trim())
      })
    )
    return [...keys].sort()
  }, [references])

  const referenceList = useMemo(() => {
    let arr = Object.values(references)

    // Quick filter
    if (quickFilter === "linked") arr = arr.filter((r) => r.content.trim())
    if (quickFilter === "unlinked") arr = arr.filter((r) => !r.content.trim())

    // Field key filter (AND logic)
    if (activeFieldKeys.size > 0) {
      arr = arr.filter((r) => {
        const refKeys = new Set(r.fields.map((f) => f.key.trim()))
        return [...activeFieldKeys].every((k) => refKeys.has(k))
      })
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q)
      )
    }

    // Sort
    arr.sort((a, b) => {
      let cmp = 0
      if (sortBy === "title") {
        cmp = (a.title || "").localeCompare(b.title || "")
      } else if (sortBy === "createdAt") {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else {
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return arr
  }, [references, quickFilter, activeFieldKeys, search, sortBy, sortDir])

  // Clear selection if reference was deleted
  useEffect(() => {
    if (selectedId && !references[selectedId]) {
      setSelectedId(null)
    }
  }, [selectedId, references])

  // Clean up multi-select for deleted references
  useEffect(() => {
    if (selectedIds.size === 0) return
    const next = new Set<string>()
    selectedIds.forEach((id) => {
      if (references[id]) next.add(id)
    })
    if (next.size !== selectedIds.size) setSelectedIds(next)
  }, [references, selectedIds])

  // Escape to clear multi-select
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedIds.size > 0) {
        setSelectedIds(new Set())
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [selectedIds.size])

  /* ── Actions ── */

  const handleCreate = useCallback(() => {
    const id = createReference({ title: "", content: "" })
    setSelectedId(id)
  }, [createReference])

  const handleDelete = useCallback(
    (id: string) => {
      deleteReference(id)
      if (selectedId === id) setSelectedId(null)
    },
    [deleteReference, selectedId]
  )

  const handleCopyTitle = useCallback((title: string) => {
    navigator.clipboard.writeText(title || "Untitled Reference")
  }, [])

  const handleEdit = useCallback((id: string) => {
    setSelectedId(id)
    openReferencePanel(id)
  }, [openReferencePanel])

  const handleMultiSelect = useCallback((id: string, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedIdRef.current) {
      // Range select
      const lastIdx = referenceList.findIndex((r) => r.id === lastClickedIdRef.current)
      const curIdx = referenceList.findIndex((r) => r.id === id)
      if (lastIdx !== -1 && curIdx !== -1) {
        const start = Math.min(lastIdx, curIdx)
        const end = Math.max(lastIdx, curIdx)
        const next = new Set(selectedIds)
        for (let i = start; i <= end; i++) {
          next.add(referenceList[i].id)
        }
        setSelectedIds(next)
        return
      }
    }
    // Ctrl/Cmd toggle
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    lastClickedIdRef.current = id
  }, [referenceList, selectedIds])

  const handleRowClick = useCallback((id: string) => {
    setSelectedIds(new Set())
    setSelectedId(id)
    openReferencePanel(id)
    lastClickedIdRef.current = id
  }, [openReferencePanel])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === referenceList.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(referenceList.map((r) => r.id)))
    }
  }, [selectedIds.size, referenceList])

  const isAllSelected = referenceList.length > 0 && selectedIds.size === referenceList.length
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < referenceList.length

  /* ── Render ── */

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ViewHeader
        icon={<Books weight="duotone" className="h-4 w-4" />}
        title="References"
        count={totalCount}
        searchPlaceholder="Search references..."
        searchValue={search}
        onSearchChange={setSearch}
        onCreateNew={handleCreate}
        showFilter
        hasActiveFilters={hasActiveFilters}
        filterContent={
          <div className="p-3 w-[260px]">
            <div className="text-2xs font-medium text-muted-foreground/60 mb-2">
              Status
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {(["all", "linked", "unlinked"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setQuickFilter(f)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-2xs font-medium transition-colors capitalize",
                    quickFilter === f
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground/60 hover:bg-hover-bg hover:text-foreground"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            {fieldKeys.length > 0 && (
              <>
                <div className="text-2xs font-medium text-muted-foreground/60 mb-2">
                  Field Keys
                </div>
                <div className="flex flex-wrap gap-1">
                  {fieldKeys.map((key) => (
                    <button
                      key={key}
                      onClick={() => toggleFieldKey(key)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-2xs font-medium transition-colors",
                        activeFieldKeys.has(key)
                          ? "bg-accent/10 text-accent"
                          : "text-muted-foreground/60 hover:bg-hover-bg hover:text-foreground"
                      )}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </>
            )}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setQuickFilter("all")
                  setActiveFieldKeys(new Set())
                }}
                className="mt-3 w-full text-2xs text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        }
      />

      {/* Quick filter bar */}
      {totalCount > 0 && (
        <QuickFilterBar
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          totalCount={totalCount}
          linkedCount={linkedCount}
          unlinkedCount={unlinkedCount}
          fieldKeys={fieldKeys}
          activeFieldKeys={activeFieldKeys}
          toggleFieldKey={toggleFieldKey}
        />
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {referenceList.length === 0 ? (
          search.trim() ? (
            <SearchEmpty query={search} />
          ) : (
            <EmptyReferences onCreate={handleCreate} />
          )
        ) : (
          <>
            {/* Select All Header Row */}
            <div className="flex items-center gap-2.5 px-5 py-2 border-b border-border/50 text-2xs text-muted-foreground/60">
              <button
                onClick={handleSelectAll}
                className="w-4 h-4 rounded border border-border flex items-center justify-center shrink-0 hover:border-foreground/30 transition-colors"
              >
                {isAllSelected ? (
                  <Check size={12} className="text-accent" />
                ) : isPartiallySelected ? (
                  <Minus size={12} className="text-muted-foreground" />
                ) : null}
              </button>
              <button
                onClick={() => toggleSort("title")}
                className="flex-1 flex items-center gap-0.5 font-medium hover:text-foreground transition-colors text-left"
              >
                Name
                {sortBy === "title" && (
                  sortDir === "asc"
                    ? <CaretUp size={10} weight="bold" className="text-accent" />
                    : <CaretDown size={10} weight="bold" className="text-accent" />
                )}
              </button>
              <span className="w-16 text-right">Fields</span>
              <button
                onClick={() => toggleSort("updatedAt")}
                className="w-20 flex items-center justify-end gap-0.5 font-medium hover:text-foreground transition-colors"
              >
                Updated
                {sortBy === "updatedAt" && (
                  sortDir === "asc"
                    ? <CaretUp size={10} weight="bold" className="text-accent" />
                    : <CaretDown size={10} weight="bold" className="text-accent" />
                )}
              </button>
            </div>
            {referenceList.map((ref) => (
              <ReferenceRow
                key={ref.id}
                ref_={ref}
                isSelected={selectedId === ref.id}
                isMultiSelected={selectedIds.has(ref.id)}
                isMultiMode={isMultiMode}
                onClick={() => handleRowClick(ref.id)}
                onMultiSelect={(e) => handleMultiSelect(ref.id, e)}
                onDelete={() => handleDelete(ref.id)}
                onCopyTitle={() => handleCopyTitle(ref.title)}
                onEdit={() => handleEdit(ref.id)}
              />
            ))}
          </>
        )}
      </div>

      {/* Floating Action Bar */}
      {isMultiMode && (
        <LibraryFloatingActionBar
          selectedIds={selectedIds}
          references={references}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  )
}

/* ── Main Component ──────────────────────────────── */

export function LibraryView() {
  const activeRoute = useActiveRoute()

  // Determine which sub-view to show
  const isReferences = activeRoute === "/library/references"
  const isTags = activeRoute === "/library/tags"
  const isFiles = activeRoute === "/library/files"
  const isOverview = !isReferences && !isTags && !isFiles

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {isOverview && <LibraryOverview />}
      {isReferences && <ReferencesView />}
      {isTags && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <ViewHeader
            icon={<Tag weight="duotone" className="h-4 w-4" />}
            title="Tags"
          />
          <ComingSoonTab label="Tags" />
        </div>
      )}
      {isFiles && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <ViewHeader
            icon={<Folder weight="duotone" className="h-4 w-4" />}
            title="Files"
          />
          <ComingSoonTab label="Files" />
        </div>
      )}
    </div>
  )
}
