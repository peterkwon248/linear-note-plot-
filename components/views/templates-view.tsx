"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
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
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { ArrowsOut } from "@phosphor-icons/react/dist/ssr/ArrowsOut"
import { Columns } from "@phosphor-icons/react/dist/ssr/Columns"
import { GridFour } from "@phosphor-icons/react/dist/ssr/GridFour"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft"
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
import type { NoteTemplate, NoteStatus, NotePriority } from "@/lib/types"
import { TipTapEditor } from "@/components/editor/TipTapEditor"
import { FixedToolbar } from "@/components/editor/FixedToolbar"
import type { Editor } from "@tiptap/react"
import { ViewHeader } from "@/components/view-header"
import { WorkspaceEditorArea } from "@/components/workspace/workspace-editor-area"
import { usePane, usePaneOpenNote } from "@/components/workspace/pane-context"
import { PRESET_COLORS } from "@/lib/colors"

/* ── Constants ─────────────────────────────────────────── */

const ICON_OPTIONS = ["📄", "📋", "📝", "💡", "📊", "🎯", "🔬", "📌", "✏️", "📎", "🗂️", "📁"]

const PLACEHOLDER_VARS = [
  { key: "{date}",     label: "Date",     desc: "YYYY-MM-DD" },
  { key: "{time}",     label: "Time",     desc: "HH:MM" },
  { key: "{datetime}", label: "DateTime", desc: "YYYY-MM-DD HH:MM" },
  { key: "{year}",     label: "Year",     desc: "YYYY" },
  { key: "{month}",    label: "Month",    desc: "MM" },
  { key: "{day}",      label: "Day",      desc: "DD" },
] as const

type TemplateViewMode = "focus" | "list-editor" | "grid"

const VIEW_MODES: { mode: TemplateViewMode; label: string; icon: typeof ArrowsOut }[] = [
  { mode: "focus",       label: "Focus",        icon: ArrowsOut },
  { mode: "list-editor", label: "List + Editor", icon: Columns },
  { mode: "grid",        label: "Grid",          icon: GridFour },
]

interface TemplateFormData {
  name: string
  description: string
  icon: string
  color: string
  title: string
  content: string
  status: NoteStatus
  priority: NotePriority
  pinned: boolean
}

const DEFAULT_FORM: TemplateFormData = {
  name: "",
  description: "",
  icon: "📄",
  color: PRESET_COLORS[5],
  title: "",
  content: "",
  status: "inbox",
  priority: "none",
  pinned: false,
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

          {/* Icon + Color row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-note font-medium text-muted-foreground mb-1.5">Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setForm((f) => ({ ...f, icon: emoji }))}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-ui transition-colors ${
                      form.icon === emoji
                        ? "bg-accent/20 ring-1 ring-accent"
                        : "hover:bg-hover-bg"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-note font-medium text-muted-foreground mb-1.5">Color</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`h-6 w-6 rounded-full transition-all ${
                      form.color === c ? "ring-2 ring-accent ring-offset-2 ring-offset-card" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Status + Priority row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-note font-medium text-muted-foreground mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as NoteStatus }))}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-note text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="inbox">Inbox</option>
                <option value="capture">Capture</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-note font-medium text-muted-foreground mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as NotePriority }))}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-note text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
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

/* ── Template Editor (Right Panel) ────────────────────── */

function TemplateEditor({
  template,
  onUpdate,
  onUse,
  topBarSlot,
}: {
  template: NoteTemplate
  onUpdate: (id: string, updates: Partial<NoteTemplate>) => void
  onUse: (id: string) => void
  topBarSlot?: React.ReactNode
}) {
  // Local state mirrors the template for controlled inputs
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description)
  const [icon, setIcon] = useState(template.icon)
  const [color, setColor] = useState(template.color)
  const [title, setTitle] = useState(template.title)
  const [contentJson, setContentJson] = useState<Record<string, unknown> | null>(template.contentJson)
  const [status, setStatus] = useState<NoteStatus>(template.status)
  const [priority, setPriority] = useState<NotePriority>(template.priority)
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)

  // Sync when template selection changes
  useEffect(() => {
    setName(template.name)
    setDescription(template.description)
    setIcon(template.icon)
    setColor(template.color)
    setTitle(template.title)
    setContentJson(template.contentJson)
    setStatus(template.status)
    setPriority(template.priority)
  }, [template.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleSave = useCallback(
    (updates: Partial<NoteTemplate>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        onUpdate(template.id, updates)
      }, 500)
    },
    [template.id, onUpdate]
  )

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }, [])

  const handleName = (v: string) => { setName(v); scheduleSave({ name: v }) }
  const handleDescription = (v: string) => { setDescription(v); scheduleSave({ description: v }) }
  const handleIcon = (v: string) => { setIcon(v); scheduleSave({ icon: v }) }
  const handleColor = (v: string) => { setColor(v); scheduleSave({ color: v }) }
  const handleTitle = (v: string) => { setTitle(v); scheduleSave({ title: v }) }
  const handleStatus = (v: NoteStatus) => { setStatus(v); scheduleSave({ status: v }) }
  const handlePriority = (v: NotePriority) => { setPriority(v); scheduleSave({ priority: v }) }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3 shrink-0">
        <div className="flex items-center gap-2">
          {topBarSlot}
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md text-ui"
            style={{ backgroundColor: `${color}20` }}
          >
            {icon}
          </span>
          <span className="text-note font-medium text-muted-foreground">Editing template</span>
        </div>
        <button
          onClick={() => onUse(template.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-note bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          <FileText size={14} weight="regular" />
          Use Template
        </button>
      </div>

      {/* Form body — flex column to let content textarea fill remaining space */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => handleName(e.target.value)}
          placeholder="Template name"
          className="w-full bg-transparent text-xl font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none border-b border-transparent focus:border-border pb-1 transition-colors"
        />

        {/* Description */}
        <input
          type="text"
          value={description}
          onChange={(e) => handleDescription(e.target.value)}
          placeholder="Brief description"
          className="w-full bg-transparent text-note text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none border-b border-transparent focus:border-border pb-1 transition-colors"
        />

        {/* Icon + Color picker row */}
        <div className="flex gap-6 items-start">
          <div>
            <label className="block text-2xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleIcon(emoji)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-ui transition-colors ${
                    icon === emoji ? "bg-accent/20 ring-1 ring-accent" : "hover:bg-hover-bg"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-2xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Color</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColor(c)}
                  className={`h-6 w-6 rounded-full transition-all ${
                    color === c ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Title template + Status + Priority row */}
        <div className="flex gap-4 items-end">
          <div className="flex-[2]">
            <label className="block text-2xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Title Template
              <span className="ml-2 text-muted-foreground/60 normal-case tracking-normal font-normal">
                {"{date}"} {"{time}"} {"{year}"}
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitle(e.target.value)}
              placeholder="e.g. Meeting - {date}"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-note text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-2xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Status</label>
            <select
              value={status}
              onChange={(e) => handleStatus(e.target.value as NoteStatus)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-note text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="inbox">Inbox</option>
              <option value="capture">Capture</option>
              <option value="permanent">Permanent</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-2xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Priority</label>
            <select
              value={priority}
              onChange={(e) => handlePriority(e.target.value as NotePriority)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-note text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Content template — fills remaining space */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <label className="text-2xs font-medium text-muted-foreground uppercase tracking-wide">Content</label>
            <div className="h-3 w-px bg-border mx-0.5" />
            <span className="text-2xs text-muted-foreground/60">Insert variable:</span>
            {PLACEHOLDER_VARS.map(({ key, label, desc }) => (
              <button
                key={key}
                title={`Insert ${key} → expands to ${desc}`}
                onClick={() => {
                  if (editorInstance) {
                    editorInstance.chain().focus().insertContent(key).run()
                  }
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-mono bg-secondary/60 text-muted-foreground hover:bg-accent/20 hover:text-accent transition-colors border border-transparent hover:border-accent/30"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-[200px] rounded-md border border-border bg-background overflow-y-auto">
            <TipTapEditor
              content={contentJson ?? {}}
              onChange={(json, plainText) => {
                setContentJson(json)
                scheduleSave({ contentJson: json, content: plainText })
              }}
              placeholder="Start writing your template content..."
              onEditorReady={(e) => setEditorInstance(e)}
            />
          </div>
        </div>
      </div>

      {/* Fixed toolbar at bottom */}
      <FixedToolbar editor={editorInstance} />
    </div>
  )
}

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
          {/* Card top accent */}
          <div className="h-1 w-full shrink-0" style={{ backgroundColor: tmpl.color }} />

          <div className="flex flex-col gap-2 p-4">
            {/* Icon + name row */}
            <div className="flex items-start gap-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg"
                style={{ backgroundColor: `${tmpl.color}20` }}
              >
                {tmpl.icon}
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
                      (line.startsWith("- ") || line.startsWith("* ")) && "pl-2 before:content-['·'] before:mr-1 before:text-muted-foreground/40",
                      (line.match(/^\d+\.\s/)) && "pl-2",
                    )}>
                      {line.replace(/^#+\s*/, "")}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-2xs text-muted-foreground/40 italic">Empty template</p>
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
  const openNote = usePaneOpenNote()
  const selectedNoteIdStore = usePlotStore((s) => s.selectedNoteId)
  const pane = usePane()
  const isEditing = pane === 'primary' && selectedNoteIdStore !== null

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

  // If entering focus mode without a selected template, auto-select first one
  const handleSetViewMode = (mode: TemplateViewMode) => {
    if (mode === "focus" && !selectedTemplate) {
      if (sortedTemplates.length > 0) {
        setSelectedTemplateId(sortedTemplates[0].id)
      } else {
        // No templates at all, stay in current mode
        return
      }
    }
    setViewMode(mode)
  }

  const handleCreateSubmit = (data: TemplateFormData) => {
    const newId = createTemplate({
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      title: data.title,
      content: data.content,
      contentJson: null,
      status: data.status,
      priority: data.priority,
      pinned: data.pinned,
      labelId: null,
      tags: [],
      folderId: null,
    })
    setShowCreateDialog(false)
    setSelectedTemplateId(newId)
    setViewMode("focus")
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
              <Layout className="text-muted-foreground/30" size={32} weight="regular" />
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

  /* ── Focus Mode ────────────────────────────────────── */
  if (viewMode === "focus") {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedTemplate ? (
          <TemplateEditor
            key={selectedTemplate.id}
            template={selectedTemplate}
            onUpdate={updateTemplate}
            onUse={handleUseTemplate}
            topBarSlot={
              <div className="flex items-center gap-1 mr-1">
                <button
                  onClick={() => setViewMode("list-editor")}
                  className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
                  title="Back to list"
                >
                  <ArrowLeft size={16} weight="regular" />
                </button>
                <TemplateViewSwitcher viewMode={viewMode} onChangeMode={handleSetViewMode} />
              </div>
            }
          />
        ) : (
          // Fallback: no template selected in focus mode
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
            <Layout className="text-muted-foreground/30" size={48} weight="regular" />
            <p className="text-note font-medium text-muted-foreground">No template selected</p>
            <button
              onClick={() => setViewMode("list-editor")}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-note bg-secondary text-foreground hover:bg-hover-bg transition-colors"
            >
              <ArrowLeft size={14} weight="regular" />
              Back to list
            </button>
          </div>
        )}

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

  // ── Workspace editor area: show when editing a note in primary pane ──
  if (isEditing) {
    return (
      <div className="flex flex-1 overflow-hidden animate-in fade-in duration-200">
        <WorkspaceEditorArea />
      </div>
    )
  }

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
              <Layout className="text-muted-foreground/30" size={32} weight="regular" />
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
                    {/* Icon */}
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-note"
                      style={{ backgroundColor: `${tmpl.color}20` }}
                    >
                      {tmpl.icon}
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
          <TemplateEditor
            key={selectedTemplate.id}
            template={selectedTemplate}
            onUpdate={updateTemplate}
            onUse={handleUseTemplate}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
            <Layout className="text-muted-foreground/30" size={48} weight="regular" />
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
