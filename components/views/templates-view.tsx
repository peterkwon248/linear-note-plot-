"use client"

/**
 * TemplatesView — list / grid for note templates (PR template-c).
 *
 * Plot Template PR c (2026-05-03): the legacy `list-editor` (left list +
 * right inline editor) is gone. Selecting a template now hands off to
 * <TemplateEditPage> (full primary panel) and the Properties live in the
 * side panel via TemplateDetailPanel. Sort / filter / display all flow
 * through the shared view-engine pipeline (`useTemplatesView`) so saved
 * views, filter chips, and ViewHeader work the same as Notes / Wiki.
 *
 * Modes (from displayConfig.viewMode):
 *   - "list": <TemplatesTable> renders virtualization-free rows
 *   - "grid": legacy <TemplateCard> grid (preserved)
 *   Board mode is intentionally NOT supported — templates are blueprints,
 *   not workflow items, so a kanban view has no semantic meaning.
 */

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
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft"
import { cn } from "@/lib/utils"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import type { NoteTemplate } from "@/lib/types"
import type { FilterRule } from "@/lib/view-engine/types"
import { ViewHeader } from "@/components/view-header"
import { FilterPanel } from "@/components/filter-panel"
import { DisplayPanel } from "@/components/display-panel"
import { TEMPLATES_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import { useTemplatesView } from "@/lib/view-engine/use-templates-view"
import { groupByInitial } from "@/lib/korean-utils"
import { TemplatesTable } from "@/components/views/templates-table"
import { TemplateEditPage } from "@/components/views/template-edit-page"
import { TemplatesFloatingActionBar } from "@/components/templates-floating-action-bar"

/* ── Constants ─────────────────────────────────────────── */

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
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-ui font-semibold text-foreground">{dialogTitle}</h2>
          <button
            onClick={onCancel}
            className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-hover-bg text-muted-foreground hover:text-foreground transition-colors"
          >
            <PhX size={16} weight="regular" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
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
        </div>

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
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onClick={() => onSelect(tmpl.id)}
          className="group relative flex flex-col rounded-lg border border-border bg-card hover:bg-hover-bg transition-colors cursor-pointer overflow-hidden"
        >
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/40 text-muted-foreground">
                <Layout size={16} weight="regular" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-note font-semibold text-foreground truncate">{tmpl.name}</span>
                  {tmpl.pinned && <PushPin className="text-accent shrink-0" size={12} weight="regular" />}
                </div>
              </div>
            </div>

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

          </div>

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
        <ContextMenuItem className="text-note" onClick={() => onUse(tmpl.id)}>
          <FileText className="mr-2 text-accent" size={16} weight="regular" />
          Use template
        </ContextMenuItem>
        <ContextMenuItem className="text-note" onClick={() => onEdit(tmpl.id)}>
          <Layout className="mr-2 text-muted-foreground" size={16} weight="regular" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem className="text-note" onClick={() => onPin(tmpl.id)}>
          {tmpl.pinned ? (
            <>
              <PushPinSlash className="mr-2 text-muted-foreground" size={16} weight="regular" />
              Unpin
            </>
          ) : (
            <>
              <PushPin className="mr-2 text-accent" size={16} weight="regular" />
              Pin
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

/* ── Templates View ───────────────────────────────────── */

export function TemplatesView() {
  const allTemplates = usePlotStore((s) => s.templates) as NoteTemplate[]
  const labels = usePlotStore((s) => s.labels)
  const folders = usePlotStore((s) => s.folders)
  const tags = usePlotStore((s) => s.tags)
  const createTemplate = usePlotStore((s) => s.createTemplate) as (t: Omit<NoteTemplate, "id" | "createdAt" | "updatedAt">) => string
  const deleteTemplate = usePlotStore((s) => s.deleteTemplate) as (id: string) => void
  const toggleTemplatePin = usePlotStore((s) => s.toggleTemplatePin) as (id: string) => void
  const createNoteFromTemplate = usePlotStore((s) => s.createNoteFromTemplate) as (id: string) => string
  const openNote = usePlotStore((s) => s.openNote)
  const sidePanelOpen = usePlotStore((s) => s.sidePanelOpen)

  // Active template = which template is being edited inside this view.
  // null → list/grid is shown; non-null → <TemplateEditPage> takes over the
  // primary panel (Back button returns).
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  // Local search (templates context doesn't pollute the global store query).
  const [search, setSearch] = useState("")
  // Multi-select — lifted up from TemplatesTable so FAB can be rendered here.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Pipeline — produces filtered/sorted/grouped templates per viewState.
  // Note: useTemplatesView reads from the global searchQuery store; we
  // bypass that here and provide a local search box, mirroring the legacy
  // templates-view UX. To keep the pipeline working with our local search,
  // we override the store search by writing it back as a noop and instead
  // filter manually below. Simpler: just compose locally on flatTemplates.
  const { groups, flatTemplates, totalCount, viewState, updateViewState } = useTemplatesView("templates")

  const selectedTemplate = useMemo(
    () => (selectedTemplateId ? allTemplates.find((t) => t.id === selectedTemplateId) ?? null : null),
    [selectedTemplateId, allTemplates],
  )

  // Local search overlay — hide rows that don't match the search box. Kept
  // independent from the pipeline's searchQuery so typing in the templates
  // search doesn't bleed into Notes / Wiki search state.
  const searchedFlat = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return flatTemplates
    return flatTemplates.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q),
    )
  }, [flatTemplates, search])

  // Re-apply search to grouped output too (drop empty groups when grouping).
  const searchedGroups = useMemo(() => {
    if (!search.trim()) return groups
    const allowed = new Set(searchedFlat.map((t) => t.id))
    return groups
      .map((g) => ({ ...g, templates: g.templates.filter((t) => allowed.has(t.id)) }))
      .filter((g) => g.templates.length > 0)
  }, [groups, searchedFlat, search])

  // Alphabetical Index toggle — same pattern as notes-table.tsx.
  // When enabled, overrides groupBy and re-groups the flat list by first letter.
  const showAlphaIndex = viewState.toggles?.showAlphaIndex ?? false
  const onToggleAlphaIndex = useCallback(() => {
    const next = !showAlphaIndex
    updateViewState({ toggles: { ...(viewState.toggles ?? {}), showAlphaIndex: next } })
  }, [showAlphaIndex, viewState.toggles, updateViewState])

  const displayGroups = useMemo(() => {
    if (!showAlphaIndex) return searchedGroups
    const allFlat = searchedFlat
    const map = groupByInitial(allFlat, (t) => t.name || "Untitled")
    return Array.from(map.entries()).map(([key, templates]) => ({ key, label: key, templates }))
  }, [showAlphaIndex, searchedGroups, searchedFlat])

  // Hydrate runtime filter values (label / folder / tags) — TEMPLATES_VIEW_CONFIG
  // declares empty `values: []` for these and we fill them from the store.
  const filterCategories = useMemo(() => {
    return TEMPLATES_VIEW_CONFIG.filterCategories.map((cat) => {
      if (cat.key === "label") {
        return {
          ...cat,
          values: labels
            .filter((l) => !l.trashed)
            .map((l) => ({
              key: l.id,
              label: l.name,
              color: l.color,
              count: allTemplates.filter((t) => !t.trashed && t.labelId === l.id).length,
            })),
        }
      }
      if (cat.key === "folder") {
        return {
          ...cat,
          values: folders.map((f) => ({
            key: f.id,
            label: f.name,
            color: f.color,
            count: allTemplates.filter((t) => !t.trashed && t.folderId === f.id).length,
          })),
        }
      }
      if (cat.key === "tags") {
        return {
          ...cat,
          values: tags
            .filter((t) => !t.trashed)
            .map((tag) => ({
              key: tag.id,
              label: tag.name,
              color: tag.color,
              count: allTemplates.filter((t) => !t.trashed && t.tags.includes(tag.id)).length,
            })),
        }
      }
      return cat
    })
  }, [labels, folders, tags, allTemplates])

  // FilterPanel handlers
  const handleFilterToggle = useCallback((rule: FilterRule) => {
    const exists = viewState.filters.some(
      (f) => f.field === rule.field && f.value === rule.value,
    )
    const next = exists
      ? viewState.filters.filter((f) => !(f.field === rule.field && f.value === rule.value))
      : [...viewState.filters, rule]
    updateViewState({ filters: next })
  }, [viewState.filters, updateViewState])

  // If selected template gets deleted, clear selection so we don't render
  // a ghost <TemplateEditPage>.
  useEffect(() => {
    if (selectedTemplateId && !allTemplates.find((t) => t.id === selectedTemplateId)) {
      setSelectedTemplateId(null)
    }
  }, [allTemplates, selectedTemplateId])

  // Sync side panel context when the active template changes — same pattern
  // as the b1 wiring; opens the panel automatically the first time per session.
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

  /* ── Handlers ──────────────────────────────────────── */

  const handleCreateSubmit = (data: TemplateFormData) => {
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
  }

  const handleUseTemplate = (templateId: string) => {
    const noteId = createNoteFromTemplate(templateId)
    if (noteId) openNote(noteId)
  }

  const handleDelete = (id: string) => {
    deleteTemplate(id)
    if (selectedTemplateId === id) {
      setSelectedTemplateId(null)
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  /* ── Edit page mode ─────────────────────────────────── */

  if (selectedTemplate) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Compact back-bar — keeps the user oriented + provides a one-click
            return to the list/grid. */}
        <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-2 shrink-0">
          <button
            onClick={() => setSelectedTemplateId(null)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-2xs text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
          >
            <ArrowLeft size={12} weight="regular" />
            Templates
          </button>
          <span className="text-2xs text-muted-foreground/60">/</span>
          <span className="text-2xs font-medium text-foreground truncate">
            {selectedTemplate.name || "Untitled template"}
          </span>
        </div>
        <TemplateEditPage key={selectedTemplate.id} template={selectedTemplate} />
      </div>
    )
  }

  /* ── List / Grid mode ───────────────────────────────── */

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<Layout size={20} weight="regular" />}
        title="Templates"
        count={totalCount}
        searchPlaceholder="Search templates..."
        searchValue={search}
        onSearchChange={setSearch}
        showFilter={TEMPLATES_VIEW_CONFIG.showFilter}
        hasActiveFilters={viewState.filters.length > 0}
        filterContent={
          <FilterPanel
            categories={filterCategories}
            activeFilters={viewState.filters}
            onToggle={handleFilterToggle}
            quickFilters={TEMPLATES_VIEW_CONFIG.quickFilters as any}
            onQuickFilter={(rules) => updateViewState({ filters: rules })}
          />
        }
        showDisplay={TEMPLATES_VIEW_CONFIG.showDisplay}
        displayContent={
          <DisplayPanel
            config={TEMPLATES_VIEW_CONFIG.displayConfig}
            viewState={viewState}
            onViewStateChange={updateViewState}
            toggleStates={viewState.toggles ?? {}}
            onToggleChange={(key, value) =>
              updateViewState({ toggles: { ...(viewState.toggles ?? {}), [key]: value } })
            }
            showViewMode={true}
          />
        }
        showDetailPanel={TEMPLATES_VIEW_CONFIG.showDetailPanel}
        detailPanelOpen={sidePanelOpen}
        onDetailPanelToggle={() => {
          const store = usePlotStore.getState()
          if (!store.sidePanelOpen) {
            store.setSidePanelOpen(true)
            usePlotStore.setState({ sidePanelMode: 'detail' })
          } else if (store.sidePanelMode === 'detail') {
            store.setSidePanelOpen(false)
          } else {
            usePlotStore.setState({ sidePanelMode: 'detail' })
          }
        }}
        onCreateNew={() => setShowCreateDialog(true)}
      />

      {/* Body — list (table) or grid (cards). When list-mode is selected
          AND no templates exist at all (not just the filtered slice), show
          the "no templates yet" hero. Otherwise the table/grid handle the
          empty-filtered case themselves. */}
      {allTemplates.filter((t) => !t.trashed).length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center h-48 gap-2 px-4">
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
      ) : viewState.viewMode !== "grid" ? (
        <TemplatesTable
          groups={displayGroups}
          flatTemplates={searchedFlat}
          groupBy={showAlphaIndex ? "none" : viewState.groupBy}
          visibleColumns={viewState.visibleColumns}
          selectedTemplateId={selectedTemplateId}
          onSelect={(id) => setSelectedTemplateId(id)}
          onUseTemplate={handleUseTemplate}
          onDelete={handleDelete}
          onTogglePin={toggleTemplatePin}
          onCreateNew={() => setShowCreateDialog(true)}
          showAlphaIndex={showAlphaIndex}
          onToggleAlphaIndex={onToggleAlphaIndex}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {searchedFlat.map((tmpl) => (
              <TemplateCard
                key={tmpl.id}
                tmpl={tmpl}
                onSelect={(id) => setSelectedTemplateId(id)}
                onUse={handleUseTemplate}
                onEdit={(id) => setSelectedTemplateId(id)}
                onPin={toggleTemplatePin}
                onDelete={handleDelete}
              />
            ))}
          </div>
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

      {selectedIds.size > 0 && (
        <TemplatesFloatingActionBar
          selectedIds={selectedIds}
          templates={allTemplates}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  )
}
