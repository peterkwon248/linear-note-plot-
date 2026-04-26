"use client"

import { useCallback, useMemo, useState } from "react"
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
} from "@/lib/editor/editor-icons"
import {
  INFOBOX_PRESETS,
  clonePresetEntries,
  getPresetDefinition,
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

// ── Header color presets (existing — unchanged) ───────────────────────────────
interface HeaderColorPreset {
  label: string
  value: string | null
  swatch: string
}

const HEADER_COLOR_PRESETS: HeaderColorPreset[] = [
  { label: "Default", value: null, swatch: "rgba(148,163,184,0.25)" },
  { label: "Blue", value: "rgba(59,130,246,0.35)", swatch: "rgba(59,130,246,0.35)" },
  { label: "Red", value: "rgba(239,68,68,0.35)", swatch: "rgba(239,68,68,0.35)" },
  { label: "Green", value: "rgba(34,197,94,0.35)", swatch: "rgba(34,197,94,0.35)" },
  { label: "Yellow", value: "rgba(234,179,8,0.35)", swatch: "rgba(234,179,8,0.35)" },
  { label: "Orange", value: "rgba(249,115,22,0.35)", swatch: "rgba(249,115,22,0.35)" },
  { label: "Purple", value: "rgba(168,85,247,0.35)", swatch: "rgba(168,85,247,0.35)" },
  { label: "Pink", value: "rgba(236,72,153,0.35)", swatch: "rgba(236,72,153,0.35)" },
]

// Group-header color picker reuses the same alpha-0.35 palette but with a
// noticeably stronger default label so it reads as a "section accent".
const GROUP_HEADER_COLOR_PRESETS = HEADER_COLOR_PRESETS

function hexToRgba(hex: string, alpha = 0.35): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return `rgba(${r},${g},${b},${alpha})`
}

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
}: WikiInfoboxProps) {
  const setWikiInfoboxNote = usePlotStore((s) => s.setWikiInfobox)
  const setWikiArticleInfobox = usePlotStore((s) => s.setWikiArticleInfobox)
  const [isEditing, setIsEditing] = useState(false)
  const [localEntries, setLocalEntries] = useState<WikiInfoboxEntry[]>(entries)
  const [showColorPicker, setShowColorPicker] = useState(false)
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
    setLocalEntries([...entries])
    setIsEditing(true)
  }, [entries])

  const handleSave = useCallback(() => {
    // group-header rows keep value="" and don't need key trim filter
    const cleaned = localEntries.filter((e) => {
      if (e.type === "group-header") return (e.key ?? "").trim() !== ""
      return e.key.trim() !== ""
    })
    persistEntries(cleaned)
    setIsEditing(false)
  }, [persistEntries, localEntries])

  const handleCancel = useCallback(() => {
    setLocalEntries([...entries])
    setIsEditing(false)
  }, [entries])

  const handleAdd = useCallback(() => {
    setLocalEntries((prev) => [...prev, { key: "", value: "", type: "field" }])
  }, [])

  const handleAddSection = useCallback(() => {
    setLocalEntries((prev) => [...prev, { key: "", value: "", type: "section" }])
  }, [])

  const handleAddGroupHeader = useCallback(() => {
    setLocalEntries((prev) => [
      ...prev,
      { key: "", value: "", type: "group-header", color: null, defaultCollapsed: false },
    ])
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

  const cancelPresetSwap = useCallback(() => setPendingPreset(null), [])

  // Nothing to show and not editable
  if (entries.length === 0 && !editable) return null

  // Display mode
  if (!isEditing) {
    if (entries.length === 0 && editable) {
      return (
        <div className={cn("rounded-lg border border-dashed border-border p-3", className)}>
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 text-[0.875em] text-muted-foreground hover:text-foreground transition-colors"
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
            style={headerColor ? { backgroundColor: headerColor } : undefined}
          >
            <span
              className={cn(
                "text-[0.75em] font-semibold uppercase tracking-wider",
                headerColor ? "text-white/85" : "text-muted-foreground",
              )}
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
                          ? "text-white/85 hover:bg-white/10"
                          : "text-foreground"
                        : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg opacity-0 group-hover/infobox:opacity-100",
                    )}
                  >
                    <PaintBucket size={12} />
                  </button>
                )}
                <button
                  onClick={handleStartEdit}
                  className={cn(
                    "rounded p-0.5 transition-colors",
                    headerColor
                      ? "text-white/70 hover:text-white hover:bg-white/10"
                      : "text-muted-foreground hover:bg-hover-bg hover:text-foreground",
                  )}
                  title="Edit infobox"
                >
                  <PencilSimple size={12} />
                </button>
              </div>
            )}

            {canChangeColor && showColorPicker && (
              <div
                className="absolute right-2 top-[calc(100%+4px)] z-10 flex items-center gap-1 rounded-md border border-border-subtle bg-popover p-1.5 shadow-md"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {HEADER_COLOR_PRESETS.map((p) => {
                  const isActive = (headerColor ?? null) === p.value
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        onHeaderColorChange?.(p.value)
                        setShowColorPicker(false)
                      }}
                      title={p.label}
                      className={cn(
                        "h-5 w-5 rounded-sm border transition-transform hover:scale-110",
                        isActive
                          ? "border-foreground ring-1 ring-foreground"
                          : "border-border-subtle",
                      )}
                      style={{ backgroundColor: p.swatch }}
                    />
                  )
                })}
                <div className="mx-1 h-4 w-px bg-border-subtle" />
                <label
                  className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm border border-border-subtle bg-gradient-to-br from-red-400 via-yellow-300 to-blue-400 hover:scale-110 transition-transform"
                  title="Custom color"
                >
                  <input
                    type="color"
                    value={headerColor && /^#/.test(headerColor) ? headerColor : "#3b82f6"}
                    onChange={(e) => onHeaderColorChange?.(hexToRgba(e.target.value))}
                    className="pointer-events-none h-0 w-0 opacity-0"
                  />
                </label>
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
              <AlertDialogTitle>인포박스 프리셋 변경</AlertDialogTitle>
              <AlertDialogDescription>
                기존 필드를 모두 삭제하고{" "}
                <span className="font-semibold text-foreground">
                  {pendingPreset ? getPresetDefinition(pendingPreset).label : ""}
                </span>{" "}
                프리셋으로 교체합니다. 이 동작은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelPresetSwap}>취소</AlertDialogCancel>
              <AlertDialogAction onClick={confirmPresetSwap}>교체</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={cn(
          "rounded-lg border border-primary/30 bg-card/50 overflow-hidden",
          className,
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between border-b border-border px-3 py-2",
            !headerColor && "bg-secondary/30",
          )}
          style={headerColor ? { backgroundColor: headerColor } : undefined}
        >
          <span
            className={cn(
              "text-[0.75em] font-semibold uppercase tracking-wider",
              headerColor ? "text-white/85" : "text-muted-foreground",
            )}
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
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-muted-foreground hover:bg-hover-bg",
              )}
            >
              <PhX size={14} />
            </button>
          </div>
        </div>
        <div className="space-y-2 p-3">
          {localEntries.map((entry, i) => {
            if (entry.type === "section") {
              return (
                <div key={i} className="flex items-start gap-2">
                  <input
                    value={entry.key}
                    onChange={(e) => handleChange(i, "key", e.target.value)}
                    placeholder="Section name"
                    className="flex-1 rounded border border-border bg-secondary/30 px-2 py-1 text-[0.75em] font-semibold uppercase tracking-wider text-foreground/80 outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    onClick={() => handleRemove(i)}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Remove section"
                  >
                    <PhX size={14} />
                  </button>
                </div>
              )
            }

            if (entry.type === "group-header") {
              return (
                <GroupHeaderEditRow
                  key={i}
                  entry={entry}
                  onKeyChange={(v) => handleChange(i, "key", v)}
                  onColorChange={(c) => handleGroupColorChange(i, c)}
                  onToggleDefault={() => handleGroupDefaultCollapsedToggle(i)}
                  onRemove={() => handleRemove(i)}
                />
              )
            }

            return (
              <div key={i} className="flex items-start gap-2">
                <input
                  value={entry.key}
                  onChange={(e) => handleChange(i, "key", e.target.value)}
                  placeholder="Key"
                  className="w-[100px] shrink-0 rounded border border-border bg-background px-2 py-1 text-[0.875em] outline-none focus:ring-1 focus:ring-ring"
                />
                <input
                  value={entry.value}
                  onChange={(e) => handleChange(i, "value", e.target.value)}
                  placeholder="Value"
                  className="flex-1 rounded border border-border bg-background px-2 py-1 text-[0.875em] outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={() => handleRemove(i)}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <PhX size={14} />
                </button>
              </div>
            )
          })}
          <div className="flex items-center gap-4">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 text-[0.875em] text-muted-foreground hover:text-foreground transition-colors"
            >
              <PhPlus size={14} />
              Add field
            </button>
            <button
              onClick={handleAddSection}
              className="flex items-center gap-1.5 text-[0.875em] text-muted-foreground hover:text-foreground transition-colors"
              title="Add section divider row"
            >
              <PhPlus size={14} />
              Add section
            </button>
            <button
              onClick={handleAddGroupHeader}
              className="flex items-center gap-1.5 text-[0.875em] text-muted-foreground hover:text-foreground transition-colors"
              title="Add collapsible group header"
            >
              <PhPlus size={14} />
              Add group
            </button>
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
            <AlertDialogTitle>인포박스 프리셋 변경</AlertDialogTitle>
            <AlertDialogDescription>
              기존 필드를 모두 삭제하고{" "}
              <span className="font-semibold text-foreground">
                {pendingPreset ? getPresetDefinition(pendingPreset).label : ""}
              </span>{" "}
              프리셋으로 교체합니다. 편집 중인 변경 사항도 함께 사라집니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPresetSwap}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmPresetSwap()
                setIsEditing(false)
              }}
            >
              교체
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
              className="bg-secondary/40 px-3 py-1.5 text-[0.75em] font-semibold uppercase tracking-wider text-foreground/80"
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
      <span className="shrink-0 text-[0.875em] font-medium text-muted-foreground min-w-[80px]">
        {entry.key}
      </span>
      <InfoboxValueRenderer
        text={entry.value}
        className="text-[0.875em] text-foreground break-words"
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

  return (
    <button
      type="button"
      onClick={() => toggle()}
      className={cn(
        "flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[0.75em] font-semibold uppercase tracking-wider transition-colors",
        !customColor && "bg-secondary/40 text-foreground/80 hover:bg-secondary/55",
        customColor && "text-foreground/90 hover:brightness-110",
      )}
      style={customColor ? { backgroundColor: customColor } : undefined}
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
  const defaultCollapsed = entry.defaultCollapsed ?? false

  return (
    <div className="relative flex items-start gap-2">
      <div
        className={cn(
          "flex-1 flex items-center gap-1.5 rounded border px-2 py-1",
          customColor ? "border-transparent" : "border-border bg-secondary/30",
        )}
        style={customColor ? { backgroundColor: customColor, borderColor: customColor } : undefined}
      >
        <CaretDown size={11} className="text-muted-foreground/70 shrink-0" />
        <input
          value={entry.key}
          onChange={(e) => onKeyChange(e.target.value)}
          placeholder="Group name"
          className="flex-1 bg-transparent text-[0.75em] font-semibold uppercase tracking-wider text-foreground/90 outline-none placeholder:text-muted-foreground/40"
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
        <div
          className="absolute right-10 top-[calc(100%+4px)] z-20 flex items-center gap-1 rounded-md border border-border-subtle bg-popover p-1.5 shadow-md"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {GROUP_HEADER_COLOR_PRESETS.map((p) => {
            const isActive = customColor === p.value
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onColorChange(p.value)
                  setShowColor(false)
                }}
                title={p.label}
                className={cn(
                  "h-5 w-5 rounded-sm border transition-transform hover:scale-110",
                  isActive ? "border-foreground ring-1 ring-foreground" : "border-border-subtle",
                )}
                style={{ backgroundColor: p.swatch }}
              />
            )
          })}
          <div className="mx-1 h-4 w-px bg-border-subtle" />
          <label
            className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm border border-border-subtle bg-gradient-to-br from-red-400 via-yellow-300 to-blue-400 hover:scale-110 transition-transform"
            title="Custom color"
          >
            <input
              type="color"
              value={customColor && /^#/.test(customColor) ? customColor : "#3b82f6"}
              onChange={(e) => onColorChange(hexToRgba(e.target.value))}
              className="pointer-events-none h-0 w-0 opacity-0"
            />
          </label>
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
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={cn(
          "flex items-center gap-1 rounded transition-colors",
          compact
            ? "px-1.5 py-0.5 text-[0.7em]"
            : "px-2 py-1 text-[0.875em]",
          inverted
            ? "text-white/85 hover:bg-white/10"
            : "text-muted-foreground hover:bg-hover-bg hover:text-foreground",
        )}
        title="Infobox preset"
      >
        <span className={compact ? "max-w-[80px] truncate" : ""}>{def.label}</span>
        <CaretDown size={10} />
      </button>
      {open && (
        <>
          {/* click-outside guard */}
          <div
            className="fixed inset-0 z-30"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
          />
          <div
            className="absolute right-0 top-[calc(100%+4px)] z-40 min-w-[180px] rounded-md border border-border-subtle bg-popover p-1 shadow-md"
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
                    "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-[0.8125em] transition-colors",
                    isActive
                      ? "bg-secondary/60 text-foreground"
                      : "text-foreground/80 hover:bg-hover-bg hover:text-foreground",
                  )}
                >
                  <span className="truncate">{p.label}</span>
                  {p.defaultHeaderColor && (
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-border-subtle"
                      style={{ backgroundColor: p.defaultHeaderColor }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
