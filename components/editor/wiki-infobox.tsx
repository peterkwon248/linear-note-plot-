"use client"

import { useState, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import type { WikiInfoboxEntry } from "@/lib/types"
import { cn } from "@/lib/utils"
import { InfoboxValueRenderer } from "./infobox-value-renderer"
import {
  Plus as PhPlus,
  X as PhX,
  PencilSimple,
  Check as PhCheck,
  PaintBucket,
} from "@/lib/editor/editor-icons"

// Tier 1-2: Header color presets — shared shape with infobox-node.tsx (TipTap 노드와 동일 프리셋)
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

function hexToRgba(hex: string, alpha = 0.35): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return `rgba(${r},${g},${b},${alpha})`
}

interface WikiInfoboxProps {
  /** Entity ID — Note id when entityType="note", WikiArticle id when entityType="wiki". */
  noteId: string
  /**
   * Which slice owns this infobox. Phase 1 fix: previously hardcoded to Note slice
   * which silently failed when a WikiArticle id was passed. Default "note" for
   * backwards compat (note-editor.tsx still works without changes).
   *
   * Phase 2-2-C: wiki articles now pipe entries/headerColor via `onEntriesChange`/
   * `onHeaderColorChange` (block-scoped). When `onEntriesChange` is provided the
   * component skips the legacy store-dispatch path entirely.
   */
  entityType?: "note" | "wiki"
  entries: WikiInfoboxEntry[]
  editable?: boolean
  className?: string
  /** Tier 1-2: Header background color (null/undefined = default bg-secondary/30). */
  headerColor?: string | null
  /** Tier 1-2: Callback when header color changes. If omitted, the color picker is hidden. */
  onHeaderColorChange?: (color: string | null) => void
  /**
   * Phase 2-2-C: When provided, entry mutations call this instead of the store
   * action. Used by block-wrapped infoboxes where state lives on `WikiBlock.fields`.
   */
  onEntriesChange?: (entries: WikiInfoboxEntry[]) => void
  /**
   * Phase 3.1-B: Extra action slot rendered at the right end of the header,
   * after the color/edit buttons. Used by wiki-infobox-block wrapper to inject
   * the ⋯ block-actions menu without overlapping the existing buttons.
   */
  headerExtraActions?: React.ReactNode
}

export function WikiInfobox({
  noteId,
  entityType = "note",
  entries,
  editable = false,
  className,
  headerColor = null,
  onHeaderColorChange,
  onEntriesChange,
  headerExtraActions,
}: WikiInfoboxProps) {
  const setWikiInfobox = usePlotStore((s) => s.setWikiInfobox)
  const [isEditing, setIsEditing] = useState(false)
  const [localEntries, setLocalEntries] = useState<WikiInfoboxEntry[]>(entries)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const canChangeColor = editable && typeof onHeaderColorChange === "function"

  const handleStartEdit = useCallback(() => {
    setLocalEntries([...entries])
    setIsEditing(true)
  }, [entries])

  const handleSave = useCallback(() => {
    const cleaned = localEntries.filter((e) => e.key.trim() !== "")
    // Phase 2-2-C: block-wrapped wiki callers route via `onEntriesChange`.
    // Note-entity callers still persist via `setWikiInfobox` (unchanged).
    if (onEntriesChange) {
      onEntriesChange(cleaned)
    } else if (entityType === "note") {
      setWikiInfobox(noteId, cleaned)
    }
    // entityType === "wiki" without onEntriesChange is a bug post-Phase 2-2-C —
    // wiki entries must go through the block wrapper. Silently no-op to avoid
    // corrupting state.
    setIsEditing(false)
  }, [noteId, entityType, localEntries, setWikiInfobox, onEntriesChange])

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

  const handleRemove = useCallback((index: number) => {
    setLocalEntries((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleChange = useCallback((index: number, field: "key" | "value", val: string) => {
    setLocalEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: val } : entry)),
    )
  }, [])

  // Nothing to show and not editable
  if (entries.length === 0 && !editable) return null

  // Display mode
  if (!isEditing) {
    if (entries.length === 0 && editable) {
      return (
        <div className={cn("rounded-lg border border-dashed border-border p-3", className)}>
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 text-note text-muted-foreground hover:text-foreground transition-colors"
          >
            <PhPlus size={14} />
            Add infobox
          </button>
        </div>
      )
    }

    return (
      <div className={cn("group/infobox rounded-lg border border-border bg-card/50 overflow-hidden", className)}>
        <div
          className={cn(
            "relative flex items-center justify-between border-b border-border px-3 py-2",
            !headerColor && "bg-secondary/30",
          )}
          style={headerColor ? { backgroundColor: headerColor } : undefined}
        >
          <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            Info
          </span>
          {editable && (
            <div className="flex items-center gap-0.5">
              {canChangeColor && (
                <button
                  onClick={() => setShowColorPicker((v) => !v)}
                  title="Header color"
                  className={cn(
                    "rounded p-0.5 transition-colors shrink-0",
                    showColorPicker || headerColor
                      ? "text-foreground"
                      : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg opacity-0 group-hover/infobox:opacity-100",
                  )}
                >
                  <PaintBucket size={12} />
                </button>
              )}
              <button
                onClick={handleStartEdit}
                className="rounded p-0.5 text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
                title="Edit infobox"
              >
                <PencilSimple size={12} />
              </button>
              {headerExtraActions}
            </div>
          )}
          {!editable && headerExtraActions && (
            <div className="flex items-center gap-0.5">{headerExtraActions}</div>
          )}

          {canChangeColor && showColorPicker && (
            <div
              className="absolute right-2 top-[calc(100%+4px)] z-10 flex items-center gap-1 rounded-md border border-border-subtle bg-popover p-1.5 shadow-md"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {HEADER_COLOR_PRESETS.map((preset) => {
                const isActive = (headerColor ?? null) === preset.value
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      onHeaderColorChange?.(preset.value)
                      setShowColorPicker(false)
                    }}
                    title={preset.label}
                    className={cn(
                      "h-5 w-5 rounded-sm border transition-transform hover:scale-110",
                      isActive ? "border-foreground ring-1 ring-foreground" : "border-border-subtle",
                    )}
                    style={{ backgroundColor: preset.swatch }}
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
        <div className="divide-y divide-border">
          {entries.map((entry, i) =>
            entry.type === "section" ? (
              // Tier 1-4: Section divider row — full width, bold label, tinted bg, value hidden
              <div
                key={i}
                className="bg-secondary/40 px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-foreground/80"
              >
                {entry.key || "Section"}
              </div>
            ) : (
              <div key={i} className="flex gap-3 px-3 py-2">
                <span className="shrink-0 text-note font-medium text-muted-foreground min-w-[80px]">
                  {entry.key}
                </span>
                <InfoboxValueRenderer
                  text={entry.value}
                  className="text-note text-foreground break-words"
                />
              </div>
            ),
          )}
        </div>
      </div>
    )
  }

  // Edit mode
  return (
    <div className={cn("rounded-lg border border-primary/30 bg-card/50 overflow-hidden", className)}>
      <div
        className={cn(
          "flex items-center justify-between border-b border-border px-3 py-2",
          !headerColor && "bg-secondary/30",
        )}
        style={headerColor ? { backgroundColor: headerColor } : undefined}
      >
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          Edit Infobox
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="rounded p-1 text-green-500 hover:bg-green-500/10 transition-colors"
          >
            <PhCheck size={14} />
          </button>
          <button
            onClick={handleCancel}
            className="rounded p-1 text-muted-foreground hover:bg-hover-bg transition-colors"
          >
            <PhX size={14} />
          </button>
        </div>
      </div>
      <div className="space-y-2 p-3">
        {localEntries.map((entry, i) =>
          entry.type === "section" ? (
            // Tier 1-4: Section row editor — single wide input, bold
            <div key={i} className="flex items-start gap-2">
              <input
                value={entry.key}
                onChange={(e) => handleChange(i, "key", e.target.value)}
                placeholder="Section name"
                className="flex-1 rounded border border-border bg-secondary/30 px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-foreground/80 outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={() => handleRemove(i)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Remove section"
              >
                <PhX size={14} />
              </button>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-2">
              <input
                value={entry.key}
                onChange={(e) => handleChange(i, "key", e.target.value)}
                placeholder="Key"
                className="w-[100px] shrink-0 rounded border border-border bg-background px-2 py-1 text-note outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                value={entry.value}
                onChange={(e) => handleChange(i, "value", e.target.value)}
                placeholder="Value"
                className="flex-1 rounded border border-border bg-background px-2 py-1 text-note outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={() => handleRemove(i)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <PhX size={14} />
              </button>
            </div>
          ),
        )}
        <div className="flex items-center gap-4">
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 text-note text-muted-foreground hover:text-foreground transition-colors"
          >
            <PhPlus size={14} />
            Add field
          </button>
          <button
            onClick={handleAddSection}
            className="flex items-center gap-1.5 text-note text-muted-foreground hover:text-foreground transition-colors"
            title="Add section divider row"
          >
            <PhPlus size={14} />
            Add section
          </button>
        </div>
      </div>
    </div>
  )
}
