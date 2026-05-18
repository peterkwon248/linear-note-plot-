"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { usePlotStore } from "@/lib/store"
import type { WikiInfoboxEntry, WikiInfoboxPreset } from "@/lib/types"
import { cn } from "@/lib/utils"
import { InfoboxValueRenderer } from "./infobox-value-renderer"
import {
  Plus as PhPlus,
  X as PhX,
  PencilSimple,
  Check as PhCheck,
  PaintBucket,
  CaretDown,
  CaretRight,
  DotsSixVertical,
} from "@/lib/editor/editor-icons"
import {
  INFOBOX_PRESETS,
  clonePresetEntries,
  countPreservableValues,
  getPresetDefinition,
  mergePresetWithExisting,
} from "@/lib/wiki-infobox-presets"
import { useInfoboxGroupCollapsed } from "@/lib/wiki-infobox-collapse"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { InfoboxColorPicker } from "./infobox-color-picker"
import { useTintedBg, useTintedText } from "@/lib/tinted-bg"

// ── Props ─────────────────────────────────────────────────────────────────────
//
// `kind` (PR1) routes the entries setter:
//   - "note"  → setWikiInfobox (Note-level)            ← legacy default
//   - "wiki"  → setWikiArticleInfobox (WikiArticle)    ← fixes silent-fail bug
//
// `preset` + `onPresetChange` enable the dropdown. When omitted the dropdown
// is hidden (notes don't use presets in this PR — wiki-only feature).
//
interface WikiInfoboxProps {
  /** ID of the entity owning this infobox (note id OR article id, see `kind`). */
  noteId: string
  entries: WikiInfoboxEntry[]
  editable?: boolean
  className?: string
  /** Tier 1-2: Header background color (null/undefined = default bg-secondary/30). */
  headerColor?: string | null
  /** Tier 1-2: Callback when header color changes. If omitted, the color picker is hidden. */
  onHeaderColorChange?: (color: string | null) => void
  /**
   * PR1: which entity owns this infobox. Defaults to "note" for backward
   * compatibility (existing call sites in note-editor.tsx).
   */
  kind?: "note" | "wiki"
  /** PR1: domain preset (wiki-only). When omitted, the dropdown is hidden. */
  preset?: WikiInfoboxPreset
  /**
   * PR1: callback when the user picks a preset. Receives the new preset and
   * the cloned seed entries — caller persists both atomically.
   */
  onPresetChange?: (preset: WikiInfoboxPreset, seedEntries: WikiInfoboxEntry[]) => void
  /**
   * PR-A B1 — fires when the infobox toggles between read and edit mode. Lets
   * the parent layout widen the infobox panel during edits ("gentle by default,
   * powerful when needed") so the header's ✓/X buttons don't get clipped by
   * the narrow default rail width.
   */
  onEditingChange?: (editing: boolean) => void
}

// ── SortableWrapper: drag-handle + transform style ──────────────────────────
//
// One generic wrapper for all three row types (field / section / group-header)
// so we don't have to duplicate the useSortable wiring three times. Grip lives
// on the left, children take the rest of the row.

function SortableWrapper({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing p-1 mt-0.5 text-muted-foreground/40 hover:text-foreground transition-colors"
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        <DotsSixVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

// ── Editable entry: WikiInfoboxEntry + ephemeral _id ────────────────────────
//
// Drag-and-drop needs a stable identity per row that survives reorders +
// value edits. We attach an _id when entering edit mode and strip it on save.
// _id never crosses the persistence boundary.

type EditableEntry = WikiInfoboxEntry & { _id: string }

function makeId(): string {
  return `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function withId(entry: WikiInfoboxEntry): EditableEntry {
  return { ...entry, _id: makeId() }
}

function stripId(entry: EditableEntry): WikiInfoboxEntry {
  const { _id, ...rest } = entry
  return rest
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns true if `entries` exactly match `presetKey`'s default seed (by key
 * + type + group-header order). Used to detect "untouched preset" state so we
 * can swap presets without prompting.
 */
function entriesMatchPresetSeed(
  entries: WikiInfoboxEntry[],
  presetKey: WikiInfoboxPreset,
): boolean {
  const seed = getPresetDefinition(presetKey).defaultEntries
  if (entries.length !== seed.length) return false
  for (let i = 0; i < entries.length; i++) {
    const a = entries[i]
    const b = seed[i]
    if ((a.type ?? "field") !== (b.type ?? "field")) return false
    if (a.key !== b.key) return false
    // Allow value to be empty OR equal seed value — seeds always have empty values.
    if (a.type !== "group-header" && (a.value ?? "") !== "") return false
  }
  return true
}

/** True if any entry has a non-empty value or non-default key. Used as "user has data" check. */
function hasUserData(entries: WikiInfoboxEntry[]): boolean {
  if (entries.length === 0) return false
  for (const e of entries) {
    if (e.type === "group-header") continue
    if ((e.value ?? "").trim() !== "") return true
  }
  return false
}

// ── Group computation ─────────────────────────────────────────────────────────
//
// Walks entries left→right and assigns each entry a "groupKey":
//   - entries before the first group-header → groupKey = "" (always visible)
//   - entries after group-header X (until the next group-header) → groupKey = X.key
// Returns the same shape but augmented with groupKey + a parallel array of
// {groupKey, headerEntry, headerIndex} for headers.
//
interface AnalyzedEntry {
  entry: WikiInfoboxEntry
  index: number
  groupKey: string  // "" = no group (top-level)
}

function analyzeGroups(entries: WikiInfoboxEntry[]): AnalyzedEntry[] {
  const out: AnalyzedEntry[] = []
  let currentGroup = ""
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    if (e.type === "group-header") {
      currentGroup = e.key || `group-${i}`
      // The header itself is not part of any group's body — it owns the group.
      out.push({ entry: e, index: i, groupKey: currentGroup })
    } else {
      out.push({ entry: e, index: i, groupKey: currentGroup })
    }
  }
  return out
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WikiInfobox({
  noteId,
  entries,
  editable = false,
  className,
  headerColor = null,
  onHeaderColorChange,
  kind = "note",
  preset,
  onPresetChange,
  onEditingChange,
}: WikiInfoboxProps) {
  const setWikiInfoboxNote = usePlotStore((s) => s.setWikiInfobox)
  const setWikiArticleInfobox = usePlotStore((s) => s.setWikiArticleInfobox)
  const [isEditing, setIsEditing] = useState(false)
  // PR-A — ephemeral _id keeps dnd-kit's stable identity across reorders while
  // we mutate field values (handleChange creates new entry objects, so we can't
  // rely on object reference identity). _id is stripped before persisting.
  const [localEntries, setLocalEntries] = useState<EditableEntry[]>(() =>
    entries.map((e) => withId(e)),
  )
  const [showColorPicker, setShowColorPicker] = useState(false)
  const renderedHeaderColor = useTintedBg(headerColor)
  const headerTextColor = useTintedText(headerColor)
  const [showPresetDropdown, setShowPresetDropdown] = useState(false)
  const [pendingPreset, setPendingPreset] = useState<WikiInfoboxPreset | null>(null)

  const canChangeColor = editable && typeof onHeaderColorChange === "function"
  const canChangePreset = editable && typeof onPresetChange === "function"
  const currentPreset: WikiInfoboxPreset = preset ?? "custom"
  const presetDef = useMemo(() => getPresetDefinition(currentPreset), [currentPreset])

  // Save routes by `kind` — wiki articles can't use the note setter, and vice versa.
  const persistEntries = useCallback(
    (next: WikiInfoboxEntry[]) => {
      if (kind === "wiki") setWikiArticleInfobox(noteId, next)
      else setWikiInfoboxNote(noteId, next)
    },
    [kind, noteId, setWikiArticleInfobox, setWikiInfoboxNote],
  )

  const handleStartEdit = useCallback(() => {
    setLocalEntries(entries.map((e) => withId(e)))
    setIsEditing(true)
  }, [entries])

  const handleSave = useCallback(() => {
    // group-header rows keep value="" and don't need key trim filter
    const cleaned = localEntries
      .filter((e) => {
        if (e.type === "group-header") return (e.key ?? "").trim() !== ""
        return e.key.trim() !== ""
      })
      .map(stripId)
    persistEntries(cleaned)
    setIsEditing(false)
  }, [persistEntries, localEntries])

  const handleCancel = useCallback(() => {
    setLocalEntries(entries.map((e) => withId(e)))
    setIsEditing(false)
  }, [entries])

  // PR-A — position param lets inline group-aware "+ Add field" buttons
  // insert at a specific spot. Footer Add field (no arg) still pushes to the end.
  const handleAdd = useCallback((position?: number) => {
    setLocalEntries((prev) => {
      const newField: EditableEntry = { key: "", value: "", type: "field", _id: makeId() }
      if (position === undefined || position >= prev.length) return [...prev, newField]
      return [...prev.slice(0, position), newField, ...prev.slice(position)]
    })
  }, [])

  const handleAddSection = useCallback(() => {
    setLocalEntries((prev) => [...prev, { key: "", value: "", type: "section", _id: makeId() }])
  }, [])

  const handleAddGroupHeader = useCallback(() => {
    setLocalEntries((prev) => [
      ...prev,
      { key: "", value: "", type: "group-header", color: null, defaultCollapsed: false, _id: makeId() },
    ])
  }, [])

  // PR-A — dnd-kit drag-to-reorder. PointerSensor with a small activation
  // distance lets click-to-edit on row inputs still work without triggering a
  // drag accidentally.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setLocalEntries((prev) => {
      const oldIndex = prev.findIndex((e) => e._id === active.id)
      const newIndex = prev.findIndex((e) => e._id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const handleRemove = useCallback((index: number) => {
    setLocalEntries((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleChange = useCallback(
    (index: number, field: "key" | "value", val: string) => {
      setLocalEntries((prev) =>
        prev.map((entry, i) => (i === index ? { ...entry, [field]: val } : entry)),
      )
    },
    [],
  )

  const handleGroupColorChange = useCallback((index: number, color: string | null) => {
    setLocalEntries((prev) =>
      prev.map((entry, i) =>
        i === index && entry.type === "group-header" ? { ...entry, color } : entry,
      ),
    )
  }, [])

  const handleGroupDefaultCollapsedToggle = useCallback((index: number) => {
    setLocalEntries((prev) =>
      prev.map((entry, i) =>
        i === index && entry.type === "group-header"
          ? { ...entry, defaultCollapsed: !(entry.defaultCollapsed ?? false) }
          : entry,
      ),
    )
  }, [])

  // Preset selection — confirm modal if user has data, otherwise instant swap.
  const requestPresetSwap = useCallback(
    (next: WikiInfoboxPreset) => {
      if (!canChangePreset) return
      setShowPresetDropdown(false)
      if (next === currentPreset) return

      const userEdited = hasUserData(entries) || !entriesMatchPresetSeed(entries, currentPreset)
      if (entries.length === 0 || !userEdited) {
        // Safe to swap immediately
        const seed = clonePresetEntries(next)
        onPresetChange?.(next, seed)
      } else {
        setPendingPreset(next)
      }
    },
    [canChangePreset, currentPreset, entries, onPresetChange],
  )

  const confirmPresetSwap = useCallback(() => {
    if (!pendingPreset) return
    const seed = clonePresetEntries(pendingPreset)
    onPresetChange?.(pendingPreset, seed)
    setPendingPreset(null)
  }, [pendingPreset, onPresetChange])

  // PR-A — Preserve matching field values when switching presets. Keys present
  // in both old + new preset keep their value; unmatched keys are dropped;
  // brand-new keys come in empty.
  const preservePresetSwap = useCallback(() => {
    if (!pendingPreset) return
    const merged = mergePresetWithExisting(pendingPreset, entries)
    onPresetChange?.(pendingPreset, merged)
    setPendingPreset(null)
  }, [pendingPreset, entries, onPresetChange])

  const cancelPresetSwap = useCallback(() => setPendingPreset(null), [])

  // PR-A B1 — Notify parent layout when edit mode toggles so it can widen the
  // infobox panel. The "Gentle by default" rail is too narrow for the edit
  // toolbar (✓/X get clipped); the parent expands the panel only while editing
  // and restores it on Save/Cancel.
  useEffect(() => {
    onEditingChange?.(isEditing)
  }, [isEditing, onEditingChange])

  // PR-A — Drives the "N of M preserved" copy in both confirm dialogs.
  const pendingPreserveStats = useMemo(
    () =>
      pendingPreset ? countPreservableValues(pendingPreset, entries) : null,
    [pendingPreset, entries],
  )

  // Nothing to show and not editable
  if (entries.length === 0 && !editable) return null

  // Display mode
  if (!isEditing) {
    if (entries.length === 0 && editable) {
      return (
        <div className={cn("rounded-lg border border-dashed border-border p-3", className)}>
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 text-[calc(0.875em*var(--scale-infobox,1))] text-muted-foreground hover:text-foreground transition-colors"
          >
            <PhPlus size={14} />
            Add infobox
          </button>
          {/* Preset dropdown also exposed when empty so user can pick a starting template */}
          {canChangePreset && (
            <div className="mt-2 border-t border-border-subtle pt-2">
              <PresetDropdown
                current={currentPreset}
                open={showPresetDropdown}
                onToggle={() => setShowPresetDropdown((v) => !v)}
                onPick={requestPresetSwap}
              />
            </div>
          )}
        </div>
      )
    }

    return (
      <>
        <div
          className={cn(
            "group/infobox rounded-lg border border-border bg-card/50 overflow-hidden",
            className,
          )}
        >
          <div
            className={cn(
              "relative flex items-center justify-between border-b border-border px-3 py-2",
              !headerColor && "bg-secondary/30",
            )}
            style={renderedHeaderColor ? { backgroundColor: renderedHeaderColor } : undefined}
          >
            <span
              className={cn(
                "text-[calc(0.75em*var(--scale-infobox,1))] font-semibold uppercase tracking-wider",
                !headerColor && "text-muted-foreground",
              )}
              style={headerColor ? { color: headerTextColor } : undefined}
            >
              {presetDef.preset === "custom" ? "Info" : presetDef.label}
            </span>
            {editable && (
              <div className="flex items-center gap-0.5">
                {canChangePreset && (
                  <PresetDropdown
                    current={currentPreset}
                    open={showPresetDropdown}
                    onToggle={() => setShowPresetDropdown((v) => !v)}
                    onPick={requestPresetSwap}
                    compact
                    inverted={!!headerColor}
                  />
                )}
                {canChangeColor && (
                  <button
                    onClick={() => setShowColorPicker((v) => !v)}
                    title="Header color"
                    className={cn(
                      "rounded p-0.5 transition-colors shrink-0",
                      showColorPicker || headerColor
                        ? headerColor
                          ? "hover:bg-black/10 dark:hover:bg-white/10"
                          : "text-foreground"
                        : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg opacity-0 group-hover/infobox:opacity-100",
                    )}
                    style={headerColor ? { color: headerTextColor } : undefined}
                  >
                    <PaintBucket size={12} />
                  </button>
                )}
                <button
                  onClick={handleStartEdit}
                  className={cn(
                    "rounded p-0.5 transition-colors",
                    headerColor
                      ? "hover:bg-black/10 dark:hover:bg-white/10"
                      : "text-muted-foreground hover:bg-hover-bg hover:text-foreground",
                  )}
                  style={headerColor ? { color: headerTextColor } : undefined}
                  title="Edit infobox"
                >
                  <PencilSimple size={12} />
                </button>
              </div>
            )}

            {canChangeColor && showColorPicker && (
              <div className="absolute right-2 top-[calc(100%+4px)] z-10">
                <InfoboxColorPicker
                  value={headerColor ?? null}
                  onChange={(v) => {
                    onHeaderColorChange?.(v)
                    setShowColorPicker(false)
                  }}
                />
              </div>
            )}
          </div>
          <ReadModeBody
            entries={entries}
            articleId={noteId}
          />
        </div>

        {/* Confirm modal for preset swap */}
        <AlertDialog
          open={pendingPreset !== null}
          onOpenChange={(open) => {
            if (!open) cancelPresetSwap()
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Infobox Preset</AlertDialogTitle>
              <AlertDialogDescription>
                Switch to{" "}
                <span className="font-semibold text-foreground">
                  {pendingPreset ? getPresetDefinition(pendingPreset).label : ""}
                </span>{" "}
                preset.{" "}
                {pendingPreserveStats && pendingPreserveStats.total > 0 ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {pendingPreserveStats.preserved} of {pendingPreserveStats.total}
                    </span>{" "}
                    existing values match this preset&apos;s fields.
                  </>
                ) : (
                  "No existing values to preserve."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelPresetSwap}>Cancel</AlertDialogCancel>
              {pendingPreserveStats && pendingPreserveStats.preserved > 0 && (
                <AlertDialogAction onClick={preservePresetSwap}>
                  Preserve matching ({pendingPreserveStats.preserved})
                </AlertDialogAction>
              )}
              <AlertDialogAction
                onClick={confirmPresetSwap}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Replace all
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  // PR-A — outer wrapper turns into a horizontal scroll container; inner has
  // a min-width so the header (preset / ✓ / X cluster) and entry rows stay
  // legible even when the panel rail is narrower than the natural content
  // (e.g. SmartSidePanel open + Edit mode → infobox rail squeezed). User can
  // scroll right to reach X without re-opening side panels.
  return (
    <>
      <div
        className={cn(
          "rounded-lg border border-primary/30 bg-card/50 overflow-x-auto overflow-y-hidden",
          className,
        )}
      >
        <div className="min-w-[360px]">
        <div
          className={cn(
            "flex items-center justify-between border-b border-border px-3 py-2",
            !headerColor && "bg-secondary/30",
          )}
          style={renderedHeaderColor ? { backgroundColor: renderedHeaderColor } : undefined}
        >
          <span
            className={cn(
              "text-[calc(0.75em*var(--scale-infobox,1))] font-semibold uppercase tracking-wider",
              !headerColor && "text-muted-foreground",
            )}
            style={headerColor ? { color: headerTextColor } : undefined}
          >
            Edit Infobox
          </span>
          <div className="flex items-center gap-1">
            {canChangePreset && (
              <PresetDropdown
                current={currentPreset}
                open={showPresetDropdown}
                onToggle={() => setShowPresetDropdown((v) => !v)}
                onPick={requestPresetSwap}
                compact
                inverted={!!headerColor}
              />
            )}
            <button
              onClick={handleSave}
              className="rounded p-1 text-green-500 hover:bg-green-500/10 transition-colors"
            >
              <PhCheck size={14} />
            </button>
            <button
              onClick={handleCancel}
              className={cn(
                "rounded p-1 transition-colors",
                headerColor
                  ? "hover:bg-black/10 dark:hover:bg-white/10"
                  : "text-muted-foreground hover:bg-hover-bg",
              )}
              style={headerColor ? { color: headerTextColor } : undefined}
            >
              <PhX size={14} />
            </button>
          </div>
        </div>
        <div className="space-y-2 p-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localEntries.map((e) => e._id)}
              strategy={verticalListSortingStrategy}
            >
              {(() => {
                // PR-A — group-aware row sequence. Walk localEntries once, track
                // which group each entry belongs to, and emit an inline "+ Add
                // field" affordance at every group break (last field before a
                // group-header, or after the final field). The button's insert
                // position lands inside the *current* group at the break, so
                // "Genre 아래 (top-level)" stays top-level instead of leaking
                // into ADDITIONAL INFO. Inline buttons are intentionally
                // outside SortableContext items[] — only entry rows are
                // sortable.
                let currentGroup = ""
                const out: ReactNode[] = []
                for (let i = 0; i < localEntries.length; i++) {
                  const entry = localEntries[i]
                  if (entry.type === "group-header") {
                    currentGroup = entry.key
                    out.push(
                      <SortableWrapper key={entry._id} id={entry._id}>
                        <GroupHeaderEditRow
                          entry={entry}
                          onKeyChange={(v) => handleChange(i, "key", v)}
                          onColorChange={(c) => handleGroupColorChange(i, c)}
                          onToggleDefault={() => handleGroupDefaultCollapsedToggle(i)}
                          onRemove={() => handleRemove(i)}
                        />
                      </SortableWrapper>,
                    )
                  } else if (entry.type === "section") {
                    out.push(
                      <SortableWrapper key={entry._id} id={entry._id}>
                        <div className="flex items-start gap-2">
                          <input
                            value={entry.key}
                            onChange={(e) => handleChange(i, "key", e.target.value)}
                            placeholder="Section name"
                            className="flex-1 rounded border border-border bg-secondary/30 px-2 py-1 text-[calc(0.75em*var(--scale-infobox,1))] font-semibold uppercase tracking-wider text-foreground/80 outline-none focus:ring-1 focus:ring-ring"
                          />
                          <button
                            onClick={() => handleRemove(i)}
                            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="Remove section"
                          >
                            <PhX size={14} />
                          </button>
                        </div>
                      </SortableWrapper>,
                    )
                  } else {
                    out.push(
                      <SortableWrapper key={entry._id} id={entry._id}>
                        <div className="flex items-start gap-2">
                          <input
                            value={entry.key}
                            onChange={(e) => handleChange(i, "key", e.target.value)}
                            placeholder="Key"
                            className="w-[100px] shrink-0 rounded border border-border bg-background px-2 py-1 text-[calc(0.875em*var(--scale-infobox,1))] outline-none focus:ring-1 focus:ring-ring"
                          />
                          <input
                            value={entry.value}
                            onChange={(e) => handleChange(i, "value", e.target.value)}
                            placeholder="Value"
                            className="flex-1 rounded border border-border bg-background px-2 py-1 text-[calc(0.875em*var(--scale-infobox,1))] outline-none focus:ring-1 focus:ring-ring"
                          />
                          <button
                            onClick={() => handleRemove(i)}
                            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <PhX size={14} />
                          </button>
                        </div>
                      </SortableWrapper>,
                    )
                  }

                  const next = localEntries[i + 1]
                  const isGroupEnd = !next || next.type === "group-header"
                  if (isGroupEnd) {
                    const insertPos = i + 1
                    const label = currentGroup
                      ? `Add field to ${currentGroup}`
                      : "Add field"
                    out.push(
                      <button
                        key={`add-${i}`}
                        onClick={() => handleAdd(insertPos)}
                        className="flex items-center gap-1.5 pl-7 text-[calc(0.75em*var(--scale-infobox,1))] text-muted-foreground/70 hover:text-foreground transition-colors"
                      >
                        <PhPlus size={12} />
                        {label}
                      </button>,
                    )
                  }
                }
                return out
              })()}
            </SortableContext>
          </DndContext>

          {/* Empty-state fallback: no entries → still need a way to add the first field */}
          {localEntries.length === 0 && (
            <button
              onClick={() => handleAdd()}
              className="flex items-center gap-1.5 text-[calc(0.875em*var(--scale-infobox,1))] text-muted-foreground hover:text-foreground transition-colors"
            >
              <PhPlus size={14} />
              Add field
            </button>
          )}

          {/* Structural additions stay at the bottom — they reshape the layout
              rather than fill an existing region. */}
          <div className="flex items-center gap-4 pt-1 border-t border-border-subtle/40 mt-2">
            <button
              onClick={handleAddSection}
              className="flex items-center gap-1.5 text-[calc(0.875em*var(--scale-infobox,1))] text-muted-foreground hover:text-foreground transition-colors"
              title="Add section divider row"
            >
              <PhPlus size={14} />
              Add section
            </button>
            <button
              onClick={handleAddGroupHeader}
              className="flex items-center gap-1.5 text-[calc(0.875em*var(--scale-infobox,1))] text-muted-foreground hover:text-foreground transition-colors"
              title="Add collapsible group header"
            >
              <PhPlus size={14} />
              Add group
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Confirm modal also reachable from edit mode */}
      <AlertDialog
        open={pendingPreset !== null}
        onOpenChange={(open) => {
          if (!open) cancelPresetSwap()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Infobox Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Switch to{" "}
              <span className="font-semibold text-foreground">
                {pendingPreset ? getPresetDefinition(pendingPreset).label : ""}
              </span>{" "}
              preset.{" "}
              {pendingPreserveStats && pendingPreserveStats.total > 0 ? (
                <>
                  <span className="font-semibold text-foreground">
                    {pendingPreserveStats.preserved} of {pendingPreserveStats.total}
                  </span>{" "}
                  existing values match this preset&apos;s fields. Unsaved edits will also be lost.
                </>
              ) : (
                "Unsaved edits will also be lost."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPresetSwap}>Cancel</AlertDialogCancel>
            {pendingPreserveStats && pendingPreserveStats.preserved > 0 && (
              <AlertDialogAction
                onClick={() => {
                  preservePresetSwap()
                  setIsEditing(false)
                }}
              >
                Preserve matching ({pendingPreserveStats.preserved})
              </AlertDialogAction>
            )}
            <AlertDialogAction
              onClick={() => {
                confirmPresetSwap()
                setIsEditing(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Replace all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── Read-mode body ────────────────────────────────────────────────────────────
// Splits entries into rendered rows respecting group-header collapse state.

function ReadModeBody({
  entries,
  articleId,
}: {
  entries: WikiInfoboxEntry[]
  articleId: string
}) {
  const analyzed = useMemo(() => analyzeGroups(entries), [entries])

  return (
    <div className="divide-y divide-border">
      {analyzed.map(({ entry, groupKey }, i) => {
        if (entry.type === "section") {
          return (
            <div
              key={i}
              className="bg-secondary/40 px-3 py-1.5 text-[calc(0.75em*var(--scale-infobox,1))] font-semibold uppercase tracking-wider text-foreground/80"
            >
              {entry.key || "Section"}
            </div>
          )
        }
        if (entry.type === "group-header") {
          return (
            <GroupHeaderRow
              key={i}
              entry={entry}
              articleId={articleId}
              groupKey={groupKey}
              entries={entries}
            />
          )
        }
        // field row — render only if its group is not collapsed (or top-level)
        return (
          <FieldRow
            key={i}
            entry={entry}
            articleId={articleId}
            groupKey={groupKey}
            entries={entries}
          />
        )
      })}
    </div>
  )
}

// A field row — hidden when its parent group is collapsed.
function FieldRow({
  entry,
  articleId,
  groupKey,
  entries,
}: {
  entry: WikiInfoboxEntry
  articleId: string
  groupKey: string
  entries: WikiInfoboxEntry[]
}) {
  // Find the owning group-header (if any) to read its defaultCollapsed.
  const headerEntry = useMemo(() => {
    if (!groupKey) return null
    return entries.find((e) => e.type === "group-header" && e.key === groupKey) ?? null
  }, [groupKey, entries])

  const [collapsed] = useInfoboxGroupCollapsed(
    articleId,
    groupKey,
    headerEntry?.defaultCollapsed ?? false,
  )

  if (groupKey && collapsed) return null

  return (
    <div className="flex gap-3 px-3 py-2">
      <span className="shrink-0 text-[calc(0.875em*var(--scale-infobox,1))] font-medium text-muted-foreground min-w-[80px]">
        {entry.key}
      </span>
      <InfoboxValueRenderer
        text={entry.value}
        className="text-[calc(0.875em*var(--scale-infobox,1))] text-foreground break-words"
      />
    </div>
  )
}

// Group-header row in read mode — clickable, chevron + label + optional color.
function GroupHeaderRow({
  entry,
  articleId,
  groupKey,
  entries,
}: {
  entry: WikiInfoboxEntry
  articleId: string
  groupKey: string
  entries: WikiInfoboxEntry[]
}) {
  // Count children in the group for affordance.
  const childCount = useMemo(() => {
    let count = 0
    let inGroup = false
    for (const e of entries) {
      if (e.type === "group-header") {
        if (inGroup) break
        if (e.key === entry.key) {
          inGroup = true
          continue
        }
      } else if (inGroup) {
        count++
      }
    }
    return count
  }, [entries, entry.key])

  const [collapsed, toggle] = useInfoboxGroupCollapsed(
    articleId,
    groupKey,
    entry.defaultCollapsed ?? false,
  )

  const customColor = entry.color ?? null
  const renderedColor = useTintedBg(customColor)

  return (
    <button
      type="button"
      onClick={() => toggle()}
      className={cn(
        "flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[calc(0.75em*var(--scale-infobox,1))] font-semibold uppercase tracking-wider transition-colors",
        !customColor && "bg-secondary/40 text-foreground/80 hover:bg-secondary/55",
        customColor && "text-foreground/90 hover:brightness-110",
      )}
      style={renderedColor ? { backgroundColor: renderedColor } : undefined}
    >
      {collapsed ? <CaretRight size={11} /> : <CaretDown size={11} />}
      <span className="flex-1 truncate">{entry.key || "Group"}</span>
      {childCount > 0 && (
        <span className="text-[0.9em] font-normal text-muted-foreground/70 normal-case tracking-normal">
          {childCount}
        </span>
      )}
    </button>
  )
}

// Group-header edit row — key input + color picker + default-collapsed toggle.
function GroupHeaderEditRow({
  entry,
  onKeyChange,
  onColorChange,
  onToggleDefault,
  onRemove,
}: {
  entry: WikiInfoboxEntry
  onKeyChange: (v: string) => void
  onColorChange: (c: string | null) => void
  onToggleDefault: () => void
  onRemove: () => void
}) {
  const [showColor, setShowColor] = useState(false)
  const customColor = entry.color ?? null
  const renderedColor = useTintedBg(customColor)
  const defaultCollapsed = entry.defaultCollapsed ?? false

  return (
    <div className="relative flex items-start gap-2">
      <div
        className={cn(
          "flex-1 flex items-center gap-1.5 rounded border px-2 py-1",
          customColor ? "border-transparent" : "border-border bg-secondary/30",
        )}
        style={renderedColor ? { backgroundColor: renderedColor, borderColor: renderedColor } : undefined}
      >
        <CaretDown size={11} className="text-muted-foreground/70 shrink-0" />
        <input
          value={entry.key}
          onChange={(e) => onKeyChange(e.target.value)}
          placeholder="Group name"
          className="flex-1 bg-transparent text-[calc(0.75em*var(--scale-infobox,1))] font-semibold uppercase tracking-wider text-foreground/90 outline-none placeholder:text-muted-foreground/70"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setShowColor((v) => !v)
          }}
          title="Group color"
          className={cn(
            "shrink-0 rounded p-0.5 transition-colors",
            showColor || customColor
              ? "text-foreground"
              : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg",
          )}
        >
          <PaintBucket size={11} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleDefault()
          }}
          title={defaultCollapsed ? "Default collapsed" : "Default expanded"}
          className={cn(
            "shrink-0 rounded p-0.5 transition-colors",
            defaultCollapsed
              ? "text-foreground"
              : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg",
          )}
        >
          {defaultCollapsed ? <CaretRight size={11} /> : <CaretDown size={11} />}
        </button>
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        title="Remove group"
      >
        <PhX size={14} />
      </button>

      {showColor && (
        <div className="absolute right-10 top-[calc(100%+4px)] z-20">
          <InfoboxColorPicker
            value={customColor ?? null}
            onChange={(v) => {
              onColorChange(v)
              setShowColor(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

// ── Preset Dropdown ───────────────────────────────────────────────────────────
function PresetDropdown({
  current,
  open,
  onToggle,
  onPick,
  compact = false,
  inverted = false,
}: {
  current: WikiInfoboxPreset
  open: boolean
  onToggle: () => void
  onPick: (preset: WikiInfoboxPreset) => void
  compact?: boolean
  inverted?: boolean
}) {
  const def = getPresetDefinition(current)
  const triggerRef = useRef<HTMLButtonElement>(null)
  // 2026-05-18: dropdown menu를 createPortal로 document.body에 mount하고
  // fixed positioning으로 그림 — parent의 `overflow-hidden`(line ~298)
  // 영향을 받지 않고 전체 preset list (현재 17개) 표시 가능. viewport
  // bottom 공간 부족 시 위로 flip + max-height + scroll. 사용자 시각
  // 신호 (2026-05-18 dropdown clip 보고).
  const [menuPos, setMenuPos] = useState<{ top: number; right: number; placement: "bottom" | "top" } | null>(null)
  const MENU_WIDTH = 220
  const MENU_MAX_HEIGHT = 440

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuPos(null)
      return
    }
    const rect = triggerRef.current.getBoundingClientRect()
    const vh = window.innerHeight
    const spaceBelow = vh - rect.bottom
    const spaceAbove = rect.top
    // Below 공간이 menu 전체 + 16px gap 못 담고 위가 더 크면 flip
    const wantsHeight = Math.min(MENU_MAX_HEIGHT, vh - 32)
    const placement: "bottom" | "top" =
      spaceBelow < wantsHeight + 16 && spaceAbove > spaceBelow ? "top" : "bottom"
    setMenuPos({
      top: placement === "bottom" ? rect.bottom + 4 : Math.max(8, rect.top - wantsHeight - 4),
      right: window.innerWidth - rect.right,
      placement,
    })
  }, [open])

  // ESC + viewport resize 시 재계산/close
  useEffect(() => {
    if (!open) return
    const onResize = () => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const vh = window.innerHeight
      const spaceBelow = vh - rect.bottom
      const spaceAbove = rect.top
      const wantsHeight = Math.min(MENU_MAX_HEIGHT, vh - 32)
      const placement: "bottom" | "top" =
        spaceBelow < wantsHeight + 16 && spaceAbove > spaceBelow ? "top" : "bottom"
      setMenuPos({
        top: placement === "bottom" ? rect.bottom + 4 : Math.max(8, rect.top - wantsHeight - 4),
        right: window.innerWidth - rect.right,
        placement,
      })
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggle()
    }
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onResize, true)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onResize, true)
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onToggle])

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={cn(
          "flex items-center gap-1 rounded transition-colors",
          compact
            ? "px-1.5 py-0.5 text-[0.7em]"
            : "px-2 py-1 text-[calc(0.875em*var(--scale-infobox,1))]",
          inverted
            ? "text-white/85 hover:bg-white/10"
            : "text-muted-foreground hover:bg-hover-bg hover:text-foreground",
        )}
        title="Infobox preset"
      >
        <span className={compact ? "max-w-[80px] truncate" : ""}>{def.label}</span>
        <CaretDown size={10} />
      </button>
      {open && menuPos && typeof document !== "undefined" && createPortal(
        <>
          {/* click-outside guard */}
          <div
            className="fixed inset-0 z-[60]"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
          />
          <div
            className="fixed z-[61] overflow-y-auto rounded-md border border-border bg-popover p-1.5 shadow-lg"
            style={{
              top: menuPos.top,
              right: menuPos.right,
              minWidth: `${MENU_WIDTH}px`,
              maxHeight: `${MENU_MAX_HEIGHT}px`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {INFOBOX_PRESETS.map((p) => {
              const isActive = p.preset === current
              return (
                <button
                  key={p.preset}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPick(p.preset)
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    isActive
                      ? "bg-secondary/60 text-foreground font-medium"
                      : "text-foreground/85 hover:bg-hover-bg hover:text-foreground",
                  )}
                >
                  <span className="truncate">{p.label}</span>
                  {p.defaultHeaderColor && (
                    <span
                      className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/5 dark:ring-white/10"
                      style={{ backgroundColor: p.defaultHeaderColor }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </>,
        document.body,
      )}
    </div>
  )
}
