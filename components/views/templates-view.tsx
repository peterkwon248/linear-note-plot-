"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import { PushPinSlash } from "@phosphor-icons/react/dist/ssr/PushPinSlash"
import { Layout } from "@phosphor-icons/react/dist/ssr/Layout"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Columns } from "@phosphor-icons/react/dist/ssr/Columns"
import { GridFour } from "@phosphor-icons/react/dist/ssr/GridFour"
import { ArrowsDownUp } from "@phosphor-icons/react/dist/ssr/ArrowsDownUp"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import type { NoteTemplate, NoteStatus, NotePriority } from "@/lib/types"
import { ViewHeader } from "@/components/view-header"
import { TemplateEditPage } from "@/components/views/template-edit-page"
// PR template-b: TemplateEditor (right-panel form), TipTapEditor, FixedToolbar,
// ArrowLeft, ArrowsOut, Editor, useCallback imports were removed — the
// editing surface lives in TemplateEditPage now. NoteStatus + NotePriority
// + FileText are still consumed by TemplateCard (grid view).
// PRESET_COLORS / per-template icon+color dropped in v102 (PR template-a).

/* ── Constants ─────────────────────────────────────────── */

// ICON_OPTIONS removed in v102 — templates use a generic Layout icon now.

const PLACEHOLDER_VARS = [
  { key: "{date}",     label: "Date",     desc: "YYYY-MM-DD" },
  { key: "{time}",     label: "Time",     desc: "HH:MM" },
  { key: "{datetime}", label: "DateTime", desc: "YYYY-MM-DD HH:MM" },
  { key: "{year}",     label: "Year",     desc: "YYYY" },
  { key: "{month}",    label: "Month",    desc: "MM" },
  { key: "{day}",      label: "Day",      desc: "DD" },
] as const

/* "focus" mode dropped in PR template-b — list-editor with the side panel
   IS the focus experience now (NoteEditor reuse + properties side panel). */
type TemplateViewMode = "list-editor" | "grid"

const VIEW_MODES: { mode: TemplateViewMode; label: string; icon: typeof Columns }[] = [
  { mode: "list-editor", label: "List + Editor", icon: Columns },
  { mode: "grid",        label: "Grid",          icon: GridFour },
]

// PR template-b: dialog now collects only the two fields the user must
// pick at create time. Everything else (title pattern, status, priority,
// label, folder, tags, pinned, content) defaults and becomes editable
// in the side panel + main editor right after the template is created.
interface TemplateFormData {
  name: string
  description: string
}

const DEFAULT_FORM: TemplateFormData = {
  name: "",
  description: "",
}

/* ── View Mode Switcher ────────────────────────────────── */

function TemplateViewSwitcher({
  viewMode,
  onChangeMode,
}: {
  viewMode: TemplateViewMode
  onChangeMode: (mode: TemplateViewMode) => void
}) {
  const [open, setOpen] = useState(false)
  const CurrentIcon = VIEW_MODES.find((m) => m.mode === viewMode)?.icon ?? GridFour

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center justify-center rounded-md p-1.5",
            "text-muted-foreground hover:text-foreground hover:bg-hover-bg",
            "transition-colors"
          )}
          title="View mode"
        >
          <CurrentIcon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5" sideOffset={8}>
        {VIEW_MODES.map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => {
              onChangeMode(mode)
              setOpen(false)
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
              viewMode === mode
                ? "bg-secondary/80 text-foreground"
                : "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-note font-medium">{label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

/* ── Create Dialog ─────────────────────────────────────── */

function TemplateFormDialog({
  initial,
  onSubmit,
  onCancel,
  title: dialogTitle,
}: {
  initial: TemplateFormData
  onSubmit: (data: TemplateFormData) => void
  onCancel: () => void
  title: string
}) {
  const [form, setForm] = useState<TemplateFormData>(initial)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 0)
  }, [])

  const handleSubmit = () => {
    if (!form.name.trim()) return
    onSubmit({ ...form, name: form.name.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-ui font-semibold text-foreground">{dialogTitle}</h2>
          <button
            onClick={onCancel}
            className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-hover-bg text-muted-foreground hover:text-foreground transition-colors"
          >
            <PhX size={16} weight="regular" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Name */}
          <div>
            <label className="block text-note font-medium text-muted-foreground mb-1.5">Name</label>
            <input
              ref={nameRef}
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Template name"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-note text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-note font-medium text-muted-foreground mb-1.5">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-note text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Status / Priority / Title-pattern fields moved to the side
              panel (TemplateDetailPanel) in PR template-b. The create
              dialog now only collects name + description; everything else
              defaults and is editable post-create from the side panel. */}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-note text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim()}
            className="px-4 py-2 rounded-md text-note bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

/* TemplateEditor (right-panel form) was deleted in PR template-b — its
   editing surface is now `<TemplateEditPage>` (NoteEditor reuse) and its
   metadata fields live in the side panel via `TemplateDetailPanel`. */

/* ── Template Card (Grid view) ─────────────────────────── */

function TemplateCard({
  tmpl,
  onSelect,
  onUse,
  onEdit,
  onPin,
  onDelete,
}: {
  tmpl: NoteTemplate
  onSelect: (id: string) => void
  onUse: (id: string) => void
  onEdit: (id: string) => void
  onPin: (id: string) => void
  onDelete: (id: string) => void
}) {
  const STATUS_LABELS: Record<NoteStatus, string> = {
    inbox: "Inbox",
    capture: "Capture",
    permanent: "Permanent",
  }

  const PRIORITY_LABELS: Record<NotePriority, string> = {
    none: "",
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",
  }

  const PRIORITY_COLORS: Record<NotePriority, string> = {
    none: "",
    low: "text-blue-400 bg-blue-400/10",
    medium: "text-yellow-400 bg-yellow-400/10",
    high: "text-orange-400 bg-orange-400/10",
    urgent: "text-red-400 bg-red-400/10",
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onClick={() => onSelect(tmpl.id)}
          className="group relative flex flex-col rounded-lg border border-border bg-card hover:bg-hover-bg transition-colors cursor-pointer overflow-hidden"
        >
          {/* Card top accent removed in v102 — templates no longer carry
              per-template color. Visual hierarchy comes from name + label. */}

          <div className="flex flex-col gap-2 p-4">
            {/* Generic Layout icon — was per-template emoji until v102. */}
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/40 text-muted-foreground">
                <Layout size={16} weight="regular" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-note font-semibold text-foreground truncate">{tmpl.name}</span>
                  {tmpl.pinned && <PushPin className="text-accent shrink-0" size={12} weight="regular" />}
                </div>
                {tmpl.description && (
                  <p className="text-2xs text-muted-foreground truncate mt-0.5">{tmpl.description}</p>
                )}
              </div>
            </div>

            {/* Title + Content preview */}
            <div className="bg-secondary/40 rounded-md px-2.5 py-2 space-y-1">
              {tmpl.title && (
                <p className="text-2xs font-semibold text-foreground/70 truncate">
                  {tmpl.title}
                </p>
              )}
              {tmpl.content ? (
                <div className="text-2xs text-muted-foreground/70 line-clamp-3 leading-relaxed space-y-0.5">
                  {tmpl.content.split("\n").filter(Boolean).slice(0, 4).map((line, i) => (
                    <p key={i} className={cn(
                      line.startsWith("#") && "font-semibold text-muted-foreground/90",
                      (line.startsWith("- ") || line.startsWith("* ")) && "pl-2 before:content-['·'] before:mr-1 before:text-muted-foreground/70",
                      (line.match(/^\d+\.\s/)) && "pl-2",
                    )}>
                      {line.replace(/^#+\s*/, "")}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-2xs text-muted-foreground/70 italic">Empty template</p>
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-2xs font-medium bg-secondary text-muted-foreground">
                {STATUS_LABELS[tmpl.status]}
              </span>
              {tmpl.priority !== "none" && (
                <span className={cn(
                  "inline-flex items-center rounded-md px-1.5 py-0.5 text-2xs font-medium",
                  PRIORITY_COLORS[tmpl.priority]
                )}>
                  {PRIORITY_LABELS[tmpl.priority]}
                </span>
              )}
            </div>
          </div>

          {/* Hover action buttons */}
          <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(tmpl.id) }}
              className="flex items-center justify-center h-6 w-6 rounded-md bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
              title="Edit"
            >
              <Layout size={14} weight="regular" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(tmpl.id) }}
              className="flex items-center justify-center h-6 w-6 rounded-md bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-red-400 hover:bg-hover-bg transition-colors"
              title="Delete"
            >
              <Trash size={14} weight="regular" />
            </button>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onUse(tmpl.id)}>
          <FileText className="mr-2 text-muted-foreground" size={16} weight="regular" />
          Use template
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onEdit(tmpl.id)}>
          <Layout className="mr-2 text-muted-foreground" size={16} weight="regular" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onPin(tmpl.id)}>
          {tmpl.pinned ? (
            <>
              <PushPinSlash className="mr-2 text-muted-foreground" size={16} weight="regular" />
              Unpin
            </>
          ) : (
            <>
              <PushPin className="mr-2 text-muted-foreground" size={16} weight="regular" />
              PushPin
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(tmpl.id)}
          className="text-red-400 focus:text-red-400"
        >
          <Trash className="mr-2" size={16} weight="regular" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/* ── Template Sort Dropdown ────────────────────────────── */

const TEMPLATE_SORT_OPTIONS = [
  { value: "name-asc" as const, label: "Name A-Z" },
  { value: "name-desc" as const, label: "Name Z-A" },
  { value: "updated-desc" as const, label: "Updated (newest)" },
  { value: "updated-asc" as const, label: "Updated (oldest)" },
  { value: "created-desc" as const, label: "Created (newest)" },
]

function TemplateSortDropdown({
  value,
  onChange,
}: {
  value: string
  onChange: (v: "name-asc" | "name-desc" | "updated-desc" | "updated-asc" | "created-desc") => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-note text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground">
          <ArrowsDownUp size={14} weight="regular" />
          {TEMPLATE_SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Sort"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {TEMPLATE_SORT_OPTIONS.map(({ value: v, label }) => (
          <DropdownMenuItem key={v} onClick={() => onChange(v)}>
            <PhCheck className={cn(" mr-2 shrink-0", value === v ? "opacity-100" : "opacity-0")} size={14} weight="bold" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── Templates View ───────────────────────────────────── */

export function TemplatesView() {
  const templates = usePlotStore((s) => s.templates) as NoteTemplate[]
  const createTemplate = usePlotStore((s) => s.createTemplate) as (t: Omit<NoteTemplate, "id" | "createdAt" | "updatedAt">) => string
  const updateTemplate = usePlotStore((s) => s.updateTemplate) as (id: string, updates: Partial<NoteTemplate>) => void
  const deleteTemplate = usePlotStore((s) => s.deleteTemplate) as (id: string) => void
  const toggleTemplatePin = usePlotStore((s) => s.toggleTemplatePin) as (id: string) => void
  const createNoteFromTemplate = usePlotStore((s) => s.createNoteFromTemplate) as (id: string) => string
  const openNote = usePlotStore((s) => s.openNote)

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [viewMode, setViewMode] = useState<TemplateViewMode>("grid")
  const [templateSortBy, setTemplateSortBy] = useState<"name-asc" | "name-desc" | "updated-desc" | "updated-asc" | "created-desc">("updated-desc")
  const [search, setSearch] = useState("")

  // Sorted: pinned first, then by selected sort, then filtered by search (excluding trashed)
  const sortedTemplates = useMemo(() => {
    const q = search.trim().toLowerCase()
    const activeTemplates = templates.filter((t) => !t.trashed)
    const filtered = q ? activeTemplates.filter((t) => t.name.toLowerCase().includes(q)) : activeTemplates
    const pinned = filtered.filter((t) => t.pinned)
    const unpinned = filtered.filter((t) => !t.pinned)
    const sortFn = (a: NoteTemplate, b: NoteTemplate) => {
      switch (templateSortBy) {
        case "name-asc": return a.name.localeCompare(b.name)
        case "name-desc": return b.name.localeCompare(a.name)
        case "updated-desc": return b.updatedAt.localeCompare(a.updatedAt)
        case "updated-asc": return a.updatedAt.localeCompare(b.updatedAt)
        case "created-desc": return b.createdAt.localeCompare(a.createdAt)
        default: return 0
      }
    }
    return [...pinned.sort(sortFn), ...unpinned.sort(sortFn)]
  }, [templates, templateSortBy, search])

  const selectedTemplate = selectedTemplateId ? templates.find((t) => t.id === selectedTemplateId) ?? null : null

  // If selected template gets deleted, clear selection
  useEffect(() => {
    if (selectedTemplateId && !templates.find((t) => t.id === selectedTemplateId)) {
      setSelectedTemplateId(null)
    }
  }, [templates, selectedTemplateId])

  // Q3 default: auto-open the side panel the first time the user picks a
  // template this session, then respect any subsequent toggles. Tracked
  // via a session-scoped ref so re-selecting the same template does not
  // re-open the panel after the user has explicitly closed it.
  const sidePanelAutoOpenedRef = useRef(false)
  useEffect(() => {
    if (!selectedTemplateId) return
    const store = usePlotStore.getState()
    store.setSidePanelContext({ type: "template", id: selectedTemplateId })
    if (!sidePanelAutoOpenedRef.current && !store.sidePanelOpen) {
      store.setSidePanelOpen(true)
      sidePanelAutoOpenedRef.current = true
    }
  }, [selectedTemplateId])

  // Direct mode switch — no auto-selection guards now that "focus" is gone.
  const handleSetViewMode = (mode: TemplateViewMode) => setViewMode(mode)

  const handleCreateSubmit = (data: TemplateFormData) => {
    // Q1 default: drop straight into list-editor with the new template
    // selected. Defaults for the rest of the metadata mirror what the
    // simplified dialog hides — user edits them in the side panel.
    const newId = createTemplate({
      name: data.name,
      description: data.description,
      title: "",
      content: "",
      contentJson: null,
      status: "inbox",
      priority: "none",
      pinned: false,
      labelId: null,
      tags: [],
      folderId: null,
    })
    setShowCreateDialog(false)
    setSelectedTemplateId(newId)
    setViewMode("list-editor")
  }

  const handleUseTemplate = (templateId: string) => {
    const noteId = createNoteFromTemplate(templateId)
    if (noteId) openNote(noteId)
  }

  const handleDelete = (id: string) => {
    deleteTemplate(id)
  }

  // Card grid: clicking selects and switches to list-editor
  const handleCardSelect = (id: string) => {
    setSelectedTemplateId(id)
    setViewMode("list-editor")
  }

  // Card edit button: switch to list-editor with that template
  const handleCardEdit = (id: string) => {
    setSelectedTemplateId(id)
    setViewMode("list-editor")
  }

  /* ── Grid Mode ─────────────────────────────────────── */
  if (viewMode === "grid") {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <ViewHeader
          icon={<Layout size={20} weight="regular" />}
          title="Templates"
          count={templates.length}
          searchPlaceholder="Search templates..."
          searchValue={search}
          onSearchChange={setSearch}
          actions={
            <>
              <TemplateSortDropdown value={templateSortBy} onChange={setTemplateSortBy} />
              <TemplateViewSwitcher viewMode={viewMode} onChangeMode={handleSetViewMode} />
              <button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-note font-medium text-accent-foreground hover:bg-accent/90"
              >
                <PhPlus size={14} weight="regular" />
                New
              </button>
            </>
          }
        />

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 px-4">
              <Layout className="text-muted-foreground/60" size={32} weight="regular" />
              <span className="text-2xs text-muted-foreground text-center">No templates yet</span>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="mt-1 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-2xs bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
              >
                <PhPlus size={12} weight="regular" />
                New template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {sortedTemplates.map((tmpl) => (
                <TemplateCard
                  key={tmpl.id}
                  tmpl={tmpl}
                  onSelect={handleCardSelect}
                  onUse={handleUseTemplate}
                  onEdit={handleCardEdit}
                  onPin={toggleTemplatePin}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {showCreateDialog && (
          <TemplateFormDialog
            initial={DEFAULT_FORM}
            onSubmit={handleCreateSubmit}
            onCancel={() => setShowCreateDialog(false)}
            title="New Template"
          />
        )}
      </div>
    )
  }

  /* "Focus Mode" branch removed in PR template-b. List+Editor with the
     side panel (TemplateDetailPanel) covers the same focused experience
     and matches the NoteEditor surface. */

  /* ── List + Editor Mode (default) ──────────────────── */
  return (
    <div className="flex flex-1 flex-row overflow-hidden">
      {/* ── Left Panel: Template List ──────────────────── */}
      <div className="flex flex-col w-[280px] min-w-[280px] border-r border-border overflow-hidden">
        <ViewHeader
          icon={<Layout size={20} weight="regular" />}
          title="Templates"
          count={templates.length}
          searchPlaceholder="Search templates..."
          searchValue={search}
          onSearchChange={setSearch}
          actions={
            <>
              <TemplateSortDropdown value={templateSortBy} onChange={setTemplateSortBy} />
              <TemplateViewSwitcher viewMode={viewMode} onChangeMode={handleSetViewMode} />
              <button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-note font-medium text-accent-foreground hover:bg-accent/90"
              >
                <PhPlus size={14} weight="regular" />
                New
              </button>
            </>
          }
        />

        {/* List */}
        <div className="flex-1 overflow-y-auto py-1">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 px-4">
              <Layout className="text-muted-foreground/60" size={32} weight="regular" />
              <span className="text-2xs text-muted-foreground text-center">No templates yet</span>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="mt-1 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-2xs bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
              >
                <PhPlus size={12} weight="regular" />
                New template
              </button>
            </div>
          ) : (
            sortedTemplates.map((tmpl) => (
              <ContextMenu key={tmpl.id}>
                <ContextMenuTrigger asChild>
                  <button
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`group w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                      selectedTemplateId === tmpl.id
                        ? "bg-accent/10 border-l-2 border-accent"
                        : "border-l-2 border-transparent hover:bg-hover-bg"
                    }`}
                  >
                    {/* Generic Layout icon — was per-template emoji until v102. */}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary/40 text-muted-foreground">
                      <Layout size={14} weight="regular" />
                    </span>

                    {/* Name + description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-note font-medium text-foreground truncate">{tmpl.name}</span>
                        {tmpl.pinned && <PushPin className="text-accent shrink-0" size={12} weight="regular" />}
                      </div>
                      {tmpl.description && (
                        <div className="text-2xs text-muted-foreground truncate">{tmpl.description}</div>
                      )}
                    </div>
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem onClick={() => handleUseTemplate(tmpl.id)}>
                    <FileText className="mr-2 text-muted-foreground" size={16} weight="regular" />
                    Use template
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => setSelectedTemplateId(tmpl.id)}>
                    <Layout className="mr-2 text-muted-foreground" size={16} weight="regular" />
                    Edit
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => toggleTemplatePin(tmpl.id)}>
                    {tmpl.pinned ? (
                      <>
                        <PushPinSlash className="mr-2 text-muted-foreground" size={16} weight="regular" />
                        Unpin
                      </>
                    ) : (
                      <>
                        <PushPin className="mr-2 text-muted-foreground" size={16} weight="regular" />
                        PushPin
                      </>
                    )}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => handleDelete(tmpl.id)}
                    className="text-red-400 focus:text-red-400"
                  >
                    <Trash className="mr-2" size={16} weight="regular" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel: Template Editor ──────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedTemplate ? (
          <TemplateEditPage key={selectedTemplate.id} template={selectedTemplate} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
            <Layout className="text-muted-foreground/60" size={48} weight="regular" />
            <p className="text-note font-medium text-muted-foreground">Select a template to edit</p>
            <p className="text-2xs text-muted-foreground/60 max-w-xs">
              Choose a template from the list on the left, or create a new one to get started.
            </p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-note bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              <PhPlus size={14} weight="regular" />
              New template
            </button>
          </div>
        )}
      </div>

      {/* Create dialog */}
      {showCreateDialog && (
        <TemplateFormDialog
          initial={DEFAULT_FORM}
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowCreateDialog(false)}
          title="New Template"
        />
      )}
    </div>
  )
}
