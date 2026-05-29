"use client"

/**
 * SmartBookPresetsView — gallery of reusable Smart Book blueprints.
 *
 * "Smart Book" is the Books-space analog of Templates: each preset is a saved
 * set of AutoSource combinations. "Apply" spawns a brand-new Smart Book seeded
 * with the preset's sources (via `applySmartBookPreset`, which reuses the
 * existing books engine — createBook + updateBook) and navigates to it.
 *
 * Mirrors `templates-view.tsx` (card grid + create/edit dialog + empty state)
 * for cross-entity structural consistency. The source picker reuses the same
 * candidate-building + resolved-entry display logic as
 * `components/books/sources-section.tsx`, but operates on a local
 * `AutoSource[]` value (no bookId coupling) so it can edit a blueprint that
 * isn't a book yet.
 *
 * Spec: `docs/01-plan/features/smart-book-preset.plan.md` §4.
 */

import { useState, useMemo, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { setActiveRoute } from "@/lib/table-route"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { shortRelative } from "@/lib/format-utils"
import type { AutoSource, AutoSourceKind, SmartBookPreset } from "@/lib/types"
import { ViewHeader } from "@/components/view-header"
import { IconSmartBook } from "@/components/plot-icons"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Plus as PhPlus,
  Trash2 as Trash,
  Pin as PushPin,
  PinOff as PushPinSlash,
  X as PhX,
  Pencil as PencilSimple,
  Folder as PhFolder,
  BookOpen as PhBookOpen,
  Hash as PhHash,
  Sticker as PhSticker,
  Sparkles as Sparkle,
  PlayCircle as PlayIcon,
} from "lucide-react"

/* ── Source picker (standalone — operates on AutoSource[] value) ───────── */

type SourceTabKey = AutoSourceKind

/**
 * Inline source picker that edits a local `AutoSource[]` without a bookId.
 * Reuses the same per-kind candidate logic + dedup guard semantics as
 * sources-section's picker, but emits onChange instead of mutating a book.
 */
function SourcePicker({
  value,
  onChange,
}: {
  value: AutoSource[]
  onChange: (next: AutoSource[]) => void
}) {
  const folders = usePlotStore((s) => s.folders)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const stickers = usePlotStore((s) => s.stickers)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<SourceTabKey>("folder")
  const [search, setSearch] = useState("")

  const q = search.toLowerCase().trim()
  const matches = (name: string) => !q || name.toLowerCase().includes(q)

  // O(1) "already added" guard scoped per kind (mirrors sources-section).
  const existingByKind = useMemo(() => {
    const map: Record<AutoSourceKind, Set<string>> = {
      folder: new Set(),
      category: new Set(),
      tag: new Set(),
      label: new Set(),
      sticker: new Set(),
    }
    for (const s of value) map[s.kind].add(s.refId)
    return map
  }, [value])

  const folderCandidates = useMemo(
    () =>
      folders
        .filter((f) => f.kind === "note" && !existingByKind.folder.has(f.id) && matches(f.name))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [folders, existingByKind.folder, q],
  )
  const categoryCandidates = useMemo(
    () =>
      wikiCategories
        .filter((c) => !existingByKind.category.has(c.id) && matches(c.name))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [wikiCategories, existingByKind.category, q],
  )
  const tagCandidates = useMemo(
    () =>
      tags
        .filter((t) => !t.trashed && !existingByKind.tag.has(t.id) && matches(t.name))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [tags, existingByKind.tag, q],
  )
  const labelCandidates = useMemo(
    () =>
      labels
        .filter((l) => !l.trashed && !existingByKind.label.has(l.id) && matches(l.name))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [labels, existingByKind.label, q],
  )
  const stickerCandidates = useMemo(
    () =>
      (stickers ?? [])
        .filter((s) => !s.trashed && !existingByKind.sticker.has(s.id) && matches(s.name))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [stickers, existingByKind.sticker, q],
  )

  const add = (kind: AutoSourceKind, refId: string) => {
    if (value.some((s) => s.kind === kind && s.refId === refId)) return
    onChange([...value, { kind, refId }])
    setSearch("")
  }
  const remove = (kind: AutoSourceKind, refId: string) => {
    onChange(value.filter((s) => !(s.kind === kind && s.refId === refId)))
  }

  // Resolve display name + icon for current sources (skip stale refs).
  type Resolved = { kind: AutoSourceKind; refId: string; name: string; icon: ReactNode }
  const resolved = useMemo<Resolved[]>(() => {
    const out: Resolved[] = []
    for (const s of value) {
      if (s.kind === "folder") {
        const f = folders.find((f) => f.id === s.refId)
        if (f) out.push({ ...s, name: f.name, icon: <PhFolder size={13} strokeWidth={2} className="text-muted-foreground" /> })
      } else if (s.kind === "category") {
        const c = wikiCategories.find((c) => c.id === s.refId)
        if (c) out.push({ ...s, name: c.name, icon: <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} /> })
      } else if (s.kind === "tag") {
        const t = tags.find((t) => t.id === s.refId)
        if (t) out.push({ ...s, name: t.name, icon: <PhHash size={13} strokeWidth={2} style={{ color: t.color ?? undefined }} className={t.color ? "" : "text-muted-foreground"} /> })
      } else if (s.kind === "label") {
        const l = labels.find((l) => l.id === s.refId)
        if (l) out.push({ ...s, name: l.name, icon: <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: l.color }} /> })
      } else if (s.kind === "sticker") {
        const st = stickers?.find((st) => st.id === s.refId)
        if (st) out.push({ ...s, name: st.name, icon: <PhSticker size={13} strokeWidth={2} style={{ color: st.color }} /> })
      }
    }
    return out
  }, [value, folders, wikiCategories, tags, labels, stickers])

  const t = useT()

  return (
    <div className="rounded-md border border-border bg-background/40">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkle size={12} strokeWidth={2} />
          {t("smartBook.preset.sources")}
        </span>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
        >
          <PhPlus size={12} strokeWidth={2.5} />
          {t("smartBook.preset.addSource")}
        </button>
      </div>

      {resolved.length === 0 ? (
        <div className="px-3 pb-2.5 pt-0 text-2xs text-muted-foreground/70">
          {t("smartBook.preset.sources.empty")}
        </div>
      ) : (
        <ul className="divide-y divide-border/30 border-t border-border/30">
          {resolved.map((e) => (
            <li
              key={`${e.kind}-${e.refId}`}
              className="group flex items-center gap-2 px-3 py-1.5 text-note transition-colors hover:bg-hover-bg/40"
            >
              {e.icon}
              <span className="flex-1 truncate text-foreground">{e.name}</span>
              <span className="text-2xs uppercase tracking-wide text-muted-foreground/50">{e.kind}</span>
              <button
                type="button"
                onClick={() => remove(e.kind, e.refId)}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove ${e.name}`}
              >
                <PhX size={12} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Picker dialog — 5 source kinds (mirrors sources-section). */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-lg gap-0 p-0">
          <DialogHeader className="px-4 pb-2 pt-4">
            <DialogTitle className="text-sm">{t("smartBook.preset.addSource")}</DialogTitle>
            <DialogDescription className="text-2xs">
              {t("smartBook.preset.picker.desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="border-b border-border/40 px-4 py-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("smartBook.preset.picker.search")}
              className="w-full bg-transparent text-note text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              autoFocus
            />
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SourceTabKey)} className="gap-0">
            <TabsList className="mx-4 mt-1 grid grid-cols-5 gap-0.5">
              <TabsTrigger value="folder"><PhFolder size={12} strokeWidth={2} /></TabsTrigger>
              <TabsTrigger value="category"><PhBookOpen size={12} strokeWidth={2} /></TabsTrigger>
              <TabsTrigger value="tag"><PhHash size={12} strokeWidth={2} /></TabsTrigger>
              <TabsTrigger value="label"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" /></TabsTrigger>
              <TabsTrigger value="sticker"><PhSticker size={12} strokeWidth={2} /></TabsTrigger>
            </TabsList>

            <TabsContent value="folder" className="mt-0">
              <Command shouldFilter={false}>
                <CommandList className="max-h-64">
                  <CommandEmpty>No matching folders</CommandEmpty>
                  <CommandGroup>
                    {folderCandidates.map((f) => (
                      <CommandItem key={f.id} value={f.id} onSelect={() => add("folder", f.id)} className="flex cursor-pointer items-center gap-2">
                        <PhFolder size={14} strokeWidth={2} className="text-muted-foreground" />
                        <span className="flex-1 truncate">{f.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>

            <TabsContent value="category" className="mt-0">
              <Command shouldFilter={false}>
                <CommandList className="max-h-64">
                  <CommandEmpty>No matching categories</CommandEmpty>
                  <CommandGroup>
                    {categoryCandidates.map((c) => (
                      <CommandItem key={c.id} value={c.id} onSelect={() => add("category", c.id)} className="flex cursor-pointer items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="flex-1 truncate">{c.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>

            <TabsContent value="tag" className="mt-0">
              <Command shouldFilter={false}>
                <CommandList className="max-h-64">
                  <CommandEmpty>No matching tags</CommandEmpty>
                  <CommandGroup>
                    {tagCandidates.map((tag) => (
                      <CommandItem key={tag.id} value={tag.id} onSelect={() => add("tag", tag.id)} className="flex cursor-pointer items-center gap-2">
                        <PhHash size={14} strokeWidth={2} style={{ color: tag.color ?? undefined }} className={tag.color ? "" : "text-muted-foreground"} />
                        <span className="flex-1 truncate">{tag.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>

            <TabsContent value="label" className="mt-0">
              <Command shouldFilter={false}>
                <CommandList className="max-h-64">
                  <CommandEmpty>No matching labels</CommandEmpty>
                  <CommandGroup>
                    {labelCandidates.map((l) => (
                      <CommandItem key={l.id} value={l.id} onSelect={() => add("label", l.id)} className="flex cursor-pointer items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                        <span className="flex-1 truncate">{l.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>

            <TabsContent value="sticker" className="mt-0">
              <Command shouldFilter={false}>
                <CommandList className="max-h-64">
                  <CommandEmpty>No matching stickers</CommandEmpty>
                  <CommandGroup>
                    {stickerCandidates.map((st) => (
                      <CommandItem key={st.id} value={st.id} onSelect={() => add("sticker", st.id)} className="flex cursor-pointer items-center gap-2">
                        <PhSticker size={14} strokeWidth={2} style={{ color: st.color }} />
                        <span className="flex-1 truncate">{st.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── Create / Edit dialog ──────────────────────────────────────────────── */

interface PresetFormData {
  name: string
  description: string
  sources: AutoSource[]
}

function PresetFormDialog({
  open,
  initial,
  title,
  onSubmit,
  onCancel,
}: {
  open: boolean
  initial: PresetFormData
  title: string
  onSubmit: (data: PresetFormData) => void
  onCancel: () => void
}) {
  const t = useT()
  const [form, setForm] = useState<PresetFormData>(initial)

  // Re-sync when a different preset is opened for edit.
  useEffect(() => {
    if (open) setForm(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial.name, initial.description])

  const handleSubmit = () => {
    if (!form.name.trim()) return
    onSubmit({ ...form, name: form.name.trim() })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("smartBook.preset.dialog.desc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-note font-medium text-muted-foreground mb-1.5">
              {t("smartBook.preset.field.name")}
            </label>
            <input
              autoFocus
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={t("smartBook.preset.field.name.placeholder")}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-note text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-note font-medium text-muted-foreground mb-1.5">
              {t("smartBook.preset.field.description")}
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={t("smartBook.preset.field.description.placeholder")}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-note text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <SourcePicker value={form.sources} onChange={(sources) => setForm((f) => ({ ...f, sources }))} />
        </div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!form.name.trim()}
            className="rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.save")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Preset card ───────────────────────────────────────────────────────── */

function PresetCard({
  preset,
  onApply,
  onEdit,
  onPin,
  onDelete,
}: {
  preset: SmartBookPreset
  onApply: (id: string) => void
  onEdit: (id: string) => void
  onPin: (id: string) => void
  onDelete: (id: string) => void
}) {
  const t = useT()
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onClick={() => onApply(preset.id)}
          className="group relative flex flex-col rounded-lg border border-border bg-card hover:bg-hover-bg transition-colors cursor-pointer overflow-hidden"
        >
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/40 text-muted-foreground">
                <IconSmartBook size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-note font-semibold text-foreground truncate">{preset.name}</span>
                  {preset.pinned && <PushPin className="text-accent shrink-0" size={12} strokeWidth={2} />}
                </div>
                {preset.description && (
                  <p className="text-2xs text-muted-foreground/80 line-clamp-2 mt-0.5">{preset.description}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {preset.sources.length === 0 ? (
                <span className="text-2xs text-muted-foreground/60 italic">{t("smartBook.preset.noSources")}</span>
              ) : (
                <span className="text-2xs text-muted-foreground/70">
                  {t("smartBook.preset.sourceCount").replace("{count}", String(preset.sources.length))}
                </span>
              )}
              <span className="ml-auto text-2xs text-muted-foreground/60" title={`Updated ${new Date(preset.updatedAt).toLocaleString()}`}>
                {shortRelative(preset.updatedAt)}
              </span>
            </div>
          </div>

          {/* Hover quick actions */}
          <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(preset.id) }}
              className="flex items-center justify-center h-6 w-6 rounded-md bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
              title={t("common.edit")}
            >
              <PencilSimple size={14} strokeWidth={2} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(preset.id) }}
              className="flex items-center justify-center h-6 w-6 rounded-md bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-red-400 hover:bg-hover-bg transition-colors"
              title={t("common.delete")}
            >
              <Trash size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem className="text-note" onClick={() => onApply(preset.id)}>
          <PlayIcon className="mr-2 text-accent" size={16} strokeWidth={2} />
          {t("smartBook.preset.apply")}
        </ContextMenuItem>
        <ContextMenuItem className="text-note" onClick={() => onEdit(preset.id)}>
          <PencilSimple className="mr-2 text-muted-foreground" size={16} strokeWidth={2} />
          {t("common.edit")}
        </ContextMenuItem>
        <ContextMenuItem className="text-note" onClick={() => onPin(preset.id)}>
          {preset.pinned ? (
            <><PushPinSlash className="mr-2 text-muted-foreground" size={16} strokeWidth={2} />{t("common.unpin")}</>
          ) : (
            <><PushPin className="mr-2 text-accent" size={16} strokeWidth={2} />{t("common.pin")}</>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onDelete(preset.id)} className="text-red-400 focus:text-red-400">
          <Trash className="mr-2" size={16} strokeWidth={2} />
          {t("common.delete")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/* ── View ──────────────────────────────────────────────────────────────── */

const EMPTY_FORM: PresetFormData = { name: "", description: "", sources: [] }

export function SmartBookPresetsView() {
  const t = useT()
  const router = useRouter()
  const presets = usePlotStore((s) => s.smartBookPresets) as SmartBookPreset[]
  const createSmartBookPreset = usePlotStore((s) => s.createSmartBookPreset)
  const updateSmartBookPreset = usePlotStore((s) => s.updateSmartBookPreset)
  const deleteSmartBookPreset = usePlotStore((s) => s.deleteSmartBookPreset)
  const toggleSmartBookPresetPin = usePlotStore((s) => s.toggleSmartBookPresetPin)
  const applySmartBookPreset = usePlotStore((s) => s.applySmartBookPreset)

  const [search, setSearch] = useState("")
  const [dialogMode, setDialogMode] = useState<null | { type: "create" } | { type: "edit"; id: string }>(null)

  // Live (non-trashed) presets, pinned-first then most-recent.
  const livePresets = useMemo(
    () =>
      presets
        .filter((p) => !p.trashed)
        .filter((p) => {
          const q = search.trim().toLowerCase()
          if (!q) return true
          return (
            p.name.toLowerCase().includes(q) ||
            (p.description?.toLowerCase().includes(q) ?? false)
          )
        })
        .sort((a, b) => {
          if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
          return b.updatedAt.localeCompare(a.updatedAt)
        }),
    [presets, search],
  )

  const liveCount = useMemo(() => presets.filter((p) => !p.trashed).length, [presets])

  const editingPreset = useMemo(
    () => (dialogMode?.type === "edit" ? presets.find((p) => p.id === dialogMode.id) ?? null : null),
    [dialogMode, presets],
  )

  const handleApply = (presetId: string) => {
    const newId = applySmartBookPreset(presetId)
    if (!newId) {
      toast.error(t("smartBook.preset.applyFailed"))
      return
    }
    const preset = presets.find((p) => p.id === presetId)
    // Open the new book — mirror BooksView.openBook (sidebar context + nav).
    usePlotStore.setState({
      sidePanelContext: { type: "book", id: newId },
      sidePanelOpen: true,
    })
    toast.success(t("smartBook.preset.applied").replace("{name}", preset?.name ?? ""))
    const href = `/books/${newId}`
    setActiveRoute(href)
    router.push(href)
  }

  const handleCreateSubmit = (data: PresetFormData) => {
    createSmartBookPreset({ name: data.name, description: data.description || undefined, sources: data.sources })
    setDialogMode(null)
    toast.success(t("smartBook.preset.created").replace("{name}", data.name))
  }

  const handleEditSubmit = (data: PresetFormData) => {
    if (dialogMode?.type !== "edit") return
    updateSmartBookPreset(dialogMode.id, {
      name: data.name,
      description: data.description || undefined,
      sources: data.sources,
    })
    setDialogMode(null)
    toast.success(t("smartBook.preset.updated"))
  }

  const handleDelete = (id: string) => {
    const preset = presets.find((p) => p.id === id)
    deleteSmartBookPreset(id)
    toast.success(t("smartBook.preset.deleted").replace("{name}", preset?.name ?? ""))
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<IconSmartBook size={20} />}
        title={t("sidebar.smartBook")}
        count={liveCount > 0 ? liveCount : undefined}
        searchPlaceholder={t("smartBook.preset.search")}
        searchValue={search}
        onSearchChange={setSearch}
        onCreateNew={() => setDialogMode({ type: "create" })}
      />

      <div className="flex-1 overflow-y-auto">
        {liveCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pt-20">
            <IconSmartBook size={32} className="text-muted-foreground/25" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{t("smartBook.preset.empty.title")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("smartBook.preset.empty.desc")}</p>
            </div>
            <button
              type="button"
              onClick={() => setDialogMode({ type: "create" })}
              className="mt-1 flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              <PhPlus size={12} strokeWidth={2} />
              {t("smartBook.preset.new")}
            </button>
          </div>
        ) : (
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6")}>
            {livePresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onApply={handleApply}
                onEdit={(id) => setDialogMode({ type: "edit", id })}
                onPin={toggleSmartBookPresetPin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <PresetFormDialog
        open={dialogMode?.type === "create"}
        initial={EMPTY_FORM}
        title={t("smartBook.preset.new")}
        onSubmit={handleCreateSubmit}
        onCancel={() => setDialogMode(null)}
      />

      {/* Edit dialog */}
      <PresetFormDialog
        open={dialogMode?.type === "edit" && !!editingPreset}
        initial={
          editingPreset
            ? { name: editingPreset.name, description: editingPreset.description ?? "", sources: editingPreset.sources }
            : EMPTY_FORM
        }
        title={t("smartBook.preset.edit")}
        onSubmit={handleEditSubmit}
        onCancel={() => setDialogMode(null)}
      />
    </div>
  )
}
